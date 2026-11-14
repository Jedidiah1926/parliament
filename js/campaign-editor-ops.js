// ===== 시나리오 메이커 › 국가 운영 — 자원 · 시설 · 기술 · 부대 · 무역 가이드 입력 (v1.7.1 · 시나리오 0.3.2) =====
// 규칙과 계산은 js/ops-rules.js. 이 파일은 같은 자료를 칸으로 채우게만 한다 — 프로(JSON) 모드에서는 편집기가 각 목록을 JSON으로 보여 준다.
// 편집기(js/campaign-editor.js)가 html(api) · bind(body, api)를 부른다. api = { S, getP, setP, touch, render, esc, jsonField, detailMode, uid }
(function () {
    'use strict';
    const SECTIONS = [['resources', '자원'], ['facilities', '시설'], ['tech', '기술 트리'], ['units', '부대'], ['trades', '무역']];
    let section = 'resources';
    const num = v => (v === '' || v == null ? null : Number(v));
    const list = (S, k) => (Array.isArray(S[k]) ? S[k] : []);

    // 자원 양 칸 — { 자원: 숫자 } (자원 고르기 + 숫자, 줄 더하기 · 빼기)
    function amountField(api, path, label, value) {
        const { esc, S } = api, res = list(S, 'resources'), entries = value && typeof value === 'object' && !Array.isArray(value) ? Object.entries(value) : [];
        const opt = cur => `${res.map(r => `<option value="${esc(r.id)}" ${r.id === cur ? 'selected' : ''}>${esc(`${r.icon ? r.icon + ' ' : ''}${r.name || r.id}`)}</option>`).join('')}${cur && !res.some(r => r.id === cur) ? `<option value="${esc(cur)}" selected>⚠ ${esc(cur)} (없는 자원)</option>` : ''}`;
        return `<div class="cpo-amount" data-amount="${esc(path)}"><span class="cpo-lab">${esc(label)}</span>
            ${entries.map(([k, v], i) => `<div class="scn-row" data-amount-row="${i}"><select class="scn-in" data-amount-key aria-label="${esc(label)} 자원">${opt(k)}</select><input class="scn-in scn-num" type="number" step="any" min="0" data-amount-val value="${esc(v)}" aria-label="${esc(label)} 양"><button type="button" class="scn-x" data-amount-del aria-label="빼기">×</button></div>`).join('')}
            ${res.length ? `<button type="button" class="scn-btn cpo-small" data-amount-add>+ ${esc(label)}</button>` : '<span class="scn-dim">자원 탭에서 자원을 먼저 만드세요.</span>'}</div>`;
    }
    const field = (api, path, label, value, type = 'text', extra = '') => `<label class="cpg-field"><span>${api.esc(label)}</span><input class="scn-in" data-ops-field="${api.esc(path)}" data-ops-type="${type}" type="${type === 'int' || type === 'num' ? 'number' : 'text'}" ${type === 'int' ? 'step="1" min="0"' : type === 'num' ? 'step="any" min="0"' : ''} value="${api.esc(value ?? '')}" ${extra}></label>`;
    const check = (api, path, label, on) => `<label class="scn-check"><input type="checkbox" data-ops-bool="${api.esc(path)}" ${on ? 'checked' : ''}>${api.esc(label)}</label>`;
    // 기술 고르기 (필요 기술 · 선행 · 배타)
    function techPick(api, path, label, value, skip) {
        const { esc, S } = api, tech = list(S, 'tech').filter(t => t.id !== skip), cur = Array.isArray(value) ? value : [];
        if (!tech.length) return '';
        return `<div class="cpo-pick" data-ops-pick="${esc(path)}"><span class="cpo-lab">${esc(label)}</span>${tech.map(t => `<label class="scn-check"><input type="checkbox" value="${esc(t.id)}" ${cur.includes(t.id) ? 'checked' : ''}>${esc(t.title || t.id)}</label>`).join('')}${cur.filter(id => !tech.some(t => t.id === id)).map(id => `<label class="scn-check"><input type="checkbox" value="${esc(id)}" checked>⚠ ${esc(id)} (없는 기술)</label>`).join('')}</div>`;
    }
    const rules = (api, path, label, kind) => window.HemiCampaignGuide.rules(path, label, kind, api.getP(path), api.S);
    const card = (api, k, i, title, inner) => `<details class="cpg-script" open data-ops-item="${k}.${i}"><summary>${api.esc(title)}</summary>${inner}<button type="button" class="scn-btn scn-danger" data-ops-del="${k}" data-index="${i}">삭제</button></details>`;

    function sectionHtml(api) {
        const { S, esc } = api, p = section;
        if (api.detailMode === 'json') return api.jsonField(p, SECTIONS.find(s => s[0] === p)[1], 'list', 14);
        const items = list(S, p);
        if (p === 'resources') return `<p class="scn-dim">석유 · 철강 · 식량처럼 이 시나리오에서 쓰는 자원입니다. 국고도 자원으로 만들어 비용에 쓰세요(기본 게임의 경제와는 따로 계산합니다).</p>
            <div class="cpo-table">${items.map((r, i) => `<div class="scn-row cpo-res" data-ops-item="resources.${i}">${field(api, `resources.${i}.icon`, '아이콘', r.icon, 'text', 'maxlength="4" style="width:56px"')}${field(api, `resources.${i}.name`, '이름', r.name)}${field(api, `resources.${i}.id`, 'ID', r.id)}${field(api, `resources.${i}.unit`, '단위', r.unit, 'text', 'style="width:70px"')}${field(api, `resources.${i}.start`, '처음 재고', r.start, 'num')}${field(api, `resources.${i}.max`, '저장 한도 (비우면 없음)', r.max, 'num')}<button type="button" class="scn-x" data-ops-del="resources" data-index="${i}" aria-label="자원 삭제">×</button></div>`).join('')}</div>
            <button type="button" class="scn-btn" data-ops-add="resources">+ 자원</button>`;
        if (p === 'facilities') return `<p class="scn-dim">시설은 하루마다 목록 순서대로 가동합니다. 소비 · 유지비를 다 낼 수 없으면 그날 멈춥니다. 건설은 비용을 시작할 때 한 번 내고, 기간이 지나면 완료됩니다.</p>
            ${field(api, 'buildSlots', '동시에 지을 수 있는 수', S.buildSlots ?? 1, 'int')}
            ${items.map((f, i) => card(api, 'facilities', i, `${f.icon ? f.icon + ' ' : ''}${f.name || f.id}`, `<div class="scn-grid2">${field(api, `facilities.${i}.name`, '이름', f.name)}${field(api, `facilities.${i}.id`, 'ID', f.id)}${field(api, `facilities.${i}.icon`, '아이콘', f.icon)}${field(api, `facilities.${i}.days`, '건설 기간 (일)', f.days, 'num')}${field(api, `facilities.${i}.start`, '처음 수', f.start, 'int')}${field(api, `facilities.${i}.max`, '최대 수 (비우면 없음)', f.max, 'int')}</div>
                ${field(api, `facilities.${i}.desc`, '설명', f.desc)}${check(api, `facilities.${i}.buildable`, '플레이어가 지을 수 있음', f.buildable !== false)}
                ${amountField(api, `facilities.${i}.cost`, '건설 비용', f.cost)}${amountField(api, `facilities.${i}.produce`, '하루 생산', f.produce)}${amountField(api, `facilities.${i}.consume`, '하루 소비 (생산에 드는 것)', f.consume)}${amountField(api, `facilities.${i}.upkeep`, '하루 유지비', f.upkeep)}
                ${techPick(api, `facilities.${i}.requires`, '필요 기술', f.requires)}${rules(api, `facilities.${i}.available`, '건설 조건', 'cond')}`)).join('')}
            <button type="button" class="scn-btn" data-ops-add="facilities">+ 시설</button>`;
        if (p === 'tech') return `<p class="scn-dim">방향성과 따로 진행하는 연구입니다. 한 번에 하나를 연구하고, 비용은 시작할 때 냅니다(취소하면 돌려받지 않음). X · Y는 트리의 칸 위치(X는 2칸이 상자 하나)입니다.</p>
            <div class="scn-row"><button type="button" class="scn-btn" data-ops-layout>자동 정렬</button></div>
            ${items.map((t, i) => card(api, 'tech', i, `${t.icon ? t.icon + ' ' : ''}${t.title || t.id}`, `<div class="scn-grid2">${field(api, `tech.${i}.title`, '이름', t.title)}${field(api, `tech.${i}.id`, 'ID', t.id)}${field(api, `tech.${i}.icon`, '아이콘', t.icon)}${field(api, `tech.${i}.days`, '연구 기간 (일)', t.days, 'num')}${field(api, `tech.${i}.x`, 'X', t.x, 'num')}${field(api, `tech.${i}.y`, 'Y', t.y, 'num')}</div>
                ${field(api, `tech.${i}.desc`, '설명', t.desc)}${check(api, `tech.${i}.start`, '처음부터 연구됨', t.start === true)}
                ${amountField(api, `tech.${i}.cost`, '연구 비용', t.cost)}${techPick(api, `tech.${i}.prereq`, '필수 선행', t.prereq, t.id)}${techPick(api, `tech.${i}.any`, '이 중 하나', t.any, t.id)}${techPick(api, `tech.${i}.exclusive`, '함께 연구할 수 없음', t.exclusive, t.id)}
                ${rules(api, `tech.${i}.available`, '연구 조건', 'cond')}${rules(api, `tech.${i}.effects`, '연구 완료 효과', 'eff')}`)).join('')}
            <button type="button" class="scn-btn" data-ops-add="tech">+ 기술</button>`;
        if (p === 'units') return `<p class="scn-dim">부대 수 × 전력이 군사력입니다. 유지비를 못 낸 날은 그 부대의 전력이 절반입니다. 전투 · 이동은 없고, 군사력은 조건(military_strength)과 이벤트로 이야기에 쓰입니다.</p>
            ${field(api, 'recruitSlots', '동시에 편성할 수 있는 수', S.recruitSlots ?? 1, 'int')}
            ${items.map((u, i) => card(api, 'units', i, `${u.icon ? u.icon + ' ' : ''}${u.name || u.id}`, `<div class="scn-grid2">${field(api, `units.${i}.name`, '이름', u.name)}${field(api, `units.${i}.id`, 'ID', u.id)}${field(api, `units.${i}.icon`, '아이콘', u.icon)}${field(api, `units.${i}.branch`, '병종 (예: 육군)', u.branch)}${field(api, `units.${i}.strength`, '전력', u.strength, 'num')}${field(api, `units.${i}.days`, '편성 기간 (일)', u.days, 'num')}${field(api, `units.${i}.start`, '처음 수', u.start, 'int')}${field(api, `units.${i}.max`, '최대 수 (비우면 없음)', u.max, 'int')}</div>
                ${field(api, `units.${i}.desc`, '설명', u.desc)}${check(api, `units.${i}.recruitable`, '플레이어가 편성할 수 있음', u.recruitable !== false)}
                ${amountField(api, `units.${i}.cost`, '편성 비용', u.cost)}${amountField(api, `units.${i}.upkeep`, '하루 유지비', u.upkeep)}${techPick(api, `units.${i}.requires`, '필요 기술', u.requires)}${rules(api, `units.${i}.available`, '편성 조건', 'cond')}`)).join('')}
            <button type="button" class="scn-btn" data-ops-add="units">+ 부대</button>`;
        if (p === 'trades') {
            const countries = S.world && Array.isArray(S.world.countries) ? S.world.countries : [];
            const partner = (i, cur) => `<label class="cpg-field"><span>거래 상대</span><select class="scn-in" data-ops-field="trades.${i}.partner" data-ops-type="text"><option value="">고르세요</option>${countries.map(c => `<option value="${esc(c.key)}" ${c.key === cur ? 'selected' : ''}>${esc(c.name || c.key)}</option>`).join('')}${cur && !countries.some(c => c.key === cur) ? `<option value="${esc(cur)}" selected>⚠ ${esc(cur)} (나라 목록에 없음)</option>` : ''}</select></label>`;
            return `<p class="scn-dim">하루마다 내줄 것을 모두 낼 수 있을 때만 주고받습니다. 못 내면 그날 계약이 이행 실패로 끝납니다. 상대국의 재고는 계산하지 않습니다. 거래 상대는 시작 나라 탭의 세계지도 연결에 적은 나라입니다.${countries.length ? '' : ' <b>나라가 아직 없습니다.</b>'}</p>
            ${items.map((t, i) => card(api, 'trades', i, t.title || t.id, `<div class="scn-grid2">${field(api, `trades.${i}.title`, '이름', t.title)}${field(api, `trades.${i}.id`, 'ID', t.id)}${partner(i, t.partner)}${field(api, `trades.${i}.days`, '기간 (일, 비우면 기한 없음)', t.days, 'num')}</div>
                ${field(api, `trades.${i}.desc`, '설명', t.desc)}${check(api, `trades.${i}.repeat`, '끝난 뒤 다시 맺을 수 있음', t.repeat === true)}
                ${amountField(api, `trades.${i}.give`, '하루마다 내줄 것', t.give)}${amountField(api, `trades.${i}.get`, '하루마다 받을 것', t.get)}${rules(api, `trades.${i}.visible`, '목록에 보이는 조건', 'cond')}${rules(api, `trades.${i}.available`, '체결 조건', 'cond')}`)).join('')}
            <button type="button" class="scn-btn" data-ops-add="trades">+ 무역 계약</button>`;
        }
        return '';
    }
    function html(api) {
        const counts = Object.fromEntries(SECTIONS.map(([k]) => [k, list(api.S, k).length]));
        return `<section class="scn-card"><div class="scn-h">국가 운영</div><p class="scn-dim">필요한 것만 만드세요 — 하나도 없으면 게임의 시나리오 › 운영 탭이 나오지 않습니다. 하루 단위로 계산합니다(턴제 1턴 = 1일). 조건 · 효과에서 resource · tech_done · military_strength · add_resource · add_facility … 를 쓸 수 있습니다.</p>
            <div class="scn-seg cpo-seg">${SECTIONS.map(([k, l]) => `<button type="button" data-ops-section="${k}" class="${k === section ? 'on' : ''}">${l} <span class="scn-n">${counts[k]}</span></button>`).join('')}</div>
            <div class="cpo-body">${sectionHtml(api)}</div></section>`;
    }
    const DEFAULTS = {
        resources: api => ({ id: api.uid('res'), name: '새 자원', icon: '', unit: '', start: 0 }),
        facilities: api => ({ id: api.uid('fac'), name: '새 시설', icon: '🏭', desc: '', cost: {}, days: 3, produce: {}, consume: {}, upkeep: {} }),
        tech: api => ({ id: api.uid('tech'), title: '새 기술', icon: '🔬', desc: '', x: 0, y: list(api.S, 'tech').length, days: 5, cost: {}, prereq: [], any: [], exclusive: [], effects: [] }),
        units: api => ({ id: api.uid('unit'), name: '새 부대', icon: '🪖', branch: '육군', cost: {}, days: 3, upkeep: {}, strength: 1 }),
        trades: api => ({ id: api.uid('trade'), title: '새 계약', partner: (api.S.world && api.S.world.countries && api.S.world.countries[0] && api.S.world.countries[0].key) || '', desc: '', give: {}, get: {}, days: 30 }),
    };
    // ID를 바꾸면 다른 곳의 참조도 함께 (자원 양 · 필요 기술 · 선행 · 조건/효과의 id)
    function renameRef(S, kind, from, to) {
        const walk = o => { if (!o || typeof o !== 'object') return; if (Array.isArray(o)) { o.forEach((v, i) => { if (typeof v === 'string' && v === from && kind === 'tech') o[i] = to; else walk(v); }); return; }
            Object.keys(o).forEach(k => {
                const v = o[k];
                if (kind === 'resources' && ['cost', 'produce', 'consume', 'upkeep', 'give', 'get'].includes(k) && v && typeof v === 'object' && !Array.isArray(v) && Object.prototype.hasOwnProperty.call(v, from)) { o[k] = Object.fromEntries(Object.entries(v).map(([a, b]) => [a === from ? to : a, b])); return; }
                if (['resource', 'add_resource', 'set_resource'].includes(k) && kind === 'resources' && v && v.id === from) v.id = to;
                if (['facility_count', 'add_facility'].includes(k) && kind === 'facilities' && v && v.id === from) v.id = to;
                if (['unit_count', 'add_units'].includes(k) && kind === 'units' && v && v.id === from) v.id = to;
                if (['tech_done', 'grant_tech'].includes(k) && kind === 'tech' && v === from) { o[k] = to; return; }
                if (['trade_active', 'start_trade', 'end_trade'].includes(k) && kind === 'trades' && v === from) { o[k] = to; return; }
                if (k === 'state') return; // 시작 세이브 속은 보지 않는다
                walk(v);
            }); };
        Object.keys(S).forEach(k => { if (k !== kind || kind === 'tech') walk(S[k]); });
    }
    function bind(body, api) {
        const { S, getP, setP, touch, render } = api;
        body.querySelectorAll('[data-ops-section]').forEach(b => { b.onclick = () => { section = b.dataset.opsSection; render(); }; });
        body.querySelectorAll('[data-ops-add]').forEach(b => { b.onclick = () => { const k = b.dataset.opsAdd; if (!Array.isArray(S[k])) S[k] = []; S[k].push(DEFAULTS[k](api)); touch(); render(); }; });
        body.querySelectorAll('[data-ops-del]').forEach(b => { b.onclick = () => { const k = b.dataset.opsDel; S[k].splice(+b.dataset.index, 1); if (!S[k].length) delete S[k]; touch(); render(); }; });
        body.querySelector('[data-ops-layout]')?.addEventListener('click', () => { window.HemiCampaignTools.layout(S.tech); touch(); render(); });
        body.querySelectorAll('[data-ops-field]').forEach(el => {
            el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', () => {
                const path = el.dataset.opsField, type = el.dataset.opsType;
                if (/\.id$/.test(path)) return; // ID는 다 쓴 뒤(change)에
                let v = el.value;
                if (type === 'num' || type === 'int') { v = num(v); if (v != null && !Number.isFinite(v)) return; if (type === 'int' && v != null) v = Math.max(0, Math.floor(v)); }
                const ks = path.split('.'), last = ks.pop(), o = ks.reduce((a, k) => a[k], S);
                if (v == null || v === '') { if (['max', 'days', 'start', 'icon', 'unit', 'desc'].includes(last) || ['buildSlots', 'recruitSlots'].includes(path)) delete o[last]; else o[last] = ''; }
                else o[last] = v;
                touch();
            });
            if (/\.id$/.test(el.dataset.opsField)) el.addEventListener('change', () => {
                const path = el.dataset.opsField, [kind, i] = path.split('.'), item = S[kind][+i], next = el.value.trim();
                if (next === item.id) return;
                if (!window.HemiCampaignTools.idOK(next) || S[kind].some(x => x !== item && x.id === next)) { el.value = item.id; return; }
                renameRef(S, kind, item.id, next); item.id = next; touch(); render();
            });
        });
        body.querySelectorAll('[data-ops-bool]').forEach(el => el.addEventListener('change', () => {
            const path = el.dataset.opsBool, ks = path.split('.'), last = ks.pop(), o = ks.reduce((a, k) => a[k], S);
            if (last === 'buildable' || last === 'recruitable') { if (el.checked) delete o[last]; else o[last] = false; }
            else if (el.checked) o[last] = true; else delete o[last];
            touch();
        }));
        body.querySelectorAll('[data-ops-pick]').forEach(box => box.querySelectorAll('input').forEach(cb => cb.addEventListener('change', () => {
            const picked = [...box.querySelectorAll('input')].filter(x => x.checked).map(x => x.value); setP(box.dataset.opsPick, picked); touch();
        })));
        body.querySelectorAll('[data-amount]').forEach(box => {
            const path = box.dataset.amount;
            const read = () => { const o = {}; box.querySelectorAll('[data-amount-row]').forEach(row => { const k = row.querySelector('[data-amount-key]').value, v = num(row.querySelector('[data-amount-val]').value); if (k) o[k] = Number.isFinite(v) ? v : 0; }); return o; };
            box.querySelectorAll('[data-amount-key],[data-amount-val]').forEach(el => el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', () => { setP(path, read()); touch(); }));
            box.querySelectorAll('[data-amount-del]').forEach(b => b.addEventListener('click', () => { b.closest('[data-amount-row]').remove(); setP(path, read()); touch(); render(); }));
            box.querySelector('[data-amount-add]')?.addEventListener('click', () => {
                const cur = read(), res = list(S, 'resources').find(r => !(r.id in cur)) || list(S, 'resources')[0];
                if (res) { cur[res.id] = cur[res.id] ?? 1; setP(path, cur); touch(); render(); }
            });
        });
        void getP;
    }
    window.HemiCampaignOpsEditor = { html, bind, amountField, get section() { return section; }, set section(v) { section = v; }, SECTIONS, renameRef };
})();
