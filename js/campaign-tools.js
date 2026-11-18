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
        if (!object(d) || d.format !== 'hemicycle-campaign@1') return [{ path: 'format', message: i18n('maker.campaignTools.1'), level: 'error' }];
        if (!idOK(d.id)) add('id', i18n('maker.campaignTools.2'));
        for (const key of arrayKeys) if (d[key] != null && (!Array.isArray(d[key]) || d[key].some(x => !object(x)))) add(key, i18n('maker.campaignTools.3'));
        if (issues.length) return issues;
        if(d.time!=null){
            if(!object(d.time))add('time',i18n('maker.campaignTools.4'));
            else {
                if(!['turn','realtime'].includes(d.time.mode))add('time.mode',i18n('maker.campaignTools.5'));
                if(d.time.startDate!=null&&(typeof d.time.startDate!=='string'||d.time.startDate!==''&&Clock.dayFromDate(d.time.startDate)==null))add('time.startDate',i18n('maker.campaignTools.6'));
                if(d.time.startHour!=null&&(!Number.isInteger(d.time.startHour)||d.time.startHour<0||d.time.startHour>23))add('time.startHour',i18n('maker.campaignTools.7'));
                if(d.time.defaultSpeed!=null&&(!Number.isInteger(d.time.defaultSpeed)||!Object.hasOwn(Clock.SPEED_MS,d.time.defaultSpeed)))add('time.defaultSpeed',i18n('maker.campaignTools.8'));
            }
        }
        const list = k => d[k] || [];
        const idsOf = (items, p) => {
            const ids = new Set();
            items.forEach((x, i) => { if (!idOK(x.id)) add(`${p}.${i}.id`, i18n('maker.campaignTools.9')); else if (ids.has(x.id)) add(`${p}.${i}.id`, i18n('maker.campaignTools.10', { v: x.id })); ids.add(x.id); });
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
            if (!used.length) add(p, i18n('maker.campaignTools.11'));
            used.forEach(k => { if (!Number.isFinite(Number(v[k])) || v[k] === '' || v[k] == null || typeof v[k] === 'boolean') add(`${p}.${k}`, i18n('maker.campaignTools.12')); });
        };
        const need = (ok, p, message) => { if (!ok) add(p, message); return ok; };
        const flagName = (v, p, read) => {
            if (!need(text(v), p, i18n('maker.campaignTools.13'))) return;
            if (!v) { add(p, i18n('maker.campaignTools.14'), 'warning'); return; }
            if (read) flagsRead.push([v, p]); else flagsSet.add(v);
        };
        const amount = (v, p) => {
            const a = 'add' in v, b = 'set' in v;
            if (!a && !b) add(p, i18n('maker.campaignTools.15'));
            for (const k of ['add', 'set']) if (k in v && (!Number.isFinite(Number(v[k])) || v[k] === '' || v[k] == null)) add(`${p}.${k}`, i18n('maker.campaignTools.16'));
        };
        const worldRefs = []; // [연산자, 값, 경로] — 시작 나라별 지도 · 연결과 대조는 아래에서 한꺼번에
        // 국가 운영 (js/ops-rules.js) — 자원 · 시설 · 기술 · 부대 · 무역 ID
        const opsIds = Object.fromEntries(['resources', 'facilities', 'tech', 'units', 'trades'].map(k => [k, new Set(list(k).map(x => x.id))]));
        const OPS_LABEL = { resources: i18n('sim.campaignOps.23'), facilities: i18n('sim.campaignOps.26'), tech: i18n('sim.campaignOps.6'), units: i18n('sim.campaignOps.49'), trades: i18n('sim.campaignOps.61') };
        const opsRule = (k, v, p, table) => {
            const def = table[k];
            if (!def.check(v)) { add(p, i18n('maker.campaignTools.17', { v: k, OPS_HINT: OPS_HINT[k] || '' })); return; }
            if (def.kind) { const id = typeof v === 'string' ? v : v.id; if (!opsIds[def.kind].has(id)) add(p + (typeof v === 'string' ? '' : '.id'), i18n('maker.campaignTools.18', { kind: OPS_LABEL[def.kind], v: id })); }
            if (typeof v === 'object') CMP.filter(c => c in v).forEach(c => { if (!Number.isFinite(Number(v[c])) || v[c] === '' || v[c] == null) add(`${p}.${c}`, i18n('maker.campaignTools.12')); });
        };
        const OPS_HINT = { resource: i18n('maker.campaignTools.19'), facility_count: i18n('maker.campaignTools.20'), unit_count: i18n('maker.campaignTools.21'), military_strength: i18n('maker.campaignTools.22'), tech_done: i18n('maker.campaignTools.23'), trade_active: i18n('maker.campaignTools.24'),
            add_resource: i18n('maker.campaignTools.25'), set_resource: i18n('maker.campaignTools.25'), add_facility: i18n('maker.campaignTools.26'), add_units: i18n('maker.campaignTools.27'), grant_tech: i18n('maker.campaignTools.23'), start_trade: i18n('maker.campaignTools.24'), end_trade: i18n('maker.campaignTools.24') };
        const opsCost = (m, p, what) => {
            if (m == null) return;
            if (!object(m)) { add(p, i18n('maker.campaignTools.28', { what })); return; }
            Object.entries(m).forEach(([k, v]) => { if (!opsIds.resources.has(k)) add(`${p}.${k}`, i18n('maker.campaignTools.29', { v: k })); else if (!Number.isFinite(Number(v)) || typeof v === 'boolean' || v === '' || v == null) add(`${p}.${k}`, i18n('maker.campaignTools.16')); else if (Number(v) < 0) add(`${p}.${k}`, i18n('maker.campaignTools.30')); });
        };
        const worldRule = (k, v, p) => {
            const shape = k === 'owns_regions' ? World.ownsShape(v) : k === 'transfer_regions' ? World.transferShape(v) : k === 'in_economic_region' ? World.inZoneShape(v) : World.assignShape(v);
            if (shape) add(p, shape); else worldRefs.push([k, v, p]);
        };
        function condOne(k, v, p) {
            switch (k) {
                case 'all': case 'any': if (Array.isArray(v)) v.forEach((c, i) => cond(c, `${p}.${i}`)); else cond(v, p); return;
                case 'not': cond(v, p); return;
                case 'always': need(typeof v === 'boolean', p, i18n('maker.campaignTools.31')); return;
                case 'date_after': case 'date_before': need(dateOK(v), p, i18n('maker.campaignTools.32')); return;
                case 'flag': case 'has_flag': case 'not_flag': flagName(v, p, true); return;
                case 'var': if (need(object(v) && text(v.name) && v.name !== '', p, i18n('maker.campaignTools.33'))) { compare(v, p); varsRead.push([v.name, p]); } return;
                case 'chance': if (need(Number.isFinite(Number(v)) && v !== '' && v != null && typeof v !== 'boolean', p, i18n('maker.campaignTools.34')) && (Number(v) < 0 || Number(v) > 100)) add(p, i18n('maker.campaignTools.35'), 'warning'); return;
                case 'event_fired': if (need(text(v) && v !== '', p, i18n('maker.campaignTools.36')) && !eventIds.has(v)) add(p, i18n('maker.campaignTools.37', { v })); return;
                case 'decision_taken': if (need(text(v) && v !== '', p, i18n('maker.campaignTools.38')) && !decisionIds.has(v)) add(p, i18n('maker.campaignTools.39', { v })); return;
                case 'party_exists': case 'ruling': need(partyOK(v), p, i18n('maker.campaignTools.40')); return;
                case 'party_status': need(object(v) && partyOK(v.party) && ['active', 'banned', 'dissolved'].includes(v.is), p, i18n('maker.campaignTools.41')); return;
                case 'party_seats': case 'party_support': if (need(object(v) && partyOK(v.party), p, i18n('maker.campaignTools.42'))) compare(v, p); return;
                case 'ruling_seats': if (need(object(v), p, i18n('maker.campaignTools.43'))) compare(v, p); return;
                case 'economy': if (need(object(v) && ECON.includes(v.indicator), p, i18n('maker.campaignTools.44', { ECON: ECON.join(' · ') }))) compare(v, p); return;
                case 'approval': if (need(object(v) && (v.of == null || SEATS.includes(v.of)), p, i18n('maker.campaignTools.45', { SEATS: SEATS.join(' · ') }))) compare(v, p); return;
                case 'owns_regions': case 'in_economic_region': worldRule(k, v, p); return;
                case 'resource': case 'facility_count': case 'unit_count': case 'military_strength': case 'tech_done': case 'trade_active': opsRule(k, v, p, Ops.COND); return;
                default: add(p, i18n('maker.campaignTools.46', { v: k }), 'warning');
            }
        }
        function cond(v, p) {
            if (v == null || typeof v === 'boolean') return;
            if (Array.isArray(v)) { v.forEach((c, i) => cond(c, `${p}.${i}`)); return; }
            if (!object(v)) { add(p, i18n('maker.campaignTools.47')); return; }
            Object.entries(v).forEach(([k, x]) => condOne(k, x, `${p}.${k}`));
        }
        const fireEdges = []; // [효과가 든 곳의 경로, 부르는 이벤트 ID]
        function effectOne(k, v, p) {
            switch (k) {
                case 'set_flag': case 'clear_flag': flagName(v, p, false); return;
                case 'set_var': case 'add_var': if (need(object(v) && text(v.name) && v.name !== '', p, i18n('maker.campaignTools.48'))) { need(Number.isFinite(Number(v.value)) && v.value !== '' && v.value != null, `${p}.value`, i18n('maker.campaignTools.49')); varsRead.push([v.name, p]); } return;
                case 'support': if (need(object(v) && partyOK(v.party), p, i18n('maker.campaignTools.50'))) amount(v, p); return;
                case 'party_status': need(object(v) && partyOK(v.party) && ['active', 'banned', 'dissolved'].includes(v.to), p, i18n('maker.campaignTools.51')); return;
                case 'rename_party': need(object(v) && partyOK(v.party) && (text(v.name) || text(v.abbr)), p, i18n('maker.campaignTools.52')); return;
                case 'party_color': need(object(v) && partyOK(v.party) && /^#[0-9a-f]{6}$/i.test(v.color || ''), p, i18n('maker.campaignTools.53')); return;
                case 'economy': if (need(object(v) && ECON.includes(v.indicator), p, i18n('maker.campaignTools.44', { ECON: ECON.join(' · ') }))) amount(v, p); return;
                case 'nation_name': case 'toast': need(text(v), p, i18n('maker.campaignTools.54')); return;
                case 'message': need(text(v) || (object(v) && (text(v.title) || text(v.text))), p, i18n('maker.campaignTools.55')); return;
                case 'approval': if (need(object(v) && (v.of == null || SEATS.includes(v.of)), p, i18n('maker.campaignTools.45', { SEATS: SEATS.join(' · ') }))) amount(v, p); return;
                case 'article': need(object(v) && text(v.title), p, i18n('maker.campaignTools.56')); return;
                case 'fire_event': { const id = object(v) ? v.id : v; if (need(text(id) && id !== '', p, i18n('maker.campaignTools.57'))) { if (!eventIds.has(id)) add(p, i18n('maker.campaignTools.37', { v: id })); else fireEdges.push([p, id]); } return; }
                case 'if': if (need(object(v) && ('condition' in v || 'if' in v), p, i18n('maker.campaignTools.58'))) { cond(v.condition ?? v.if, p + ('condition' in v ? '.condition' : '.if')); effects(v.then, p + '.then'); effects(v.else, p + '.else'); } return;
                case 'random_list': if (need(Array.isArray(v) && v.every(object), p, i18n('maker.campaignTools.59'))) v.forEach((o, i) => { need(Number.isFinite(Number(o.weight)) && Number(o.weight) >= 0, `${p}.${i}.weight`, i18n('maker.campaignTools.60')); effects(o.effects, `${p}.${i}.effects`); }); return;
                case 'transfer_regions': case 'assign_economic_region': worldRule(k, v, p); return;
                case 'add_resource': case 'set_resource': case 'add_facility': case 'add_units': case 'grant_tech': case 'start_trade': case 'end_trade': opsRule(k, v, p, Ops.EFF); return;
                default: add(p, i18n('maker.campaignTools.61', { v: k }), 'warning');
            }
        }
        function effects(v, p) {
            if (v == null) return;
            if (!Array.isArray(v) || v.some(e => !object(e))) { add(p, i18n('maker.campaignTools.62')); return; }
            v.forEach((e, i) => Object.entries(e).forEach(([k, x]) => effectOne(k, x, `${p}.${i}.${k}`)));
        }
        const script = (items, p, isEvent) => {
            idsOf(items, p);
            items.forEach((e, i) => {
                const q = `${p}.${i}`;
                cond(e.trigger, q + '.trigger'); cond(e.available, q + '.available'); cond(e.visible, q + '.visible');
                if (!isEvent) { opsCost(e.cost, q + '.cost', i18n('maker.campaignTools.63')); if (e.cooldown_days != null && (!Number.isFinite(Number(e.cooldown_days)) || Number(e.cooldown_days) < 0)) add(q + '.cooldown_days', i18n('maker.campaignTools.64')); if (e.once != null && typeof e.once !== 'boolean') add(q + '.once', i18n('maker.campaignTools.65')); }
                effects(e.effects, q + '.effects'); effects(e.immediate, q + '.immediate');
                if(isEvent){
                    if(e.check!=null&&!['date','election','world','any'].includes(e.check))add(q+'.check',i18n('maker.campaignTools.66'));
                    if(e.once===false&&!e.trigger_only&&e.chance==null&&(e.trigger==null||object(e.trigger)&&!Object.keys(e.trigger).length))add(q,i18n('maker.campaignTools.67'));
                    if(e.presentation!=null&&!['narrative','standard'].includes(e.presentation))add(q+'.presentation',i18n('maker.campaignTools.68'));
                    for(const k of ['title','desc','image'])if(e[k]!=null&&typeof e[k]!=='string')add(q+'.'+k,i18n('maker.campaignTools.54'));
                }
                if (isEvent && e.options != null) {
                    if (!Array.isArray(e.options) || e.options.some(o => !object(o))) add(q + '.options', i18n('maker.campaignTools.69'));
                    else e.options.forEach((o, j) => { effects(o.effects, `${q}.options.${j}.effects`); cond(o.trigger, `${q}.options.${j}.trigger`); });
                }
            });
        };
        const focus = list('focus'), ids = idsOf(focus, 'focus');
        idsOf(list('starts'), 'starts'); idsOf(list('crises'), 'crises'); idsOf(list('endings'), 'endings');
        if (!list('starts').length) add('starts', i18n('maker.campaignTools.70'));
        list('starts').forEach((s, i) => { if (s.kind === 'save' && (!object(s.state) || !Array.isArray((s.state.parliament || s.state.data || {}).parties))) add(`starts.${i}`, i18n('maker.campaignTools.71')); else if (s.kind !== 'save' && !s.preset) add(`starts.${i}.preset`, i18n('maker.campaignTools.72')); });
        const articleIds=idsOf(list('articles'),'articles');
        const cells = new Set();
        focus.forEach((f, i) => {
            const p = `focus.${i}`;
            for (const k of ['prereq', 'any', 'exclusive']) {
                if (f[k] != null && (!Array.isArray(f[k]) || f[k].some(id => typeof id !== 'string'))) { add(`${p}.${k}`, i18n('maker.campaignTools.73')); continue; }
                (f[k] || []).forEach(id => { if (!ids.has(id)) add(`${p}.${k}`, i18n('maker.campaignTools.74', { v: id })); if (id === f.id) add(`${p}.${k}`, i18n('maker.campaignTools.75')); });
            }
            for (const k of ['x', 'y']) if (f[k] != null && (!Number.isFinite(f[k]) || f[k] < 0 || f[k] > 200)) add(`${p}.${k}`, i18n('maker.campaignTools.76'));
            if (f.days != null && (!Number.isFinite(f.days) || f.days < 0)) add(p + '.days', i18n('maker.campaignTools.77'));
            if (f.title != null && typeof f.title !== 'string') add(p + '.title', i18n('maker.campaignTools.78'));
            const cell = `${f.x || 0},${f.y || 0}`;
            if (cells.has(cell)) add(p, i18n('maker.campaignTools.79'), 'warning');
            if(f.art!=null && (!object(f.art)||['scale','x','y'].some(k=>f.art[k]!=null&&!Number.isFinite(f.art[k]))))add(p+'.art',i18n('maker.campaignTools.80'));
            if(f.article&&!articleIds.has(f.article))add(p+'.article',(i18n('maker.campaignTools.81') + " ")+f.article);
            cells.add(cell); cond(f.available, p + '.available'); effects(f.effects, p + '.effects');
        });
        if (!issues.some(x => x.level === 'error' && x.path.startsWith('focus'))) {
            // Fixed-point reachability allows OR chains with a valid alternate entrance.
            const reached = new Set(); let changed = true;
            while (changed) { changed = false; focus.forEach(f => { if (!reached.has(f.id) && (f.prereq || []).every(id => reached.has(id)) && (!(f.any || []).length || f.any.some(id => reached.has(id)))) { reached.add(f.id); changed = true; } }); }
            focus.forEach((f, i) => { if (!reached.has(f.id)) add(`focus.${i}`, i18n('maker.campaignTools.82', { f: f.title || f.id })); });
            // A focus cannot require both sides of a mutually exclusive branch.
            focus.forEach((f, i) => {
                const ancestors = new Set(); const visit = id => { if (ancestors.has(id)) return; ancestors.add(id); const a = focus.find(x => x.id === id); (a?.prereq || []).forEach(visit); };
                (f.prereq || []).forEach(visit);
                if ([...ancestors].some(id => { const a = focus.find(x => x.id === id); return (a?.exclusive || []).some(x => ancestors.has(x) || x === f.id) || (f.exclusive || []).includes(id); })) add(`focus.${i}.prereq`, i18n('maker.campaignTools.83'));
            });
        }
        list('crises').forEach((c, i) => {
            const p = `crises.${i}`;
            cond(c.trigger, p + '.trigger'); effects(c.onStart, p + '.onStart');
            for (const k of ['meters', 'missions', 'outcomes', 'events', 'decisions']) if (c[k] != null && (!Array.isArray(c[k]) || c[k].some(x => !object(x)))) add(`${p}.${k}`, i18n('maker.campaignTools.84'));
            if (issues.some(x => x.level === 'error' && x.path.startsWith(p))) return;
            for (const k of ['meters', 'missions', 'outcomes']) idsOf(c[k] || [], `${p}.${k}`);
            (c.missions || []).forEach((m, j) => { cond(m.condition, `${p}.missions.${j}.condition`); effects(m.success, `${p}.missions.${j}.success`); effects(m.fail, `${p}.missions.${j}.fail`); });
            (c.outcomes || []).forEach((o, j) => { cond(o.condition, `${p}.outcomes.${j}.condition`); effects(o.effects, `${p}.outcomes.${j}.effects`); if (!o.condition || !Object.keys(o.condition).length) add(`${p}.outcomes.${j}`, i18n('maker.campaignTools.85'), 'warning'); });
            script(c.events || [], p + '.events', true); script(c.decisions || [], p + '.decisions', false);
        });
        list('endings').forEach((e, i) => { cond(e.condition, `endings.${i}.condition`); if (!e.condition || !Object.keys(e.condition).length) add(`endings.${i}`, i18n('maker.campaignTools.86'), 'warning'); });
        script(list('events'), 'events', true); script(list('decisions'), 'decisions', false);
        list('articles').forEach((a,i)=>{
            const p='articles.'+i;
            if(!['start','focus','date','condition','manual'].includes(a.when))add(p+'.when',i18n('maker.campaignTools.87'));
            for(const k of ['title','body','subtitle','source','image'])if(a[k]!=null&&typeof a[k]!=='string')add(p+'.'+k,i18n('maker.campaignTools.54'));
            if(a.when==='focus'&&!ids.has(a.focus))add(p+'.focus',i18n('maker.campaignTools.88'));
            if(a.when==='date'&&!/^(-?\d{1,5})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(a.date||''))add(p+'.date',i18n('maker.campaignTools.89'));
            cond(a.trigger,p+'.trigger');
            if(a.when==='condition'&&(a.trigger==null||object(a.trigger)&&!Object.keys(a.trigger).length))add(p+'.trigger',i18n('maker.campaignTools.90'));
            for(const k of ['effects','options','meters','missions','outcomes'])if(a[k]!=null)add(p+'.'+k,i18n('maker.campaignTools.91'));
            if(!a.body)add(p+'.body',i18n('maker.campaignTools.92'),'warning');
        });
        if (d.variables != null && (!object(d.variables) || Object.values(d.variables).some(x => !Number.isFinite(x)))) add('variables', i18n('maker.campaignTools.93'));
        if (d.focusStyle != null && !object(d.focusStyle)) add('focusStyle', i18n('maker.campaignTools.94'));
        const events = new Set([...list('events'), ...list('crises').flatMap(c => Array.isArray(c.events) ? c.events : [])].map(e => e.id));
        focus.forEach((f, i) => { if (f.event && !events.has(f.event)) add(`focus.${i}.event`, i18n('maker.campaignTools.95', { event: f.event })); });
        crisesOK.forEach((c, i) => { const p = `crises.${i}`; if (c.intro && !events.has(c.intro)) add(p + '.intro', i18n('maker.campaignTools.96', { intro: c.intro })); subs(c, 'outcomes').forEach((o, j) => { if (o.event && !events.has(o.event)) add(`${p}.outcomes.${j}.event`, i18n('maker.campaignTools.95', { event: o.event })); }); subs(c, 'missions').forEach((m, j) => cond(m.start, `${p}.missions.${j}.start`)); });
        // 게임에서는 최상위와 격변 안의 이벤트 · 결정이 한 이름 공간을 쓴다 — 같은 ID면 한쪽이 가려진다
        const clash = (key, label) => {
            const seen = new Map(list(key).map((e, i) => [String(e.id), `${key}.${i}`]));
            list('crises').forEach((c, i) => { if (object(c)) subs(c, key).forEach((e, j) => { const p = `crises.${i}.${key}.${j}.id`, id = String(e.id); if (seen.has(id)) add(p, i18n('maker.campaignTools.97', { label, v: id, get: seen.get(id) })); else seen.set(id, `crises.${i}.${key}.${j}`); }); });
        };
        clash('events', i18n('sim.scriptmods.5')); clash('decisions', i18n('sim.help.63'));
        // 창 없이 바로 실행되는 숨은 이벤트끼리 서로 부르면 끝나지 않는다
        {
            const all = [...list('events').map((e, i) => [e, `events.${i}`]), ...list('crises').flatMap((c, i) => (object(c) ? subs(c, 'events').map((e, j) => [e, `crises.${i}.events.${j}`]) : []))];
            const byId = new Map(all.map(([e, p]) => [String(e.id), { e, p }]));
            const calls = id => { const it = byId.get(id); return it ? fireEdges.filter(([p]) => p.startsWith(it.p + '.')).map(([, to]) => to) : []; };
            const state = new Map(); // 1 = 보는 중, 2 = 끝
            const visit = (id, trail) => {
                if (state.get(id) === 2) return; if (state.get(id) === 1) { const loop = trail.slice(trail.indexOf(id)).concat(id); const hidden = loop.every(x => byId.get(x)?.e.hidden); add(byId.get(id).p, i18n('maker.campaignTools.98', { loop: loop.join(' → ') }) + (hidden ? (" " + i18n('maker.campaignTools.99')) : (" " + i18n('maker.campaignTools.100'))), hidden ? 'error' : 'check'); return; }
                state.set(id, 1); calls(id).forEach(to => visit(to, [...trail, id])); state.set(id, 2);
            };
            byId.forEach((_, id) => visit(id, []));
        }
        // 플래그 · 변수 — 켜는 곳이 없는 플래그, 선언하지 않은 변수는 단정할 수 없어 "확인 필요"
        flagsRead.forEach(([name, p]) => { if (!flagsSet.has(name) && !autoFlags.has(name)) add(p, name.startsWith('focus_') ? i18n('maker.campaignTools.101', { name }) : i18n('maker.campaignTools.102', { name }), name.startsWith('focus_') ? 'warning' : 'check'); });
        { const told = new Set(); varsRead.forEach(([name, p]) => { if (!varNames.has(name) && !told.has(name)) { told.add(name); add(p, i18n('maker.campaignTools.103', { name }), 'check'); } }); }
        opsChecks();
        function opsChecks() {
            ['resources', 'facilities', 'tech', 'units', 'trades'].forEach(k => idsOf(list(k), k));
            const nonNeg = (v, p, what) => { if (v != null && (!Number.isFinite(Number(v)) || typeof v === 'boolean' || Number(v) < 0)) add(p, i18n('maker.campaignTools.104', { what })); };
            const intNonNeg = (v, p, what) => { if (v != null && (!Number.isInteger(Number(v)) || Number(v) < 0)) add(p, i18n('maker.campaignTools.105', { what })); };
            const techRefs = (arr, p) => { if (arr == null) return; if (!Array.isArray(arr) || arr.some(x => typeof x !== 'string')) { add(p, i18n('maker.campaignTools.106')); return; } arr.forEach((id, j) => { if (!opsIds.tech.has(id)) add(`${p}.${j}`, i18n('maker.campaignTools.107', { v: id })); }); };
            list('resources').forEach((r, i) => { const p = 'resources.' + i; nonNeg(r.start, p + '.start', i18n('maker.campaignTools.108')); nonNeg(r.max, p + '.max', i18n('maker.campaignTools.109')); if (r.max != null && r.start != null && Number(r.start) > Number(r.max)) add(p + '.start', i18n('maker.campaignTools.110'), 'warning'); });
            list('facilities').forEach((f, i) => { const p = 'facilities.' + i; ['cost', 'produce', 'consume', 'upkeep'].forEach(k => opsCost(f[k], `${p}.${k}`, { cost: i18n('maker.campaignTools.111'), produce: i18n('maker.campaignTools.112'), consume: i18n('maker.campaignTools.113'), upkeep: i18n('maker.campaignTools.114') }[k])); nonNeg(f.days, p + '.days', i18n('maker.campaignTools.115')); intNonNeg(f.start, p + '.start', i18n('maker.campaignTools.116')); intNonNeg(f.max, p + '.max', i18n('maker.campaignTools.117')); techRefs(f.requires, p + '.requires'); cond(f.available, p + '.available'); if (!Ops.amounts(f.produce).length && !Ops.amounts(f.upkeep).length && !Ops.amounts(f.consume).length) add(p, i18n('maker.campaignTools.118', { f: f.name || f.id }), 'warning');
                if (f.buildable != null && typeof f.buildable !== 'boolean') add(p + '.buildable', i18n('maker.campaignTools.119'));
                if (f.buildable !== false && !Ops.amounts(f.cost).length && !(Number(f.days) > 0) && f.max == null) add(p, i18n('maker.campaignTools.120', { f: f.name || f.id }), 'warning'); });
            list('units').forEach((u, i) => { const p = 'units.' + i; ['cost', 'upkeep'].forEach(k => opsCost(u[k], `${p}.${k}`, k === 'cost' ? i18n('maker.campaignTools.121') : i18n('maker.campaignTools.114'))); nonNeg(u.days, p + '.days', i18n('maker.campaignTools.122')); nonNeg(u.strength, p + '.strength', i18n('sim.campaignOps.47')); intNonNeg(u.start, p + '.start', i18n('maker.campaignTools.116')); intNonNeg(u.max, p + '.max', i18n('maker.campaignTools.117')); techRefs(u.requires, p + '.requires'); cond(u.available, p + '.available'); if (u.recruitable != null && typeof u.recruitable !== 'boolean') add(p + '.recruitable', i18n('maker.campaignTools.123')); });
            const tech = list('tech');
            tech.forEach((t, i) => { const p = 'tech.' + i; opsCost(t.cost, p + '.cost', i18n('maker.campaignTools.124')); nonNeg(t.days, p + '.days', i18n('maker.campaignTools.125')); ['prereq', 'any', 'exclusive'].forEach(k => { techRefs(t[k], `${p}.${k}`); (Array.isArray(t[k]) ? t[k] : []).forEach(id => { if (id === t.id) add(`${p}.${k}`, i18n('maker.campaignTools.75')); }); }); effects(t.effects, p + '.effects'); cond(t.available, p + '.available'); for (const k of ['x', 'y']) if (t[k] != null && (!Number.isFinite(t[k]) || t[k] < 0 || t[k] > 200)) add(`${p}.${k}`, i18n('maker.campaignTools.76')); });
            if (!issues.some(x => x.level === 'error' && x.path.startsWith('tech'))) {
                const done = new Set(tech.filter(t => t.start === true).map(t => t.id)); let changed = true;
                while (changed) { changed = false; tech.forEach(t => { if (!done.has(t.id) && (t.prereq || []).every(id => done.has(id)) && (!(t.any || []).length || t.any.some(id => done.has(id)))) { done.add(t.id); changed = true; } }); }
                tech.forEach((t, i) => { if (!done.has(t.id)) add('tech.' + i, i18n('maker.campaignTools.126', { title: t.title || t.id })); });
            }
            const countries = new Set(d.world && Array.isArray(d.world.countries) ? d.world.countries.filter(object).map(c => c.key) : []);
            list('trades').forEach((t, i) => { const p = 'trades.' + i; opsCost(t.give, p + '.give', i18n('maker.campaignTools.127')); opsCost(t.get, p + '.get', i18n('maker.campaignTools.128')); nonNeg(t.days, p + '.days', i18n('maker.campaignTools.129')); cond(t.available, p + '.available'); cond(t.visible, p + '.visible');
                if (t.partner == null || t.partner === '') add(p + '.partner', i18n('maker.campaignTools.130')); else if (!countries.has(t.partner)) add(p + '.partner', i18n('maker.campaignTools.131', { partner: t.partner }));
                if (!Ops.amounts(t.give).length && !Ops.amounts(t.get).length) add(p, i18n('maker.campaignTools.132'), 'warning'); });
            for (const k of ['buildSlots', 'recruitSlots']) if (d[k] != null && (!Number.isInteger(d[k]) || d[k] < 1)) add(k, i18n('maker.campaignTools.133'));
            // 운영 조건 · 효과를 쓰는데 그 목록이 비어 있으면 — 위의 “없는 …” 오류가 이미 알려 준다
        }
        worldChecks(d, add, worldRefs);
        // 플레이 규칙 — 지금 게임이 적용하는 잠금만 조용히 통과시킨다 (모르는 항목을 잠긴 것처럼 믿게 두지 않는다)
        if (d.playRules != null) {
            if (!object(d.playRules)) add('playRules', i18n('maker.campaignTools.134'));
            else if (d.playRules.locks != null) {
                if (!object(d.playRules.locks)) add('playRules.locks', i18n('maker.campaignTools.135'));
                else Object.entries(d.playRules.locks).forEach(([k, v]) => {
                    if (typeof v !== 'boolean') add(`playRules.locks.${k}`, i18n('maker.campaignTools.136'));
                    else if (!LOCKS.includes(k)) add(`playRules.locks.${k}`, i18n('maker.campaignTools.137', { v: k, LOCKS: LOCKS.join(' · ') }), 'warning');
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
            if (!object(d.world)) add('world', i18n('maker.campaignTools.138'));
            else if (d.world.countries != null && (!Array.isArray(d.world.countries) || d.world.countries.some(c => !object(c)))) add('world.countries', i18n('maker.campaignTools.139'));
            else (d.world.countries || []).forEach((c, i) => {
                if (!idOK(c.key)) add(`world.countries.${i}.key`, i18n('maker.campaignTools.140'));
                else if (declared.has(c.key)) add(`world.countries.${i}.key`, i18n('maker.campaignTools.141', { key: c.key }));
                else declared.set(c.key, c);
                if (c.name != null && typeof c.name !== 'string') add(`world.countries.${i}.name`, i18n('maker.campaignTools.142'));
            });
        }
        const usesTerritory = refs.some(([k]) => k === 'owns_regions' || k === 'transfer_regions'), usesZones = refs.some(([k]) => k === 'in_economic_region' || k === 'assign_economic_region');
        const info = starts.map((s, i) => {
            const st = s.kind === 'save' && object(s.state) ? s.state : null, label = s.name || s.id || i18n('maker.campaignTools.143', { v: i + 1 });
            let keys = null, names = {};
            try { const shapes = st && st.worldMap && st.worldMap.preset && st.worldMap.preset.district && st.worldMap.preset.district.svgMap && st.worldMap.preset.district.svgMap.shapes; if (Array.isArray(shapes) && shapes.length) { keys = new Set(shapes.map(sh => sh && sh.key).filter(k => typeof k === 'string')); names = (st.worldMap.preset.district.names && st.worldMap.preset.district.names.house) || {}; } } catch (e) { keys = null; }
            const rows = st && st.history && st.history.ranking && Array.isArray(st.history.ranking.rows) ? st.history.ranking.rows.filter(object) : null;
            const eco = st && object(st.economicRegions) ? st.economicRegions : null;
            const p = `starts.${i}`, bindings = {};
            if (s.worldBindings != null) {
                if (!object(s.worldBindings)) add(p + '.worldBindings', i18n('maker.campaignTools.144'));
                else {
                    const usedIds = new Map();
                    Object.entries(s.worldBindings).forEach(([key, id]) => {
                        const q = `${p}.worldBindings.${key}`;
                        if (!declared.has(key)) { add(q, i18n('maker.campaignTools.145', { key })); return; }
                        if (typeof id !== 'string' || !id) { add(q, i18n('maker.campaignTools.146', { key: declared.get(key).name || key })); return; }
                        if (rows && !rows.some(r => String(r.id) === id)) { add(q, i18n('maker.campaignTools.147', { key: declared.get(key).name || key, label })); return; }
                        if (usedIds.has(id)) { add(q, i18n('maker.campaignTools.148', { get: usedIds.get(id) })); return; }
                        usedIds.set(id, declared.get(key).name || key); bindings[key] = id;
                    });
                }
            }
            return { i, p, label, keys, names, owners: (st && st.worldMap && object(st.worldMap.owners) && st.worldMap.owners) || {}, rowIds: new Set((rows || []).map(r => String(r.id))), bindings,
                zones: new Set(eco && Array.isArray(eco.zones) ? eco.zones.filter(object).map(z => z.id) : []), zoneOf: (eco && object(eco.regions) && eco.regions) || {} };
        });
        if (usesTerritory || usesZones) info.forEach(s => { if (!s.keys) add(s.p, i18n('maker.campaignTools.150', { usesTerritory: usesTerritory ? i18n('maker.campaignTools.149') : i18n('sim.sidenav.2'), label: s.label })); });
        const told = new Set(), once = (key, fn) => { if (!told.has(key)) { told.add(key); fn(); } };
        refs.forEach(([k, v, p]) => {
            const territory = k === 'owns_regions' || k === 'transfer_regions', ref = k === 'owns_regions' ? v.country : k === 'in_economic_region' ? v.zone : v.to, refPath = `${p}.${k === 'owns_regions' ? 'country' : k === 'in_economic_region' ? 'zone' : 'to'}`;
            if (territory && !ref.unassigned && !declared.has(ref.key)) { add(refPath + '.key', i18n('maker.campaignTools.151', { key: ref.key })); return; }
            info.forEach(s => {
                if (!s.keys) return;
                v.regions.forEach((key, j) => { if (!s.keys.has(key)) add(`${p}.regions.${j}`, i18n('maker.campaignTools.152', { label: s.label, key })); });
                if (territory && !ref.unassigned && !s.bindings[ref.key]) once(`${s.i}|${ref.key}`, () => add(`${s.p}.worldBindings`, i18n('maker.campaignTools.153', { key: declared.get(ref.key).name || ref.key, key2: ref.key, label: s.label })));
                if (!territory && !ref.unassigned && !s.zones.has(ref.id)) add(refPath + '.id', i18n('maker.campaignTools.154', { label: s.label, ref: ref.id }));
                if (!v.regions.every(key => s.keys.has(key))) return;
                // 시작할 때 이미 그 나라 · 경제권 것이면 변화가 없을 수 있다 (다른 효과가 먼저 바꿀 수도 있어 경고)
                if (k === 'transfer_regions') { const to = ref.unassigned ? '' : s.bindings[ref.key]; if (to != null && v.regions.every(key => (s.rowIds.has(s.owners[key]) ? s.owners[key] : '') === to)) add(p, i18n('maker.campaignTools.156', { label: s.label, key: ref.unassigned ? i18n('sim.worldMap.43') : i18n('maker.campaignTools.155', { key: declared.get(ref.key).name || ref.key }) }), 'warning'); }
                if (k === 'assign_economic_region' && (ref.unassigned || s.zones.has(ref.id))) { const to = ref.unassigned ? '' : ref.id; if (v.regions.every(key => (s.zones.has(s.zoneOf[key]) ? s.zoneOf[key] : '') === to)) add(p, i18n('maker.campaignTools.158', { label: s.label, to: to ? i18n('maker.campaignTools.157', { to }) : i18n('sim.worldMap.43') }), 'warning'); }
            });
        });
    }
    // 검사 결과의 경로 → 사람이 읽는 위치 (예: “국경 협상 › 수락 › 영토 변경”)
    const PLACE = { trigger: i18n('maker.campaignTools.159'), available: i18n('maker.campaignTools.160'), visible: i18n('maker.campaignTools.161'), immediate: i18n('maker.campaignTools.162'), onStart: i18n('maker.campaignTools.163'), success: i18n('maker.campaignTools.164'), fail: i18n('maker.campaignTools.165'), condition: i18n('maker.campaignTools.160'), start: i18n('maker.campaignTools.166'),
        owns_regions: i18n('maker.campaignTools.167'), transfer_regions: i18n('maker.campaignTools.168'), in_economic_region: i18n('maker.campaignTools.169'), assign_economic_region: i18n('maker.campaignTools.170'), worldBindings: i18n('maker.campaignTools.171'), world: i18n('maker.campaignTools.171'), check: i18n('maker.campaignTools.172'),
        prereq: i18n('maker.campaignTools.173'), any: i18n('maker.campaignTools.174'), exclusive: i18n('maker.campaignTools.175'), fire_event: i18n('maker.campaignTools.176'), cost: i18n('maker.campaignTools.177'), produce: i18n('maker.campaignTools.112'), consume: i18n('maker.campaignTools.113'), upkeep: i18n('maker.campaignTools.114'), requires: i18n('maker.campaignTools.178'), give: i18n('maker.campaignTools.127'), get: i18n('maker.campaignTools.128'), partner: i18n('maker.campaignTools.179'), variables: i18n('maker.campaignTools.180'), time: i18n('maker.campaignTools.181'), then: i18n('maker.campaignTools.182'), else: i18n('maker.campaignTools.183') };
    const SECTION = { starts: i18n('maker.campaignTools.184'), focus: i18n('sim.campaign.48'), events: i18n('sim.scriptmods.5'), decisions: i18n('sim.help.63'), crises: i18n('sim.campaign.49'), endings: i18n('maker.campaignTools.185'), articles: i18n('sim.news.10'), missions: i18n('sim.campaign.51'), outcomes: i18n('maker.campaignTools.185'), meters: i18n('maker.campaignTools.186'), options: i18n('maker.campaignTools.187'), countries: i18n('maker.campaignTools.188'),
        resources: i18n('sim.campaignOps.23'), facilities: i18n('sim.campaignOps.26'), tech: i18n('sim.campaignOps.6'), units: i18n('sim.campaignOps.49'), trades: i18n('sim.campaignOps.8') };
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
            const rows = st && st.history && st.history.ranking && Array.isArray(st.history.ranking.rows) ? st.history.ranking.rows.filter(object).map(r => ({ id: String(r.id), name: r.self ? ((st.config && st.config.nationName) || r.name || i18n('sim.history.173')) : (r.name || i18n('sim.worldMap.1')) })) : [];
            const zones = st && object(st.economicRegions) && Array.isArray(st.economicRegions.zones) ? st.economicRegions.zones.filter(z => object(z) && typeof z.id === 'string').map(z => ({ id: z.id, name: z.name || z.id })) : [];
            out.starts.push({ index: i, hasState: !!st, hasMap: regions.length > 0, regions, rows, zones });
            if (!out.regions.length && regions.length) { out.regions = regions; out.zones = zones; }
        });
        return out;
    }
    function starter(id) {
        const f = (id, title, icon, x, y, prereq = [], extra = {}) => ({ id, title, icon, x, y, days: 35, desc: '', prereq, any: [], exclusive: [], effects: [], ...extra });
        return {
            format: 'hemicycle-campaign@1', id, title: i18n('maker.campaignTools.189'), author: '', version: '1.0', description: i18n('maker.campaignTools.190'),
            lore: i18n('maker.campaignTools.191'),
            starts: [{ id: 's1', name: i18n('maker.campaignTools.192'), kind: 'preset', preset: 'builtin:tutorial', desc: i18n('maker.campaignTools.193') }],
            time:{mode:'turn',startDate:'',startHour:0,defaultSpeed:1},
            variables: { tension: 35 },
            focus: [f('opening', i18n('maker.campaignTools.194'), '🏛', 2, 0, [], { desc: i18n('maker.campaignTools.195'), days: 7 }),
                f('dialogue', i18n('maker.campaignTools.196'), '🕊', 0, 1, ['opening'], { exclusive: ['order'], effects: [{ add_var: { name: 'tension', value: -15 } }] }),
                f('order', i18n('maker.campaignTools.197'), '🛡', 4, 1, ['opening'], { exclusive: ['dialogue'], effects: [{ add_var: { name: 'tension', value: 15 } }] }),
                f('reform', i18n('maker.campaignTools.198'), '📜', 0, 2, ['dialogue'], { effects: [{ add_var: { name: 'tension', value: -10 } }] }),
                f('authority', i18n('maker.campaignTools.199'), '⚖', 4, 2, ['order'], { effects: [{ add_var: { name: 'tension', value: -10 } }] }),
                f('future', i18n('maker.campaignTools.200'), '🌅', 2, 3, [], { any: ['reform', 'authority'], event: 'new_dawn' })],
            articles: [{id:'republic_news',title:i18n('maker.campaignTools.201'),subtitle:i18n('maker.campaignTools.202'),source:i18n('maker.campaignTools.203'),body:i18n('maker.campaignTools.204'),when:'focus',focus:'opening'}],
            events: [{ id: 'new_dawn', title: i18n('maker.campaignTools.205'), desc: i18n('maker.campaignTools.206'), trigger_only: true, super: true, quote: i18n('maker.campaignTools.207'), quote_author: i18n('maker.campaignTools.208'), options: [{ text: i18n('maker.campaignTools.209'), effects: [] }] }], decisions: [],
            crises: [{ id: 'unrest', title: i18n('maker.campaignTools.210'), color: '#d96f56', desc: i18n('maker.campaignTools.211'), trigger: { flag: 'focus_opening' }, onStart: [],
                meters: [{ id: 'tension', name: i18n('maker.campaignTools.212'), start: 35, min: 0, max: 100, perMonth: 3 }],
                missions: [{ id: 'talks', title: i18n('maker.campaignTools.213'), days: 120, condition: { var: { name: 'tension', lte: 30 } }, success: [{ add_var: { name: 'tension', value: -5 } }], fail: [{ add_var: { name: 'tension', value: 10 } }] }],
                outcomes: [{ id: 'calm', title: i18n('maker.campaignTools.214'), text: i18n('maker.campaignTools.215'), condition: { var: { name: 'tension', lte: 10 } }, effects: [] }, { id: 'resolved', title: i18n('maker.campaignTools.216'), text: i18n('maker.campaignTools.217'), condition: { flag: 'focus_future' }, effects: [] }], events: [], decisions: [] }],
            endings: [{ id: 'dawn', title: i18n('maker.campaignTools.218'), text: i18n('maker.campaignTools.219'), condition: { flag: 'focus_future' } }]
        };
    }
    const api = { validate, describe, layout, renameFocus, renameCountry, worldCatalog, starter, clone, idOK, LOCKS };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else root.HemiCampaignTools = api;
})(typeof window === 'undefined' ? globalThis : window);
