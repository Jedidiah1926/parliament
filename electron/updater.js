// ===== 자동 업데이트 — GitHub Release에 새 버전이 올라오면 받아서 설치 =====
// 설치 프로그램(NSIS)으로 깐 앱: electron-updater가 Release의 업데이트 정보(latest.yml · obt.yml 등)를 보고 새 버전을 뒤에서 받아 두고,
//   다 받으면 "지금 다시 시작해 설치할까요?"를 묻는다 (나중에 하면 앱을 끌 때 설치).
// 압축(zip)으로 푼 앱 · Steam 판: 스스로 바꿔 끼울 수 없으므로 새 버전이 있으면 알려 주고 Release 페이지를 열어 준다 (Steam은 Steam이 업데이트).
// 개발 중(npm start)에는 아무것도 하지 않는다.
const { app, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');

const OWNER = 'Jedidiah1926';
const REPO = 'parliament';
const RELEASES_URL = `https://github.com/${OWNER}/${REPO}/releases`;
const CHECK_EVERY_MS = 4 * 60 * 60 * 1000; // 켜 둔 동안 4시간마다 다시 확인
const FIRST_CHECK_DELAY_MS = 5000;

let state = { status: 'idle', version: app.getVersion(), latest: null, percent: 0, error: null, mode: 'off' };
let send = () => {};
let getWin = () => null;
let settings = { autoUpdate: true };
let saveSettings = () => {};
let updater = null;
let timer = null;
let askedFor = null; // 이미 "다시 시작할까요?"를 물어본 버전 — 같은 버전은 다시 묻지 않음

function setState(patch) {
    state = { ...state, ...patch };
    try { send(state); } catch (e) { /* 창이 없을 때 */ }
}

// 설치 프로그램으로 깔았는지 — NSIS 설치 폴더에는 언인스톨러가 함께 있다
function installedWithNsis() {
    try {
        const dir = path.dirname(process.execPath);
        return fs.readdirSync(dir).some(f => /^Uninstall .*\.exe$/i.test(f));
    } catch (e) { return false; }
}
function steamBuild() {
    try {
        const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'steam.json'), 'utf8')) || {};
        return !!(process.env.HEMICYCLE_STEAM_APP_ID || cfg.appId);
    } catch (e) { return false; }
}
function detectMode() {
    if (!app.isPackaged) return 'off';
    if (steamBuild()) return 'steam';
    if (process.platform === 'win32' && installedWithNsis()) return 'auto';
    return 'notify';
}

// ---- 압축판 · 기타: GitHub API로 가장 최근 Release만 확인 ----
const parseVer = v => {
    const m = String(v || '').replace(/^v/, '').match(/^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?/);
    return m ? { n: [+m[1], +m[2], +m[3]], pre: m[4] || '' } : null;
};
function newer(a, b) { // a가 b보다 새 버전인가
    const x = parseVer(a), y = parseVer(b);
    if (!x || !y) return false;
    for (let i = 0; i < 3; i++) if (x.n[i] !== y.n[i]) return x.n[i] > y.n[i];
    if (x.pre === y.pre) return false;
    if (!x.pre) return true;   // 1.6.1 > 1.6.1-obt
    if (!y.pre) return false;
    return x.pre.localeCompare(y.pre, 'en', { numeric: true }) > 0;
}
function fetchJson(url) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, { headers: { 'User-Agent': 'Hemicycle-Updater', Accept: 'application/vnd.github+json' } }, res => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) { res.resume(); fetchJson(res.headers.location).then(resolve, reject); return; }
            if (res.statusCode !== 200) { res.resume(); reject(new Error('HTTP ' + res.statusCode)); return; }
            let body = '';
            res.setEncoding('utf8');
            res.on('data', c => { body += c; });
            res.on('end', () => { try { resolve(JSON.parse(body)); } catch (e) { reject(e); } });
        });
        req.on('error', reject);
        req.setTimeout(15000, () => req.destroy(new Error('timeout')));
    });
}
async function checkByApi(manual) {
    setState({ status: 'checking', error: null });
    try {
        const list = await fetchJson(`https://api.github.com/repos/${OWNER}/${REPO}/releases?per_page=10`);
        const wantPre = !!parseVer(app.getVersion())?.pre; // 사전 출시판(-obt 등)을 쓰고 있으면 사전 출시도 받는다
        const rel = (Array.isArray(list) ? list : []).find(r => !r.draft && (wantPre || !r.prerelease));
        const latest = rel ? String(rel.tag_name || '').replace(/^v/, '') : null;
        if (latest && newer(latest, app.getVersion())) {
            setState({ status: 'available', latest });
            if (askedFor !== latest || manual) {
                askedFor = latest;
                const win = getWin();
                const r = await dialog.showMessageBox(win || undefined, {
                    type: 'info', buttons: ['다운로드 페이지 열기', '나중에'], defaultId: 0, cancelId: 1,
                    title: 'Hemicycle 업데이트', message: `새 버전 ${latest}이(가) 나왔습니다.`,
                    detail: state.mode === 'steam' ? 'Steam에서 업데이트하세요.' : '이 앱은 압축 파일로 실행 중이라 자동으로 바꿀 수 없습니다. 다운로드 페이지에서 설치 프로그램(Setup)을 받으면 다음부터는 자동으로 업데이트됩니다.',
                });
                if (r.response === 0) shell.openExternal(rel.html_url || RELEASES_URL);
            }
        } else setState({ status: 'none', latest });
    } catch (e) {
        setState({ status: 'error', error: String(e && e.message || e) });
    }
}

// ---- 설치판: electron-updater ----
function setupAutoUpdater() {
    try {
        // eslint-disable-next-line global-require
        updater = require('electron-updater').autoUpdater;
    } catch (e) {
        updater = null;
        return false;
    }
    updater.autoDownload = true;
    updater.autoInstallOnAppQuit = true;
    updater.allowPrerelease = !!parseVer(app.getVersion())?.pre;
    updater.on('checking-for-update', () => setState({ status: 'checking', error: null }));
    updater.on('update-not-available', info => setState({ status: 'none', latest: info && info.version || null }));
    updater.on('update-available', info => setState({ status: 'downloading', latest: info && info.version || null, percent: 0 }));
    updater.on('download-progress', p => setState({ status: 'downloading', percent: Math.round(p && p.percent || 0) }));
    updater.on('error', e => setState({ status: 'error', error: String(e && e.message || e) }));
    updater.on('update-downloaded', async info => {
        const v = info && info.version || state.latest;
        setState({ status: 'downloaded', latest: v, percent: 100 });
        if (askedFor === v) return;
        askedFor = v;
        const win = getWin();
        const r = await dialog.showMessageBox(win || undefined, {
            type: 'info', buttons: ['지금 다시 시작해 설치', '나중에 (끌 때 설치)'], defaultId: 0, cancelId: 1,
            title: 'Hemicycle 업데이트', message: `새 버전 ${v}을(를) 받았습니다.`,
            detail: '지금 다시 시작하면 바로 설치됩니다. 저장하지 않은 작업이 있으면 먼저 저장하세요. 나중에를 고르면 앱을 끌 때 설치됩니다.',
        });
        if (r.response === 0) installNow();
    });
    return true;
}

function check(manual) {
    if (state.mode === 'off') { setState({ status: 'off' }); return; }
    if (state.mode === 'auto' && updater) {
        if (state.status === 'downloading' || state.status === 'downloaded') { if (manual) setState({}); return; }
        updater.checkForUpdates().catch(e => setState({ status: 'error', error: String(e && e.message || e) }));
    } else checkByApi(manual);
}
function installNow() {
    if (state.mode === 'auto' && updater && state.status === 'downloaded') {
        setImmediate(() => updater.quitAndInstall(false, true));
        return true;
    }
    return false;
}
function schedule() {
    if (timer) { clearInterval(timer); timer = null; }
    if (!settings.autoUpdate || state.mode === 'off') return;
    timer = setInterval(() => check(false), CHECK_EVERY_MS);
}

// main.js에서 한 번 부른다: { send(state), getWin(), settings: { autoUpdate }, save(settings) }
function init(opts) {
    send = opts.send || send;
    getWin = opts.getWin || getWin;
    settings = { autoUpdate: true, ...(opts.settings || {}) };
    saveSettings = opts.save || saveSettings;
    const mode = detectMode();
    setState({ mode, status: mode === 'off' ? 'off' : 'idle' });
    if (mode === 'auto' && !setupAutoUpdater()) setState({ mode: 'notify' });
    if (mode !== 'off' && settings.autoUpdate) setTimeout(() => check(false), FIRST_CHECK_DELAY_MS);
    schedule();
}
function setAuto(on) {
    settings.autoUpdate = !!on;
    saveSettings(settings);
    schedule();
    if (on) check(false);
    return settings.autoUpdate;
}

module.exports = {
    init,
    getState: () => ({ ...state, autoUpdate: settings.autoUpdate, releasesUrl: RELEASES_URL }),
    check: () => { check(true); return true; },
    install: installNow,
    setAuto,
    openReleases: () => shell.openExternal(RELEASES_URL),
    _newer: newer,
};
