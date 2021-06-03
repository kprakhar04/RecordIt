const electron = require('electron');
const { app, BrowserWindow } = electron;
const path = require('path');

require('@electron/remote/main').initialize();

const createWindow = () => {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        },
        resizable: false,
        center: true,
        darkTheme: true
    });

    mainWindow.loadURL(path.join(__dirname, '/src/index.html'));
}

app.on('ready', () => {
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});