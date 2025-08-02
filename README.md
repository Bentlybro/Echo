# Simple Music Player

A cross-platform desktop music player built with Electron. Features drag-and-drop support, playlist management, and a clean, minimalist interface.

## Features

✨ **Core Functionality**
- Play local audio files (MP3, FLAC, WAV, M4A, AAC, OGG)
- Drag and drop files to add to library
- Automatic metadata extraction (title, artist, album, duration)
- Audio playback controls (play, pause, skip, volume)
- Progress seeking and time display

🎵 **Music Management**
- SQLite database for persistent music library
- Create and manage custom playlists
- Browse by all songs, artists, or albums
- Search and organize your music collection

🎨 **User Interface**
- Clean, modern design with gradient backgrounds
- Responsive layout that works on different screen sizes
- Keyboard shortcuts for playback control
- Real-time progress and volume controls

⚡ **Technical Features**
- Cross-platform support (Windows, macOS, Linux)
- Secure IPC communication between main and renderer processes
- Efficient database operations with Better-SQLite3
- Music metadata parsing with music-metadata library

## Installation

1. **Prerequisites**
   - Node.js (v16 or higher)
   - npm (comes with Node.js)

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start the Application**
   ```bash
   npm start
   ```

4. **Development Mode** (with DevTools)
   ```bash
   npm run dev
   ```

## Usage

### Adding Music
- **Method 1**: Click the "Add Music" button and select audio files
- **Method 2**: Drag and drop audio files anywhere in the application
- **Method 3**: Use the file menu to browse and add songs

### Playback Controls
- **Play/Pause**: Click the play button or press `Space`
- **Next Track**: Click next button or press `→`
- **Previous Track**: Click previous button or press `←`
- **Volume**: Use volume slider or press `↑`/`↓`
- **Seek**: Click anywhere on the progress bar

### Playlist Management
1. Click "New Playlist" to create a playlist
2. Navigate between "All Songs" and your custom playlists
3. Double-click any song to start playing
4. Use "Play All" to play the current view

### Keyboard Shortcuts
- `Space` - Play/Pause
- `←` - Previous track
- `→` - Next track
- `↑` - Volume up
- `↓` - Volume down

## Project Structure

```
Music/
├── package.json          # Project configuration and dependencies
├── main.js              # Electron main process
├── preload.js           # Secure IPC bridge
├── database/
│   ├── database.js      # Database manager class
│   └── music.db         # SQLite database (created at runtime)
├── renderer/
│   ├── index.html       # Main application UI
│   ├── styles.css       # Application styling
│   ├── script.js        # Main application logic
│   └── audio-player.js  # Audio playback engine
└── README.md           # This file
```

## Technology Stack

- **Framework**: Electron (cross-platform desktop apps)
- **Database**: Better-SQLite3 (fast, synchronous SQLite)
- **Metadata**: music-metadata (audio file parsing)
- **UI**: Vanilla HTML/CSS/JavaScript with modern styling
- **Audio**: HTML5 Audio API with custom controls

## Building for Distribution

1. **Pack (development)**
   ```bash
   npm run pack
   ```

2. **Build (production)**
   ```bash
   npm run build
   ```

Built applications will be available in the `dist/` directory.

## Supported File Formats

- **MP3** - Most common format, excellent compatibility
- **FLAC** - Lossless compression, audiophile quality
- **WAV** - Uncompressed, highest quality
- **M4A** - Apple's format, good quality and compression
- **AAC** - Modern codec with good compression
- **OGG** - Open source alternative to MP3

## Troubleshooting

### Native Module Issues
If you encounter module compilation errors:
```bash
npm rebuild
```

### Database Issues
If you experience database problems:
1. Close the application
2. Delete `database/music.db`
3. Restart the application (database will be recreated)

### Audio Playback Issues
- Ensure your audio files are not corrupted
- Check that the file format is supported
- Try converting problematic files to MP3

## Contributing

This is a simple music player designed for personal use. Feel free to modify and extend it for your needs!

## License

MIT License - feel free to use and modify as needed.