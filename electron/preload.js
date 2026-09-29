// 설정 화면에서 창 표시 방식(창 모드 · 전체 화면 · 테두리 없는 전체 화면)을 바꿀 수 있게
// 페이지에 꼭 필요한 기능만 내어 준다. (앱 안에서만 존재 — 웹 버전에서는 window.hemicycleDesktop이 없음)
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('hemicycleDesktop', {
    getDisplayMode: () => ipcRenderer.invoke('display-mode:get'),
    setDisplayMode: mode => ipcRenderer.invoke('display-mode:set', mode),
    onDisplayModeChange: callback => {
        if (typeof callback !== 'function') return;
        ipcRenderer.on('display-mode:changed', (event, mode) => callback(mode));
    }
});
