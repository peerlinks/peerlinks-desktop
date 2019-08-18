import WaitList from 'promise-waitlist';

const MAX_DISPLAYED_MESSAGES = 1000;

export default class Network {
  constructor() {
    window.addEventListener('message', ({ data: message }) => {
      this.onMessage(message);
    });

    this.seq = 0;
    this.waitList = new WaitList();

    this.channels = null;
    this.identities = null;

    // channelId => []
    this.messages = new Map();
  }

  async init(passphrase) {
    await this.request('network:init', { passphrase });

    this.channels = await this.getChannels();
    this.identities = await this.getIdentities();
  }

  async getChannels() {
    return await this.request('network:getChannels');
  }

  async getIdentities() {
    return await this.request('network:getIdentities');
  }

  async createIdentityPair(name) {
    return await this.request('network:createIdentityPair', { name });
  }

  async getMessageCount(channelId) {
    return await this.request('network:getMessageCount', { channelId });
  }

  async getMessagesAtOffset(channelId, offset, limit) {
    return await this.request('network:getMessagesAtOffset', {
      channelId, offset, limit });
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

    const { error, stack, payload: response } =
      await this.waitList.waitFor(seq, timeout).promise;
    if (error) {
      const e = new Error(error);
      e.stack = stack;
      throw e;
    }

    return response;
  }

  onMessage({ sender, seq, error, stack, payload }) {
    if (sender === 'renderer') {
      return;
    }

    this.waitList.resolve(seq, { error, stack, payload });
  }
}
