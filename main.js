const MusicPlayerApp = require('./src/main/MusicPlayerApp');

const musicPlayer = new MusicPlayerApp();
musicPlayer.init().catch(console.error);