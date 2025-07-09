// main.js
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
    const win = new BrowserWindow({
        fullscreen: true,
        kiosk: true,
        frame: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    const mainURL = 'https://quiosquebio.itaguai.rj.gov.br/';
    win.loadURL(mainURL);

    // Desabilita menu do mouse (botão direito)
    win.webContents.on('context-menu', (e) => e.preventDefault());

    // Bloqueia DevTools e atalhos perigosos
    // win.webContents.on('before-input-event', (event, input) => {
    //     event.preventDefault(); // Bloqueia toda entrada de teclado
    // });

    // Bloqueia navegação fora da URL principal
    win.webContents.on('will-navigate', (event, url) => {
        if (url !== mainURL) {
            event.preventDefault();
            win.loadURL(mainURL);
        }
    });

    // Bloqueia abertura de novas janelas externas
    win.webContents.setWindowOpenHandler(({ url }) => {
        if (url === mainURL) {
            return { action: 'allow' };
        }
        return { action: 'deny' };
    });

    // Se não carregar (ex: sem internet), mostra tela de manutenção
    win.webContents.on('did-fail-load', () => {
        win.loadFile(path.join(__dirname, 'offline', 'offline.html'));

        // Tenta recarregar a URL principal quando a internet voltar
        win.webContents.executeJavaScript(`
            window.addEventListener('online', () => {
                location.replace('${mainURL}');
            });
        `);
    });

    // Se travar, mostra a tela offline
    win.on('unresponsive', () => {
        win.loadFile(path.join(__dirname, 'offline', 'offline.html'));
    });

    // Se o frontend crashar, mostra a tela offline
    app.on('renderer-process-crashed', () => {
        win.loadFile(path.join(__dirname, 'offline', 'offline.html'));
    });

    // Monitoramento ativo da conexão
    setInterval(() => {
        win.webContents.executeJavaScript(`
            fetch('${mainURL}', { method: 'HEAD', cache: 'no-store' })
                .catch(() => { location.replace('offline/offline.html'); });
        `);
    }, 10000); // verifica a cada 10 segundos
}

app.whenReady().then(createWindow);
