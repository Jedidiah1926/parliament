// 기본 언어 팩: 한국어 — 화면 글자의 원본. 키 방식(0.2.4)으로 옮긴 화면은 글자를 여기서 가져온다.
// 다른 언어 팩(lang/en.js · 커뮤니티 팩)은 같은 키에 그 언어 글자를 적는다. 키가 없으면 이 팩의 글자를 쓴다.
//   - 키 이름: 화면.부분.이름 (예: "home.menu.start") — 영문 소문자 · 숫자 · _ . -
//   - 변수: "{n}일 뒤 다시"처럼 {이름} 자리에 i18n('키', { n: 3 })의 값이 들어간다
//   - 수에 따라 모양이 바뀌는 글자: { "one": "...", "other": "..." } (한국어는 보통 "other" 하나면 된다)
// 키를 바꾸거나 지우면 `node tools/i18n-check.js`로 다른 팩 · 화면과 어긋나지 않았는지 확인한다.
window.DnoLangPacks = window.DnoLangPacks || {};
window.DnoLangPacks.kr = {
 "format": "dno-lang-pack@2",
 "code": "kr",
 "name": "한국어",
 "author": "Hemicycle",
 "keys": {
 }
};
