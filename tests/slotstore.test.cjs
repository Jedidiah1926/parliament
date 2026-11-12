// 세이브 목록 압축 저장(js/slotstore.js) — 바로 압축(deflateSync)이 내용을 그대로 되돌리는지, 저장소 읽기 · 쓰기가 무손실인지.
//   node tests/slotstore.test.cjs
const test = require('node:test'), assert = require('node:assert/strict'), zlib = require('node:zlib'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
function load(quotaChars) {
    const data = new Map();
    function Storage() {}
    Storage.prototype.getItem = function (k) { return data.has(k) ? data.get(k) : null; };
    Storage.prototype.setItem = function (k, v) {
        const size = [...data].reduce((t, [kk, vv]) => t + (kk === k ? 0 : vv.length), 0) + String(v).length;
        if (quotaChars && size > quotaChars) { const e = new Error('quota'); e.name = 'QuotaExceededError'; throw e; }
        data.set(k, String(v));
    };
    Storage.prototype.removeItem = function (k) { data.delete(k); };
    Storage.prototype.key = function (i) { return [...data.keys()][i] ?? null; };
    Object.defineProperty(Storage.prototype, 'length', { get() { return data.size; } });
    const ls = new Storage();
    const sandbox = { window: { localStorage: ls }, Storage, TextDecoder, TextEncoder, Uint8Array, Uint16Array, Int32Array, Map, Set, JSON, Math, String, Array, Object, Error, console, setTimeout, clearTimeout, Blob, Response, CompressionStream };
    vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'slotstore.js'), 'utf8'), sandbox);
    return { ls, data, store: sandbox.window.HemiSlotStore };
}
const b64 = n => { let s = '', x = 12345; const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'; for (let i = 0; i < n; i++) { x = (x * 1103515245 + 12345) >>> 0; s += A[(x >>> 16) & 63]; } return s; };
const sampleState = photos => ({ meta: { app: 'HEMICYCLE' }, parliament: { parties: Array.from({ length: 40 }, (_, i) => ({ id: i, name: '정당 ' + i, color: '#123456', seatsHouse: i, leaderPhoto: photos ? 'data:image/webp;base64,' + b64(40000 + i * 997) : '' })) }, notes: '가나다라 '.repeat(5000) });

test('deflateSync → inflate가 원래 바이트를 그대로 되돌린다 (글자 · 사진 · 섞인 자료 · 빈 자료 · 블록 경계)', () => {
    const { store } = load();
    const enc = new TextEncoder();
    const cases = [new Uint8Array(0), enc.encode('a'), enc.encode('abcabcabc'.repeat(10000)), enc.encode(b64(200000)), enc.encode(JSON.stringify(sampleState(true))),
        enc.encode('x'.repeat(32767)), enc.encode('x'.repeat(32768)), enc.encode('x'.repeat(32769)), enc.encode(b64(32768) + '가'.repeat(40000) + b64(70001))];
    for (const src of cases) {
        const packed = store.deflateSync(src);
        assert.deepEqual(Buffer.from(store.inflate(packed)), Buffer.from(src));
        assert.deepEqual(zlib.inflateRawSync(Buffer.from(packed)), Buffer.from(src)); // 표준 inflate로도 풀린다
    }
});
test('줄지 않는 사진 구간은 늘어나지 않고, 글자 구간은 줄어든다', () => {
    const { store } = load();
    const enc = new TextEncoder();
    const photo = enc.encode(b64(500000)), text = enc.encode('{"name":"정당","seats":12},'.repeat(20000));
    assert.ok(store.deflateSync(photo).length <= photo.length * 1.001 + 64);
    assert.ok(store.deflateSync(text).length < text.length * 0.2);
});
test('저장 공간이 모자라면 바로 압축해 넣고, 읽으면 압축 전과 같은 목록이 나온다', () => {
    const state = sampleState(true), raw = JSON.stringify([{ id: 'a', name: '세이브', state }]);
    const { ls, data } = load(Math.floor(raw.length * 0.75)); // 압축 전 그대로는 안 들어가는 크기
    ls.setItem('dnoParliamentSaveSlots', raw);
    assert.ok(data.get('dnoParliamentSaveSlots').includes('"stateZ"'));
    assert.equal(ls.getItem('dnoParliamentSaveSlots'), raw);
    // 한 번 더 저장 (바뀐 내용) — 처음부터 압축 경로로 가도 결과는 같다
    state.notes += '끝'; const raw2 = JSON.stringify([{ id: 'a', name: '세이브', state }]);
    ls.setItem('dnoParliamentSaveSlots', raw2);
    assert.equal(ls.getItem('dnoParliamentSaveSlots'), raw2);
});
test('공간이 넉넉하면 압축 전 그대로 먼저 쓴다', () => {
    const raw = JSON.stringify([{ id: 'a', name: '세이브', state: sampleState(false) }]);
    const { ls, data } = load();
    ls.setItem('dnoParliamentSaveSlots', raw);
    assert.equal(data.get('dnoParliamentSaveSlots'), raw);
    assert.equal(ls.getItem('dnoParliamentSaveSlots'), raw);
});
test('세이브 하나만 바꾸기(updateSlot) — 예전처럼 목록 전체를 다시 쓴 것과 저장 결과가 같다', () => {
    for (const quota of [0, 1]) {
        const a = sampleState(true), b = sampleState(false);
        const list = [{ id: 'a', name: '하나', savedAt: 't0', color: '#fff', state: a }, { id: 'auto', isAutosave: true, name: '자동', state: b }, { id: 'b', name: '둘', savedAt: 't0', state: b }];
        const raw = JSON.stringify(list);
        const { ls, data, store } = load(quota ? Math.floor(raw.length * 0.75) : 0);
        const key = 'dnoParliamentSaveSlots';
        ls.setItem(key, raw);
        // 정보만 읽기 — 상태는 빠지고 나머지는 그대로
        assert.deepEqual(JSON.parse(JSON.stringify(store.metas(key))), list.map(({ state, ...rest }) => rest));
        // 세이브 '둘'만 바꿔 저장
        b.notes = '바뀜'; const json = JSON.stringify(b);
        assert.equal(store.updateSlot(key, 'b', { savedAt: 't1' }, json), 'ok');
        const want = JSON.parse(raw); want[2].state = JSON.parse(json); want[2].savedAt = 't1';
        assert.equal(ls.getItem(key), JSON.stringify(want)); // 예전 방식(전체 다시 쓰기)과 글자까지 같다
        assert.equal(store.metas(key)[2].savedAt, 't1');
        if (quota) assert.ok(data.get(key).includes('"stateZ"'));
        // 없는 세이브 · 자동저장 칸은 건드리지 않는다
        assert.equal(store.updateSlot(key, 'none', {}, json), 'missing');
        assert.equal(store.updateSlot(key, 'auto', {}, json), 'missing');
        assert.equal(ls.getItem(key), JSON.stringify(want));
        // 다른 창이 저장소를 바꿨으면(기억과 다름) 저장소를 다시 읽고 나서 바꾼다
        const other = [{ id: 'z', name: '다른 창', state: sampleState(false) }];
        data.set(key, JSON.stringify(other));
        assert.equal(store.updateSlot(key, 'b', {}, json), 'missing');
        assert.equal(store.updateSlot(key, 'z', { savedAt: 't2' }, json), 'ok');
        assert.deepEqual(JSON.parse(ls.getItem(key)), [{ id: 'z', name: '다른 창', savedAt: 't2', state: JSON.parse(json) }]);
    }
});
test('updateSlot — 공간이 모자라 못 쓰면 오류를 던지고 저장소는 그대로다', () => {
    const big = sampleState(true), raw = JSON.stringify([{ id: 'a', name: '세이브', state: sampleState(false) }]);
    const { ls, store } = load(raw.length + 2000);
    const key = 'dnoParliamentSaveSlots';
    ls.setItem(key, raw);
    big.pad = b64(400000); // 압축해도 안 들어가는 크기
    assert.throws(() => store.updateSlot(key, 'a', {}, JSON.stringify(big)));
    assert.equal(ls.getItem(key), raw);
    assert.equal(store.metas(key).length, 1);
});
