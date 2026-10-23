// logo.html(로고 제작 모드)과 teaser63.html ~ teaser69.html(미리보기)은 main.html을 그대로 복사해 만든다 — 직접 고치지 말 것.
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
// 티저마다 data-teaser 번호로 저장 공간을 또 나눈다 (js/main.js의 LS_PREFIX: hemicycleTeaserV2-번호:)
const TEASERS = [
    // 1.6.x 티저 — 번호(data-teaser)는 버전 끝자리, 화면마다 1.6.3부터 그 버전까지의 스크립트를 순서대로 얹는다.
    // 1.6.1(사람 · 시민 · 이민자 · 의장석 — js/people.js · js/podium.js) · 1.6.2(군부 · 쿠데타 · 군정 — js/coup.js)는 본 게임에 들어가 main.html이 읽는다
    // (teaser61 · teaser62.html은 없앰 — 예전 세이브는 시작 화면이 본 게임으로 옮김).
    { id: '63', file: 'teaser63.html', script: ['js/teaser63.js'], title: 'Teaser 1.6.3', note: '1.6.3 혁명 · 당-국가 체제 · 선거인단' },
    { id: '64', file: 'teaser64.html', script: ['js/teaser63.js', 'js/teaser64.js'], title: 'Teaser 1.6.4', note: '1.6.4 국회공성전 — 봉쇄 돌파 · 의장석 점거 (+1.6.3)' },
    { id: '65', file: 'teaser65.html', script: ['js/teaser63.js', 'js/teaser64.js', 'js/teaser65.js'], title: 'Teaser 1.6.5', note: '1.6.5 세력 변화 타임라인 · 위키 틀 · 냉전 국가 순위 (+1.6.3 ~ 1.6.4)' },
    { id: '66', file: 'teaser66.html', script: ['js/teaser63.js', 'js/teaser64.js', 'js/teaser65.js', 'js/teaser66.js'], title: 'Teaser 1.6.6', note: '1.6.6 왕정복고 · 전제군주정 · 왕위 계승 · 친위 쿠데타 · 공화 혁명 (+1.6.3 ~ 1.6.5)' },
    { id: '67', file: 'teaser67.html', script: ['js/teaser63.js', 'js/teaser64.js', 'js/teaser65.js', 'js/teaser66.js', 'js/teaser67.js'], title: 'Teaser 1.6.7', note: '1.6.7 미수복 지역 · 영토 통일 (+1.6.3 ~ 1.6.6)' },
    { id: '68', file: 'teaser68.html', script: ['js/teaser63.js', 'js/teaser64.js', 'js/teaser65.js', 'js/teaser66.js', 'js/teaser67.js', 'js/teaser68.js'], title: 'Teaser 1.6.8', note: '1.6.8 종속국 · 종속국 의회 · 합병 · 해방 (+1.6.3 ~ 1.6.7)' },
    { id: '69', file: 'teaser69.html', script: ['js/teaser63.js', 'js/teaser64.js', 'js/teaser65.js', 'js/teaser66.js', 'js/teaser67.js', 'js/teaser68.js', 'js/teaser69charts.js', 'js/teaser69.js'], title: 'Teaser 1.6.9', note: '1.6.9 경제 시스템 — 통화 · 재정 · 지역구 경제 · 예산안 · 경제 그래프 (+1.6.3 ~ 1.6.8)' },
];
if (!/<script src="js\/devmode\.js"><\/script>/.test(fs.readFileSync(path.join(root, 'main.html'), 'utf8'))) throw new Error('main.html: js/devmode.js 스크립트를 찾지 못했습니다 (티저 잠금)');
if (!/<script src="js\/coup\.js"><\/script>/.test(fs.readFileSync(path.join(root, 'main.html'), 'utf8'))) throw new Error('main.html: js/coup.js 스크립트를 찾지 못했습니다');
TEASERS.forEach(t => {
    const scripts = [].concat(t.script);
    let teaser = fs.readFileSync(path.join(root, 'main.html'), 'utf8');
    teaser = teaser.replace(htmlTag, `<html lang="ko" data-app-mode="teaser" data-teaser="${t.id}">`);
    teaser = teaser.replace(/<title>[^<]*<\/title>/i, `<title>Hemicycle — ${t.title}</title>`);
    // 개발자 모드 잠금 — main.html이 js/devmode.js를 다른 스크립트보다 먼저 읽는다 (티저 페이지에서는 꺼져 있으면 설정 화면으로)
    teaser = teaser.replace('<script src="js/coup.js"></script>', `<script src="js/coup.js"></script>` + scripts.map(src => `\n    <script src="${src}"></script>`).join(''));
    teaser = teaser.replace(/<!DOCTYPE html>\s*/i, `<!DOCTYPE html>\n<!-- 자동 생성 파일: main.html을 고친 뒤 \`npm run build:logo\`로 다시 만드세요 (tools/build-logo.js) — ${t.file} = main.html + 미리보기(${scripts.join(' + ') || '추가 스크립트 없음'}, ${t.note}) -->\n`);
    fs.writeFileSync(path.join(root, t.file), teaser);
    console.log(t.file + ' 생성 완료');
});
// 예전 주소(teaser.html)로 들어오면 1.6.9 티저로 보낸다
fs.writeFileSync(path.join(root, 'teaser.html'), `<!DOCTYPE html>
<!-- 자동 생성 파일 (tools/build-logo.js) — 예전 teaser.html 주소는 teaser69.html(1.6.9 미리보기)로 옮겨졌다 -->
<html lang="ko"><head><meta charset="UTF-8"><meta http-equiv="refresh" content="0; url=teaser69.html"><title>Hemicycle — Teaser</title></head>
<body><a href="teaser69.html">teaser69.html로 이동</a> · <a href="teaser63.html">teaser63.html</a> · <a href="teaser64.html">teaser64.html</a> · <a href="teaser65.html">teaser65.html</a> · <a href="teaser66.html">teaser66.html</a> · <a href="teaser67.html">teaser67.html</a> · <a href="teaser68.html">teaser68.html</a></body></html>
`);
console.log('teaser.html(→ teaser69.html) 생성 완료');
