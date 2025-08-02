const { app, BrowserWindow } = require('electron');
const Database = require('../../database/database');
const WindowManager = require('./services/WindowManager');
const SettingsManager = require('./services/SettingsManager');
const FolderWatcher = require('./services/FolderWatcher');
const TrayService = require('./services/TrayService');
const OverlayService = require('./services/OverlayService');
const UpdateService = require('./services/UpdateService');
const IPCHandlers = require('./ipc/IPCHandlers');

class MusicPlayerApp {
  constructor() {
    this.windowManager = new WindowManager();
    this.settingsManager = new SettingsManager();
    this.database = null;
    this.folderWatcher = null;
    this.trayService = null;
    this.overlayService = null;
    this.updateService = null;
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
    try {
      console.log('Setting up database...');
      this.database = new Database();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      console.error('This is often due to missing native dependencies in production builds');
      
      // Create a fallback database object to prevent crashes
      this.database = {
        getAllSongs: () => {
          console.log('Using fallback database - getAllSongs');
          return [];
        },
        getLikedSongs: () => {
          console.log('Using fallback database - getLikedSongs');
          return [];
        },
        getPlaylists: () => {
          console.log('Using fallback database - getPlaylists');
          return [];
        },
        addSong: (songData) => {
          console.log('Using fallback database - addSong (no-op)');
          return { id: Date.now(), ...songData };
        },
        deleteSong: (songId) => {
          console.log('Using fallback database - deleteSong (no-op)');
          return true;
        },
        createPlaylist: (name) => {
          console.log('Using fallback database - createPlaylist (no-op)');
          return { success: true, playlistId: Date.now() };
        },
        addSongToPlaylist: () => {
          console.log('Using fallback database - addSongToPlaylist (no-op)');
          return { success: true };
        },
        getAlbumArt: () => {
          console.log('Using fallback database - getAlbumArt');
          return null;
        },
        toggleLikeSong: () => {
          console.log('Using fallback database - toggleLikeSong (no-op)');
          return { liked: false };
        },
        addToRecentlyPlayed: () => {
          console.log('Using fallback database - addToRecentlyPlayed (no-op)');
          return true;
        },
        getRecentlyPlayed: () => {
          console.log('Using fallback database - getRecentlyPlayed');
          return [];
        },
        getRecentlyAdded: () => {
          console.log('Using fallback database - getRecentlyAdded');
          return [];
        },
        getMostPlayed: () => {
          console.log('Using fallback database - getMostPlayed');
          return [];
        }
      };
      
      console.log('Fallback database object created - app will run with limited functionality');
    }
  }

  setupServices() {
    try {
      this.trayService = new TrayService(this.mainWindow, this.settingsManager);
      this.overlayService = new OverlayService();
      this.updateService = new UpdateService(this.mainWindow);
      
      this.folderWatcher = new FolderWatcher(
        this.database, 
        this.settingsManager, 
        this.mainWindow
      );
      
      this.ipcHandlers = new IPCHandlers(
        this.database, 
        this.folderWatcher, 
        this.mainWindow,
        this.trayService,
        this.overlayService,
        this.updateService
      );
      
      this.folderWatcher.initialize();
      this.ipcHandlers.setupHandlers();
      this.setupWindowEvents();
      
      // Start automatic update checking
      this.updateService.startPeriodicChecks();
      
      console.log('All services initialized successfully');
    } catch (error) {
      console.error('Error setting up services:', error);
    }
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
        this.cleanup();
        app.quit();
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.mainWindow = this.windowManager.createWindow();
      }
    });

    app.on('before-quit', () => {
      this.cleanup();
    });
  }

  cleanup() {
    console.log('Starting application cleanup...');
    
    try {
      // Cleanup FolderWatcher first to stop any ongoing operations
      if (this.folderWatcher) {
        this.folderWatcher.cleanup();
      }
      
      // Close database connection
      if (this.database && typeof this.database.close === 'function') {
        this.database.close();
      }
      
      // Cleanup tray service
      if (this.trayService) {
        this.trayService.destroyTray();
      }
      
      console.log('Application cleanup completed');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  getMainWindow() {
    return this.mainWindow;
  }
}

module.exports = MusicPlayerApp;