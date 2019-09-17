require = require('esm')(module);

const path = require('path');
const fs = require('fs');
const {
  app, session, BrowserWindow, ipcMain: ipc, shell,
} = require('electron');
const log = require('electron-log');
const isDev = require('electron-is-dev');
const { autoUpdater } = require('electron-updater');
const windowStateKeeper = require('electron-window-state');
const contextMenu = require('electron-context-menu');

// Request update every 4 hours for those who run it over prolonged periods
// of time.
const UPDATE_FREQUENCY = 4 * 3600 * 1000;

const USER_DATA_DIR = app.getPath('userData');
const DB_FILE = path.join(
  USER_DATA_DIR,
    isDev ? (process.env.PEERLINKS_DB || 'db-dev.sqlite') :
    'db-v2.sqlite');

// Create `userData` folder if it doesn't exist
if (!fs.existsSync(USER_DATA_DIR)) {
  fs.mkdirSync(USER_DATA_DIR);
}

//
// Configure auto updater
//

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

//
// Configure context menu (right-click)
//
contextMenu({});

//
// Configure network
//

const Network = require('./network').default;

log.info(`database file=${DB_FILE}`);
const network = new Network(ipc, {
  db: DB_FILE,

  setBadgeCount(count) {
    app.setBadgeCount(count);
  },
});

network.init().then(() => {
  log.info('network initialized...');
}).catch((e) => {
  log.error(e.stack);
  process.exit(1);
});

//
// Window state
//

let windowState = null;
let window = null;

function createWindow() {
  if (window !== null) {
    return;
  }

  window = new BrowserWindow({
    x: windowState.x,
    y: windowState.y,
    width: windowState.width,
    height: windowState.height,
    webPreferences: {
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
    },
    show: false,
  });
  window.once('ready-to-show', () => window.show());

  window.once('closed', () => window = null);

  windowState.manage(window)

  // Development
  if (isDev) {
    window.loadURL('http://127.0.0.1:3000');
  } else {
    window.loadFile(path.join(__dirname, '..', '..', 'build', 'index.html'));
  }
}

app.on('ready', () => {
  windowState = windowStateKeeper({
    defaultWidth: 800,
    defaultHeight: 600,
  });

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

  createWindow();

  function checkForUpdates() {
    autoUpdater.checkForUpdatesAndNotify().catch(() => {
      // Ignore
    });
  }

  setInterval(checkForUpdates, UPDATE_FREQUENCY);
  checkForUpdates();
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
