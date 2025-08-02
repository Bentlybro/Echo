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
    const heartClass = song.is_liked ? 'liked' : '';
    const heartIcon = song.is_liked ? '♥' : '♡';
    
    return `
      <div class="song-item" data-song-id="${song.id}">
        <div class="song-info">
          <div class="song-title" title="${song.title}">${song.title}</div>
          <div class="song-artist" title="${song.artist}">${song.artist}</div>
        </div>
        <div class="song-album" title="${song.album}">${song.album}</div>
        <div class="song-duration">${window.Formatters.formatDuration(song.duration)}</div>
        <div class="song-actions">
          <div class="song-like ${heartClass}" data-action="like" data-song-id="${song.id}" title="${song.is_liked ? 'Unlike' : 'Like'}">
            ${heartIcon}
          </div>
          <button class="action-btn delete-btn" data-action="delete" data-song-id="${song.id}" title="Delete">
            ×
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

      // Handle right-click for context menu
      item.addEventListener('contextmenu', (e) => {
        const songId = parseInt(item.dataset.songId);
        const song = window.musicPlayer.songs.find(s => s.id === songId) || 
                     window.musicPlayer.likedSongs.find(s => s.id === songId);
        if (song) {
          window.musicPlayer.showContextMenu(e, song);
        }
      });
    });

    // Handle clicks on song items using event delegation
    document.querySelectorAll('.song-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const target = e.target.closest('[data-action]');
        if (!target) return;
        
        e.stopPropagation();
        
        const action = target.dataset.action;
        const songId = parseInt(target.dataset.songId);
        
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