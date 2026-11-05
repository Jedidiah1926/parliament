// Shared, data-only authoring tools. Keep campaign@1 and unknown extension fields intact.
(function (root) {
    'use strict';
    const Clock = typeof module !== 'undefined' && module.exports ? require('./campaign-clock.js') : root.HemiCampaignClock;
    const clone = x => JSON.parse(JSON.stringify(x));
    const object = x => !!x && typeof x === 'object' && !Array.isArray(x);
    const arrayKeys = ['starts', 'focus', 'crises', 'endings', 'events', 'decisions', 'articles'];
    const idOK = id => typeof id === 'string' && /^[a-zA-Z0-9_.-]+$/.test(id);
    function validate(d) {
        const issues = [];
        const add = (path, message, level = 'error') => issues.push({ path, message, level });
        if (!object(d) || d.format !== 'hemicycle-campaign@1') return [{ path: 'format', message: 'hemicycle-campaign@1 형식이어야 합니다.', level: 'error' }];
        if (!idOK(d.id)) add('id', '시나리오 ID는 영문·숫자·밑줄·점·하이픈으로 입력하세요.');
        for (const key of arrayKeys) if (d[key] != null && (!Array.isArray(d[key]) || d[key].some(x => !object(x)))) add(key, '객체 목록 [ { … } ]이어야 합니다.');
        if (issues.length) return issues;
        if(d.time!=null){
            if(!object(d.time))add('time','시간 설정은 객체여야 합니다.');
            else {
                if(!['turn','realtime'].includes(d.time.mode))add('time.mode','턴제(turn) 또는 실시간(realtime)을 선택하세요.');
                if(d.time.startDate!=null&&(typeof d.time.startDate!=='string'||d.time.startDate!==''&&Clock.dayFromDate(d.time.startDate)==null))add('time.startDate','실제 존재하는 날짜 YYYY-MM-DD를 입력하세요 (1~9999년).');
                if(d.time.startHour!=null&&(!Number.isInteger(d.time.startHour)||d.time.startHour<0||d.time.startHour>23))add('time.startHour','시작 시각은 0~23 사이 정수입니다.');
                if(d.time.defaultSpeed!=null&&(!Number.isInteger(d.time.defaultSpeed)||!Object.hasOwn(Clock.SPEED_MS,d.time.defaultSpeed)))add('time.defaultSpeed','시작 속도는 1~5 사이 정수입니다.');
            }
        }
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
                if(isEvent){
                    if(e.presentation!=null&&!['narrative','standard'].includes(e.presentation))add(q+'.presentation','서사(narrative) 또는 일반(standard) 화면을 선택하세요.');
                    for(const k of ['title','desc','image'])if(e[k]!=null&&typeof e[k]!=='string')add(q+'.'+k,'문자열이어야 합니다.');
                }
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
        const articleIds=idsOf(list('articles'),'articles');
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
            if(f.art!=null && (!object(f.art)||['scale','x','y'].some(k=>f.art[k]!=null&&!Number.isFinite(f.art[k]))))add(p+'.art','그림 배치는 숫자 scale · x · y로 입력하세요.');
            if(f.article&&!articleIds.has(f.article))add(p+'.article','없는 시나리오 기사: '+f.article);
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
            (c.outcomes || []).forEach((o, j) => { cond(o.condition, `${p}.outcomes.${j}.condition`); effects(o.effects, `${p}.outcomes.${j}.effects`); if (!o.condition || !Object.keys(o.condition).length) add(`${p}.outcomes.${j}`, '조건이 비어 있어 격변이 즉시 끝날 수 있습니다.', 'warning'); });
            script(c.events || [], p + '.events', true); script(c.decisions || [], p + '.decisions', false);
        });
        list('endings').forEach((e, i) => { cond(e.condition, `endings.${i}.condition`); if (!e.condition || !Object.keys(e.condition).length) add(`endings.${i}`, '조건이 비어 있어 시나리오가 즉시 끝날 수 있습니다.', 'warning'); });
        script(list('events'), 'events', true); script(list('decisions'), 'decisions', false);
        list('articles').forEach((a,i)=>{
            const p='articles.'+i;
            if(!['start','focus','date','condition','manual'].includes(a.when))add(p+'.when','발행 계기는 start · focus · date · condition · manual 중 하나입니다.');
            for(const k of ['title','body','subtitle','source','image'])if(a[k]!=null&&typeof a[k]!=='string')add(p+'.'+k,'문자열이어야 합니다.');
            if(a.when==='focus'&&!ids.has(a.focus))add(p+'.focus','완료를 기다릴 방향성을 선택하세요.');
            if(a.when==='date'&&!/^(-?\d{1,5})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(a.date||''))add(p+'.date','날짜는 YYYY-MM-DD로 입력하세요.');
            cond(a.trigger,p+'.trigger');
            if(a.when==='condition'&&(a.trigger==null||object(a.trigger)&&!Object.keys(a.trigger).length))add(p+'.trigger','자동 발행 조건을 입력하세요.');
            for(const k of ['effects','options','meters','missions','outcomes'])if(a[k]!=null)add(p+'.'+k,'시나리오 기사는 정보 전달용입니다. 효과·선택지·격변 항목은 이벤트나 격변에 작성하세요.');
            if(!a.body)add(p+'.body','기사 본문이 비어 있습니다.','warning');
        });
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
        (d.articles||[]).forEach(a=>{if(a.focus===oldId)a.focus=newId;});
        const walk = o => { if (!o || typeof o !== 'object') return; Object.entries(o).forEach(([k, v]) => { if (['flag', 'not_flag', 'has_flag', 'set_flag', 'clear_flag'].includes(k) && v === 'focus_' + oldId) o[k] = 'focus_' + newId; else walk(v); }); };
        walk(d); return true;
    }
    function starter(id) {
        const f = (id, title, icon, x, y, prereq = [], extra = {}) => ({ id, title, icon, x, y, days: 35, desc: '', prereq, any: [], exclusive: [], effects: [], ...extra });
        return {
            format: 'hemicycle-campaign@1', id, title: '갈림길의 공화국', author: '', version: '1.0', description: '대화와 강경 대응 사이, 당신의 선택이 공화국의 미래를 결정합니다.',
            lore: '불신이 의회를 뒤덮고 있습니다.\n\n개혁으로 연합을 복원할 것인가, 강력한 지도력으로 질서를 되찾을 것인가. 같은 격변에도 다른 답이 있습니다.',
            starts: [{ id: 's1', name: '공화국의 새 아침', kind: 'preset', preset: 'builtin:tutorial', desc: '내장 나라에서 시작하는 제작용 예제입니다. 시작 나라는 자유롭게 바꿀 수 있습니다.' }],
            time:{mode:'turn',startDate:'',startHour:0,defaultSpeed:1},
            variables: { tension: 35 },
            focus: [f('opening', '국가의 기로', '🏛', 2, 0, [], { desc: '격변을 마주하고 공화국의 진로를 결정합니다.', days: 7 }),
                f('dialogue', '원탁회의 소집', '🕊', 0, 1, ['opening'], { exclusive: ['order'], effects: [{ add_var: { name: 'tension', value: -15 } }] }),
                f('order', '질서의 이름으로', '🛡', 4, 1, ['opening'], { exclusive: ['dialogue'], effects: [{ add_var: { name: 'tension', value: 15 } }] }),
                f('reform', '새로운 사회계약', '📜', 0, 2, ['dialogue'], { effects: [{ add_var: { name: 'tension', value: -10 } }] }),
                f('authority', '행정 권한 강화', '⚖', 4, 2, ['order'], { effects: [{ add_var: { name: 'tension', value: -10 } }] }),
                f('future', '내일의 공화국', '🌅', 2, 3, [], { any: ['reform', 'authority'], event: 'new_dawn' })],
            articles: [{id:'republic_news',title:'공화국, 새로운 진로를 모색하다',subtitle:'오늘의 선택이 내일의 역사가 된다',source:'공화국 통신',body:'정부는 국가의 미래를 위한 논의를 시작했다고 발표했습니다.\n\n광장과 의회는 서로 다른 해법을 제시하고 있습니다. 앞으로의 선택은 어떤 내일을 만들게 될까요?',when:'focus',focus:'opening'}],
            events: [{ id: 'new_dawn', title: '새벽을 맞이하며', desc: '우리가 고른 길은 역사가 될 것이다.', trigger_only: true, super: true, quote: '미래는 아직 쓰이지 않았다.', quote_author: '공화국 연설', options: [{ text: '새 시대를 향해', effects: [] }] }], decisions: [],
            crises: [{ id: 'unrest', title: '광장의 목소리', color: '#d96f56', desc: '긴장 수치를 낮추고 새 시대를 준비하세요.', trigger: { flag: 'focus_opening' }, onStart: [],
                meters: [{ id: 'tension', name: '사회 긴장', start: 35, min: 0, max: 100, perMonth: 3 }],
                missions: [{ id: 'talks', title: '정국 안정화', days: 120, condition: { var: { name: 'tension', lte: 30 } }, success: [{ add_var: { name: 'tension', value: -5 } }], fail: [{ add_var: { name: 'tension', value: 10 } }] }],
                outcomes: [{ id: 'calm', title: '광장의 평온', text: '대화가 일상을 되찾았습니다.', condition: { var: { name: 'tension', lte: 10 } }, effects: [] }, { id: 'resolved', title: '새로운 균형', text: '공화국은 다른 미래를 향합니다.', condition: { flag: 'focus_future' }, effects: [] }], events: [], decisions: [] }],
            endings: [{ id: 'dawn', title: '우리가 만든 내일', text: '격변을 넘어 새 장을 열었습니다. 공화국의 이야기는 계속됩니다.', condition: { flag: 'focus_future' } }]
        };
    }
    const api = { validate, layout, renameFocus, starter, clone, idOK };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else root.HemiCampaignTools = api;
})(typeof window === 'undefined' ? globalThis : window);
