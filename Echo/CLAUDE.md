# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm install` - Install dependencies
- `npm start` - Start the application
- `npm run dev` - Start in development mode with DevTools enabled
- `npm run build` - Build production distributable for current platform
- `npm run build:win` - Build Windows installer (.exe)
- `npm run build:mac` - Build macOS DMG
- `npm run build:linux` - Build Linux AppImage
- `npm run pack` - Pack for development testing (creates unpacked build)
- `npm run rebuild` - Rebuild native modules if compilation errors occur
- `npm run clean` - Remove node_modules and package-lock.json
- `npm run clean-build` - Clean, install, and rebuild before building

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

## Important Development Notes

### Database Error Handling
The app includes robust fallback mechanisms for database failures. If Better-SQLite3 fails to initialize (common in production builds with missing native dependencies), the app creates a fallback database object with no-op methods to prevent crashes while maintaining basic functionality.

### Single Instance Lock
The application enforces single instance mode - attempting to launch a second instance will focus the existing window instead of creating a new one.

### Logging System
Comprehensive logging is set up in `main.js` that creates daily log files in the user data directory. All console.log and console.error calls are automatically written to timestamped log files for debugging production issues.

### Build System
Uses electron-builder with platform-specific configurations. The build process includes native module rebuilding via electron-rebuild, which is critical for Better-SQLite3 compatibility across platforms.

### File Structure Note
The project has two main directories: 
- Root `Music/` directory contains this README and project documentation
- `Echo/` subdirectory contains the actual application code and should be the working directory for development