// main.js
const { app, BrowserWindow } = require('electron');

function createWindow() {
    const win = new BrowserWindow({
        fullscreen: true,    // Tela cheia
        kiosk: true,         // Bloqueia sair com ALT+TAB, ALT+F4
        frame: false,        // Remove barra de título
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    // ROTA DIRETA P/ TELA DE REGISTRO
    win.loadURL('http://10.200.200.22:3000');
}

app.whenReady().then(createWindow);
