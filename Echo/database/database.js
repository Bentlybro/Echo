const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');
const { parseFile } = require('music-metadata');

class MusicDatabase {
  constructor() {
    try {
      // Use userData directory instead of app directory for production
      const userDataPath = app.getPath('userData');
      console.log('Initializing database in userData path:', userDataPath);
      
      // Ensure the directory exists
      if (!fs.existsSync(userDataPath)) {
        console.log('Creating userData directory...');
        fs.mkdirSync(userDataPath, { recursive: true });
      }
      
      const dbPath = path.join(userDataPath, 'music.db');
      console.log('Database path:', dbPath);
      
      // Check if better-sqlite3 is available
      console.log('Attempting to initialize SQLite database...');
      this.db = new Database(dbPath);
      console.log('Database initialized successfully');
      
      this.init();
      console.log('Database tables created/verified');
      
    } catch (error) {
      console.error('Critical error initializing database:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      
      // Re-throw the error so the app can handle it gracefully
      throw new Error(`Database initialization failed: ${error.message}`);
    }
  }

  init() {
    // Create tables if they don't exist
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS songs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        artist TEXT,
        album TEXT,
        duration REAL,
        file_path TEXT UNIQUE NOT NULL,
        file_size INTEGER,
        album_art BLOB,
        album_art_format TEXT,
        date_added DATETIME DEFAULT CURRENT_TIMESTAMP,
        play_count INTEGER DEFAULT 0,
        last_played DATETIME
      );

      CREATE TABLE IF NOT EXISTS playlists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS playlist_songs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        playlist_id INTEGER,
        song_id INTEGER,
        position INTEGER,
        added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (playlist_id) REFERENCES playlists (id) ON DELETE CASCADE,
        FOREIGN KEY (song_id) REFERENCES songs (id) ON DELETE CASCADE,
        UNIQUE(playlist_id, song_id)
      );

      CREATE TABLE IF NOT EXISTS recently_played (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        song_id INTEGER,
        played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (song_id) REFERENCES songs (id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_songs_artist ON songs(artist);
      CREATE INDEX IF NOT EXISTS idx_songs_album ON songs(album);
      CREATE INDEX IF NOT EXISTS idx_playlist_songs_playlist ON playlist_songs(playlist_id);
      CREATE INDEX IF NOT EXISTS idx_recently_played_song ON recently_played(song_id);
      CREATE INDEX IF NOT EXISTS idx_recently_played_date ON recently_played(played_at);
    `);

    // Migrate existing database to add new columns
    this.migrateDatabase();

    // Create default "All Songs" playlist if it doesn't exist
    const allSongsPlaylist = this.db.prepare('SELECT id FROM playlists WHERE name = ?').get('All Songs');
    if (!allSongsPlaylist) {
      this.db.prepare('INSERT INTO playlists (name) VALUES (?)').run('All Songs');
    }
  }

  migrateDatabase() {
    try {
      // Check if the is_liked column exists
      const tableInfo = this.db.prepare("PRAGMA table_info(songs)").all();
      const hasIsLiked = tableInfo.some(column => column.name === 'is_liked');
      const hasLikedDate = tableInfo.some(column => column.name === 'liked_date');

      if (!hasIsLiked) {
        console.log('Adding is_liked column to songs table...');
        this.db.exec('ALTER TABLE songs ADD COLUMN is_liked INTEGER DEFAULT 0');
      }

      if (!hasLikedDate) {
        console.log('Adding liked_date column to songs table...');
        this.db.exec('ALTER TABLE songs ADD COLUMN liked_date DATETIME');
      }

      console.log('Database migration completed successfully');
    } catch (error) {
      console.error('Error during database migration:', error);
    }
  }

  async addSong(filePath) {
    try {
      // Check if song already exists
      const existingSong = this.db.prepare('SELECT id FROM songs WHERE file_path = ?').get(filePath);
      if (existingSong) {
        return { success: false, duplicate: true };
      }

      // Extract metadata
      const metadata = await parseFile(filePath);
      const stats = fs.statSync(filePath);
      
      // Extract album art
      let albumArt = null;
      let albumArtFormat = null;
      
      if (metadata.common.picture && metadata.common.picture.length > 0) {
        const picture = metadata.common.picture[0];
        albumArt = picture.data;
        albumArtFormat = picture.format;
      }
      
      const songData = {
        title: metadata.common.title || path.basename(filePath, path.extname(filePath)),
        artist: metadata.common.artist || 'Unknown Artist',
        album: metadata.common.album || 'Unknown Album',
        duration: metadata.format.duration || 0,
        file_path: filePath,
        file_size: stats.size,
        album_art: albumArt,
        album_art_format: albumArtFormat
      };

      // Insert song (use INSERT OR IGNORE to handle duplicates gracefully)
      const result = this.db.prepare(`
        INSERT OR IGNORE INTO songs (title, artist, album, duration, file_path, file_size, album_art, album_art_format)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(songData.title, songData.artist, songData.album, songData.duration, songData.file_path, songData.file_size, songData.album_art, songData.album_art_format);

      // If song already exists, return early
      if (result.changes === 0) {
        return { success: false, error: 'Song already exists in library', duplicate: true };
      }

      // Add to "All Songs" playlist
      const allSongsPlaylist = this.db.prepare('SELECT id FROM playlists WHERE name = ?').get('All Songs');
      if (allSongsPlaylist) {
        const maxPosition = this.db.prepare('SELECT MAX(position) as max_pos FROM playlist_songs WHERE playlist_id = ?').get(allSongsPlaylist.id);
        const newPosition = (maxPosition.max_pos || 0) + 1;
        
        this.db.prepare('INSERT INTO playlist_songs (playlist_id, song_id, position) VALUES (?, ?, ?)').run(
          allSongsPlaylist.id, result.lastInsertRowid, newPosition
        );
      }

      return { success: true, songId: result.lastInsertRowid };
    } catch (error) {
      console.error('Error adding song:', error);
      return { success: false, error: error.message };
    }
  }

  getAllSongs() {
    return this.db.prepare(`
      SELECT * FROM songs 
      ORDER BY artist, album, title
    `).all();
  }

  deleteSong(songId) {
    try {
      const result = this.db.prepare('DELETE FROM songs WHERE id = ?').run(songId);
      return { success: true, changes: result.changes };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  getPlaylists() {
    const playlists = this.db.prepare('SELECT * FROM playlists ORDER BY name').all();
    
    return playlists.map(playlist => ({
      ...playlist,
      songs: this.getPlaylistSongs(playlist.id)
    }));
  }

  getPlaylistSongs(playlistId) {
    return this.db.prepare(`
      SELECT s.*, ps.position 
      FROM songs s
      JOIN playlist_songs ps ON s.id = ps.song_id
      WHERE ps.playlist_id = ?
      ORDER BY ps.position
    `).all(playlistId);
  }

  createPlaylist(name) {
    try {
      const result = this.db.prepare('INSERT INTO playlists (name) VALUES (?)').run(name);
      return { success: true, playlistId: result.lastInsertRowid };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  addSongToPlaylist(playlistId, songId) {
    try {
      const maxPosition = this.db.prepare('SELECT MAX(position) as max_pos FROM playlist_songs WHERE playlist_id = ?').get(playlistId);
      const newPosition = (maxPosition.max_pos || 0) + 1;
      
      this.db.prepare('INSERT OR IGNORE INTO playlist_songs (playlist_id, song_id, position) VALUES (?, ?, ?)').run(
        playlistId, songId, newPosition
      );
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  updatePlayCount(songId) {
    this.db.prepare('UPDATE songs SET play_count = play_count + 1, last_played = CURRENT_TIMESTAMP WHERE id = ?').run(songId);
  }

  getAlbumArt(songId) {
    try {
      const result = this.db.prepare('SELECT album_art, album_art_format FROM songs WHERE id = ?').get(songId);
      if (result && result.album_art) {
        return {
          success: true,
          data: result.album_art,
          format: result.album_art_format
        };
      }
      return { success: false, error: 'No album art found' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  toggleLikeSong(songId) {
    try {
      const song = this.db.prepare('SELECT is_liked FROM songs WHERE id = ?').get(songId);
      if (!song) {
        return { success: false, error: 'Song not found' };
      }

      const newLikedState = song.is_liked ? 0 : 1;
      const likedDate = newLikedState ? new Date().toISOString() : null;

      this.db.prepare('UPDATE songs SET is_liked = ?, liked_date = ? WHERE id = ?')
        .run(newLikedState, likedDate, songId);

      return { 
        success: true, 
        isLiked: Boolean(newLikedState),
        likedDate: likedDate
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  getLikedSongs() {
    try {
      const songs = this.db.prepare(`
        SELECT * FROM songs 
        WHERE is_liked = 1 
        ORDER BY liked_date DESC
      `).all();
      
      return songs;
    } catch (error) {
      console.error('Error getting liked songs:', error);
      return [];
    }
  }

  addToRecentlyPlayed(songId) {
    try {
      // Add to recently played
      this.db.prepare('INSERT INTO recently_played (song_id) VALUES (?)').run(songId);
      
      // Keep only the last 100 recently played songs
      this.db.prepare(`
        DELETE FROM recently_played 
        WHERE id NOT IN (
          SELECT id FROM recently_played 
          ORDER BY played_at DESC 
          LIMIT 100
        )
      `).run();
      
      return { success: true };
    } catch (error) {
      console.error('Error adding to recently played:', error);
      return { success: false, error: error.message };
    }
  }

  getRecentlyPlayed(limit = 50) {
    try {
      return this.db.prepare(`
        SELECT DISTINCT s.*, rp.played_at
        FROM songs s
        JOIN recently_played rp ON s.id = rp.song_id
        ORDER BY rp.played_at DESC
        LIMIT ?
      `).all(limit);
    } catch (error) {
      console.error('Error getting recently played:', error);
      return [];
    }
  }

  getRecentlyAdded(limit = 50) {
    try {
      return this.db.prepare(`
        SELECT * FROM songs 
        ORDER BY date_added DESC 
        LIMIT ?
      `).all(limit);
    } catch (error) {
      console.error('Error getting recently added:', error);
      return [];
    }
  }

  getMostPlayed(limit = 50) {
    try {
      return this.db.prepare(`
        SELECT * FROM songs 
        WHERE play_count > 0
        ORDER BY play_count DESC, last_played DESC
        LIMIT ?
      `).all(limit);
    } catch (error) {
      console.error('Error getting most played:', error);
      return [];
    }
  }

  deletePlaylist(playlistId) {
    try {
      // Don't allow deleting the "All Songs" playlist
      const playlist = this.db.prepare('SELECT name FROM playlists WHERE id = ?').get(playlistId);
      if (playlist && playlist.name === 'All Songs') {
        return { success: false, error: 'Cannot delete the All Songs playlist' };
      }
      
      const result = this.db.prepare('DELETE FROM playlists WHERE id = ?').run(playlistId);
      return { success: true, changes: result.changes };
    } catch (error) {
      console.error('Error deleting playlist:', error);
      return { success: false, error: error.message };
    }
  }

  renamePlaylist(playlistId, newName) {
    try {
      // Don't allow renaming the "All Songs" playlist
      const playlist = this.db.prepare('SELECT name FROM playlists WHERE id = ?').get(playlistId);
      if (playlist && playlist.name === 'All Songs') {
        return { success: false, error: 'Cannot rename the All Songs playlist' };
      }
      
      const result = this.db.prepare('UPDATE playlists SET name = ? WHERE id = ?').run(newName, playlistId);
      return { success: true, changes: result.changes };
    } catch (error) {
      console.error('Error renaming playlist:', error);
      return { success: false, error: error.message };
    }
  }

  close() {
    this.db.close();
  }
}

module.exports = MusicDatabase;