import { ipcMain, dialog, app } from 'electron';
import path from 'path';
import fs from 'fs';


const userDataPath = app.getPath('userData'); // Get the userData directory
const soundFolder = path.join(userDataPath, 'usersounds'); // Store sounds in userData/usersounds
const soundDataPath = path.join(userDataPath, 'userdata', 'soundData.json'); // Store soundData.json in userData/userdata
const folderPath = path.dirname(soundDataPath);

ipcMain.handle('get-sounds', async () => {
    if (!fs.existsSync(soundFolder)) {
        fs.mkdirSync(soundFolder, { recursive: true }); // Create the folder if it doesn't exist
    }

    try {
        const files = fs.readdirSync(soundFolder).filter(file => {
            return file.endsWith('.mp3') || file.endsWith('.wav');
        });

        return files;
    } catch (err) {
        console.error('Error reading sounds folder:', err);
        return [];
    }
});

// Save sound JSON data
ipcMain.on('save-sounds', (event, soundData) => {
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }

    fs.writeFileSync(soundDataPath, JSON.stringify(soundData, null, 2), 'utf-8');
    console.log('Sound data saved:', soundData);
});

// Load sound JSON data
ipcMain.handle('load-sounds', async () => {
    try {
        if (fs.existsSync(soundDataPath)) {
            const data = fs.readFileSync(soundDataPath, 'utf-8');
            return JSON.parse(data);
        }
    } catch (err) {
        console.error('Error loading sound data:', err);
    }
    return [];
});

ipcMain.on('delete-sound', (event, soundFile) => {
    const soundPath = path.join(soundFolder, soundFile);

    try {
        // Delete the sound file
        fs.unlinkSync(soundPath);
        console.log(`Deleted sound: ${soundFile}`);

        // Update the JSON file to remove the sound
        if (fs.existsSync(soundDataPath)) {
            const data = fs.readFileSync(soundDataPath, 'utf-8');
            const soundData = JSON.parse(data);

            // Filter out the deleted sound
            const updatedSoundData = soundData.filter(sound => sound.sound !== soundFile);

            // Save the updated JSON data
            fs.writeFileSync(soundDataPath, JSON.stringify(updatedSoundData, null, 2), 'utf-8');
            console.log(`Updated sound data after deletion: ${soundFile}`);
        }
    } catch (err) {
        console.error('Error deleting sound:', err);
    }
});

ipcMain.handle('add-new-sound', async () => {
    const result = await dialog.showOpenDialog({
        title: 'Select a Sound File',
        filters: [
            { name: 'Audio Files', extensions: ['mp3', 'wav', 'ogg'] }
        ],
        properties: ['openFile']
    });

    if (result.canceled || result.filePaths.length === 0) {
        return null; // No file selected
    }

    const selectedFile = result.filePaths[0];
    const fileName = path.basename(selectedFile);
    const destination = path.join(soundFolder, fileName);

    try {
        // Copy the file to the usersounds folder
        fs.copyFileSync(selectedFile, destination);
        console.log(`Sound file added: ${fileName}`);
        return fileName; // Return the file name to the renderer process
    } catch (err) {
        console.error('Failed to copy sound file:', err);
        throw err;
    }
});

