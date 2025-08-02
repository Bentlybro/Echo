class SongRenderer {
  constructor(songList, songCount) {
    this.songList = songList;
    this.songCount = songCount;
  }

  renderSongs(songs) {
    if (songs.length === 0) {
      this.renderEmptyState();
      return;
    }

    this.songList.innerHTML = songs.map(song => this.createSongItemHTML(song)).join('');
    this.bindSongEvents();
    
    // Initialize Lucide icons for the new elements
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  renderEmptyState() {
    this.songList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon"></div>
        <h3>No songs found</h3>
        <p>Add some music to get started!</p>
        <button class="btn btn-primary" onclick="musicPlayer.showOpenDialog()">Add Music</button>
      </div>
    `;
  }

  createSongItemHTML(song) {
    const heartIcon = song.is_liked ? 'heart' : 'heart';
    const heartClass = song.is_liked ? 'btn-liked' : '';
    
    return `
      <div class="song-item" data-song-id="${song.id}">
        <div class="song-title" title="${song.title}">${song.title}</div>
        <div class="song-artist" title="${song.artist}">${song.artist}</div>
        <div class="song-album" title="${song.album}">${song.album}</div>
        <div class="song-duration">${window.Formatters.formatDuration(song.duration)}</div>
        <div class="song-actions">
          <button class="btn btn-icon like-btn ${heartClass}" data-action="like" data-song-id="${song.id}" title="${song.is_liked ? 'Unlike' : 'Like'}">
            <i data-lucide="${heartIcon}"></i>
          </button>
          <button class="btn btn-icon" data-action="play" data-song-id="${song.id}" title="Play">
            <i data-lucide="play"></i>
          </button>
          <button class="btn btn-icon btn-danger" data-action="delete" data-song-id="${song.id}" title="Delete">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      </div>
    `;
  }

  bindSongEvents() {
    // Handle double-click to play
    document.querySelectorAll('.song-item').forEach(item => {
      item.addEventListener('dblclick', () => {
        const songId = parseInt(item.dataset.songId);
        window.musicPlayer.playSong(songId);
      });
    });

    // Handle button clicks using event delegation on song-actions containers
    document.querySelectorAll('.song-actions').forEach(actionsContainer => {
      actionsContainer.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Find the button element, whether clicked directly or on a child element
        const button = e.target.closest('[data-action]');
        if (!button) return;
        
        const action = button.dataset.action;
        const songId = parseInt(button.dataset.songId);
        
        switch (action) {
          case 'like':
            window.musicPlayer.toggleLikeSong(songId);
            break;
          case 'play':
            window.musicPlayer.playSong(songId);
            break;
          case 'delete':
            window.musicPlayer.deleteSong(songId);
            break;
        }
      });
    });
  }

  updateSongCount(count) {
    this.songCount.textContent = `${count} song${count !== 1 ? 's' : ''}`;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SongRenderer;
} else {
  window.SongRenderer = SongRenderer;
}