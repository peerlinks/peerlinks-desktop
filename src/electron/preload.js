const { ipcRenderer: ipc } = require('electron');

ipc.on('response', (_, { seq, payload, error, stack }) => {
  window.postMessage({ sender: 'preload', seq, payload, error, stack });
});

window.addEventListener('message', ({ data: message }) => {
  if (message.sender === 'preload') {
    return;
  }

  const { type, seq, payload } = message;
  ipc.send(type, { seq, payload });
});
