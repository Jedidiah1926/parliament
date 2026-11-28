// 설정 화면에서 창 표시 방식(창 모드 · 전체 화면 · 테두리 없는 전체 화면)을 바꿀 수 있게
// 페이지에 꼭 필요한 기능만 내어 준다. (앱 안에서만 존재 — 웹 버전에서는 window.hemicycleDesktop이 없음)
const { contextBridge, ipcRenderer } = require('electron');

// 모드 폴더 · Steam 창작마당에서 찾은 모드 — 언어 엔진(lang.js) · 테마(thememode.js)가 페이지 시작 때 바로 읽는다
let modList = { languages: [], themes: [], presets: [], presetLangs: [], scripts: [] };
try { modList = ipcRenderer.sendSync('mods:list') || modList; } catch (e) { /* 모드 없이 계속 */ }
let steamBuild = false;
try { steamBuild = !!ipcRenderer.sendSync('app:is-steam'); } catch (e) { /* 아님 */ }

contextBridge.exposeInMainWorld('hemicycleDesktop', {
    isSteamBuild: steamBuild, // Steam 판 — 정식 출시(js/official.js) 뒤에도 플레이를 막지 않음
    modLanguagePacks: modList.languages || [],
    modThemes: modList.themes || [],
    modPresets: modList.presets || [],       // 목록(제목 · 설명 등)만 — 상태는 loadModPreset(key)로
    modPresetLangs: modList.presetLangs || [], // 다른 프리셋(내장 프리셋 등)에 더하는 언어별 파일 — { target, lang, key, title }
    modScripts: modList.scripts || [],         // 스크립트 모드(이벤트 · 결정 · 변수 JSON) — { source, folder, title, data } (js/scriptmods.js)
    loadModPreset: key => ipcRenderer.invoke('mods:preset', key),
    openModsFolder: () => ipcRenderer.invoke('mods:open-folder'),
    getDisplayMode: () => ipcRenderer.invoke('display-mode:get'),
    setDisplayMode: mode => ipcRenderer.invoke('display-mode:set', mode),
    // 해상도 (창 모드 크기) — { mode, maximized, scale, monitor, current, chosen, options:[{width,height,fits}] }
    getResolution: () => ipcRenderer.invoke('resolution:get'),
    setResolution: (w, h) => ipcRenderer.invoke('resolution:set', w, h),
    onDisplayModeChange: callback => {
        if (typeof callback !== 'function') return;
        ipcRenderer.on('display-mode:changed', (event, mode) => callback(mode));
    },
    // 세이브 폴더 (electron/saves.js) — js/desktopsaves.js가 페이지의 세이브 목록을 폴더의 .hemi 파일과 맞춘다
    saves: {
        read: ns => ipcRenderer.sendSync('saves:read', String(ns || '')),
        write: (ns, text) => ipcRenderer.sendSync('saves:write', String(ns || ''), String(text || '[]')),
        writeSlot: (ns, meta, state) => ipcRenderer.sendSync('saves:write-slot', String(ns || ''), String(meta || ''), String(state || '')),
        dir: () => ipcRenderer.sendSync('saves:dir-sync'),
        info: () => ipcRenderer.invoke('saves:info'),
        openDir: () => ipcRenderer.invoke('saves:open-dir'),
        chooseDir: title => ipcRenderer.invoke('saves:choose-dir', String(title || '')),
        resetDir: () => ipcRenderer.invoke('saves:reset-dir'),
    },
});
