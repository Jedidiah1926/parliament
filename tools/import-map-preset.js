// ===== 커뮤니티 맵 프리셋 넣기 — SVG Splitter(React .jsx)로 쪼갠 지역구 지도를 presets/maps-community.js에 =====
// 쓰는 법: node tools/import-map-preset.js <지도.jsx> <id> "<이름>" "<제작자>" ["<설명>"] ["<영어 이름>"] ["<영어 설명>"]
//   예) node tools/import-map-preset.js kr2024.jsx kr2024 "2024 대한민국 총선" "델리델리델리만쥬" "제22대 국회의원 선거 지역구"
// .jsx 안의 <path d="…" data-key="…">를 하나씩 읽어 절대 좌표로 바꾸고, 점을 줄여(더글러스-포이커, 0.15) 소수 2자리로 담는다.
// 지역구 이름이 파일에 없으면 "지역구 1, 2, …"(파일 순서) — 게임 안에서 고치면 된다. 같은 id가 있으면 바꿔 넣는다.
const fs = require('fs');
const path = require('path');

const [SRC, ID, NAME, AUTHOR, DESC, NAME_EN, DESC_EN] = process.argv.slice(2);
if (!SRC || !ID || !NAME || !AUTHOR) { console.error('node tools/import-map-preset.js <지도.jsx> <id> "<이름>" "<제작자>" ["<설명>"] ["<영어 이름>"] ["<영어 설명>"]'); process.exit(1); }
const OUT = path.join(__dirname, '..', 'presets', 'maps-community.js');
const TOL = 0.15;

const src = fs.readFileSync(SRC, 'utf8');
const viewBox = ((/VIEWBOX:\s*([\d.\s-]+)/.exec(src) || /viewBox="([^"]+)"/.exec(src) || [, '0 0 1000 1000'])[1]).trim().replace(/\s+/g, ' ');

// ---- 경로 → 고리(점 목록) ----
function rings(d) {
    const toks = d.match(/[a-zA-Z]|-?(?:\d*\.\d+|\d+\.?)(?:e[-+]?\d+)?/gi);
    const out = []; let i = 0, cmd = null, x = 0, y = 0, sx = 0, sy = 0, ring = null;
    const num = () => parseFloat(toks[i++]);
    const pt = (X, Y) => { x = X; y = Y; ring.push([x, y]); };
    while (i < toks.length) {
        if (/^[a-zA-Z]$/.test(toks[i])) cmd = toks[i++];
        const rel = cmd === cmd.toLowerCase(), C = cmd.toUpperCase(), ox = rel ? x : 0, oy = rel ? y : 0;
        if (C === 'Z') { x = sx; y = sy; ring = null; continue; }
        if (C === 'M') { ring = []; out.push(ring); pt(num() + ox, num() + oy); sx = x; sy = y; cmd = rel ? 'l' : 'L'; continue; }
        if (!ring) { ring = [[x, y]]; out.push(ring); }
        if (C === 'L') pt(num() + ox, num() + oy);
        else if (C === 'H') pt(num() + ox, y);
        else if (C === 'V') pt(x, num() + oy);
        else if (C === 'S' || C === 'Q') { i += 2; pt(num() + ox, num() + oy); } // 곡선은 끝점으로 (조각이 작아 티 나지 않음)
        else if (C === 'C') { i += 4; pt(num() + ox, num() + oy); }
        else if (C === 'T') pt(num() + ox, num() + oy);
        else if (C === 'A') { i += 5; pt(num() + ox, num() + oy); }
        else throw new Error('모르는 경로 명령: ' + cmd);
    }
    return out.filter(r => r.length >= 3);
}
// ---- 더글러스-포이커 ----
function dp(pts, eps) {
    if (pts.length < 3) return pts;
    const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
    const st = [[0, pts.length - 1]];
    while (st.length) {
        const [a, b] = st.pop(); let md = 0, mi = -1;
        const [ax, ay] = pts[a], [bx, by] = pts[b], dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1e-9;
        for (let k = a + 1; k < b; k++) { const dd = Math.abs(dy * pts[k][0] - dx * pts[k][1] + bx * ay - by * ax) / L; if (dd > md) { md = dd; mi = k; } }
        if (md > eps) { keep[mi] = 1; st.push([a, mi], [mi, b]); }
    }
    return pts.filter((_, k) => keep[k]);
}
// 닫힌 고리는 시작점에서 가장 먼 점으로 둘로 나눠 줄인다 (시작점 근처만 뭉개지지 않게)
function simplifyRing(r) {
    let far = 0, fd = 0;
    r.forEach((p, k) => { const dd = (p[0] - r[0][0]) ** 2 + (p[1] - r[0][1]) ** 2; if (dd > fd) { fd = dd; far = k; } });
    const a = dp(r.slice(0, far + 1), TOL), b = dp(r.slice(far).concat([r[0]]), TOL);
    return a.concat(b.slice(1, -1));
}
const R = v => String(Math.round(v * 100) / 100);

const districts = [];
const re = /<path\b[^>]*?\sd="([^"]+)"[^>]*?data-key="([^"]+)"|<path\b[^>]*?data-key="([^"]+)"[^>]*?\sd="([^"]+)"/g;
let m, n = 0;
while ((m = re.exec(src))) {
    const d = m[1] || m[4], key = m[2] || m[3];
    const rs = rings(d).map(simplifyRing).filter(r => r.length >= 3);
    if (!rs.length) continue;
    n++;
    districts.push({ key, ko: `지역구 ${n}`, en: `District ${n}`, abbr: String(n), d: rs.map(r => 'M' + r.map(p => R(p[0]) + ' ' + R(p[1])).join('L') + 'Z').join('') });
}
if (!districts.length) { console.error('<path d="…" data-key="…">를 찾지 못했습니다'); process.exit(1); }

let list = [];
if (fs.existsSync(OUT)) {
    const txt = fs.readFileSync(OUT, 'utf8'), at = txt.indexOf('= ');
    if (at >= 0) list = JSON.parse(txt.slice(at + 2).replace(/;\s*$/, ''));
}
const entry = { id: ID, name: { ko: NAME, en: NAME_EN || NAME }, desc: { ko: DESC || '지역구 지도', en: DESC_EN || 'Constituency map' }, author: AUTHOR, count: districts.length, viewBox, districts };
const i = list.findIndex(x => x.id === ID);
if (i >= 0) list[i] = entry; else list.push(entry);
const header = '// 커뮤니티 맵 프리셋 — tools/import-map-preset.js가 만든 파일 (지도마다 제작자 표시). 손으로 고치지 마세요.\n';
fs.writeFileSync(OUT, header + 'window.HemiMapPresetsCommunity = ' + JSON.stringify(list) + ';\n');
console.log(`presets/maps-community.js — ${ID}: ${districts.length}개 지역구, ${(fs.statSync(OUT).size / 1024).toFixed(0)}KB`);
