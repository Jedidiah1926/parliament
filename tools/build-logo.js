// logo.html(로고 제작 모드)은 dno.html을 그대로 복사해 만든다 — 직접 고치지 말 것.
// dno.html을 고친 뒤에는 `npm run build:logo`로 다시 만들어야 두 화면이 어긋나지 않는다.
// 차이는 <html data-app-mode="logo">와 창 제목뿐이고, 나머지(의회 메뉴만 보이기 · 강조 색 · 따로 쓰는 저장 공간)는
// js/dno.js · css/dno.css가 data-app-mode를 보고 처리한다.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
let html = fs.readFileSync(path.join(root, 'dno.html'), 'utf8');

const htmlTag = /<html\b[^>]*>/i;
if (!htmlTag.test(html)) throw new Error('dno.html: <html> 태그를 찾지 못했습니다');
html = html.replace(htmlTag, '<html lang="ko" data-app-mode="logo">');
html = html.replace(/<title>[^<]*<\/title>/i, '<title>Hemicycle — Logo</title>');
html = html.replace(/<!DOCTYPE html>\s*/i, '<!DOCTYPE html>\n<!-- 자동 생성 파일: dno.html을 고친 뒤 `npm run build:logo`로 다시 만드세요 (tools/build-logo.js) -->\n');

fs.writeFileSync(path.join(root, 'logo.html'), html);
console.log('logo.html 생성 완료');
