// logo.html(로고 제작 모드)과 teaser.html은 main.html을 그대로 복사해 만든다 — 직접 고치지 말 것.
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

// teaser.html — main.html과 같은 화면에 다음 업데이트 미리보기(js/teaser.js)를 얹은 것. 저장 공간은 본 게임과 따로(data-app-mode="teaser")
let teaser = fs.readFileSync(path.join(root, 'main.html'), 'utf8');
teaser = teaser.replace(htmlTag, '<html lang="ko" data-app-mode="teaser">');
teaser = teaser.replace(/<title>[^<]*<\/title>/i, '<title>Hemicycle — Teaser</title>');
if (!/<script src="js\/popvote\.js"><\/script>/.test(teaser)) throw new Error('main.html: js/popvote.js 스크립트를 찾지 못했습니다');
teaser = teaser.replace('<script src="js/popvote.js"></script>', '<script src="js/popvote.js"></script>\n    <script src="js/teaser.js"></script>');
teaser = teaser.replace(/<!DOCTYPE html>\s*/i, '<!DOCTYPE html>\n<!-- 자동 생성 파일: main.html을 고친 뒤 `npm run build:logo`로 다시 만드세요 (tools/build-logo.js) — teaser.html = main.html + 미리보기(js/teaser.js) -->\n');
fs.writeFileSync(path.join(root, 'teaser.html'), teaser);
console.log('teaser.html 생성 완료');
