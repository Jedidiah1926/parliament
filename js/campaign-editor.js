// ===== 시나리오 · 격변 편집기 (scenario.html · 0.3.0 · 테스트) =====
// 시나리오(hemicycle-campaign@1) = 세계관 + 시작 나라들(종합 프리셋) + 방향성 트리 + 격변들 + 결말
//   격변 = 시작 조건 · 날짜, 게이지(변수), 기한 있는 임무, 격변 전용 결정 · 이벤트(슈퍼 이벤트), 결말
// 조건 · 효과는 스크립트 모드 형식(docs/MODDING.md)을 그대로 쓴다 — 칸 옆 "도우미"로 자주 쓰는 모양을 넣을 수 있다.
// 내 시나리오는 IndexedDB(hemicycleCampaigns)에 자동 저장, .hemicmp(gzip JSON)로 내보내기 · 불러오기, 시험 플레이는 js/campaign.js가 받음.
/* global HemiPresets, HemiUI */
(function () {
    'use strict';
    const FORMAT = 'hemicycle-campaign@1';
    const Tools = window.HemiCampaignTools;
    const rawPending = new Set();
    let zoom = 1, linkTool = '', search = '', saveStatus = i18n('maker.campaignEditor.1'), past = [], future = [], baseline = '';
    let viewScroll = { left: 0, top: 0 }, treeViewport = null;
    const resetHistory = () => { past = []; future = []; baseline = JSON.stringify(S); rawPending.clear(); };
    const blockedDraft = () => { if (!rawPending.size) return false; $('cpSaveStatus').textContent = i18n('maker.campaignEditor.2'); return true; };
    const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const $ = id => document.getElementById(id);
    const alertBox = m => (window.HemiUI && HemiUI.alert ? HemiUI.alert(m) : Promise.resolve(alert(m)));
    const confirmBox = m => (window.HemiUI && HemiUI.confirm ? HemiUI.confirm(m) : Promise.resolve(confirm(m)));
    const uid = p => p + '_' + Date.now().toString(36).slice(-5) + Math.random().toString(36).slice(2, 5);

    // ---------------------------------------------------------------
    // 저장소
    // ---------------------------------------------------------------
    const DB = 'hemicycleCampaigns', STORE = 'items', LAST = 'hemicycleCampaignLast';
    const db = () => new Promise((res, rej) => { const r = indexedDB.open(DB, 1); r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains(STORE)) r.result.createObjectStore(STORE, { keyPath: 'id' }); }; r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
    const dbAll = async () => { const d = await db(); return new Promise((res, rej) => { const q = d.transaction(STORE).objectStore(STORE).getAll(); q.onsuccess = () => res(q.result || []); q.onerror = () => rej(q.error); }); };
    const dbPut = async it => { const d = await db(); return new Promise((res, rej) => { const t = d.transaction(STORE, 'readwrite'); t.objectStore(STORE).put(it); t.oncomplete = res; t.onerror = () => rej(t.error); }); };
    const dbDel = async id => { const d = await db(); return new Promise((res, rej) => { const t = d.transaction(STORE, 'readwrite'); t.objectStore(STORE).delete(id); t.oncomplete = res; t.onerror = () => rej(t.error); }); };

    // ---------------------------------------------------------------
    // 데이터
    // ---------------------------------------------------------------
    function blank() {
        return {
            format: FORMAT, id: uid('cmp'), title: i18n('maker.campaignEditor.3'), author: '', version: '1.0', description: '', lore: '',
            starts: [{ id: 's1', name: i18n('maker.campaignEditor.4'), desc: '', kind: 'preset', preset: 'builtin:tutorial' }],
            time:{mode:'turn',startDate:'',startHour:0,defaultSpeed:1},
            variables: {}, events: [], decisions: [],
            focus: [{ id: 'f1', title: i18n('maker.campaignEditor.5'), icon: '🏛', days: 35, x: 1, y: 0, desc: '', prereq: [], any: [], exclusive: [], effects: [] }],
            crises: [], endings: [], articles: [],
        };
    }
    function blankCrisis() {
        return { id: uid('c'), title: i18n('maker.campaignEditor.6'), color: '#e5484d', desc: '', image: '', date: '', trigger: { flag: 'focus_f1' }, intro: '',
            meters: [{ id: 'tension', name: i18n('maker.campaignEditor.7'), start: 30, min: 0, max: 100, perMonth: 5, color: '' }],
            missions: [], outcomes: [
                { id: 'win', title: i18n('maker.campaignEditor.8'), text: '', condition: { var: { name: 'tension', lte: 0 } }, effects: [] },
                { id: 'lose', title: i18n('maker.campaignEditor.9'), text: '', condition: { var: { name: 'tension', gte: 100 } }, effects: [] }],
            events: [], decisions: [] };
    }
    let S = blank();
    let tab = 'info', selFocus = null, selCrisis = null, selArticle = null, presets = [];
    // 세부 정보 고치는 방식 — 'form'(칸 채우기) · 'json'(그 항목 전체를 JSON으로 직접)
    let detailMode = 'form';
    try { detailMode = localStorage.getItem('hemicycleCampaignDetailMode') === 'json' ? 'json' : 'form'; } catch (e) { /* 무시 */ }
    const modeSeg = () => `<div class="scn-seg cpe-mode" title="${esc(i18n('maker.campaignEditor.10'))}"><button type="button" data-mode="form" class="${detailMode === 'form' ? 'on' : ''}">${esc(i18n('maker.campaignEditor.11'))}</button><button type="button" data-mode="json" class="${detailMode === 'json' ? 'on' : ''}">${esc(i18n('maker.campaignEditor.12'))}</button></div>`;
    // 항목 하나(방향성 · 격변)를 통째로 JSON으로 — 저장할 때 큰 데이터(그림)는 그대로 보여 준다
    // 그림(data:image…)은 JSON 칸에서 짧은 자리표시로 — 고쳐도 그대로 다시 붙는다
    const imgStash = new Map();
    const hideImgs = v => JSON.parse(JSON.stringify(v), (k, x) => { if (typeof x === 'string' && x.startsWith('data:image/')) { const key = i18n('maker.campaignEditor.13', { size: imgStash.size + 1 }); imgStash.set(key, x); return key; } return x; });
    const showImgs = v => JSON.parse(JSON.stringify(v), (k, x) => (typeof x === 'string' && imgStash.has(x) ? imgStash.get(x) : x));
    const objJson = (path, rows) => `<textarea class="scn-in scn-code cpe-objjson" rows="${rows || 24}" spellcheck="false" data-objjson="${esc(path)}">${esc(JSON.stringify(hideImgs(getP(path)), null, 2))}</textarea><div class="scn-err" data-objerr="${esc(path)}"></div>`;
    const iconHtml = (f, cls) => (f.iconImage ? `<img class="${cls}-img" src="${esc(f.iconImage)}" alt="">` : f.icon ? `<span class="${cls}-ico">${esc(f.icon)}</span>` : '');

    // 경로로 읽고 쓰기 — "crises.0.trigger" 같은
    const getP = p => p.split('.').reduce((o, k) => (o == null ? o : o[k]), S);
    const setP = (p, v) => { const ks = p.split('.'); const last = ks.pop(); const o = ks.reduce((a, k) => a[k], S); o[last] = v; };

    // 조건 · 효과 도우미 — 자주 쓰는 모양
    const COND_SNIP = [
        [i18n('maker.campaignEditor.14'), { ruling: i18n('maker.campaignEditor.15') }], [i18n('maker.campaignEditor.16'), { party_seats: { party: 'ruling', share: true, gte: 50 } }],
        [i18n('maker.campaignEditor.17'), { party_support: { party: i18n('maker.campaignEditor.15'), gte: 30 } }], [i18n('maker.campaignEditor.18'), { ruling_seats: { share: true, lt: 50 } }],
        [i18n('maker.campaignEditor.19'), { approval: { of: 'cabinet', lt: 30 } }], [i18n('maker.campaignEditor.20'), { date_after: '1990-01-01' }],
        [i18n('maker.campaignEditor.21'), { flag: i18n('maker.campaignEditor.22') }], [i18n('maker.campaignEditor.23'), { flag: i18n('maker.campaignEditor.24') }], [i18n('maker.campaignEditor.25'), { flag: i18n('maker.campaignEditor.26') }],
        [i18n('maker.campaignEditor.27'), { flag: i18n('sim.contentDate.11') }], [i18n('maker.campaignEditor.28'), { var: { name: 'tension', gte: 100 } }], [i18n('maker.campaignEditor.29'), { economy: { indicator: 'unemp', gt: 10 } }],
        [i18n('maker.campaignEditor.30'), { all: [{}, {}] }], [i18n('maker.campaignEditor.31'), { any: [{}, {}] }], [i18n('maker.campaignEditor.32'), { chance: 25 }],
    ];
    const EFF_SNIP = [
        [i18n('maker.campaignEditor.33'), { support: { party: 'ruling', add: -2 } }], [i18n('maker.campaignEditor.34'), { approval: { of: 'cabinet', add: -3 } }],
        [i18n('maker.campaignEditor.35'), { add_var: { name: 'tension', value: 10 } }], [i18n('maker.campaignEditor.36'), { set_var: { name: 'tension', value: 0 } }],
        [i18n('maker.campaignEditor.37'), { set_flag: i18n('sim.contentDate.11') }], [i18n('maker.campaignEditor.38'), { fire_event: i18n('maker.campaignEditor.39') }], [i18n('maker.campaignEditor.40'), { article: { title: i18n('maker.campaignEditor.41'), body: i18n('sim.news.40'), outlet: i18n('maker.campaignEditor.42'), type: 'politics' } }],
        [i18n('maker.campaignEditor.43'), { message: { title: i18n('sim.history.110'), text: i18n('maker.campaignEditor.44') } }], [i18n('maker.campaignEditor.45'), { economy: { indicator: 'mood', add: -5 } }], [i18n('maker.campaignEditor.46'), { party_status: { party: i18n('maker.campaignEditor.15'), to: 'banned' } }],
    ];
    function jsonField(path, label, kind, rows) {
        const v = getP(path);
        if (detailMode === 'form' && kind === 'list' && /(?:events|decisions)$/.test(path)) return scriptForm(path,label);
        if (detailMode === 'form' && kind === 'obj' && path==='variables') return variableForm();
        if (detailMode === 'form' && (kind === 'cond' || kind === 'eff')) return HemiCampaignGuide.rules(path, label, kind, v, S);
        const empty = kind === 'cond' ? null : [];
        const txt = v == null || (Array.isArray(v) && !v.length && kind !== 'list') ? '' : JSON.stringify(v, null, 1);
        const snips = kind === 'cond' ? COND_SNIP : kind === 'eff' ? EFF_SNIP : null;
        return `<div class="cpe-json"><div class="scn-row"><label class="scn-lab">${label}</label><span class="scn-grow"></span>
            ${snips ? `<select class="scn-in cpe-snip" data-snip="${esc(path)}" data-kind="${kind}"><option value="">${esc(i18n('maker.campaignEditor.47'))}</option>${snips.map(([l], i) => `<option value="${i}">${esc(l)}</option>`).join('')}</select>` : ''}</div>
            <textarea class="scn-in scn-code" rows="${rows || 3}" spellcheck="false" data-json="${esc(path)}" data-kind="${kind}" placeholder="${kind === 'cond' ? i18n('maker.campaignEditor.48') : kind === 'eff' ? i18n('maker.campaignEditor.49') : ''}">${esc(txt)}</textarea>
            <div class="scn-err" data-err="${esc(path)}"></div></div>`;
        void empty;
    }

    function variableForm() {
        return `<section class="scn-card"><div class="scn-h">${esc(i18n('maker.campaignEditor.50'))}</div><p class="scn-dim">${esc(i18n('maker.campaignEditor.51'))}</p>${Object.entries(S.variables).map(([k,v])=>`<div class="scn-row" data-variable="${esc(k)}"><input class="scn-in" data-vname value="${esc(k)}" aria-label="${esc(i18n('maker.campaignEditor.52'))}"><input class="scn-in scn-num" type="number" data-vvalue value="${esc(v)}" aria-label="${esc(i18n('maker.campaignEditor.53'))}"><button type="button" class="scn-x" data-vdel aria-label="${esc(i18n('maker.campaignEditor.54'))}">×</button></div>`).join('')}<button type="button" class="scn-btn" data-vadd>${esc(i18n('maker.campaignEditor.55'))}</button></section>`;
    }
    function scriptForm(path,label) {
        const events=path.endsWith('events'), items=getP(path)||[];
        return `<section class="scn-card"><div class="scn-h">${esc(label)}</div><p class="scn-dim">${events?i18n('maker.campaignEditor.56'):i18n('maker.campaignEditor.57')}</p>${items.map((e,i)=>`<details class="cpg-script" open><summary>${esc(e.title||e.id)}</summary><div class="scn-grid2"><label class="cpg-field">${esc(i18n('sim.history.110'))}<input class="scn-in" data-script-field="${path}.${i}.title" value="${esc(e.title)}"></label><label class="cpg-field">ID<input class="scn-in" data-script-field="${path}.${i}.id" value="${esc(e.id)}"></label></div><label class="cpg-field">${esc(i18n('sim.news.40'))}<textarea class="scn-in" rows="3" data-script-field="${path}.${i}.desc">${esc(e.desc)}</textarea></label>${events?`<label class="cpg-field">${esc(i18n('maker.campaignEditor.58'))}<select class="scn-in" data-script-field="${path}.${i}.presentation"><option value="narrative" ${e.presentation!=='standard'?'selected':''}>${esc(i18n('maker.campaignEditor.59'))}</option><option value="standard" ${e.presentation==='standard'?'selected':''}>${esc(i18n('maker.campaignEditor.60'))}</option></select></label><label class="cpg-field">${esc(i18n('maker.campaignEditor.61'))}<input class="scn-in" data-script-field="${path}.${i}.image" value="${esc(e.image||'')}"></label><div class="scn-row"><label class="scn-btn">${esc(i18n('maker.campaignEditor.62'))}<input type="file" accept="image/*" data-event-image="${path}.${i}.image" hidden></label><button type="button" class="scn-btn" data-event-preview="${path}.${i}">${esc(i18n('maker.campaignEditor.63'))}</button>${e.image?`<img class="cpe-thumb" src="${esc(e.image)}" alt=""><button type="button" class="scn-btn" data-event-clear-image="${path}.${i}.image">${esc(i18n('maker.campaignEditor.64'))}</button>`:''}</div><label class="scn-check"><input type="checkbox" data-script-bool="${path}.${i}.super" ${e.super?'checked':''}>${esc(i18n('maker.campaignEditor.65'))}</label><label class="scn-check"><input type="checkbox" data-script-bool="${path}.${i}.trigger_only" ${e.trigger_only?'checked':''}>${esc(i18n('maker.campaignEditor.66'))}</label><label class="cpg-field">${esc(i18n('maker.campaignEditor.67'))}<select class="scn-in" data-script-field="${path}.${i}.check">${[['date',esc(i18n('maker.campaignEditor.68'))],['election',esc(i18n('maker.campaignEditor.69'))],['world',esc(i18n('maker.campaignEditor.70'))],['any',esc(i18n('maker.campaignEditor.71'))]].map(([v,t])=>`<option value="${v}" ${(e.check||'date')===v?'selected':''}>${t}</option>`).join('')}</select></label>${jsonField(`${path}.${i}.trigger`,esc(i18n('maker.campaignEditor.72')),'cond')}${(e.options||[]).map((o,j)=>`<div class="scn-cond"><label class="cpg-field">${esc(i18n('maker.campaignEditor.73'))} ${j+1}<input class="scn-in" data-script-field="${path}.${i}.options.${j}.text" value="${esc(o.text)}"></label>${jsonField(`${path}.${i}.options.${j}.trigger`,esc(i18n('maker.campaignEditor.74')),'cond')}${jsonField(`${path}.${i}.options.${j}.effects`,esc(i18n('maker.campaignEditor.75')),'eff')}<button type="button" class="scn-btn" data-list-remove="${path}.${i}.options" data-index="${j}">${esc(i18n('maker.campaignEditor.76'))}</button></div>`).join('')}<button type="button" class="scn-btn" data-option-add="${path}.${i}.options">${esc(i18n('maker.campaignEditor.77'))}</button>`:`<label class="cpg-field">${esc(i18n('maker.campaignEditor.78'))}<input class="scn-in" data-script-field="${path}.${i}.category" value="${esc(e.category||'')}"></label>${jsonField(`${path}.${i}.visible`,esc(i18n('maker.campaignEditor.79')),'cond')}${jsonField(`${path}.${i}.available`,esc(i18n('maker.campaignEditor.80')),'cond')}<label class="cpg-field">${esc(i18n('maker.campaignEditor.81'))}<input class="scn-in" data-script-field="${path}.${i}.requirement_text" value="${esc(e.requirement_text||'')}"></label>${window.HemiCampaignOpsEditor&&(S.resources||[]).length?window.HemiCampaignOpsEditor.amountField(opsApi(),`${path}.${i}.cost`,esc(i18n('maker.campaignEditor.82')),e.cost):''}${jsonField(`${path}.${i}.effects`,esc(i18n('maker.campaignEditor.83')),'eff')}<label class="scn-check"><input type="checkbox" data-script-bool="${path}.${i}.once" ${e.once!==false?'checked':''}>${esc(i18n('maker.campaignEditor.84'))}</label><label class="cpg-field">${esc(i18n('maker.campaignEditor.85'))}${timeUnit()})<input class="scn-in" type="number" min="0" data-script-field="${path}.${i}.cooldown_days" value="${esc(e.cooldown_days||0)}"></label>`}<button type="button" class="scn-btn scn-danger" data-list-remove="${path}" data-index="${i}">${events?esc(i18n('sim.scriptmods.5')):esc(i18n('sim.help.63'))} ${esc(i18n('common.delete'))}</button></details>`).join('')}<button type="button" class="scn-btn" data-script-add="${path}">+ ${events?i18n('sim.scriptmods.5'):i18n('sim.help.63')}</button></section>`;
    }
    function bindScriptForms(body) {
        body.querySelectorAll('[data-event-preview]').forEach(b=>b.onclick=()=>{const ev=getP(b.dataset.eventPreview);HemiCampaignEvents.show({...ev,presentation:ev.presentation||'narrative'},{preview:true,modName:S.title});});
        body.querySelectorAll('[data-event-image]').forEach(el=>el.onchange=()=>{if(el.files[0])shrink(el.files[0],1024,url=>{setP(el.dataset.eventImage,url);touch();render();});});
        body.querySelectorAll('[data-event-clear-image]').forEach(b=>b.onclick=()=>{setP(b.dataset.eventClearImage,'');touch();render();});

        body.querySelectorAll('[data-script-field]').forEach(el=>el.oninput=()=>{setP(el.dataset.scriptField,el.type==='number'?Math.max(0,Number(el.value)||0):el.value);touch();});
        body.querySelectorAll('[data-script-bool]').forEach(el=>el.onchange=()=>{setP(el.dataset.scriptBool,el.checked);touch();});
        body.querySelectorAll('[data-list-remove]').forEach(b=>b.onclick=()=>{getP(b.dataset.listRemove).splice(+b.dataset.index,1);touch();render();});
        body.querySelectorAll('[data-option-add]').forEach(b=>b.onclick=()=>{const p=b.dataset.optionAdd;setP(p,[...(getP(p)||[]),{text:i18n('maker.campaignEditor.86'),effects:[]}]);touch();render();});
        body.querySelectorAll('[data-script-add]').forEach(b=>b.onclick=()=>{const p=b.dataset.scriptAdd, event=p.endsWith('events');setP(p,[...(getP(p)||[]),event?{id:uid('ev'),title:i18n('maker.campaignEditor.87'),desc:'',presentation:'narrative',trigger_only:true,options:[{text:i18n('maker.campaignEditor.88'),effects:[]}]}:{id:uid('dc'),title:i18n('maker.campaignEditor.89'),desc:'',cooldown_days:30,effects:[]}]);touch();render();});
        body.querySelectorAll('[data-variable]').forEach(row=>{
            const k=row.dataset.variable;
            row.querySelector('[data-vvalue]').oninput=e=>{if(Number.isFinite(+e.target.value)){S.variables[k]=+e.target.value;touch();}};
            row.querySelector('[data-vname]').onchange=e=>{const next=e.target.value.trim();if(!Tools.idOK(next)||next!==k&&Object.hasOwn(S.variables,next)){e.target.value=k;return;}if(next!==k){S.variables[next]=S.variables[k];delete S.variables[k];touch();render();}};
            row.querySelector('[data-vdel]').onclick=()=>{delete S.variables[k];touch();render();};
        });
        body.querySelector('[data-vadd]')?.addEventListener('click',()=>{S.variables[uid('var')]=0;touch();render();});
    }
    // ---------------------------------------------------------------
    // 화면
    // ---------------------------------------------------------------
    const TABS = [['info', i18n('maker.campaignEditor.90')], ['starts', i18n('maker.campaignEditor.91')], ['focus', i18n('sim.campaign.62')], ['articles', i18n('sim.news.10')], ['events', i18n('sim.scriptmods.5')], ['decisions', i18n('sim.help.63')], ['ops', i18n('maker.campaignEditor.92')], ['crises', i18n('sim.campaign.49')], ['endings', i18n('maker.campaignEditor.93')], ['adv', i18n('maker.campaignEditor.94')]];
    // 국가 운영 탭(js/campaign-editor-ops.js)이 쓰는 편집기 기능
    const opsApi = () => ({ S, getP, setP, touch, render, esc, jsonField, detailMode, uid });
    function studioBar() {
        $('cpStudioBar').innerHTML = `<div><span class="cpe-eyebrow">AUTHORING WORKSPACE</span><b>${esc(S.title || esc(i18n('maker.campaignEditor.95')))}</b></div><span class="scn-grow"></span><span id="cpSaveStatus" role="status">${esc(saveStatus)}</span><button type="button" class="scn-btn" data-history="undo" ${past.length ? '' : 'disabled'} title="${esc(i18n('sim.worldMap.14'))}">↶</button><button type="button" class="scn-btn" data-history="redo" ${future.length ? '' : 'disabled'} title="${esc(i18n('sim.worldMap.15'))}">↷</button><button type="button" class="scn-btn" id="cpValidate">${esc(i18n('maker.campaignEditor.96'))}</button>${modeSeg()}<button type="button" class="scn-btn" id="cpDiscardDraft" ${rawPending.size ? '' : 'hidden'}>${esc(i18n('maker.campaignEditor.97'))}</button>`;
        $('cpStudioBar').querySelectorAll('[data-mode]').forEach(b => b.onclick = () => { detailMode = b.dataset.mode; localStorage.setItem('hemicycleCampaignDetailMode',detailMode); render(); });
        $('cpStudioBar').querySelectorAll('[data-history]').forEach(b => b.onclick = () => historyMove(b.dataset.history));
        $('cpValidate').onclick = showIssues;
        $('cpDiscardDraft').onclick = () => { rawPending.clear(); render(); };
    }
    function historyMove(direction) {
        const from = direction === 'undo' ? past : future, to = direction === 'undo' ? future : past;
        if (!from.length) return;
        to.push(JSON.stringify(S)); S = JSON.parse(from.pop()); baseline = JSON.stringify(S); selFocus = S.focus.some(f=>f.id===selFocus) ? selFocus : null;
        touch(); render();
    }
    function showIssues() {
        const issues = Tools.validate(S);
        // 오류(시험 플레이 전에 고쳐야 함) · 경고 · 확인 필요(정적 검사로는 단정할 수 없음 — 시험 플레이에서 확인)로 나눠, 누르면 그 항목으로 간다
        const LEVELS = [['error', i18n('maker.campaignEditor.98')], ['warning', i18n('maker.campaignEditor.99')], ['check', i18n('maker.campaignEditor.100')]], count = l => issues.filter(i => i.level === l).length;
        const order = l => LEVELS.findIndex(([k]) => k === l);
        const sorted = issues.map((it, n) => [it, n]).sort((a, b) => order(a[0].level) - order(b[0].level) || a[1] - b[1]).map(([it]) => it);
        const head = !issues.length ? i18n('maker.campaignEditor.101') : !count('error') ? i18n('maker.campaignEditor.103', { count: LEVELS.filter(([l]) => count(l)).map(([l, t]) => i18n('maker.campaignEditor.102', { v: t, count: count(l) })).join(' · ') }) : i18n('maker.campaignEditor.104', { count: LEVELS.filter(([l]) => count(l)).map(([l, t]) => i18n('maker.campaignEditor.102', { v: t, count: count(l) })).join(' · ') });
        $('cpIssues').innerHTML = `<div class="cpe-issues"><div class="scn-row"><b>${head}</b><span class="scn-grow"></span><button type="button" class="scn-x" data-close-issues aria-label="${esc(i18n('maker.campaignEditor.105'))}">×</button></div>${sorted.map((i, n)=>{ const where = Tools.describe(S, i.path); return `<button type="button" class="cpe-issue cpe-issue-${i.level}" data-issue="${n}"><span class="cpe-issue-level">${LEVELS.find(([l]) => l === i.level)?.[1] || esc(i18n('maker.campaignEditor.99'))}</span><span class="cpe-issue-text">${where ? `<b>${esc(where)}</b>: ` : ''}${esc(i.message)}</span><code>${esc(i.path)}</code></button>`; }).join('') || `<p class="scn-dim">${esc(i18n('maker.campaignEditor.106'))}</p>`}${issues.length && !count('error') ? `<p class="scn-dim">${esc(i18n('maker.campaignEditor.107'))}</p>` : ''}</div>`;
        $('cpIssues').querySelector('[data-close-issues]').onclick = () => $('cpIssues').replaceChildren();
        $('cpIssues').querySelectorAll('[data-issue]').forEach(b => { b.onclick = () => goToIssue(sorted[+b.dataset.issue].path); });
    }
    // 검사 결과의 위치로 — 그 탭을 열고(방향성 · 격변 · 기사는 그 항목을 고르고) 해당 입력 칸이나 카드로 스크롤한다. 입력 중인 내용은 그대로 둔다
    function goToIssue(path) {
        const parts = String(path).split('.'), root = parts[0], index = Number(parts[1]);
        const nextTab = { starts: 'starts', world: 'starts', focus: 'focus', articles: 'articles', events: 'events', decisions: 'decisions', crises: 'crises', endings: 'endings', variables: 'adv', time: 'info', focusStyle: 'focus', playRules: 'info',
            resources: 'ops', facilities: 'ops', tech: 'ops', units: 'ops', trades: 'ops', buildSlots: 'ops', recruitSlots: 'ops' }[root] || 'info';
        if (nextTab === 'ops' && window.HemiCampaignOpsEditor) window.HemiCampaignOpsEditor.section = { buildSlots: 'facilities', recruitSlots: 'units' }[root] || root;
        if (root === 'focus' && S.focus[index]) selFocus = S.focus[index].id;
        if (root === 'crises' && S.crises[index]) selCrisis = S.crises[index].id;
        if (root === 'articles' && S.articles[index]) selArticle = S.articles[index].id;
        tab = nextTab; render();
        const body = $('cpBody'), tries = [];
        for (let n = parts.length; n >= 2; n--) tries.push(parts.slice(0, n).join('.'));
        let target = null;
        for (const p of tries) { target = body.querySelector(`[data-script-field^="${CSS.escape(p)}"],[data-guide="${CSS.escape(p)}"],[data-json="${CSS.escape(p)}"],[data-guide^="${CSS.escape(p + '.')}"],[data-json^="${CSS.escape(p + '.')}"],[data-ops-field="${CSS.escape(p)}"],[data-amount="${CSS.escape(p)}"],[data-ops-pick="${CSS.escape(p)}"],[data-ops-item="${CSS.escape(p)}"]`); if (target) break; }
        if (!target && root === 'starts') target = parts[2] === 'worldBindings' ? body.querySelector(`[data-wb="${index}"]`) : body.querySelector(`[data-start="${index}"]`);
        if (!target && root === 'world') target = body.querySelector('[data-world-card]');
        if (!target) return;
        const card = target.closest('.cpg-rules, .cpe-json, .scn-cond, details, .scn-card') || target;
        card.scrollIntoView({ block: 'center' }); card.classList.add('cpe-issue-target'); setTimeout(() => card.classList.remove('cpe-issue-target'), 1600);
        if (target.matches('input,textarea,select')) target.focus({ preventScroll: true });
    }
    function render() {
        clearTimeout(redrawT);
        const oldWrap = document.querySelector('.cpe-tree-wrap');
        if (oldWrap) viewScroll = {left:oldWrap.scrollLeft,top:oldWrap.scrollTop};
        treeViewport?.destroy(); treeViewport=null;
        studioBar();
        $('cpTabs').innerHTML = TABS.map(([k, l]) => `<button type="button" class="cpe-tab ${tab === k ? 'on' : ''}" data-tab="${k}">${l}${k === 'focus' ? ` <span class="scn-n">${S.focus.length}</span>` : k === 'crises' ? ` <span class="scn-n">${S.crises.length}</span>` : k === 'articles' ? ` <span class="scn-n">${S.articles.length}</span>` : k === 'endings' ? ` <span class="scn-n">${S.endings.length}</span>` : ''}</button>`).join('');
        $('cpTabs').querySelectorAll('[data-tab]').forEach(b => { b.onclick = () => { tab = b.dataset.tab; render(); }; });
        const body = $('cpBody');
        body.innerHTML = { info: infoHtml, starts: startsHtml, focus: focusHtml, articles: articlesHtml, events:()=>jsonField('events',i18n('maker.campaignEditor.108'),'list',10), decisions:()=>jsonField('decisions',i18n('sim.help.63'),'list',10), ops:()=>window.HemiCampaignOpsEditor?window.HemiCampaignOpsEditor.html(opsApi()):'', crises: crisesHtml, endings: endingsHtml, adv: advHtml }[tab]();
        bindCommon(body);
        bindScriptForms(body);
        HemiCampaignGuide.bind(body, {get:getP,set:setP,touch,render,data:()=>S});
        bindPlayRules(body);
        body.querySelectorAll('[data-go]').forEach(b => b.onclick = () => {tab=b.dataset.go;render();});
        body.querySelectorAll('[data-starter]').forEach(b => b.onclick = async () => {await saveNow(); S=Tools.starter(uid('cmp')); tab='focus';selFocus='opening';resetHistory();touch();render();});
        ({ info: () => {}, starts: bindStarts, focus: bindFocus, articles: bindArticles, events:()=>{}, decisions:()=>{}, ops:()=>{}, crises: bindCrises, endings: bindEndings, adv: () => {} })[tab](body);
        if (window.HemiCampaignOpsEditor) window.HemiCampaignOpsEditor.bind(body, opsApi()); // 자원 양 칸은 결정 탭에도 있다
    }
    const timeUnit=()=>S.time?.mode==='realtime'?i18n('sim.contentDate.7'):i18n('maker.campaignEditor.109');
    function infoHtml() {
        const time=HemiCampaignClock.config(S);
        return `<div class="cpe-cols"><div class="scn-card">
            <div class="scn-h">${esc(i18n('maker.campaignEditor.110'))}</div>
            <label class="scn-lab">${esc(i18n('sim.history.110'))}</label><input class="scn-in scn-title" data-f="title" maxlength="80" value="${esc(S.title)}">
            <div class="scn-grid2"><div><label class="scn-lab">${esc(i18n('sim.mappresets.6'))}</label><input class="scn-in" data-f="author" maxlength="60" value="${esc(S.author)}"></div>
                <div><label class="scn-lab">${esc(i18n('maker.campaignEditor.111'))}</label><input class="scn-in" data-f="version" maxlength="20" value="${esc(S.version)}"></div></div>
            <label class="scn-lab">${esc(i18n('maker.campaignEditor.112'))}</label><input class="scn-in" data-f="description" maxlength="200" value="${esc(S.description)}">
            <label class="scn-lab">${esc(i18n('maker.campaignEditor.113'))}</label><textarea class="scn-in" data-f="lore" rows="12">${esc(S.lore)}</textarea>
        <section class="cpe-time-settings"><div class="scn-h">${esc(i18n('maker.campaignEditor.114'))}</div>
        <label class="cpg-field">${esc(i18n('maker.campaignEditor.115'))}<select class="scn-in" data-time="mode"><option value="turn" ${time.mode==='turn'?'selected':''}>${esc(i18n('maker.campaignEditor.116'))}</option><option value="realtime" ${time.mode==='realtime'?'selected':''}>${esc(i18n('maker.campaignEditor.117'))}</option></select></label>
        <label class="cpg-field">${esc(i18n('maker.campaignEditor.118'))}<input class="scn-in" type="date" min="0001-01-01" max="9999-12-31" data-time="startDate" value="${esc(time.startDate)}"></label>
        ${time.mode==='realtime'?`<div class="scn-grid2"><label class="cpg-field">${esc(i18n('maker.campaignEditor.119'))}<input class="scn-in" type="number" min="0" max="23" step="1" data-time="startHour" value="${time.startHour}"></label><label class="cpg-field">${esc(i18n('maker.campaignEditor.120'))}<select class="scn-in" data-time="defaultSpeed">${[1,2,3,4,5].map(n=>`<option value="${n}" ${time.defaultSpeed===n?'selected':''}>${n}</option>`).join('')}</select></label></div>`:''}
        <p class="scn-dim">${time.mode==='turn'?esc(i18n('maker.campaignEditor.121')):esc(i18n('maker.campaignEditor.122'))} ${esc(i18n('maker.campaignEditor.123'))}</p></section>
        ${playRulesHtml()}</div><div class="scn-card cpe-help">
            <div class="cpe-eyebrow">FROM IDEA TO PLAYABLE STORY</div><h2>${esc(i18n('maker.campaignEditor.124'))}<br>${esc(i18n('maker.campaignEditor.125'))}</h2>
            <p class="scn-dim">${esc(i18n('maker.campaignEditor.126'))}</p>
            <button type="button" class="scn-btn scn-primary" data-starter>${esc(i18n('maker.campaignEditor.127'))}</button>
            <div class="cpe-launch-grid">${[['starts','01',esc(i18n('maker.campaignEditor.91'))],['focus','02',esc(i18n('maker.campaignEditor.128'))],['crises','03',esc(i18n('maker.campaignEditor.129'))],['endings','04',esc(i18n('maker.campaignEditor.130'))]].map(([key,n,title])=>`<button type="button" data-go="${key}"><small>${n}</small><b>${title}</b><span>${esc(i18n('maker.campaignEditor.131'))}</span></button>`).join('')}</div>
            <div class="scn-h">${esc(i18n('maker.campaignEditor.132'))}</div>
            <ol class="cpe-steps">
                <li><b>${esc(i18n('maker.campaignEditor.91'))}</b> ${esc(i18n('maker.campaignEditor.133'))}</li>
                <li><b>${esc(i18n('sim.campaign.62'))}</b> ${esc(i18n('maker.campaignEditor.134'))} <code>${esc(i18n('maker.campaignEditor.22'))}</code>${esc(i18n('maker.campaignEditor.135'))}</li>
                <li><b>${esc(i18n('sim.campaign.49'))}</b> ${esc(i18n('maker.campaignEditor.136'))} <code>add_var</code>${esc(i18n('maker.campaignEditor.137'))} <code>var</code>${esc(i18n('maker.campaignEditor.138'))} <code>${esc(i18n('maker.campaignEditor.24'))}</code>.</li>
                <li><b>${esc(i18n('maker.campaignEditor.93'))}</b> ${esc(i18n('maker.campaignEditor.139'))}</li>
                <li>▶ <b>${esc(i18n('maker.campaignEditor.140'))}</b> ${esc(i18n('maker.campaignEditor.141'))}</li>
            </ol>
            <div class="scn-dim scn-small">${esc(i18n('maker.campaignEditor.142'))}</div>
        </div></div>`;
    }
    function startsHtml() {
        return `<div class="scn-card"><div class="scn-h">${esc(i18n('maker.campaignEditor.91'))} <span class="scn-n">${S.starts.length}</span></div>
            <div class="scn-dim scn-small">${esc(i18n('maker.campaignEditor.143'))}</div>
            ${S.starts.map((s, i) => `<div class="scn-cond" data-start="${i}">
                <div class="scn-row"><input class="scn-in scn-grow" data-sf="name" value="${esc(s.name)}" placeholder="${esc(i18n('maker.campaignEditor.144'))}"><button type="button" class="scn-x" data-del title="${esc(i18n('sim.coup.71'))}">×</button></div>
                <textarea class="scn-in" data-sf="desc" rows="2" placeholder="${esc(i18n('maker.campaignEditor.145'))}">${esc(s.desc)}</textarea>
                <div class="scn-row"><div class="scn-seg"><button type="button" data-kind="preset" class="${s.kind !== 'save' ? 'on' : ''}">${esc(i18n('maker.campaignEditor.146'))}</button><button type="button" data-kind="save" class="${s.kind === 'save' ? 'on' : ''}">${esc(i18n('maker.campaignEditor.147'))}</button></div>
                    ${s.kind === 'save' ? `<button type="button" class="scn-btn" data-pick>${s.state ? esc(i18n('maker.campaignEditor.148')) : esc(i18n('maker.campaignEditor.149'))}</button><span class="scn-dim">${s.state ? `🏛 ${esc(s.state.config?.nationName || s.saveName || esc(i18n('maker.campaignEditor.150')))}` : ''}</span><input type="file" accept=".hemi,.json,application/json" data-file hidden>`
                    : `<select class="scn-in" data-preset>${presets.filter(p => !p.comingSoon).map(p => `<option value="${esc(p.id)}" ${p.id === s.preset ? 'selected' : ''}>${esc(p.title)}${p.date ? ` — ${esc(p.date)}` : ''}</option>`).join('')}</select>`}</div>
            </div>`).join('')}
            <div class="scn-row"><button type="button" class="scn-btn" data-add-start>${esc(i18n('maker.campaignEditor.151'))}</button></div></div>${worldCardHtml()}`;
    }
    // 플레이 규칙 — 플레이어가 화면에서 직접 고치지 못하게 잠글 항목 (지금은 세계지도 영토 · 경제권). 쓰지 않으면 파일에 칸을 만들지 않는다
    const LOCK_LABEL = {
        parties: [i18n('maker.campaignEditor.152'), i18n('maker.campaignEditor.153')],
        seats: [i18n('maker.campaignEditor.154'), i18n('maker.campaignEditor.155')],
        elections: [i18n('maker.campaignEditor.156'), i18n('maker.campaignEditor.157')],
        government: [i18n('maker.campaignEditor.158'), i18n('maker.campaignEditor.159')],
        opinion: [i18n('maker.campaignEditor.160'), i18n('maker.campaignEditor.161')],
        economy: [i18n('maker.campaignEditor.162'), i18n('maker.campaignEditor.163')],
        worldMap: [i18n('maker.campaignEditor.164'), i18n('maker.campaignEditor.165')],
        economicRegions: [i18n('sim.sidenav.2'), i18n('maker.campaignEditor.166')],
    };
    const RULES_PRESET = ['parties', 'seats', 'elections', 'government', 'opinion', 'economy', 'worldMap', 'economicRegions']; // 규칙에 따라 플레이
    function playRulesHtml() {
        const locks = (S.playRules && typeof S.playRules === 'object' && S.playRules.locks && typeof S.playRules.locks === 'object') ? S.playRules.locks : {};
        return `<section class="cpe-time-settings" data-play-rules><div class="scn-h">${esc(i18n('maker.campaignEditor.167'))}</div>
        <p class="scn-dim">${esc(i18n('maker.campaignEditor.168'))}</p>
        <div class="scn-row"><button type="button" class="scn-btn" data-lock-preset="rules">${esc(i18n('maker.campaignEditor.169'))}</button><button type="button" class="scn-btn" data-lock-preset="free">${esc(i18n('maker.campaignEditor.170'))}</button></div>
        ${Tools.LOCKS.map(k => `<label class="scn-check"><input type="checkbox" data-lock="${k}" ${locks[k] === true ? 'checked' : ''}><span><b>${LOCK_LABEL[k][0]}</b> — ${LOCK_LABEL[k][1]}</span></label>`).join('')}</section>`;
    }
    function bindPlayRules(body) {
        body.querySelectorAll('[data-lock-preset]').forEach(b => { b.onclick = () => {
            if (b.dataset.lockPreset === 'rules') S.playRules = { ...(S.playRules && typeof S.playRules === 'object' && !Array.isArray(S.playRules) ? S.playRules : {}), locks: Object.fromEntries(RULES_PRESET.map(k => [k, true])) };
            else if (S.playRules && typeof S.playRules === 'object') { delete S.playRules.locks; if (!Object.keys(S.playRules).length) delete S.playRules; }
            touch(); render();
        }; });
        body.querySelectorAll('[data-play-rules] [data-lock]').forEach(cb => { cb.onchange = () => {
            const rules = S.playRules && typeof S.playRules === 'object' && !Array.isArray(S.playRules) ? S.playRules : (S.playRules = {});
            const locks = rules.locks && typeof rules.locks === 'object' && !Array.isArray(rules.locks) ? rules.locks : (rules.locks = {});
            if (cb.checked) locks[cb.dataset.lock] = true; else delete locks[cb.dataset.lock];
            if (!Object.keys(locks).length) delete rules.locks;
            if (!Object.keys(rules).length) delete S.playRules;
            touch();
        }; });
    }
    // 세계지도 연결 — 영토 조건 · 효과에서 쓸 나라(열쇠)를 정하고, 시작 나라마다 그 세이브의 실제 국가(세계 › 국가 순위)에 연결한다
    const worldCountries = () => (S.world && Array.isArray(S.world.countries) ? S.world.countries : []);
    function worldCardHtml() {
        const list = worldCountries(), cat = Tools.worldCatalog(S);
        return `<div class="scn-card" data-world-card><div class="scn-h">${esc(i18n('maker.campaignEditor.171'))} <span class="scn-n">${list.length}</span></div>
            <div class="scn-dim scn-small">${esc(i18n('maker.campaignEditor.172'))} <b>${esc(i18n('maker.campaignEditor.173'))}</b> ${esc(i18n('maker.campaignEditor.174'))} <b>${esc(i18n('maker.campaignEditor.175'))}</b> ${esc(i18n('maker.campaignEditor.176'))}</div>
            ${list.map((c, i) => `<div class="scn-row" data-wc="${i}"><input class="scn-in" data-wckey value="${esc(c.key)}" placeholder="${esc(i18n('maker.campaignEditor.177'))}" aria-label="${esc(i18n('maker.campaignEditor.178'))}"><input class="scn-in scn-grow" data-wcname value="${esc(c.name || '')}" placeholder="${esc(i18n('maker.campaignEditor.179'))}" aria-label="${esc(i18n('sim.vassals.39'))}"><button type="button" class="scn-x" data-wcdel title="${esc(i18n('sim.coup.71'))}" aria-label="${esc(i18n('maker.campaignEditor.180'))}">×</button></div>`).join('')}
            <div class="scn-row"><button type="button" class="scn-btn" data-wcadd>${esc(i18n('maker.campaignEditor.181'))}</button></div>
            ${list.length ? S.starts.map((s, i) => { const info = cat.starts[i]; return `<div class="scn-cond" data-wb="${i}"><div class="scn-row"><b>${esc(s.name || esc(i18n('maker.campaignEditor.182')))}</b><span class="scn-dim">${!info.hasState ? esc(i18n('maker.campaignEditor.183')) : info.hasMap ? esc(i18n('maker.campaignEditor.184', { regions: info.regions.length, rows: info.rows.length })) : esc(i18n('maker.campaignEditor.185'))}</span></div>
                ${info.hasState ? `<div class="scn-grid2">${list.map(c => { const cur = (s.worldBindings && s.worldBindings[c.key]) || ''; return `<label class="cpg-field"><span>${esc(c.name || c.key)}</span><select class="scn-in" data-wbkey="${esc(c.key)}" aria-label="${esc(i18n('maker.campaignEditor.linkCountry', { name: c.name || c.key }))}"><option value="">${esc(i18n('maker.campaignEditor.186'))}</option>${info.rows.map(r => `<option value="${esc(r.id)}" ${r.id === cur ? 'selected' : ''}>${esc(r.name)}</option>`).join('')}${cur && !info.rows.some(r => r.id === cur) ? `<option value="${esc(cur)}" selected>⚠ ${esc(cur)} ${esc(i18n('maker.campaignEditor.187'))}</option>` : ''}</select></label>`; }).join('')}</div>` : ''}</div>`; }).join('') : ''}</div>`;
    }
    function bindWorldCard(body) {
        const card = body.querySelector('[data-world-card]'); if (!card) return;
        const list = () => { if (!S.world || typeof S.world !== 'object' || Array.isArray(S.world)) S.world = {}; if (!Array.isArray(S.world.countries)) S.world.countries = []; return S.world.countries; };
        card.querySelector('[data-wcadd]').onclick = () => { const l = list(); let n = l.length + 1, key; do { key = 'country' + n++; } while (l.some(c => c.key === key)); l.push({ key, name: '' }); touch(); render(); };
        card.querySelectorAll('[data-wc]').forEach(row => {
            const i = +row.dataset.wc, c = list()[i];
            row.querySelector('[data-wcname]').oninput = e => { c.name = e.target.value; touch(); };
            row.querySelector('[data-wckey]').onchange = e => { const next = e.target.value.trim(); if (next === c.key) return; if (!Tools.renameCountry(S, c.key, next)) { e.target.value = c.key; alertBox(i18n('maker.campaignEditor.188')); return; } touch(); render(); };
            row.querySelector('[data-wcdel]').onclick = () => { list().splice(i, 1); S.starts.forEach(s => { if (s.worldBindings && typeof s.worldBindings === 'object') delete s.worldBindings[c.key]; }); touch(); render(); };
        });
        card.querySelectorAll('[data-wb]').forEach(box => { const s = S.starts[+box.dataset.wb]; box.querySelectorAll('[data-wbkey]').forEach(sel => { sel.onchange = () => { if (!s.worldBindings || typeof s.worldBindings !== 'object' || Array.isArray(s.worldBindings)) s.worldBindings = {}; if (sel.value) s.worldBindings[sel.dataset.wbkey] = sel.value; else delete s.worldBindings[sel.dataset.wbkey]; touch(); }; }); });
    }

    // 방향성 트리 — 왼쪽 그림(끌어서 옮김, 칸에 맞춤), 오른쪽 고른 방향성 칸
    // 상자 크기 · 간격은 시나리오의 중점 디자인(focusStyle)을 따른다 (js/focusview.js)
    let FW = 124, FH = 116, FGX = 22, FGY = 30;
    let FP = 16;
    const fstyle = () => { const st = window.HemiFocusView ? HemiFocusView.style(S) : { width: 150, height: 70, gapX: 26, gapY: 40 }; FW = st.width; FH = st.height; FGX = st.gapX; FGY = st.gapY; FP=HemiFocusView.padding(S,st); return st; };
    const fpos = f => ({ x: FP + (Number(f.x) || 0) * (FW + FGX), y: FP + (Number(f.y) || 0) * (FH + FGY) });
    function focusHtml() {
        const st = fstyle();
        const list = S.focus;
        const cols = Math.max(4, ...list.map(f => (Number(f.x) || 0) + 2)), rows = Math.max(3, ...list.map(f => (Number(f.y) || 0) + 2));
        const W = FP * 2 + cols * (FW + FGX), H = FP * 2 + rows * (FH + FGY);
        let lines = '';
        const byId = id => list.find(f => f.id === id);
        list.forEach(f => {
            const b = fpos(f);
            const link = (id, dash) => { const a = byId(id); if (!a) return; const p = fpos(a); const x1 = p.x + FW / 2, y1 = p.y + FH, x2 = b.x + FW / 2, y2 = b.y, my = (y1 + y2) / 2; lines += `<path d="M${x1},${y1} V${my} H${x2} V${y2}" class="cpe-link" ${dash ? 'stroke-dasharray="5 4"' : ''}/>`; };
            (f.prereq || []).forEach(id => link(id, false)); (f.any || []).forEach(id => link(id, true));
            (f.exclusive || []).forEach(id => { const a = byId(id); if (!a || id < f.id) return; const p = fpos(a); lines += `<line x1="${p.x + FW / 2}" y1="${p.y + FH / 2}" x2="${b.x + FW / 2}" y2="${b.y + FH / 2}" class="cpe-excl"/>`; });
        });
        const f = list.find(x => x.id === selFocus);
        const others = list.filter(x => f && x.id !== f.id);
        const chips = (key) => others.map(o => `<button type="button" class="cpe-chip ${(f[key] || []).includes(o.id) ? 'on' : ''}" data-chip="${key}" data-id="${esc(o.id)}">${esc(o.title || o.id)}</button>`).join('') || `<span class="scn-dim">${esc(i18n('maker.campaignEditor.189'))}</span>`;
        const fs = S.focusStyle || {};
        const design = `<div class="scn-card"><div class="scn-h">${esc(i18n('maker.campaignEditor.190'))}</div><p class="scn-dim">${esc(i18n('maker.campaignEditor.191'))}</p><div class="cpe-style-choices">${[['illustration',esc(i18n('maker.campaignEditor.192')),esc(i18n('maker.campaignEditor.193'))],['default',esc(i18n('maker.campaignEditor.194')),esc(i18n('maker.campaignEditor.195'))],['dossier',esc(i18n('maker.campaignEditor.196')),esc(i18n('maker.campaignEditor.197'))],['medal',esc(i18n('maker.campaignEditor.198')),esc(i18n('maker.campaignEditor.199'))]].map(([k,t,d])=>`<button type="button" data-style-preset="${k}"><b>${t}</b><small>${d}</small></button>`).join('')}</div></div>${detailMode === 'json' ? `<details class="scn-card cpe-design" ${fs.template || fs.css ? 'open' : ''}><summary class="scn-h">${esc(i18n('maker.campaignEditor.200'))} ${fs.template || fs.css ? `<span class="scn-n">${esc(i18n('maker.campaignEditor.201'))}</span>` : `<span class="scn-n">${esc(i18n('maker.campaignEditor.202'))}</span>`}</summary>
            <div class="scn-dim scn-small">${esc(i18n('maker.campaignEditor.203'))} <code>{{icon}}</code> <code>{{iconUrl}}</code> <code>{{title}}</code> <code>{{daysText}}</code> <code>{{days}}</code> <code>{{status}}</code> <code>{{statusText}}</code> <code>{{progress}}</code> <code>{{desc}}</code> <code>{{id}}</code>${esc(i18n('maker.campaignEditor.204'))} <code>${esc(i18n('maker.campaignEditor.205'))}</code>${esc(i18n('maker.campaignEditor.206'))}</div>
            <div class="scn-row"><span class="scn-dim">${esc(i18n('maker.campaignEditor.207'))}</span><input class="scn-in scn-num" type="number" data-fs="width" value="${esc(fs.width ?? '')}" placeholder="124"><span class="scn-dim">${esc(i18n('maker.campaignEditor.208'))}</span><input class="scn-in scn-num" type="number" data-fs="height" value="${esc(fs.height ?? '')}" placeholder="116"><span class="scn-dim">${esc(i18n('maker.campaignEditor.209'))}</span><input class="scn-in scn-num" type="number" data-fs="gapX" value="${esc(fs.gapX ?? '')}" placeholder="22"><input class="scn-in scn-num" type="number" data-fs="gapY" value="${esc(fs.gapY ?? '')}" placeholder="30"></div>
            <label class="scn-lab">${esc(i18n('maker.campaignEditor.210'))}</label><textarea class="scn-in scn-code" rows="3" spellcheck="false" data-fs="template" placeholder='<div class="medal">{{icon}}</div><div class="ribbon">{{title}}</div>'>${esc(fs.template || '')}</textarea>
            <label class="scn-lab">${esc(i18n('maker.campaignEditor.211'))}</label><textarea class="scn-in scn-code" rows="6" spellcheck="false" data-fs="css" placeholder=".hf-node .medal { ... }  .hf-done .medal { ... }">${esc(fs.css || '')}</textarea>
            <div class="scn-row"><button type="button" class="scn-btn" data-fs-example>${esc(i18n('maker.campaignEditor.212'))}</button><button type="button" class="scn-btn" data-fs-reset>${esc(i18n('maker.campaignEditor.213'))}</button><button type="button" class="scn-btn" data-fs-apply>${esc(i18n('maker.campaignEditor.63'))}</button></div></details>` : ''}`;
        return `<div class="cpe-focus"><div class="cpe-focus-left">
            <div class="scn-card cpe-tree-card"><div class="cpe-eyebrow">DIRECTION TREE / DESIGN CANVAS</div><div class="scn-row"><div class="scn-h">${esc(i18n('maker.campaignEditor.214'))}</div><span class="scn-grow"></span><button type="button" class="scn-btn scn-primary" data-add-focus>${esc(i18n('maker.campaignEditor.215'))}</button><button type="button" class="scn-btn" data-branch ${f ? '' : 'disabled'}>${esc(i18n('maker.campaignEditor.218'))}</button><button type="button" class="scn-btn" data-layout>${esc(i18n('maker.campaignEditor.219'))}</button></div>
            <div class="cpe-canvas-tools"><input class="scn-in" id="cpFocusSearch" type="search" placeholder="${esc(i18n('maker.campaignEditor.216'))}" aria-label="${esc(i18n('maker.campaignEditor.217'))}" value="${esc(search)}"><select class="scn-in" id="cpLinkTool" aria-label="${esc(i18n('maker.campaignEditor.220'))}"><option value="">${esc(i18n('maker.campaignEditor.221'))}</option>${[['prereq',esc(i18n('maker.campaignEditor.222'))],['any',esc(i18n('maker.campaignEditor.223'))],['exclusive',esc(i18n('maker.campaignEditor.224'))]].map(([k,t])=>`<option value="${k}" ${linkTool===k?'selected':''}>${t}</option>`).join('')}</select><span class="scn-grow"></span><button type="button" class="scn-btn" data-zoom="out" aria-label="${esc(i18n('sim.union.54'))}">−</button><output id="cpZoomLabel">${Math.round(zoom*100)}%</output><button type="button" class="scn-btn" data-zoom="in" aria-label="${esc(i18n('sim.union.53'))}">+</button><button type="button" class="scn-btn" data-fit>${esc(i18n('sim.campaign.92'))}</button></div>
            ${linkTool ? `<p class="cpe-connect-hint">${f ? i18n('maker.campaignEditor.225', { title: esc(f.title) }) : esc(i18n('maker.campaignEditor.226'))}</p>` : ''}
                <div class="scn-dim scn-small">${esc(i18n('maker.campaignEditor.228'))}</div>
                <div class="cpe-tree-wrap" tabindex="0" aria-label="${esc(i18n('maker.campaignEditor.227'))}"><div class="cpe-tree-scale" style="width:${W*zoom}px;height:${H*zoom}px"><div class="cpe-tree" id="cpeTree" style="width:${W}px;height:${H}px;transform:scale(${zoom});transform-origin:top left;background-size:${FW + FGX}px ${FH + FGY}px">${window.HemiFocusView ? HemiFocusView.styleTag(st, '#cpeTree') : ''}
                    <svg width="${W}" height="${H}" class="cpe-tree-svg">${lines}</svg>
                    ${list.map(x => { const p = fpos(x); return `<button type="button" aria-label="${esc(x.title || x.id)}" aria-pressed="${x.id===selFocus}" title="${esc(x.desc || x.title || x.id)}" class="cpe-node hf-node ${x.id === selFocus ? 'hf-current sel' : 'hf-available'}" data-node="${esc(x.id)}" style="left:${p.x}px;top:${p.y}px;width:${FW}px;height:${FH}px">${window.HemiFocusView ? HemiFocusView.inner(x, { status: x.id === selFocus ? 'current' : 'available', daysText: esc(i18n('maker.campaignEditor.229', { days: Number(x.days) || 0 })) }, st) : esc(x.title || x.id)}</button>`; }).join('')}
                </div></div></div><div class="cpe-canvas-foot"><span>${esc(i18n('maker.campaignEditor.230'))}</span><span>${esc(i18n('maker.campaignEditor.231'))}</span><span class="cpe-red">${esc(i18n('maker.campaignEditor.232'))}</span><span class="scn-grow"></span>${list.length}${esc(i18n('maker.campaignEditor.233'))}</div></div>${design}</div>
            <div class="scn-card cpe-side">${f ? `
                <div class="scn-row"><div class="scn-h">${esc(f.title || esc(i18n('sim.campaign.48')))}</div><span class="scn-grow"></span>${modeSeg()}<button type="button" class="scn-btn" data-duplicate>${esc(i18n('maker.campaignEditor.234'))}</button><button type="button" class="scn-btn scn-danger" data-del-focus>${esc(i18n('sim.history.60'))}</button></div>
                ${detailMode === 'json' ? `<div class="scn-dim scn-small">${esc(i18n('maker.campaignEditor.235'))}</div>${objJson(`focus.${list.indexOf(f)}`, 26)}<button type="button" class="scn-btn scn-primary" data-objapply="focus.${list.indexOf(f)}">${esc(i18n('maker.campaignEditor.236'))}</button>` : `
                <div class="scn-grid2"><div><label class="scn-lab">${esc(i18n('maker.campaignEditor.237'))}</label><input class="scn-in" data-ff="id" value="${esc(f.id)}"></div><div><label class="scn-lab">${esc(i18n('maker.campaignEditor.238'))}</label><div class="scn-row"><input class="scn-in" data-ff="icon" maxlength="4" value="${esc(f.icon || '')}" placeholder="🏛" style="width:60px" ${f.iconImage ? `disabled title="${esc(i18n('maker.campaignEditor.239'))}"` : ''}>${f.iconImage ? `<img class="cpe-icon-prev" src="${esc(f.iconImage)}" alt=""><button type="button" class="scn-x" data-icon-del title="${esc(i18n('maker.campaignEditor.64'))}">×</button>` : ''}<button type="button" class="scn-btn" data-icon-img>${f.iconImage ? esc(i18n('maker.campaignEditor.240')) : esc(i18n('maker.campaignEditor.241'))}</button><input type="file" accept="image/*" data-icon-file hidden></div></div></div>
                <p class="scn-dim">${st.template || st.layout==='classic' ? esc((i18n('maker.campaignEditor.242') + " ")) : ''}${esc(i18n('maker.campaignEditor.243'))}</p>
                <div class="scn-grid2"><label class="cpg-field">${esc(i18n('maker.campaignEditor.244'))}<input class="scn-in" type="number" min="50" max="200" data-art="scale" value="${esc(f.art?.scale ?? 100)}"></label><label class="cpg-field">${esc(i18n('maker.campaignEditor.245'))}<input class="scn-in" type="number" min="-120" max="120" data-art="x" value="${esc(f.art?.x ?? 0)}"></label><label class="cpg-field">${esc(i18n('maker.campaignEditor.246'))}<input class="scn-in" type="number" min="-120" max="120" data-art="y" value="${esc(f.art?.y ?? 0)}"></label><button type="button" class="scn-btn" data-art-reset>${esc(i18n('maker.campaignEditor.247'))}</button></div>
                <label class="scn-lab">${esc(i18n('sim.history.110'))}</label><input class="scn-in" data-ff="title" value="${esc(f.title)}">
                <div class="scn-grid2"><div><label class="scn-lab">${esc(i18n('maker.campaignEditor.248'))} ${timeUnit()}</label><input class="scn-in" type="number" min="0" data-ff="days" value="${esc(f.days)}"></div><div><label class="scn-lab">${esc(i18n('maker.campaignEditor.249'))}</label><input class="scn-in" data-ff="event" value="${esc(f.event || '')}"></div></div>
                <label class="cpg-field">${esc(i18n('maker.campaignEditor.250'))}<select class="scn-in" data-ff="article"><option value="">${esc(i18n('sim.contentVote.16'))}</option>${S.articles.map(a=>`<option value="${esc(a.id)}" ${f.article===a.id?'selected':''}>${esc(a.title||a.id)}</option>`).join('')}</select></label>
                <label class="scn-lab">${esc(i18n('maker.campaignEditor.251'))}</label><textarea class="scn-in" data-ff="desc" rows="3">${esc(f.desc)}</textarea>
                <label class="scn-lab">${esc(i18n('maker.campaignEditor.252'))}</label><div class="cpe-chips">${chips('prereq')}</div>
                <label class="scn-lab">${esc(i18n('maker.campaignEditor.253'))}</label><div class="cpe-chips">${chips('any')}</div>
                <label class="scn-lab">${esc(i18n('maker.campaignEditor.254'))}</label><div class="cpe-chips">${chips('exclusive')}</div>
                ${jsonField(`focus.${list.indexOf(f)}.available`, esc(i18n('maker.campaignEditor.255')), 'cond', 2)}
                ${jsonField(`focus.${list.indexOf(f)}.effects`, esc(i18n('maker.campaignEditor.256')), 'eff', 4)}`}`
            : `<div class="cpe-inspector-empty"><span>⌖</span><h3>${esc(i18n('maker.campaignEditor.257'))}</h3><p>${esc(i18n('maker.campaignEditor.258'))}</p><p>${esc(i18n('maker.campaignEditor.259'))}</p></div>`}</div>
        </div>`;
    }
    function articlesHtml() {
        const list = S.articles;
        const a = list.find(x => x.id === selArticle) || list[0];
        if (a) selArticle = a.id;
        const i = list.indexOf(a);
        const field = (key,label,rows) => `<label class="cpg-field">${label}${rows ? `<textarea class="scn-in" rows="${rows}" data-af="${key}">${esc(a[key] || '')}</textarea>` : `<input class="scn-in" data-af="${key}" value="${esc(a[key] || '')}">`}</label>`;
        return `<div class="cpe-crisis"><section class="scn-card cpe-list"><div class="scn-h">${esc(i18n('sim.campaign.41'))}</div><p class="scn-dim">${esc(i18n('maker.campaignEditor.260'))}</p>${list.map(a => `<button type="button" class="cpe-item ${a.id === selArticle ? 'on' : ''}" style="--c:var(--tno-neon)" data-article="${esc(a.id)}">${esc(a.title || a.id)}</button>`).join('') || `<p class="scn-dim">${esc(i18n('maker.campaignEditor.261'))}</p>`}<button type="button" class="scn-btn" data-add-article>${esc(i18n('maker.campaignEditor.262'))}</button></section>
        ${a ? `<section class="scn-card cpe-crisis-main"><div class="scn-row"><div class="scn-h">${esc(a.title || esc(i18n('sim.news.32')))}</div><span class="scn-grow"></span>${modeSeg()}<button type="button" class="scn-btn" data-article-preview>${esc(i18n('maker.campaignEditor.63'))}</button><button type="button" class="scn-btn scn-danger" data-del-article>${esc(i18n('common.delete'))}</button></div>
        ${detailMode === 'json' ? `${objJson(`articles.${i}`,24)}<button type="button" class="scn-btn scn-primary" data-objapply="articles.${i}">${esc(i18n('maker.campaignEditor.263'))}</button>` : `
        <div class="scn-grid2">${field('title',esc(i18n('sim.history.110')))}${field('id',esc(i18n('maker.campaignEditor.264')))}</div>
        ${field('subtitle',esc(i18n('maker.campaignEditor.265')))}${field('source',esc(i18n('maker.campaignEditor.266')))}
        ${field('body',esc(i18n('sim.news.40')),10)}
        <div class="scn-row"><button type="button" class="scn-btn" data-article-img>${a.image ? esc(i18n('maker.campaignEditor.240')) : esc(i18n('maker.campaignEditor.267'))}</button>${a.image ? `<img class="cpe-thumb" src="${esc(a.image)}" alt=""><button type="button" class="scn-btn" data-article-img-del>${esc(i18n('maker.campaignEditor.64'))}</button>` : ''}<input type="file" accept="image/*" data-article-img-file hidden></div>
        <label class="cpg-field">${esc(i18n('maker.campaignEditor.268'))}<select class="scn-in" data-article-when>${[['start',esc(i18n('maker.campaignEditor.269'))],['focus',esc(i18n('maker.campaignEditor.270'))],['date',esc(i18n('maker.campaignEditor.271'))],['condition',esc(i18n('maker.campaignEditor.272'))],['manual',esc(i18n('maker.campaignEditor.273'))]].map(([k,t])=>`<option value="${k}" ${a.when===k?'selected':''}>${t}</option>`).join('')}</select></label>
        ${a.when === 'focus' ? `<label class="cpg-field">${esc(i18n('maker.campaignEditor.274'))}<select class="scn-in" data-article-focus><option value="">${esc(i18n('maker.campaignEditor.275'))}</option>${S.focus.map(f=>`<option value="${esc(f.id)}" ${a.focus===f.id?'selected':''}>${esc(f.title||f.id)}</option>`).join('')}</select></label>` : ''}
        ${a.when === 'date' ? field('date',esc(i18n('maker.campaignEditor.276'))) : ''}
        ${a.when !== 'manual' ? jsonField(`articles.${i}.trigger`,a.when==='condition'?esc(i18n('maker.campaignEditor.277')):esc(i18n('maker.campaignEditor.278')),'cond') : `<p class="scn-dim">${esc(i18n('maker.campaignEditor.279'))}</p>`}
        <p class="scn-dim">${esc(i18n('maker.campaignEditor.280'))}</p>`}</section>` : `<section class="scn-card"><div class="scn-h">${esc(i18n('maker.campaignEditor.281'))}</div><p class="scn-dim">${esc(i18n('maker.campaignEditor.282'))}</p></section>`}</div>`;
    }
    function bindArticles(body) {
        body.querySelector('[data-add-article]').onclick = () => {
            const a = {id:uid('news'),title:i18n('sim.news.32'),subtitle:'',source:i18n('maker.campaignEditor.283'),body:'',image:'',when:'manual'};
            S.articles.push(a);selArticle=a.id;touch();render();
        };
        body.querySelectorAll('[data-article]').forEach(b=>b.onclick=()=>{selArticle=b.dataset.article;render();});
        const a = S.articles.find(a=>a.id===selArticle);if(!a)return;
        body.querySelector('[data-del-article]').onclick=async()=>{
            if(!await confirmBox(i18n('maker.campaignEditor.284')))return;
            S.articles=S.articles.filter(x=>x!==a);S.focus.forEach(f=>{if(f.article===a.id)delete f.article;});selArticle=null;touch();render();
        };
        body.querySelector('[data-article-preview]').onclick=()=>HemiCampaignArticles.show(a,{preview:true,date:a.date||i18n('maker.campaignEditor.285')});
        body.querySelectorAll('[data-af]').forEach(inp=>{
            const key=inp.dataset.af;
            const update=()=>{if(key==='id'){
                const id=inp.value.trim();if(!Tools.idOK(id)||S.articles.some(x=>x!==a&&x.id===id)){inp.value=a.id;return;}
                S.focus.forEach(f=>{if(f.article===a.id)f.article=id;});a.id=id;selArticle=id;
            }else a[key]=inp.value;touch();};
            if(key==='id')inp.onchange=update;else inp.oninput=update;
        });
        body.querySelector('[data-article-when]')?.addEventListener('change',e=>{a.when=e.target.value;touch();render();});
        body.querySelector('[data-article-focus]')?.addEventListener('change',e=>{a.focus=e.target.value;touch();});
        const fi=body.querySelector('[data-article-img-file]');
        body.querySelector('[data-article-img]')?.addEventListener('click',()=>fi.click());
        fi?.addEventListener('change',()=>{const file=fi.files?.[0];fi.value='';if(file)shrink(file,1200,url=>{a.image=url;touch();render();});});
        body.querySelector('[data-article-img-del]')?.addEventListener('click',()=>{delete a.image;touch();render();});
    }

    function crisesHtml() {
        const c = S.crises.find(x => x.id === selCrisis) || S.crises[0];
        if (c) selCrisis = c.id;
        const ci = S.crises.indexOf(c);
        const rowsOf = (key, cols) => (c[key] || []).map((r, i) => `<div class="scn-cond" data-row="${key}" data-i="${i}">${cols(r, i)}</div>`).join('');
        return `<div class="cpe-crisis">
            <div class="scn-card cpe-list"><div class="scn-h">${esc(i18n('sim.campaign.49'))}</div>
                ${S.crises.map(x => `<button type="button" class="cpe-item ${x === c ? 'on' : ''}" data-crisis="${esc(x.id)}" style="--c:${esc(x.color || '#e5484d')}">${esc(x.title || x.id)}</button>`).join('') || `<div class="scn-dim">${esc(i18n('maker.campaignEditor.286'))}</div>`}
                <div class="scn-row"><button type="button" class="scn-btn" data-add-crisis>${esc(i18n('maker.campaignEditor.287'))}</button></div>
                <div class="scn-dim scn-small">${esc(i18n('maker.campaignEditor.288'))}</div></div>
            ${c && detailMode === 'json' ? `<div class="cpe-crisis-main"><div class="scn-card"><div class="scn-row"><div class="scn-h">${esc(i18n('maker.campaignEditor.289'))}</div><span class="scn-grow"></span>${modeSeg()}<button type="button" class="scn-btn scn-danger" data-del-crisis>${esc(i18n('maker.campaignEditor.290'))}</button></div>
                <div class="scn-dim scn-small">${esc(i18n('maker.campaignEditor.291'))}</div>${objJson(`crises.${ci}`, 40)}<button type="button" class="scn-btn scn-primary" data-objapply="crises.${ci}">${esc(i18n('maker.campaignEditor.292'))}</button></div></div>` : ''}
            ${c && detailMode !== 'json' ? `<div class="cpe-crisis-main">
                <div class="scn-card"><div class="scn-row"><div class="scn-h">${esc(i18n('sim.campaign.49'))}</div><span class="scn-grow"></span>${modeSeg()}<button type="button" class="scn-btn scn-danger" data-del-crisis>${esc(i18n('maker.campaignEditor.290'))}</button></div>
                    <div class="scn-grid2"><div><label class="scn-lab">${esc(i18n('maker.campaignEditor.293'))}</label><input class="scn-in" data-cf="id" value="${esc(c.id)}"></div><div><label class="scn-lab">${esc(i18n('sim.main.25'))}</label><input class="scn-in" type="color" data-cf="color" value="${esc(c.color || '#e5484d')}"></div></div>
                    <label class="scn-lab">${esc(i18n('sim.history.110'))}</label><input class="scn-in" data-cf="title" value="${esc(c.title)}">
                    <label class="scn-lab">${esc(i18n('maker.campaignEditor.294'))}</label><textarea class="scn-in" data-cf="desc" rows="4">${esc(c.desc)}</textarea>
                    <div class="scn-row"><button type="button" class="scn-btn" data-img>${c.image ? esc(i18n('maker.campaignEditor.240')) : esc(i18n('maker.campaignEditor.267'))}</button>${c.image ? `<img class="cpe-thumb" src="${esc(c.image)}" alt=""><button type="button" class="scn-btn" data-img-del>${esc(i18n('maker.campaignEditor.64'))}</button>` : ''}<input type="file" accept="image/*" data-img-file hidden></div>
                    <div class="scn-grid2"><div><label class="scn-lab">${esc(i18n('maker.campaignEditor.295'))}</label><input class="scn-in" data-cf="date" value="${esc(c.date || '')}"></div><div><label class="scn-lab">${esc(i18n('maker.campaignEditor.296'))}</label><input class="scn-in" data-cf="intro" value="${esc(c.intro || '')}"></div></div>
                    ${jsonField(`crises.${ci}.trigger`, esc(i18n('maker.campaignEditor.297')), 'cond', 2)}
                    ${jsonField(`crises.${ci}.onStart`, esc(i18n('maker.campaignEditor.298')), 'eff', 2)}</div>
                <div class="scn-card"><div class="scn-h">${esc(i18n('maker.campaignEditor.299'))} <span class="scn-n">${(c.meters || []).length}</span></div>
                    <div class="scn-dim scn-small">${esc(i18n('maker.campaignEditor.300'))} <code>{ "add_var": { "name": "id", "value": 10 } }</code>${esc(i18n('maker.campaignEditor.301'))} <code>{ "var": { "name": "id", "gte": 100 } }</code>${esc(i18n('maker.campaignEditor.302'))}</div>
                    ${rowsOf('meters', r => `<div class="scn-row"><input class="scn-in" data-rf="id" value="${esc(r.id)}" placeholder="id" style="width:110px"><input class="scn-in scn-grow" data-rf="name" value="${esc(r.name)}" placeholder="${esc(i18n('sim.contentDate.11'))}"><input class="scn-in" type="color" data-rf="color" value="${esc(r.color || '#e5484d')}"><button type="button" class="scn-x" data-del-row>×</button></div>
                        <div class="scn-row"><span class="scn-dim">${esc(i18n('maker.campaignEditor.303'))}</span><input class="scn-in scn-num" type="number" data-rf="start" value="${esc(r.start)}"><span class="scn-dim">${esc(i18n('maker.campaignEditor.304'))}</span><input class="scn-in scn-num" type="number" data-rf="min" value="${esc(r.min ?? 0)}"><span class="scn-dim">${esc(i18n('maker.campaignEditor.305'))}</span><input class="scn-in scn-num" type="number" data-rf="max" value="${esc(r.max ?? 100)}"><span class="scn-dim">${esc(i18n('maker.campaignEditor.306'))}</span><input class="scn-in scn-num" type="number" step="any" data-rf="perMonth" value="${esc(r.perMonth || 0)}"></div>`)}
                    <div class="scn-row"><button type="button" class="scn-btn" data-add-row="meters">${esc(i18n('maker.campaignEditor.307'))}</button></div></div>
                <div class="scn-card"><div class="scn-h">${esc(i18n('maker.campaignEditor.308'))} <span class="scn-n">${(c.missions || []).length}</span></div>
                    <div class="scn-dim scn-small">${esc(i18n('maker.campaignEditor.309'))}</div>
                    ${rowsOf('missions', (r, i) => `<div class="scn-row"><input class="scn-in scn-grow" data-rf="title" value="${esc(r.title)}" placeholder="${esc(i18n('maker.campaignEditor.310'))}"><span class="scn-dim">${esc(i18n('maker.campaignEditor.311'))}</span><input class="scn-in scn-num" type="number" data-rf="days" value="${esc(r.days)}"><span class="scn-dim">${timeUnit()}</span><button type="button" class="scn-x" data-del-row>×</button></div>
                        <input class="scn-in" data-rf="desc" value="${esc(r.desc || '')}" placeholder="${esc(i18n('sim.worldMap.57'))}">
                        ${jsonField(`crises.${ci}.missions.${i}.condition`, esc(i18n('maker.campaignEditor.312')), 'cond', 2)}
                        <div class="scn-grid2">${jsonField(`crises.${ci}.missions.${i}.success`, esc(i18n('maker.campaignEditor.313')), 'eff', 2)}${jsonField(`crises.${ci}.missions.${i}.fail`, esc(i18n('maker.campaignEditor.314')), 'eff', 2)}</div>
                        <label class="scn-check"><input type="checkbox" data-rb="later" ${r.later ? 'checked' : ''}> ${esc(i18n('maker.campaignEditor.315'))}</label>${r.later ? jsonField(`crises.${ci}.missions.${i}.start`, esc(i18n('maker.campaignEditor.316')), 'cond', 2) : ''}`)}
                    <div class="scn-row"><button type="button" class="scn-btn" data-add-row="missions">${esc(i18n('maker.campaignEditor.317'))}</button></div></div>
                <div class="scn-card"><div class="scn-h">${esc(i18n('maker.campaignEditor.93'))} <span class="scn-n">${(c.outcomes || []).length}</span></div>
                    <div class="scn-dim scn-small">${esc(i18n('maker.campaignEditor.318'))} <code>crisis_${esc(c.id)}${esc(i18n('maker.campaignEditor.319'))}</code>${esc(i18n('maker.campaignEditor.135'))}</div>
                    ${rowsOf('outcomes', (r, i) => `<div class="scn-row"><input class="scn-in" data-rf="id" value="${esc(r.id)}" placeholder="id" style="width:110px"><input class="scn-in scn-grow" data-rf="title" value="${esc(r.title)}" placeholder="${esc(i18n('maker.campaignEditor.320'))}"><button type="button" class="scn-x" data-del-row>×</button></div>
                        <textarea class="scn-in" data-rf="text" rows="2" placeholder="${esc(i18n('maker.campaignEditor.321'))}">${esc(r.text || '')}</textarea>
                        <div class="scn-grid2">${jsonField(`crises.${ci}.outcomes.${i}.condition`, esc(i18n('maker.campaignEditor.322')), 'cond', 2)}${jsonField(`crises.${ci}.outcomes.${i}.effects`, esc(i18n('maker.campaignEditor.323')), 'eff', 2)}</div>`)}
                    <div class="scn-row"><button type="button" class="scn-btn" data-add-row="outcomes">${esc(i18n('maker.campaignEditor.324'))}</button></div></div>
                <div class="scn-card"><div class="scn-h">${esc(i18n('maker.campaignEditor.325'))}</div>
                    <div class="scn-dim scn-small">${esc(i18n('maker.campaignEditor.326'))} <code>"super": true</code>${esc(i18n('maker.campaignEditor.327'))} <code>image</code> · <code>quote</code> · <code>quote_author</code>).</div>
                    ${jsonField(`crises.${ci}.events`, esc(i18n('maker.campaignEditor.328')), 'list', 8)}
                    ${jsonField(`crises.${ci}.decisions`, esc(i18n('maker.campaignEditor.329')), 'list', 6)}
                    <div class="scn-row"><button type="button" class="scn-btn" data-crisis-example>${esc(i18n('maker.campaignEditor.330'))}</button></div></div>
            </div>` : ''}
        </div>`;
    }
    function endingsHtml() {
        return `<div class="scn-card"><div class="scn-h">${esc(i18n('maker.campaignEditor.331'))} <span class="scn-n">${S.endings.length}</span></div>
            <div class="scn-dim scn-small">${esc(i18n('maker.campaignEditor.332'))}</div>
            ${S.endings.map((e, i) => `<div class="scn-cond" data-ending="${i}"><div class="scn-row"><input class="scn-in" data-ef="id" value="${esc(e.id)}" style="width:110px"><input class="scn-in scn-grow" data-ef="title" value="${esc(e.title)}" placeholder="${esc(i18n('maker.campaignEditor.320'))}"><button type="button" class="scn-x" data-del>×</button></div>
                <textarea class="scn-in" data-ef="text" rows="3" placeholder="${esc(i18n('maker.campaignEditor.321'))}">${esc(e.text || '')}</textarea>${jsonField(`endings.${i}.condition`, esc(i18n('maker.campaignEditor.322')), 'cond', 2)}</div>`).join('')}
            <div class="scn-row"><button type="button" class="scn-btn" data-add-ending>${esc(i18n('maker.campaignEditor.324'))}</button></div></div>`;
    }
    function advHtml() {
        return `<div class="scn-card"><div class="scn-h">${esc(i18n('maker.campaignEditor.333'))}</div>
            <div class="scn-dim scn-small">${esc(i18n('maker.campaignEditor.334'))}</div>
            ${jsonField('variables', esc(i18n('maker.campaignEditor.335')), 'obj', 3)}
            <button type="button" class="scn-btn" data-go="events">${esc(i18n('maker.campaignEditor.336'))}</button>
            <button type="button" class="scn-btn" data-go="decisions">${esc(i18n('maker.campaignEditor.337'))}</button> <button type="button" class="scn-btn" data-go="ops">${esc(i18n('maker.campaignEditor.338'))}</button></div>
            ${detailMode === 'json' ? `<div class="scn-card"><div class="scn-h">${esc(i18n('maker.campaignEditor.339'))}</div>
                <div class="scn-dim scn-small">${esc(i18n('maker.campaignEditor.340'))}</div>
                <textarea class="scn-in scn-code cpe-objjson" rows="30" spellcheck="false" data-wholejson>${esc(JSON.stringify(wholeView(), null, 2))}</textarea><div class="scn-err" data-wholeerr></div>
                <div class="scn-row"><button type="button" class="scn-btn scn-primary" data-whole-apply>${esc(i18n('maker.campaignEditor.341'))}</button><span class="scn-dim">${esc(i18n('maker.campaignEditor.342'))}</span></div></div>` : ''}`;
    }
    // 전체 JSON 보기 — 시작 세이브(state)는 빼고 표시만
    function wholeView() { const d = JSON.parse(JSON.stringify(S)); (d.starts || []).forEach(st => { if (st.state) st.state = i18n('maker.campaignEditor.343'); }); return hideImgs(d); }

    // ---------------------------------------------------------------
    // 묶기
    // ---------------------------------------------------------------
    function bindCommon(body) {
        body.querySelectorAll('[data-mode]').forEach(b => { b.onclick = () => { detailMode = b.dataset.mode; try { localStorage.setItem('hemicycleCampaignDetailMode', detailMode); } catch (e) { /* 무시 */ } render(); }; });
        body.querySelectorAll('[data-objjson]').forEach(ta => {
            const p = ta.dataset.objjson, err = body.querySelector(`[data-objerr="${CSS.escape(p)}"]`);
            ta.oninput = () => { rawPending.add(p); $('cpDiscardDraft').hidden=false; try { JSON.parse(ta.value); if(err)err.textContent=i18n('maker.campaignEditor.344'); } catch(e){if(err)err.textContent=(i18n('maker.campaignEditor.345') + " ")+e.message;} };
            body.querySelector(`[data-objapply="${CSS.escape(p)}"]`).onclick = () => {
                try {
                    const v=showImgs(JSON.parse(ta.value));
                    const draft=Tools.clone(S), [kind,idx]=p.split('.'), old=draft[kind][+idx];
                    if (!v || typeof v!=='object' || Array.isArray(v)) throw Error(i18n('maker.campaignEditor.346'));
                    if(kind==='focus' && old.id!==v.id) { if(!Tools.renameFocus(draft,old.id,v.id)) throw Error(i18n('maker.campaignEditor.347')); ['prereq','any','exclusive'].forEach(k=>{v[k]=(v[k]||[]).map(id=>id===old.id?v.id:id);}); }
                    if(kind==='articles'&&old.id!==v.id)draft.focus.forEach(f=>{if(f.article===old.id)f.article=v.id;});
                    draft[kind][+idx]=v;
                    const errors=Tools.validate(draft).filter(i=>i.level==='error'); if(errors.length)throw Error(errors.map(i=>i.path+': '+i.message).join(' / '));
                    S=draft; if(kind==='focus')selFocus=v.id;else if(kind==='articles')selArticle=v.id;else selCrisis=v.id;
                    rawPending.delete(p);touch();render();
                }catch(e){err.textContent=(i18n('maker.campaignEditor.348') + " ")+e.message;}
            };
        });
        const whole = body.querySelector('[data-wholejson]');
        if (whole) {
            const err = body.querySelector('[data-wholeerr]');
            let parsed = null;
            whole.oninput = () => { rawPending.add('whole'); $('cpDiscardDraft').hidden=false; try { const v = showImgs(JSON.parse(whole.value)); if (!v || v.format !== FORMAT) throw new Error(i18n('maker.campaignEditor.349', { FORMAT })); parsed = v; err.textContent = ''; } catch (e) { parsed = null; err.textContent = (i18n('maker.campaignEditor.345') + " ") + e.message; } };
            body.querySelector('[data-whole-apply]').onclick = () => {
                if (!parsed) { whole.oninput(); if (!parsed) return; }
                const states = new Map((S.starts || []).filter(st => st.state).map(st => [st.id, st.state]));
                const n = {...parsed};
                if(!Array.isArray(n.starts)||n.starts.some(st=>!st||typeof st!=='object'||Array.isArray(st))){err.textContent=i18n('maker.campaignEditor.350');return;}
                n.starts.forEach(st => { if (typeof st.state === 'string') { if (states.has(st.id)) st.state = states.get(st.id); else delete st.state; } });
                const errors=Tools.validate(n).filter(i=>i.level==='error'); if(errors.length){err.textContent=errors.map(i=>i.path+': '+i.message).join(' / ');return;}
                S = normalize(n); rawPending.delete('whole'); selFocus = null; selCrisis = null; touch(); render();
            };
        }
        body.querySelectorAll('[data-time]').forEach(el=>el.onchange=()=>{
            const key=el.dataset.time;S.time={...HemiCampaignClock.config(S),[key]:['startHour','defaultSpeed'].includes(key)?Number(el.value):el.value};touch();if(key==='mode')render();
        });
        body.querySelectorAll('[data-f]').forEach(inp => { inp.oninput = () => { S[inp.dataset.f] = inp.value; touch(); }; });
        body.querySelectorAll('[data-json]').forEach(ta => { ta.oninput = () => {
            const p = ta.dataset.json, kind = ta.dataset.kind, err = body.querySelector(`[data-err="${CSS.escape(p)}"]`);
            const raw = ta.value.trim();
            try {
                let v = raw ? JSON.parse(raw) : (kind === 'cond' ? null : kind === 'obj' ? {} : []);
                if (kind === 'eff' && v && !Array.isArray(v)) v = [v];
                if ((kind === 'list' || kind === 'eff') && !Array.isArray(v)) throw new Error(i18n('maker.campaignEditor.351'));
                if (kind === 'obj' && (!v || typeof v !== 'object' || Array.isArray(v))) throw new Error(i18n('maker.campaignEditor.352'));
                if(kind==='list' && v.some(x=>!x || typeof x!=='object' || Array.isArray(x)))throw Error(i18n('maker.campaignEditor.353'));
                if(kind==='obj' && Object.values(v).some(x=>!Number.isFinite(x)))throw Error(i18n('maker.campaignEditor.354'));
                setP(p, v); rawPending.delete(p); if (err) err.textContent = ''; touch();
            } catch (e) { rawPending.add(p); $('cpDiscardDraft').hidden=false; if (err) err.textContent = (i18n('maker.campaignEditor.345') + " ") + e.message; }
        }; });
        body.querySelectorAll('[data-snip]').forEach(sel => { sel.onchange = () => {
            const i = sel.value; if (i === '') return;
            const p = sel.dataset.snip, kind = sel.dataset.kind;
            const snip = JSON.parse(JSON.stringify((kind === 'cond' ? COND_SNIP : EFF_SNIP)[+i][1]));
            const cur = getP(p);
            if (kind === 'eff') setP(p, [...(Array.isArray(cur) ? cur : []), snip]);
            else setP(p, cur && typeof cur === 'object' && Object.keys(cur).length ? { all: [cur, snip] } : snip);
            touch(); render();
        }; });
    }
    function bindStarts(body) {
        body.querySelectorAll('[data-start]').forEach(row => {
            const i = +row.dataset.start, s = S.starts[i];
            row.querySelectorAll('[data-sf]').forEach(inp => { inp.oninput = () => { s[inp.dataset.sf] = inp.value; touch(); }; });
            row.querySelector('[data-del]').onclick = () => { if (S.starts.length <= 1) { alertBox(i18n('maker.campaignEditor.355')); return; } S.starts.splice(i, 1); render(); touch(); };
            row.querySelectorAll('[data-kind]').forEach(b => { b.onclick = () => { s.kind = b.dataset.kind; if (s.kind === 'preset' && !s.preset) s.preset = 'builtin:tutorial'; render(); touch(); }; });
            row.querySelector('[data-preset]')?.addEventListener('change', e => { s.preset = e.target.value; touch(); });
            const fi = row.querySelector('[data-file]');
            row.querySelector('[data-pick]')?.addEventListener('click', () => fi.click());
            fi?.addEventListener('change', async () => {
                const f = fi.files && fi.files[0]; fi.value = ''; if (!f) return;
                try { const obj = JSON.parse(window.HemiFile ? await window.HemiFile.readText(f) : await f.text()); if (!obj || !Array.isArray((obj.parliament || obj.data || {}).parties)) throw new Error('x');
                    s.state = obj; s.saveName = f.name.replace(/\.(hemi|json)$/i, ''); if (!s.name || s.name === '기본 시작' || s.name === i18n('maker.campaignEditor.4')) s.name = obj.config?.nationName || s.saveName; render(); touch(); }
                catch (e) { alertBox(i18n('maker.campaignEditor.356')); }
            });
        });
        body.querySelector('[data-add-start]').onclick = () => { S.starts.push({ id: uid('s'), name: '', desc: '', kind: 'preset', preset: 'builtin:tutorial' }); render(); touch(); };        bindWorldCard(body);
    }
    function connectFocus(targetId) {
        if (!selFocus) {selFocus=targetId;render();return;}
        if(selFocus===targetId)return;
        const source=S.focus.find(f=>f.id===selFocus),target=S.focus.find(f=>f.id===targetId),before=Tools.clone(S);
        // Source is a predecessor of target. Exclusive relationships are symmetric.
        const owner=linkTool==='exclusive'?source:target, id=linkTool==='exclusive'?target.id:source.id;
        const list=owner[linkTool]||[]; owner[linkTool]=list.includes(id)?list.filter(x=>x!==id):[...list,id];
        if(linkTool==='exclusive'){const x=target.exclusive||[];target.exclusive=source.exclusive.includes(target.id)?[...new Set([...x,source.id])]:x.filter(id=>id!==source.id);}
        const errs=Tools.validate(S).filter(i=>i.level==='error'&&i.path.startsWith('focus'));
        if(errs.length){S=before;alertBox(errs[0].message);return;}
        touch();render();
    }
    function bindCanvas(body) {
        const selected=()=>S.focus.find(f=>f.id===selFocus);
        body.querySelectorAll('[data-style-preset]').forEach(b=>b.onclick=()=>{
            const key=b.dataset.stylePreset;
            if(key==='illustration')delete S.focusStyle;
            else if(key==='default')S.focusStyle=Tools.clone(HemiFocusView.CLASSIC);
            else if(key==='medal')S.focusStyle=Tools.clone(HemiFocusView.EXAMPLE);
            else S.focusStyle={width:150,height:128,gapX:38,gapY:44,
                template:'<div class="dossier-icon">{{icon}}</div><div class="dossier-title">{{title}}</div><small>{{daysText}} · {{statusText}}</small>',
                css:'.hf-node { padding: 10px; border: 1px solid #466b70; background: #132329; color: #bedfdc; box-shadow: inset 0 3px #6fa99f; } .dossier-icon { height: 62px; display:flex; align-items:center; justify-content:center; } .dossier-icon img {width:54px;height:54px;object-fit:contain;} .dossier-icon span {font-size:34px;} .dossier-title {font-size:12px;font-weight:bold;} .hf-node small {font-size:10px;opacity:.75;} .hf-current {border-color:#efc86f;background:#333123;} .hf-done {border-color:#70c6a0;background:#16392d;} .hf-locked,.hf-blocked {filter:grayscale(1);opacity:.55;}'};
            touch();render();
        });
        body.querySelector('[data-layout]').onclick=()=>{Tools.layout(S.focus);touch();render();};
        body.querySelector('[data-duplicate]')?.addEventListener('click',()=>{
            const f=selected(),n=Tools.clone(f);n.id=uid('f');n.title=(f.title||f.id)+(" " + i18n('maker.campaignEditor.357'));n.exclusive=[];
            while(S.focus.some(x=>x.x===n.x&&x.y===n.y))n.x=(n.x||0)+1;
            S.focus.push(n);selFocus=n.id;touch();render();
        });
        body.querySelector('[data-branch]').onclick=()=>{
            const p=selected();if(!p)return;
            const free=(x,y)=>{while(S.focus.some(f=>f.x===x&&f.y===y))x++;return {x,y};};
            const a={id:uid('f'),title:i18n('maker.campaignEditor.358'),icon:'🕊',days:35,desc:i18n('maker.campaignEditor.359'),...free(Math.max(0,(p.x||0)-1),(p.y||0)+1),prereq:[p.id],any:[],exclusive:[],effects:[]};
            S.focus.push(a);
            const b={...Tools.clone(a),id:uid('f'),title:i18n('maker.campaignEditor.360'),icon:'🛡',...free((p.x||0)+1,(p.y||0)+1),exclusive:[a.id]};a.exclusive=[b.id];S.focus.push(b);selFocus=a.id;touch();render();
        };
        const tree=$('cpeTree'),wrap=body.querySelector('.cpe-tree-wrap');
        treeViewport=HemiTreeViewport.mount(wrap,tree,{
            zoom,left:viewScroll.left,top:viewScroll.top,
            onChange:view=>{zoom=view.zoom;viewScroll={left:view.left,top:view.top};$('cpZoomLabel').textContent=Math.round(zoom*100)+'%';}
        });
        body.querySelectorAll('[data-zoom]').forEach(b=>b.onclick=()=>treeViewport.zoomBy(b.dataset.zoom==='in'?.15:-.15));
        body.querySelector('[data-fit]').onclick=()=>treeViewport.fit();
        $('cpLinkTool').onchange=e=>{linkTool=e.target.value;render();};
        const applySearch=()=>tree.querySelectorAll('[data-node]').forEach(n=>{const f=S.focus.find(f=>f.id===n.dataset.node);n.classList.toggle('cpe-search-dim',!!search&&!`${f.title} ${f.id}`.toLowerCase().includes(search.toLowerCase()));});
        $('cpFocusSearch').oninput=e=>{search=e.target.value;applySearch();};
        $('cpFocusSearch').onkeydown=e=>{if(e.key==='Enter'){const n=tree.querySelector('[data-node]:not(.cpe-search-dim)');if(n){selFocus=n.dataset.node;n.scrollIntoView({block:'nearest',inline:'center'});render();}}};applySearch();

    }

    function bindFocus(body) {
        bindCanvas(body);
        body.querySelectorAll('[data-fs]').forEach(inp => { inp.oninput = () => {
            const fs = S.focusStyle || (S.focusStyle = {}), k = inp.dataset.fs;
            if (inp.type === 'number') { if (inp.value === '') delete fs[k]; else fs[k] = Number(inp.value); } else { if (inp.value.trim()) fs[k] = inp.value; else delete fs[k]; }
            if (!Object.keys(fs).length) delete S.focusStyle;
            touch();
        }; inp.onchange = () => { if (inp.type === 'number') setTimeout(render, 0); }; });
        body.querySelector('[data-fs-apply]')?.addEventListener('click', () => render());
        body.querySelector('[data-fs-example]')?.addEventListener('click', () => { S.focusStyle = Tools.clone(HemiFocusView.EXAMPLE); touch(); render(); });
        body.querySelector('[data-fs-reset]')?.addEventListener('click', () => { delete S.focusStyle; touch(); render(); });
        body.querySelector('[data-add-focus]').onclick = () => {
            const used = new Set(S.focus.map(f => `${f.x},${f.y}`));
            let x = 0, y = 0; while (used.has(`${x},${y}`)) { x++; if (x > 6) { x = 0; y++; } }
            const f = { id: uid('f'), title: i18n('maker.campaignEditor.361'), icon: '', days: 35, x, y, desc: '', prereq: selFocus ? [selFocus] : [], any: [], exclusive: [], effects: [] };
            if (selFocus) { const p = S.focus.find(z => z.id === selFocus); if (p && !used.has(`${p.x},${(p.y || 0) + 1}`)) { f.x = p.x; f.y = (p.y || 0) + 1; } }
            S.focus.push(f); selFocus = f.id; render(); touch();
        };
        const f = S.focus.find(x => x.id === selFocus);
        if (f) {
            body.querySelectorAll('[data-art]').forEach(inp=>inp.onchange=()=>{const k=inp.dataset.art;f.art={...(f.art||{}),[k]:Math.max(k==='scale'?50:-120,Math.min(k==='scale'?200:120,Number(inp.value)||0))};touch();render();});
            body.querySelector('[data-art-reset]')?.addEventListener('click',()=>{delete f.art;touch();render();});
            body.querySelectorAll('[data-ff]').forEach(inp => { inp.onchange = inp.oninput = () => {
                const k = inp.dataset.ff;
                if (k === 'id') { const nv = inp.value.trim().replace(/[^a-z0-9_.-]/gi, '_'); if (!nv || S.focus.some(z => z !== f && z.id === nv)) return; Tools.renameFocus(S,f.id,nv); selFocus = nv; }
                else f[k] = inp.type === 'number' ? Number(inp.value) || 0 : inp.value;
                touch(); if (inp.type !== 'text' && inp.tagName !== 'TEXTAREA') setTimeout(render, 0); else if (k === 'title' || k === 'icon') redrawTreeLater();
            }; });
            body.querySelectorAll('[data-chip]').forEach(b => { b.onclick = () => {
                const key = b.dataset.chip, id = b.dataset.id; const before=Tools.clone(S); const arr = f[key] || (f[key] = []);
                f[key] = arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id];
                if (key === 'exclusive') { const o = S.focus.find(z => z.id === id); if (o) { o.exclusive = o.exclusive || []; if (f.exclusive.includes(id) && !o.exclusive.includes(f.id)) o.exclusive.push(f.id); if (!f.exclusive.includes(id)) o.exclusive = o.exclusive.filter(x => x !== f.id); } }
                const errors=Tools.validate(S).filter(i=>i.level==='error' && i.path.startsWith('focus')); if(errors.length){S=before;alertBox(errors[0].message);return;}
                render(); touch();
            }; });
            const iconIn = body.querySelector('[data-icon-file]');
            body.querySelector('[data-icon-img]')?.addEventListener('click', () => iconIn.click());
            iconIn?.addEventListener('change', () => { const file = iconIn.files && iconIn.files[0]; iconIn.value = ''; if (file) shrink(file, 1024, url => { f.iconImage = url; render(); touch(); }); });
            body.querySelector('[data-icon-del]')?.addEventListener('click', () => { delete f.iconImage; render(); touch(); });
            body.querySelector('[data-del-focus]').onclick = async () => { if(!(await confirmBox(i18n('maker.campaignEditor.362'))))return; S.focus = S.focus.filter(z => z !== f); S.focus.forEach(z => ['prereq', 'any', 'exclusive'].forEach(key => { z[key] = (z[key] || []).filter(id => id !== f.id); })); selFocus = null; render(); touch(); };
        }
        // 끌어서 옮기기 (칸에 맞춤) — 조금만 움직이면 고르기
        const tree = $('cpeTree');
        tree.querySelectorAll('[data-node]').forEach(n => {
            n.onkeydown = e => {if(e.key==='Enter'||e.key===' '){e.preventDefault();if(linkTool)connectFocus(n.dataset.node);else{selFocus=n.dataset.node;render();}}};
            n.onpointerdown = e => {
                const node = S.focus.find(z => z.id === n.dataset.node); if (!node) return;
                if(e.button!==0)return;
                e.stopPropagation();
                if(linkTool){connectFocus(node.id);return;}
                const sx = e.clientX, sy = e.clientY, ox = parseFloat(n.style.left), oy = parseFloat(n.style.top);
                let moved = false;
                n.setPointerCapture(e.pointerId);
                n.onpointermove = ev => { const dx = (ev.clientX - sx)/zoom, dy = (ev.clientY - sy)/zoom; if (Math.abs(dx) + Math.abs(dy) > 4) moved = true; if (moved) { n.style.left = ox + dx + 'px'; n.style.top = oy + dy + 'px'; n.classList.add('drag'); } };
                n.onpointerup = ev => {
                    n.onpointermove = n.onpointerup = null;
                    if (moved) {
                        const nx = Math.max(0, Math.round((ox + (ev.clientX - sx)/zoom - FP) / (FW + FGX))), ny = Math.max(0, Math.round((oy + (ev.clientY - sy)/zoom - FP) / (FH + FGY)));
                        if (!S.focus.some(z => z !== node && Number(z.x) === nx && Number(z.y) === ny)) { node.x = Math.min(200,nx); node.y = Math.min(200,ny); touch(); }
                    } else selFocus = node.id;
                    render();
                };
            };
        });
    }
    let redrawT = 0;
    const redrawTreeLater = () => { clearTimeout(redrawT); redrawT = setTimeout(() => { if(rawPending.size)return; const ae = document.activeElement, k = ae && ae.dataset && ae.dataset.ff, pos = ae && ae.selectionStart; render(); if (k) { const n = document.querySelector(`[data-ff="${k}"]`); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) { /* 숫자 칸 */ } } } }, 600); };
    function bindCrises(body) {
        body.querySelector('[data-add-crisis]').onclick = () => { const c = blankCrisis(); S.crises.push(c); selCrisis = c.id; render(); touch(); };
        body.querySelectorAll('[data-crisis]').forEach(b => { b.onclick = () => { selCrisis = b.dataset.crisis; render(); }; });
        const c = S.crises.find(x => x.id === selCrisis); if (!c) return;
        body.querySelectorAll('[data-cf]').forEach(inp => { inp.oninput = () => {
            const k = inp.dataset.cf;
            if (k === 'id') { const nv = inp.value.trim().replace(/[^a-z0-9_.-]/gi, '_'); if (!nv || S.crises.some(z => z !== c && z.id === nv)) return; c.id = nv; selCrisis = nv; }
            else c[k] = inp.value;
            touch();
        }; inp.onchange = () => { if (inp.dataset.cf === 'title' || inp.dataset.cf === 'color') setTimeout(render, 0); }; });
        body.querySelector('[data-del-crisis]').onclick = async () => { if (!(await confirmBox(i18n('maker.campaignEditor.363', { title: c.title })))) return; S.crises = S.crises.filter(z => z !== c); selCrisis = null; render(); touch(); };
        if (detailMode === 'json') return; // JSON으로 고치는 중 — 칸이 없음
        const imgIn = body.querySelector('[data-img-file]');
        body.querySelector('[data-img]').onclick = () => imgIn.click();
        imgIn.onchange = () => { const f = imgIn.files && imgIn.files[0]; imgIn.value = ''; if (f) shrink(f, 900, url => { c.image = url; render(); touch(); }); };
        body.querySelector('[data-img-del]')?.addEventListener('click', () => { c.image = ''; render(); touch(); });
        body.querySelectorAll('[data-row]').forEach(row => {
            const key = row.dataset.row, i = +row.dataset.i, r = c[key][i];
            row.querySelectorAll('[data-rf]').forEach(inp => { inp.oninput = () => { r[inp.dataset.rf] = inp.type === 'number' ? (inp.value === '' ? '' : Number(inp.value)) : inp.value; touch(); }; });
            row.querySelectorAll('[data-rb]').forEach(inp => { inp.onchange = () => { r[inp.dataset.rb] = inp.checked; render(); touch(); }; });
            row.querySelector('[data-del-row]').onclick = () => { c[key].splice(i, 1); render(); touch(); };
        });
        body.querySelectorAll('[data-add-row]').forEach(b => { b.onclick = () => {
            const key = b.dataset.addRow; c[key] = c[key] || [];
            c[key].push(key === 'meters' ? { id: uid('m'), name: i18n('maker.campaignEditor.364'), start: 0, min: 0, max: 100, perMonth: 0, color: '' }
                : key === 'missions' ? { id: uid('ms'), title: i18n('maker.campaignEditor.365'), desc: '', days: 90, condition: null, success: [], fail: [] }
                : { id: uid('o'), title: i18n('maker.campaignEditor.366'), text: '', condition: null, effects: [] });
            render(); touch();
        }; });
        body.querySelector('[data-crisis-example]').onclick = () => {
            const m = (c.meters || [])[0], mid = m ? m.id : 'tension';
            c.events = [...(c.events || []), { id: uid('ev'), title: i18n('maker.campaignEditor.367', { title: c.title }), desc: i18n('maker.campaignEditor.368'), super: true, quote: i18n('maker.campaignEditor.369'), quote_author: i18n('maker.campaignEditor.370'),
                trigger: { var: { name: mid, gte: 60 } }, options: [{ text: i18n('maker.campaignEditor.371'), effects: [{ add_var: { name: mid, value: -10 } }, { approval: { of: 'cabinet', add: -2 } }] }, { text: i18n('maker.campaignEditor.372'), effects: [{ add_var: { name: mid, value: 10 } }] }] }];
            c.decisions = [...(c.decisions || []), { id: uid('dc'), title: i18n('maker.campaignEditor.373'), desc: i18n('maker.campaignEditor.374', { name: m ? m.name : i18n('maker.campaignEditor.299') }), cooldown_days: 60, effects: [{ add_var: { name: mid, value: -5 } }] }];
            render(); touch();
        };
    }
    function bindEndings(body) {
        body.querySelectorAll('[data-ending]').forEach(row => {
            const i = +row.dataset.ending, e = S.endings[i];
            row.querySelectorAll('[data-ef]').forEach(inp => { inp.oninput = () => { e[inp.dataset.ef] = inp.value; touch(); }; });
            row.querySelector('[data-del]').onclick = () => { S.endings.splice(i, 1); render(); touch(); };
        });
        body.querySelector('[data-add-ending]').onclick = () => { S.endings.push({ id: uid('e'), title: i18n('maker.campaignEditor.366'), text: '', condition: null }); render(); touch(); };
    }
    function shrink(file, max, done) {
        const fr = new FileReader();
        fr.onload = ev => { const img = new Image(); img.onload = () => { const s = Math.min(1, max / Math.max(img.width, img.height)); const cv = document.createElement('canvas'); cv.width = Math.round(img.width * s); cv.height = Math.round(img.height * s); cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height); let u = ''; try { u = cv.toDataURL('image/webp', 0.82); } catch (e) { /* 지원 안 함 */ } if (!u.startsWith('data:image/webp')) u = cv.toDataURL('image/png'); done(u); }; img.src = ev.target.result; };
        fr.readAsDataURL(file);
    }

    // ---------------------------------------------------------------
    // 저장 · 목록 · 파일 · 플레이
    // ---------------------------------------------------------------
    let saveT = 0;
    function touch() {
        const next=JSON.stringify(S); if(baseline && next!==baseline){past.push(baseline);if(past.length>60)past.shift();future=[];} baseline=next;
        saveStatus=i18n('maker.campaignEditor.375'); if($('cpSaveStatus'))$('cpSaveStatus').textContent=saveStatus;
        // Update toolbar without stealing input focus.
        document.querySelector('[data-history="undo"]')?.toggleAttribute('disabled',!past.length);
        document.querySelector('[data-history="redo"]')?.toggleAttribute('disabled',!future.length);
        clearTimeout(saveT); saveT = setTimeout(saveNow, 600);
    }
    async function saveNow() {
        clearTimeout(saveT); saveT=0;
        const snapshot=Tools.clone(S);
        try { await dbPut({id:snapshot.id,title:snapshot.title||i18n('sim.news.8'),updatedAt:Date.now(),data:snapshot}); localStorage.setItem(LAST,snapshot.id); if(S.id===snapshot.id)history.replaceState(null,'','scenario.html?item='+encodeURIComponent(snapshot.id)); saveStatus=i18n('maker.campaignEditor.376'); }
        catch(e){saveStatus=i18n('maker.campaignEditor.377');}
        if($('cpSaveStatus'))$('cpSaveStatus').textContent=rawPending.size?i18n('maker.campaignEditor.378'):saveStatus;
        await refreshLibrary();
    }
    async function refreshLibrary() {
        const all = (await dbAll().catch(() => [])).sort((a, b) => b.updatedAt - a.updatedAt);
        $('cpLibrary').innerHTML = `<option value="" disabled>${esc(i18n('maker.campaignEditor.379'))}${all.length})</option>` + all.map(it => `<option value="${esc(it.id)}" ${it.id === S.id ? 'selected' : ''}>${esc(it.title)}</option>`).join('');
    }
    function normalize(d) {
        if (!d || d.format !== FORMAT) return null;
        const out = { ...blank(), ...d };
        ['starts', 'events', 'decisions', 'focus', 'crises', 'endings', 'articles'].forEach(k => { if (!Array.isArray(out[k])) out[k] = []; });
        if (!out.starts.length) out.starts = blank().starts;
        if (!out.variables || typeof out.variables !== 'object' || Array.isArray(out.variables)) out.variables = {};
        return out;
    }
    function open(it) { S = normalize(it.data) || blank(); resetHistory(); selFocus = null; selCrisis = null; render(); try { localStorage.setItem(LAST, S.id); } catch (e) { /* 무시 */ } }
    async function exportFile() {
        await saveNow();
        const blob = window.HemiFile ? await window.HemiFile.encode(S) : new Blob([JSON.stringify(S)], { type: 'application/json' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${(S.title || 'campaign').replace(/[\\/:*?"<>|]/g, '_')}.hemicmp`;
        document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 3000);
    }
    async function importFile(f) {
        try {
            const raw=JSON.parse(window.HemiFile ? await window.HemiFile.readText(f) : await f.text());
            const issues=Tools.validate(raw).filter(i=>i.level==='error');if(issues.length)throw Error(issues.map(i=>i.path+': '+i.message).join(' / '));
            const d = normalize(raw);
            if (!d) throw new Error('format');
            const all = await dbAll().catch(() => []);
            if (all.some(it => it.id === d.id) && !(await confirmBox(i18n('maker.campaignEditor.380', { title: d.title })))) d.id = uid('cmp');
            S = d; resetHistory(); selFocus = null; selCrisis = null; render(); await saveNow();
        } catch (e) { alertBox((i18n('maker.campaignEditor.381') + " ")+e.message); }
    }
    function check() {
        return Tools.validate(S).filter(i=>i.level==='error').map(i=>i.path+': '+i.message);

    }
    async function play() {
        await saveNow();
        const errs = check();
        if (errs.length) { alertBox((i18n('maker.campaignEditor.382') + " ") + errs.join('\n- ')); return; }
        let start = S.starts[0];
        if (S.starts.length > 1) start = await pickStart();
        if (!start) return;
        const d = JSON.parse(JSON.stringify(S));
        d.starts.forEach(s => { delete s.state; });
        d._startId = start.id;
        const name = `${S.title || i18n('sim.campaign.2')}${S.starts.length > 1 && start.name ? ` — ${start.name}` : ''}`;
        try {
            ['hemiBootCampaign','hemiBootCampaignPending','hemiBootChallenge','hemiBootChallengePending','hemiBootPresetId','hemiBootNewSaveName','hemiBootImportedStateJSON','hemiBootImportedName','hemiBootImportPending'].forEach(k=>sessionStorage.removeItem(k));
            const text = JSON.stringify(d);
            try { sessionStorage.setItem('hemiBootCampaign', text); } catch (e) { await window.HemiFile.stash('bootCampaign', { text }); sessionStorage.setItem('hemiBootCampaignPending', '1'); }
            if (start.kind === 'save') {
                const st = JSON.stringify(start.state);
                try { sessionStorage.setItem('hemiBootImportedStateJSON', st); sessionStorage.setItem('hemiBootImportedName', name); }
                catch (e) { sessionStorage.removeItem('hemiBootImportedStateJSON'); await window.HemiFile.stash('bootImport', { name, text: st }); sessionStorage.setItem('hemiBootImportPending', '1'); }
            } else { sessionStorage.setItem('hemiBootPresetId', start.preset || 'builtin:tutorial'); sessionStorage.setItem('hemiBootNewSaveName', name); }
        } catch (e) { alertBox(i18n('maker.campaignEditor.383')); return; }
        location.href = 'main.html';
    }
    function pickStart() {
        return new Promise(res => {
            const ov = document.createElement('div');
            ov.className = 'cpe-overlay';
            ov.innerHTML = `<div class="scn-card cpe-pick"><div class="scn-h">${esc(i18n('maker.campaignEditor.384'))}</div>${S.starts.map((s, i) => `<button type="button" class="cpe-pick-item" data-i="${i}"><b>${esc(s.name || esc(i18n('sim.core.7')))}</b><span class="scn-dim">${esc(s.desc || '')}</span></button>`).join('')}<div class="scn-row"><button type="button" class="scn-btn" data-cancel>${esc(i18n('common.cancel'))}</button></div></div>`;
            const done = v => { ov.remove(); res(v); };
            ov.querySelectorAll('[data-i]').forEach(b => { b.onclick = () => done(S.starts[+b.dataset.i]); });
            ov.querySelector('[data-cancel]').onclick = () => done(null);
            document.body.appendChild(ov);
        });
    }

    document.addEventListener('click',e=>{
        if(!rawPending.size)return;
        const b=e.target.closest('button,a');if(!b)return;
        if(b.matches('[data-objapply],[data-whole-apply],#cpDiscardDraft,[data-close-issues]'))return;
        if(blockedDraft()){e.preventDefault();e.stopImmediatePropagation();}
    },true);
    $('cpNew').onclick = async () => { await saveNow(); S = blank(); resetHistory(); selFocus = null; selCrisis = null; tab = 'info'; render(); await saveNow(); };
    $('cpOpen').onclick = () => $('cpFile').click();
    $('cpFile').onchange = e => { const f = e.target.files && e.target.files[0]; e.target.value = ''; if (f) importFile(f); };
    $('cpExport').onclick = exportFile;
    $('cpPlay').onclick = play;
    $('cpLibrary').onchange = async e => { if(blockedDraft()){e.target.value=S.id;return;} const selected=e.target.value; await saveNow(); const all = await dbAll().catch(() => []); const it = all.find(x => x.id === selected); if (it) open(it); };
    document.querySelector('a.scn-back[href="maker.html"]')?.addEventListener('click',async e=>{
        if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;
        e.preventDefault();await saveNow();location.href='maker.html';
    });
    window.addEventListener('beforeunload', () => { if (saveT) saveNow(); });

    (async function init() {
        try { presets = window.HemiPresets ? await HemiPresets.list() : []; } catch (e) { presets = []; }
        const all = (await dbAll().catch(() => [])).sort((a, b) => b.updatedAt - a.updatedAt);
        let last = null; try { last = localStorage.getItem(LAST); } catch (e) { /* 무시 */ }
        const params=new URLSearchParams(location.search), requested=params.get('item');
        const it = params.has('new') ? null : requested ? all.find(x=>x.id===requested) : all.find(x => x.id === last) || all[0];
        if(requested&&!it)alertBox(i18n('maker.campaignEditor.385'));
        if (it) S = normalize(it.data) || blank();
        resetHistory(); render(); refreshLibrary();
        if (!it) saveNow();
    })();

    window.HemiCampaignEditor = { get data() { return S; }, set data(v) { S = normalize(v) || S; resetHistory(); render(); }, play, importFile, check, setTab: t => { tab = t; render(); } };
})();
