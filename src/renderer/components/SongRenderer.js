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
    return `
      <div class="song-item" data-song-id="${song.id}">
        <div class="song-title" title="${song.title}">${song.title}</div>
        <div class="song-artist" title="${song.artist}">${song.artist}</div>
        <div class="song-album" title="${song.album}">${song.album}</div>
        <div class="song-duration">${window.Formatters.formatDuration(song.duration)}</div>
        <div class="song-actions">
          <button class="btn btn-icon icon-play" onclick="musicPlayer.playSong(${song.id})" title="Play"></button>
          <button class="btn btn-icon btn-danger icon-delete" onclick="musicPlayer.deleteSong(${song.id})" title="Delete"></button>
        </div>
      </div>
    `;
  }

  bindSongEvents() {
    document.querySelectorAll('.song-item').forEach(item => {
      item.addEventListener('dblclick', () => {
        const songId = parseInt(item.dataset.songId);
        window.musicPlayer.playSong(songId);
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