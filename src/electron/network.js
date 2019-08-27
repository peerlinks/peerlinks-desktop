import { Buffer } from 'buffer';

import VowLink, { Message } from '@vowlink/protocol';
import SqliteStorage from '@vowlink/sqlite-storage';
import Swarm from '@vowlink/swarm';

import log from 'electron-log';
import * as sodium from 'sodium-universal';
import WaitList from 'promise-waitlist';
import * as bs58 from 'bs58';

const INVITE_TIMEOUT = 15 * 60 * 1000; // 15 minutes

export default class Network {
  constructor(ipc, options = {}) {
    this.ipc = ipc;
    this.options = options;
    if (!this.options.db) {
      throw new Error('Missing `options.db`');
    }

    this.storage = null;
    this.vowLink = null;
    this.swarm = null;

    this.waitList = new WaitList();

    // Map<Channel, WaitList.Entry>
    this.updateLoops = new WeakMap();

    // WeakSet<Channel>
    this.updatedChannels = new WeakSet();

    // Map<identityKey, Function>
    this.pendingInvites = new Map();

    this.ready = false;

    this.initIPC();
  }

  async init() {
    this.storage = new SqliteStorage({ file: this.options.db });
    await this.storage.open();

    this.vowLink = await this.waitList.waitFor('init').promise;
    for (const channel of this.vowLink.channels) {
      this.runUpdateLoop(channel);
    }

    this.swarm = new Swarm(this.vowLink);
    this.waitList.resolve('ready');
    this.ready = true;
  }

  initIPC() {
    const ipc = this.ipc;

    const handle = (type, handler, requireReady = true) => {
      ipc.on(`network:${type}`, (event, { seq, payload }) => {
        log.info(`network: got ${type}`);

        if (!this.ready && requireReady) {
          log.info(`network: not ready to "${type}" seq=${seq}`);
          return event.reply('response', { seq, error: 'Not ready' });
        }

        handler(payload).then((result) => {
          log.info(`network: responding to "${type}" seq=${seq}`);
          event.reply('response', { seq, payload: result });
        }).catch((err) => {
          log.info(`network: error to "${type}" seq=${seq}`);
          event.reply('response',
            { seq, error: err.message, stack: err.stack });
        });
      });
    };

    handle('init', async ({ passphrase }) => {
      if (this.ready) {
        return;
      }

      const vowLink = new VowLink({
        sodium,
        storage: this.storage,
        passphrase,
      });
      if (!await vowLink.load()) {
        throw new Error('Invalid passphrase');
      }

      this.waitList.resolve('init', vowLink);

      await this.waitList.waitFor('ready').promise;
    }, false);

    handle('isReady', async () => {
      return this.ready;
    }, false);

    handle('getChannels', async () => {
      return await Promise.all(this.vowLink.channels.map(async (channel) => {
        return await this.serializeChannel(channel);
      }));
    });

    handle('getIdentities', async () => {
      return this.vowLink.identities.map((identity) => {
        return this.serializeIdentity(identity);
      });
    });

    handle('createIdentityPair', async ({ name }) => {
      const [ identity, channel ] = await this.vowLink.createIdentityPair(name);
      this.runUpdateLoop(channel);

      return {
        identity: this.serializeIdentity(identity),
        channel: await this.serializeChannel(channel),
      };
    });

    handle('channelFromPublicKey', async ({ publicKey, name }) => {
      try {
        publicKey = bs58.decode(publicKey);
      } catch (e) {
        throw new Error('Invalid encoding of publicKey');
      }

      log.info(`creating channel from public key=${publicKey.toString('hex')}`);
      const channel = await this.vowLink.channelFromPublicKey(
        publicKey,
        { name });

      const metadata = channel.getMetadata();
      if (!metadata || metadata.isFeed !== false) {
        channel.setMetadata({
          ...channel.metadata,
          isFeed: true,
        });
        await this.vowLink.saveChannel(channel);
      }

      this.swarm.joinChannel(channel);
      this.runUpdateLoop(channel);

      return await this.serializeChannel(channel);
    });

    const channelById = (id) => {
      id = Buffer.from(id, 'hex');
      return this.vowLink.channels.find((channel) => {
        return channel.id.equals(id);
      });
    };

    const identityByKey = (key) => {
      key = Buffer.from(key, 'hex');
      return this.vowLink.identities.find((identity) => {
        return identity.publicKey.equals(key);
      });
    };

    handle('removeIdentityPair', async ({ channelId, identityKey }) => {
      const channel = channelById(channelId);
      if (channel) {
        await this.vowLink.removeChannel(channel);
      }

      const identity = identityByKey(identityKey);
      if (identity) {
        await this.vowLink.removeIdentity(identity);
      }

      this.waitList.resolve('update:' + channel.id.toString('hex'), false);

      // Cancel pending invites
      if (this.pendingInvites.has(identityKey)) {
        const pending = this.pendingInvites.get(identityKey);
        if (pending.waiter) {
          pending.waiter.cancel();
        }
      }
    });

    handle('updateChannelMetadata', async ({ channelId, metadata }) => {
      const channel = channelById(channelId);
      if (!channel) {
        throw new Error('Channel not found: ' + channelId);
      }

      channel.setMetadata({
        ...channel.metadata,
        ...metadata,
      });
      await this.vowLink.saveChannel(channel);
    });

    handle('getMessageCount', async ({ channelId }) => {
      const channel = channelById(channelId);
      if (!channel) {
        throw new Error('Channel not found: ' + channelId);
      }

      return await channel.getMessageCount();
    });

    handle('getReverseMessagesAtOffset', async ({ channelId, offset, limit }) => {
      const channel = channelById(channelId);
      if (!channel) {
        throw new Error('Channel not found: ' + channelId);
      }

      const messages = await channel.getReverseMessagesAtOffset(offset, limit);
      return messages.map((message) => {
        return this.serializeMessage(message);
      });
    });

    handle('waitForIncomingMessage', async ({ channelId, timeout }) => {
      const channel = channelById(channelId);
      if (!channel) {
        throw new Error('Channel not found: ' + channelId);
      }

      // We might have been already updated between `waitForIncomingMessage`
      // calls.
      if (this.updatedChannels.has(channel)) {
        this.updatedChannels.delete(channel);
        log.info(`network: waitForIncomingMessage ${channelId} ... immediate`);
        return true;
      }

      // Otherwise - wait
      log.info(`network: waitForIncomingMessage ${channelId} ... wait`);
      const entry = this.waitList.waitFor(
        'update:' + channelId.toString('hex'), timeout);
      const isAlive = await entry.promise;
      this.updatedChannels.delete(channel);
      return isAlive;
    });

    handle('postMessage', async ({ channelId, identityKey, json }) => {
      const channel = channelById(channelId);
      if (!channel) {
        throw new Error('Channel not found: ' + channelId);
      }

      const identity = identityByKey(identityKey);
      if (!identity) {
        throw new Error('Identity not found: ' + identityKey);
      }

      log.info(`network: postMessage ${channelId} id=${identity.name}`);

      const message = await channel.post(Message.json(json), identity);
      return this.serializeMessage(message);
    });

    handle('requestInvite', async ({ identityKey }) => {
      const identity = identityByKey(identityKey);
      if (!identity) {
        throw new Error('Identity not found: ' + identityKey);
      }

      log.info(`network: requestInvite id=${identity.name}`);

      const { requestId, request, decrypt } =
        identity.requestInvite(this.vowLink.id);

      if (this.pendingInvites.has(identityKey)) {
        const existing = this.pendingInvites.get(identityKey);
        return {
          request: existing.encoded,
        };
      }

      const encoded = bs58.encode(request);
      this.pendingInvites.set(identityKey, {
        requestId,
        decrypt,
        encoded,

        // To be set below
        waiter: null,
      });

      return {
        request: encoded,
      };
    });

    handle('waitForInvite', async ({ identityKey }) => {
      const identity = identityByKey(identityKey);
      if (!identity) {
        throw new Error('Identity not found: ' + identityKey);
      }

      if (!this.pendingInvites.has(identityKey)) {
        throw new Error('No pending invites for: ' + identity.name);
      }

      const entry = this.pendingInvites.get(identityKey);

      // Already waiting
      if (entry.waiter) {
        entry.waiter.cancel();
      }

      entry.waiter = this.swarm.waitForInvite(entry.requestId);

      let encryptedInvite;
      try {
        encryptedInvite = await entry.waiter.promise;
      } catch (e) {
        log.error(`network: waitForInvite error ${e.message}`);

        // Likely canceled
        return false;
      } finally {
        entry.waiter = null;
      }

      const invite = entry.decrypt(encryptedInvite);

      // Find suitable channel name
      let channelName = invite.channelName;
      let counter = 0;
      let existing;
      while (existing = this.vowLink.getChannel(channelName)) {
        if (existing.id.equals(invite.channelPubKey)) {
          // Just add the chain, the `channelFromInvite` will not throw
          break;
        }

        counter++;
        channelName = `${invite.channelName}-${counter}`;
      }

      const channel = await this.vowLink.channelFromInvite(invite, identity, {
        name: channelName,
      });
      channel.setMetadata({
        ...channel.metadata,
        isFeed: false,
      });
      await this.vowLink.saveChannel(channel);

      this.swarm.joinChannel(channel);
      this.runUpdateLoop(channel);

      // Cleanup
      this.pendingInvites.delete(identityKey);

      return await this.serializeChannel(channel);
    });

    handle('invite', async (params) => {
      let {
        identityKey, channelId, inviteeName, request,
      } = params;

      const channel = channelById(channelId);
      if (!channel) {
        throw new Error('Channel not found: ' + channelId);
      }

      try {
        request = bs58.decode(request);
      } catch (e) {
        throw new Error('Invalid encoding of invite');
      }

      const identity = identityByKey(identityKey);
      if (!identity) {
        throw new Error('Identity not found: ' + identityKey);
      }

      const { encryptedInvite, peerId } =
        identity.issueInvite(channel, request, inviteeName);

      return await this.swarm.sendInvite({
        peerId,
        encryptedInvite,
      }, INVITE_TIMEOUT).promise;
    });

    handle('renameChannel', async ({ channelId, channelName }) => {
      const channel = channelById(channelId);
      if (!channel) {
        throw new Error('Channel not found: ' + channelId);
      }

      if (this.vowLink.getChannel(channelName)) {
        throw new Error(`Channel with name: "${channelName}" already exists`);
      }

      channel.name = channelName;
      await this.vowLink.saveChannel(channel);
    });
  }

  async runUpdateLoop(channel, timeout) {
    // Channel removed
    if (!this.vowLink.channels.includes(channel)) {
      return;
    }

    if (this.updateLoops.has(channel)) {
      return;
    }

    const entry = channel.waitForIncomingMessage(timeout);
    this.updateLoops.set(channel, entry);
    try {
      log.info(`network: waiting for ${channel.debugId} update`);
      await entry.promise;
      log.info(`network: got ${channel.debugId} update`);

      this.updatedChannels.add(channel);

      this.waitList.resolve('update:' + channel.id.toString('hex'), true);
    } catch (e) {
      log.info(`network: channel update loop error ${e.stack}`);
      return;
    } finally {
      this.updateLoops.delete(channel);
    }

    return await this.runUpdateLoop(channel, timeout);
  }

  serializeIdentity(identity) {
    return {
      name: identity.name,
      publicKey: identity.publicKey.toString('hex'),
      publicKeyB58: bs58.encode(identity.publicKey),
      channelIds: identity.getChannelIds().map((id) => id.toString('hex')),
      metadata: identity.getMetadata() || {},
    };
  }

  async serializeChannel(channel) {
    return {
      id: channel.id.toString('hex'),
      publicKey: channel.publicKey.toString('hex'),
      publicKeyB58: bs58.encode(channel.publicKey),

      name: channel.name,
      metadata: channel.getMetadata() || {},
      messageCount: await channel.getMessageCount(),
    };
  }

  serializeMessage(message) {
    const author = message.getAuthor();

    return {
      hash: message.hash.toString('hex'),
      height: message.height,
      author: {
        publicKeys: author.publicKeys.map((key) => key.toString('hex')),
        displayPath: author.displayPath,
      },
      timestamp: message.content.timestamp,
      isRoot: message.isRoot,
      json: message.json,
    };
  }

  async close() {
    await this.vowLink.close();
    await this.swarm.destroy();
    await this.storage.close();

    this.waitList.close(new Error('Closed'));
  }
}
