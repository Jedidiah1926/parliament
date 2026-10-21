// ===== 자동 업데이트 — GitHub Release에 새 버전이 올라오면 받아서 설치 =====
// 업데이트는 필수 — 새 버전이 확인되면 설치하기 전까지 앱을 쓸 수 없다 (preload.js가 모든 화면을 덮는 안내를 띄움).
// 설치 프로그램(NSIS)으로 깐 앱: electron-updater가 Release의 업데이트 정보(latest.yml)를 보고 새 버전을 받고,
//   다 받으면 지금 세이브를 저장한 뒤 다시 시작해 설치한다.
// 압축(zip)으로 푼 앱: 스스로 바꿔 끼울 수 없으므로 새 버전 설치 프로그램을 받으라고 막고 Release 페이지를 열어 준다.
// Steam 판(Steam이 업데이트) · 개발 중(npm start)에는 확인하지 않는다. 인터넷이 안 돼 확인 자체를 못 하면 막지 않는다.
const { app, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');

const OWNER = 'Jedidiah1926';
const REPO = 'parliament';
const RELEASES_URL = `https://github.com/${OWNER}/${REPO}/releases`;
const CHECK_EVERY_MS = 4 * 60 * 60 * 1000; // 켜 둔 동안 4시간마다 다시 확인
const FIRST_CHECK_DELAY_MS = 0; // 켜자마자 확인 — 확인되기 전에도 쓸 수 있지만, 새 버전이 있으면 바로 막는다
const INSTALL_DELAY_MS = 3000; // 다 받은 뒤 다시 시작하기까지 (안내를 읽을 시간)

let state = { status: 'idle', version: app.getVersion(), latest: null, percent: 0, error: null, mode: 'off', required: false, block: false };
let send = () => {};
let getWin = () => null;
let settings = { autoUpdate: true };
let saveSettings = () => {};
let updater = null;
let timer = null;
let beforeInstall = async () => {};
let installing = false;

function setState(patch) {
    state = { ...state, ...patch };
    // 새 버전이 있다고 확인되면(받는 중 · 다 받음 · 압축판 알림) 앱을 막는다. 그 뒤 받기가 실패해도 막은 채로 "다시 시도"
    if (['downloading', 'downloaded', 'available', 'installing'].includes(state.status)) state.required = true;
    state.block = state.mode !== 'off' && state.mode !== 'steam' && state.required;
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
// Steam 데모 빌드 (tools/build-demo.js가 electron/build.json을 씀) — Steam으로만 배포하므로 GitHub를 확인하지 않음
function demoBuild() {
    try { return !!JSON.parse(fs.readFileSync(path.join(__dirname, 'build.json'), 'utf8')).demo; } catch (e) { return false; }
}
function detectMode() {
    if (!app.isPackaged) return 'off';
    if (steamBuild() || demoBuild()) return 'steam';
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
            setState({ status: 'available', latest, releaseUrl: rel.html_url || RELEASES_URL });
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
    updater.on('update-downloaded', info => {
        const v = info && info.version || state.latest;
        setState({ status: 'downloaded', latest: v, percent: 100 });
        setTimeout(installNow, INSTALL_DELAY_MS); // 필수 업데이트 — 잠깐 안내한 뒤 저장하고 다시 시작해 설치
    });
    return true;
}

function check(manual) {
    if (state.mode === 'off') { setState({ status: 'off' }); return; }
    if (state.mode === 'auto' && updater) {
        if (['downloading', 'downloaded', 'installing'].includes(state.status)) { if (manual) setState({}); return; }
        updater.checkForUpdates().catch(e => setState({ status: 'error', error: String(e && e.message || e) }));
    } else checkByApi(manual);
}
function installNow() {
    if (installing || state.mode !== 'auto' || !updater || state.status !== 'downloaded') return false;
    installing = true;
    setState({ status: 'installing' });
    Promise.resolve().then(() => beforeInstall()).catch(() => {}).then(() => {
        setImmediate(() => updater.quitAndInstall(false, true));
    });
    return true;
}
function schedule() {
    if (timer) { clearInterval(timer); timer = null; }
    if (state.mode === 'off' || state.mode === 'steam') return;
    timer = setInterval(() => check(false), CHECK_EVERY_MS);
}

// main.js에서 한 번 부른다: { send(state), getWin(), settings: { autoUpdate }, save(settings) }
function init(opts) {
    send = opts.send || send;
    getWin = opts.getWin || getWin;
    settings = { autoUpdate: true, ...(opts.settings || {}) };
    saveSettings = opts.save || saveSettings;
    beforeInstall = opts.beforeInstall || beforeInstall;
    const mode = detectMode();
    setState({ mode, status: mode === 'off' ? 'off' : 'idle' });
    if (mode === 'auto' && !setupAutoUpdater()) setState({ mode: 'notify' });
    if (mode !== 'off' && mode !== 'steam') setTimeout(() => check(false), FIRST_CHECK_DELAY_MS);
    schedule();
}
// 업데이트가 필수가 되어 끌 수 없다 — 예전 설정 화면 호환용으로 남겨 둠
function setAuto() { return true; }

module.exports = {
    init,
    getState: () => ({ ...state, autoUpdate: true, releasesUrl: RELEASES_URL }),
    check: () => { check(true); return true; },
    install: installNow,
    setAuto,
    openReleases: () => shell.openExternal(state.releaseUrl || RELEASES_URL),
    _newer: newer,
};
