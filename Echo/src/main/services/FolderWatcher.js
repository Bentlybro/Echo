const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

class FolderWatcher {
  constructor(database, settingsManager, mainWindow) {
    this.database = database;
    this.settingsManager = settingsManager;
    this.mainWindow = mainWindow;
    this.watchers = new Map();
    this.watchedFolders = new Set();
    this.importQueue = [];
    this.isProcessingQueue = false;
    this.batchStats = { added: 0, duplicates: 0, errors: 0 };
  }

  initialize() {
    this.loadWatchedFolders();
  }

  loadWatchedFolders() {
    try {
      const settings = this.settingsManager.loadSettings();
      
      if (settings.watchedFolders && Array.isArray(settings.watchedFolders)) {
        settings.watchedFolders.forEach(folderPath => {
          const normalizedPath = path.normalize(folderPath);
          if (fs.existsSync(normalizedPath)) {
            this.addWatchedFolder(normalizedPath, false);
          }
        });
      }
      
      console.log(`Restored ${settings.watchedFolders?.length || 0} watched folders`);
    } catch (error) {
      console.error('Error loading watched folders:', error);
    }
  }

  saveWatchedFolders() {
    const settings = this.settingsManager.loadSettings();
    settings.watchedFolders = Array.from(this.watchedFolders);
    settings.version = '1.0.0';
    this.settingsManager.saveSettings(settings);
  }

  addWatchedFolder(folderPath, saveSettings = true) {
    try {
      // Normalize the path to ensure consistent handling
      const normalizedPath = path.normalize(folderPath);
      
      if (this.watchedFolders.has(normalizedPath)) {
        return { success: false, error: 'Folder is already being watched' };
      }

      this.scanFolder(normalizedPath);

      const watcher = chokidar.watch(normalizedPath, {
        ignored: /^\./,
        persistent: true,
        depth: 99,
        ignoreInitial: true
      });

      watcher
        .on('add', (filePath) => this.handleFileAdded(filePath))
        .on('unlink', (filePath) => this.handleFileRemoved(filePath))
        .on('error', (error) => console.error('Watcher error:', error));

      this.watchers.set(normalizedPath, watcher);
      this.watchedFolders.add(normalizedPath);

      if (saveSettings) {
        this.saveWatchedFolders();
      }

      console.log(`Started watching folder: ${normalizedPath}`);
      return { success: true };
    } catch (error) {
      console.error('Error adding watched folder:', error);
      return { success: false, error: error.message };
    }
  }

  removeWatchedFolder(folderPath) {
    try {
      const normalizedPath = path.normalize(folderPath);
      const watcher = this.watchers.get(normalizedPath);
      if (watcher) {
        watcher.close();
        this.watchers.delete(normalizedPath);
      }
      this.watchedFolders.delete(normalizedPath);
      
      this.saveWatchedFolders();
      
      console.log(`Stopped watching folder: ${normalizedPath}`);
      return { success: true };
    } catch (error) {
      console.error('Error removing watched folder:', error);
      return { success: false, error: error.message };
    }
  }

  async scanFolder(folderPath) {
    try {
      // Normalize the path to handle any encoding issues
      const normalizedPath = path.normalize(folderPath);
      
      // Check if the directory exists
      if (!fs.existsSync(normalizedPath)) {
        return { success: false, error: `Directory does not exist: ${normalizedPath}` };
      }

      const audioExtensions = ['.mp3', '.flac', '.wav', '.m4a', '.aac', '.ogg'];
      const filesToProcess = [];

      const scanDirectory = (dirPath) => {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          
          if (entry.isDirectory()) {
            scanDirectory(fullPath);
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name).toLowerCase();
            if (audioExtensions.includes(ext)) {
              filesToProcess.push(fullPath);
            }
          }
        }
      };

      scanDirectory(normalizedPath);
      
      return await this.processBulkImport(filesToProcess, true);
    } catch (error) {
      console.error('Error scanning folder:', error);
      return { success: false, error: error.message };
    }
  }

  async processBulkImport(filePaths, isInitialScan = false) {
    if (filePaths.length === 0) {
      return { success: true, added: 0, duplicates: 0, errors: 0 };
    }

    this.batchStats = { added: 0, duplicates: 0, errors: 0 };
    
    if (this.mainWindow) {
      this.mainWindow.webContents.send('bulk-import-start', { 
        total: filePaths.length,
        isInitialScan 
      });
    }

    const batchSize = 10;
    const batches = [];
    
    for (let i = 0; i < filePaths.length; i += batchSize) {
      batches.push(filePaths.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      await this.processBatch(batch);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      if (this.mainWindow) {
        const processed = this.batchStats.added + this.batchStats.duplicates + this.batchStats.errors;
        this.mainWindow.webContents.send('bulk-import-progress', {
          processed,
          total: filePaths.length,
          ...this.batchStats
        });
      }
    }

    if (this.mainWindow) {
      this.mainWindow.webContents.send('bulk-import-complete', {
        ...this.batchStats,
        total: filePaths.length
      });
    }

    return { success: true, ...this.batchStats };
  }

  async processBatch(filePaths) {
    for (const filePath of filePaths) {
      try {
        const result = await this.database.addSong(filePath);
        
        if (result.success) {
          this.batchStats.added++;
        } else if (result.duplicate) {
          this.batchStats.duplicates++;
        } else {
          this.batchStats.errors++;
        }
      } catch (error) {
        console.error(`Error processing ${filePath}:`, error);
        this.batchStats.errors++;
      }
    }
  }

  async handleFileAdded(filePath) {
    const audioExtensions = ['.mp3', '.flac', '.wav', '.m4a', '.aac', '.ogg'];
    const ext = path.extname(filePath).toLowerCase();
    
    if (audioExtensions.includes(ext)) {
      console.log(`New audio file detected: ${filePath}`);
      
      this.importQueue.push(filePath);
      
      if (!this.isProcessingQueue) {
        this.processImportQueue();
      }
    }
  }

  async processImportQueue() {
    if (this.isProcessingQueue || this.importQueue.length === 0) return;
    
    this.isProcessingQueue = true;
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const filesToProcess = [...this.importQueue];
    this.importQueue = [];
    
    if (filesToProcess.length === 1) {
      const filePath = filesToProcess[0];
      const result = await this.database.addSong(filePath);
      
      if (result.success && this.mainWindow) {
        this.mainWindow.webContents.send('song-added', filePath);
        this.mainWindow.webContents.send('show-notification', {
          type: 'success',
          message: `New song added: ${path.basename(filePath)}`
        });
      }
    } else if (filesToProcess.length > 1) {
      const results = await this.processBulkImport(filesToProcess, false);
      
      if (this.mainWindow && results.added > 0) {
        this.mainWindow.webContents.send('songs-batch-added', filesToProcess);
      }
    }
    
    this.isProcessingQueue = false;
    
    if (this.importQueue.length > 0) {
      this.processImportQueue();
    }
  }

  async handleFileRemoved(filePath) {
    console.log(`File removed: ${filePath}`);
  }

  getWatchedFolders() {
    return Array.from(this.watchedFolders);
  }
}

module.exports = FolderWatcher;