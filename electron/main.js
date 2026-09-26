const { app, BrowserWindow, Menu, screen } = require('electron');
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

// ===== 창 상태 기억 (크기 · 위치 · 최대화 · 전체 화면 · 확대 배율 · 마지막 테마) =====
// userData/window-state.json에 저장하고, 다음에 켤 때 그대로 연다. 모니터 구성이 바뀌어 저장된 위치가
// 화면 밖이면 기본 위치로 되돌린다.
const DEFAULT_BOUNDS = { width: 1280, height: 820 };
const MIN_SIZE = { width: 960, height: 640 };
const statePath = () => path.join(app.getPath('userData'), 'window-state.json');
function loadWindowState() {
    try {
        const st = JSON.parse(fs.readFileSync(statePath(), 'utf8'));
        return st && typeof st === 'object' ? st : {};
    } catch (e) { return {}; }
}
function saveWindowState(st) {
    try { fs.writeFileSync(statePath(), JSON.stringify(st)); } catch (e) { /* 저장 못 해도 앱은 계속 */ }
}
function onScreen(b) {
    if (!b || !Number.isFinite(b.x) || !Number.isFinite(b.y)) return false;
    // 창 머리(위쪽 40px)가 어느 모니터 작업 영역과 조금이라도 겹치면 화면 안으로 본다
    return screen.getAllDisplays().some(d => {
        const a = d.workArea;
        return b.x + b.width > a.x + 40 && b.x < a.x + a.width - 40 && b.y >= a.y - 10 && b.y < a.y + a.height - 40;
    });
}
// 켤 때 번쩍이는 배경색 — 마지막으로 쓰던 테마에 맞춘다 (라이트 · 다크 · 네온)
const THEME_BG = { light: '#f4f4f5', dark: '#0c0c0e', tno: '#05070a' };

function createWindow() {
    const saved = loadWindowState();
    const bounds = {
        width: Math.max(MIN_SIZE.width, saved.width || DEFAULT_BOUNDS.width),
        height: Math.max(MIN_SIZE.height, saved.height || DEFAULT_BOUNDS.height),
    };
    if (onScreen({ ...bounds, x: saved.x, y: saved.y })) { bounds.x = saved.x; bounds.y = saved.y; }

    const win = new BrowserWindow({
        ...bounds,
        minWidth: MIN_SIZE.width,
        minHeight: MIN_SIZE.height,
        show: false, // 첫 화면이 다 그려진 뒤에 보여줘서 빈 창이 번쩍이지 않게
        backgroundColor: THEME_BG[saved.theme] || THEME_BG.tno,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true
        }
    });

    Menu.setApplicationMenu(null);
    win.once('ready-to-show', () => {
        if (saved.maximized) win.maximize();
        if (saved.fullscreen) win.setFullScreen(true);
        win.show();
    });
    // 확대 배율은 페이지를 옮겨도(메인 → 시뮬레이터 → 설정) 유지
    win.webContents.on('did-finish-load', () => {
        if (Number.isFinite(saved.zoom)) win.webContents.setZoomLevel(saved.zoom);
    });

    // ===== 단축키: 메뉴를 없애면서 사라진 기본 단축키를 되살린다 =====
    //   Ctrl/⌘ + (=)  확대 · Ctrl/⌘ −  축소 · Ctrl/⌘ 0  원래 크기 · F11  전체 화면 · Ctrl/⌘ R  새로고침
    const ZOOM_MIN = -3, ZOOM_MAX = 4, ZOOM_STEP = 0.5;
    const setZoom = z => {
        const zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, Math.round(z * 2) / 2));
        win.webContents.setZoomLevel(zoom);
        saved.zoom = zoom;
    };
    win.webContents.on('before-input-event', (event, input) => {
        if (input.type !== 'keyDown') return;
        const mod = process.platform === 'darwin' ? input.meta : input.control;
        const key = input.key;
        if (key === 'F11' || (process.platform === 'darwin' && input.meta && input.control && key.toLowerCase() === 'f')) {
            win.setFullScreen(!win.isFullScreen());
            event.preventDefault();
        } else if (mod && !input.alt && (key === '=' || key === '+' || input.code === 'NumpadAdd')) {
            setZoom(win.webContents.getZoomLevel() + ZOOM_STEP);
            event.preventDefault();
        } else if (mod && !input.alt && (key === '-' || key === '_' || input.code === 'NumpadSubtract')) {
            setZoom(win.webContents.getZoomLevel() - ZOOM_STEP);
            event.preventDefault();
        } else if (mod && !input.alt && (key === '0' || input.code === 'Numpad0')) {
            setZoom(0);
            event.preventDefault();
        } else if (mod && !input.alt && !input.shift && key.toLowerCase() === 'r') {
            win.webContents.reload();
            event.preventDefault();
        }
    });
    // Ctrl/⌘ + 휠 확대/축소도 저장해 두기 위해 배율 변경을 따라간다
    win.webContents.on('zoom-changed', (event, dir) => {
        setZoom(win.webContents.getZoomLevel() + (dir === 'in' ? ZOOM_STEP : -ZOOM_STEP));
    });

    // 닫을 때 창 상태와 마지막 테마를 기록
    const remember = () => {
        const normal = win.isMaximized() || win.isFullScreen() ? (saved.normalBounds || win.getNormalBounds()) : win.getBounds();
        Object.assign(saved, normal, { maximized: win.isMaximized(), fullscreen: win.isFullScreen() });
    };
    win.on('resize', () => { if (!win.isMaximized() && !win.isFullScreen()) saved.normalBounds = win.getBounds(); });
    win.on('move', () => { if (!win.isMaximized() && !win.isFullScreen()) saved.normalBounds = win.getBounds(); });
    let closing = false;
    win.on('close', event => {
        if (closing) return;
        remember();
        // 테마는 페이지 저장소(localStorage)에 있으므로 닫기 전에 한 번 읽어 온다 (못 읽어도 그대로 닫힘)
        event.preventDefault();
        closing = true;
        const finish = theme => {
            if (theme) saved.theme = theme;
            saveWindowState(saved);
            win.destroy();
        };
        const timer = setTimeout(() => finish(null), 500);
        win.webContents.executeJavaScript("localStorage.getItem('dnoThemeMode')", true)
            .then(theme => { clearTimeout(timer); finish(THEME_BG[theme] ? theme : null); })
            .catch(() => { clearTimeout(timer); finish(null); });
    });

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
