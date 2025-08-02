# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm install` - Install dependencies
- `npm start` - Start the application
- `npm run dev` - Start in development mode with DevTools enabled
- `npm run build` - Build production distributable 
- `npm run pack` - Pack for development testing
- `npm rebuild` - Rebuild native modules if compilation errors occur

## Application Architecture

This is an Electron-based cross-platform music player with a clean separation between main and renderer processes.

### Main Process Structure
- **Entry Point**: `main.js` bootstraps the application by initializing `MusicPlayerApp`
- **Core App**: `src/main/MusicPlayerApp.js` manages application lifecycle and coordinates services
- **Services**:
  - `WindowManager.js` - Creates and manages application windows
  - `TrayService.js` - System tray functionality and minimize-to-tray
  - `SettingsManager.js` - User preferences and configuration
  - `FolderWatcher.js` - Monitors folders for new music files
- **IPC**: `src/main/ipc/IPCHandlers.js` handles secure communication between main and renderer processes

### Renderer Process Structure
- **Core**: `src/renderer/MusicPlayer.js` is the main frontend controller
- **Components**: Modular UI components in `src/renderer/components/`
  - `AudioPlayer.js` - Audio playback engine using HTML5 Audio API
  - `DragDropHandler.js` - File drag and drop functionality
  - `PlaylistManager.js` - Playlist creation and management
  - `SongRenderer.js` - Song list display and interaction
  - `TitleBarManager.js` - Custom title bar controls
- **Services**: Frontend services in `src/renderer/services/`
  - `NotificationService.js` - In-app notifications
  - `ProgressService.js` - Progress indicators for bulk operations

### Database Architecture
- **Database**: `database/database.js` uses Better-SQLite3 for fast, synchronous operations
- **Schema**: Three main tables - `songs` (music metadata), `playlists`, and `playlist_songs` (many-to-many relationship)
- **Features**: Automatic metadata extraction using `music-metadata` library, album art storage as BLOB, play counts, and liked songs

### Key Technologies
- **Electron**: Cross-platform desktop framework
- **Better-SQLite3**: Fast synchronous SQLite database
- **music-metadata**: Audio file metadata parsing
- **chokidar**: File system watching for auto-import
- **HTML5 Audio API**: Audio playback functionality

### Audio File Support
Supports MP3, FLAC, WAV, M4A, AAC, and OGG formats with automatic metadata extraction and album art display.

### IPC Communication Pattern
All database operations and file system access go through secure IPC handlers to maintain Electron's security model. The preload script (`preload.js`) exposes a safe API to the renderer process.