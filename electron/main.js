const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

// 앱 이름을 "DATANET Parliament Simulation" → "Hemicycle"로 바꿨지만, 브라우저 저장소(세이브·설정)가 든
// 데이터 폴더는 예전 이름 그대로 써야 기존 세이브가 사라지지 않는다 (Electron은 앱 이름으로 폴더를 정함)
const LEGACY_DATA_DIR = app.isPackaged ? 'DATANET Parliament Simulation' : 'datanet-parliament-simulation';
app.setPath('userData', path.join(app.getPath('appData'), LEGACY_DATA_DIR));

function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 820,
        minWidth: 960,
        minHeight: 640,
        backgroundColor: '#05070a',
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true
        }
    });

    Menu.setApplicationMenu(null);
    win.loadFile(path.join(__dirname, '..', 'main.html'));
}

app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
