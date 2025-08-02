const { BrowserWindow } = require('electron');
const path = require('path');

class WindowManager {
  constructor() {
    this.mainWindow = null;
  }

  createWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, '..', '..', '..', 'preload.js')
      },
      frame: false,
      titleBarStyle: 'hidden',
      show: false
    });

    this.mainWindow.loadFile('renderer/index.html');
    
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow.show();
    });

    // Open dev tools in development or for debugging production issues
    if (process.argv.includes('--development') || process.argv.includes('--debug')) {
      this.mainWindow.webContents.openDevTools();
    }

    return this.mainWindow;
  }

  getMainWindow() {
    return this.mainWindow;
  }

  closeWindow() {
    if (this.mainWindow) {
      this.mainWindow.close();
      this.mainWindow = null;
    }
  }
}

module.exports = WindowManager;