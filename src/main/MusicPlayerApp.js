const { app, BrowserWindow } = require('electron');
const Database = require('../../database/database');
const WindowManager = require('./services/WindowManager');
const SettingsManager = require('./services/SettingsManager');
const FolderWatcher = require('./services/FolderWatcher');
const IPCHandlers = require('./ipc/IPCHandlers');

class MusicPlayerApp {
  constructor() {
    this.windowManager = new WindowManager();
    this.settingsManager = new SettingsManager();
    this.database = null;
    this.folderWatcher = null;
    this.ipcHandlers = null;
  }

  async init() {
    await app.whenReady();
    
    this.mainWindow = this.windowManager.createWindow();
    this.setupDatabase();
    this.setupServices();
    this.setupAppEvents();
  }

  setupDatabase() {
    this.database = new Database();
  }

  setupServices() {
    this.folderWatcher = new FolderWatcher(
      this.database, 
      this.settingsManager, 
      this.mainWindow
    );
    
    this.ipcHandlers = new IPCHandlers(
      this.database, 
      this.folderWatcher, 
      this.mainWindow
    );
    
    this.folderWatcher.initialize();
    this.ipcHandlers.setupHandlers();
  }

  setupAppEvents() {
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.mainWindow = this.windowManager.createWindow();
      }
    });
  }

  getMainWindow() {
    return this.mainWindow;
  }
}

module.exports = MusicPlayerApp;