# Folder Watcher Performance Fix

## Problem
The folder watcher was causing the app to nearly crash when adding new songs to watched folders due to:
- Immediate processing of each file as it was detected
- No debouncing mechanism for bulk file additions
- Short processing delays causing system overload
- No queue size limits leading to memory issues
- Aggressive processing without proper throttling

## Solution Implemented

### 1. Intelligent Debouncing
- **Debounce delay**: 3 seconds (configurable)
- Files are queued when detected but processing is delayed
- Timer resets each time new files are added
- Prevents immediate processing of rapid file additions

```javascript
this.debounceDelay = 3000; // 3 seconds to wait for more files
```

### 2. Queue Management
- **Maximum queue size**: 100 files (configurable)
- **Batch processing**: 5 files per batch (configurable)
- **Processing delay**: 250ms between batches (configurable)
- Duplicate detection prevents same file being queued twice

```javascript
this.maxQueueSize = 100;
this.processingBatchSize = 5;
this.processingDelay = 250;
```

### 3. Enhanced Processing Flow

#### Before (Problematic):
```
File Added → Immediate Queue Processing → Database Write → UI Update
```

#### After (Optimized):
```
File Added → Queue → Debounced Timer → Batch Processing → Database Write → UI Update
```

### 4. Two-Tier Processing System

#### Single File Processing
- For single files: immediate processing with notification
- Quick response for individual file additions

#### Bulk Processing  
- For multiple files: enhanced batch processing
- Smaller batch sizes (5 vs 10)
- Longer delays between batches (250ms vs 10ms)
- Better progress reporting

### 5. Memory and Performance Safeguards

#### Queue Size Limits
```javascript
if (this.importQueue.length >= this.maxQueueSize) {
  console.warn(`Import queue is full (${this.maxQueueSize} files). Processing current queue before adding more.`);
  // Force processing of current queue
}
```

#### Processing Throttling
- 10ms delay between individual file processing
- 250ms delay between batch processing
- Prevents overwhelming the database and UI

#### Duplicate Prevention
```javascript
if (!this.importQueue.includes(filePath)) {
  this.importQueue.push(filePath);
}
```

### 6. Better Error Handling and Logging
- Detailed console logging for debugging
- Progress tracking with batch information  
- Error isolation prevents single file failures from stopping the queue
- Visual feedback with success/error/duplicate indicators

### 7. Resource Cleanup
- Timer cleanup on app shutdown
- File watcher cleanup
- Queue clearing and memory management
- Proper resource disposal

## Configuration Options

The system is now configurable with these parameters:

```javascript
// In FolderWatcher constructor
this.debounceDelay = 3000;        // Wait time before processing (ms)
this.maxQueueSize = 100;          // Maximum files in queue
this.processingBatchSize = 5;     // Files per batch
this.processingDelay = 250;       // Delay between batches (ms)
```

## Usage Scenarios

### Scenario 1: Single File Added
- File detected → Queued
- 3-second timer starts
- If no more files added → Single file processing
- Immediate notification to user

### Scenario 2: Bulk Files Added (e.g., copying folder)
- Multiple files detected rapidly → All queued
- Timer resets with each new file
- After 3 seconds of no new files → Batch processing begins
- Progress updates shown to user
- Processing in small batches with delays

### Scenario 3: Queue Overflow
- If queue reaches 100 files → Automatic processing triggered
- Prevents memory issues
- Continues monitoring for more files

## Performance Improvements

### Before Fix:
- ❌ App freezing/crashing with bulk additions
- ❌ Immediate processing causing UI blocks
- ❌ No queue management
- ❌ Resource exhaustion possible

### After Fix:
- ✅ Smooth handling of bulk file additions
- ✅ Responsive UI during processing
- ✅ Intelligent batching and throttling
- ✅ Memory-safe queue management
- ✅ Configurable performance parameters
- ✅ Better user feedback and error handling

## Testing Recommendations

1. **Single File Test**: Add one file to watched folder - should process quickly
2. **Bulk Addition Test**: Copy 50+ files to watched folder - should process smoothly in batches
3. **Rapid Addition Test**: Add files rapidly one by one - should debounce properly
4. **Large File Test**: Add very large audio files - should handle without blocking
5. **Error Resilience Test**: Add corrupted/invalid files mixed with good ones - should continue processing

## Debug Information

Use the new IPC handler to monitor queue status:
```javascript
const status = await window.electronAPI.getFolderWatcherStatus();
console.log(status);
// Returns: { queueLength, isProcessing, hasScheduledProcessing, debounceDelay, etc. }
```

This fix transforms the folder watcher from a potential crash point into a robust, performant system that handles any volume of file additions gracefully.