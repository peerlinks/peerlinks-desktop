import log from 'electron-log';
import { Buffer } from 'buffer';
import VowLink, { Message } from '@vowlink/protocol';
import SqliteStorage from '@vowlink/sqlite-storage';
import Swarm from '@vowlink/swarm';
import WaitList from 'promise-waitlist';

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
    this.ready = false;

    this.initIPC();
  }

  async init() {
    const {
      passphrase,
    } = await this.waitList.waitFor('init').promise;

    this.storage = new SqliteStorage({ file: this.options.db });
    await this.storage.open();

    this.vowLink = new VowLink({
      storage: this.storage,
      passphrase,
    });
    await this.vowLink.load();

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

      this.waitList.resolve('init', { passphrase });
      await this.waitList.waitFor('ready').promise;
    }, false);

    handle('getChannels', async () => {
      return this.vowLink.channels.map((channel) => {
        return this.serializeChannel(channel);
      });
    });

    handle('getIdentities', async () => {
      return this.vowLink.identities.map((identity) => {
        return this.serializeIdentity(identity);
      });
    });

    handle('createIdentityPair', async ({ name }) => {
      const [ identity, channel ] = await this.vowLink.createIdentityPair(name);
      return {
        identity: this.serializeIdentity(identity),
        channel: this.serializeChannel(channel),
      };
    });

    const channelById = (id) => {
      id = Buffer.from(id, 'hex');
      return this.vowLink.channels.find((channel) => {
        return channel.id.equals(id);
      });
    };

    handle('getMessageCount', async ({ channelId }) => {
      const channel = channelById(channelId);
      if (!channel) {
        throw new Error('Channel not found: ' + channelId);
      }

      return await channel.getMessageCount();
    });

    handle('getMessagesAtOffset', async ({ channelId, offset, limit }) => {
      const channel = channelById(channelId);
      if (!channel) {
        throw new Error('Channel not found: ' + channelId);
      }

      const messages = await channel.getMessagesAtOffset(offset, limit);
      return messages.map((message) => {
        return this.serializeMessage(message);
      });
    });
  }

  serializeIdentity(identity) {
    return {
      name: identity.name,
      publicKey: identity.publicKey.toString('hex'),
      channelIds: identity.getChannelIds().map((id) => id.toString('hex')),
    };
  }

  serializeChannel(channel) {
    return {
      id: channel.id.toString('hex'),
      name: channel.name,
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
  }
}