class PlaylistManager {
  constructor(playlistsList, playlistModal, playlistNameInput) {
    this.playlistsList = playlistsList;
    this.playlistModal = playlistModal;
    this.playlistNameInput = playlistNameInput;
    this.playlists = [];
    
    this.bindEvents();
  }

  bindEvents() {
    document.getElementById('create-playlist-confirm-btn').addEventListener('click', () => this.createPlaylist());
    document.getElementById('cancel-playlist-btn').addEventListener('click', () => this.hidePlaylistModal());
    document.querySelector('.modal-close').addEventListener('click', () => this.hidePlaylistModal());
    
    this.playlistModal.addEventListener('click', (e) => {
      if (e.target === this.playlistModal) {
        this.hidePlaylistModal();
      }
    });
    
    this.playlistNameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.createPlaylist();
      }
    });
  }

  renderPlaylists(playlists) {
    this.playlists = playlists;
    this.playlistsList.innerHTML = playlists.map(playlist => `
      <li>
        <a href="#" class="nav-item" data-playlist-id="${playlist.id}">
          ${playlist.name} (${playlist.songs ? playlist.songs.length : 0})
        </a>
      </li>
    `).join('');

    document.querySelectorAll('[data-playlist-id]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const playlistId = parseInt(item.dataset.playlistId);
        window.musicPlayer.showPlaylist(playlistId);
      });
    });
  }

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
        await window.musicPlayer.loadPlaylists();
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

  getPlaylistById(id) {
    return this.playlists.find(p => p.id === id);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PlaylistManager;
} else {
  window.PlaylistManager = PlaylistManager;
}