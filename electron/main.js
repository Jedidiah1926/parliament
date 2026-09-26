const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

// 데이터 폴더(세이브·설정이 든 브라우저 저장소)는 앱 이름 "Hemicycle"을 따른다.
// 예전 이름(DATANET Parliament Simulation) 시절의 폴더가 있고 새 폴더가 아직 없으면, 처음 켤 때 한 번 통째로 옮겨 와
// 기존 세이브가 그대로 이어지게 한다 (예전 폴더는 지우지 않고 남겨 둠 — 되돌릴 수 있게)
const DATA_DIR = 'Hemicycle';
const LEGACY_DATA_DIRS = ['DATANET Parliament Simulation', 'datanet-parliament-simulation'];
function migrateLegacyUserData() {
    const appData = app.getPath('appData');
    const target = path.join(appData, DATA_DIR);
    if (fs.existsSync(path.join(target, 'Local Storage'))) return; // 이미 새 폴더에 데이터가 있음
    const legacy = LEGACY_DATA_DIRS.map(d => path.join(appData, d)).find(d => fs.existsSync(path.join(d, 'Local Storage')));
    if (!legacy) return;
    try {
        fs.cpSync(legacy, target, { recursive: true, force: false, errorOnExist: false });
    } catch (e) {
        console.error('legacy user data migration failed:', e);
    }
}
app.setPath('userData', path.join(app.getPath('appData'), DATA_DIR));
migrateLegacyUserData();

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
