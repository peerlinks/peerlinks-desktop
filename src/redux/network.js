import WaitList from 'promise-waitlist';

export default class Network {
  constructor() {
    window.addEventListener('message', ({ data: message }) => {
      this.onMessage(message);
    });

    this.seq = 0;
    this.waitList = new WaitList();

    // channelId => []
    this.messages = new Map();
  }

  async init({ passphrase }) {
    return await this.request('network:init', { passphrase });
  }

  async erase() {
    return await this.request('network:erase');
  }

  async getStatus() {
    return await this.request('network:getStatus');
  }

  async getChannels() {
    return await this.request('network:getChannels');
  }

  async getIdentities() {
    return await this.request('network:getIdentities');
  }

  async createIdentityPair({ name, isFeed }) {
    return await this.request('network:createIdentityPair', { name, isFeed });
  }

  async feedFromPublicKey({ publicKey, name }) {
    return await this.request('network:feedFromPublicKey',
      { publicKey, name });
  }

  async removeIdentityPair({ channelId, identityKey }) {
    return await this.request('network:removeIdentityPair',
      { channelId, identityKey });
  }

  async updateChannelMetadata({ channelId, metadata }) {
    return await this.request('network:updateChannelMetadata',
      { channelId, metadata });
  }

  async getMessageCount({ channelId }) {
    return await this.request('network:getMessageCount', { channelId });
  }

  async getReverseMessagesAtOffset({ channelId, offset, limit }) {
    return await this.request('network:getReverseMessagesAtOffset', {
      channelId, offset, limit
    });
  }

  async waitForIncomingMessage({ channelId, timeout }) {
    return await this.request('network:waitForIncomingMessage',
      { channelId, timeout });
  }

  async postMessage({ channelId, identityKey, json }) {
    return await this.request('network:postMessage',
      { channelId, identityKey, json });
  }

  async requestInvite({ identityKey }) {
    return await this.request('network:requestInvite', { identityKey });
  }

  async waitForInvite({ identityKey }) {
    return await this.request('network:waitForInvite', { identityKey });
  }

  async invite({ identityKey, channelId, inviteeName, request }) {
    return await this.request('network:invite', {
      identityKey,
      channelId,
      inviteeName,
      request,
    });
  }

  async acceptInvite({ requestId, box }) {
    return await this.request('network:acceptInvite', { requestId, box });
  }

  async sendInvite({ encryptedInvite, peerId }) {
    return await this.request('network:sendInvite',
      { encryptedInvite, peerId });
  }

  async renameIdentityPair({ channelId, identityKey, newName }) {
    return await this.request('network:renameIdentityPair',
      { channelId, identityKey, newName });
  }

  async waitForChainMapUpdate({ timeout } = {}) {
    return await this.request('network:waitForChainMapUpdate', { timeout });
  }

  async computeChainMap() {
    return await this.request('network:computeChainMap', {});
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
      await this.waitList.waitFor(seq, timeout);
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
