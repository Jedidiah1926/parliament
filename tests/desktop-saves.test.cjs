// 데스크톱 앱 세이브 폴더(electron/saves.js) — 목록 전체 쓰기와 "세이브 하나만 쓰기"(writeSlot)가 같은 파일을 만드는지, 안 되는 경우 전체 쓰기로 넘기는지.
//   node --test tests/desktop-saves.test.cjs
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), os = require('node:os'), path = require('node:path'), zlib = require('node:zlib');
function fresh() {
    const file = require.resolve('../electron/saves.js');
    delete require.cache[file];
    const saves = require(file), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hemi-saves-test-')), trashed = [];
    saves.init({ defaultDir: () => dir, dir, trash: p => { trashed.push(path.basename(p)); try { fs.unlinkSync(p); } catch (e) { /* 없음 */ } } });
    return { saves, dir, trashed, done: () => fs.rmSync(dir, { recursive: true, force: true }) };
}
const state = n => ({ meta: { app: 'HEMICYCLE', savedAt: 't' }, 10: 'ten', 2: 'two', config: { nationName: '나라 ' + n, note: '"따옴표" \\ 줄\n바꿈' }, parties: Array.from({ length: 30 }, (_, i) => ({ id: i, name: '정당 ' + i, seats: i * n })) });
const metaOf = ({ state, ...meta }) => meta;
const list = () => [{ id: 'a', name: '하나', isAutosave: false, createdAt: '2026-01-01', savedAt: 's0', state: state(1) }, { id: 'b', name: '둘: 이름/특수', isAutosave: false, createdAt: '2026-01-02', savedAt: 's0', state: state(2) }];
const gunzip = f => zlib.gunzipSync(fs.readFileSync(f)).toString('utf8');

test('writeSlot은 write와 글자까지 같은 파일을 만들고, 다시 읽으면 그대로 나온다', () => {
    const { saves, dir, done } = fresh();
    try {
        const slots = list();
        assert.deepEqual(saves.write('', JSON.stringify(slots)), { ok: true, written: 2 });
        // 세이브 '하나'의 상태만 바꿔 한 파일만 쓴다
        slots[0].state.config.nationName = '바뀐 나라'; slots[0].savedAt = 's1';
        assert.deepEqual(saves.writeSlot('', JSON.stringify(metaOf(slots[0])), JSON.stringify(slots[0].state)), { ok: true, written: 1 });
        const viaOne = gunzip(path.join(dir, '하나.hemi'));
        // 같은 목록을 전체 쓰기로 보내면 이미 같은 내용이라 아무것도 다시 쓰지 않는다 (서명까지 같다)
        assert.deepEqual(saves.write('', JSON.stringify(slots)), { ok: true, written: 0 });
        // 새 폴더에 전체 쓰기로 만든 파일과 글자가 같다
        const other = fresh();
        try { other.saves.write('', JSON.stringify(slots)); assert.equal(gunzip(path.join(other.dir, '하나.hemi')), viaOne); } finally { other.done(); }
        const back = saves.read('');
        assert.deepEqual(JSON.parse(JSON.stringify(back.slots)), JSON.parse(JSON.stringify(slots.map(s => { const c = { ...s }; delete c.isAutosave; return c; }))));
        // 읽은 직후(앱을 다시 연 뒤)에도 한 파일 쓰기가 된다
        slots[1].state.config.nationName = '둘도 바뀜';
        assert.equal(saves.writeSlot('', JSON.stringify(metaOf(slots[1])), JSON.stringify(slots[1].state)).ok, true);
        assert.equal(saves.read('').slots[1].state.config.nationName, '둘도 바뀜');
        assert.deepEqual(fs.readdirSync(dir).filter(f => f.endsWith('.tmp')), []);
    } finally { done(); }
});
test('writeSlot이 하지 않는 경우 — 전체 쓰기로 넘긴다 (파일은 건드리지 않음)', () => {
    const { saves, dir, trashed, done } = fresh();
    try {
        const slots = list(), sj = JSON.stringify(slots[0].state);
        // 아직 이 폴더를 읽거나 쓴 적이 없음
        assert.equal(saves.writeSlot('', JSON.stringify(metaOf(slots[0])), sj).fallback, true);
        assert.deepEqual(fs.readdirSync(dir), []);
        saves.write('', JSON.stringify(slots));
        const before = fs.readFileSync(path.join(dir, '하나.hemi'));
        const same = () => assert.deepEqual(fs.readFileSync(path.join(dir, '하나.hemi')), before);
        assert.equal(saves.writeSlot('', JSON.stringify({ ...metaOf(slots[0]), id: 'zzz' }), sj).fallback, true); same();          // 처음 보는 세이브
        assert.equal(saves.writeSlot('', JSON.stringify({ ...metaOf(slots[0]), name: '새 이름' }), sj).fallback, true); same();    // 이름이 바뀜 — 파일 이름도 바뀌어야 함
        assert.equal(saves.writeSlot('', JSON.stringify(metaOf(slots[0])), '[1,2]').fallback, true); same();                        // 상태가 객체가 아님
        assert.equal(saves.writeSlot('', JSON.stringify(metaOf(slots[0])), '{"__hemiSlot":{"id":"x"}}').fallback, true); same();
        assert.equal(saves.writeSlot('', JSON.stringify({ ...metaOf(slots[0]), state: {} }), sj).fallback, true); same();
        assert.equal(saves.writeSlot('hemicycleLogo:', JSON.stringify(metaOf(slots[0])), sj).fallback, true);                       // 다른 저장 공간
        assert.equal(saves.writeSlot('../밖', JSON.stringify(metaOf(slots[0])), sj).fallback, true); same();                         // 정해지지 않은 저장 공간 이름 — 아무 파일도 건드리지 않는다 (경로 조작 방지는 write()가 그대로 맡음)
        assert.throws(() => saves.write('../밖', JSON.stringify(slots)));
        // 이름을 바꾸는 전체 쓰기 뒤에는 새 이름으로 한 파일 쓰기가 된다
        slots[0].name = '새 이름';
        saves.write('', JSON.stringify(slots));
        assert.ok(trashed.includes('하나.hemi'));
        assert.equal(saves.writeSlot('', JSON.stringify(metaOf(slots[0])), sj).ok, true);
        assert.ok(fs.existsSync(path.join(dir, '새 이름.hemi')));
        // 표시 파일이 사라진 폴더(탐색기에서 지움)는 전체 쓰기가 다시 만든다
        fs.unlinkSync(path.join(dir, '.hemicycle'));
        assert.equal(saves.writeSlot('', JSON.stringify(metaOf(slots[0])), sj).fallback, true);
    } finally { done(); }
});
test('큰 세이브(빠른 압축)도 무손실 — 읽으면 그대로', () => {
    const { saves, dir, done } = fresh();
    try {
        let x = 7; const noise = Array.from({ length: 1500000 }, () => { x = (x * 1103515245 + 12345) >>> 0; return 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'[x >>> 26]; }).join('');
        const big = { ...state(3), photo: 'data:image/png;base64,' + noise };
        const slots = [{ id: 'big', name: '큰 세이브', createdAt: 'c', savedAt: 's', state: big }];
        saves.write('', JSON.stringify(slots));
        assert.equal(JSON.stringify(saves.read('').slots[0].state), JSON.stringify(big));
        big.config.nationName = '고침';
        assert.equal(saves.writeSlot('', JSON.stringify(metaOf(slots[0])), JSON.stringify(big)).ok, true);
        assert.equal(JSON.stringify(saves.read('').slots[0].state), JSON.stringify(big));
        const buf = fs.readFileSync(path.join(dir, '큰 세이브.hemi'));
        assert.ok(buf[0] === 0x1f && buf[1] === 0x8b && buf.length < JSON.stringify(big).length); // gzip 그대로 · 원본보다 작다
    } finally { done(); }
});
