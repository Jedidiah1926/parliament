// logo.html(로고 제작 모드)과 teaser66.html · teaser61.html(미리보기)은 main.html을 그대로 복사해 만든다 — 직접 고치지 말 것.
// main.html을 고친 뒤에는 `npm run build:logo`로 다시 만들어야 두 화면이 어긋나지 않는다.
// 차이는 <html data-app-mode="logo">와 창 제목뿐이고, 나머지(의회 메뉴만 보이기 · 강조 색 · 따로 쓰는 저장 공간)는
// js/main.js · css/main.css가 data-app-mode를 보고 처리한다.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
let html = fs.readFileSync(path.join(root, 'main.html'), 'utf8');

const htmlTag = /<html\b[^>]*>/i;
if (!htmlTag.test(html)) throw new Error('main.html: <html> 태그를 찾지 못했습니다');
html = html.replace(htmlTag, '<html lang="ko" data-app-mode="logo">');
html = html.replace(/<title>[^<]*<\/title>/i, '<title>Hemicycle — Logo</title>');
html = html.replace(/<!DOCTYPE html>\s*/i, '<!DOCTYPE html>\n<!-- 자동 생성 파일: main.html을 고친 뒤 `npm run build:logo`로 다시 만드세요 (tools/build-logo.js) -->\n');

fs.writeFileSync(path.join(root, 'logo.html'), html);
console.log('logo.html 생성 완료');

// 티저(다음 업데이트 미리보기) — main.html과 같은 화면에 미리보기 스크립트를 얹은 것. 저장 공간은 본 게임과 따로(data-app-mode="teaser").
// 티저마다 data-teaser 번호로 저장 공간을 또 나눈다 (66은 예전 teaser.html과 같은 공간을 그대로 씀)
const TEASERS = [
    { id: '66', file: 'teaser66.html', script: 'js/teaser66.js', title: 'Teaser 1.6.6', note: '1.6.6 미수복 지역 · 영토 통일' },
    { id: '61', file: 'teaser61.html', script: 'js/teaser61.js', title: 'Teaser 1.6.1', note: '1.6.1 쿠데타 · 군정 · 군부 설정' },
];
if (!/<script src="js\/popvote\.js"><\/script>/.test(fs.readFileSync(path.join(root, 'main.html'), 'utf8'))) throw new Error('main.html: js/popvote.js 스크립트를 찾지 못했습니다');
TEASERS.forEach(t => {
    let teaser = fs.readFileSync(path.join(root, 'main.html'), 'utf8');
    teaser = teaser.replace(htmlTag, `<html lang="ko" data-app-mode="teaser" data-teaser="${t.id}">`);
    teaser = teaser.replace(/<title>[^<]*<\/title>/i, `<title>Hemicycle — ${t.title}</title>`);
    teaser = teaser.replace('<script src="js/popvote.js"></script>', `<script src="js/popvote.js"></script>\n    <script src="${t.script}"></script>`);
    teaser = teaser.replace(/<!DOCTYPE html>\s*/i, `<!DOCTYPE html>\n<!-- 자동 생성 파일: main.html을 고친 뒤 \`npm run build:logo\`로 다시 만드세요 (tools/build-logo.js) — ${t.file} = main.html + 미리보기(${t.script}, ${t.note}) -->\n`);
    fs.writeFileSync(path.join(root, t.file), teaser);
    console.log(t.file + ' 생성 완료');
});
// 예전 주소(teaser.html)로 들어오면 1.6.6 티저로 보낸다
fs.writeFileSync(path.join(root, 'teaser.html'), `<!DOCTYPE html>
<!-- 자동 생성 파일 (tools/build-logo.js) — 예전 teaser.html 주소는 teaser66.html(1.6.6 미리보기)로 옮겨졌다 -->
<html lang="ko"><head><meta charset="UTF-8"><meta http-equiv="refresh" content="0; url=teaser66.html"><title>Hemicycle — Teaser</title></head>
<body><a href="teaser66.html">teaser66.html로 이동</a> · <a href="teaser61.html">teaser61.html</a></body></html>
`);
console.log('teaser.html(→ teaser66.html) 생성 완료');
