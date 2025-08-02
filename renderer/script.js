class MusicPlayer {
  constructor() {
    this.songs = [];
    this.playlists = [];
    this.currentView = 'all-songs';
    this.currentPlaylist = null;
    
    this.initializeElements();
    this.bindEvents();
    this.loadData();
  }

  initializeElements() {
    this.songList = document.getElementById('song-list');
    this.songCount = document.getElementById('song-count');
    this.currentViewTitle = document.getElementById('current-view-title');
    this.playlistsList = document.getElementById('playlists-list');
    this.dropZone = document.getElementById('drop-zone');
    this.addMusicBtn = document.getElementById('add-music-btn');
    this.manageFoldersBtn = document.getElementById('manage-folders-btn');
    this.createPlaylistBtn = document.getElementById('create-playlist-btn');
    this.playAllBtn = document.getElementById('play-all-btn');
    this.playlistModal = document.getElementById('playlist-modal');
    this.playlistNameInput = document.getElementById('playlist-name-input');
    this.foldersModal = document.getElementById('folders-modal');
    this.watchedFoldersList = document.getElementById('watched-folders-list');
    this.notificationContainer = document.getElementById('notification-container');
    
    // Progress elements
    this.bulkImportProgress = document.getElementById('bulk-import-progress');
    this.progressTitle = document.getElementById('progress-title');
    this.progressText = document.getElementById('progress-text');
    this.progressNumbers = document.getElementById('progress-numbers');
    this.importProgressBar = document.getElementById('import-progress-bar');
    this.progressClose = document.getElementById('progress-close');
  }

  bindEvents() {
    // File operations
    this.addMusicBtn.addEventListener('click', () => this.showOpenDialog());
    this.manageFoldersBtn.addEventListener('click', () => this.showFoldersModal());
    this.playAllBtn.addEventListener('click', () => this.playAllSongs());
    
    // Drag and drop
    document.addEventListener('dragover', (e) => this.handleDragOver(e));
    document.addEventListener('drop', (e) => this.handleDrop(e));
    document.addEventListener('dragenter', (e) => this.handleDragEnter(e));
    document.addEventListener('dragleave', (e) => this.handleDragLeave(e));
    
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => this.handleNavigation(e));
    });
    
    // Playlist modal
    this.createPlaylistBtn.addEventListener('click', () => this.showPlaylistModal());
    document.getElementById('create-playlist-confirm-btn').addEventListener('click', () => this.createPlaylist());
    document.getElementById('cancel-playlist-btn').addEventListener('click', () => this.hidePlaylistModal());
    document.querySelector('.modal-close').addEventListener('click', () => this.hidePlaylistModal());
    
    // Folders modal
    document.getElementById('folders-modal-close').addEventListener('click', () => this.hideFoldersModal());
    document.getElementById('close-folders-btn').addEventListener('click', () => this.hideFoldersModal());
    document.getElementById('add-folder-from-modal-btn').addEventListener('click', () => this.showFolderDialog());
    
    // Close modal on outside click
    this.playlistModal.addEventListener('click', (e) => {
      if (e.target === this.playlistModal) {
        this.hidePlaylistModal();
      }
    });
    
    this.foldersModal.addEventListener('click', (e) => {
      if (e.target === this.foldersModal) {
        this.hideFoldersModal();
      }
    });
    
    // Enter key in playlist input
    this.playlistNameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.createPlaylist();
      }
    });
    
    // Progress close button
    this.progressClose.addEventListener('click', () => {
      this.hideBulkImportProgress();
    });
  }

  async loadData() {
    await this.loadSongs();
    await this.loadPlaylists();
    this.renderCurrentView();
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Listen for single song additions
    window.electronAPI.onSongAdded((event, filePath) => {
      this.loadData(); // Refresh the song list
    });

    // Listen for batch song additions
    window.electronAPI.onSongsBatchAdded((event, filePaths) => {
      this.loadData(); // Refresh the song list
    });

    // Listen for notifications
    window.electronAPI.onNotification((event, notification) => {
      this.showNotification(notification.message, notification.type);
    });

    // Listen for bulk import events
    window.electronAPI.onBulkImportStart((event, data) => {
      this.showBulkImportProgress(data);
    });

    window.electronAPI.onBulkImportProgress((event, data) => {
      this.updateBulkImportProgress(data);
    });

    window.electronAPI.onBulkImportComplete((event, data) => {
      this.completeBulkImport(data);
    });
  }

  async loadSongs() {
    try {
      this.songs = await window.electronAPI.getAllSongs();
      this.updateSongCount();
      console.log('Loaded songs:', this.songs.length);
    } catch (error) {
      console.error('Error loading songs:', error);
      this.songs = [];
    }
  }

  async loadPlaylists() {
    try {
      this.playlists = await window.electronAPI.getPlaylists();
      this.renderPlaylists();
      console.log('Loaded playlists:', this.playlists.length);
    } catch (error) {
      console.error('Error loading playlists:', error);
      this.playlists = [];
    }
  }

  updateSongCount() {
    const count = this.getCurrentSongs().length;
    this.songCount.textContent = `${count} song${count !== 1 ? 's' : ''}`;
  }

  getCurrentSongs() {
    switch (this.currentView) {
      case 'all-songs':
        return this.songs;
      case 'artists':
        // Group by artist - for now just return all songs
        return this.songs;
      case 'albums':
        // Group by album - for now just return all songs
        return this.songs;
      default:
        if (this.currentPlaylist) {
          return this.currentPlaylist.songs || [];
        }
        return this.songs;
    }
  }

  renderCurrentView() {
    const songs = this.getCurrentSongs();
    this.renderSongs(songs);
    this.updateSongCount();
  }

  renderSongs(songs) {
    if (songs.length === 0) {
      this.songList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon"></div>
          <h3>No songs found</h3>
          <p>Add some music to get started!</p>
          <button class="btn btn-primary" onclick="musicPlayer.showOpenDialog()">Add Music</button>
        </div>
      `;
      return;
    }

    this.songList.innerHTML = songs.map(song => `
      <div class="song-item" data-song-id="${song.id}">
        <div class="song-title" title="${song.title}">${song.title}</div>
        <div class="song-artist" title="${song.artist}">${song.artist}</div>
        <div class="song-album" title="${song.album}">${song.album}</div>
        <div class="song-duration">${this.formatDuration(song.duration)}</div>
        <div class="song-actions">
          <button class="btn btn-icon icon-play" onclick="musicPlayer.playSong(${song.id})" title="Play"></button>
          <button class="btn btn-icon btn-danger icon-delete" onclick="musicPlayer.deleteSong(${song.id})" title="Delete"></button>
        </div>
      </div>
    `).join('');

    // Add click handlers for song items
    document.querySelectorAll('.song-item').forEach(item => {
      item.addEventListener('dblclick', () => {
        const songId = parseInt(item.dataset.songId);
        this.playSong(songId);
      });
    });
  }

  renderPlaylists() {
    this.playlistsList.innerHTML = this.playlists.map(playlist => `
      <li>
        <a href="#" class="nav-item" data-playlist-id="${playlist.id}">
          ${playlist.name} (${playlist.songs ? playlist.songs.length : 0})
        </a>
      </li>
    `).join('');

    // Add click handlers for playlist items
    document.querySelectorAll('[data-playlist-id]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const playlistId = parseInt(item.dataset.playlistId);
        this.showPlaylist(playlistId);
      });
    });
  }

  showPlaylist(playlistId) {
    this.currentPlaylist = this.playlists.find(p => p.id === playlistId);
    if (this.currentPlaylist) {
      this.currentView = 'playlist';
      this.currentViewTitle.textContent = this.currentPlaylist.name;
      
      // Update navigation
      document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
      document.querySelector(`[data-playlist-id="${playlistId}"]`).classList.add('active');
      
      this.renderCurrentView();
    }
  }

  handleNavigation(e) {
    e.preventDefault();
    const view = e.target.dataset.view;
    if (!view) return;

    this.currentView = view;
    this.currentPlaylist = null;
    
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    e.target.classList.add('active');
    
    // Update view title
    switch (view) {
      case 'all-songs':
        this.currentViewTitle.textContent = 'All Songs';
        break;
      case 'artists':
        this.currentViewTitle.textContent = 'Artists';
        break;
      case 'albums':
        this.currentViewTitle.textContent = 'Albums';
        break;
    }
    
    this.renderCurrentView();
  }

  async showOpenDialog() {
    try {
      const result = await window.electronAPI.showOpenDialog();
      if (!result.canceled && result.filePaths.length > 0) {
        await this.addSongs(result.filePaths);
      }
    } catch (error) {
      console.error('Error opening files:', error);
    }
  }

  async addSongs(filePaths) {
    const loadingEl = document.createElement('div');
    loadingEl.className = 'loading-message';
    loadingEl.textContent = 'Adding songs...';
    document.body.appendChild(loadingEl);

    let addedCount = 0;
    let errorCount = 0;

    for (const filePath of filePaths) {
      try {
        const result = await window.electronAPI.addSong(filePath);
        if (result.success) {
          addedCount++;
        } else {
          errorCount++;
          console.warn(`Failed to add ${filePath}:`, result.error);
        }
      } catch (error) {
        errorCount++;
        console.error(`Error adding ${filePath}:`, error);
      }
    }

    document.body.removeChild(loadingEl);

    if (addedCount > 0) {
      await this.loadData(); // Reload all data
      console.log(`Added ${addedCount} song(s)`);
    }

    if (errorCount > 0) {
      console.warn(`Failed to add ${errorCount} song(s)`);
    }
  }

  playSong(songId) {
    const song = this.songs.find(s => s.id === songId);
    if (song) {
      const currentSongs = this.getCurrentSongs();
      const index = currentSongs.findIndex(s => s.id === songId);
      window.audioPlayer.playPlaylist(currentSongs, index);
    }
  }

  playAllSongs() {
    const songs = this.getCurrentSongs();
    if (songs.length > 0) {
      window.audioPlayer.playPlaylist(songs, 0);
    }
  }

  async deleteSong(songId) {
    if (!confirm('Are you sure you want to delete this song from your library?')) {
      return;
    }

    try {
      const result = await window.electronAPI.deleteSong(songId);
      if (result.success) {
        await this.loadData(); // Reload all data
        console.log('Song deleted successfully');
      } else {
        console.error('Error deleting song:', result.error);
      }
    } catch (error) {
      console.error('Error deleting song:', error);
    }
  }

  // Drag and Drop handlers
  handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }

  handleDragEnter(e) {
    e.preventDefault();
    this.dropZone.classList.add('active');
  }

  handleDragLeave(e) {
    if (!e.relatedTarget || !document.contains(e.relatedTarget)) {
      this.dropZone.classList.remove('active');
    }
  }

  async handleDrop(e) {
    e.preventDefault();
    this.dropZone.classList.remove('active');

    const files = Array.from(e.dataTransfer.files);
    const audioFiles = files.filter(file => {
      const ext = file.name.toLowerCase().split('.').pop();
      return ['mp3', 'flac', 'wav', 'm4a', 'aac', 'ogg'].includes(ext);
    });

    if (audioFiles.length === 0) {
      alert('Please drop audio files (MP3, FLAC, WAV, M4A, AAC, OGG)');
      return;
    }

    const filePaths = audioFiles.map(file => file.path);
    await this.addSongs(filePaths);
  }

  // Playlist management
  showPlaylistModal() {
    this.playlistModal.classList.add('active');
    this.playlistNameInput.value = '';
    this.playlistNameInput.focus();
  }

  hidePlaylistModal() {
    this.playlistModal.classList.remove('active');
  }

  async createPlaylist() {
    const name = this.playlistNameInput.value.trim();
    if (!name) {
      alert('Please enter a playlist name');
      return;
    }

    try {
      const result = await window.electronAPI.createPlaylist(name);
      if (result.success) {
        await this.loadPlaylists();
        this.hidePlaylistModal();
        console.log('Playlist created successfully');
      } else {
        alert('Error creating playlist: ' + result.error);
      }
    } catch (error) {
      console.error('Error creating playlist:', error);
      alert('Error creating playlist');
    }
  }

  // Folder management
  async showFolderDialog() {
    try {
      const result = await window.electronAPI.showFolderDialog();
      if (!result.canceled && result.filePaths.length > 0) {
        const folderPath = result.filePaths[0];
        await this.addWatchedFolder(folderPath);
      }
    } catch (error) {
      console.error('Error selecting folder:', error);
      this.showNotification('Error selecting folder', 'error');
    }
  }

  async addWatchedFolder(folderPath) {
    try {
      this.showNotification('Scanning folder...', 'info');
      
      const result = await window.electronAPI.addWatchedFolder(folderPath);
      if (result.success) {
        this.showNotification(`Started watching folder: ${folderPath}`, 'success');
        await this.loadData(); // Refresh songs
        this.renderWatchedFolders(); // Refresh folder list if modal is open
      } else {
        this.showNotification(`Error: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Error adding watched folder:', error);
      this.showNotification('Error adding watched folder', 'error');
    }
  }

  async removeWatchedFolder(folderPath) {
    try {
      const result = await window.electronAPI.removeWatchedFolder(folderPath);
      if (result.success) {
        this.showNotification(`Stopped watching folder: ${folderPath}`, 'info');
        this.renderWatchedFolders();
      } else {
        this.showNotification(`Error: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Error removing watched folder:', error);
      this.showNotification('Error removing watched folder', 'error');
    }
  }

  async showFoldersModal() {
    this.foldersModal.classList.add('active');
    await this.renderWatchedFolders();
  }

  hideFoldersModal() {
    this.foldersModal.classList.remove('active');
  }

  async renderWatchedFolders() {
    try {
      const watchedFolders = await window.electronAPI.getWatchedFolders();
      
      if (watchedFolders.length === 0) {
        this.watchedFoldersList.innerHTML = `
          <div class="empty-folders">
            <div class="empty-folders-icon"></div>
            <h4>No folders being watched</h4>
            <p>Click "Add Folder" to start monitoring a music folder</p>
          </div>
        `;
        return;
      }

      this.watchedFoldersList.innerHTML = watchedFolders.map(folder => `
        <div class="folder-item">
          <div class="folder-path" title="${folder}">${folder}</div>
          <div class="folder-actions">
            <button class="btn btn-icon btn-secondary" onclick="musicPlayer.scanFolder('${folder}')" title="Rescan">↻</button>
            <button class="btn btn-icon btn-danger" onclick="musicPlayer.removeWatchedFolder('${folder}')" title="Remove">×</button>
          </div>
        </div>
      `).join('');
    } catch (error) {
      console.error('Error loading watched folders:', error);
      this.showNotification('Error loading watched folders', 'error');
    }
  }

  async scanFolder(folderPath) {
    try {
      this.showNotification('Scanning folder...', 'info');
      const result = await window.electronAPI.scanFolder(folderPath);
      
      if (result.success) {
        const message = `Scan complete: ${result.added} songs added${result.errors > 0 ? `, ${result.errors} errors` : ''}`;
        this.showNotification(message, 'success');
        await this.loadData(); // Refresh songs
      } else {
        this.showNotification(`Scan error: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Error scanning folder:', error);
      this.showNotification('Error scanning folder', 'error');
    }
  }

  // Notification system
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    notification.innerHTML = `
      <div class="notification-content">${message}</div>
      <button class="notification-close">×</button>
    `;

    this.notificationContainer.appendChild(notification);

    // Show notification with animation
    setTimeout(() => notification.classList.add('show'), 100);

    // Close button handler
    notification.querySelector('.notification-close').addEventListener('click', () => {
      this.hideNotification(notification);
    });

    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        this.hideNotification(notification);
      }
    }, 5000);
  }

  hideNotification(notification) {
    notification.classList.remove('show');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }

  // Bulk import progress methods
  showBulkImportProgress(data) {
    const title = data.isInitialScan ? 'Scanning folder...' : 'Importing music files...';
    this.progressTitle.textContent = title;
    this.progressText.textContent = 'Starting import...';
    this.progressNumbers.textContent = `0 / ${data.total}`;
    this.importProgressBar.style.width = '0%';
    this.bulkImportProgress.classList.add('show');
  }

  updateBulkImportProgress(data) {
    const progress = (data.processed / data.total) * 100;
    this.importProgressBar.style.width = `${progress}%`;
    this.progressNumbers.textContent = `${data.processed} / ${data.total}`;
    
    let statusText = [];
    if (data.added > 0) statusText.push(`${data.added} new`);
    if (data.duplicates > 0) statusText.push(`${data.duplicates} existing`);
    if (data.errors > 0) statusText.push(`${data.errors} error${data.errors !== 1 ? 's' : ''}`);
    
    this.progressText.textContent = statusText.length > 0 ? statusText.join(', ') : 'Processing...';
  }

  completeBulkImport(data) {
    this.importProgressBar.style.width = '100%';
    this.progressText.textContent = 'Import complete!';
    
    // Show completion notification only if there were actual changes or real errors
    if (data.added > 0 || data.errors > 0) {
      let message = '';
      
      if (data.added > 0) {
        message = `Import complete: ${data.added} new song${data.added !== 1 ? 's' : ''} added`;
      } else {
        message = 'Import complete: No new songs found';
      }
      
      if (data.duplicates > 0) {
        message += `, ${data.duplicates} already in library`;
      }
      
      if (data.errors > 0) {
        message += `, ${data.errors} error${data.errors !== 1 ? 's' : ''}`;
      }
      
      // Only show notification if something happened
      const notificationType = data.errors > 0 ? 'info' : (data.added > 0 ? 'success' : 'info');
      this.showNotification(message, notificationType);
    }
    
    // Refresh song list only if songs were actually added
    if (data.added > 0) {
      this.loadData();
    }
    
    // Hide progress after a short delay
    setTimeout(() => {
      this.hideBulkImportProgress();
    }, 2000);
  }

  hideBulkImportProgress() {
    this.bulkImportProgress.classList.remove('show');
  }

  // Utility methods
  formatDuration(seconds) {
    if (!seconds || !isFinite(seconds)) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}

// Initialize the music player when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.musicPlayer = new MusicPlayer();
});