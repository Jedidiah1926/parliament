// 저장소 키 이름 옮기기(js/storage-migrate.js) — dno… → hemi…
//   node tests/storage-migrate.test.cjs
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'js', 'storage-migrate.js'), 'utf8');

// 글자 수 한도가 있는 가짜 localStorage (quota: 키 + 값 글자 수 합)
function makeStorage(init, quota) {
    const data = new Map(Object.entries(init || {}));
    const used = (skip) => [...data].reduce((t, [k, v]) => t + (k === skip ? 0 : k.length + v.length), 0);
    return {
        data,
        get length() { return data.size; },
        key: i => [...data.keys()][i] ?? null,
        getItem: k => (data.has(k) ? data.get(k) : null),
        setItem(k, v) { v = String(v); if (quota && used(k) + k.length + v.length > quota) { const e = new Error('quota'); e.name = 'QuotaExceededError'; throw e; } data.set(k, v); },
        removeItem: k => { data.delete(k); },
    };
}
function run(ls) { const sandbox = { window: { localStorage: ls } }; vm.createContext(sandbox); vm.runInContext(SRC, sandbox); }

test('dno… 키를 hemi…로 옮긴다 (값은 글자 그대로) · 저장 공간 이름이 붙은 키도 · 다른 키는 그대로', () => {
    const ls = makeStorage({
        dnoParliamentSaveSlots: 'Z1:12:압축된세이브', dnoThemeMode: 'dark', dnoLang: 'en',
        'hemicycleTeaserV2-61:dnoParliamentSaveSlots': '[{"id":"t"}]', 'hemicycleLogo:dnoParliamentActiveSlotId': 's1',
        hemicycleCampaignLast: 'c1', dnolower: 'x', // 소문자로 이어지는 키는 이름 규칙 밖 — 그대로
    });
    run(ls);
    assert.equal(ls.getItem('hemiParliamentSaveSlots'), 'Z1:12:압축된세이브');
    assert.equal(ls.getItem('hemiThemeMode'), 'dark');
    assert.equal(ls.getItem('hemiLang'), 'en');
    assert.equal(ls.getItem('hemicycleTeaserV2-61:hemiParliamentSaveSlots'), '[{"id":"t"}]');
    assert.equal(ls.getItem('hemicycleLogo:hemiParliamentActiveSlotId'), 's1');
    for (const k of ['dnoParliamentSaveSlots', 'dnoThemeMode', 'dnoLang', 'hemicycleTeaserV2-61:dnoParliamentSaveSlots', 'hemicycleLogo:dnoParliamentActiveSlotId']) assert.equal(ls.getItem(k), null, `예전 키 ${k}는 지움`);
    assert.equal(ls.getItem('hemicycleCampaignLast'), 'c1');
    assert.equal(ls.getItem('dnolower'), 'x');
    assert.equal(ls.getItem('hemiStorageMigrated'), '1');
});

test('저장 공간이 거의 찼어도 세이브를 잃지 않는다 (예전 키를 지우고 옮김)', () => {
    const big = 'S'.repeat(3000);
    const ls = makeStorage({ dnoParliamentSaveSlots: big, dnoLang: 'en' }, 3200); // 두 벌은 못 담는 크기
    run(ls);
    assert.equal(ls.getItem('hemiParliamentSaveSlots'), big);
    assert.equal(ls.getItem('dnoParliamentSaveSlots'), null);
    assert.equal(ls.getItem('hemiLang'), 'en');
    assert.equal(ls.getItem('hemiStorageMigrated'), '1');
});

test('새 키를 끝내 못 쓰면 예전 키를 되돌려 두고, 끝 표시 없이 다음에 다시', () => {
    const big = 'S'.repeat(3000);
    const ls = makeStorage({ dnoParliamentSaveSlots: big }, 3022); // 예전 세이브가 꼭 맞게 찬 저장소 — 키 이름이 한 글자 긴 새 키는 들어가지 않음
    run(ls);
    assert.equal(ls.getItem('dnoParliamentSaveSlots'), big, '예전 세이브는 그대로');
    assert.equal(ls.getItem('hemiParliamentSaveSlots'), null);
    assert.equal(ls.getItem('hemiStorageMigrated'), null);
});

test('새 키가 이미 다른 값이면 예전 키를 지우지 않는다 · 끝 표시가 있으면 아무것도 안 함', () => {
    const ls = makeStorage({ dnoThemeMode: 'dark', hemiThemeMode: 'light', dnoLang: 'en' });
    run(ls);
    assert.equal(ls.getItem('hemiThemeMode'), 'light');
    assert.equal(ls.getItem('dnoThemeMode'), 'dark', '다른 값이면 예전 키 보존');
    assert.equal(ls.getItem('hemiLang'), 'en');
    assert.equal(ls.getItem('hemiStorageMigrated'), null);
    const done = makeStorage({ hemiStorageMigrated: '1', dnoLang: 'kr' });
    run(done);
    assert.equal(done.getItem('dnoLang'), 'kr');
    assert.equal(done.getItem('hemiLang'), null);
});
