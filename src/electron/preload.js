const { ipcRenderer: ipc } = require('electron');

let networkReady = false;

const send = (type, payload) => {
  window.postMessage({ sender: 'preload', type, payload });
};

ipc.once('network:ready', () => {
  networkReady = true;
  send('network:ready');
});

window.addEventListener('message', ({ data: message }) => {
  if (message.sender === 'preload') {
    return;
  }

  const { type, payload } = message;
  if (type === 'network:passphrase') {
    // Development mode
    if (networkReady) {
      return send('network:ready');
    }

    ipc.send('network:passphrase', payload.passphrase);
  }
});
