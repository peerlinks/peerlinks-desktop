import { Buffer } from 'buffer';

import VowLink, { Message } from '@vowlink/protocol';
import SqliteStorage from '@vowlink/sqlite-storage';
import Swarm from '@vowlink/swarm';

import log from 'electron-log';
import * as sodium from 'sodium-universal';
import WaitList from 'promise-waitlist';

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

    // Map<Channel>
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
    });

    handle('updateChannelMetadata', async ({ channelId, metadata }) => {
      const channel = channelById(channelId);
      if (!channel) {
        throw new Error('Channel not found: ' + channelId);
      }

      channel.setMetadata(metadata);
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
        return;
      }

      // Otherwise - wait
      log.info(`network: waitForIncomingMessage ${channelId} ... wait`);
      const entry = this.waitList.waitFor(
        'update:' + channelId.toString('hex'), timeout);
      await entry.promise;
      this.updatedChannels.delete(channel);
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
        if (existing.waiter) {
          existing.waiter.cancel();
        }
      }
      this.pendingInvites.set(identityKey, {
        requestId,
        decrypt,

        // To be set below
        waiter: null,
      });

      return {
        requestId: requestId.toString('hex'),
        request: request.toString('hex'),
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
      if (!entry.waiter) {
        entry.waiter = this.swarm.waitForInvite(entry.requestId);
      }

      const encryptedInvite = await entry.waiter.promise;
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
      this.swarm.joinChannel(channel);

      return await this.serializeChannel(channel);
    });

    handle('invite', async (params) => {
      let {
        identityKey, channelId, inviteeName, requestId, request,
      } = params;

      const channel = channelById(channelId);
      if (!channel) {
        throw new Error('Channel not found: ' + channelId);
      }

      try {
        requestId = Buffer.from(requestId, 'hex');
        request = Buffer.from(request, 'hex');
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
        requestId,
        peerId,
        encryptedInvite,
      }, INVITE_TIMEOUT).promise;
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
      await entry.promise;

      this.updatedChannels.add(channel);

      this.waitList.resolve('update:' + channel.id.toString('hex'));
    } catch (e) {
      log.error(`network: channel update loop error ${e.stack}`);
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
      channelIds: identity.getChannelIds().map((id) => id.toString('hex')),
      metadata: identity.getMetadata() || {},
    };
  }

  async serializeChannel(channel) {
    return {
      id: channel.id.toString('hex'),
      publicKey: channel.publicKey.toString('hex'),

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
