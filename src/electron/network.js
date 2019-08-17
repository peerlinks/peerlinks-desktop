import VowLink, { Message } from '@vowlink/protocol';
import SqliteStorage from '@vowlink/sqlite-storage';
import Swarm from '@vowlink/swarm';
import WaitList from 'promise-waitlist';

export default class Network {
  constructor(options = {}) {
    this.options = options;
    if (!this.options.db) {
      throw new Error('Missing `options.db`');
    }

    this.storage = null;
    this.vowLink = null;
    this.swarm = null;

    this.waitList = new WaitList();
  }

  async init() {
    const passphrase = await this.waitList.waitFor('passphrase').promise;

    this.storage = new SqliteStorage({ file: this.options.db });
    await this.storage.open();

    this.vowLink = new VowLink({
      storage: this.storage,
      passphrase,
    });
    await this.vowLink.load();

    this.swarm = new Swarm(this.vowLink);
  }

  resolvePassphrase(passphrase) {
    this.waitList.resolve('passphrase', passphrase);
  }

  async close() {
    await this.vowLink.close();
    await this.swarm.destroy();
    await this.storage.close();
  }
}
