// ===== Steam 데모 빌드 준비 — build/demo/에 데모용 앱 파일을 모은다 =====
// 쓰는 법: node tools/build-demo.js [--app-id 1234567] [--no-obfuscate]
//   그다음 npx electron-builder --config electron-builder.demo.js --win dir (→ dist-demo/win-unpacked, Steam에 이 폴더를 올림)
// 하는 일
//   1) 앱 파일을 복사 — 다음 업데이트 미리보기(teaser*.html · js/teaser6*.js)와 로고 제작 화면(logo.html)은 뺀다
//   2) 모든 화면 <head> 맨 앞에 window.HEMI_BUILD = { demo: true } — 개발자 모드가 꺼지고(설정에서도 숨김) 버전 표시가 DEMO로
//      electron/build.json { demo: true } — 앱이 GitHub 업데이트를 확인하지 않음 (Steam이 업데이트)
//   3) --app-id를 주면 electron/steam.json에 데모 App ID (Steam 오버레이 · 창작마당은 steamworks.js가 깔려 있어야)
//   4) JS 난독화(javascript-obfuscator) — 주석을 지우고 지역 이름을 뒤섞고 글자를 표로 옮긴다. 전역 함수 이름과 속성 이름은
//      그대로 둔다(HTML onclick · 다른 파일에서 부르므로). 번역 표(lang/) · 프리셋(presets/)은 데이터라 그대로.
//      HTML · CSS는 주석만 지운다.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'build', 'demo');
const args = process.argv.slice(2);
const argVal = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const APP_ID = String(argVal('--app-id') || process.env.STEAM_DEMO_APP_ID || '').trim();
if (APP_ID && !/^\d+$/.test(APP_ID)) { console.error(`Steam App ID는 숫자여야 합니다: ${APP_ID}`); process.exit(1); }
const OBFUSCATE = !args.includes('--no-obfuscate');

const COPY_DIRS = ['electron', 'js', 'css', 'fonts', 'presets', 'lang', 'old2', 'icons'];
const SKIP = [
    /^teaser\d*\.html$/, /^logo\.html$/, /^map\.html$/, /^js\/maptrace\.js$/, // 미리보기 · 로고 제작 · 맵 메이커 (데모는 맵 프리셋만)
    /^js\/teaser6\d(charts)?\.js$/,  // 미리보기 기능
    /^electron\/smoketest\.js$/,
];
const skipped = rel => SKIP.some(re => re.test(rel.replace(/\\/g, '/')));

function walk(dir, rel = '') {
    const out = [];
    for (const f of fs.readdirSync(dir)) {
        const full = path.join(dir, f), r = rel ? `${rel}/${f}` : f;
        if (fs.statSync(full).isDirectory()) out.push(...walk(full, r));
        else out.push(r);
    }
    return out;
}

// ---- 1) 복사 ----
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const files = fs.readdirSync(ROOT).filter(f => f.endsWith('.html')).concat(...COPY_DIRS.filter(d => fs.existsSync(path.join(ROOT, d))).map(d => walk(path.join(ROOT, d), d)));
const kept = files.filter(f => !skipped(f));
for (const f of kept) {
    fs.mkdirSync(path.dirname(path.join(OUT, f)), { recursive: true });
    fs.copyFileSync(path.join(ROOT, f), path.join(OUT, f));
}

// ---- 2) 데모 표시 ----
const BUILD_TAG = '<script>window.HEMI_BUILD = Object.freeze({ demo: true }); document.documentElement.setAttribute(\'data-build\', \'demo\');</script>';
fs.writeFileSync(path.join(OUT, 'electron', 'build.json'), JSON.stringify({ demo: true }));
// ---- 3) Steam App ID ----
const steamPath = path.join(OUT, 'electron', 'steam.json');
const steam = JSON.parse(fs.readFileSync(steamPath, 'utf8'));
steam.appId = APP_ID ? Number(APP_ID) : null;
delete steam._comment;
fs.writeFileSync(steamPath, JSON.stringify(steam));

// ---- 4) 난독화 · 주석 지우기 ----
let Obf = null;
if (OBFUSCATE) {
    try { Obf = require('javascript-obfuscator'); }
    catch (e) { console.error('javascript-obfuscator가 없습니다 — npm install을 먼저 하세요 (또는 --no-obfuscate)'); process.exit(1); }
}
const obfOpts = target => ({
    target,
    compact: true,
    simplify: true,
    identifierNamesGenerator: 'hexadecimal',
    renameGlobals: false,          // 전역 함수 · 변수 이름은 그대로 (HTML onclick · 다른 파일에서 부름)
    renameProperties: false,       // 속성 이름은 그대로 (세이브 형식 · DOM)
    transformObjectKeys: false,
    stringArray: true,
    stringArrayThreshold: 0.75,
    stringArrayRotate: true,
    stringArrayShuffle: true,
    stringArrayEncoding: ['none'],
    splitStrings: false,
    controlFlowFlattening: false,  // 느려지므로 끔 (선거 · 경제 계산이 많음)
    deadCodeInjection: false,
    selfDefending: false,
    debugProtection: false,
    numbersToExpressions: false,
    unicodeEscapeSequence: false,
    sourceMap: false,
});
const obf = (code, target) => (Obf ? Obf.obfuscate(code, obfOpts(target)).getObfuscatedCode() : code);
const isData = rel => /^(lang|presets)\//.test(rel);
let jsCount = 0, before = 0, after = 0;
for (const f of kept) {
    const full = path.join(OUT, f);
    if (f.endsWith('.js') && !isData(f)) {
        const src = fs.readFileSync(full, 'utf8');
        const out = obf(src, f.startsWith('electron/') ? 'node' : 'browser');
        fs.writeFileSync(full, out);
        jsCount++; before += src.length; after += out.length;
    } else if (f.endsWith('.css')) {
        fs.writeFileSync(full, fs.readFileSync(full, 'utf8').replace(/\/\*[\s\S]*?\*\//g, ''));
    } else if (f.endsWith('.html')) {
        let html = fs.readFileSync(full, 'utf8');
        html = html.replace(/<!--[\s\S]*?-->/g, '');
        // 페이지 안의 <script> (src 없는 것)도 난독화
        html = html.replace(/<script>([\s\S]*?)<\/script>/g, (m, code) => (code.trim() ? `<script>${obf(code, 'browser')}</script>` : m));
        // 데모 표시는 <head> 맨 앞에 (다른 스크립트보다 먼저)
        html = html.replace(/<head>/i, `<head>\n    ${BUILD_TAG}`);
        fs.writeFileSync(full, html);
    }
}
console.log(`데모 빌드 준비: ${kept.length}개 파일 (뺀 것 ${files.length - kept.length}개)${Obf ? ` · JS ${jsCount}개 난독화 ${(before / 1024 | 0)}KB → ${(after / 1024 | 0)}KB` : ' · 난독화 안 함'}${APP_ID ? ` · Steam App ID ${APP_ID}` : ' · Steam App ID 없음'}`);
console.log(`→ ${path.relative(ROOT, OUT)}/`);
