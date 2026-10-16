// 설정 화면에서 창 표시 방식(창 모드 · 전체 화면 · 테두리 없는 전체 화면)을 바꿀 수 있게
// 페이지에 꼭 필요한 기능만 내어 준다. (앱 안에서만 존재 — 웹 버전에서는 window.hemicycleDesktop이 없음)
const { contextBridge, ipcRenderer } = require('electron');

// 모드 폴더 · Steam 창작마당에서 찾은 모드 — 언어 엔진(lang.js) · 테마(thememode.js)가 페이지 시작 때 바로 읽는다
let modList = { languages: [], themes: [], presets: [], presetLangs: [] };
try { modList = ipcRenderer.sendSync('mods:list') || modList; } catch (e) { /* 모드 없이 계속 */ }
let steamBuild = false;
try { steamBuild = !!ipcRenderer.sendSync('app:is-steam'); } catch (e) { /* 아님 */ }

contextBridge.exposeInMainWorld('hemicycleDesktop', {
    isSteamBuild: steamBuild, // Steam 판 — 정식 출시(js/official.js) 뒤에도 플레이를 막지 않음
    modLanguagePacks: modList.languages || [],
    modThemes: modList.themes || [],
    modPresets: modList.presets || [],       // 목록(제목 · 설명 등)만 — 상태는 loadModPreset(key)로
    modPresetLangs: modList.presetLangs || [], // 다른 프리셋(내장 프리셋 등)에 더하는 언어별 파일 — { target, lang, key, title }
    loadModPreset: key => ipcRenderer.invoke('mods:preset', key),
    openModsFolder: () => ipcRenderer.invoke('mods:open-folder'),
    getDisplayMode: () => ipcRenderer.invoke('display-mode:get'),
    setDisplayMode: mode => ipcRenderer.invoke('display-mode:set', mode),
    onDisplayModeChange: callback => {
        if (typeof callback !== 'function') return;
        ipcRenderer.on('display-mode:changed', (event, mode) => callback(mode));
    },
    // 자동 업데이트 — 상태 { status: idle|checking|none|downloading|downloaded|available|error|off, version, latest, percent, mode: auto|notify|steam|off, autoUpdate }
    getUpdateState: () => ipcRenderer.invoke('update:get'),
    checkForUpdates: () => ipcRenderer.invoke('update:check'),
    installUpdate: () => ipcRenderer.invoke('update:install'),
    setAutoUpdate: on => ipcRenderer.invoke('update:set-auto', !!on),
    openReleases: () => ipcRenderer.invoke('update:open-releases'),
    quitApp: () => ipcRenderer.invoke('update:quit'),
    onUpdateStatus: callback => {
        if (typeof callback !== 'function') return;
        ipcRenderer.on('update:status', (event, st) => callback(st));
    }
});

// ===== 필수 업데이트 — 새 버전이 확인되면 설치할 때까지 모든 화면을 덮어 앱을 쓸 수 없게 한다 (electron/updater.js가 block을 정함) =====
(function updateGate() {
    let box = null, st = null;
    const T = {
        downloading: s => `새 버전 ${s.latest || ''}을(를) 받는 중입니다… ${s.percent || 0}%`,
        downloaded: s => `새 버전 ${s.latest || ''}을(를) 받았습니다. 지금 세이브를 저장하고 다시 시작해 설치합니다…`,
        installing: s => `새 버전 ${s.latest || ''}을(를) 설치하려고 다시 시작합니다…`,
        available: s => `새 버전 ${s.latest || ''}이(가) 나왔습니다. 이 앱은 압축 파일로 실행 중이라 직접 바꿀 수 없으니, 다운로드 페이지에서 새 설치 프로그램(Setup)을 받아 설치해 주세요. 설치 프로그램으로 깔면 다음부터는 자동으로 업데이트됩니다.`,
        error: s => `새 버전 ${s.latest || ''}을(를) 받지 못했습니다 (${s.error || '알 수 없는 오류'}). 인터넷 연결을 확인하고 다시 시도해 주세요.`,
    };
    const block = e => { if (st && st.block) { e.stopImmediatePropagation(); if (e.type === 'keydown' && !(e.key === 'F11')) e.preventDefault(); } };
    function render() {
        if (!document.body) return;
        if (!st || !st.block) { if (box) { box.remove(); box = null; } return; }
        if (!box) {
            box = document.createElement('div');
            box.id = 'hemiUpdateGate';
            box.setAttribute('role', 'alertdialog');
            box.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:rgba(8,10,14,.92);display:flex;align-items:center;justify-content:center;font-family:system-ui,"Malgun Gothic",sans-serif;';
            box.innerHTML = '<div style="max-width:440px;width:calc(100% - 32px);background:#14171d;color:#e8eaed;border:1px solid #2f3540;border-radius:12px;padding:22px 22px 18px;box-shadow:0 20px 60px rgba(0,0,0,.5)">'
                + '<div style="font-size:18px;font-weight:700;margin-bottom:6px">업데이트가 필요합니다</div>'
                + '<div data-g="ver" style="font-size:12px;color:#9aa3af;margin-bottom:12px"></div>'
                + '<div data-g="msg" style="font-size:14px;line-height:1.6;margin-bottom:12px"></div>'
                + '<div data-g="bar" style="height:6px;background:#2a2f38;border-radius:3px;overflow:hidden;margin-bottom:14px"><div data-g="fill" style="height:100%;width:0;background:#3b82f6;transition:width .2s"></div></div>'
                + '<div data-g="btns" style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap"></div></div>';
            document.body.appendChild(box);
        }
        const api = window.hemicycleDesktop;
        box.querySelector('[data-g="ver"]').textContent = `지금 버전 ${st.version} → 새 버전 ${st.latest || '?'}`;
        box.querySelector('[data-g="msg"]').textContent = (T[st.status] || T.downloading)(st);
        box.querySelector('[data-g="bar"]').style.display = ['downloading', 'downloaded', 'installing'].includes(st.status) ? '' : 'none';
        box.querySelector('[data-g="fill"]').style.width = (st.status === 'downloading' ? st.percent || 0 : 100) + '%';
        const btns = box.querySelector('[data-g="btns"]');
        btns.innerHTML = '';
        const btn = (label, fn, primary) => {
            const b = document.createElement('button');
            b.type = 'button'; b.textContent = label;
            b.style.cssText = `cursor:pointer;font:inherit;font-size:13px;padding:8px 14px;border-radius:8px;border:1px solid ${primary ? '#3b82f6' : '#3a414d'};background:${primary ? '#3b82f6' : 'transparent'};color:${primary ? '#fff' : '#e8eaed'}`;
            b.addEventListener('click', e => { e.stopPropagation(); fn(); });
            btns.appendChild(b);
        };
        if (st.status === 'available') { btn('다운로드 페이지 열기', () => ipcRenderer.invoke('update:open-releases'), true); btn('종료', () => ipcRenderer.invoke('update:quit')); }
        else if (st.status === 'error') { btn('다시 시도', () => ipcRenderer.invoke('update:check'), true); btn('다운로드 페이지', () => ipcRenderer.invoke('update:open-releases')); btn('종료', () => ipcRenderer.invoke('update:quit')); }
        void api;
    }
    ipcRenderer.on('update:status', (event, s) => { st = s; render(); });
    ['keydown', 'keyup', 'keypress', 'wheel'].forEach(t => window.addEventListener(t, block, true));
    window.addEventListener('DOMContentLoaded', () => {
        ipcRenderer.invoke('update:get').then(s => { st = s; render(); }).catch(() => {});
    });
})();
