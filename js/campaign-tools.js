// Shared, data-only authoring tools. Keep campaign@1 and unknown extension fields intact.
(function (root) {
    'use strict';
    const Clock = typeof module !== 'undefined' && module.exports ? require('./campaign-clock.js') : root.HemiCampaignClock;
    const World = typeof module !== 'undefined' && module.exports ? require('./world-rules.js') : root.HemiWorldRules;
    const Ops = typeof module !== 'undefined' && module.exports ? require('./ops-rules.js') : root.HemiOps;
    const clone = x => JSON.parse(JSON.stringify(x));
    const object = x => !!x && typeof x === 'object' && !Array.isArray(x);
    const arrayKeys = ['starts', 'focus', 'crises', 'endings', 'events', 'decisions', 'articles', 'resources', 'facilities', 'tech', 'units', 'trades'];
    const idOK = id => typeof id === 'string' && /^[a-zA-Z0-9_.-]+$/.test(id);
    const LOCKS = ['parties', 'seats', 'elections', 'government', 'opinion', 'economy', 'worldMap', 'economicRegions']; // 게임이 실제로 적용하는 직접 수정 잠금 (js/campaign.js lockReason · js/play-locks.js)
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
        // ---- 조건 · 효과 안쪽까지 (v1.7.1) — 연산자마다 인수를 보고, all · any · not · if · random_list는 안으로 들어간다 ----
        // 오류: 게임이 아는 연산자인데 인수가 틀렸거나, 없는 이벤트 · 결정 · 나라 · 구역 · 경제권을 가리킴
        // 경고: 모르는 연산자(확장 기능일 수 있어 지우지 않는다) · 변화가 없을 수 있는 효과
        // 확인 필요(check): 정적 검사로는 단정할 수 없는 것 — 시험 플레이에서 확인
        const safe = v => String(v || '').replace(/[^a-z0-9_.-]/gi, '_').slice(0, 50);
        const crisesOK = list('crises').filter(c => object(c));
        const subs = (c, k) => (Array.isArray(c[k]) ? c[k].filter(object) : []);
        const eventIds = new Set([...list('events'), ...crisesOK.flatMap(c => subs(c, 'events'))].map(e => String(e.id)));
        const decisionIds = new Set([...list('decisions'), ...crisesOK.flatMap(c => subs(c, 'decisions'))].map(e => String(e.id)));
        const varNames = new Set([...(object(d.variables) ? Object.keys(d.variables) : []), ...crisesOK.flatMap(c => subs(c, 'meters').map(m => m.id))]);
        const autoFlags = new Set([...list('focus').map(f => 'focus_' + safe(f.id)), ...crisesOK.flatMap(c => ['crisis_' + safe(c.id), 'crisis_' + safe(c.id) + '_done', ...subs(c, 'outcomes').map(o => 'crisis_' + safe(c.id) + '_' + safe(o.id))])]);
        const flagsSet = new Set(), flagsRead = []; // 켜는 플래그 / 읽는 곳 [이름, 경로]
        const varsRead = [];
        const CMP = ['gt', 'gte', 'lt', 'lte', 'eq', 'ne'], ECON = ['growth', 'infl', 'unemp', 'rate', 'yield', 'debt', 'balance', 'mood', 'conf', 'cur'], SEATS = ['cabinet', 'president', 'pm', 'chair'];
        const text = v => typeof v === 'string';
        const partyOK = v => (text(v) && v !== '') || Number.isFinite(v);
        const dateOK = v => (text(v) || Number.isFinite(v)) && /^(-?\d{1,5})(?:-(\d{1,2}))?(?:-(\d{1,2}))?$/.test(String(v).trim());
        const compare = (v, p) => {
            const used = CMP.filter(k => k in v);
            if (!used.length) add(p, '비교 기준(gte · lte · gt · lt · eq · ne)과 숫자가 필요합니다.');
            used.forEach(k => { if (!Number.isFinite(Number(v[k])) || v[k] === '' || v[k] == null || typeof v[k] === 'boolean') add(`${p}.${k}`, '비교 값은 숫자여야 합니다.'); });
        };
        const need = (ok, p, message) => { if (!ok) add(p, message); return ok; };
        const flagName = (v, p, read) => {
            if (!need(text(v), p, '플래그 이름은 문자열이어야 합니다.')) return;
            if (!v) { add(p, '플래그 이름이 비어 있습니다.', 'warning'); return; }
            if (read) flagsRead.push([v, p]); else flagsSet.add(v);
        };
        const amount = (v, p) => {
            const a = 'add' in v, b = 'set' in v;
            if (!a && !b) add(p, '더할 값(add) 또는 바꿀 값(set)이 필요합니다.');
            for (const k of ['add', 'set']) if (k in v && (!Number.isFinite(Number(v[k])) || v[k] === '' || v[k] == null)) add(`${p}.${k}`, '숫자여야 합니다.');
        };
        const worldRefs = []; // [연산자, 값, 경로] — 시작 나라별 지도 · 연결과 대조는 아래에서 한꺼번에
        // 국가 운영 (js/ops-rules.js) — 자원 · 시설 · 기술 · 부대 · 무역 ID
        const opsIds = Object.fromEntries(['resources', 'facilities', 'tech', 'units', 'trades'].map(k => [k, new Set(list(k).map(x => x.id))]));
        const OPS_LABEL = { resources: '자원', facilities: '시설', tech: '기술', units: '부대', trades: '무역 계약' };
        const opsRule = (k, v, p, table) => {
            const def = table[k];
            if (!def.check(v)) { add(p, `${k}의 형식이 틀렸습니다 — ${OPS_HINT[k] || ''}`); return; }
            if (def.kind) { const id = typeof v === 'string' ? v : v.id; if (!opsIds[def.kind].has(id)) add(p + (typeof v === 'string' ? '' : '.id'), `없는 ${OPS_LABEL[def.kind]}: ${id}`); }
            if (typeof v === 'object') CMP.filter(c => c in v).forEach(c => { if (!Number.isFinite(Number(v[c])) || v[c] === '' || v[c] == null) add(`${p}.${c}`, '비교 값은 숫자여야 합니다.'); });
        };
        const OPS_HINT = { resource: '{ "id": "자원", "gte": 숫자 }', facility_count: '{ "id": "시설", "gte": 숫자 }', unit_count: '{ "id": "부대", "gte": 숫자 }', military_strength: '{ "gte": 숫자 }', tech_done: '"기술 ID"', trade_active: '"계약 ID"',
            add_resource: '{ "id": "자원", "value": 숫자 }', set_resource: '{ "id": "자원", "value": 숫자 }', add_facility: '{ "id": "시설", "count": 정수 }', add_units: '{ "id": "부대", "count": 정수 }', grant_tech: '"기술 ID"', start_trade: '"계약 ID"', end_trade: '"계약 ID"' };
        const opsCost = (m, p, what) => {
            if (m == null) return;
            if (!object(m)) { add(p, `${what}는 { "자원 ID": 숫자 } 형식입니다.`); return; }
            Object.entries(m).forEach(([k, v]) => { if (!opsIds.resources.has(k)) add(`${p}.${k}`, `없는 자원: ${k}`); else if (!Number.isFinite(Number(v)) || typeof v === 'boolean' || v === '' || v == null) add(`${p}.${k}`, '숫자여야 합니다.'); else if (Number(v) < 0) add(`${p}.${k}`, '0 이상이어야 합니다.'); });
        };
        const worldRule = (k, v, p) => {
            const shape = k === 'owns_regions' ? World.ownsShape(v) : k === 'transfer_regions' ? World.transferShape(v) : k === 'in_economic_region' ? World.inZoneShape(v) : World.assignShape(v);
            if (shape) add(p, shape); else worldRefs.push([k, v, p]);
        };
        function condOne(k, v, p) {
            switch (k) {
                case 'all': case 'any': if (Array.isArray(v)) v.forEach((c, i) => cond(c, `${p}.${i}`)); else cond(v, p); return;
                case 'not': cond(v, p); return;
                case 'always': need(typeof v === 'boolean', p, 'always는 true 또는 false입니다.'); return;
                case 'date_after': case 'date_before': need(dateOK(v), p, '날짜는 YYYY-MM-DD(또는 YYYY · YYYY-MM)로 입력하세요.'); return;
                case 'flag': case 'has_flag': case 'not_flag': flagName(v, p, true); return;
                case 'var': if (need(object(v) && text(v.name) && v.name !== '', p, '변수 비교는 { "name": "변수", "gte": 숫자 } 형식입니다.')) { compare(v, p); varsRead.push([v.name, p]); } return;
                case 'chance': if (need(Number.isFinite(Number(v)) && v !== '' && v != null && typeof v !== 'boolean', p, '확률(chance)은 0 ~ 100 사이 숫자입니다.') && (Number(v) < 0 || Number(v) > 100)) add(p, '확률(chance)이 0 ~ 100을 벗어났습니다.', 'warning'); return;
                case 'event_fired': if (need(text(v) && v !== '', p, '이벤트 ID 문자열이 필요합니다.') && !eventIds.has(v)) add(p, `없는 이벤트: ${v}`); return;
                case 'decision_taken': if (need(text(v) && v !== '', p, '결정 ID 문자열이 필요합니다.') && !decisionIds.has(v)) add(p, `없는 결정: ${v}`); return;
                case 'party_exists': case 'ruling': need(partyOK(v), p, '정당(번호 · 이름 · 약칭 · ruling · largest · opposition)이 필요합니다.'); return;
                case 'party_status': need(object(v) && partyOK(v.party) && ['active', 'banned', 'dissolved'].includes(v.is), p, '{ "party": 정당, "is": "active" | "banned" | "dissolved" } 형식입니다.'); return;
                case 'party_seats': case 'party_support': if (need(object(v) && partyOK(v.party), p, '{ "party": 정당, "gte": 숫자 } 형식입니다.')) compare(v, p); return;
                case 'ruling_seats': if (need(object(v), p, '{ "share": true, "gte": 숫자 } 형식입니다.')) compare(v, p); return;
                case 'economy': if (need(object(v) && ECON.includes(v.indicator), p, `경제 지표(indicator)는 ${ECON.join(' · ')} 중 하나입니다.`)) compare(v, p); return;
                case 'approval': if (need(object(v) && (v.of == null || SEATS.includes(v.of)), p, `지지율 대상(of)은 ${SEATS.join(' · ')} 중 하나입니다.`)) compare(v, p); return;
                case 'owns_regions': case 'in_economic_region': worldRule(k, v, p); return;
                case 'resource': case 'facility_count': case 'unit_count': case 'military_strength': case 'tech_done': case 'trade_active': opsRule(k, v, p, Ops.COND); return;
                default: add(p, `알 수 없는 조건 “${k}” — 게임에서는 거짓으로 처리됩니다. 오타가 아니면 그대로 두어도 보존됩니다.`, 'warning');
            }
        }
        function cond(v, p) {
            if (v == null || typeof v === 'boolean') return;
            if (Array.isArray(v)) { v.forEach((c, i) => cond(c, `${p}.${i}`)); return; }
            if (!object(v)) { add(p, '조건은 객체 또는 조건 배열이어야 합니다.'); return; }
            Object.entries(v).forEach(([k, x]) => condOne(k, x, `${p}.${k}`));
        }
        const fireEdges = []; // [효과가 든 곳의 경로, 부르는 이벤트 ID]
        function effectOne(k, v, p) {
            switch (k) {
                case 'set_flag': case 'clear_flag': flagName(v, p, false); return;
                case 'set_var': case 'add_var': if (need(object(v) && text(v.name) && v.name !== '', p, '{ "name": "변수", "value": 숫자 } 형식입니다.')) { need(Number.isFinite(Number(v.value)) && v.value !== '' && v.value != null, `${p}.value`, '변경 값은 숫자여야 합니다.'); varsRead.push([v.name, p]); } return;
                case 'support': if (need(object(v) && partyOK(v.party), p, '{ "party": 정당, "add": 숫자 } 형식입니다.')) amount(v, p); return;
                case 'party_status': need(object(v) && partyOK(v.party) && ['active', 'banned', 'dissolved'].includes(v.to), p, '{ "party": 정당, "to": "active" | "banned" | "dissolved" } 형식입니다.'); return;
                case 'rename_party': need(object(v) && partyOK(v.party) && (text(v.name) || text(v.abbr)), p, '{ "party": 정당, "name": "새 이름" } 형식입니다.'); return;
                case 'party_color': need(object(v) && partyOK(v.party) && /^#[0-9a-f]{6}$/i.test(v.color || ''), p, '{ "party": 정당, "color": "#rrggbb" } 형식입니다.'); return;
                case 'economy': if (need(object(v) && ECON.includes(v.indicator), p, `경제 지표(indicator)는 ${ECON.join(' · ')} 중 하나입니다.`)) amount(v, p); return;
                case 'nation_name': case 'toast': need(text(v), p, '문자열이어야 합니다.'); return;
                case 'message': need(text(v) || (object(v) && (text(v.title) || text(v.text))), p, '문자열 또는 { "title", "text" } 형식입니다.'); return;
                case 'approval': if (need(object(v) && (v.of == null || SEATS.includes(v.of)), p, `지지율 대상(of)은 ${SEATS.join(' · ')} 중 하나입니다.`)) amount(v, p); return;
                case 'article': need(object(v) && text(v.title), p, '기사 효과는 { "title": "제목", … } 형식입니다.'); return;
                case 'fire_event': { const id = object(v) ? v.id : v; if (need(text(id) && id !== '', p, '이벤트 ID가 필요합니다.')) { if (!eventIds.has(id)) add(p, `없는 이벤트: ${id}`); else fireEdges.push([p, id]); } return; }
                case 'if': if (need(object(v) && ('condition' in v || 'if' in v), p, '{ "condition": 조건, "then": [효과], "else": [효과] } 형식입니다.')) { cond(v.condition ?? v.if, p + ('condition' in v ? '.condition' : '.if')); effects(v.then, p + '.then'); effects(v.else, p + '.else'); } return;
                case 'random_list': if (need(Array.isArray(v) && v.every(object), p, '[{ "weight": 숫자, "effects": [효과] }] 형식입니다.')) v.forEach((o, i) => { need(Number.isFinite(Number(o.weight)) && Number(o.weight) >= 0, `${p}.${i}.weight`, '가중치(weight)는 0 이상의 숫자입니다.'); effects(o.effects, `${p}.${i}.effects`); }); return;
                case 'transfer_regions': case 'assign_economic_region': worldRule(k, v, p); return;
                case 'add_resource': case 'set_resource': case 'add_facility': case 'add_units': case 'grant_tech': case 'start_trade': case 'end_trade': opsRule(k, v, p, Ops.EFF); return;
                default: add(p, `알 수 없는 효과 “${k}” — 게임에서는 건너뜁니다. 오타가 아니면 그대로 두어도 보존됩니다.`, 'warning');
            }
        }
        function effects(v, p) {
            if (v == null) return;
            if (!Array.isArray(v) || v.some(e => !object(e))) { add(p, '효과는 객체 배열이어야 합니다.'); return; }
            v.forEach((e, i) => Object.entries(e).forEach(([k, x]) => effectOne(k, x, `${p}.${i}.${k}`)));
        }
        const script = (items, p, isEvent) => {
            idsOf(items, p);
            items.forEach((e, i) => {
                const q = `${p}.${i}`;
                cond(e.trigger, q + '.trigger'); cond(e.available, q + '.available'); cond(e.visible, q + '.visible');
                if (!isEvent) { opsCost(e.cost, q + '.cost', '결정 비용'); if (e.cooldown_days != null && (!Number.isFinite(Number(e.cooldown_days)) || Number(e.cooldown_days) < 0)) add(q + '.cooldown_days', '다시 실행까지 기간은 0 이상의 숫자입니다.'); if (e.once != null && typeof e.once !== 'boolean') add(q + '.once', 'once는 true 또는 false입니다.'); }
                effects(e.effects, q + '.effects'); effects(e.immediate, q + '.immediate');
                if(isEvent){
                    if(e.check!=null&&!['date','election','world','any'].includes(e.check))add(q+'.check','검사 시점은 date(날짜) · election(총선 반영) · world(지도 변경) · any(모든 시점) 중 하나입니다.');
                    if(e.once===false&&!e.trigger_only&&e.chance==null&&(e.trigger==null||object(e.trigger)&&!Object.keys(e.trigger).length))add(q,'조건 없이 반복(once: false)하는 이벤트입니다 — 검사할 때마다 다시 일어납니다. 조건 · 확률을 넣거나 “직접 실행만”으로 바꾸세요.');
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
        crisesOK.forEach((c, i) => { const p = `crises.${i}`; if (c.intro && !events.has(c.intro)) add(p + '.intro', `없는 이벤트: ${c.intro}`); subs(c, 'outcomes').forEach((o, j) => { if (o.event && !events.has(o.event)) add(`${p}.outcomes.${j}.event`, `없는 이벤트: ${o.event}`); }); subs(c, 'missions').forEach((m, j) => cond(m.start, `${p}.missions.${j}.start`)); });
        // 게임에서는 최상위와 격변 안의 이벤트 · 결정이 한 이름 공간을 쓴다 — 같은 ID면 한쪽이 가려진다
        const clash = (key, label) => {
            const seen = new Map(list(key).map((e, i) => [String(e.id), `${key}.${i}`]));
            list('crises').forEach((c, i) => { if (object(c)) subs(c, key).forEach((e, j) => { const p = `crises.${i}.${key}.${j}.id`, id = String(e.id); if (seen.has(id)) add(p, `${label} ID “${id}”가 ${seen.get(id)}와 겹칩니다 — 게임에서는 같은 이름 공간을 씁니다.`); else seen.set(id, `crises.${i}.${key}.${j}`); }); });
        };
        clash('events', '이벤트'); clash('decisions', '결정');
        // 창 없이 바로 실행되는 숨은 이벤트끼리 서로 부르면 끝나지 않는다
        {
            const all = [...list('events').map((e, i) => [e, `events.${i}`]), ...list('crises').flatMap((c, i) => (object(c) ? subs(c, 'events').map((e, j) => [e, `crises.${i}.events.${j}`]) : []))];
            const byId = new Map(all.map(([e, p]) => [String(e.id), { e, p }]));
            const calls = id => { const it = byId.get(id); return it ? fireEdges.filter(([p]) => p.startsWith(it.p + '.')).map(([, to]) => to) : []; };
            const state = new Map(); // 1 = 보는 중, 2 = 끝
            const visit = (id, trail) => {
                if (state.get(id) === 2) return; if (state.get(id) === 1) { const loop = trail.slice(trail.indexOf(id)).concat(id); const hidden = loop.every(x => byId.get(x)?.e.hidden); add(byId.get(id).p, `이벤트가 서로를 다시 부릅니다: ${loop.join(' → ')}` + (hidden ? ' — 모두 숨은 이벤트라 끝나지 않습니다.' : ' — 선택에 따라 되풀이될 수 있습니다.'), hidden ? 'error' : 'check'); return; }
                state.set(id, 1); calls(id).forEach(to => visit(to, [...trail, id])); state.set(id, 2);
            };
            byId.forEach((_, id) => visit(id, []));
        }
        // 플래그 · 변수 — 켜는 곳이 없는 플래그, 선언하지 않은 변수는 단정할 수 없어 "확인 필요"
        flagsRead.forEach(([name, p]) => { if (!flagsSet.has(name) && !autoFlags.has(name)) add(p, name.startsWith('focus_') ? `방향성 완료 플래그 “${name}”에 해당하는 방향성이 없습니다.` : `플래그 “${name}”를 켜는 효과가 이 시나리오에 없습니다.`, name.startsWith('focus_') ? 'warning' : 'check'); });
        { const told = new Set(); varsRead.forEach(([name, p]) => { if (!varNames.has(name) && !told.has(name)) { told.add(name); add(p, `변수 “${name}”가 시나리오 변수에 없습니다 — 0에서 시작합니다.`, 'check'); } }); }
        opsChecks();
        function opsChecks() {
            ['resources', 'facilities', 'tech', 'units', 'trades'].forEach(k => idsOf(list(k), k));
            const nonNeg = (v, p, what) => { if (v != null && (!Number.isFinite(Number(v)) || typeof v === 'boolean' || Number(v) < 0)) add(p, `${what}는 0 이상의 숫자여야 합니다.`); };
            const intNonNeg = (v, p, what) => { if (v != null && (!Number.isInteger(Number(v)) || Number(v) < 0)) add(p, `${what}는 0 이상의 정수여야 합니다.`); };
            const techRefs = (arr, p) => { if (arr == null) return; if (!Array.isArray(arr) || arr.some(x => typeof x !== 'string')) { add(p, '기술 ID 문자열 배열이어야 합니다.'); return; } arr.forEach((id, j) => { if (!opsIds.tech.has(id)) add(`${p}.${j}`, `없는 기술: ${id}`); }); };
            list('resources').forEach((r, i) => { const p = 'resources.' + i; nonNeg(r.start, p + '.start', '시작 값'); nonNeg(r.max, p + '.max', '저장 한도'); if (r.max != null && r.start != null && Number(r.start) > Number(r.max)) add(p + '.start', '시작 값이 저장 한도보다 큽니다 — 한도까지만 들어갑니다.', 'warning'); });
            list('facilities').forEach((f, i) => { const p = 'facilities.' + i; ['cost', 'produce', 'consume', 'upkeep'].forEach(k => opsCost(f[k], `${p}.${k}`, { cost: '건설 비용', produce: '생산', consume: '소비', upkeep: '유지비' }[k])); nonNeg(f.days, p + '.days', '건설 기간'); intNonNeg(f.start, p + '.start', '처음 수'); intNonNeg(f.max, p + '.max', '최대 수'); techRefs(f.requires, p + '.requires'); cond(f.available, p + '.available'); if (!Ops.amounts(f.produce).length && !Ops.amounts(f.upkeep).length && !Ops.amounts(f.consume).length) add(p, `시설 “${f.name || f.id}”에 생산 · 소비 · 유지비가 없습니다.`, 'warning');
                if (f.buildable != null && typeof f.buildable !== 'boolean') add(p + '.buildable', 'buildable은 true 또는 false입니다.');
                if (f.buildable !== false && !Ops.amounts(f.cost).length && !(Number(f.days) > 0) && f.max == null) add(p, `시설 “${f.name || f.id}”은 비용 · 기간 · 최대 수 없이 지을 수 있어 끝없이 늘릴 수 있습니다. 비용을 넣거나 “지을 수 없음”으로 하세요.`, 'warning'); });
            list('units').forEach((u, i) => { const p = 'units.' + i; ['cost', 'upkeep'].forEach(k => opsCost(u[k], `${p}.${k}`, k === 'cost' ? '편성 비용' : '유지비')); nonNeg(u.days, p + '.days', '편성 기간'); nonNeg(u.strength, p + '.strength', '전력'); intNonNeg(u.start, p + '.start', '처음 수'); intNonNeg(u.max, p + '.max', '최대 수'); techRefs(u.requires, p + '.requires'); cond(u.available, p + '.available'); if (u.recruitable != null && typeof u.recruitable !== 'boolean') add(p + '.recruitable', 'recruitable은 true 또는 false입니다.'); });
            const tech = list('tech');
            tech.forEach((t, i) => { const p = 'tech.' + i; opsCost(t.cost, p + '.cost', '연구 비용'); nonNeg(t.days, p + '.days', '연구 기간'); ['prereq', 'any', 'exclusive'].forEach(k => { techRefs(t[k], `${p}.${k}`); (Array.isArray(t[k]) ? t[k] : []).forEach(id => { if (id === t.id) add(`${p}.${k}`, '자기 자신과 연결할 수 없습니다.'); }); }); effects(t.effects, p + '.effects'); cond(t.available, p + '.available'); for (const k of ['x', 'y']) if (t[k] != null && (!Number.isFinite(t[k]) || t[k] < 0 || t[k] > 200)) add(`${p}.${k}`, '좌표는 0~200 사이 숫자로 입력하세요.'); });
            if (!issues.some(x => x.level === 'error' && x.path.startsWith('tech'))) {
                const done = new Set(tech.filter(t => t.start === true).map(t => t.id)); let changed = true;
                while (changed) { changed = false; tech.forEach(t => { if (!done.has(t.id) && (t.prereq || []).every(id => done.has(id)) && (!(t.any || []).length || t.any.some(id => done.has(id)))) { done.add(t.id); changed = true; } }); }
                tech.forEach((t, i) => { if (!done.has(t.id)) add('tech.' + i, `기술 “${t.title || t.id}”에 도달할 수 없습니다. 선행 연결이 순환하는지 확인하세요.`); });
            }
            const countries = new Set(d.world && Array.isArray(d.world.countries) ? d.world.countries.filter(object).map(c => c.key) : []);
            list('trades').forEach((t, i) => { const p = 'trades.' + i; opsCost(t.give, p + '.give', '내줄 것'); opsCost(t.get, p + '.get', '받을 것'); nonNeg(t.days, p + '.days', '계약 기간'); cond(t.available, p + '.available'); cond(t.visible, p + '.visible');
                if (t.partner == null || t.partner === '') add(p + '.partner', '거래 상대(시나리오의 나라 열쇠)를 고르세요.'); else if (!countries.has(t.partner)) add(p + '.partner', `시나리오의 나라 목록에 없는 상대: ${t.partner} — 시작 나라 › 세계지도 연결에서 나라를 추가하세요.`);
                if (!Ops.amounts(t.give).length && !Ops.amounts(t.get).length) add(p, '주고받는 것이 없는 계약입니다.', 'warning'); });
            for (const k of ['buildSlots', 'recruitSlots']) if (d[k] != null && (!Number.isInteger(d[k]) || d[k] < 1)) add(k, '동시에 할 수 있는 수는 1 이상의 정수입니다.');
            // 운영 조건 · 효과를 쓰는데 그 목록이 비어 있으면 — 위의 “없는 …” 오류가 이미 알려 준다
        }
        worldChecks(d, add, worldRefs);
        // 플레이 규칙 — 지금 게임이 적용하는 잠금만 조용히 통과시킨다 (모르는 항목을 잠긴 것처럼 믿게 두지 않는다)
        if (d.playRules != null) {
            if (!object(d.playRules)) add('playRules', '플레이 규칙은 객체여야 합니다.');
            else if (d.playRules.locks != null) {
                if (!object(d.playRules.locks)) add('playRules.locks', '잠금은 { "worldMap": true } 형식입니다.');
                else Object.entries(d.playRules.locks).forEach(([k, v]) => {
                    if (typeof v !== 'boolean') add(`playRules.locks.${k}`, '잠금 값은 true 또는 false입니다.');
                    else if (!LOCKS.includes(k)) add(`playRules.locks.${k}`, `“${k}” 잠금은 아직 지원하지 않습니다 — 게임에서 적용되지 않습니다. (지원: ${LOCKS.join(' · ')})`, 'warning');
                });
            }
        }
        return issues;
    }
    // ---- 세계지도 연결 · 영토 · 경제권 참조 — 고를 수 있는 모든 시작 나라에서 유효해야 한다 ----
    function worldChecks(d, add, refs) {
        const starts = Array.isArray(d.starts) ? d.starts : [];
        const declared = new Map();
        if (d.world != null) {
            if (!object(d.world)) add('world', '세계지도 연결(world)은 객체여야 합니다.');
            else if (d.world.countries != null && (!Array.isArray(d.world.countries) || d.world.countries.some(c => !object(c)))) add('world.countries', '나라 목록은 [{ "key", "name" }] 형식입니다.');
            else (d.world.countries || []).forEach((c, i) => {
                if (!idOK(c.key)) add(`world.countries.${i}.key`, '나라 열쇠(key)는 영문·숫자·_ . -로 입력하세요.');
                else if (declared.has(c.key)) add(`world.countries.${i}.key`, `중복된 나라 열쇠: ${c.key}`);
                else declared.set(c.key, c);
                if (c.name != null && typeof c.name !== 'string') add(`world.countries.${i}.name`, '나라 이름은 문자열이어야 합니다.');
            });
        }
        const usesTerritory = refs.some(([k]) => k === 'owns_regions' || k === 'transfer_regions'), usesZones = refs.some(([k]) => k === 'in_economic_region' || k === 'assign_economic_region');
        const info = starts.map((s, i) => {
            const st = s.kind === 'save' && object(s.state) ? s.state : null, label = s.name || s.id || `${i + 1}번`;
            let keys = null, names = {};
            try { const shapes = st && st.worldMap && st.worldMap.preset && st.worldMap.preset.district && st.worldMap.preset.district.svgMap && st.worldMap.preset.district.svgMap.shapes; if (Array.isArray(shapes) && shapes.length) { keys = new Set(shapes.map(sh => sh && sh.key).filter(k => typeof k === 'string')); names = (st.worldMap.preset.district.names && st.worldMap.preset.district.names.house) || {}; } } catch (e) { keys = null; }
            const rows = st && st.history && st.history.ranking && Array.isArray(st.history.ranking.rows) ? st.history.ranking.rows.filter(object) : null;
            const eco = st && object(st.economicRegions) ? st.economicRegions : null;
            const p = `starts.${i}`, bindings = {};
            if (s.worldBindings != null) {
                if (!object(s.worldBindings)) add(p + '.worldBindings', '세계지도 연결은 { "나라 열쇠": "국가 id" } 형식입니다.');
                else {
                    const usedIds = new Map();
                    Object.entries(s.worldBindings).forEach(([key, id]) => {
                        const q = `${p}.worldBindings.${key}`;
                        if (!declared.has(key)) { add(q, `시나리오의 나라 목록에 없는 열쇠: ${key}`); return; }
                        if (typeof id !== 'string' || !id) { add(q, `“${declared.get(key).name || key}”에 연결할 국가를 선택하세요.`); return; }
                        if (rows && !rows.some(r => String(r.id) === id)) { add(q, `“${declared.get(key).name || key}”에 연결한 국가가 시작 세이브 “${label}”의 국가 순위에 없습니다.`); return; }
                        if (usedIds.has(id)) { add(q, `“${usedIds.get(id)}”와 같은 국가에 연결되어 있습니다. 나라마다 다른 국가를 연결하세요.`); return; }
                        usedIds.set(id, declared.get(key).name || key); bindings[key] = id;
                    });
                }
            }
            return { i, p, label, keys, names, owners: (st && st.worldMap && object(st.worldMap.owners) && st.worldMap.owners) || {}, rowIds: new Set((rows || []).map(r => String(r.id))), bindings,
                zones: new Set(eco && Array.isArray(eco.zones) ? eco.zones.filter(object).map(z => z.id) : []), zoneOf: (eco && object(eco.regions) && eco.regions) || {} };
        });
        if (usesTerritory || usesZones) info.forEach(s => { if (!s.keys) add(s.p, `이 시나리오는 ${usesTerritory ? '영토' : '경제권'} 조건·효과를 씁니다. “${s.label}”은(는) 세계지도가 든 세이브(세계 › 지도에서 .hemimap을 불러와 저장)여야 합니다.`); });
        const told = new Set(), once = (key, fn) => { if (!told.has(key)) { told.add(key); fn(); } };
        refs.forEach(([k, v, p]) => {
            const territory = k === 'owns_regions' || k === 'transfer_regions', ref = k === 'owns_regions' ? v.country : k === 'in_economic_region' ? v.zone : v.to, refPath = `${p}.${k === 'owns_regions' ? 'country' : k === 'in_economic_region' ? 'zone' : 'to'}`;
            if (territory && !ref.unassigned && !declared.has(ref.key)) { add(refPath + '.key', `시나리오의 나라 목록에 없는 나라: ${ref.key} — 시작 나라의 세계지도 연결에서 추가하세요.`); return; }
            info.forEach(s => {
                if (!s.keys) return;
                v.regions.forEach((key, j) => { if (!s.keys.has(key)) add(`${p}.regions.${j}`, `시작 나라 “${s.label}”의 지도에 없는 구역: ${key}`); });
                if (territory && !ref.unassigned && !s.bindings[ref.key]) once(`${s.i}|${ref.key}`, () => add(`${s.p}.worldBindings`, `“${declared.get(ref.key).name || ref.key}”(${ref.key})를 시작 나라 “${s.label}”의 국가에 연결하세요.`));
                if (!territory && !ref.unassigned && !s.zones.has(ref.id)) add(refPath + '.id', `시작 나라 “${s.label}”의 지도에 없는 경제권: ${ref.id}`);
                if (!v.regions.every(key => s.keys.has(key))) return;
                // 시작할 때 이미 그 나라 · 경제권 것이면 변화가 없을 수 있다 (다른 효과가 먼저 바꿀 수도 있어 경고)
                if (k === 'transfer_regions') { const to = ref.unassigned ? '' : s.bindings[ref.key]; if (to != null && v.regions.every(key => (s.rowIds.has(s.owners[key]) ? s.owners[key] : '') === to)) add(p, `시작 나라 “${s.label}”에서는 처음부터 ${ref.unassigned ? '미배정' : `“${declared.get(ref.key).name || ref.key}”의 영토`}입니다 — 변화가 없을 수 있습니다.`, 'warning'); }
                if (k === 'assign_economic_region' && (ref.unassigned || s.zones.has(ref.id))) { const to = ref.unassigned ? '' : ref.id; if (v.regions.every(key => (s.zones.has(s.zoneOf[key]) ? s.zoneOf[key] : '') === to)) add(p, `시작 나라 “${s.label}”에서는 처음부터 ${to ? `경제권 “${to}”` : '미배정'}입니다 — 변화가 없을 수 있습니다.`, 'warning'); }
            });
        });
    }
    // 검사 결과의 경로 → 사람이 읽는 위치 (예: “국경 협상 › 수락 › 영토 변경”)
    const PLACE = { trigger: '발생 조건', available: '조건', visible: '보이는 조건', immediate: '즉시 효과', onStart: '시작 효과', success: '성공 효과', fail: '실패 효과', condition: '조건', start: '시작 조건',
        owns_regions: '구역 소유', transfer_regions: '영토 변경', in_economic_region: '경제권 소속', assign_economic_region: '경제권 배정', worldBindings: '세계지도 연결', world: '세계지도 연결', check: '검사 시점',
        prereq: '필수 선행', any: '이 중 하나', exclusive: '배타', fire_event: '이벤트 실행', cost: '비용', produce: '생산', consume: '소비', upkeep: '유지비', requires: '필요 기술', give: '내줄 것', get: '받을 것', partner: '거래 상대', variables: '변수', time: '시간 설정', then: '맞으면', else: '아니면' };
    const SECTION = { starts: '시작 나라', focus: '방향성', events: '이벤트', decisions: '결정', crises: '격변', endings: '결말', articles: '기사', missions: '임무', outcomes: '결말', meters: '게이지', options: '선택지', countries: '나라',
        resources: '자원', facilities: '시설', tech: '기술', units: '부대', trades: '무역' };
    function describe(d, path) {
        const parts = String(path || '').split('.'), out = [];
        let cur = d;
        parts.forEach((k, n) => {
            const next = cur != null && typeof cur === 'object' ? cur[k] : undefined;
            if (Array.isArray(cur)) { if (object(next)) { const t = next.title || next.name || next.text || next.id || next.key; if (t) out.push(String(t)); } }
            else if (SECTION[k]) { const item = Array.isArray(next) ? next[parts[n + 1]] : null; if (!(object(item) && (item.title || item.name || item.text || item.id || item.key))) out.push(SECTION[k]); }
            else if (PLACE[k] && (!['any', 'start', 'check'].includes(k) || typeof next !== 'object' || parts[0] === 'focus' && n === 2 || k === 'start')) out.push(PLACE[k]);
            cur = next;
        });
        return out.join(' › ');
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
    // 나라 열쇠 바꾸기 — 나라 목록 · 시작 나라마다의 연결 · 조건/효과 속 참조를 함께 (이름과 이야기 글은 건드리지 않는다)
    function renameCountry(d, oldKey, newKey) {
        const list = d.world && Array.isArray(d.world.countries) ? d.world.countries : [];
        if (!idOK(newKey) || oldKey === newKey || !list.some(c => c.key === oldKey) || list.some(c => c.key === newKey)) return false;
        list.forEach(c => { if (c.key === oldKey) c.key = newKey; });
        (d.starts || []).forEach(s => { if (object(s.worldBindings) && Object.hasOwn(s.worldBindings, oldKey)) { s.worldBindings = Object.fromEntries(Object.entries(s.worldBindings).map(([k, v]) => [k === oldKey ? newKey : k, v])); } });
        const walk = (o, skip) => { if (!o || typeof o !== 'object') return; Object.entries(o).forEach(([k, v]) => {
            if (k === 'state' && skip) return; // 시작 세이브 속은 보지 않는다
            if ((k === 'owns_regions' && object(v) && object(v.country) && v.country.key === oldKey)) v.country.key = newKey;
            if ((k === 'transfer_regions' && object(v) && object(v.to) && v.to.key === oldKey)) v.to.key = newKey;
            walk(v, false); }); };
        Object.entries(d).forEach(([k, v]) => { if (k === 'starts') (v || []).forEach(s => walk(s, true)); else if (k !== 'world') walk(v, false); });
        return true;
    }
    // 시작 세이브의 세계지도에서 고를 수 있는 구역 · 국가 · 경제권 (가이드 입력용) — 지도가 든 첫 시작 나라 기준, 나머지 시작 나라와의 차이는 검사가 알려 준다
    function worldCatalog(d) {
        const out = { regions: [], zones: [], starts: [] };
        (Array.isArray(d.starts) ? d.starts : []).forEach((s, i) => {
            const st = s && s.kind === 'save' && object(s.state) ? s.state : null;
            const shapes = st && st.worldMap && st.worldMap.preset && st.worldMap.preset.district && st.worldMap.preset.district.svgMap && st.worldMap.preset.district.svgMap.shapes;
            const names = (st && st.worldMap && st.worldMap.preset && st.worldMap.preset.district && st.worldMap.preset.district.names && st.worldMap.preset.district.names.house) || {};
            const regions = Array.isArray(shapes) ? shapes.filter(sh => sh && typeof sh.key === 'string').map(sh => ({ key: sh.key, name: typeof names[sh.key] === 'string' && names[sh.key] ? names[sh.key] : sh.key })) : [];
            const rows = st && st.history && st.history.ranking && Array.isArray(st.history.ranking.rows) ? st.history.ranking.rows.filter(object).map(r => ({ id: String(r.id), name: r.self ? ((st.config && st.config.nationName) || r.name || '우리나라') : (r.name || '이름 없는 국가') })) : [];
            const zones = st && object(st.economicRegions) && Array.isArray(st.economicRegions.zones) ? st.economicRegions.zones.filter(z => object(z) && typeof z.id === 'string').map(z => ({ id: z.id, name: z.name || z.id })) : [];
            out.starts.push({ index: i, hasState: !!st, hasMap: regions.length > 0, regions, rows, zones });
            if (!out.regions.length && regions.length) { out.regions = regions; out.zones = zones; }
        });
        return out;
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
    const api = { validate, describe, layout, renameFocus, renameCountry, worldCatalog, starter, clone, idOK, LOCKS };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else root.HemiCampaignTools = api;
})(typeof window === 'undefined' ? globalThis : window);
