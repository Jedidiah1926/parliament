const { app, BrowserWindow, Menu, ipcMain, screen, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const mods = require('./mods');

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

// ===== 창 상태 기억 (크기 · 위치 · 최대화 · 화면 표시 방식 · 확대 배율 · 마지막 테마) =====
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


// ===== 화면 표시 방식 =====
//   windowed   창 모드 — 제목 표시줄이 있는 보통 창 (최대화 여부는 따로 기억)
//   fullscreen 전체 화면 — 운영체제의 전체 화면 (F11)
//   borderless 테두리 없는 전체 화면 — 제목 표시줄 없는 창을 모니터 크기에 딱 맞춰 띄움
//              (다른 창으로 전환하기 쉽고, 창 틀은 켠 뒤에 바꿀 수 없어 창을 새로 만들어 옮겨 간다)
const DISPLAY_MODES = ['windowed', 'fullscreen', 'borderless'];
const saved = loadWindowState();
if (!DISPLAY_MODES.includes(saved.displayMode)) saved.displayMode = saved.fullscreen ? 'fullscreen' : 'windowed';
let mainWin = null;

function notifyDisplayMode(win) {
    if (win && !win.isDestroyed()) win.webContents.send('display-mode:changed', saved.displayMode);
}

function createWindow(url) {
    const borderless = saved.displayMode === 'borderless';
    const bounds = {
        width: Math.max(MIN_SIZE.width, saved.width || DEFAULT_BOUNDS.width),
        height: Math.max(MIN_SIZE.height, saved.height || DEFAULT_BOUNDS.height),
    };
    if (onScreen({ ...bounds, x: saved.x, y: saved.y })) { bounds.x = saved.x; bounds.y = saved.y; }
    // 테두리 없는 전체 화면: 창이 있던(없으면 주 모니터) 모니터 전체를 덮는다
    const display = bounds.x !== undefined ? screen.getDisplayMatching({ ...bounds }) : screen.getPrimaryDisplay();
    const winBounds = borderless ? { ...display.bounds } : bounds;

    const win = new BrowserWindow({
        ...winBounds,
        minWidth: borderless ? undefined : MIN_SIZE.width,
        minHeight: borderless ? undefined : MIN_SIZE.height,
        frame: !borderless,
        resizable: !borderless,
        maximizable: !borderless,
        show: false, // 첫 화면이 다 그려진 뒤에 보여줘서 빈 창이 번쩍이지 않게
        backgroundColor: THEME_BG[saved.theme] || THEME_BG.light,
        autoHideMenuBar: true,
        // 창 · 작업 표시줄 아이콘은 반원 로고 (실행 파일 · 설치 파일 아이콘은 글자가 들어간 전체 로고 — icons/icon.ico)
        icon: path.join(__dirname, '..', 'icons', process.platform === 'win32' ? 'window.ico' : 'window.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });
    mainWin = win;

    Menu.setApplicationMenu(null);
    // 바깥 링크(유튜브 채널 등)는 앱 창 안이 아니라 기본 브라우저로 연다
    const isExternal = url => /^https?:\/\//i.test(url);
    win.webContents.setWindowOpenHandler(({ url }) => {
        if (isExternal(url)) shell.openExternal(url);
        return { action: 'deny' };
    });
    win.webContents.on('will-navigate', (e, url) => {
        if (isExternal(url)) { e.preventDefault(); shell.openExternal(url); }
    });
    win.once('ready-to-show', () => {
        if (borderless) {
            win.setBounds(display.bounds);
        } else {
            if (saved.maximized) win.maximize();
            if (saved.displayMode === 'fullscreen') win.setFullScreen(true);
        }
        win.show();
        win.focus();
    });
    // 확대 배율은 페이지를 옮겨도(메인 → 시뮬레이터 → 설정) 유지
    win.webContents.on('did-finish-load', () => {
        if (Number.isFinite(saved.zoom)) win.webContents.setZoomLevel(saved.zoom);
    });
    // 운영체제 쪽에서 전체 화면을 끄고 켜도(초록 단추 등) 설정 화면 표시가 따라가게
    win.on('enter-full-screen', () => {
        if (win !== mainWin || saved.displayMode === 'borderless') return;
        saved.displayMode = 'fullscreen';
        notifyDisplayMode(win);
    });
    win.on('leave-full-screen', () => {
        if (win !== mainWin || saved.displayMode === 'borderless') return;
        saved.displayMode = 'windowed';
        notifyDisplayMode(win);
    });

    // ===== 단축키: 메뉴를 없애면서 사라진 기본 단축키를 되살린다 =====
    //   Ctrl/⌘ + (=)  확대 · Ctrl/⌘ −  축소 · Ctrl/⌘ 0  원래 크기 · Ctrl/⌘ R  새로고침
    //   F11  전체 화면 ↔ 창 모드 (테두리 없는 전체 화면에서는 창 모드로)
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
            setDisplayMode(saved.displayMode === 'windowed' ? 'fullscreen' : 'windowed');
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

    // 창 모드일 때의 크기·위치만 기억한다 (최대화 · 전체 화면 · 테두리 없는 창의 크기는 저장하지 않음)
    const trackNormal = () => {
        if (win !== mainWin || saved.displayMode !== 'windowed' || win.isMaximized() || win.isFullScreen()) return;
        Object.assign(saved, win.getBounds());
    };
    win.on('resize', trackNormal);
    win.on('move', trackNormal);
    win.on('maximize', () => { if (win === mainWin && saved.displayMode === 'windowed') saved.maximized = true; });
    win.on('unmaximize', () => { if (win === mainWin && saved.displayMode === 'windowed') saved.maximized = false; });

    // 닫을 때 창 상태와 마지막 테마를 기록 (표시 방식을 바꾸느라 창을 갈아 끼울 때는 그냥 닫음)
    let closing = false;
    win.on('close', event => {
        if (closing || win !== mainWin) return;
        trackNormal();
        // 테마는 페이지 저장소에 있으므로 닫기 전에 한 번 읽어 온다 (못 읽어도 그대로 닫힘)
        event.preventDefault();
        closing = true;
        const finish = theme => {
            if (theme) saved.theme = theme;
            saved.fullscreen = saved.displayMode === 'fullscreen'; // 예전 버전과의 호환용
            saveWindowState(saved);
            win.destroy();
        };
        const timer = setTimeout(() => finish(null), 500);
        win.webContents.executeJavaScript("localStorage.getItem('dnoThemeMode')", true)
            .then(theme => { clearTimeout(timer); finish(THEME_BG[theme] ? theme : null); })
            .catch(() => { clearTimeout(timer); finish(null); });
    });

    if (url) win.loadURL(url);
    else win.loadFile(path.join(__dirname, '..', 'index.html'));
    return win;
}

function setDisplayMode(mode) {
    const win = mainWin;
    if (!DISPLAY_MODES.includes(mode) || !win || win.isDestroyed()) return saved.displayMode;
    const prev = saved.displayMode;
    if (mode === prev) return prev;
    saved.displayMode = mode;
    if (mode === 'borderless' || prev === 'borderless') {
        // 창 틀은 만든 뒤에 붙였다 뗄 수 없으므로 같은 페이지를 새 창에 열고 옛 창은 닫는다
        if (prev === 'windowed' && !win.isMaximized() && !win.isFullScreen()) Object.assign(saved, win.getBounds());
        else if (prev === 'borderless') {
            // 예전 창 자리가 지금 모니터 위에 있으면 그대로, 아니면 이 모니터 가운데에 창을 띄운다
            const area = screen.getDisplayMatching(win.getBounds()).workArea;
            const w = Math.min(area.width, Math.max(MIN_SIZE.width, saved.width || DEFAULT_BOUNDS.width));
            const h = Math.min(area.height, Math.max(MIN_SIZE.height, saved.height || DEFAULT_BOUNDS.height));
            const inside = Number.isFinite(saved.x) && Number.isFinite(saved.y) &&
                saved.x >= area.x && saved.y >= area.y && saved.x + w <= area.x + area.width && saved.y + h <= area.y + area.height;
            if (!inside) Object.assign(saved, { x: area.x + Math.round((area.width - w) / 2), y: area.y + Math.round((area.height - h) / 2) });
        }
        const url = win.webContents.getURL();
        win.webContents.executeJavaScript("localStorage.getItem('dnoThemeMode')", true)
            .catch(() => null)
            .then(theme => {
                if (THEME_BG[theme]) saved.theme = theme;
                createWindow(url);
                win.destroy();
            });
    } else {
        win.setFullScreen(mode === 'fullscreen');
    }
    saveWindowState(saved);
    return mode;
}

ipcMain.handle('display-mode:get', () => saved.displayMode);
// 모드(창작마당) — 언어 팩 · 테마는 페이지가 뜰 때 바로 적용해야 해서 목록을 동기로 돌려준다 (프리셋은 목록만)
ipcMain.on('mods:list', event => {
    try { event.returnValue = mods.listMods(); }
    catch (e) { console.error('mods scan failed:', e); event.returnValue = { languages: [], themes: [], presets: [] }; }
});
ipcMain.handle('mods:preset', (event, key) => mods.loadPreset(key));
ipcMain.handle('mods:open-folder', () => shell.openPath(mods.modsDir()));
ipcMain.handle('display-mode:set', (event, mode) => setDisplayMode(mode));

app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
