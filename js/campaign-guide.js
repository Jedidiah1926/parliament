// Form authoring for the existing script JSON, with lossless fallback for custom logic.
(function () {
    'use strict';
    const esc = x => String(x ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const select = (key, opts, value) => `<select class="scn-in" data-gf="${key}" aria-label="${key}">${opts.map(([v, t]) => `<option value="${esc(v)}" ${String(value) === v ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select>`;
    const input = (key, value, label, type = 'text') => `<label class="cpg-field"><span>${label}</span><input class="scn-in" data-gf="${key}" type="${type}" value="${esc(value)}"></label>`;
    const CONDITIONS = [['flag',i18n('maker.campaignGuide.1')],['not_flag',i18n('maker.campaignGuide.2')],['date_after',i18n('maker.campaignGuide.3')],['date_before',i18n('maker.campaignGuide.4')],['var',i18n('maker.campaignGuide.5')],['approval',i18n('maker.campaignGuide.6')],['ruling_seats',i18n('maker.campaignGuide.7')],['owns_regions',i18n('maker.campaignGuide.8')],['in_economic_region',i18n('maker.campaignGuide.9')]];
    const EFFECTS = [['add_var',i18n('maker.campaignGuide.10')],['set_var',i18n('maker.campaignGuide.11')],['approval',i18n('maker.campaignGuide.12')],['support',i18n('maker.campaignGuide.13')],['set_flag',i18n('maker.campaignGuide.14')],['clear_flag',i18n('maker.campaignGuide.15')],['fire_event',i18n('maker.campaignGuide.16')],['toast',i18n('maker.campaignGuide.17')],['transfer_regions',i18n('maker.campaignGuide.18')],['assign_economic_region',i18n('maker.campaignGuide.19')]];
    // 국가 운영 (js/ops-rules.js) — 어느 목록을 가리키는지, 값의 모양
    const OPS_C = [['resource',i18n('maker.campaignGuide.20')],['facility_count',i18n('maker.campaignGuide.21')],['unit_count',i18n('maker.campaignGuide.22')],['military_strength',i18n('maker.campaignGuide.23')],['tech_done',i18n('maker.campaignGuide.24')],['trade_active',i18n('maker.campaignGuide.25')]];
    const OPS_E = [['add_resource',i18n('maker.campaignGuide.26')],['set_resource',i18n('maker.campaignGuide.27')],['add_facility',i18n('maker.campaignGuide.28')],['add_units',i18n('maker.campaignGuide.29')],['grant_tech',i18n('maker.campaignGuide.30')],['start_trade',i18n('maker.campaignGuide.31')],['end_trade',i18n('maker.campaignGuide.32')]];
    CONDITIONS.push(...OPS_C); EFFECTS.push(...OPS_E);
    const OPS_REF = { resource: 'resources', facility_count: 'facilities', unit_count: 'units', tech_done: 'tech', trade_active: 'trades', add_resource: 'resources', set_resource: 'resources', add_facility: 'facilities', add_units: 'units', grant_tech: 'tech', start_trade: 'trades', end_trade: 'trades', military_strength: null };
    const OPS_STR = new Set(['tech_done', 'trade_active', 'grant_tech', 'start_trade', 'end_trade']);
    const OPS_NUMKEY = { add_resource: 'value', set_resource: 'value', add_facility: 'count', add_units: 'count' };
    const opsList = (data, kind) => (Array.isArray(data && data[kind]) ? data[kind].filter(x => x && typeof x.id === 'string') : []);
    function opsFields(key, v, kind, data) {
        const ref = OPS_REF[key];
        let out = '';
        if (ref) {
            const cur = OPS_STR.has(key) ? v : v && v.id, items = opsList(data, ref);
            const opts = [...items.map(x => [x.id, `${x.icon ? x.icon + ' ' : ''}${x.name || x.title || x.id}`]), ...(cur && !items.some(x => x.id === cur) ? [[cur, i18n('maker.campaignGuide.33', { cur })]] : [])];
            out += `<label class="cpg-field"><span>${{ resources: i18n('sim.campaignOps.23'), facilities: i18n('sim.campaignOps.26'), units: i18n('sim.campaignOps.49'), tech: i18n('sim.campaignOps.6'), trades: i18n('sim.campaignOps.61') }[ref]}</span>${opts.length ? select('opsid', opts, cur ?? '') : `<span class="scn-dim">${esc(i18n('maker.campaignGuide.34'))}</span>`}</label>`;
        }
        if (OPS_STR.has(key)) return out;
        if (kind === 'cond') { const op = OPS.find(([k]) => k in v)?.[0] || 'gte'; return out + select('op', OPS, op) + input('number', v[op], i18n('maker.campaignGuide.35'), 'number'); }
        return out + input('number', v[OPS_NUMKEY[key]], key === 'add_facility' || key === 'add_units' ? i18n('maker.campaignGuide.36') : i18n('maker.campaignGuide.37'), 'number');
    }
    // 세계지도 규칙 — 나라(열쇠) 또는 경제권(id)을 가리키는 칸의 이름과 id 칸
    const WORLD = { owns_regions: ['country','key'], transfer_regions: ['to','key'], in_economic_region: ['zone','id'], assign_economic_region: ['to','id'] };
    const NONE = '~none'; // 열쇠 · id에 쓸 수 없는 글자(~)로 시작 — 실제 나라 · 경제권과 겹치지 않는다
    const catalog = data => (window.HemiCampaignTools && HemiCampaignTools.worldCatalog ? HemiCampaignTools.worldCatalog(data) : { regions: [], zones: [], starts: [] });
    const countriesOf = data => (data.world && Array.isArray(data.world.countries) ? data.world.countries.filter(c => c && typeof c.key === 'string' && c.key) : []);
    function worldFields(key, v, kind, data) {
        const [refField, idField] = WORLD[key], cat = catalog(data), ref = v[refField] || {};
        const targets = idField === 'key' ? countriesOf(data).map(c => [c.key, c.name || c.key]) : cat.zones.map(z => [z.id, z.name]);
        const cur = ref.unassigned ? NONE : (ref[idField] ?? '');
        const options = [...targets, ...(cur !== NONE && cur !== '' && !targets.some(([k]) => k === cur) ? [[cur, i18n('maker.campaignGuide.38', { cur })]] : []), [NONE, i18n('sim.worldMap.43')]];
        const known = new Map(cat.regions.map(r => [r.key, r.name])), picked = Array.isArray(v.regions) ? v.regions : [];
        const all = [...cat.regions, ...picked.filter(k => !known.has(k)).map(k => ({ key: k, name: i18n('maker.campaignGuide.39', { v: k }) }))];
        const summary = picked.length ? picked.map(k => known.get(k) || k).join(', ') : i18n('maker.campaignGuide.40');
        const who = idField === 'key' ? (kind === 'cond' ? i18n('maker.campaignGuide.41') : i18n('maker.campaignGuide.42')) : (kind === 'cond' ? i18n('sim.sidenav.2') : i18n('maker.campaignGuide.43'));
        return `<label class="cpg-field"><span>${who}</span>${select('ref', options.length > 1 || idField === 'id' ? options : [['', idField === 'key' ? esc(i18n('maker.campaignGuide.44')) : ''], [NONE, esc(i18n('sim.worldMap.43'))]], cur)}</label>
            ${kind === 'cond' ? `<label class="cpg-field"><span>${esc(i18n('sim.worldMap.48'))}</span>${select('mode', [['all',esc(i18n('sim.news.62'))],['any',esc(i18n('maker.campaignGuide.45'))]], v.mode === 'any' ? 'any' : 'all')}</label>` : ''}
            <details class="cpg-regions"><summary><b>${esc(i18n('sim.worldMap.48'))} <span data-gregion-count>${picked.length}</span>${esc(i18n('sim.worldMap.49'))}</b> · <span data-gregion-summary>${esc(summary)}</span></summary>
            ${all.length ? `<input class="scn-in" type="search" data-gregion-search placeholder="${esc(i18n('sim.worldMap.24'))}" aria-label="${esc(i18n('sim.worldMap.25'))}"><div class="cpg-region-list">${all.map(r => `<label class="scn-check"><input type="checkbox" data-gregion="${esc(r.key)}" ${picked.includes(r.key) ? 'checked' : ''}><span>${esc(r.name)}</span><code>${esc(r.key)}</code></label>`).join('')}</div>`
                : `<p class="scn-dim">${esc(i18n('maker.campaignGuide.46'))}</p>`}</details>`;
    }
    const OPS = [['gte',i18n('maker.campaignGuide.47')],['lte',i18n('maker.campaignGuide.48')],['gt',i18n('maker.campaignGuide.49')],['lt',i18n('maker.campaignGuide.50')],['eq',i18n('maker.campaignGuide.51')],['ne',i18n('maker.campaignGuide.52')]];
    const defaults = (key, kind, data) => {
        if (key in OPS_REF) { const ref = OPS_REF[key], first = ref ? opsList(data || {}, ref)[0]?.id || '' : ''; if (OPS_STR.has(key)) return first; if (kind === 'cond') return key === 'military_strength' ? { gte: 10 } : { id: first, gte: 1 }; return { id: first, [OPS_NUMKEY[key]]: 1 }; }
        if (WORLD[key]) { const [refField, idField] = WORLD[key], first = idField === 'key' ? countriesOf(data || {})[0]?.key : catalog(data || {}).zones[0]?.id; return { [refField]: first ? { [idField]: first } : { unassigned: true }, regions: [] }; }
        if (key === 'var') return { name: 'tension', gte: 50 };
        if (key === 'ruling_seats') return { share: true, gte: 50 };
        if (key === 'approval') return kind === 'cond' ? { of: 'cabinet', gte: 50 } : { of: 'cabinet', add: 5 };
        if (key === 'support') return { party: 'ruling', add: 5 };
        if (key === 'add_var' || key === 'set_var') return { name: 'tension', value: 5 };
        if (key.startsWith('date_')) return '1990-01-01';
        return key === 'toast' ? i18n('maker.campaignGuide.53') : 'my_flag';
    };
    function simpleRule(rule, kind) {
        if (!rule || typeof rule !== 'object' || Array.isArray(rule) || Object.keys(rule).length !== 1) return false;
        const key = Object.keys(rule)[0], v = rule[key];
        if (!(kind === 'cond' ? CONDITIONS : EFFECTS).some(([k]) => k === key)) return false;
        if (key in OPS_REF) {
            if (OPS_STR.has(key)) return typeof v === 'string';
            if (!v || typeof v !== 'object' || Array.isArray(v)) return false;
            const allowed = kind === 'cond' ? [...(OPS_REF[key] ? ['id'] : []), ...OPS.map(x => x[0])] : ['id', OPS_NUMKEY[key]];
            if (Object.keys(v).some(k => !allowed.includes(k))) return false;
            if (kind === 'cond') return OPS.filter(([k]) => k in v).length === 1 && (!OPS_REF[key] || typeof v.id === 'string');
            return typeof v.id === 'string' && Number.isFinite(Number(v[OPS_NUMKEY[key]]));
        }
        if (WORLD[key]) {
            const [refField, idField] = WORLD[key];
            if (!v || typeof v !== 'object' || Array.isArray(v) || Object.keys(v).some(k => ![refField, 'regions', ...(kind === 'cond' ? ['mode'] : [])].includes(k))) return false;
            const ref = v[refField];
            if (!ref || typeof ref !== 'object' || Array.isArray(ref) || Object.keys(ref).length !== 1 || !(ref.unassigned === true || typeof ref[idField] === 'string')) return false;
            return Array.isArray(v.regions) && v.regions.every(k => typeof k === 'string') && (v.mode == null || v.mode === 'all' || v.mode === 'any');
        }
        if (['var','approval','ruling_seats','support','add_var','set_var'].includes(key)) {
            if (!v || typeof v !== 'object' || Array.isArray(v)) return false;
            const allowed = kind === 'cond' ? (key === 'var' ? ['name',...OPS.map(x=>x[0])] : key === 'approval' ? ['of',...OPS.map(x=>x[0])] : ['share',...OPS.map(x=>x[0])]) : key === 'approval' ? ['of','add'] : key === 'support' ? ['party','add'] : ['name','value'];
            if (Object.keys(v).some(k => !allowed.includes(k))) return false;
            if (kind === 'cond' && OPS.filter(([k]) => k in v).length !== 1) return false;
            if (key === 'approval' && v.of && v.of !== 'cabinet') return false;
            if (key === 'ruling_seats' && v.share !== true) return false;
            if (kind !== 'cond' && ['approval','support'].includes(key) && !Number.isFinite(v.add)) return false;
            return true;
        }
        return typeof v === 'string';
    }
    function rows(v, kind) {
        if (kind === 'cond') {
            if (v == null || (typeof v === 'object' && !Object.keys(v).length)) return { items: [], join: 'all' };
            if (Array.isArray(v)) return { items: v, join: 'all' };
            if (Object.keys(v).length === 1 && (Array.isArray(v.all) || Array.isArray(v.any))) return { items: v.all || v.any, join: v.any ? 'any' : 'all' };
            return { items: [v], join: 'all' };
        }
        return { items: Array.isArray(v) ? v : v ? [v] : [], join: 'all' };
    }
    function rules(path, label, kind, value, data) {
        const { items, join } = rows(value, kind);
        const html = items.map((rule, i) => {
            const key = rule && Object.keys(rule)[0], v = rule && rule[key];
            let fields = '';
            if (simpleRule(rule, kind)) {
                fields = select('type', kind === 'cond' ? CONDITIONS : EFFECTS, key);
                if (WORLD[key]) fields += worldFields(key, v, kind, data);
                else if (key in OPS_REF) fields += opsFields(key, v, kind, data);
                else if (typeof v === 'string') {
                    fields += input('text', v, key.startsWith('date_') ? i18n('maker.campaignGuide.54') : key === 'toast' ? i18n('maker.campaignGuide.55') : key === 'fire_event' ? i18n('maker.campaignGuide.56') : i18n('maker.campaignGuide.57'));
                    if (kind === 'cond' && key === 'flag') fields += select('focus', [['',i18n('maker.campaignGuide.58')],...(data.focus || []).map(f => ['focus_' + f.id, f.title || f.id])], '');
                } else {
                    if (key === 'var' || key === 'add_var' || key === 'set_var') fields += input('name', v.name, i18n('maker.campaignGuide.59'));
                    if (key === 'support') fields += input('party', v.party, i18n('maker.campaignGuide.60'));
                    if (kind === 'cond') { const op = OPS.find(([k]) => k in v)?.[0] || 'gte'; fields += select('op', OPS, op) + input('number', v[op], i18n('maker.campaignGuide.35'), 'number'); }
                    else fields += input('number', v.value ?? v.add, i18n('maker.campaignGuide.61'), 'number');
                }
            } else fields = `<div class="cpg-custom"><b>${esc(i18n('maker.campaignGuide.62'))}</b><code>${esc(JSON.stringify(rule))}</code><small>${esc(i18n('maker.campaignGuide.63'))}</small></div>`;
            return `<div class="cpg-rule" data-gr="${i}">${fields}<button type="button" class="scn-x" data-gr-remove aria-label="${esc(i18n('maker.campaignGuide.64'))}">×</button></div>`;
        }).join('');
        return `<section class="cpg-rules" data-guide="${esc(path)}" data-gkind="${kind}"><div class="scn-row"><b>${esc(label)}</b><span class="scn-grow"></span>${kind === 'cond' ? select('join',[['all',esc(i18n('maker.campaignGuide.65'))],['any',esc(i18n('maker.campaignGuide.66'))]],join) : ''}</div>${html || `<p class="scn-dim">${kind === 'cond' ? esc(i18n('maker.campaignGuide.67')) : esc(i18n('maker.campaignGuide.68'))}</p>`}<button type="button" class="scn-btn" data-gr-add>+ ${kind === 'cond' ? esc(i18n('maker.campaignGuide.69')) : esc(i18n('maker.campaignGuide.70'))} ${esc(i18n('sim.contentTerritory.3'))}</button></section>`;
    }
    function bind(body, api) {
        body.querySelectorAll('[data-guide]').forEach(box => {
            const path = box.dataset.guide, kind = box.dataset.gkind;
            const get = () => rows(api.get(path), kind);
            const put = (items, join, redraw = false) => { api.set(path, kind === 'cond' ? !items.length ? null : items.length === 1 ? items[0] : { [join]: items } : items); api.touch(); if (redraw) api.render(); };
            box.querySelector('[data-gf="join"]')?.addEventListener('change', e => { const r = get(); put(r.items, e.target.value); });
            box.querySelector('[data-gr-add]').onclick = () => { const r = get(); const key = kind === 'cond' ? 'flag' : 'add_var'; put([...r.items,{[key]:defaults(key,kind,api.data&&api.data())}],r.join,true); };
            box.querySelectorAll('[data-gr]').forEach(row => {
                const i = +row.dataset.gr;
                row.querySelector('[data-gr-remove]').onclick = () => { const r = get(); r.items.splice(i,1); put(r.items,r.join,true); };
                // 구역 고르기 — 고를 때마다 저장하되 화면은 다시 그리지 않는다 (펼친 목록 · 검색이 유지되게)
                row.querySelectorAll('[data-gregion]').forEach(cb => cb.addEventListener('change', () => {
                    const r = get(), rule = r.items[i], v = rule[Object.keys(rule)[0]];
                    const picked = [...row.querySelectorAll('[data-gregion]')].filter(x => x.checked).map(x => x.dataset.gregion);
                    v.regions = picked; put(r.items, r.join);
                    row.querySelector('[data-gregion-count]').textContent = picked.length;
                    row.querySelector('[data-gregion-summary]').textContent = picked.length ? picked.map(k => row.querySelector(`[data-gregion="${CSS.escape(k)}"]`).nextElementSibling.textContent).join(', ') : i18n('maker.campaignGuide.40');
                }));
                row.querySelector('[data-gregion-search]')?.addEventListener('input', e => { const q = e.target.value.trim().toLowerCase(); row.querySelectorAll('.cpg-region-list > label').forEach(l => { l.hidden = !!q && !l.textContent.toLowerCase().includes(q); }); });
                row.querySelectorAll('[data-gf]').forEach(el => {
                    el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', () => {
                        const r = get(), rule = r.items[i], key = Object.keys(rule)[0], v = rule[key], field = el.dataset.gf;
                        if (field === 'type') { r.items[i] = {[el.value]:defaults(el.value,kind,api.data&&api.data())}; put(r.items,r.join,true); return; }
                        if (field === 'opsid') { if (OPS_STR.has(key)) rule[key] = el.value; else v.id = el.value; put(r.items,r.join); return; }
                        if (key in OPS_REF && field === 'number') { if (!el.value || !Number.isFinite(+el.value)) return; const k2 = kind === 'cond' ? OPS.find(([k])=>k in v)[0] : OPS_NUMKEY[key]; v[k2] = +el.value; put(r.items,r.join); return; }
                        if (field === 'ref') { const [refField, idField] = WORLD[key]; v[refField] = el.value === NONE ? { unassigned: true } : { [idField]: el.value }; put(r.items,r.join); return; }
                        if (field === 'mode') { if (el.value === 'any') v.mode = 'any'; else delete v.mode; put(r.items,r.join); return; }
                        if (field === 'focus') { if (el.value) { rule[key] = el.value; put(r.items,r.join,true); } return; }
                        if (field === 'text') rule[key] = el.value;
                        else if (field === 'name' || field === 'party') v[field] = el.value;
                        else if (field === 'op') { const old = OPS.find(([k])=>k in v)?.[0], n = v[old]; OPS.forEach(([k])=>delete v[k]); v[el.value] = n; }
                        else if (field === 'number') { if (!el.value || !Number.isFinite(+el.value)) return; const k = kind === 'cond' ? OPS.find(([k])=>k in v)[0] : 'value' in v ? 'value' : 'add'; v[k] = +el.value; }
                        put(r.items,r.join);
                    });
                });
            });
        });
    }
    window.HemiCampaignGuide = { rules, bind };
})();
