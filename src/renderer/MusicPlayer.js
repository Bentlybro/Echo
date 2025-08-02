class MusicPlayer {
  constructor() {
    this.songs = [];
    this.likedSongs = [];
    this.playlists = [];
    this.recentlyPlayed = [];
    this.recentlyAdded = [];
    this.mostPlayed = [];
    this.currentView = 'all-songs';
    this.currentPlaylist = null;
    this.searchQuery = '';
    this.filteredSongs = [];
    this.contextMenuSong = null;
    
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
    this.searchInput = document.getElementById('search-input');
    this.clearSearchBtn = document.getElementById('clear-search-btn');
    this.contextMenu = document.getElementById('song-context-menu');
    this.contextArtistName = document.getElementById('context-artist-name');
    this.contextAlbumName = document.getElementById('context-album-name');
    this.contextLikeText = document.getElementById('context-like-text');
  }

  initializeServices() {
    this.notificationService = new NotificationService();
    this.progressService = new ProgressService();
    this.settingsManager = new SettingsManager();
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
    
    // Search functionality
    this.searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
    this.clearSearchBtn.addEventListener('click', () => this.clearSearch());
    
    // Context menu functionality
    this.setupContextMenu();
    
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => this.handleNavigation(e));
    });
  }

  async loadData() {
    await this.loadSongs();
    await this.loadLikedSongs();
    await this.loadPlaylists();
    await this.loadSmartPlaylists();
    this.renderCurrentView();
    this.setupEventListeners();
    this.setupMediaKeys();
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

  async loadLikedSongs() {
    try {
      this.likedSongs = await window.electronAPI.getLikedSongs();
      console.log('Loaded liked songs:', this.likedSongs.length);
    } catch (error) {
      console.error('Error loading liked songs:', error);
      this.likedSongs = [];
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

  async loadSmartPlaylists() {
    try {
      this.recentlyPlayed = await window.electronAPI.getRecentlyPlayed();
      const smartPlaylists = await window.electronAPI.getSmartPlaylists();
      this.recentlyAdded = smartPlaylists.recentlyAdded || [];
      this.mostPlayed = smartPlaylists.mostPlayed || [];
      console.log('Loaded smart playlists - Recently Played:', this.recentlyPlayed.length, 
                  'Recently Added:', this.recentlyAdded.length, 'Most Played:', this.mostPlayed.length);
    } catch (error) {
      console.error('Error loading smart playlists:', error);
      this.recentlyPlayed = [];
      this.recentlyAdded = [];
      this.mostPlayed = [];
    }
  }

  getCurrentSongs() {
    let baseSongs;
    switch (this.currentView) {
      case 'all-songs':
        baseSongs = this.songs;
        break;
      case 'liked-songs':
        baseSongs = this.likedSongs;
        break;
      case 'recently-played':
        baseSongs = this.recentlyPlayed;
        break;
      case 'recently-added':
        baseSongs = this.recentlyAdded;
        break;
      case 'most-played':
        baseSongs = this.mostPlayed;
        break;
      case 'artists':
        baseSongs = this.getArtistViewSongs();
        break;
      case 'albums':
        baseSongs = this.getAlbumViewSongs();
        break;
      default:
        if (this.currentPlaylist) {
          baseSongs = this.currentPlaylist.songs || [];
        } else {
          baseSongs = this.songs;
        }
    }
    
    // Apply search filter if there's a search query
    if (this.searchQuery) {
      return this.filterSongs(baseSongs, this.searchQuery);
    }
    
    return baseSongs;
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
    // Get the nav item element (might be the target or its parent)
    const navItem = e.target.closest('.nav-item');
    if (!navItem) return;
    
    const view = navItem.dataset.view;
    if (!view) return;

    this.currentView = view;
    this.currentPlaylist = null;
    
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    navItem.classList.add('active');
    
    switch (view) {
      case 'all-songs':
        this.currentViewTitle.textContent = 'All Songs';
        break;
      case 'liked-songs':
        this.currentViewTitle.textContent = 'Liked Songs';
        break;
      case 'recently-played':
        this.currentViewTitle.textContent = 'Recently Played';
        break;
      case 'recently-added':
        this.currentViewTitle.textContent = 'Recently Added';
        break;
      case 'most-played':
        this.currentViewTitle.textContent = 'Most Played';
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

  async toggleLikeSong(songId) {
    try {
      const result = await window.electronAPI.toggleLikeSong(songId);
      if (result.success) {
        // Update the song in the main songs array
        const songIndex = this.songs.findIndex(s => s.id === songId);
        if (songIndex !== -1) {
          this.songs[songIndex].is_liked = result.isLiked ? 1 : 0;
          this.songs[songIndex].liked_date = result.likedDate;
        }
        
        // Reload liked songs and refresh views
        await this.loadLikedSongs();
        this.renderCurrentView();
        
        const message = result.isLiked ? 'Song added to liked songs' : 'Song removed from liked songs';
        this.notificationService.showNotification(message, 'success');
      } else {
        this.notificationService.showNotification('Error updating song', 'error');
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      this.notificationService.showNotification('Error updating song', 'error');
    }
  }

  handleSearch(query) {
    this.searchQuery = query.trim();
    this.updateSearchUI();
    this.renderCurrentView();
  }

  filterSongs(songs, query) {
    if (!query) return songs;
    
    const lowerQuery = query.toLowerCase();
    return songs.filter(song => {
      return (
        song.title.toLowerCase().includes(lowerQuery) ||
        song.artist.toLowerCase().includes(lowerQuery) ||
        song.album.toLowerCase().includes(lowerQuery)
      );
    });
  }

  clearSearch() {
    this.searchInput.value = '';
    this.searchQuery = '';
    this.updateSearchUI();
    this.renderCurrentView();
  }

  updateSearchUI() {
    if (this.searchQuery) {
      this.clearSearchBtn.classList.add('show');
    } else {
      this.clearSearchBtn.classList.remove('show');
    }
  }

  // Artists/Albums view methods
  getArtistViewSongs() {
    // Group songs by artist and return them in artist order
    const artistGroups = {};
    this.songs.forEach(song => {
      const artist = song.artist || 'Unknown Artist';
      if (!artistGroups[artist]) {
        artistGroups[artist] = [];
      }
      artistGroups[artist].push(song);
    });

    // Sort artists alphabetically and flatten songs
    const sortedArtists = Object.keys(artistGroups).sort();
    const result = [];
    sortedArtists.forEach(artist => {
      // Sort songs within each artist by album, then by title
      const artistSongs = artistGroups[artist].sort((a, b) => {
        const albumCompare = (a.album || '').localeCompare(b.album || '');
        if (albumCompare !== 0) return albumCompare;
        return (a.title || '').localeCompare(b.title || '');
      });
      result.push(...artistSongs);
    });

    return result;
  }

  getAlbumViewSongs() {
    // Group songs by album and return them in album order
    const albumGroups = {};
    this.songs.forEach(song => {
      const album = song.album || 'Unknown Album';
      if (!albumGroups[album]) {
        albumGroups[album] = [];
      }
      albumGroups[album].push(song);
    });

    // Sort albums alphabetically and flatten songs
    const sortedAlbums = Object.keys(albumGroups).sort();
    const result = [];
    sortedAlbums.forEach(album => {
      // Sort songs within each album by track number if available, then by title
      const albumSongs = albumGroups[album].sort((a, b) => {
        return (a.title || '').localeCompare(b.title || '');
      });
      result.push(...albumSongs);
    });

    return result;
  }

  // Context menu methods
  setupContextMenu() {
    // Hide context menu when clicking elsewhere
    document.addEventListener('click', (e) => {
      if (!this.contextMenu.contains(e.target)) {
        this.hideContextMenu();
      }
    });

    // Context menu event listeners
    document.getElementById('context-play-song').addEventListener('click', () => {
      if (this.contextMenuSong) {
        this.playSong(this.contextMenuSong.id);
        this.hideContextMenu();
      }
    });

    document.getElementById('context-play-next').addEventListener('click', () => {
      if (this.contextMenuSong) {
        window.audioPlayer.playNext(this.contextMenuSong);
        this.notificationService.showNotification(`"${this.contextMenuSong.title}" will play next`, 'success');
        this.hideContextMenu();
      }
    });

    document.getElementById('context-add-to-queue').addEventListener('click', () => {
      if (this.contextMenuSong) {
        window.audioPlayer.addToQueue(this.contextMenuSong);
        this.notificationService.showNotification(`"${this.contextMenuSong.title}" added to queue`, 'success');
        this.hideContextMenu();
      }
    });

    document.getElementById('context-search-artist').addEventListener('click', () => {
      if (this.contextMenuSong) {
        this.searchByArtist(this.contextMenuSong.artist);
        this.hideContextMenu();
      }
    });

    document.getElementById('context-search-album').addEventListener('click', () => {
      if (this.contextMenuSong) {
        this.searchByAlbum(this.contextMenuSong.album);
        this.hideContextMenu();
      }
    });

    document.getElementById('context-like-song').addEventListener('click', () => {
      if (this.contextMenuSong) {
        this.toggleLikeSong(this.contextMenuSong.id);
        this.hideContextMenu();
      }
    });

    document.getElementById('context-delete-song').addEventListener('click', () => {
      if (this.contextMenuSong) {
        this.deleteSong(this.contextMenuSong.id);
        this.hideContextMenu();
      }
    });

    // Prevent context menu from showing on right-click of context menu itself
    this.contextMenu.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
  }

  showContextMenu(e, song) {
    e.preventDefault();
    this.contextMenuSong = song;

    // Update context menu content
    this.contextArtistName.textContent = song.artist || 'Unknown Artist';
    this.contextAlbumName.textContent = song.album || 'Unknown Album';
    this.contextLikeText.textContent = song.is_liked ? 'Unlike Song' : 'Like Song';

    // Position context menu
    const rect = document.body.getBoundingClientRect();
    const menuWidth = 200;
    const menuHeight = 200;

    let x = e.clientX;
    let y = e.clientY;

    // Adjust position if menu would go off-screen
    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - 10;
    }
    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight - 10;
    }

    this.contextMenu.style.left = `${x}px`;
    this.contextMenu.style.top = `${y}px`;
    this.contextMenu.classList.add('show');
  }

  hideContextMenu() {
    this.contextMenu.classList.remove('show');
    this.contextMenuSong = null;
  }

  searchByArtist(artist) {
    if (!artist || artist === 'Unknown Artist') return;
    this.searchInput.value = artist;
    this.handleSearch(artist);
  }

  searchByAlbum(album) {
    if (!album || album === 'Unknown Album') return;
    this.searchInput.value = album;
    this.handleSearch(album);
  }

  setupMediaKeys() {
    // Register media keys
    window.electronAPI.registerMediaKeys();

    // Listen for media key events
    window.electronAPI.onMediaKeyPlayPause(() => {
      if (window.audioPlayer) {
        window.audioPlayer.togglePlayPause();
      }
    });

    window.electronAPI.onMediaKeyNext(() => {
      if (window.audioPlayer) {
        window.audioPlayer.nextTrack();
      }
    });

    window.electronAPI.onMediaKeyPrevious(() => {
      if (window.audioPlayer) {
        window.audioPlayer.previousTrack();
      }
    });

    console.log('Media keys setup complete');
  }

  async showOverlayNotification(song) {
    try {
      // Get album art data for the overlay
      let albumArtData = null;
      let albumArtFormat = null;

      try {
        const albumArtResult = await window.electronAPI.getAlbumArt(song.id);
        if (albumArtResult.success && albumArtResult.data) {
          albumArtData = Array.from(albumArtResult.data);
          albumArtFormat = albumArtResult.format;
        }
      } catch (albumArtError) {
        console.log('No album art available for overlay');
      }

      const songData = {
        title: song.title,
        artist: song.artist,
        album: song.album,
        albumArtData: albumArtData,
        albumArtFormat: albumArtFormat
      };

      await window.electronAPI.showOverlayNotification(songData);
    } catch (error) {
      console.error('Error showing overlay notification:', error);
    }
  }

  async trackSongPlay(songId) {
    try {
      await window.electronAPI.trackSongPlay(songId);
      // Reload recently played list
      this.recentlyPlayed = await window.electronAPI.getRecentlyPlayed();
    } catch (error) {
      console.error('Error tracking song play:', error);
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MusicPlayer;
} else {
  window.MusicPlayer = MusicPlayer;
}