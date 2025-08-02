const { ipcMain, dialog } = require('electron');

class IPCHandlers {
  constructor(database, folderWatcher, mainWindow) {
    this.database = database;
    this.folderWatcher = folderWatcher;
    this.mainWindow = mainWindow;
  }

  setupHandlers() {
    this.setupDatabaseHandlers();
    this.setupDialogHandlers();
    this.setupFolderHandlers();
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
}

module.exports = IPCHandlers;