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
    this.loadAlbumThumbnails(songs);
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
        <div class="song-thumbnail">
          <div class="album-thumbnail" data-song-id="${song.id}">
            <i data-lucide="music" class="thumbnail-placeholder"></i>
          </div>
        </div>
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

  async loadAlbumThumbnails(songs) {
    // Load thumbnails in batches to avoid overwhelming the system
    const batchSize = 10;
    for (let i = 0; i < songs.length; i += batchSize) {
      const batch = songs.slice(i, i + batchSize);
      
      // Process batch with small delay to prevent UI blocking
      setTimeout(async () => {
        await Promise.all(batch.map(song => this.loadSingleThumbnail(song)));
      }, Math.floor(i / batchSize) * 50); // 50ms delay between batches
    }
  }

  async loadSingleThumbnail(song) {
    try {
      const thumbnailEl = document.querySelector(`.album-thumbnail[data-song-id="${song.id}"]`);
      if (!thumbnailEl) return;

      const result = await window.electronAPI.getAlbumArt(song.id);
      if (result.success && result.data) {
        const blob = new Blob([result.data], { type: result.format });
        const imageUrl = URL.createObjectURL(blob);
        
        // Create image element and handle loading
        const img = new Image();
        img.onload = () => {
          thumbnailEl.style.backgroundImage = `url(${imageUrl})`;
          thumbnailEl.style.backgroundSize = 'cover';
          thumbnailEl.style.backgroundPosition = 'center';
          thumbnailEl.style.backgroundRepeat = 'no-repeat';
          
          // Hide the placeholder icon
          const placeholder = thumbnailEl.querySelector('.thumbnail-placeholder');
          if (placeholder) {
            placeholder.style.display = 'none';
          }
        };
        
        img.onerror = () => {
          // Clean up the blob URL if image fails to load
          URL.revokeObjectURL(imageUrl);
        };
        
        img.src = imageUrl;
      }
    } catch (error) {
      console.error('Error loading album thumbnail:', error);
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SongRenderer;
} else {
  window.SongRenderer = SongRenderer;
}