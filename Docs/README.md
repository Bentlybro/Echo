# Echo Music Player Documentation

This documentation provides comprehensive information about the Echo music player application architecture, components, and development guidelines.

## Documentation Structure

### Architecture Overview
- [Application Architecture](./architecture/overview.md) - High-level application structure and design patterns
- [Electron Security Model](./architecture/security.md) - Security implementation and best practices

### Main Process
- [Application Lifecycle](./main-process/application-lifecycle.md) - App initialization and lifecycle management
- [Window Management](./main-process/window-management.md) - Window creation and management
- [Services](./main-process/services.md) - Core services (Tray, Settings, Folder Watching, etc.)
- [IPC Handlers](./main-process/ipc-handlers.md) - Inter-process communication handlers

### Renderer Process
- [UI Architecture](./renderer-process/ui-architecture.md) - Frontend structure and components
- [Audio Engine](./renderer-process/audio-engine.md) - Audio playback implementation
- [User Interface Components](./renderer-process/components.md) - Individual UI components
- [State Management](./renderer-process/state-management.md) - Frontend state handling

### Database
- [Schema Design](./database/schema.md) - Database tables and relationships
- [Operations](./database/operations.md) - Database queries and operations
- [Error Handling](./database/error-handling.md) - Database fallback mechanisms

### API Reference
- [IPC API](./api/ipc-api.md) - Complete IPC API reference
- [Database API](./api/database-api.md) - Database methods and parameters
- [Services API](./api/services-api.md) - Service classes and methods

### Build System
- [Build Configuration](./build-system/configuration.md) - Electron Builder setup
- [Platform-Specific Builds](./build-system/platforms.md) - Platform build configurations
- [Deployment](./build-system/deployment.md) - Distribution and deployment process

## Key Technologies

- **Electron 27.0.0** - Cross-platform desktop framework
- **Better-SQLite3 12.2.0** - Synchronous SQLite database
- **music-metadata 7.14.0** - Audio metadata extraction
- **chokidar 4.0.3** - File system watching
- **HTML5 Audio API** - Audio playback

## Supported Audio Formats

Echo supports the following audio formats:
- MP3 (.mp3)
- FLAC (.flac)
- WAV (.wav)
- M4A (.m4a)
- AAC (.aac)
- OGG (.ogg)

All formats include automatic metadata extraction and album art display.

## Development Quick Start

1. Navigate to the Echo directory: `cd Echo/`
2. Install dependencies: `npm install`
3. Start in development mode: `npm run dev`
4. Build for production: `npm run build`

For detailed development information, see the individual documentation files.