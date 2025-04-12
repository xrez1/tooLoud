import { app, BrowserWindow, ipcMain, protocol} from 'electron';
import path from 'path';
import started from 'electron-squirrel-startup';
import {} from './limits/limitsIpc.js';
import {} from './sounds/soundsIpc.js';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 600,
    height: 850,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, // Enable context isolation
      enableRemoteModule: false, // Disable remote module
      nodeIntegration: false, // Disable direct Node.js integration
    },
    autoHideMenuBar: true,
    icon: path.join(__dirname, '../public/icon.png'),
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

ipcMain.on('audio-chunk', (event, audioData) => {
  // 'audioData' is the Float32Array sent from the renderer process
  // You can now process this data in your main process
  // Example: Logging the length of the received chunk
  console.log('Received audio chunk of length:', audioData.length);

  // Further processing:
  // - Write to a file (e.g., using Node.js file system APIs)
  // - Send to a server (e.g., using `node-fetch` or `http` module)
  // - Perform other backend tasks
});

ipcMain.handle('get-appdata-path', () => {
    return app.getPath('appData');
});
/*
ipcMain.on('play-sound', async (event, soundFile) => {
  const userDataPath = app.getPath('userData'); // Get the userData directory
  const soundFolder = path.join(userDataPath, 'usersounds'); // Store sounds in userData/usersounds
  const soundPath = path.join(soundFolder, soundFile);

  if (!fs.existsSync(soundPath)) {
    console.error(`Sound file not found: ${soundFile}`);
    return;
  }

  try {
    // Read the audio file into a buffer
    const audioData = fs.readFileSync(soundPath);

    // Create an AudioContext
    const audioContext = new AudioContext();

    // Decode the audio data
    const audioBuffer = await audioContext.decodeAudioData(audioData.buffer);

    // Create a buffer source and connect it to the destination
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);

    // Start playback
    source.start();
    console.log(`Playing sound: ${soundFile}`);
  } catch (err) {
    console.error('Error playing sound:', err);
  }
});*/


app.whenReady().then(() => {
  protocol.registerFileProtocol('local', (request, callback) => {
      const url = request.url.replace('local://', '');
      const filePath = path.join(app.getPath('userData'), 'usersounds', url);
      callback({ path: filePath });
  });
});