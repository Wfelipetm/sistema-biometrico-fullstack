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
    win.loadURL('https://app.biometrico.itaguai.rj.gov.br/dashboard/quiosque');
}

app.whenReady().then(createWindow);
