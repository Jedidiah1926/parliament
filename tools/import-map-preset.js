// ===== 커뮤니티 맵 프리셋 넣기 — SVG Splitter(React .jsx)로 쪼갠 지역구 지도를 presets/maps-community.js에 =====
// 쓰는 법: node tools/import-map-preset.js <지도.jsx> <id> "<이름>" "<제작자>" ["<설명>"] ["<영어 이름>"] ["<영어 설명>"]
//   예) node tools/import-map-preset.js kr2024.jsx kr2024 "2024 대한민국 총선" "델리델리델리만쥬" "제22대 국회의원 선거 지역구"
// .jsx 안의 <path d="…" data-key="…">를 제작자가 만든 그대로(경로 · 점 수 · 좌표를 바꾸지 않고) 담는다.
// 지역구 이름이 파일에 없으면 "지역구 1, 2, …"(파일 순서) — 게임 안에서 고치면 된다. 같은 id가 있으면 바꿔 넣는다.
const fs = require('fs');
const path = require('path');

const [SRC, ID, NAME, AUTHOR, DESC, NAME_EN, DESC_EN] = process.argv.slice(2);
if (!SRC || !ID || !NAME || !AUTHOR) { console.error('node tools/import-map-preset.js <지도.jsx> <id> "<이름>" "<제작자>" ["<설명>"] ["<영어 이름>"] ["<영어 설명>"]'); process.exit(1); }
const OUT = path.join(__dirname, '..', 'presets', 'maps-community.js');

const src = fs.readFileSync(SRC, 'utf8');
const viewBox = ((/VIEWBOX:\s*([\d.\s-]+)/.exec(src) || /viewBox="([^"]+)"/.exec(src) || [, '0 0 1000 1000'])[1]).trim().replace(/\s+/g, ' ');

const districts = [];
const re = /<path\b[^>]*?\sd="([^"]+)"[^>]*?data-key="([^"]+)"|<path\b[^>]*?data-key="([^"]+)"[^>]*?\sd="([^"]+)"/g;
let m, n = 0;
while ((m = re.exec(src))) {
    const d = m[1] || m[4], key = m[2] || m[3];
    n++;
    districts.push({ key, ko: `지역구 ${n}`, en: `District ${n}`, abbr: String(n), d });
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
const header = '// 커뮤니티 맵 프리셋 — tools/import-map-preset.js가 만든 파일 (지도마다 제작자 표시, 경로는 제작자 원본 그대로). 손으로 고치지 마세요.\n';
fs.writeFileSync(OUT, header + 'window.HemiMapPresetsCommunity = ' + JSON.stringify(list) + ';\n');
console.log(`presets/maps-community.js — ${ID}: ${districts.length}개 지역구, ${(fs.statSync(OUT).size / 1024).toFixed(0)}KB`);
