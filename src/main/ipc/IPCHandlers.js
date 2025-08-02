const { ipcMain, dialog, Notification } = require('electron');

class IPCHandlers {
  constructor(database, folderWatcher, mainWindow, trayService, overlayService) {
    this.database = database;
    this.folderWatcher = folderWatcher;
    this.mainWindow = mainWindow;
    this.trayService = trayService;
    this.overlayService = overlayService;
  }

  setupHandlers() {
    this.setupDatabaseHandlers();
    this.setupDialogHandlers();
    this.setupFolderHandlers();
    this.setupTrayHandlers();
    this.setupWindowHandlers();
    this.setupMediaHandlers();
    this.setupNotificationHandlers();
  }

  setupDatabaseHandlers() {
    ipcMain.handle('get-all-songs', async () => {
      return this.database.getAllSongs();
    });

    ipcMain.handle('add-song', async (event, songData) => {
      return this.database.addSong(songData);
    });

    ipcMain.handle('delete-song', async (event, songId) => {
      return this.database.deleteSong(songId);
    });

    ipcMain.handle('get-playlists', async () => {
      return this.database.getPlaylists();
    });

    ipcMain.handle('create-playlist', async (event, name) => {
      return this.database.createPlaylist(name);
    });

    ipcMain.handle('add-song-to-playlist', async (event, playlistId, songId) => {
      return this.database.addSongToPlaylist(playlistId, songId);
    });

    ipcMain.handle('get-album-art', async (event, songId) => {
      return this.database.getAlbumArt(songId);
    });

    ipcMain.handle('toggle-like-song', async (event, songId) => {
      return this.database.toggleLikeSong(songId);
    });

    ipcMain.handle('get-liked-songs', async () => {
      return this.database.getLikedSongs();
    });
  }

  setupDialogHandlers() {
    ipcMain.handle('show-open-dialog', async () => {
      const result = await dialog.showOpenDialog(this.mainWindow, {
        properties: ['openFile', 'multiSelections'],
        filters: [
          { name: 'Audio Files', extensions: ['mp3', 'flac', 'wav', 'm4a', 'aac', 'ogg'] }
        ]
      });
      return result;
    });

    ipcMain.handle('show-folder-dialog', async () => {
      const result = await dialog.showOpenDialog(this.mainWindow, {
        properties: ['openDirectory']
      });
      return result;
    });
  }

  setupFolderHandlers() {
    ipcMain.handle('add-watched-folder', async (event, folderPath) => {
      return this.folderWatcher.addWatchedFolder(folderPath);
    });

    ipcMain.handle('remove-watched-folder', async (event, folderPath) => {
      return this.folderWatcher.removeWatchedFolder(folderPath);
    });

    ipcMain.handle('get-watched-folders', async () => {
      return this.folderWatcher.getWatchedFolders();
    });

    ipcMain.handle('scan-folder', async (event, folderPath) => {
      return this.folderWatcher.scanFolder(folderPath);
    });
  }

  setupTrayHandlers() {
    ipcMain.handle('update-minimize-to-tray', async (event, enabled) => {
      this.trayService.updateMinimizeToTrayEnabled(enabled);
      return { success: true };
    });

    ipcMain.on('open-settings', () => {
      // This is handled by the tray service to open settings from tray menu
      this.mainWindow.webContents.send('open-settings-modal');
    });
  }

  setupWindowHandlers() {
    ipcMain.handle('window-minimize', () => {
      this.mainWindow.minimize();
    });

    ipcMain.handle('window-maximize', () => {
      if (this.mainWindow.isMaximized()) {
        this.mainWindow.unmaximize();
      } else {
        this.mainWindow.maximize();
      }
      return this.mainWindow.isMaximized();
    });

    ipcMain.handle('window-close', () => {
      this.mainWindow.close();
    });

    ipcMain.handle('window-is-maximized', () => {
      return this.mainWindow.isMaximized();
    });
  }

  setupMediaHandlers() {
    // Set up global media key listeners
    ipcMain.on('register-media-keys', () => {
      this.mainWindow.webContents.setWindowOpenHandler = null; // Clear any existing handlers
      
      // Register global shortcuts for media keys
      const { globalShortcut } = require('electron');
      
      // Clear existing shortcuts
      globalShortcut.unregisterAll();
      
      // Register media key shortcuts
      globalShortcut.register('MediaPlayPause', () => {
        this.mainWindow.webContents.send('media-key-play-pause');
      });
      
      globalShortcut.register('MediaNextTrack', () => {
        this.mainWindow.webContents.send('media-key-next');
      });
      
      globalShortcut.register('MediaPreviousTrack', () => {
        this.mainWindow.webContents.send('media-key-previous');
      });
      
      console.log('Media keys registered');
    });

    ipcMain.on('unregister-media-keys', () => {
      const { globalShortcut } = require('electron');
      globalShortcut.unregisterAll();
      console.log('Media keys unregistered');
    });
  }

  setupNotificationHandlers() {
    ipcMain.handle('show-overlay-notification', async (event, songData) => {
      try {
        // Show overlay if main window is not focused, minimized, or not visible
        if (!this.mainWindow.isFocused() || this.mainWindow.isMinimized() || !this.mainWindow.isVisible()) {
          await this.overlayService.showSongNotification(songData);
        }
        return { success: true };
      } catch (error) {
        console.error('Error showing overlay notification:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('hide-overlay-notification', async () => {
      try {
        this.overlayService.hideOverlay();
        return { success: true };
      } catch (error) {
        console.error('Error hiding overlay notification:', error);
        return { success: false, error: error.message };
      }
    });

    // Track recently played songs
    ipcMain.handle('track-song-play', async (event, songId) => {
      try {
        // Add to recently played table
        this.database.addToRecentlyPlayed(songId);
        return { success: true };
      } catch (error) {
        console.error('Error tracking song play:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('get-recently-played', async () => {
      try {
        return this.database.getRecentlyPlayed();
      } catch (error) {
        console.error('Error getting recently played:', error);
        return [];
      }
    });

    ipcMain.handle('get-smart-playlists', async () => {
      try {
        return {
          recentlyAdded: this.database.getRecentlyAdded(),
          mostPlayed: this.database.getMostPlayed()
        };
      } catch (error) {
        console.error('Error getting smart playlists:', error);
        return { recentlyAdded: [], mostPlayed: [] };
      }
    });
  }
}

module.exports = IPCHandlers;