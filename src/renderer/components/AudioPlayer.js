class AudioPlayer {
  constructor() {
    this.audio = document.getElementById('audio-player');
    this.currentSong = null;
    this.playlist = [];
    this.currentIndex = -1;
    this.isPlaying = false;
    this.isShuffle = false;
    this.isRepeat = false;
    this.volume = 1.0;
    this.currentAlbumArtUrl = null;
    
    this.initializeElements();
    this.bindEvents();
  }

  initializeElements() {
    this.playPauseBtn = document.getElementById('play-pause-btn');
    this.prevBtn = document.getElementById('prev-btn');
    this.nextBtn = document.getElementById('next-btn');
    this.progressBarContainer = document.querySelector('.progress-bar-container');
    this.progressBarFill = document.getElementById('progress-bar-fill');
    this.progressBarThumb = document.getElementById('progress-bar-thumb');
    this.volumeBar = document.getElementById('volume-bar');
    this.muteBtn = document.getElementById('mute-btn');
    this.volumePercentageEl = document.getElementById('volume-percentage');
    this.currentTimeEl = document.getElementById('current-time');
    this.totalTimeEl = document.getElementById('total-time');
    this.currentTitleEl = document.getElementById('current-title');
    this.currentArtistEl = document.getElementById('current-artist');
    this.shuffleBtn = document.getElementById('shuffle-btn');
  }

  bindEvents() {
    // Playback controls
    this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
    this.prevBtn.addEventListener('click', () => this.previousTrack());
    this.nextBtn.addEventListener('click', () => this.nextTrack());
    
    // Progress and volume
    this.progressBarContainer.addEventListener('click', (e) => this.handleProgressClick(e));
    this.progressBarContainer.addEventListener('mousemove', (e) => this.handleProgressHover(e));
    this.volumeBar.addEventListener('input', (e) => this.setVolume(e.target.value / 100));
    this.muteBtn.addEventListener('click', () => this.toggleMute());
    
    // Shuffle
    this.shuffleBtn.addEventListener('click', () => this.toggleShuffle());
    
    // Audio events
    this.audio.addEventListener('loadedmetadata', () => this.onLoadedMetadata());
    this.audio.addEventListener('timeupdate', () => this.onTimeUpdate());
    this.audio.addEventListener('ended', () => this.onTrackEnded());
    this.audio.addEventListener('error', (e) => this.onError(e));
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));
  }

  loadSong(song, playlist = [], index = -1) {
    this.currentSong = song;
    this.playlist = playlist;
    this.currentIndex = index;
    
    this.audio.src = `file://${song.file_path}`;
    this.updateNowPlaying();
    this.updatePlayingState();
  }

  async updateNowPlaying() {
    if (this.currentSong) {
      this.currentTitleEl.textContent = this.currentSong.title;
      this.currentArtistEl.textContent = this.currentSong.artist;
      await this.updateAlbumArt();
    } else {
      this.currentTitleEl.textContent = 'No song selected';
      this.currentArtistEl.textContent = '-';
      this.clearAlbumArt();
    }
  }

  async updateAlbumArt() {
    const albumArtEl = document.querySelector('.album-placeholder');
    if (!albumArtEl) return;

    try {
      const result = await window.electronAPI.getAlbumArt(this.currentSong.id);
      if (result.success && result.data) {
        const blob = new Blob([result.data], { type: result.format });
        const imageUrl = URL.createObjectURL(blob);
        
        albumArtEl.style.backgroundImage = `url(${imageUrl})`;
        albumArtEl.style.backgroundSize = 'cover';
        albumArtEl.style.backgroundPosition = 'center';
        albumArtEl.style.backgroundRepeat = 'no-repeat';
        
        // Clean up previous URL if exists
        if (this.currentAlbumArtUrl) {
          URL.revokeObjectURL(this.currentAlbumArtUrl);
        }
        this.currentAlbumArtUrl = imageUrl;
      } else {
        this.clearAlbumArt();
      }
    } catch (error) {
      console.error('Error loading album art:', error);
      this.clearAlbumArt();
    }
  }

  clearAlbumArt() {
    const albumArtEl = document.querySelector('.album-placeholder');
    if (albumArtEl) {
      albumArtEl.style.backgroundImage = '';
      albumArtEl.style.backgroundSize = '';
      albumArtEl.style.backgroundPosition = '';
      albumArtEl.style.backgroundRepeat = '';
    }
    
    if (this.currentAlbumArtUrl) {
      URL.revokeObjectURL(this.currentAlbumArtUrl);
      this.currentAlbumArtUrl = null;
    }
  }

  updatePlayingState() {
    // Update all song items in the list
    document.querySelectorAll('.song-item').forEach(item => {
      item.classList.remove('playing');
      if (this.currentSong && item.dataset.songId == this.currentSong.id) {
        item.classList.add('playing');
      }
    });
  }

  async togglePlayPause() {
    if (!this.currentSong) return;

    try {
      if (this.isPlaying) {
        await this.pause();
      } else {
        await this.play();
      }
    } catch (error) {
      console.error('Error toggling playback:', error);
    }
  }

  async play() {
    try {
      await this.audio.play();
      this.isPlaying = true;
      this.playPauseBtn.className = 'control-btn play-btn';
      this.playPauseBtn.innerHTML = '<i data-lucide="pause"></i>';
      lucide.createIcons();
      
      // Update play count in database
      if (this.currentSong) {
        // Note: This would need to be implemented in the database
        console.log(`Playing: ${this.currentSong.title}`);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      this.isPlaying = false;
      this.playPauseBtn.className = 'control-btn play-btn';
      this.playPauseBtn.innerHTML = '<i data-lucide="play"></i>';
      lucide.createIcons();
    }
  }

  async pause() {
    this.audio.pause();
    this.isPlaying = false;
    this.playPauseBtn.className = 'control-btn play-btn';
    this.playPauseBtn.innerHTML = '<i data-lucide="play"></i>';
    lucide.createIcons();
  }

  previousTrack() {
    if (this.playlist.length === 0) return;
    
    let newIndex;
    if (this.isShuffle) {
      newIndex = Math.floor(Math.random() * this.playlist.length);
    } else {
      newIndex = this.currentIndex > 0 ? this.currentIndex - 1 : this.playlist.length - 1;
    }
    
    const song = this.playlist[newIndex];
    this.loadSong(song, this.playlist, newIndex);
    
    if (this.isPlaying) {
      this.play();
    }
  }

  nextTrack() {
    if (this.playlist.length === 0) return;
    
    let newIndex;
    if (this.isShuffle) {
      newIndex = Math.floor(Math.random() * this.playlist.length);
    } else {
      newIndex = this.currentIndex < this.playlist.length - 1 ? this.currentIndex + 1 : 0;
    }
    
    const song = this.playlist[newIndex];
    this.loadSong(song, this.playlist, newIndex);
    
    if (this.isPlaying) {
      this.play();
    }
  }

  handleProgressClick(e) {
    if (!this.audio.duration) return;
    
    const rect = this.progressBarContainer.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = (clickX / rect.width) * 100;
    const clampedPercentage = Math.max(0, Math.min(100, percentage));
    
    this.audio.currentTime = (clampedPercentage / 100) * this.audio.duration;
    this.updateProgressBar(clampedPercentage);
  }

  handleProgressHover(e) {
    if (!this.audio.duration) return;
    
    const rect = this.progressBarContainer.getBoundingClientRect();
    const hoverX = e.clientX - rect.left;
    const percentage = (hoverX / rect.width) * 100;
    const clampedPercentage = Math.max(0, Math.min(100, percentage));
    
    // Update thumb position on hover
    this.progressBarThumb.style.left = `${clampedPercentage}%`;
  }

  updateProgressBar(percentage) {
    this.progressBarFill.style.width = `${percentage}%`;
    this.progressBarThumb.style.left = `${percentage}%`;
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    this.audio.volume = this.volume;
    this.volumeBar.value = this.volume * 100;
    this.volumePercentageEl.textContent = Math.round(this.volume * 100) + '%';
    
    // Update mute button icon based on volume level
    const muteIcon = this.muteBtn.querySelector('i');
    if (this.volume === 0) {
      muteIcon.setAttribute('data-lucide', 'volume-x');
    } else if (this.volume < 0.5) {
      muteIcon.setAttribute('data-lucide', 'volume-1');
    } else {
      muteIcon.setAttribute('data-lucide', 'volume-2');
    }
    lucide.createIcons();
  }

  toggleMute() {
    if (this.audio.volume === 0) {
      this.setVolume(this.volume > 0 ? this.volume : 0.5);
    } else {
      this.audio.volume = 0;
    }
  }

  toggleShuffle() {
    this.isShuffle = !this.isShuffle;
    this.shuffleBtn.classList.toggle('active', this.isShuffle);
    this.shuffleBtn.style.color = this.isShuffle ? '#667eea' : '#718096';
  }

  onLoadedMetadata() {
    if (this.audio.duration) {
      this.totalTimeEl.textContent = this.formatTime(this.audio.duration);
      this.updateProgressBar(0);
    }
  }

  onTimeUpdate() {
    if (this.audio.duration) {
      const progress = (this.audio.currentTime / this.audio.duration) * 100;
      this.updateProgressBar(progress);
      this.currentTimeEl.textContent = this.formatTime(this.audio.currentTime);
    }
  }

  onTrackEnded() {
    if (this.isRepeat) {
      this.audio.currentTime = 0;
      this.play();
    } else {
      this.nextTrack();
    }
  }

  onError(error) {
    console.error('Audio error:', error);
    this.isPlaying = false;
    this.playPauseBtn.className = 'control-btn play-btn';
    this.playPauseBtn.innerHTML = '<i data-lucide="play"></i>';
    lucide.createIcons();
    
    // Show error message to user
    const errorMsg = 'Error playing audio file. The file may be corrupted or in an unsupported format.';
    // You could implement a toast notification here
    console.error(errorMsg);
  }

  handleKeyboard(event) {
    // Only handle keyboard shortcuts when not typing in an input
    if (event.target.tagName === 'INPUT') return;
    
    switch (event.code) {
      case 'Space':
        event.preventDefault();
        this.togglePlayPause();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        this.previousTrack();
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.nextTrack();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.setVolume(Math.min(1, this.volume + 0.1));
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.setVolume(Math.max(0, this.volume - 0.1));
        break;
    }
  }

  formatTime(seconds) {
    if (!seconds || !isFinite(seconds)) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  // Public methods for external control
  playPlaylist(songs, startIndex = 0) {
    if (songs.length === 0) return;
    
    this.playlist = songs;
    this.currentIndex = startIndex;
    this.loadSong(songs[startIndex], songs, startIndex);
    this.play();
  }

  getCurrentSong() {
    return this.currentSong;
  }

  getPlaylist() {
    return this.playlist;
  }

  getCurrentIndex() {
    return this.currentIndex;
  }

  isCurrentlyPlaying() {
    return this.isPlaying;
  }
}

// Initialize the audio player
window.audioPlayer = new AudioPlayer();