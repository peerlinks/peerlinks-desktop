import WaitList from 'promise-waitlist';

export default class Bus {
  constructor(sender) {
    this.sender = sender;

    window.addEventListener('message', ({ data: message }) => {
      this.onMessage(message);
    });

    this.waitList = new WaitList();
  }

  send(type, payload) {
    window.postMessage({
      sender: this.sender,
      type,
      payload,
    });
  }

  waitFor(type, timeout) {
    return this.waitList.waitFor(type, timeout);
  }

  onMessage({ sender, type, payload }) {
    if (sender === this.sender) {
      return;
    }

    this.waitList.resolve(type, payload);
  }
}
