class MusicPlayer {
  constructor() {
    this.songs = [];
    this.playlists = [];
    this.currentView = 'all-songs';
    this.currentPlaylist = null;
    
    this.initializeElements();
    this.initializeServices();
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
  }

  initializeServices() {
    this.notificationService = new NotificationService();
    this.progressService = new ProgressService();
    this.songRenderer = new SongRenderer(this.songList, this.songCount);
    this.playlistManager = new PlaylistManager(
      this.playlistsList, 
      this.playlistModal, 
      this.playlistNameInput
    );
    this.folderManager = new FolderManager(
      this.foldersModal, 
      this.watchedFoldersList, 
      this.notificationService
    );
    this.dragDropHandler = new DragDropHandler(this.dropZone, this);
  }

  bindEvents() {
    this.addMusicBtn.addEventListener('click', () => this.showOpenDialog());
    this.manageFoldersBtn.addEventListener('click', () => this.folderManager.showFoldersModal());
    this.playAllBtn.addEventListener('click', () => this.playAllSongs());
    this.createPlaylistBtn.addEventListener('click', () => this.playlistManager.showPlaylistModal());
    
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => this.handleNavigation(e));
    });
  }

  async loadData() {
    await this.loadSongs();
    await this.loadPlaylists();
    this.renderCurrentView();
    this.setupEventListeners();
  }

  setupEventListeners() {
    window.electronAPI.onSongAdded((event, filePath) => {
      this.loadData();
    });

    window.electronAPI.onSongsBatchAdded((event, filePaths) => {
      this.loadData();
    });

    window.electronAPI.onNotification((event, notification) => {
      this.notificationService.showNotification(notification.message, notification.type);
    });

    window.electronAPI.onBulkImportStart((event, data) => {
      this.progressService.showBulkImportProgress(data);
    });

    window.electronAPI.onBulkImportProgress((event, data) => {
      this.progressService.updateBulkImportProgress(data);
    });

    window.electronAPI.onBulkImportComplete((event, data) => {
      this.progressService.completeBulkImport(data);
      if (data.added > 0) {
        this.loadData();
      }
    });
  }

  async loadSongs() {
    try {
      this.songs = await window.electronAPI.getAllSongs();
      console.log('Loaded songs:', this.songs.length);
    } catch (error) {
      console.error('Error loading songs:', error);
      this.songs = [];
    }
  }

  async loadPlaylists() {
    try {
      this.playlists = await window.electronAPI.getPlaylists();
      this.playlistManager.renderPlaylists(this.playlists);
      console.log('Loaded playlists:', this.playlists.length);
    } catch (error) {
      console.error('Error loading playlists:', error);
      this.playlists = [];
    }
  }

  getCurrentSongs() {
    switch (this.currentView) {
      case 'all-songs':
        return this.songs;
      case 'artists':
        return this.songs;
      case 'albums':
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
    this.songRenderer.renderSongs(songs);
    this.songRenderer.updateSongCount(songs.length);
  }

  showPlaylist(playlistId) {
    this.currentPlaylist = this.playlistManager.getPlaylistById(playlistId);
    if (this.currentPlaylist) {
      this.currentView = 'playlist';
      this.currentViewTitle.textContent = this.currentPlaylist.name;
      
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
    
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    e.target.classList.add('active');
    
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
      await this.loadData();
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
        await this.loadData();
        console.log('Song deleted successfully');
      } else {
        console.error('Error deleting song:', result.error);
      }
    } catch (error) {
      console.error('Error deleting song:', error);
    }
  }

  async scanFolder(folderPath) {
    await this.folderManager.scanFolder(folderPath);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MusicPlayer;
} else {
  window.MusicPlayer = MusicPlayer;
}