// Node에서 js/*.js 모듈을 테스트할 때 쓰는 i18n() — 브라우저의 js/lang.js 대신 한국어 팩(lang/kr.js) 글자를 그대로 돌려준다.
//   require('./fixtures/i18n-node.cjs'); // 모듈을 require하기 전에
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', '..', 'lang', 'kr.js'), 'utf8'), sandbox);
const keys = sandbox.window.HemiLangPacks.kr.keys;
function i18n(key, vars) {
    let v = keys[key];
    if (v == null) return String(key);
    if (typeof v === 'object') v = v.other;
    return String(v).replace(/\{([A-Za-z0-9_]+)\}/g, (m, name) => (vars && vars[name] != null ? String(vars[name]) : m));
}
i18n.ref = (key, vars) => (vars ? { key: String(key), vars } : { key: String(key) });
global.i18n = i18n;
module.exports = i18n;
