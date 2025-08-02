const { contextBridge, ipcRenderer } = require('electron');

// Add error handling for preload script
process.on('uncaughtException', (error) => {
  console.error('Preload uncaught exception:', error);
});

contextBridge.exposeInMainWorld('electronAPI', {
  // Database operations
  getAllSongs: () => ipcRenderer.invoke('get-all-songs'),
  addSong: (songData) => ipcRenderer.invoke('add-song', songData),
  deleteSong: (songId) => ipcRenderer.invoke('delete-song', songId),
  
  // Playlist operations
  getPlaylists: () => ipcRenderer.invoke('get-playlists'),
  createPlaylist: (name) => ipcRenderer.invoke('create-playlist', name),
  addSongToPlaylist: (playlistId, songId) => ipcRenderer.invoke('add-song-to-playlist', playlistId, songId),
  deletePlaylist: (playlistId) => ipcRenderer.invoke('delete-playlist', playlistId),
  renamePlaylist: (playlistId, newName) => ipcRenderer.invoke('rename-playlist', playlistId, newName),
  
  // Album art
  getAlbumArt: (songId) => ipcRenderer.invoke('get-album-art', songId),
  
  // Liked songs
  toggleLikeSong: (songId) => ipcRenderer.invoke('toggle-like-song', songId),
  getLikedSongs: () => ipcRenderer.invoke('get-liked-songs'),
  
  // File operations
  showOpenDialog: () => ipcRenderer.invoke('show-open-dialog'),
  showFolderDialog: () => ipcRenderer.invoke('show-folder-dialog'),
  
  // Folder watching
  addWatchedFolder: (folderPath) => ipcRenderer.invoke('add-watched-folder', folderPath),
  removeWatchedFolder: (folderPath) => ipcRenderer.invoke('remove-watched-folder', folderPath),
  getWatchedFolders: () => ipcRenderer.invoke('get-watched-folders'),
  scanFolder: (folderPath) => ipcRenderer.invoke('scan-folder', folderPath),

  // Tray operations
  updateMinimizeToTray: (enabled) => ipcRenderer.invoke('update-minimize-to-tray', enabled),
  
  // Window operations
  windowMinimize: () => ipcRenderer.invoke('window-minimize'),
  windowMaximize: () => ipcRenderer.invoke('window-maximize'),
  windowClose: () => ipcRenderer.invoke('window-close'),
  windowIsMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  
  // Custom overlay notifications
  showOverlayNotification: (songData) => ipcRenderer.invoke('show-overlay-notification', songData),
  hideOverlayNotification: () => ipcRenderer.invoke('hide-overlay-notification'),
  
  // Recently played and smart playlists
  trackSongPlay: (songId) => ipcRenderer.invoke('track-song-play', songId),
  getRecentlyPlayed: () => ipcRenderer.invoke('get-recently-played'),
  getSmartPlaylists: () => ipcRenderer.invoke('get-smart-playlists'),
  
  // Media keys
  registerMediaKeys: () => ipcRenderer.send('register-media-keys'),
  unregisterMediaKeys: () => ipcRenderer.send('unregister-media-keys'),
  
  // Listen for events
  onSongAdded: (callback) => ipcRenderer.on('song-added', callback),
  onSongsBatchAdded: (callback) => ipcRenderer.on('songs-batch-added', callback),
  onNotification: (callback) => ipcRenderer.on('show-notification', callback),
  onBulkImportStart: (callback) => ipcRenderer.on('bulk-import-start', callback),
  onBulkImportProgress: (callback) => ipcRenderer.on('bulk-import-progress', callback),
  onBulkImportComplete: (callback) => ipcRenderer.on('bulk-import-complete', callback),
  onOpenSettingsModal: (callback) => ipcRenderer.on('open-settings-modal', callback),
  
  // Media key events
  onMediaKeyPlayPause: (callback) => ipcRenderer.on('media-key-play-pause', callback),
  onMediaKeyNext: (callback) => ipcRenderer.on('media-key-next', callback),
  onMediaKeyPrevious: (callback) => ipcRenderer.on('media-key-previous', callback),
  
  // Update system
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  handleUpdateDecision: (decision, updateInfo) => ipcRenderer.invoke('handle-update-decision', decision, updateInfo),
  requestUpdateHistory: () => ipcRenderer.invoke('request-update-history'),
  
  // Update event listeners
  onUpdateNotification: (callback) => ipcRenderer.on('show-update-notification', callback),
  onUpdateHistory: (callback) => ipcRenderer.on('show-update-history', callback),
  onUpdateDownloadStarted: (callback) => ipcRenderer.on('update-download-started', callback),
  onUpdateDownloadProgress: (callback) => ipcRenderer.on('update-download-progress', callback),
  onUpdateDownloadError: (callback) => ipcRenderer.on('update-download-error', callback),
  
  // Node.js path utilities for file handling
  path: {
    basename: (filepath) => {
      const parts = filepath.replace(/\\/g, '/').split('/');
      return parts[parts.length - 1];
    },
    dirname: (filepath) => {
      const parts = filepath.replace(/\\/g, '/').split('/');
      parts.pop();
      return parts.join('/');
    },
    extname: (filepath) => {
      const basename = filepath.replace(/\\/g, '/').split('/').pop();
      const dotIndex = basename.lastIndexOf('.');
      return dotIndex !== -1 ? basename.substring(dotIndex) : '';
    }
  }
});