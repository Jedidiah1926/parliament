// ===== 모드(창작마당) 불러오기 — 지금은 언어 팩만 =====
// 언어 팩 하나 = 폴더 하나 (Steam 창작마당 아이템 하나와 같은 구조):
//   <폴더>/
//     hemicycle-item.json   (선택) { "type": "language", "file": "pack.json", "title": "...", "description": "...", "tags": [...] }
//     pack.json             언어 팩 (형식 dno-lang-pack@1 — 메인 화면 🌐 > 번역 템플릿으로 만든 파일)
//     preview.png           (선택) 창작마당 미리보기 그림 — 올릴 때만 쓰임
// hemicycle-item.json이 없으면 폴더 안의 .json 중 형식이 dno-lang-pack@1인 파일을 모두 언어 팩으로 본다.
//
// 읽어 오는 곳
//   1) 모드 폴더: <사용자 데이터>/mods/<폴더>  — 직접 넣은 팩, 창작마당에 올리기 전 시험용
//   2) Steam 창작마당: 구독한 아이템의 설치 폴더 — electron/steam.json에 appId가 있고 steamworks.js가 설치돼 있을 때만
//      (Steam에 출시되기 전에는 appId가 비어 있어 이 부분은 조용히 건너뛴다)
const { app } = require('electron');
const path = require('path');
const fs = require('fs');

const ITEM_MANIFEST = 'hemicycle-item.json';
const PACK_FORMAT = 'dno-lang-pack@1';
const MAX_PACK_BYTES = 3000000;

function modsDir() {
    const dir = path.join(app.getPath('userData'), 'mods');
    try { fs.mkdirSync(dir, { recursive: true }); } catch (e) { /* 못 만들어도 계속 */ }
    return dir;
}

// ---- Steam (선택) ----
let steamClient = null;
let steamTried = false;
function steamConfig() {
    try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'steam.json'), 'utf8')) || {}; }
    catch (e) { return {}; }
}
function steam() {
    if (steamTried) return steamClient;
    steamTried = true;
    const appId = Number(process.env.HEMICYCLE_STEAM_APP_ID || steamConfig().appId) || 0;
    if (!appId) return null;
    try {
        // eslint-disable-next-line global-require
        const steamworks = require('steamworks.js');
        steamClient = steamworks.init(appId);
        if (typeof steamworks.electronEnableSteamOverlay === 'function') steamworks.electronEnableSteamOverlay();
    } catch (e) {
        console.warn('Steam 창작마당을 쓸 수 없습니다 (Steam 미실행 또는 steamworks.js 없음):', e && e.message);
        steamClient = null;
    }
    return steamClient;
}
function steamItemFolders() {
    const client = steam();
    if (!client || !client.workshop) return [];
    try {
        return (client.workshop.getSubscribedItems() || []).map(id => {
            const info = client.workshop.installInfo(id);
            return info && info.folder ? { itemId: String(id), folder: info.folder } : null;
        }).filter(Boolean);
    } catch (e) {
        console.warn('창작마당 구독 목록을 읽지 못했습니다:', e && e.message);
        return [];
    }
}

// ---- 폴더 하나에서 언어 팩 읽기 ----
function readJson(file) {
    const stat = fs.statSync(file);
    if (!stat.isFile() || stat.size > MAX_PACK_BYTES) return null;
    return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, ''));
}
function readItemFolder(folder, source, itemId) {
    const out = [];
    let manifest = null;
    try { manifest = readJson(path.join(folder, ITEM_MANIFEST)); } catch (e) { manifest = null; }
    if (manifest && manifest.type && manifest.type !== 'language') return out; // 언어 팩이 아닌 아이템(나중에 생길 다른 종류)
    let files;
    if (manifest && manifest.file) files = [String(manifest.file)];
    else {
        try { files = fs.readdirSync(folder).filter(f => /\.json$/i.test(f) && f !== ITEM_MANIFEST); }
        catch (e) { files = []; }
    }
    files.forEach(f => {
        const file = path.join(folder, f);
        if (path.relative(folder, file).startsWith('..')) return; // 폴더 밖 파일은 읽지 않음
        try {
            const pack = readJson(file);
            if (pack && pack.format === PACK_FORMAT) out.push({ source, itemId: itemId || null, folder: path.basename(folder), pack });
        } catch (e) {
            console.warn('언어 팩을 읽지 못했습니다:', file, e && e.message);
        }
    });
    return out;
}

// 모드 폴더 + 창작마당에서 찾은 언어 팩 전부 (같은 코드가 여러 개면 페이지 쪽에서 먼저 온 것을 씀)
function listLanguagePacks() {
    const out = [];
    const base = modsDir();
    let dirs = [];
    try { dirs = fs.readdirSync(base, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => path.join(base, d.name)); }
    catch (e) { dirs = []; }
    dirs.forEach(d => out.push(...readItemFolder(d, 'local')));
    steamItemFolders().forEach(({ itemId, folder }) => out.push(...readItemFolder(folder, 'workshop', itemId)));
    return out;
}

module.exports = { modsDir, listLanguagePacks, steam, ITEM_MANIFEST, PACK_FORMAT };
