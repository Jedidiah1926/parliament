// 설정 화면에서 창 표시 방식(창 모드 · 전체 화면 · 테두리 없는 전체 화면)을 바꿀 수 있게
// 페이지에 꼭 필요한 기능만 내어 준다. (앱 안에서만 존재 — 웹 버전에서는 window.hemicycleDesktop이 없음)
const { contextBridge, ipcRenderer } = require('electron');

// 모드 폴더 · Steam 창작마당에서 찾은 언어 팩 — 언어 엔진(lang.js)이 페이지 시작 때 바로 읽는다
let modLanguagePacks = [];
try { modLanguagePacks = ipcRenderer.sendSync('mods:language-packs') || []; } catch (e) { modLanguagePacks = []; }

contextBridge.exposeInMainWorld('hemicycleDesktop', {
    modLanguagePacks,
    openModsFolder: () => ipcRenderer.invoke('mods:open-folder'),
    getDisplayMode: () => ipcRenderer.invoke('display-mode:get'),
    setDisplayMode: mode => ipcRenderer.invoke('display-mode:set', mode),
    onDisplayModeChange: callback => {
        if (typeof callback !== 'function') return;
        ipcRenderer.on('display-mode:changed', (event, mode) => callback(mode));
    }
});
