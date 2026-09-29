// ===== 모드(창작마당) 불러오기 — 언어 팩 · 테마 · 프리셋 =====
// 모드 하나 = 폴더 하나 (Steam 창작마당 아이템 하나와 같은 구조):
//   <폴더>/
//     hemicycle-item.json   (선택) { "type": "language" | "theme" | "preset", "file": "...", "title", "description", "tags", ... }
//     <내용 파일>            언어 팩(.json) · 테마(.json) · 프리셋(세이브 파일 .hemi 또는 .json)
//     preview.png           (선택) 창작마당 미리보기 그림 — 올릴 때만 쓰임
// hemicycle-item.json이 없으면 폴더 안 파일을 보고 알아서 판단한다:
//   - "format": "dno-lang-pack@1"      → 언어 팩
//   - "format": "hemicycle-theme@1"    → 테마
//   - .hemi 파일, 또는 세이브 형식(.json) → 프리셋 (제목은 폴더 이름)
//
// 읽어 오는 곳
//   1) 모드 폴더: <사용자 데이터>/mods/<폴더>  — 직접 넣은 모드, 창작마당에 올리기 전 시험용
//   2) Steam 창작마당: 구독한 아이템의 설치 폴더 — electron/steam.json에 appId가 있고 steamworks.js가 설치돼 있을 때만
//      (Steam에 출시되기 전에는 appId가 비어 있어 이 부분은 조용히 건너뛴다)
const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const zlib = require('zlib');

const ITEM_MANIFEST = 'hemicycle-item.json';
const LANG_FORMAT = 'dno-lang-pack@1';
const THEME_FORMAT = 'hemicycle-theme@1';
const MAX_JSON_BYTES = 3000000;      // 언어 팩 · 테마
const MAX_PRESET_BYTES = 30000000;   // 프리셋(세이브) — 사진이 들어가면 커질 수 있음

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

// ---- 파일 읽기 ----
function readText(file, maxBytes) {
    const stat = fs.statSync(file);
    if (!stat.isFile() || stat.size > maxBytes) return null;
    let buf = fs.readFileSync(file);
    if (buf.length >= 2 && buf[0] === 0x1f && buf[1] === 0x8b) buf = zlib.gunzipSync(buf); // .hemi (gzip)
    return buf.toString('utf8').replace(/^﻿/, '');
}
function readJson(file, maxBytes = MAX_JSON_BYTES) {
    const text = readText(file, maxBytes);
    return text == null ? null : JSON.parse(text);
}
function isSaveState(obj) {
    const parl = obj && (obj.parliament || obj.data);
    return !!(parl && Array.isArray(parl.parties));
}
function inside(folder, file) {
    const rel = path.relative(folder, file);
    return rel && !rel.startsWith('..') && !path.isAbsolute(rel);
}

// 프리셋은 목록(제목 등)만 먼저 넘기고, 실제 상태는 고를 때 key로 읽는다
const presetFiles = new Map(); // key → 파일 경로

// ---- 폴더 하나 읽기 → { languages, themes, presets } ----
function readItemFolder(folder, source, itemId) {
    const out = { languages: [], themes: [], presets: [] };
    const base = { source, itemId: itemId || null, folder: path.basename(folder) };
    let manifest = null;
    try { manifest = readJson(path.join(folder, ITEM_MANIFEST)); } catch (e) { manifest = null; }
    manifest = manifest && typeof manifest === 'object' ? manifest : {};
    const type = manifest.type ? String(manifest.type) : '';
    if (type && !['language', 'theme', 'preset'].includes(type)) return out; // 모르는 종류(나중에 생길 다른 모드)

    let files;
    if (manifest.file) files = [String(manifest.file)];
    else {
        try { files = fs.readdirSync(folder).filter(f => /\.(json|hemi)$/i.test(f) && f !== ITEM_MANIFEST); }
        catch (e) { files = []; }
    }
    files.forEach(f => {
        const file = path.join(folder, f);
        if (!inside(folder, file) || !fs.existsSync(file)) return; // 폴더 밖 파일은 읽지 않음
        try {
            const isHemi = /\.hemi$/i.test(f);
            if (!isHemi && type !== 'preset') {
                const obj = readJson(file, MAX_PRESET_BYTES);
                if (obj && obj.format === LANG_FORMAT && (!type || type === 'language')) { out.languages.push({ ...base, pack: obj }); return; }
                if (obj && obj.format === THEME_FORMAT && (!type || type === 'theme')) { out.themes.push({ ...base, theme: obj }); return; }
                if (type) return;
                if (!isSaveState(obj)) return;
            }
            if (type && type !== 'preset') return;
            // 프리셋: 목록에는 제목 등만 — 세이브 형식인지는 여기서 한 번 확인
            if (isHemi || type === 'preset') {
                const obj = readJson(file, MAX_PRESET_BYTES);
                if (!isSaveState(obj)) return;
            }
            const key = `${source}:${itemId || base.folder}:${f}`;
            presetFiles.set(key, file);
            out.presets.push({
                ...base,
                key,
                title: String(manifest.title || base.folder).slice(0, 80),
                description: String(manifest.description || ''),
                date: String(manifest.date || ''),
                author: String(manifest.author || ''),
            });
        } catch (e) {
            console.warn('모드 파일을 읽지 못했습니다:', file, e && e.message);
        }
    });
    return out;
}

// 폴더 구성 · 파일 수정 시각이 그대로면 지난번 결과를 다시 쓴다 (페이지를 옮길 때마다 불리므로)
function folderSignature(folders) {
    return folders.map(({ folder }) => {
        let files = [];
        try { files = fs.readdirSync(folder).map(f => { try { const st = fs.statSync(path.join(folder, f)); return `${f}:${st.size}:${st.mtimeMs}`; } catch (e) { return f; } }); }
        catch (e) { files = []; }
        return folder + '|' + files.sort().join(',');
    }).join('\n');
}
let cache = null;

// 모드 폴더 + 창작마당에서 찾은 모드 전부 (같은 코드/아이디가 여러 개면 페이지 쪽에서 먼저 온 것을 씀)
function listMods() {
    const base = modsDir();
    let dirs = [];
    try { dirs = fs.readdirSync(base, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => ({ source: 'local', folder: path.join(base, d.name) })); }
    catch (e) { dirs = []; }
    const folders = dirs.concat(steamItemFolders().map(({ itemId, folder }) => ({ source: 'workshop', itemId, folder })));
    const sig = folderSignature(folders);
    if (cache && cache.sig === sig) return cache.result;
    const all = { languages: [], themes: [], presets: [] };
    presetFiles.clear();
    const add = r => { all.languages.push(...r.languages); all.themes.push(...r.themes); all.presets.push(...r.presets); };
    folders.forEach(({ source, itemId, folder }) => add(readItemFolder(folder, source, itemId)));
    cache = { sig, result: all };
    return all;
}

function loadPreset(key) {
    const file = presetFiles.get(String(key));
    if (!file) throw new Error('preset not found: ' + key);
    const obj = readJson(file, MAX_PRESET_BYTES);
    if (!isSaveState(obj)) throw new Error('not a save file: ' + key);
    return obj;
}

module.exports = { modsDir, listMods, loadPreset, steam, ITEM_MANIFEST, LANG_FORMAT, THEME_FORMAT };
