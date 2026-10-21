// ===== 데스크톱 앱 세이브 폴더 — 세이브를 앱 데이터(브라우저 저장소)가 아니라 정한 폴더의 .hemi 파일로 =====
// 기본 위치: 문서\Hemicycle\Saves (설정 › 기타 설정 › 저장 위치에서 바꿈)
//   세이브 하나 = 파일 하나 "<세이브 이름>.hemi" (gzip으로 압축한 상태 JSON — "파일로 저장"과 같은 형식이라 불러오기로도 열림)
//   파일 안 __hemiSlot에 세이브 정보(id · 이름 · 만든/저장한 시각)를 넣어 두어, 다시 읽을 때 같은 세이브로 이어진다
//   본 게임은 폴더 바로 아래, 미리보기(티저)는 "Teaser 1.6.N", 로고 제작은 "로고" 하위 폴더
//   폴더가 원본 — 페이지를 열 때 폴더를 읽어 브라우저 저장소(작업용 사본)를 덮고, 저장할 때마다 바뀐 세이브만 파일로 쓴다.
//   탐색기에서 넣은 .hemi · .json 파일은 다음에 열 때 세이브로 보이고, 게임에서 지운 세이브는 휴지통으로 간다.
//   처음 쓰는 폴더(표시 파일 .hemicycle이 없음)는 그때까지 브라우저 저장소에 있던 세이브를 그대로 옮겨 담는다.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');

const MARKER = '.hemicycle';
const SAVE_EXT = '.hemi';
let base = null;            // 지금 저장 폴더
let defaultDir = () => '';  // 기본 저장 폴더 (init에서 받음)
let trash = p => { try { fs.unlinkSync(p); } catch (e) { /* 없음 */ } };
const cache = new Map();    // 저장 공간 → Map(세이브 id → { file, sig })

// 저장 공간 이름(js/main.js LS_PREFIX) → 하위 폴더. 정해진 모양만 받는다 (경로 조작 방지)
function subdirOf(ns) {
    if (ns === '') return '';
    if (ns === 'hemicycleLogo:') return '로고';
    const m = /^hemicycleTeaserV2-(\d)(\d{1,2}):$/.exec(ns);
    if (m) return `Teaser 1.${m[1]}.${m[2]}`;
    return null;
}
function nsDir(ns) {
    const sub = subdirOf(ns);
    if (sub == null) throw new Error('알 수 없는 저장 공간: ' + ns);
    return sub ? path.join(base, sub) : base;
}
const sha1 = s => crypto.createHash('sha1').update(s).digest('hex');
const RESERVED = /^(con|prn|aux|nul|com\d|lpt\d)$/i;
function safeName(name) {
    let s = String(name == null ? '' : name).replace(/[\\/:*?"<>|\x00-\x1f]/g, '_').replace(/[. ]+$/, '').trim().slice(0, 80);
    if (!s) s = '세이브';
    if (RESERVED.test(s)) s += '_';
    return s;
}
function uniqueFile(name, used) {
    let f = safeName(name) + SAVE_EXT;
    for (let i = 2; used.has(f.toLowerCase()); i++) f = `${safeName(name)} (${i})${SAVE_EXT}`;
    used.add(f.toLowerCase());
    return f;
}
// 세이브 → 파일 내용(JSON 글자). 세이브 정보는 state 안의 __hemiSlot에
function fileJson(slot) {
    const { state, ...meta } = slot;
    return JSON.stringify({ ...(state && typeof state === 'object' ? state : {}), __hemiSlot: meta });
}
function writeAtomic(file, json) {
    const tmp = file + '.tmp';
    fs.writeFileSync(tmp, zlib.gzipSync(Buffer.from(json, 'utf8'), { level: 9 })); // 무손실 — 가장 작게
    fs.renameSync(tmp, file);
}
function readText(file) {
    const buf = fs.readFileSync(file);
    return buf.length >= 2 && buf[0] === 0x1f && buf[1] === 0x8b ? zlib.gunzipSync(buf).toString('utf8') : buf.toString('utf8');
}

// 폴더의 세이브 읽기 → { initialized, slots }
function read(ns) {
    const dir = nsDir(ns);
    const c = new Map();
    cache.set(ns, c);
    if (!fs.existsSync(path.join(dir, MARKER))) return { initialized: false, slots: [], dir };
    const slots = [], ids = new Set();
    for (const f of fs.readdirSync(dir)) {
        if (!/\.(hemi|json)$/i.test(f)) continue;
        const full = path.join(dir, f);
        let obj, st;
        try { st = fs.statSync(full); if (!st.isFile()) continue; obj = JSON.parse(readText(full)); }
        catch (e) { continue; } // 세이브가 아닌 파일 · 깨진 파일은 건너뜀
        if (!obj || typeof obj !== 'object' || Array.isArray(obj)) continue;
        const { __hemiSlot: meta0, ...state } = obj;
        const meta = meta0 && typeof meta0 === 'object' ? { ...meta0 } : {};
        const stem = f.replace(/\.(hemi|json)$/i, '');
        // 탐색기에서 파일 이름을 바꿨으면 그 이름으로
        const name = meta.name != null && safeName(meta.name) === stem ? meta.name : stem;
        let id = typeof meta.id === 'string' && meta.id ? meta.id : 'file_' + sha1(f).slice(0, 12);
        while (ids.has(id)) id = 'file_' + sha1(id + f).slice(0, 12); // 파일을 복사해 둔 경우
        ids.add(id);
        const mtime = st.mtime.toISOString();
        const slot = { ...meta, id, name, createdAt: meta.createdAt || mtime, savedAt: meta.savedAt || mtime, state };
        delete slot.isAutosave;
        slots.push(slot);
        c.set(id, { file: f, sig: /\.hemi$/i.test(f) ? sha1(fileJson(slot)) : '' });
    }
    slots.sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
    return { initialized: true, slots, dir };
}

// 페이지가 세이브 목록(JSON 글자)을 저장할 때 — 바뀐 세이브만 파일로 쓰고, 이름이 바뀌면 파일 이름도, 없어진 세이브는 휴지통으로
function write(ns, text) {
    const slots = JSON.parse(text || '[]');
    if (!Array.isArray(slots)) throw new Error('세이브 목록이 아닙니다');
    const dir = nsDir(ns);
    fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(path.join(dir, MARKER))) fs.writeFileSync(path.join(dir, MARKER), JSON.stringify({ app: 'Hemicycle', v: 1 }));
    if (!cache.has(ns)) read(ns);
    const c = cache.get(ns);
    const used = new Set(), plan = [];
    for (const slot of slots) {
        if (!slot || typeof slot !== 'object' || !slot.id || !slot.state) continue;
        plan.push({ slot, file: uniqueFile(slot.name, used) });
    }
    const claimed = new Set(plan.map(p => p.file.toLowerCase()));
    let written = 0;
    for (const { slot, file } of plan) {
        const json = fileJson(slot), sig = sha1(json), prev = c.get(slot.id);
        if (prev && prev.file === file && prev.sig === sig) continue;
        writeAtomic(path.join(dir, file), json);
        written++;
        if (prev && prev.file !== file && !claimed.has(prev.file.toLowerCase())) trash(path.join(dir, prev.file));
        c.set(slot.id, { file, sig });
    }
    const keep = new Set(plan.map(p => p.slot.id));
    for (const [id, ent] of [...c]) {
        if (keep.has(id)) continue;
        if (!claimed.has(ent.file.toLowerCase())) trash(path.join(dir, ent.file));
        c.delete(id);
    }
    return { ok: true, written };
}

// 저장 폴더를 쓸 수 있는지 (Program Files처럼 관리자 권한이 필요한 곳은 보통 안 됨)
function writable(dir) {
    try {
        fs.mkdirSync(dir, { recursive: true });
        const t = path.join(dir, `.hemicycle-test-${process.pid}`);
        fs.writeFileSync(t, 'ok'); fs.unlinkSync(t);
        return true;
    } catch (e) { return false; }
}
// 저장 폴더 바꾸기 — 지금 폴더의 세이브(본 게임 · 하위 폴더)를 새 폴더로 옮긴다 (이름이 겹치면 " (2)")
function moveTo(next) {
    next = path.resolve(next);
    if (!writable(next)) return { ok: false, error: '이 폴더에는 쓸 수 없습니다 (관리자 권한이 필요한 곳일 수 있어요 — 문서 폴더 등을 고르세요)' };
    const prev = base;
    if (prev && path.resolve(prev) !== next && fs.existsSync(prev)) {
        const subs = [''].concat(fs.readdirSync(prev).filter(d => /^(Teaser 1\.\d\.\d{1,2}|로고)$/.test(d) && fs.statSync(path.join(prev, d)).isDirectory()));
        for (const sub of subs) {
            const from = sub ? path.join(prev, sub) : prev, to = sub ? path.join(next, sub) : next;
            if (!fs.existsSync(path.join(from, MARKER))) continue;
            fs.mkdirSync(to, { recursive: true });
            const used = new Set(fs.readdirSync(to).map(f => f.toLowerCase()));
            for (const f of fs.readdirSync(from)) {
                if (!/\.(hemi|json)$/i.test(f)) continue;
                const stem = f.replace(/\.(hemi|json)$/i, ''), ext = f.slice(stem.length);
                let g = f;
                for (let i = 2; used.has(g.toLowerCase()); i++) g = `${stem} (${i})${ext}`;
                used.add(g.toLowerCase());
                try { fs.renameSync(path.join(from, f), path.join(to, g)); }
                catch (e) { fs.copyFileSync(path.join(from, f), path.join(to, g)); fs.unlinkSync(path.join(from, f)); }
            }
            if (!fs.existsSync(path.join(to, MARKER))) fs.copyFileSync(path.join(from, MARKER), path.join(to, MARKER));
            try { fs.unlinkSync(path.join(from, MARKER)); } catch (e) { /* 없음 */ }
        }
    }
    base = next;
    cache.clear();
    return { ok: true, dir: base };
}

function init(opts) {
    defaultDir = opts.defaultDir;
    if (opts.trash) trash = opts.trash;
    base = opts.dir && writable(opts.dir) ? path.resolve(opts.dir) : defaultDir();
}
const getDir = () => base;
const isDefault = () => path.resolve(base) === path.resolve(defaultDir());

module.exports = { init, read, write, moveTo, getDir, isDefault, defaultDir: () => defaultDir(), subdirOf };
