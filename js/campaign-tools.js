// Shared, data-only authoring tools. Keep campaign@1 and unknown extension fields intact.
(function (root) {
    'use strict';
    const clone = x => JSON.parse(JSON.stringify(x));
    const object = x => !!x && typeof x === 'object' && !Array.isArray(x);
    const arrayKeys = ['starts', 'focus', 'crises', 'endings', 'events', 'decisions'];
    const idOK = id => typeof id === 'string' && /^[a-zA-Z0-9_.-]+$/.test(id);
    function validate(d) {
        const issues = [];
        const add = (path, message, level = 'error') => issues.push({ path, message, level });
        if (!object(d) || d.format !== 'hemicycle-campaign@1') return [{ path: 'format', message: 'hemicycle-campaign@1 형식이어야 합니다.', level: 'error' }];
        if (!idOK(d.id)) add('id', '캠페인 ID는 영문·숫자·밑줄·점·하이픈으로 입력하세요.');
        for (const key of arrayKeys) if (d[key] != null && (!Array.isArray(d[key]) || d[key].some(x => !object(x)))) add(key, '객체 목록 [ { … } ]이어야 합니다.');
        if (issues.length) return issues;
        const list = k => d[k] || [];
        const idsOf = (items, p) => {
            const ids = new Set();
            items.forEach((x, i) => { if (!idOK(x.id)) add(`${p}.${i}.id`, '고유한 ID가 필요합니다. 영문·숫자·_ . -를 사용하세요.'); else if (ids.has(x.id)) add(`${p}.${i}.id`, `중복 ID: ${x.id}`); ids.add(x.id); });
            return ids;
        };
        const cond = (v, p) => { if (v != null && !object(v) && !Array.isArray(v) && typeof v !== 'boolean') add(p, '조건은 객체 또는 조건 배열이어야 합니다.'); };
        const effects = (v, p) => { if (v != null && (!Array.isArray(v) || v.some(e => !object(e)))) add(p, '효과는 객체 배열이어야 합니다.'); };
        const script = (items, p, isEvent) => {
            idsOf(items, p);
            items.forEach((e, i) => {
                const q = `${p}.${i}`;
                cond(e.trigger, q + '.trigger'); cond(e.available, q + '.available'); cond(e.visible, q + '.visible');
                effects(e.effects, q + '.effects'); effects(e.immediate, q + '.immediate');
                if (isEvent && e.options != null) {
                    if (!Array.isArray(e.options) || e.options.some(o => !object(o))) add(q + '.options', '선택지는 객체 배열이어야 합니다.');
                    else e.options.forEach((o, j) => { effects(o.effects, `${q}.options.${j}.effects`); cond(o.trigger, `${q}.options.${j}.trigger`); });
                }
            });
        };
        const focus = list('focus'), ids = idsOf(focus, 'focus');
        idsOf(list('starts'), 'starts'); idsOf(list('crises'), 'crises'); idsOf(list('endings'), 'endings');
        if (!list('starts').length) add('starts', '시작 나라가 하나 이상 필요합니다.');
        list('starts').forEach((s, i) => { if (s.kind === 'save' && (!object(s.state) || !Array.isArray((s.state.parliament || s.state.data || {}).parties))) add(`starts.${i}`, '시작 세이브를 선택하세요.'); else if (s.kind !== 'save' && !s.preset) add(`starts.${i}.preset`, '시작 프리셋을 선택하세요.'); });
        const cells = new Set();
        focus.forEach((f, i) => {
            const p = `focus.${i}`;
            for (const k of ['prereq', 'any', 'exclusive']) {
                if (f[k] != null && (!Array.isArray(f[k]) || f[k].some(id => typeof id !== 'string'))) { add(`${p}.${k}`, '연결은 ID 문자열 배열이어야 합니다.'); continue; }
                (f[k] || []).forEach(id => { if (!ids.has(id)) add(`${p}.${k}`, `없는 방향성을 가리킵니다: ${id}`); if (id === f.id) add(`${p}.${k}`, '자기 자신과 연결할 수 없습니다.'); });
            }
            for (const k of ['x', 'y']) if (f[k] != null && (!Number.isFinite(f[k]) || f[k] < 0 || f[k] > 200)) add(`${p}.${k}`, '좌표는 0~200 사이 숫자로 입력하세요.');
            if (f.days != null && (!Number.isFinite(f.days) || f.days < 0)) add(p + '.days', '기간은 0 이상의 숫자여야 합니다.');
            if (f.title != null && typeof f.title !== 'string') add(p + '.title', '제목은 문자열이어야 합니다.');
            const cell = `${f.x || 0},${f.y || 0}`;
            if (cells.has(cell)) add(p, '다른 방향성과 위치가 겹칩니다. 자동 정렬로 해결할 수 있습니다.', 'warning');
            cells.add(cell); cond(f.available, p + '.available'); effects(f.effects, p + '.effects');
        });
        if (!issues.some(x => x.level === 'error' && x.path.startsWith('focus'))) {
            // Fixed-point reachability allows OR chains with a valid alternate entrance.
            const reached = new Set(); let changed = true;
            while (changed) { changed = false; focus.forEach(f => { if (!reached.has(f.id) && (f.prereq || []).every(id => reached.has(id)) && (!(f.any || []).length || f.any.some(id => reached.has(id)))) { reached.add(f.id); changed = true; } }); }
            focus.forEach((f, i) => { if (!reached.has(f.id)) add(`focus.${i}`, `“${f.title || f.id}”에 도달할 수 없습니다. 순환 연결을 확인하세요.`); });
            // A focus cannot require both sides of a mutually exclusive branch.
            focus.forEach((f, i) => {
                const ancestors = new Set(); const visit = id => { if (ancestors.has(id)) return; ancestors.add(id); const a = focus.find(x => x.id === id); (a?.prereq || []).forEach(visit); };
                (f.prereq || []).forEach(visit);
                if ([...ancestors].some(id => { const a = focus.find(x => x.id === id); return (a?.exclusive || []).some(x => ancestors.has(x) || x === f.id) || (f.exclusive || []).includes(id); })) add(`focus.${i}.prereq`, '함께 선택할 수 없는 방향성들을 필수로 요구합니다. 합류에는 “이 중 하나”를 쓰세요.');
            });
        }
        list('crises').forEach((c, i) => {
            const p = `crises.${i}`;
            cond(c.trigger, p + '.trigger'); effects(c.onStart, p + '.onStart');
            for (const k of ['meters', 'missions', 'outcomes', 'events', 'decisions']) if (c[k] != null && (!Array.isArray(c[k]) || c[k].some(x => !object(x)))) add(`${p}.${k}`, '객체 목록이어야 합니다.');
            if (issues.some(x => x.level === 'error' && x.path.startsWith(p))) return;
            for (const k of ['meters', 'missions', 'outcomes']) idsOf(c[k] || [], `${p}.${k}`);
            (c.missions || []).forEach((m, j) => { cond(m.condition, `${p}.missions.${j}.condition`); effects(m.success, `${p}.missions.${j}.success`); effects(m.fail, `${p}.missions.${j}.fail`); });
            (c.outcomes || []).forEach((o, j) => { cond(o.condition, `${p}.outcomes.${j}.condition`); effects(o.effects, `${p}.outcomes.${j}.effects`); if (!o.condition || !Object.keys(o.condition).length) add(`${p}.outcomes.${j}`, '조건이 비어 있어 위기가 즉시 끝날 수 있습니다.', 'warning'); });
            script(c.events || [], p + '.events', true); script(c.decisions || [], p + '.decisions', false);
        });
        list('endings').forEach((e, i) => { cond(e.condition, `endings.${i}.condition`); if (!e.condition || !Object.keys(e.condition).length) add(`endings.${i}`, '조건이 비어 있어 캠페인이 즉시 끝날 수 있습니다.', 'warning'); });
        script(list('events'), 'events', true); script(list('decisions'), 'decisions', false);
        if (d.variables != null && (!object(d.variables) || Object.values(d.variables).some(x => !Number.isFinite(x)))) add('variables', '변수는 { "이름": 숫자 } 형식이어야 합니다.');
        if (d.focusStyle != null && !object(d.focusStyle)) add('focusStyle', '트리 디자인은 객체여야 합니다.');
        const events = new Set([...list('events'), ...list('crises').flatMap(c => Array.isArray(c.events) ? c.events : [])].map(e => e.id));
        focus.forEach((f, i) => { if (f.event && !events.has(f.event)) add(`focus.${i}.event`, `없는 이벤트: ${f.event}`); });
        return issues;
    }
    function layout(focus) {
        const placed = new Map(); const pending = [...focus];
        for (let n = 0; pending.length && n <= focus.length; n++) {
            let changed = false;
            for (let i = pending.length - 1; i >= 0; i--) {
                const f = pending[i], deps = [...(f.prereq || []), ...(f.any || [])].filter(id => focus.some(x => x.id === id));
                if (deps.every(id => placed.has(id))) { placed.set(f.id, deps.length ? Math.max(...deps.map(id => placed.get(id))) + 1 : 0); pending.splice(i, 1); changed = true; }
            }
            if (!changed) break;
        }
        pending.forEach(f => placed.set(f.id, 0));
        const rows = new Map(); focus.forEach(f => { const y = placed.get(f.id); if (!rows.has(y)) rows.set(y, []); rows.get(y).push(f); });
        rows.forEach(row => row.sort((a, b) => (a.x || 0) - (b.x || 0)).forEach((f, i) => { f.x = i * 2; f.y = placed.get(f.id); }));
        return focus;
    }
    function renameFocus(d, oldId, newId) {
        if (!idOK(newId) || d.focus.some(f => f.id === newId && f.id !== oldId)) return false;
        d.focus.forEach(f => { if (f.id === oldId) f.id = newId; ['prereq', 'any', 'exclusive'].forEach(k => { f[k] = (f[k] || []).map(id => id === oldId ? newId : id); }); });
        const walk = o => { if (!o || typeof o !== 'object') return; Object.entries(o).forEach(([k, v]) => { if (['flag', 'not_flag', 'has_flag', 'set_flag', 'clear_flag'].includes(k) && v === 'focus_' + oldId) o[k] = 'focus_' + newId; else walk(v); }); };
        walk(d); return true;
    }
    function starter(id) {
        const f = (id, title, icon, x, y, prereq = [], extra = {}) => ({ id, title, icon, x, y, days: 35, desc: '', prereq, any: [], exclusive: [], effects: [], ...extra });
        return {
            format: 'hemicycle-campaign@1', id, title: '갈림길의 공화국', author: '', version: '1.0', description: '대화와 강경 대응 사이, 당신의 선택이 공화국의 미래를 결정합니다.',
            lore: '불신이 의회를 뒤덮고 있습니다.\n\n개혁으로 연합을 복원할 것인가, 강력한 지도력으로 질서를 되찾을 것인가. 같은 위기에도 다른 답이 있습니다.',
            starts: [{ id: 's1', name: '공화국의 새 아침', kind: 'preset', preset: 'builtin:tutorial', desc: '내장 나라에서 시작하는 제작용 예제입니다. 시작 나라는 자유롭게 바꿀 수 있습니다.' }],
            variables: { tension: 35 },
            focus: [f('opening', '국가의 기로', '🏛', 2, 0, [], { desc: '위기를 마주하고 공화국의 진로를 결정합니다.', days: 7 }),
                f('dialogue', '원탁회의 소집', '🕊', 0, 1, ['opening'], { exclusive: ['order'], effects: [{ add_var: { name: 'tension', value: -15 } }] }),
                f('order', '질서의 이름으로', '🛡', 4, 1, ['opening'], { exclusive: ['dialogue'], effects: [{ add_var: { name: 'tension', value: 15 } }] }),
                f('reform', '새로운 사회계약', '📜', 0, 2, ['dialogue'], { effects: [{ add_var: { name: 'tension', value: -10 } }] }),
                f('authority', '행정 권한 강화', '⚖', 4, 2, ['order'], { effects: [{ add_var: { name: 'tension', value: -10 } }] }),
                f('future', '내일의 공화국', '🌅', 2, 3, [], { any: ['reform', 'authority'], event: 'new_dawn' })],
            events: [{ id: 'new_dawn', title: '새벽을 맞이하며', desc: '우리가 고른 길은 역사가 될 것이다.', trigger_only: true, super: true, quote: '미래는 아직 쓰이지 않았다.', quote_author: '공화국 연설', options: [{ text: '새 시대를 향해', effects: [] }] }], decisions: [],
            crises: [{ id: 'unrest', title: '광장의 목소리', color: '#d96f56', desc: '긴장 수치를 낮추고 새 시대를 준비하세요.', trigger: { flag: 'focus_opening' }, onStart: [],
                meters: [{ id: 'tension', name: '사회 긴장', start: 35, min: 0, max: 100, perMonth: 3 }],
                missions: [{ id: 'talks', title: '정국 안정화', days: 120, condition: { var: { name: 'tension', lte: 30 } }, success: [{ add_var: { name: 'tension', value: -5 } }], fail: [{ add_var: { name: 'tension', value: 10 } }] }],
                outcomes: [{ id: 'calm', title: '광장의 평온', text: '대화가 일상을 되찾았습니다.', condition: { var: { name: 'tension', lte: 10 } }, effects: [] }, { id: 'resolved', title: '새로운 균형', text: '공화국은 다른 미래를 향합니다.', condition: { flag: 'focus_future' }, effects: [] }], events: [], decisions: [] }],
            endings: [{ id: 'dawn', title: '우리가 만든 내일', text: '위기를 넘어 새 장을 열었습니다. 공화국의 이야기는 계속됩니다.', condition: { flag: 'focus_future' } }]
        };
    }
    const api = { validate, layout, renameFocus, starter, clone, idOK };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else root.HemiCampaignTools = api;
})(typeof window === 'undefined' ? globalThis : window);
