// 세이브 파일(.hemi 또는 .json)을 내장 프리셋 데이터 파일(presets/<이름>.js)로 바꾼다.
//   node tools/make-preset.js <세이브 파일> <이름>      예) node tools/make-preset.js 일본.hemi japan
//   node tools/make-preset.js <세이브 파일> <이름> --lang en   → 그 프리셋의 영어 파일 presets/<이름>.en.js
// 만든 뒤 js/presets.js의 해당 항목(id: 'builtin:<이름>')에서 comingSoon을 지우고, 출력된 날짜를 date에 넣으면 된다.
// 언어 파일은 그 항목의 langs에 { en: { script: 'presets/<이름>.en.js' } }처럼 적는다 (1.6.0 — 프리셋은 언어마다 따로 만든 파일을 쓴다)
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const args = process.argv.slice(2);
const langIdx = args.indexOf('--lang');
const lang = langIdx >= 0 ? String(args[langIdx + 1] || '').toLowerCase() : '';
if (langIdx >= 0) args.splice(langIdx, 2);
const [input, name] = args;
if (!input || !name || !/^[a-z0-9_-]+$/i.test(name) || (langIdx >= 0 && !/^[a-z]{2,3}(-[a-z0-9]+)?$/.test(lang))) {
    console.error('사용법: node tools/make-preset.js <세이브 파일(.hemi/.json)> <이름(영문·숫자)> [--lang <언어 코드>]');
    process.exit(1);
}

let buf = fs.readFileSync(input);
if (buf[0] === 0x1f && buf[1] === 0x8b) buf = zlib.gunzipSync(buf); // .hemi는 gzip으로 압축된 JSON
const state = JSON.parse(buf.toString('utf8'));
if (!state || !state.parliament || !Array.isArray(state.parliament.parties)) {
    console.error('Hemicycle 세이브 파일이 아닌 것 같습니다.');
    process.exit(1);
}
state.meta = { ...(state.meta || {}), app: 'HEMICYCLE', dataLang: lang || 'kr' };

const id = 'builtin:' + name + (lang ? '@' + lang : '');
const out = path.join(__dirname, '..', 'presets', name + (lang ? '.' + lang : '') + '.js');
fs.writeFileSync(out,
    `// 내장 프리셋 데이터 — tools/make-preset.js로 ${path.basename(input)}에서 만든 파일. js/presets.js가 <script>로 불러온다\n` +
    `// (데스크톱 앱은 file://로 열려 fetch로 JSON을 읽을 수 없으므로 JS로 감싸 둠)\n` +
    `window.DNO_PRESET_DATA = window.DNO_PRESET_DATA || {};\n` +
    `window.DNO_PRESET_DATA['${id}'] = ${JSON.stringify(state)};\n`);

const c = state.config || {};
const date = c.nationDateYear
    ? `${c.nationDateEra ? c.nationDateEra + ' ' : ''}${c.nationDateYear}년 ${c.nationDateMonth}월 ${c.nationDateDay}일`
    : '(날짜 없음)';
console.log(`${out} 생성 완료 (${(fs.statSync(out).size / 1024 / 1024).toFixed(2)} MB)`);
console.log(`국가: ${c.nationName || '-'} · 게임 속 날짜: ${date}`);
console.log(`js/presets.js의 '${id}' 항목: date: '${date}', comingSoon 줄 삭제`);
