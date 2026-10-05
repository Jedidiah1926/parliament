// Steam 창작마당에 모드(언어 팩 · 테마 · 프리셋) 올리기 (Steam 출시 후에 쓰는 도구 — 미리 준비해 둔 것)
//
// 준비:
//   1) electron/steam.json의 appId에 Steamworks App ID를 넣는다 (또는 HEMICYCLE_STEAM_APP_ID 환경 변수)
//   2) npm install steamworks.js
//   3) Steam 클라이언트에 로그인한 상태로 실행
//
// 쓰는 법:
//   node tools/workshop-upload.js <아이템 폴더>                 새 아이템을 만들어 올림 (만든 id를 폴더의 hemicycle-item.json에 적어 둠)
//   node tools/workshop-upload.js <아이템 폴더> --note "변경 내용"  hemicycle-item.json에 id가 있으면 그 아이템을 업데이트
//
// 아이템 폴더 구조는 electron/mods.js 맨 위 설명과 같다 (내용 파일 + 선택: hemicycle-item.json · preview.png).
// hemicycle-item.json의 title · description · tags · visibility를 창작마당 정보로 쓰고, 없으면 내용 파일의 name · author 등으로 채운다.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const LANG_FORMAT = 'dno-lang-pack@1';
const THEME_FORMAT = 'hemicycle-theme@1';
const ITEM_MANIFEST = 'hemicycle-item.json';
const TYPE_TAG = { language: 'Language', theme: 'Theme', preset: 'Preset', 'preset-language': 'Preset' };

function fail(msg) { console.error('✖ ' + msg); process.exit(1); }

const args = process.argv.slice(2);
const folder = args[0] && path.resolve(args[0]);
const noteIdx = args.indexOf('--note');
const changeNote = noteIdx >= 0 ? String(args[noteIdx + 1] || '') : '';
if (!folder || !fs.existsSync(folder) || !fs.statSync(folder).isDirectory()) fail('아이템 폴더를 지정하세요: node tools/workshop-upload.js <폴더>');

let steamCfg = {};
try { steamCfg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'electron', 'steam.json'), 'utf8')); } catch (e) { /* 없음 */ }
const appId = Number(process.env.HEMICYCLE_STEAM_APP_ID || steamCfg.appId) || 0;
if (!appId) fail('Steam App ID가 없습니다. electron/steam.json의 appId를 채우세요.');

// ---- 아이템 내용 확인 ----
const manifestPath = path.join(folder, ITEM_MANIFEST);
let manifest = {};
if (fs.existsSync(manifestPath)) {
    try { manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8').replace(/^﻿/, '')); }
    catch (e) { fail(`${ITEM_MANIFEST}을 읽지 못했습니다: ${e.message}`); }
}
if (manifest.type && !TYPE_TAG[manifest.type]) fail(`지원하지 않는 아이템 종류입니다: ${manifest.type}`);
function readJson(file) {
    let buf = fs.readFileSync(file);
    if (buf.length >= 2 && buf[0] === 0x1f && buf[1] === 0x8b) buf = zlib.gunzipSync(buf);
    return JSON.parse(buf.toString('utf8').replace(/^\uFEFF/, ''));
}
const isSave = o => { const parl = o && (o.parliament || o.data); return !!(parl && Array.isArray(parl.parties)); };
const files = manifest.file ? [manifest.file] : fs.readdirSync(folder).filter(f => /\.(json|hemi)$/i.test(f) && f !== ITEM_MANIFEST);
let type = manifest.type || '';
let content = null;
for (const f of files) {
    let obj;
    try { obj = readJson(path.join(folder, f)); } catch (e) { continue; }
    const t = obj && obj.format === LANG_FORMAT ? 'language' : obj && obj.format === THEME_FORMAT ? 'theme' : isSave(obj) ? 'preset' : '';
    if (t && (!type || type === t || (type === 'preset-language' && t === 'preset'))) { type = type || t; content = obj; break; }
}
if (!content) fail('폴더에 올릴 내용이 없습니다 (언어 팩 · 테마 · 프리셋 세이브 파일).');

let defTitle, defDesc;
if (type === 'language') {
    if (!content.code || !content.name) fail('언어 팩의 code · name을 채우세요.');
    defTitle = `${content.name} (${content.code}) — Hemicycle language pack`;
    defDesc = `${content.name} translation for Hemicycle.${content.author ? ` By ${content.author}.` : ''}`;
} else if (type === 'theme') {
    if (!content.id || !content.name) fail('테마의 id · name을 채우세요.');
    defTitle = `${content.name} — Hemicycle theme`;
    defDesc = `${content.name} theme for Hemicycle.${content.author ? ` By ${content.author}.` : ''}`;
} else {
    defTitle = `${path.basename(folder)} — Hemicycle preset`;
    defDesc = 'Scenario preset for Hemicycle.';
}
const title = String(manifest.title || defTitle).slice(0, 128);
const description = String(manifest.description || defDesc);
const tags = Array.isArray(manifest.tags) && manifest.tags.length ? manifest.tags.map(String) : [TYPE_TAG[type]];
const previewPath = ['preview.png', 'preview.jpg', 'preview.gif'].map(f => path.join(folder, f)).find(f => fs.existsSync(f));

(async () => {
    let steamworks;
    try { steamworks = require('steamworks.js'); } catch (e) { fail('steamworks.js가 없습니다. `npm install steamworks.js` 후 다시 실행하세요.'); }
    let client;
    try { client = steamworks.init(appId); } catch (e) { fail(`Steam에 연결하지 못했습니다 (Steam 클라이언트가 켜져 있나요?): ${e.message}`); }

    let itemId = manifest.workshopId ? BigInt(manifest.workshopId) : null;
    if (!itemId) {
        const created = await client.workshop.createItem(appId);
        itemId = created.itemId;
        if (created.needsToAcceptAgreement) console.log('! Steam 창작마당 이용 약관에 동의해야 아이템이 공개됩니다.');
        manifest = { type, ...manifest, workshopId: String(itemId) };
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
        console.log(`새 아이템을 만들었습니다: ${itemId} (${ITEM_MANIFEST}에 기록)`);
    }
    await client.workshop.updateItem(itemId, {
        title,
        description,
        changeNote: changeNote || undefined,
        previewPath,
        contentPath: folder,
        tags,
        visibility: manifest.visibility,
    }, appId);
    console.log(`✔ 올렸습니다: https://steamcommunity.com/sharedfiles/filedetails/?id=${itemId}`);
    process.exit(0);
})().catch(e => fail(e && e.message ? e.message : String(e)));
