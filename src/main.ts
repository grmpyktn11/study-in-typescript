import { app, BrowserWindow } from 'electron';
import path from 'node:path';


function createWindow(): void {
    const mainWindow = new BrowserWindow({
        fullscreen:true,
        webPreferences:{
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadFile(path.join(__dirname, "index.html"));
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') app.quit();
    })
}
)

