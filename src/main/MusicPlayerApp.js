const { app, BrowserWindow } = require('electron');
const Database = require('../../database/database');
const WindowManager = require('./services/WindowManager');
const SettingsManager = require('./services/SettingsManager');
const FolderWatcher = require('./services/FolderWatcher');
const TrayService = require('./services/TrayService');
const IPCHandlers = require('./ipc/IPCHandlers');

class MusicPlayerApp {
  constructor() {
    this.windowManager = new WindowManager();
    this.settingsManager = new SettingsManager();
    this.database = null;
    this.folderWatcher = null;
    this.trayService = null;
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
    this.trayService = new TrayService(this.mainWindow, this.settingsManager);
    
    this.folderWatcher = new FolderWatcher(
      this.database, 
      this.settingsManager, 
      this.mainWindow
    );
    
    this.ipcHandlers = new IPCHandlers(
      this.database, 
      this.folderWatcher, 
      this.mainWindow,
      this.trayService
    );
    
    this.folderWatcher.initialize();
    this.ipcHandlers.setupHandlers();
    this.setupWindowEvents();
  }

  setupWindowEvents() {
    // Handle window close event for tray functionality
    this.mainWindow.on('close', (event) => {
      const shouldClose = this.trayService.handleWindowClose(event);
      if (!shouldClose) {
        // Window was minimized to tray, don't quit the app
        return;
      }
    });

    // Handle minimize event
    this.mainWindow.on('minimize', (event) => {
      // If minimize to tray is enabled, hide to tray instead
      if (this.trayService.isMinimizeToTrayEnabled) {
        event.preventDefault();
        this.trayService.hideWindow();
      }
    });
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