import WaitList from 'promise-waitlist';

export default class Network {
  constructor() {
    window.addEventListener('message', ({ data: message }) => {
      this.onMessage(message);
    });

    this.seq = 0;
    this.waitList = new WaitList();
  }

  async init(passphrase) {
    await this.request('network:init', { passphrase });
  }

  async getChannels() {
    return await this.request('network:getChannels');
  }

  // Internal

  async request(type, payload, timeout) {
    const seq = this.seq;
    this.seq = (this.seq + 1) >>> 0;

    window.postMessage({
      sender: 'renderer',
      type,
      seq,
      payload,
    });

    const { error, payload: response } = this.waitList.waitFor(seq, timeout);
    if (error) {
      throw new Error(error);
    }

    return response;
  }

  onMessage({ sender, seq, payload }) {
    if (sender === 'renderer') {
      return;
    }

    this.waitList.resolve(seq, payload);
  }
}
