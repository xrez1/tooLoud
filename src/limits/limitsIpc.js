import { ipcMain, app } from 'electron';
import path from 'path';
import fs from 'fs';

ipcMain.on('save-limits', (event, limits) => {
    const folderPath = path.join(app.getPath('userData'), 'userdata'); 
    const filePath = path.join(folderPath, 'limits.json');

    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true }); // Create the folder if it doesn't exist
    }

    fs.writeFile(filePath, JSON.stringify(limits, null, 2), (err) => {
        if (err) {
            console.error("Failed to save limits:", err);
        } else {
            console.log("Limits saved successfully to", filePath);
        }
    });
});

ipcMain.handle('load-limits', async () => {
    const filePath = path.join(app.getPath('userData'), 'userdata/limits.json');

    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(data);
        } else {
            console.log("Limits file not found, returning empty array.");
            return [];
        }
    } catch (err) {
        console.error("Failed to load limits:", err);
        throw err;
    }
});