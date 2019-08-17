import * as path from 'path';
import { app, session, BrowserWindow, ipcMain as ipc } from 'electron';
import log from 'electron-log';

import Network from './network';

let window = null;
let network = null;

function createNetwork() {
  const n = new Network({
    db: path.join(app.getPath('userData'), 'db.sqlite'),
  });
  let passphraseEvent;

  n.init().then(() => {
    log.info('network initialized...');
    network = n;

    passphraseEvent.reply('network:ready');
    passphraseEvent = null;
  }).catch((e) => {
    log.error(e.stack);
    process.exit(1);
  });

  ipc.on('network:passphrase', (event, arg) => {
    if (network) {
      return event.reply('network:ready');
    }

    n.resolvePassphrase(arg);
    passphraseEvent = event;
  });
}

createNetwork();

function createWindow() {
  if (window !== null) {
    return;
  }

  window = new BrowserWindow({
    webPreferences: {
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(app.getAppPath(), 'src', 'electron', 'preload.js'),
    },
  });
  window.once('closed', () => window = null);

  // We need more screen space
  window.maximize();

  // Development
  window.loadURL('http://127.0.0.1:3000');

  // Allow only notifications
  session
    .defaultSession
    .setPermissionRequestHandler((_, permission, callback) => {
      if (permission === 'notifications') {
        // Approves the permissions request
        callback(true);
      } else {
        callback(false);
      }
    });
}

app.on('ready', createWindow);
app.on('activate', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('web-contents-created', (event, contents) => {
  contents.on('will-attach-webview', (event, webPreferences, params) => {
    delete webPreferences.preload;
    delete webPreferences.preloadURL;

    // Disable Node.js integration
    webPreferences.nodeIntegration = false
  });

  // Disable navigation
  contents.on('will-navigate', (event, navigationUrl) => {
    event.preventDefault();
  });

  // No new windows
  contents.on('new-window', async (event, navigationUrl) => {
    event.preventDefault()

    await shell.openExternal(navigationUrl);
  });
});
