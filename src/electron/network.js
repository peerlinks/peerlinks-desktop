import log from 'electron-log';
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
        if (!this.ready && requireReady) {
          return event.reply('response', { seq, error: 'Not ready' });
        }

        handler(payload).then((result) => {
          event.reply('response', { seq, payload: result });
        }).catch((err) => {
          event.reply('response',
            { seq, error: err.message, stack: err.stack });
        });
      });
    };

    handle('init', async ({ passphrase }) => {
      log.info('network: got network:init');

      if (this.ready) {
        return;
      }

      this.waitList.resolve('init', { passphrase });
      await this.waitList.waitFor('ready').promise;
    }, false);

    handle('getChannels', async () => {
      const fetchChannel = async (channel) => {
        return {
          id: channel.id.toString('hex'),
          name: channel.name,
          messageCount: await channel.getMessageCount(),
        };
      };

      return await Promise.all(this.vowLink.channels.map(fetchChannel));
    });
  }

  async close() {
    await this.vowLink.close();
    await this.swarm.destroy();
    await this.storage.close();
  }
}
