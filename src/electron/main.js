require = require("esm")(module);

const path = require('path');
const { app, session, BrowserWindow, ipcMain: ipc } = require('electron');
const log = require('electron-log');
const isDev = require('electron-is-dev');
const { autoUpdater } = require("electron-updater");

// Request update every 4 hours for those who run it over prolonged periods
// of time.
const UPDATE_FREQUENCY = 4 * 3600 * 1000;

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

const Network = require('./network').default;

let window = null;

const network = new Network(ipc, {
  db: path.join(app.getPath('userData'), 'db.sqlite'),
});

network.init().then(() => {
  log.info('network initialized...');
}).catch((e) => {
  log.error(e.stack);
  process.exit(1);
});

function createWindow() {
  if (window !== null) {
    return;
  }

  window = new BrowserWindow({
    webPreferences: {
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  window.once('closed', () => window = null);

  // We need more screen space
  window.maximize();

  // Development
  if (isDev) {
    window.loadURL('http://127.0.0.1:3000');
  } else {
    window.loadFile(path.join(__dirname, '..', '..', 'build', 'index.html'));
  }

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

app.on('ready', () => {
  createWindow();

  setInterval(() => {
    autoUpdater.checkForUpdatesAndNotify().catch(() => {
      // Ignore
    });
  }, UPDATE_FREQUENCY);

  autoUpdater.checkForUpdatesAndNotify().catch(() => {
    // Ignore
  });
});
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
