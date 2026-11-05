// ===== 캠페인 · 시나리오 편집기 (scenario.html · 0.3.0 · 테스트) =====
// 캠페인(hemicycle-campaign@1) = 세계관 + 시작 나라들(종합 프리셋) + 방향성 트리 + 시나리오(위기)들 + 결말
//   시나리오(위기) = 시작 조건 · 날짜, 게이지(변수), 기한 있는 임무, 위기 전용 결정 · 이벤트(슈퍼 이벤트), 결말
// 조건 · 효과는 스크립트 모드 형식(docs/MODDING.md)을 그대로 쓴다 — 칸 옆 "도우미"로 자주 쓰는 모양을 넣을 수 있다.
// 내 캠페인은 IndexedDB(hemicycleCampaigns)에 자동 저장, .hemicmp(gzip JSON)로 내보내기 · 불러오기, 시험 플레이는 js/campaign.js가 받음.
/* global DnoPresets, DnoUI */
(function () {
    'use strict';
    const FORMAT = 'hemicycle-campaign@1';
    const Tools = window.HemiCampaignTools;
    const rawPending = new Set();
    let zoom = 1, linkTool = '', search = '', saveStatus = '자동 저장 준비', past = [], future = [], baseline = '';
    let viewScroll = { left: 0, top: 0 };
    const resetHistory = () => { past = []; future = []; baseline = JSON.stringify(S); rawPending.clear(); };
    const blockedDraft = () => { if (!rawPending.size) return false; $('cpSaveStatus').textContent = 'JSON을 적용하거나 변경 취소 후 이동하세요.'; return true; };
    const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const $ = id => document.getElementById(id);
    const alertBox = m => (window.DnoUI && DnoUI.alert ? DnoUI.alert(m) : Promise.resolve(alert(m)));
    const confirmBox = m => (window.DnoUI && DnoUI.confirm ? DnoUI.confirm(m) : Promise.resolve(confirm(m)));
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
            format: FORMAT, id: uid('cmp'), title: '새 캠페인', author: '', version: '1.0', description: '', lore: '',
            starts: [{ id: 's1', name: '기본 시작', desc: '', kind: 'preset', preset: 'builtin:tutorial' }],
            variables: {}, events: [], decisions: [],
            focus: [{ id: 'f1', title: '첫걸음', icon: '🏛', days: 35, x: 1, y: 0, desc: '', prereq: [], any: [], exclusive: [], effects: [] }],
            crises: [], endings: [],
        };
    }
    function blankCrisis() {
        return { id: uid('c'), title: '새 위기', color: '#e5484d', desc: '', image: '', date: '', trigger: { flag: 'focus_f1' }, intro: '',
            meters: [{ id: 'tension', name: '긴장', start: 30, min: 0, max: 100, perMonth: 5, color: '' }],
            missions: [], outcomes: [
                { id: 'win', title: '위기 극복', text: '', condition: { var: { name: 'tension', lte: 0 } }, effects: [] },
                { id: 'lose', title: '파국', text: '', condition: { var: { name: 'tension', gte: 100 } }, effects: [] }],
            events: [], decisions: [] };
    }
    let S = blank();
    let tab = 'info', selFocus = null, selCrisis = null, presets = [];
    // 세부 정보 고치는 방식 — 'form'(칸 채우기) · 'json'(그 항목 전체를 JSON으로 직접)
    let detailMode = 'form';
    try { detailMode = localStorage.getItem('hemicycleCampaignDetailMode') === 'json' ? 'json' : 'form'; } catch (e) { /* 무시 */ }
    const modeSeg = () => `<div class="scn-seg cpe-mode" title="세부 정보를 칸으로 채우거나, 그 항목 전체를 JSON으로 직접 고칩니다"><button type="button" data-mode="form" class="${detailMode === 'form' ? 'on' : ''}">가이드</button><button type="button" data-mode="json" class="${detailMode === 'json' ? 'on' : ''}">프로 · JSON</button></div>`;
    // 항목 하나(방향성 · 위기)를 통째로 JSON으로 — 저장할 때 큰 데이터(그림)는 그대로 보여 준다
    // 그림(data:image…)은 JSON 칸에서 짧은 자리표시로 — 고쳐도 그대로 다시 붙는다
    const imgStash = new Map();
    const hideImgs = v => JSON.parse(JSON.stringify(v), (k, x) => { if (typeof x === 'string' && x.startsWith('data:image/')) { const key = `(그림 데이터 #${imgStash.size + 1} — 그대로 둠)`; imgStash.set(key, x); return key; } return x; });
    const showImgs = v => JSON.parse(JSON.stringify(v), (k, x) => (typeof x === 'string' && imgStash.has(x) ? imgStash.get(x) : x));
    const objJson = (path, rows) => `<textarea class="scn-in scn-code cpe-objjson" rows="${rows || 24}" spellcheck="false" data-objjson="${esc(path)}">${esc(JSON.stringify(hideImgs(getP(path)), null, 2))}</textarea><div class="scn-err" data-objerr="${esc(path)}"></div>`;
    const iconHtml = (f, cls) => (f.iconImage ? `<img class="${cls}-img" src="${esc(f.iconImage)}" alt="">` : f.icon ? `<span class="${cls}-ico">${esc(f.icon)}</span>` : '');

    // 경로로 읽고 쓰기 — "crises.0.trigger" 같은
    const getP = p => p.split('.').reduce((o, k) => (o == null ? o : o[k]), S);
    const setP = (p, v) => { const ks = p.split('.'); const last = ks.pop(); const o = ks.reduce((a, k) => a[k], S); o[last] = v; };

    // 조건 · 효과 도우미 — 자주 쓰는 모양
    const COND_SNIP = [
        ['정당 집권', { ruling: '정당 이름' }], ['정당 하원 의석 % 이상', { party_seats: { party: 'ruling', share: true, gte: 50 } }],
        ['정당 지지율 이상', { party_support: { party: '정당 이름', gte: 30 } }], ['집권 세력 의석 % 미만', { ruling_seats: { share: true, lt: 50 } }],
        ['내각 국정 지지율 미만', { approval: { of: 'cabinet', lt: 30 } }], ['날짜 이후', { date_after: '1990-01-01' }],
        ['방향성 끝냄', { flag: 'focus_방향성id' }], ['위기 결말', { flag: 'crisis_위기id_결말id' }], ['위기 끝남', { flag: 'crisis_위기id_done' }],
        ['플래그', { flag: '이름' }], ['변수(게이지) 이상', { var: { name: 'tension', gte: 100 } }], ['경제 지표', { economy: { indicator: 'unemp', gt: 10 } }],
        ['모두 (그리고)', { all: [{}, {}] }], ['하나라도 (또는)', { any: [{}, {}] }], ['확률 %', { chance: 25 }],
    ];
    const EFF_SNIP = [
        ['정당 지지율 더하기', { support: { party: 'ruling', add: -2 } }], ['국정 지지율 더하기', { approval: { of: 'cabinet', add: -3 } }],
        ['변수(게이지) 더하기', { add_var: { name: 'tension', value: 10 } }], ['변수 바꾸기', { set_var: { name: 'tension', value: 0 } }],
        ['플래그 켜기', { set_flag: '이름' }], ['이벤트 띄우기', { fire_event: '이벤트id' }], ['기사 발행', { article: { title: '헤드라인', body: '본문', outlet: '헤미일보', type: 'politics' } }],
        ['알림 창', { message: { title: '제목', text: '내용' } }], ['경제 지표 더하기', { economy: { indicator: 'mood', add: -5 } }], ['정당 상태', { party_status: { party: '정당 이름', to: 'banned' } }],
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
            ${snips ? `<select class="scn-in cpe-snip" data-snip="${esc(path)}" data-kind="${kind}"><option value="">+ 도우미</option>${snips.map(([l], i) => `<option value="${i}">${esc(l)}</option>`).join('')}</select>` : ''}</div>
            <textarea class="scn-in scn-code" rows="${rows || 3}" spellcheck="false" data-json="${esc(path)}" data-kind="${kind}" placeholder="${kind === 'cond' ? '{ } — 비우면 늘 맞음' : kind === 'eff' ? '[ ] — 효과 목록' : ''}">${esc(txt)}</textarea>
            <div class="scn-err" data-err="${esc(path)}"></div></div>`;
        void empty;
    }

    function variableForm() {
        return `<section class="scn-card"><div class="scn-h">캠페인 변수</div><p class="scn-dim">이야기에서 사용할 수치입니다. 같은 이름을 조건·효과에서 선택하세요.</p>${Object.entries(S.variables).map(([k,v])=>`<div class="scn-row" data-variable="${esc(k)}"><input class="scn-in" data-vname value="${esc(k)}" aria-label="변수 이름"><input class="scn-in scn-num" type="number" data-vvalue value="${esc(v)}" aria-label="변수 시작 값"><button type="button" class="scn-x" data-vdel aria-label="변수 삭제">×</button></div>`).join('')}<button type="button" class="scn-btn" data-vadd>+ 변수</button></section>`;
    }
    function scriptForm(path,label) {
        const events=path.endsWith('events'), items=getP(path)||[];
        return `<section class="scn-card"><div class="scn-h">${esc(label)}</div><p class="scn-dim">${events?'제목과 본문을 채우고, 발생 조건 또는 방향성의 “이벤트 ID”로 연결하세요.':'반복 행동과 선택을 만드세요. 조건이 맞으면 게임의 결정 목록에서 실행할 수 있습니다.'}</p>${items.map((e,i)=>`<details class="cpg-script" open><summary>${esc(e.title||e.id)}</summary><div class="scn-grid2"><label class="cpg-field">제목<input class="scn-in" data-script-field="${path}.${i}.title" value="${esc(e.title)}"></label><label class="cpg-field">ID<input class="scn-in" data-script-field="${path}.${i}.id" value="${esc(e.id)}"></label></div><label class="cpg-field">본문<textarea class="scn-in" rows="3" data-script-field="${path}.${i}.desc">${esc(e.desc)}</textarea></label>${events?`<label class="scn-check"><input type="checkbox" data-script-bool="${path}.${i}.super" ${e.super?'checked':''}>슈퍼 이벤트로 표시</label><label class="scn-check"><input type="checkbox" data-script-bool="${path}.${i}.trigger_only" ${e.trigger_only?'checked':''}>방향성 / 다른 이벤트에서만 실행</label>${jsonField(`${path}.${i}.trigger`,'발생 조건','cond')}${(e.options||[]).map((o,j)=>`<div class="scn-cond"><label class="cpg-field">선택지 ${j+1}<input class="scn-in" data-script-field="${path}.${i}.options.${j}.text" value="${esc(o.text)}"></label>${jsonField(`${path}.${i}.options.${j}.effects`,'선택 효과','eff')}<button type="button" class="scn-btn" data-list-remove="${path}.${i}.options" data-index="${j}">선택지 삭제</button></div>`).join('')}<button type="button" class="scn-btn" data-option-add="${path}.${i}.options">+ 선택지</button>`:`${jsonField(`${path}.${i}.available`,'실행 조건','cond')}${jsonField(`${path}.${i}.effects`,'실행 효과','eff')}<label class="cpg-field">다시 실행까지 (일)<input class="scn-in" type="number" min="0" data-script-field="${path}.${i}.cooldown_days" value="${esc(e.cooldown_days||0)}"></label>`}<button type="button" class="scn-btn scn-danger" data-list-remove="${path}" data-index="${i}">${events?'이벤트':'결정'} 삭제</button></details>`).join('')}<button type="button" class="scn-btn" data-script-add="${path}">+ ${events?'이벤트':'결정'}</button></section>`;
    }
    function bindScriptForms(body) {
        body.querySelectorAll('[data-script-field]').forEach(el=>el.oninput=()=>{setP(el.dataset.scriptField,el.type==='number'?Math.max(0,Number(el.value)||0):el.value);touch();});
        body.querySelectorAll('[data-script-bool]').forEach(el=>el.onchange=()=>{setP(el.dataset.scriptBool,el.checked);touch();});
        body.querySelectorAll('[data-list-remove]').forEach(b=>b.onclick=()=>{getP(b.dataset.listRemove).splice(+b.dataset.index,1);touch();render();});
        body.querySelectorAll('[data-option-add]').forEach(b=>b.onclick=()=>{const p=b.dataset.optionAdd;setP(p,[...(getP(p)||[]),{text:'새 선택',effects:[]}]);touch();render();});
        body.querySelectorAll('[data-script-add]').forEach(b=>b.onclick=()=>{const p=b.dataset.scriptAdd, event=p.endsWith('events');setP(p,[...(getP(p)||[]),event?{id:uid('ev'),title:'새 이벤트',desc:'',trigger_only:true,options:[{text:'계속',effects:[]}]}:{id:uid('dc'),title:'새 결정',desc:'',cooldown_days:30,effects:[]}]);touch();render();});
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
    const TABS = [['info', '기본 · 세계관'], ['starts', '시작 나라'], ['focus', '방향성 트리'], ['crises', '시나리오(위기)'], ['endings', '결말'], ['adv', '고급']];
    function studioBar() {
        $('cpStudioBar').innerHTML = `<div><span class="cpe-eyebrow">AUTHORING WORKSPACE</span><b>${esc(S.title || '이름 없는 캠페인')}</b></div><span class="scn-grow"></span><span id="cpSaveStatus" role="status">${esc(saveStatus)}</span><button type="button" class="scn-btn" data-history="undo" ${past.length ? '' : 'disabled'} title="실행 취소">↶</button><button type="button" class="scn-btn" data-history="redo" ${future.length ? '' : 'disabled'} title="다시 실행">↷</button><button type="button" class="scn-btn" id="cpValidate">✓ 검사</button>${modeSeg()}<button type="button" class="scn-btn" id="cpDiscardDraft" ${rawPending.size ? '' : 'hidden'}>JSON 변경 취소</button>`;
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
        $('cpIssues').innerHTML = `<div class="cpe-issues"><div class="scn-row"><b>${issues.length ? '캠페인 점검 · ' + issues.length + '건' : '✓ 구조 검사 통과'}</b><span class="scn-grow"></span><button type="button" class="scn-x" data-close-issues aria-label="검사 결과 닫기">×</button></div>${issues.map(i=>`<p class="${i.level === 'error' ? 'scn-err' : 'scn-dim'}"><code>${esc(i.path)}</code> · ${esc(i.message)}</p>`).join('') || '<p class="scn-dim">이제 시험 플레이로 이야기와 보상이 의도대로 작동하는지 확인하세요.</p>'}</div>`;
        $('cpIssues').querySelector('[data-close-issues]').onclick = () => $('cpIssues').replaceChildren();
    }
    function render() {
        clearTimeout(redrawT);
        const oldWrap = document.querySelector('.cpe-tree-wrap');
        if (oldWrap) viewScroll = {left:oldWrap.scrollLeft,top:oldWrap.scrollTop};
        studioBar();
        $('cpTabs').innerHTML = TABS.map(([k, l]) => `<button type="button" class="cpe-tab ${tab === k ? 'on' : ''}" data-tab="${k}">${l}${k === 'focus' ? ` <span class="scn-n">${S.focus.length}</span>` : k === 'crises' ? ` <span class="scn-n">${S.crises.length}</span>` : k === 'endings' ? ` <span class="scn-n">${S.endings.length}</span>` : ''}</button>`).join('');
        $('cpTabs').querySelectorAll('[data-tab]').forEach(b => { b.onclick = () => { tab = b.dataset.tab; render(); }; });
        const body = $('cpBody');
        body.innerHTML = { info: infoHtml, starts: startsHtml, focus: focusHtml, crises: crisesHtml, endings: endingsHtml, adv: advHtml }[tab]();
        bindCommon(body);
        bindScriptForms(body);
        HemiCampaignGuide.bind(body, {get:getP,set:setP,touch,render});
        body.querySelectorAll('[data-go]').forEach(b => b.onclick = () => {tab=b.dataset.go;render();});
        body.querySelectorAll('[data-starter]').forEach(b => b.onclick = async () => {await saveNow(); S=Tools.starter(uid('cmp')); tab='focus';selFocus='opening';resetHistory();touch();render();});
        ({ info: () => {}, starts: bindStarts, focus: bindFocus, crises: bindCrises, endings: bindEndings, adv: () => {} })[tab](body);
    }
    function infoHtml() {
        return `<div class="cpe-cols"><div class="scn-card">
            <div class="scn-h">기본 정보</div>
            <label class="scn-lab">제목</label><input class="scn-in scn-title" data-f="title" maxlength="80" value="${esc(S.title)}">
            <div class="scn-grid2"><div><label class="scn-lab">제작자</label><input class="scn-in" data-f="author" maxlength="60" value="${esc(S.author)}"></div>
                <div><label class="scn-lab">버전</label><input class="scn-in" data-f="version" maxlength="20" value="${esc(S.version)}"></div></div>
            <label class="scn-lab">한 줄 설명</label><input class="scn-in" data-f="description" maxlength="200" value="${esc(S.description)}">
            <label class="scn-lab">세계관 (캠페인을 시작할 때 크게 뜨는 글 — 빈 줄로 문단)</label><textarea class="scn-in" data-f="lore" rows="12">${esc(S.lore)}</textarea>
        </div><div class="scn-card cpe-help">
            <div class="cpe-eyebrow">FROM IDEA TO PLAYABLE STORY</div><h2>첫 캠페인, 빈 화면에서<br>시작하지 않아도 됩니다.</h2>
            <p class="scn-dim">서로 다른 두 노선, 합류 중점, 위기와 슈퍼 이벤트까지. 작동하는 예제를 복사해 제목과 이야기를 바꿔 보세요.</p>
            <button type="button" class="scn-btn scn-primary" data-starter>갈림길 캠페인으로 새로 만들기 ↗</button>
            <div class="cpe-launch-grid">${[['starts','01','시작 나라'],['focus','02','방향성 설계'],['crises','03','위기와 임무'],['endings','04','이야기의 결말']].map(([key,n,title])=>`<button type="button" data-go="${key}"><small>${n}</small><b>${title}</b><span>편집 열기 →</span></button>`).join('')}</div>
            <div class="scn-h">캠페인 만드는 순서</div>
            <ol class="cpe-steps">
                <li><b>시작 나라</b> — 내장 프리셋이나 게임에서 만든 종합 프리셋(.hemi). 여러 나라를 두면 시작할 때 고릅니다.</li>
                <li><b>방향성 트리</b> — 며칠씩 걸려 끝나는 선택. 끝내면 효과가 들어가고 플래그 <code>focus_방향성id</code>가 켜집니다.</li>
                <li><b>시나리오(위기)</b> — 날짜 · 조건(예: 어떤 방향성을 끝냄)으로 시작. 게이지는 변수라 효과 <code>add_var</code>로 움직이고, 결말 조건에서 <code>var</code>로 봅니다. 결말이 나면 플래그 <code>crisis_위기id_결말id</code>.</li>
                <li><b>결말</b> — 조건이 맞으면 캠페인이 끝났다고 엔딩 화면이 뜹니다 (그 뒤에도 계속 플레이 가능).</li>
                <li>▶ <b>시험 플레이</b> — 게임에서 바로. 맨 위 "캠페인" 탭(개요 · 방향성 · 위기)과 오른쪽 "캠페인" 화면(방향성 트리 · 위기).</li>
            </ol>
            <div class="scn-dim scn-small">가이드 모드에서는 조건과 효과를 입력 칸으로 만듭니다. 프로 모드로 전환하면 같은 데이터를 JSON으로 직접 편집할 수 있습니다. 사용자 정의 규칙도 그대로 보존됩니다.</div>
        </div></div>`;
    }
    function startsHtml() {
        return `<div class="scn-card"><div class="scn-h">시작 나라 <span class="scn-n">${S.starts.length}</span></div>
            <div class="scn-dim scn-small">종합 프리셋 = 나라 한 판 전체. 게임에서 시작 상황을 만들고 저장 › 파일로 저장(.hemi)한 파일이나 내장 프리셋을 씁니다.</div>
            ${S.starts.map((s, i) => `<div class="scn-cond" data-start="${i}">
                <div class="scn-row"><input class="scn-in scn-grow" data-sf="name" value="${esc(s.name)}" placeholder="이름 (예: 콜 정부)"><button type="button" class="scn-x" data-del title="빼기">×</button></div>
                <textarea class="scn-in" data-sf="desc" rows="2" placeholder="이 나라로 시작하면 보이는 설명">${esc(s.desc)}</textarea>
                <div class="scn-row"><div class="scn-seg"><button type="button" data-kind="preset" class="${s.kind !== 'save' ? 'on' : ''}">내장 프리셋</button><button type="button" data-kind="save" class="${s.kind === 'save' ? 'on' : ''}">세이브 파일</button></div>
                    ${s.kind === 'save' ? `<button type="button" class="scn-btn" data-pick>${s.state ? '다른 세이브' : '세이브 고르기'}</button><span class="scn-dim">${s.state ? `🏛 ${esc(s.state.config?.nationName || s.saveName || '세이브')}` : ''}</span><input type="file" accept=".hemi,.json,application/json" data-file hidden>`
                    : `<select class="scn-in" data-preset>${presets.filter(p => !p.comingSoon).map(p => `<option value="${esc(p.id)}" ${p.id === s.preset ? 'selected' : ''}>${esc(p.title)}${p.date ? ` — ${esc(p.date)}` : ''}</option>`).join('')}</select>`}</div>
            </div>`).join('')}
            <div class="scn-row"><button type="button" class="scn-btn" data-add-start>+ 시작 나라</button></div></div>`;
    }

    // 방향성 트리 — 왼쪽 그림(끌어서 옮김, 칸에 맞춤), 오른쪽 고른 방향성 칸
    // 상자 크기 · 간격은 캠페인의 중점 디자인(focusStyle)을 따른다 (js/focusview.js)
    let FW = 124, FH = 116, FGX = 22, FGY = 30;
    const FP = 16;
    const fstyle = () => { const st = window.HemiFocusView ? HemiFocusView.style(S) : { width: 150, height: 70, gapX: 26, gapY: 40 }; FW = st.width; FH = st.height; FGX = st.gapX; FGY = st.gapY; return st; };
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
        const chips = (key) => others.map(o => `<button type="button" class="cpe-chip ${(f[key] || []).includes(o.id) ? 'on' : ''}" data-chip="${key}" data-id="${esc(o.id)}">${esc(o.title || o.id)}</button>`).join('') || '<span class="scn-dim">다른 방향성 없음</span>';
        const fs = S.focusStyle || {};
        const design = `<div class="scn-card"><div class="scn-h">트리 아트 디렉션</div><p class="scn-dim">편집기와 실제 플레이에 같은 디자인을 적용합니다.</p><div class="cpe-style-choices">${[['default','클래식','큰 아이콘과 이름판'],['dossier','기밀 문서','청록색 프레임 · 정보 패널'],['medal','전시 훈장','금색 메달 · 붉은 리본']].map(([k,t,d])=>`<button type="button" data-style-preset="${k}"><b>${t}</b><small>${d}</small></button>`).join('')}</div></div>${detailMode === 'json' ? `<details class="scn-card cpe-design" ${fs.template || fs.css ? 'open' : ''}><summary class="scn-h">중점 디자인 ${fs.template || fs.css ? '<span class="scn-n">사용자 템플릿</span>' : '<span class="scn-n">기본 (큰 아이콘 + 이름판)</span>'}</summary>
            <div class="scn-dim scn-small">비워 두면 기본 모양(위에 큰 아이콘, 아래 이름판). 템플릿 · CSS로 상자 모양을 통째로 바꿀 수 있습니다 — 자리표시 <code>{{icon}}</code> <code>{{iconUrl}}</code> <code>{{title}}</code> <code>{{daysText}}</code> <code>{{days}}</code> <code>{{status}}</code> <code>{{statusText}}</code> <code>{{progress}}</code> <code>{{desc}}</code> <code>{{id}}</code>, 상자에는 늘 <code>.hf-node.hf-상태</code>(available · current · done · locked · blocked). 스크립트 · 바깥 주소는 막힙니다 (그림은 data:).</div>
            <div class="scn-row"><span class="scn-dim">가로</span><input class="scn-in scn-num" type="number" data-fs="width" value="${esc(fs.width ?? '')}" placeholder="124"><span class="scn-dim">세로</span><input class="scn-in scn-num" type="number" data-fs="height" value="${esc(fs.height ?? '')}" placeholder="116"><span class="scn-dim">간격</span><input class="scn-in scn-num" type="number" data-fs="gapX" value="${esc(fs.gapX ?? '')}" placeholder="22"><input class="scn-in scn-num" type="number" data-fs="gapY" value="${esc(fs.gapY ?? '')}" placeholder="30"></div>
            <label class="scn-lab">템플릿 (HTML — 비우면 기본)</label><textarea class="scn-in scn-code" rows="3" spellcheck="false" data-fs="template" placeholder='<div class="medal">{{icon}}</div><div class="ribbon">{{title}}</div>'>${esc(fs.template || '')}</textarea>
            <label class="scn-lab">CSS (방향성 트리 안에만 걸림)</label><textarea class="scn-in scn-code" rows="6" spellcheck="false" data-fs="css" placeholder=".hf-node .medal { ... }  .hf-done .medal { ... }">${esc(fs.css || '')}</textarea>
            <div class="scn-row"><button type="button" class="scn-btn" data-fs-example>예제 템플릿 넣기</button><button type="button" class="scn-btn" data-fs-reset>기본 모양으로</button><button type="button" class="scn-btn" data-fs-apply>미리 보기</button></div></details>` : ''}`;
        return `<div class="cpe-focus"><div class="cpe-focus-left">
            <div class="scn-card cpe-tree-card"><div class="cpe-eyebrow">DIRECTION TREE / DESIGN CANVAS</div><div class="scn-row"><div class="scn-h">선택이 역사가 되는 곳</div><span class="scn-grow"></span><button type="button" class="scn-btn scn-primary" data-add-focus>+ 방향성</button><button type="button" class="scn-btn" data-branch ${f ? '' : 'disabled'}>⑂ 양갈래 분기</button><button type="button" class="scn-btn" data-layout>자동 정렬</button></div>
            <div class="cpe-canvas-tools"><input class="scn-in" id="cpFocusSearch" type="search" placeholder="방향성 검색…" aria-label="방향성 검색" value="${esc(search)}"><select class="scn-in" id="cpLinkTool" aria-label="트리 연결 도구"><option value="">선택 · 이동</option>${[['prereq','필수 선행 연결'],['any','선택 선행 연결'],['exclusive','상호 배타 연결']].map(([k,t])=>`<option value="${k}" ${linkTool===k?'selected':''}>${t}</option>`).join('')}</select><span class="scn-grow"></span><button type="button" class="scn-btn" data-zoom="out" aria-label="축소">−</button><output id="cpZoomLabel">${Math.round(zoom*100)}%</output><button type="button" class="scn-btn" data-zoom="in" aria-label="확대">+</button><button type="button" class="scn-btn" data-fit>전체 보기</button></div>
            ${linkTool ? `<p class="cpe-connect-hint">${f ? `“${esc(f.title)}”에서 연결할 방향성을 클릭하세요. 같은 연결을 다시 누르면 해제합니다.` : '출발 방향성을 먼저 클릭하세요.'}</p>` : ''}
                <div class="scn-dim scn-small">상자를 끌어 옮기고(칸에 맞춰짐), 눌러서 고치세요. 실선: 먼저 끝내야 함 · 점선: 이 중 하나 · 빨간 선: 함께 못 고름</div>
                <div class="cpe-tree-wrap" tabindex="0" aria-label="방향성 설계 캔버스"><div class="cpe-tree-scale" style="width:${W*zoom}px;height:${H*zoom}px"><div class="cpe-tree" id="cpeTree" style="width:${W}px;height:${H}px;transform:scale(${zoom});transform-origin:top left;background-size:${FW + FGX}px ${FH + FGY}px">${window.HemiFocusView ? HemiFocusView.styleTag(st, '#cpeTree') : ''}
                    <svg width="${W}" height="${H}" class="cpe-tree-svg">${lines}</svg>
                    ${list.map(x => { const p = fpos(x); return `<button type="button" aria-label="${esc(x.title || x.id)}" aria-pressed="${x.id===selFocus}" title="${esc(x.desc || x.title || x.id)}" class="cpe-node hf-node ${x.id === selFocus ? 'hf-current sel' : 'hf-available'}" data-node="${esc(x.id)}" style="left:${p.x}px;top:${p.y}px;width:${FW}px;height:${FH}px">${window.HemiFocusView ? HemiFocusView.inner(x, { status: x.id === selFocus ? 'current' : 'available', daysText: `${Number(x.days) || 0}일` }, st) : esc(x.title || x.id)}</button>`; }).join('')}
                </div></div></div><div class="cpe-canvas-foot"><span>── 모두 완료</span><span>┄ 하나 이상 완료</span><span class="cpe-red">┄ 배타 선택</span><span class="scn-grow"></span>${list.length}개 방향성 · 드래그로 이동 / 빈 곳을 끌어 화면 이동</div></div>${design}</div>
            <div class="scn-card cpe-side">${f ? `
                <div class="scn-row"><div class="scn-h">${esc(f.title || '방향성')}</div><span class="scn-grow"></span>${modeSeg()}<button type="button" class="scn-btn" data-duplicate>복제</button><button type="button" class="scn-btn scn-danger" data-del-focus>지우기</button></div>
                ${detailMode === 'json' ? `<div class="scn-dim scn-small">이 방향성 전체 — id · title · icon · iconImage · days · x · y · desc · prereq · any · exclusive · available · effects · event</div>${objJson(`focus.${list.indexOf(f)}`, 26)}<button type="button" class="scn-btn scn-primary" data-objapply="focus.${list.indexOf(f)}">방향성 JSON 적용</button>` : `
                <div class="scn-grid2"><div><label class="scn-lab">id (조건에서 focus_id)</label><input class="scn-in" data-ff="id" value="${esc(f.id)}"></div><div><label class="scn-lab">아이콘 (이모지 또는 그림)</label><div class="scn-row"><input class="scn-in" data-ff="icon" maxlength="4" value="${esc(f.icon || '')}" placeholder="🏛" style="width:60px" ${f.iconImage ? 'disabled title="그림을 쓰는 중"' : ''}>${f.iconImage ? `<img class="cpe-icon-prev" src="${esc(f.iconImage)}" alt=""><button type="button" class="scn-x" data-icon-del title="그림 빼기">×</button>` : '<button type="button" class="scn-btn" data-icon-img>그림</button>'}<input type="file" accept="image/*" data-icon-file hidden></div></div></div>
                <label class="scn-lab">제목</label><input class="scn-in" data-ff="title" value="${esc(f.title)}">
                <div class="scn-grid2"><div><label class="scn-lab">걸리는 날</label><input class="scn-in" type="number" min="0" data-ff="days" value="${esc(f.days)}"></div><div><label class="scn-lab">끝나면 띄울 이벤트 id (선택)</label><input class="scn-in" data-ff="event" value="${esc(f.event || '')}"></div></div>
                <label class="scn-lab">설명</label><textarea class="scn-in" data-ff="desc" rows="3">${esc(f.desc)}</textarea>
                <label class="scn-lab">먼저 끝내야 함 (모두)</label><div class="cpe-chips">${chips('prereq')}</div>
                <label class="scn-lab">이 중 하나 먼저</label><div class="cpe-chips">${chips('any')}</div>
                <label class="scn-lab">함께 못 고름 (배타)</label><div class="cpe-chips">${chips('exclusive')}</div>
                ${jsonField(`focus.${list.indexOf(f)}.available`, '고를 수 있는 조건', 'cond', 2)}
                ${jsonField(`focus.${list.indexOf(f)}.effects`, '끝나면 효과', 'eff', 4)}`}`
            : '<div class="cpe-inspector-empty"><span>⌖</span><h3>이야기의 한 조각을 고르세요</h3><p>방향성을 클릭하면 제목, 기간, 보상과 연결 관계를 편집할 수 있습니다.</p><p>먼저 하나를 선택한 뒤 양갈래 분기로 서로 다른 노선을 만드세요.</p></div>'}</div>
        </div>`;
    }
    function crisesHtml() {
        const c = S.crises.find(x => x.id === selCrisis) || S.crises[0];
        if (c) selCrisis = c.id;
        const ci = S.crises.indexOf(c);
        const rowsOf = (key, cols) => (c[key] || []).map((r, i) => `<div class="scn-cond" data-row="${key}" data-i="${i}">${cols(r, i)}</div>`).join('');
        return `<div class="cpe-crisis">
            <div class="scn-card cpe-list"><div class="scn-h">시나리오(위기)</div>
                ${S.crises.map(x => `<button type="button" class="cpe-item ${x === c ? 'on' : ''}" data-crisis="${esc(x.id)}" style="--c:${esc(x.color || '#e5484d')}">${esc(x.title || x.id)}</button>`).join('') || '<div class="scn-dim">위기가 없습니다.</div>'}
                <div class="scn-row"><button type="button" class="scn-btn" data-add-crisis>+ 위기</button></div>
                <div class="scn-dim scn-small">조건 · 날짜로 시작해 게이지 · 임무 · 위기 결정이 돌다가 결말 하나로 끝납니다.</div></div>
            ${c && detailMode === 'json' ? `<div class="cpe-crisis-main"><div class="scn-card"><div class="scn-row"><div class="scn-h">위기 — JSON</div><span class="scn-grow"></span>${modeSeg()}<button type="button" class="scn-btn scn-danger" data-del-crisis>이 위기 지우기</button></div>
                <div class="scn-dim scn-small">이 위기 전체 — id · title · color · desc · image · date · trigger · intro · onStart · meters · missions · outcomes · events · decisions (docs/CAMPAIGN.md)</div>${objJson(`crises.${ci}`, 40)}<button type="button" class="scn-btn scn-primary" data-objapply="crises.${ci}">위기 JSON 적용</button></div></div>` : ''}
            ${c && detailMode !== 'json' ? `<div class="cpe-crisis-main">
                <div class="scn-card"><div class="scn-row"><div class="scn-h">위기</div><span class="scn-grow"></span>${modeSeg()}<button type="button" class="scn-btn scn-danger" data-del-crisis>이 위기 지우기</button></div>
                    <div class="scn-grid2"><div><label class="scn-lab">id (플래그 crisis_id)</label><input class="scn-in" data-cf="id" value="${esc(c.id)}"></div><div><label class="scn-lab">색</label><input class="scn-in" type="color" data-cf="color" value="${esc(c.color || '#e5484d')}"></div></div>
                    <label class="scn-lab">제목</label><input class="scn-in" data-cf="title" value="${esc(c.title)}">
                    <label class="scn-lab">설명 (시작할 때 크게 뜸)</label><textarea class="scn-in" data-cf="desc" rows="4">${esc(c.desc)}</textarea>
                    <div class="scn-row"><button type="button" class="scn-btn" data-img>${c.image ? '그림 바꾸기' : '그림 넣기'}</button>${c.image ? `<img class="cpe-thumb" src="${esc(c.image)}" alt=""><button type="button" class="scn-btn" data-img-del>그림 빼기</button>` : ''}<input type="file" accept="image/*" data-img-file hidden></div>
                    <div class="scn-grid2"><div><label class="scn-lab">시작 날짜 (선택, YYYY-MM-DD)</label><input class="scn-in" data-cf="date" value="${esc(c.date || '')}"></div><div><label class="scn-lab">시작할 때 띄울 이벤트 id (비우면 기본 창)</label><input class="scn-in" data-cf="intro" value="${esc(c.intro || '')}"></div></div>
                    ${jsonField(`crises.${ci}.trigger`, '시작 조건 (날짜와 함께면 둘 다)', 'cond', 2)}
                    ${jsonField(`crises.${ci}.onStart`, '시작할 때 효과', 'eff', 2)}</div>
                <div class="scn-card"><div class="scn-h">게이지 <span class="scn-n">${(c.meters || []).length}</span></div>
                    <div class="scn-dim scn-small">게이지 = 시나리오 변수. 효과 <code>{ "add_var": { "name": "id", "value": 10 } }</code>로 움직이고, 조건 <code>{ "var": { "name": "id", "gte": 100 } }</code>로 봅니다.</div>
                    ${rowsOf('meters', r => `<div class="scn-row"><input class="scn-in" data-rf="id" value="${esc(r.id)}" placeholder="id" style="width:110px"><input class="scn-in scn-grow" data-rf="name" value="${esc(r.name)}" placeholder="이름"><input class="scn-in" type="color" data-rf="color" value="${esc(r.color || '#e5484d')}"><button type="button" class="scn-x" data-del-row>×</button></div>
                        <div class="scn-row"><span class="scn-dim">처음</span><input class="scn-in scn-num" type="number" data-rf="start" value="${esc(r.start)}"><span class="scn-dim">최소</span><input class="scn-in scn-num" type="number" data-rf="min" value="${esc(r.min ?? 0)}"><span class="scn-dim">최대</span><input class="scn-in scn-num" type="number" data-rf="max" value="${esc(r.max ?? 100)}"><span class="scn-dim">한 달마다</span><input class="scn-in scn-num" type="number" step="any" data-rf="perMonth" value="${esc(r.perMonth || 0)}"></div>`)}
                    <div class="scn-row"><button type="button" class="scn-btn" data-add-row="meters">+ 게이지</button></div></div>
                <div class="scn-card"><div class="scn-h">기한 있는 임무 <span class="scn-n">${(c.missions || []).length}</span></div>
                    <div class="scn-dim scn-small">위기가 시작되면(또는 "나중에 시작" 조건이 맞으면) 날을 세기 시작 — 기한 안에 조건이 맞으면 성공 효과, 못 하면 실패 효과.</div>
                    ${rowsOf('missions', (r, i) => `<div class="scn-row"><input class="scn-in scn-grow" data-rf="title" value="${esc(r.title)}" placeholder="임무 (예: 90일 안에 예산안 통과)"><span class="scn-dim">기한</span><input class="scn-in scn-num" type="number" data-rf="days" value="${esc(r.days)}"><span class="scn-dim">일</span><button type="button" class="scn-x" data-del-row>×</button></div>
                        <input class="scn-in" data-rf="desc" value="${esc(r.desc || '')}" placeholder="설명 (선택)">
                        ${jsonField(`crises.${ci}.missions.${i}.condition`, '성공 조건', 'cond', 2)}
                        <div class="scn-grid2">${jsonField(`crises.${ci}.missions.${i}.success`, '성공 효과', 'eff', 2)}${jsonField(`crises.${ci}.missions.${i}.fail`, '실패 효과', 'eff', 2)}</div>
                        <label class="scn-check"><input type="checkbox" data-rb="later" ${r.later ? 'checked' : ''}> 나중에 시작 (아래 조건이 맞을 때부터)</label>${r.later ? jsonField(`crises.${ci}.missions.${i}.start`, '시작 조건', 'cond', 2) : ''}`)}
                    <div class="scn-row"><button type="button" class="scn-btn" data-add-row="missions">+ 임무</button></div></div>
                <div class="scn-card"><div class="scn-h">결말 <span class="scn-n">${(c.outcomes || []).length}</span></div>
                    <div class="scn-dim scn-small">위에서부터 조건이 처음 맞는 결말로 위기가 끝납니다. 결말 창(슈퍼 이벤트처럼)이 뜨고 플래그 <code>crisis_${esc(c.id)}_결말id</code>가 켜집니다.</div>
                    ${rowsOf('outcomes', (r, i) => `<div class="scn-row"><input class="scn-in" data-rf="id" value="${esc(r.id)}" placeholder="id" style="width:110px"><input class="scn-in scn-grow" data-rf="title" value="${esc(r.title)}" placeholder="결말 제목"><button type="button" class="scn-x" data-del-row>×</button></div>
                        <textarea class="scn-in" data-rf="text" rows="2" placeholder="결말 글">${esc(r.text || '')}</textarea>
                        <div class="scn-grid2">${jsonField(`crises.${ci}.outcomes.${i}.condition`, '조건', 'cond', 2)}${jsonField(`crises.${ci}.outcomes.${i}.effects`, '효과', 'eff', 2)}</div>`)}
                    <div class="scn-row"><button type="button" class="scn-btn" data-add-row="outcomes">+ 결말</button></div></div>
                <div class="scn-card"><div class="scn-h">위기 전용 이벤트 · 결정</div>
                    <div class="scn-dim scn-small">이 위기가 진행 중일 때만 돕니다. 이벤트에 <code>"super": true</code>를 넣으면 슈퍼 이벤트(가운데 큰 창, <code>image</code> · <code>quote</code> · <code>quote_author</code>).</div>
                    ${jsonField(`crises.${ci}.events`, '이벤트 — [ { id, title, desc, trigger, options: [ { text, effects } ] } ]', 'list', 8)}
                    ${jsonField(`crises.${ci}.decisions`, '결정 — [ { id, title, desc, available, effects, cooldown_days } ]', 'list', 6)}
                    <div class="scn-row"><button type="button" class="scn-btn" data-crisis-example>예제 넣기</button></div></div>
            </div>` : ''}
        </div>`;
    }
    function endingsHtml() {
        return `<div class="scn-card"><div class="scn-h">결말 (엔딩) <span class="scn-n">${S.endings.length}</span></div>
            <div class="scn-dim scn-small">날짜를 넘길 때마다 위에서부터 조건을 보고, 처음 맞는 결말로 캠페인이 끝납니다 (그 뒤에도 계속 플레이 가능). 예: 위기 결말 플래그 · 방향성 플래그 · 날짜.</div>
            ${S.endings.map((e, i) => `<div class="scn-cond" data-ending="${i}"><div class="scn-row"><input class="scn-in" data-ef="id" value="${esc(e.id)}" style="width:110px"><input class="scn-in scn-grow" data-ef="title" value="${esc(e.title)}" placeholder="결말 제목"><button type="button" class="scn-x" data-del>×</button></div>
                <textarea class="scn-in" data-ef="text" rows="3" placeholder="결말 글">${esc(e.text || '')}</textarea>${jsonField(`endings.${i}.condition`, '조건', 'cond', 2)}</div>`).join('')}
            <div class="scn-row"><button type="button" class="scn-btn" data-add-ending>+ 결말</button></div></div>`;
    }
    function advHtml() {
        return `<div class="scn-card"><div class="scn-h">캠페인 전체 변수 · 이벤트 · 결정</div>
            <div class="scn-dim scn-small">위기와 상관없이 캠페인 내내 도는 것 (스크립트 모드 형식). 결정은 국가 › 결정 탭에 나옵니다.</div>
            ${jsonField('variables', '변수 (처음 값) — { "이름": 숫자 }', 'obj', 3)}
            ${jsonField('events', '이벤트', 'list', 8)}
            ${jsonField('decisions', '결정', 'list', 6)}</div>
            ${detailMode === 'json' ? `<div class="scn-card"><div class="scn-h">캠페인 전체 JSON</div>
                <div class="scn-dim scn-small">모든 칸을 JSON 하나로 직접 고칩니다. 시작 나라의 세이브 데이터는 너무 커서 여기선 빼고 보여 주며, 그대로 이어 붙습니다 (시작 나라 id가 같으면).</div>
                <textarea class="scn-in scn-code cpe-objjson" rows="30" spellcheck="false" data-wholejson>${esc(JSON.stringify(wholeView(), null, 2))}</textarea><div class="scn-err" data-wholeerr></div>
                <div class="scn-row"><button type="button" class="scn-btn scn-primary" data-whole-apply>적용</button><span class="scn-dim">JSON을 수정한 뒤 적용하세요. 오류가 있으면 원본을 유지합니다.</span></div></div>` : ''}`;
    }
    // 전체 JSON 보기 — 시작 세이브(state)는 빼고 표시만
    function wholeView() { const d = JSON.parse(JSON.stringify(S)); (d.starts || []).forEach(st => { if (st.state) st.state = '(세이브 데이터 — 그대로 둠)'; }); return hideImgs(d); }

    // ---------------------------------------------------------------
    // 묶기
    // ---------------------------------------------------------------
    function bindCommon(body) {
        body.querySelectorAll('[data-mode]').forEach(b => { b.onclick = () => { detailMode = b.dataset.mode; try { localStorage.setItem('hemicycleCampaignDetailMode', detailMode); } catch (e) { /* 무시 */ } render(); }; });
        body.querySelectorAll('[data-objjson]').forEach(ta => {
            const p = ta.dataset.objjson, err = body.querySelector(`[data-objerr="${CSS.escape(p)}"]`);
            ta.oninput = () => { rawPending.add(p); $('cpDiscardDraft').hidden=false; try { JSON.parse(ta.value); if(err)err.textContent='아직 적용하지 않은 JSON입니다.'; } catch(e){if(err)err.textContent='JSON 오류: '+e.message;} };
            body.querySelector(`[data-objapply="${CSS.escape(p)}"]`).onclick = () => {
                try {
                    const v=showImgs(JSON.parse(ta.value));
                    const draft=Tools.clone(S), [kind,idx]=p.split('.'), old=draft[kind][+idx];
                    if (!v || typeof v!=='object' || Array.isArray(v)) throw Error('객체여야 합니다.');
                    if(kind==='focus' && old.id!==v.id) { if(!Tools.renameFocus(draft,old.id,v.id)) throw Error('사용할 수 없는 ID입니다.'); ['prereq','any','exclusive'].forEach(k=>{v[k]=(v[k]||[]).map(id=>id===old.id?v.id:id);}); }
                    draft[kind][+idx]=v;
                    const errors=Tools.validate(draft).filter(i=>i.level==='error'); if(errors.length)throw Error(errors.map(i=>i.path+': '+i.message).join(' / '));
                    S=draft; if(kind==='focus')selFocus=v.id;else selCrisis=v.id;
                    rawPending.delete(p);touch();render();
                }catch(e){err.textContent='적용하지 못했습니다: '+e.message;}
            };
        });
        const whole = body.querySelector('[data-wholejson]');
        if (whole) {
            const err = body.querySelector('[data-wholeerr]');
            let parsed = null;
            whole.oninput = () => { rawPending.add('whole'); $('cpDiscardDraft').hidden=false; try { const v = showImgs(JSON.parse(whole.value)); if (!v || v.format !== FORMAT) throw new Error(`"format": "${FORMAT}"이어야 합니다`); parsed = v; err.textContent = ''; } catch (e) { parsed = null; err.textContent = 'JSON 오류: ' + e.message; } };
            body.querySelector('[data-whole-apply]').onclick = () => {
                if (!parsed) { whole.oninput(); if (!parsed) return; }
                const states = new Map((S.starts || []).filter(st => st.state).map(st => [st.id, st.state]));
                const n = {...parsed};
                if(!Array.isArray(n.starts)||n.starts.some(st=>!st||typeof st!=='object'||Array.isArray(st))){err.textContent='starts는 시작 나라 객체 목록이어야 합니다.';return;}
                n.starts.forEach(st => { if (typeof st.state === 'string') { if (states.has(st.id)) st.state = states.get(st.id); else delete st.state; } });
                const errors=Tools.validate(n).filter(i=>i.level==='error'); if(errors.length){err.textContent=errors.map(i=>i.path+': '+i.message).join(' / ');return;}
                S = normalize(n); rawPending.delete('whole'); selFocus = null; selCrisis = null; touch(); render();
            };
        }
        body.querySelectorAll('[data-f]').forEach(inp => { inp.oninput = () => { S[inp.dataset.f] = inp.value; touch(); }; });
        body.querySelectorAll('[data-json]').forEach(ta => { ta.oninput = () => {
            const p = ta.dataset.json, kind = ta.dataset.kind, err = body.querySelector(`[data-err="${CSS.escape(p)}"]`);
            const raw = ta.value.trim();
            try {
                let v = raw ? JSON.parse(raw) : (kind === 'cond' ? null : kind === 'obj' ? {} : []);
                if (kind === 'eff' && v && !Array.isArray(v)) v = [v];
                if ((kind === 'list' || kind === 'eff') && !Array.isArray(v)) throw new Error('[ ] 배열이어야 합니다');
                if (kind === 'obj' && (!v || typeof v !== 'object' || Array.isArray(v))) throw new Error('{ } 객체여야 합니다');
                if(kind==='list' && v.some(x=>!x || typeof x!=='object' || Array.isArray(x)))throw Error('각 항목은 { } 객체여야 합니다.');
                if(kind==='obj' && Object.values(v).some(x=>!Number.isFinite(x)))throw Error('변수 값은 숫자여야 합니다.');
                setP(p, v); rawPending.delete(p); if (err) err.textContent = ''; touch();
            } catch (e) { rawPending.add(p); $('cpDiscardDraft').hidden=false; if (err) err.textContent = 'JSON 오류: ' + e.message; }
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
            row.querySelector('[data-del]').onclick = () => { if (S.starts.length <= 1) { alertBox('시작 나라는 하나 이상 있어야 합니다.'); return; } S.starts.splice(i, 1); render(); touch(); };
            row.querySelectorAll('[data-kind]').forEach(b => { b.onclick = () => { s.kind = b.dataset.kind; if (s.kind === 'preset' && !s.preset) s.preset = 'builtin:tutorial'; render(); touch(); }; });
            row.querySelector('[data-preset]')?.addEventListener('change', e => { s.preset = e.target.value; touch(); });
            const fi = row.querySelector('[data-file]');
            row.querySelector('[data-pick]')?.addEventListener('click', () => fi.click());
            fi?.addEventListener('change', async () => {
                const f = fi.files && fi.files[0]; fi.value = ''; if (!f) return;
                try { const obj = JSON.parse(window.HemiFile ? await window.HemiFile.readText(f) : await f.text()); if (!obj || !Array.isArray((obj.parliament || obj.data || {}).parties)) throw new Error('x');
                    s.state = obj; s.saveName = f.name.replace(/\.(hemi|json)$/i, ''); if (!s.name || s.name === '기본 시작') s.name = obj.config?.nationName || s.saveName; render(); touch(); }
                catch (e) { alertBox('Hemicycle 세이브 파일(.hemi)이 아닙니다.'); }
            });
        });
        body.querySelector('[data-add-start]').onclick = () => { S.starts.push({ id: uid('s'), name: '', desc: '', kind: 'preset', preset: 'builtin:tutorial' }); render(); touch(); };
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
            if(key==='default')delete S.focusStyle;
            else if(key==='medal')S.focusStyle=Tools.clone(HemiFocusView.EXAMPLE);
            else S.focusStyle={width:150,height:128,gapX:38,gapY:44,
                template:'<div class="dossier-icon">{{icon}}</div><div class="dossier-title">{{title}}</div><small>{{daysText}} · {{statusText}}</small>',
                css:'.hf-node { padding: 10px; border: 1px solid #466b70; background: #132329; color: #bedfdc; box-shadow: inset 0 3px #6fa99f; } .dossier-icon { height: 62px; display:flex; align-items:center; justify-content:center; } .dossier-icon img {width:54px;height:54px;object-fit:contain;} .dossier-icon span {font-size:34px;} .dossier-title {font-size:12px;font-weight:bold;} .hf-node small {font-size:10px;opacity:.75;} .hf-current {border-color:#efc86f;background:#333123;} .hf-done {border-color:#70c6a0;background:#16392d;} .hf-locked,.hf-blocked {filter:grayscale(1);opacity:.55;}'};
            touch();render();
        });
        body.querySelector('[data-layout]').onclick=()=>{Tools.layout(S.focus);touch();render();};
        body.querySelector('[data-duplicate]')?.addEventListener('click',()=>{
            const f=selected(),n=Tools.clone(f);n.id=uid('f');n.title=(f.title||f.id)+' (복사)';n.exclusive=[];
            while(S.focus.some(x=>x.x===n.x&&x.y===n.y))n.x=(n.x||0)+1;
            S.focus.push(n);selFocus=n.id;touch();render();
        });
        body.querySelector('[data-branch]').onclick=()=>{
            const p=selected();if(!p)return;
            const free=(x,y)=>{while(S.focus.some(f=>f.x===x&&f.y===y))x++;return {x,y};};
            const a={id:uid('f'),title:'개혁의 길',icon:'🕊',days:35,desc:'이 노선이 제시하는 미래를 적어 주세요.',...free(Math.max(0,(p.x||0)-1),(p.y||0)+1),prereq:[p.id],any:[],exclusive:[],effects:[]};
            S.focus.push(a);
            const b={...Tools.clone(a),id:uid('f'),title:'질서의 길',icon:'🛡',...free((p.x||0)+1,(p.y||0)+1),exclusive:[a.id]};a.exclusive=[b.id];S.focus.push(b);selFocus=a.id;touch();render();
        };
        const tree=$('cpeTree'),wrap=body.querySelector('.cpe-tree-wrap');
        wrap.scrollLeft=viewScroll.left;wrap.scrollTop=viewScroll.top;
        const changeZoom=v=>{zoom=Math.max(.35,Math.min(1.75,v));render();};
        body.querySelectorAll('[data-zoom]').forEach(b=>b.onclick=()=>changeZoom(zoom+(b.dataset.zoom==='in'?.15:-.15)));
        body.querySelector('[data-fit]').onclick=()=>{zoom=Math.max(.35,Math.min(1,(wrap.clientWidth-24)/parseFloat(tree.style.width),(wrap.clientHeight-24)/parseFloat(tree.style.height)));viewScroll={left:0,top:0};wrap.scrollLeft=0;wrap.scrollTop=0;render();};
        $('cpLinkTool').onchange=e=>{linkTool=e.target.value;render();};
        const applySearch=()=>tree.querySelectorAll('[data-node]').forEach(n=>{const f=S.focus.find(f=>f.id===n.dataset.node);n.classList.toggle('cpe-search-dim',!!search&&!`${f.title} ${f.id}`.toLowerCase().includes(search.toLowerCase()));});
        $('cpFocusSearch').oninput=e=>{search=e.target.value;applySearch();};
        $('cpFocusSearch').onkeydown=e=>{if(e.key==='Enter'){const n=tree.querySelector('[data-node]:not(.cpe-search-dim)');if(n){selFocus=n.dataset.node;n.scrollIntoView({block:'nearest',inline:'center'});render();}}};applySearch();
        wrap.onpointerdown=e=>{
            if(e.target.closest('[data-node]')||e.button!==0)return;
            const sx=e.clientX,sy=e.clientY,left=wrap.scrollLeft,top=wrap.scrollTop;
            wrap.setPointerCapture(e.pointerId);wrap.classList.add('panning');
            wrap.onpointermove=ev=>{wrap.scrollLeft=left-(ev.clientX-sx);wrap.scrollTop=top-(ev.clientY-sy);};
            wrap.onpointerup=wrap.onpointercancel=()=>{wrap.onpointermove=null;wrap.classList.remove('panning');};
        };
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
            const f = { id: uid('f'), title: '새 방향성', icon: '', days: 35, x, y, desc: '', prereq: selFocus ? [selFocus] : [], any: [], exclusive: [], effects: [] };
            if (selFocus) { const p = S.focus.find(z => z.id === selFocus); if (p && !used.has(`${p.x},${(p.y || 0) + 1}`)) { f.x = p.x; f.y = (p.y || 0) + 1; } }
            S.focus.push(f); selFocus = f.id; render(); touch();
        };
        const f = S.focus.find(x => x.id === selFocus);
        if (f) {
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
            iconIn?.addEventListener('change', () => { const file = iconIn.files && iconIn.files[0]; iconIn.value = ''; if (file) shrink(file, 160, url => { f.iconImage = url; render(); touch(); }); });
            body.querySelector('[data-icon-del]')?.addEventListener('click', () => { delete f.iconImage; render(); touch(); });
            body.querySelector('[data-del-focus]').onclick = async () => { if(!(await confirmBox('방향성과 연결을 삭제할까요? 실행 취소로 복구할 수 있습니다.')))return; S.focus = S.focus.filter(z => z !== f); S.focus.forEach(z => ['prereq', 'any', 'exclusive'].forEach(key => { z[key] = (z[key] || []).filter(id => id !== f.id); })); selFocus = null; render(); touch(); };
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
        body.querySelector('[data-del-crisis]').onclick = async () => { if (!(await confirmBox(`"${c.title}" 위기를 지울까요?`))) return; S.crises = S.crises.filter(z => z !== c); selCrisis = null; render(); touch(); };
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
            c[key].push(key === 'meters' ? { id: uid('m'), name: '새 게이지', start: 0, min: 0, max: 100, perMonth: 0, color: '' }
                : key === 'missions' ? { id: uid('ms'), title: '새 임무', desc: '', days: 90, condition: null, success: [], fail: [] }
                : { id: uid('o'), title: '새 결말', text: '', condition: null, effects: [] });
            render(); touch();
        }; });
        body.querySelector('[data-crisis-example]').onclick = () => {
            const m = (c.meters || [])[0], mid = m ? m.id : 'tension';
            c.events = [...(c.events || []), { id: uid('ev'), title: `${c.title} — 고비`, desc: '상황이 한고비를 맞았습니다.', super: true, quote: '역사는 결단하는 자의 편이다.', quote_author: '익명',
                trigger: { var: { name: mid, gte: 60 } }, options: [{ text: '강경하게', effects: [{ add_var: { name: mid, value: -10 } }, { approval: { of: 'cabinet', add: -2 } }] }, { text: '물러선다', effects: [{ add_var: { name: mid, value: 10 } }] }] }];
            c.decisions = [...(c.decisions || []), { id: uid('dc'), title: '대화 제의', desc: `${m ? m.name : '게이지'} -5 (60일마다)`, cooldown_days: 60, effects: [{ add_var: { name: mid, value: -5 } }] }];
            render(); touch();
        };
    }
    function bindEndings(body) {
        body.querySelectorAll('[data-ending]').forEach(row => {
            const i = +row.dataset.ending, e = S.endings[i];
            row.querySelectorAll('[data-ef]').forEach(inp => { inp.oninput = () => { e[inp.dataset.ef] = inp.value; touch(); }; });
            row.querySelector('[data-del]').onclick = () => { S.endings.splice(i, 1); render(); touch(); };
        });
        body.querySelector('[data-add-ending]').onclick = () => { S.endings.push({ id: uid('e'), title: '새 결말', text: '', condition: null }); render(); touch(); };
    }
    function shrink(file, max, done) {
        const fr = new FileReader();
        fr.onload = ev => { const img = new Image(); img.onload = () => { const s = Math.min(1, max / Math.max(img.width, img.height)); const cv = document.createElement('canvas'); cv.width = Math.round(img.width * s); cv.height = Math.round(img.height * s); cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height); let u = ''; try { u = cv.toDataURL('image/webp', 0.82); } catch (e) { /* 지원 안 함 */ } if (!u.startsWith('data:image/webp')) u = cv.toDataURL('image/jpeg', 0.85); done(u); }; img.src = ev.target.result; };
        fr.readAsDataURL(file);
    }

    // ---------------------------------------------------------------
    // 저장 · 목록 · 파일 · 플레이
    // ---------------------------------------------------------------
    let saveT = 0;
    function touch() {
        const next=JSON.stringify(S); if(baseline && next!==baseline){past.push(baseline);if(past.length>60)past.shift();future=[];} baseline=next;
        saveStatus='저장 중…'; if($('cpSaveStatus'))$('cpSaveStatus').textContent=saveStatus;
        // Update toolbar without stealing input focus.
        document.querySelector('[data-history="undo"]')?.toggleAttribute('disabled',!past.length);
        document.querySelector('[data-history="redo"]')?.toggleAttribute('disabled',!future.length);
        clearTimeout(saveT); saveT = setTimeout(saveNow, 600);
    }
    async function saveNow() {
        clearTimeout(saveT); saveT=0;
        const snapshot=Tools.clone(S);
        try { await dbPut({id:snapshot.id,title:snapshot.title||'(제목 없음)',updatedAt:Date.now(),data:snapshot}); localStorage.setItem(LAST,snapshot.id); if(S.id===snapshot.id)history.replaceState(null,'','scenario.html?item='+encodeURIComponent(snapshot.id)); saveStatus='✓ 자동 저장됨'; }
        catch(e){saveStatus='저장 실패 · 내보내기로 보관하세요';}
        if($('cpSaveStatus'))$('cpSaveStatus').textContent=rawPending.size?'JSON 미적용 · 저장된 원본 유지':saveStatus;
        await refreshLibrary();
    }
    async function refreshLibrary() {
        const all = (await dbAll().catch(() => [])).sort((a, b) => b.updatedAt - a.updatedAt);
        $('cpLibrary').innerHTML = `<option value="" disabled>내 캠페인 (${all.length})</option>` + all.map(it => `<option value="${esc(it.id)}" ${it.id === S.id ? 'selected' : ''}>${esc(it.title)}</option>`).join('');
    }
    function normalize(d) {
        if (!d || d.format !== FORMAT) return null;
        const out = { ...blank(), ...d };
        ['starts', 'events', 'decisions', 'focus', 'crises', 'endings'].forEach(k => { if (!Array.isArray(out[k])) out[k] = []; });
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
            if (all.some(it => it.id === d.id) && !(await confirmBox(`같은 캠페인("${d.title}")이 이미 있습니다. 불러온 것으로 덮어쓸까요? (취소하면 복사본으로)`))) d.id = uid('cmp');
            S = d; resetHistory(); selFocus = null; selCrisis = null; render(); await saveNow();
        } catch (e) { alertBox('캠페인을 불러오지 못했습니다: '+e.message); }
    }
    function check() {
        return Tools.validate(S).filter(i=>i.level==='error').map(i=>i.path+': '+i.message);

    }
    async function play() {
        await saveNow();
        const errs = check();
        if (errs.length) { alertBox('먼저 고쳐 주세요:\n- ' + errs.join('\n- ')); return; }
        let start = S.starts[0];
        if (S.starts.length > 1) start = await pickStart();
        if (!start) return;
        const d = JSON.parse(JSON.stringify(S));
        d.starts.forEach(s => { delete s.state; });
        d._startId = start.id;
        const name = `${S.title || '캠페인'}${S.starts.length > 1 && start.name ? ` — ${start.name}` : ''}`;
        try {
            ['hemiBootCampaign','hemiBootCampaignPending','hemiBootChallenge','hemiBootChallengePending','dnoBootPresetId','dnoBootNewSaveName','dnoBootImportedStateJSON','dnoBootImportedName','dnoBootImportPending'].forEach(k=>sessionStorage.removeItem(k));
            const text = JSON.stringify(d);
            try { sessionStorage.setItem('hemiBootCampaign', text); } catch (e) { await window.HemiFile.stash('bootCampaign', { text }); sessionStorage.setItem('hemiBootCampaignPending', '1'); }
            if (start.kind === 'save') {
                const st = JSON.stringify(start.state);
                try { sessionStorage.setItem('dnoBootImportedStateJSON', st); sessionStorage.setItem('dnoBootImportedName', name); }
                catch (e) { sessionStorage.removeItem('dnoBootImportedStateJSON'); await window.HemiFile.stash('bootImport', { name, text: st }); sessionStorage.setItem('dnoBootImportPending', '1'); }
            } else { sessionStorage.setItem('dnoBootPresetId', start.preset || 'builtin:tutorial'); sessionStorage.setItem('dnoBootNewSaveName', name); }
        } catch (e) { alertBox('캠페인을 넘기지 못했습니다. (저장 공간 부족)'); return; }
        location.href = 'main.html';
    }
    function pickStart() {
        return new Promise(res => {
            const ov = document.createElement('div');
            ov.className = 'cpe-overlay';
            ov.innerHTML = `<div class="scn-card cpe-pick"><div class="scn-h">어느 나라로 시작할까요?</div>${S.starts.map((s, i) => `<button type="button" class="cpe-pick-item" data-i="${i}"><b>${esc(s.name || '(이름 없음)')}</b><span class="scn-dim">${esc(s.desc || '')}</span></button>`).join('')}<div class="scn-row"><button type="button" class="scn-btn" data-cancel>취소</button></div></div>`;
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
        try { presets = window.DnoPresets ? await DnoPresets.list() : []; } catch (e) { presets = []; }
        const all = (await dbAll().catch(() => [])).sort((a, b) => b.updatedAt - a.updatedAt);
        let last = null; try { last = localStorage.getItem(LAST); } catch (e) { /* 무시 */ }
        const params=new URLSearchParams(location.search), requested=params.get('item');
        const it = params.has('new') ? null : requested ? all.find(x=>x.id===requested) : all.find(x => x.id === last) || all[0];
        if(requested&&!it)alertBox('이 제작물을 찾을 수 없습니다. 제작물 목록에서 다시 선택해 주세요.');
        if (it) S = normalize(it.data) || blank();
        resetHistory(); render(); refreshLibrary();
        if (!it) saveNow();
    })();

    window.HemiCampaignEditor = { get data() { return S; }, set data(v) { S = normalize(v) || S; resetHistory(); render(); }, play, importFile, check, setTab: t => { tab = t; render(); } };
})();
