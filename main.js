const { app, BrowserWindow, ipcMain,dialog  } = require('electron')
const log = require('electron-log');
const { autoUpdater } = require("electron-updater");
const unhandled = require('electron-unhandled');
const path = require('path');
const fetch = require('node-fetch');



//set environment to production
process.env.NODE_ENV = 'production';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;


let yourDbRootPath = app.getPath('userData');
process.env.configPath = yourDbRootPath;
//console.log(yourDbRootPath);

//unhandled();

//-------------------------------------------------------------------
// Logging
//
// THIS SECTION IS NOT REQUIRED
//
// This logging setup is not required for auto-updates to work,
// but it sure makes debugging easier :)
//-------------------------------------------------------------------
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
log.info('App starting...');

const server = require('./app/app');
//const db = require('./app/modals/db');


// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
    }
  })
}

function sendStatusToWindow(text) {
  log.info(text);
  win.webContents.send('message', text);
}

function createMainWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    width: 1600, height: 900,
	  //fullscreen : true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      webviewTag: true,
      contextIsolation: true
    }

  })
  win.removeMenu();
  win.maximize();
  //win.openDevTools();
  //app.allowRendererProcessReuse=true;



  // and load the index.html of the app.
  //win.loadFile('index.html')
  win.loadURL(`file://${__dirname}/index.html#v${app.getVersion()}`);
  
  // Open the DevTools.
  //win.webContents.openDevTools()

  // Emitted when the window is closed.
  win.on('closed', async () => {
    //await db.getResults("truncate sessions");
    server.close();
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null
    app.quit();
  })    
  
  win.webContents.session.on(
    "will-download",
    (event, downloadItem, webContents) => {
      const fileExtension = downloadItem
        .getFilename()
        .split(".")
        .pop()
        .toLowerCase();
      const filters = [{ name: fileExtension, extensions: [fileExtension] }];

      var fileName = dialog.showSaveDialogSync({
        defaultPath: downloadItem.getFilename(),
        filters: filters,
      });

      if (typeof fileName == "undefined") {
        downloadItem.cancel();
      } else {
        downloadItem.setSavePath(fileName);
      }
    }
  );
}

async function createNewWindow(url) {
  console.log(url);
  
  const newWin = new BrowserWindow({
    width: 1600, height: 900,
    title: 'Billberry',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  newWin.removeMenu();
  newWin.maximize();
  //newWin.openDevTools();
  const response = await fetch('http://localhost:8888/purchase/generateorder');
  const data = await response.text();
  console.log(data);
  
  newWin.loadURL(url, { extraHeaders: data });
}

autoUpdater.on('checking-for-update', () => {
  sendStatusToWindow('Checking for update...');
})
autoUpdater.on('update-available', (ev, info) => {
  sendStatusToWindow('Update available.');
})
autoUpdater.on('update-not-available', (ev, info) => {
  sendStatusToWindow('Update not available');
})
autoUpdater.on('error', (ev, err) => {
  console.log(err);
  log.info(err);
  sendStatusToWindow('Error in auto-updater');
})
autoUpdater.on('download-progress', ({ percent }) => {
  //sendStatusToWindow(progressObj.percent);	
  //sendStatusToWindow('Downloading progress...'+ percent.toFixed(2)+'%');
  log.info('Downloading progress...' + percent.toFixed(2) + '%');
  console.log(percent);

})
autoUpdater.on('update-downloaded', (ev, info) => {
  sendStatusToWindow('Update downloaded; will install in 5 seconds');
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
//app.on('ready', createWindow)

app.on('ready', () => {
  createMainWindow();

  ipcMain.on('open-new-window', (event, url) => {
    createNewWindow(url);
  });

  ipcMain.handle('get-printers', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return [];

    const printers = await win.webContents.getPrintersAsync();    
    return printers;
  });

  require('dns').resolve('www.billberrypos.com', function (err) {
    if (err) {
      log.info("Unable to reach www.billberrypos.com");
    } else {
      autoUpdater.checkForUpdates();
    }
  });
  
})


// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

//-------------------------------------------------------------------
// Auto updates
//
// For details about these events, see the Wiki:
// https://github.com/electron-userland/electron-builder/wiki/Auto-Update#events
//
// The app doesn't need to listen to any events except `update-downloaded`
//
// Uncomment any of the below events to listen for them.  Also,
// look in the previous section to see them being used.
//-------------------------------------------------------------------
autoUpdater.on('update-downloaded', (ev, info) => {
  // Wait 5 seconds, then quit and install
  // In your application, you don't need to wait 5 seconds.
  // You could call autoUpdater.quitAndInstall(); immediately
  setTimeout(function () {
    autoUpdater.quitAndInstall();
  }, 5000)
})

setInterval(function () {
  win.maximize();
}, 900000)
