// ===== 시나리오 · 격변 플레이 (0.3.0 · 테스트) =====
// 시나리오(hemicycle-campaign@1) = 세계관 + 시작 나라(종합 프리셋) + 방향성 트리 + 격변들 + 결말
//   격변 = 조건 · 날짜로 시작해 게이지 · 기한 있는 임무 · 격변 전용 결정 · 이벤트 사슬이 돌다가 결말 하나로 끝남
// - scenario.html(시나리오 편집기)의 "시험 플레이"가 sessionStorage(hemiBootCampaign, 크면 IndexedDB)에 시나리오를 맡기고
//   고른 시작 나라로 main.html을 연다 → 시작 세이브가 만들어지는 순간(createNamedSlotFromCurrentState) 여기서 붙인다.
// - 세이브의 campaign 칸에 저장. 이벤트 · 결정 · 변수(게이지)는 js/scriptmods.js의 세이브 모드 하나("campaign.<id>")로 돈다:
//   격변 이벤트 · 결정은 그 격변이 진행 중일 때만(플래그 crisis_<격변 id>), 끝낸 방향성은 플래그 focus_<id>,
//   격변 결말은 플래그 crisis_<격변 id>_<결말 id>와 crisis_<격변 id>_done — 조건에서 그대로 쓸 수 있다.
/* global getAppState, setAppState, switchSubTab, switchMainTab, switchDispTab, showCustomAlert, showCustomConfirm, showKbdToast, currentMainTab, currentSubTab */
(function () {
    'use strict';
    const root = document.documentElement;
    if (root.getAttribute('data-app-mode') === 'logo') return;

    const FORMAT = 'hemicycle-campaign@1';
    const Clock = window.HemiCampaignClock;
    let loadingCampaign = false;
    const origInfoBar = window.updateDispInfoBar;
    const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const toast = t => { if (typeof showKbdToast === 'function') showKbdToast(t); };
    const el = html => { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; };
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const paras = t => esc(t || '').split(/\n{2,}/).map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');

    let R = null; // 세이브에 붙은 시나리오 상태
    let ui = { view: 'focus', sel: null, treeZoom: 1 };

    // ---------------------------------------------------------------
    // 시나리오 → 스크립트 모드 하나
    // ---------------------------------------------------------------
    const safeId = v => String(v || '').replace(/[^a-z0-9_.-]/gi, '_').slice(0, 50);
    const modId = () => 'campaign.' + safeId(R && R.data.id || 'untitled');
    const andCond = (a, b) => (b == null || (typeof b === 'object' && !Object.keys(b).length) ? a : { all: [a, b] });
    function toMod(d) {
        const vars = { ...(d.variables || {}) };
        const storyEvent=ev=>({...ev,presentation:ev.presentation||'narrative'});
        const events = (d.events || []).map(storyEvent);
        const decisions = [...(d.decisions || [])];
        (d.crises || []).forEach(c => {
            const flag = { flag: 'crisis_' + safeId(c.id) };
            (c.meters || []).forEach(m => { if (m && m.id && !(m.id in vars)) vars[m.id] = Number(m.start) || 0; });
            (c.events || []).forEach(ev => events.push({ ...storyEvent(ev), trigger: ev.trigger_only ? ev.trigger : andCond(flag, ev.trigger) }));
            (c.decisions || []).forEach(dc => decisions.push({ ...dc, category: dc.category || `격변: ${c.title || c.id}`, visible: andCond(flag, dc.visible), _crisis: c.id }));
        });
        return { format: 'hemicycle-script@1', id: 'campaign.' + safeId(d.id || 'untitled'), name: d.title || '시나리오', author: d.author || '', version: d.version || '',
            description: d.description || '', variables: vars, events, decisions };
    }
    function bindMod() { if (window.HemiScriptMods && window.HemiScriptMods.setSaveMods) window.HemiScriptMods.setSaveMods(R ? [toMod(R.data)] : []); }
    const SM = () => window.HemiScriptMods;
    const test = cond => { try { return cond == null ? true : !!SM().test(cond, modId()); } catch (e) { return false; } };
    const run = eff => { try { if (eff && (!Array.isArray(eff) || eff.length)) SM().run(eff, modId()); } catch (e) { /* 효과 실패 */ } };
    const varOf = name => Number(SM()?.vars(modId())[name]) || 0;
    const fillT = t => { try { return SM().fill(t || '', modId()); } catch (e) { return t || ''; } };
    // 효과를 실행하기 전의 세계지도 참조 검사 (js/scriptmods.js precheck) — 문제없으면 null, 아니면 이유
    const precheck = eff => { try { return SM().precheck ? SM().precheck(eff, modId()) : null; } catch (e) { return null; } };

    // ---------------------------------------------------------------
    // 세계지도 연결 — 시나리오의 나라 열쇠(world.countries[].key) ↔ 이 세이브의 실제 국가(세계 › 국가 순위의 행 id)
    // ---------------------------------------------------------------
    // 시작 나라마다 실제 id가 달라도 같은 열쇠가 같은 나라를 가리키게, 시작할 때 고른 시작 나라의 연결을 R.worldBindings에 확정해 세이브에 둔다.
    const isObj = x => !!x && typeof x === 'object' && !Array.isArray(x);
    const declaredBindings = r => { const s = (r.data.starts || []).find(x => x.id === r.startId) || (r.data.starts || [])[0]; return isObj(s && s.worldBindings) ? { ...s.worldBindings } : {}; };
    const worldCountries = () => (R && isObj(R.data.world) && Array.isArray(R.data.world.countries) ? R.data.world.countries.filter(c => isObj(c) && typeof c.key === 'string') : []);
    // 플레이 규칙 — 제작자가 잠근 "직접 수정" (v1.7.1 첫 조각: 세계지도 영토 · 경제권). 시나리오의 playRules.locks를 시작할 때 세이브(campaign.playRules)에 보관한다.
    // 잠가도 방향성 · 이벤트 · 결정의 효과로는 바뀐다. 화면(js/world-map.js · js/history.js)은 실제로 상태를 바꾸는 자리에서 lockReason을 묻는다.
    const LOCK_REASON = {
        worldMap: '이 시나리오에서는 영토를 직접 수정할 수 없습니다. 방향성 · 이벤트 · 결정을 통해 바뀝니다.',
        economicRegions: '이 시나리오에서는 경제권을 직접 수정할 수 없습니다. 방향성 · 이벤트 · 결정을 통해 바뀝니다.',
        parties: '이 시나리오에서는 정당 · 이념을 직접 수정할 수 없습니다. 이벤트 · 결정 · 방향성을 통해 바뀝니다.',
        seats: '이 시나리오에서는 의석 · 의원을 직접 수정할 수 없습니다. 선거 또는 이벤트를 통해 바뀝니다.',
        elections: '이 시나리오에서는 선거제도 · 지역구를 직접 수정할 수 없습니다. 선거는 정해진 제도대로 치릅니다.',
        government: '이 시나리오에서는 정부 형태 · 집권 · 내각을 직접 수정할 수 없습니다. 선거 · 표결 · 이벤트를 통해 바뀝니다.',
        opinion: '이 시나리오에서는 지지율 · 여론을 직접 수정할 수 없습니다. 이벤트 · 기사 · 자동 변화를 통해 바뀝니다.',
        economy: '이 시나리오에서는 경제 지표 · 경제 사건 · 항목을 직접 수정할 수 없습니다. 정책(통화 · 재정)과 이벤트로 바뀝니다.',
    };
    const lockReason = name => (R && !loadingCampaign && isObj(R.playRules) && isObj(R.playRules.locks) && R.playRules.locks[name] === true && LOCK_REASON[name]) || null;
    // 스크립트 판정에 쓰는 지금 상태 (js/world-rules.js의 ctx) — 이 시나리오의 스크립트가 아니면 null
    function worldContext(id) {
        if (!R || loadingCampaign || id !== modId() || !window.HemiWorldMap) return null;
        const list = worldCountries(), names = new Map(list.map(c => [c.key, c.name || c.key]));
        return { ...window.HemiWorldMap.context(), declared: new Set(list.map(c => c.key)), bindings: R.worldBindings || {}, countryName: key => names.get(key) };
    }

    // ---------------------------------------------------------------
    // 세이브
    // ---------------------------------------------------------------
    const origGet = window.getAppState;
    window.getAppState = function () {
        if(!loadingCampaign&&R?.clock)mirrorClockValues();
        const st = origGet.apply(this, arguments);
        if (st && typeof st === 'object' && R && !loadingCampaign) st.campaign = JSON.parse(JSON.stringify(R));
        return st;
    };
    const origSet = window.setAppState;
    window.setAppState = function (state) {
        resetArticleWindow();
        let r;loadingCampaign=true;
        try{r=origSet.apply(this,arguments);}finally{loadingCampaign=false;}
        const src = state && state.campaign;
        R = src && typeof src === 'object' && src.data ? normalize(JSON.parse(JSON.stringify(src))) : null;
        bindMod();timeController.reset();window.dispatchEvent(new Event('hemi-campaign-changed'));
        refresh(); scheduleArticles();
        return r;
    };
    function normalize(r,fresh=false) {
        if(!fresh&&!r.clock){const day=Clock.dayFromKey(worldToday());if(day!=null)r.clock={day};}
        r.clock=Clock.normalize(r.clock,r.data,worldToday());
        r.focus = r.focus || { cur: null, done: {} };
        r.focus.done = r.focus.done || {};
        r.articles = r.articles && typeof r.articles === 'object' ? r.articles : {};
        r.articles.published = r.articles.published && typeof r.articles.published === 'object' ? r.articles.published : {};
        const valid = new Set((r.data.articles || []).map(a=>a.id));
        r.articles.queue = (Array.isArray(r.articles.queue) ? r.articles.queue : []).filter(id=>valid.has(id)&&r.articles.published[id]&&!r.articles.published[id].read);
        Object.entries(r.articles.published).forEach(([id,record])=>{if(valid.has(id)&&!record.read&&!r.articles.queue.includes(id))r.articles.queue.push(id);});
        // 예전 세이브에는 나라 연결이 없다 — 고른 시작 나라의 선언에서 되살린다 (실제 지도 · 국가는 쓸 때마다 검사한다)
        if (!isObj(r.worldBindings)) r.worldBindings = declaredBindings(r);
        // 적용한 플레이 규칙이 빠진 진행 세이브는 시나리오의 선언에서 되살린다 (조용히 전부 허용하지 않게). 설정이 없는 시나리오는 예전처럼 잠금 없음
        if (!isObj(r.playRules)) r.playRules = isObj(r.data.playRules) ? JSON.parse(JSON.stringify(r.data.playRules)) : {};
        r.crises = r.crises || {};
        (r.data.crises || []).forEach(c => { if (!r.crises[c.id]) r.crises[c.id] = { status: 'idle', missions: {} }; r.crises[c.id].missions = r.crises[c.id].missions || {}; });
        return r;
    }

    // ---------------------------------------------------------------
    // 날짜
    // ---------------------------------------------------------------
    function worldToday() {
        const y = parseInt(document.getElementById('nationDateYear')?.value, 10);
        if (!Number.isFinite(y)) return null;
        const m = parseInt(document.getElementById('nationDateMonth')?.value, 10) || 1, d = parseInt(document.getElementById('nationDateDay')?.value, 10) || 1;
        return y * 10000 + m * 100 + d;
    }
    const today = () => R?.clock ? Clock.dateKey(R.clock.day) : worldToday();
    const dayNum = k => Clock.dayFromKey(k);
    const labelOf = k => {const day=Clock.dayFromKey(k);if(day==null)return '';const p=Clock.parts(day);return `${p.y}년 ${p.m}월 ${p.d}일`;};
    const nowDay = () => R?.clock ? R.clock.day+R.clock.hour/24 : dayNum(worldToday());
    const period = days => {
        if(R?.clock.mode==='turn')return `${Math.max(0,Math.ceil(days))}턴`;
        const hours=Math.max(0,Math.ceil(days*24-1e-8));return hours>=24?`${Math.floor(hours/24)}일${hours%24?` ${hours%24}시간`:''}`:`${hours}시간`;
    };
    function mirrorClockValues(){
        if(!R?.clock||loadingCampaign)return;
        const p=Clock.parts(R.clock.day);
        for(const [id,v]of [['nationDateYear',p.y],['nationDateMonth',p.m],['nationDateDay',p.d]]){const e=document.getElementById(id);if(e)e.value=v;}
    }
    if(typeof origInfoBar==='function')window.updateDispInfoBar=function(){
        if(!loadingCampaign)mirrorClockValues();const r=origInfoBar.apply(this,arguments);
        if(R?.clock&&!loadingCampaign){const e=document.getElementById('dispInfoDate');if(e)e.textContent=Clock.label(R.clock);}return r;
    };
    function updateFocusProgress(){
        const cur=R?.focus.cur;if(!cur)return;
        const left=Math.max(0,cur.days-(nowDay()-cur.started));
        document.querySelectorAll('.hf-current .hf-days,.cp-focus-cur .cp-days').forEach(el=>{el.textContent=period(left)+' 남음';});
        document.querySelectorAll('.hf-current .hf-bar i,.cp-focus-cur + .cp-bar i').forEach(el=>{el.style.width=(cur.days?clamp((cur.days-left)/cur.days*100,0,100):100)+'%';});
    }


    // ---------------------------------------------------------------
    // 방향성 트리
    // ---------------------------------------------------------------
    // 방향성 아이콘 — 그림(iconImage) 또는 이모지(icon)
    const iconOf = (f, cls) => (f.iconImage ? `<img class="${cls}-img" src="${esc(f.iconImage)}" alt="">` : f.icon ? `<span class="${cls}-ico">${esc(f.icon)}</span>` : '');
    const focusList = () => (R && Array.isArray(R.data.focus) ? R.data.focus : []);
    const focusById = id => focusList().find(f => f.id === id);
    function focusState(f) {
        if (R.focus.done[f.id]) return 'done';
        if (R.focus.cur && R.focus.cur.id === f.id) return 'current';
        const done = id => !!R.focus.done[id];
        const taken = id => done(id) || (R.focus.cur && R.focus.cur.id === id);
        // 배타는 양쪽으로 — 이 방향성이 막는 것이든, 이 방향성을 막는 것이든 이미 골랐으면
        if ((f.exclusive || []).some(taken) || focusList().some(g => g.id !== f.id && taken(g.id) && (g.exclusive || []).includes(f.id))) return 'blocked';
        if ((f.prereq || []).some(id => !done(id))) return 'locked';
        if ((f.any || []).length && !(f.any || []).some(done)) return 'locked';
        if (f.available && !test(f.available)) return 'locked';
        return 'available';
    }
    function startFocus(id) {
        const f = focusById(id);
        if (!f || focusState(f) !== 'available') return;
        const go = () => { R.focus.cur = { id: f.id, started: nowDay() ?? 0, days: Math.max(0, Number(f.days) || 0) }; if (!R.focus.cur.days) completeFocus(); toast(`방향성: ${f.title || f.id}`); refresh(); };
        if (R.focus.cur) { const c = focusById(R.focus.cur.id); showCustomConfirm(`진행 중인 "${c ? c.title : R.focus.cur.id}"을(를) 그만두고 "${f.title}"을(를) 시작할까요? (진행한 날은 사라집니다)`, go); }
        else go();
    }
    function completeFocus() {
        const cur = R.focus.cur; if (!cur) return;
        const f = focusById(cur.id);
        // 완료 효과의 세계지도 참조가 틀렸으면 완료로 기록하지 않는다 — 플래그 · 효과 · 이벤트 모두 그대로 두고, 고치면 다음 검사 때 완료된다
        const why = f ? precheck(f.effects) : null;
        if (why) {
            if (cur.blocked !== why) { cur.blocked = why; if (R.clock && R.clock.mode === 'realtime') timeController.pause('방향성 효과 오류 · 일시정지'); showCustomAlert(`방향성 "${f.title || f.id}"을(를) 완료할 수 없습니다.\n${why}`); }
            return;
        }
        R.focus.cur = null;
        R.focus.done[cur.id] = today() || 1;
        run([{ set_flag: 'focus_' + safeId(cur.id) }]);
        if (f) { run(f.effects); if (f.event) SM()?.fire(modId(), f.event); if(f.article)publishArticle(f.article); toast(`✔ 방향성 완료: ${f.title || f.id}`); }
        checkArticles();
    }

    // ---------------------------------------------------------------
    // 격변 (격변)
    // ---------------------------------------------------------------
    const crisisList = () => (R && Array.isArray(R.data.crises) ? R.data.crises : []);
    function startCrisis(c) {
        const st = R.crises[c.id];
        st.status = 'active'; st.started = today(); st.lastDay = nowDay(); st.carry = 0;
        run([{ set_flag: 'crisis_' + safeId(c.id) }, ...(c.meters || []).filter(m => m && m.id).map(m => ({ set_var: { name: m.id, value: Number(m.start) || 0 } }))]);
        (c.missions || []).forEach(m => { if (m && m.id && !m.later) st.missions[m.id] = { status: 'active', started: nowDay() }; });
        run(c.onStart);
        if (c.intro) SM()?.fire(modId(), c.intro);
        else superModal({ kicker: '격변 시작', title: c.title || c.id, text: c.desc, image: c.image, color: c.color });
        ui.view = 'crisis'; ui.sel = c.id;
    }
    function endCrisis(c, o) {
        const st = R.crises[c.id];
        st.status = 'ended'; st.outcome = o.id; st.ended = today();
        run([{ clear_flag: 'crisis_' + safeId(c.id) }, { set_flag: 'crisis_' + safeId(c.id) + '_done' }, { set_flag: 'crisis_' + safeId(c.id) + '_' + safeId(o.id) }]);
        run(o.effects);
        Object.values(st.missions).forEach(m => { if (m.status === 'active') m.status = 'cancelled'; });
        if (o.event) SM()?.fire(modId(), o.event);
        else superModal({ kicker: `${c.title || c.id} — 결말`, title: o.title || o.id, text: o.text, image: o.image, color: c.color });
    }
    function tickCrisis(c, months) {
        const st = R.crises[c.id];
        // 게이지: 한 달마다 perMonth만큼, min · max 안으로
        (c.meters || []).forEach(m => {
            if (!m || !m.id) return;
            let v = varOf(m.id) + (Number(m.perMonth) || 0) * months;
            v = clamp(v, m.min ?? 0, m.max ?? 100);
            run([{ set_var: { name: m.id, value: Math.round(v * 100) / 100 } }]);
        });
        // 기한 있는 임무: 조건이 맞으면 성공, 기한이 지나면 실패. "later" 임무는 시작 조건(start)이 맞을 때 시작
        const nd = nowDay() ?? 0;
        (c.missions || []).forEach(m => {
            if (!m || !m.id) return;
            let ms = st.missions[m.id];
            if (!ms && m.later && test(m.start)) ms = st.missions[m.id] = { status: 'active', started: nd };
            if (!ms || ms.status !== 'active') return;
            if (m.condition && test(m.condition)) { ms.status = 'done'; ms.ended = today(); run(m.success); toast(`✔ 임무 성공: ${m.title || m.id}`); }
            else if (Number(m.days) && nd - ms.started >= Number(m.days)) { ms.status = 'failed'; ms.ended = today(); run(m.fail); toast(`✖ 임무 실패: ${m.title || m.id}`); }
        });
        // 결말: 조건이 맞는 첫 번째
        const o = (c.outcomes || []).find(x => x && x.condition && test(x.condition));
        if (o) endCrisis(c, o);
    }

    // ---------------------------------------------------------------
    // 한 번 돌리기 (날짜를 넘길 때 · 총선 반영 때)
    // ---------------------------------------------------------------
    let lastDay = null;
    function tick(options={}) {
        if (!R || R.ending) { timeController.render(); return; }
        const nd = nowDay();
        if(options.hourly&&(!R.focus.cur||nd-R.focus.cur.started+1e-8<R.focus.cur.days)){updateFocusProgress();timeController.render();return;}
        // 방향성
        if (R.focus.cur && nd != null && nd - (R.focus.cur.started ?? nd) + 1e-8 >= R.focus.cur.days) completeFocus();
        // 격변
        crisisList().forEach(c => {
            const st = R.crises[c.id] || (R.crises[c.id] = { status: 'idle', missions: {} });
            if (st.status === 'idle') {
                const dateOk = !c.date || (today() ?? -Infinity) >= (keyOf(c.date) ?? Infinity);
                if (dateOk && (c.trigger ? test(c.trigger) : !!c.date)) startCrisis(c);
                return;
            }
            if (st.status !== 'active') return;
            let months = 0;
            if (nd != null && st.lastDay != null && nd > st.lastDay) { const m = (nd - st.lastDay) / 30.44 + (st.carry || 0); months = Math.floor(m); st.carry = m - months; }
            st.lastDay = nd;
            tickCrisis(c, months);
        });
        checkArticles();
        // 결말 (엔딩)
        const e = (R.data.endings || []).find(x => x && x.condition && test(x.condition));
        if (e) { R.ending = { id: e.id, at: today() };timeController.pause('시나리오 결말 · 일시정지'); setTimeout(() => showEnding(e), 400); }
        refresh();
    }
    const keyOf = s => { const m = /^(-?\d{1,5})(?:-(\d{1,2}))?(?:-(\d{1,2}))?$/.exec(String(s ?? '').trim()); return m ? +m[1] * 10000 + (+m[2] || 1) * 100 + (+m[3] || 1) : null; };

    const origAdvance = window.advanceNationDate;
    const timeController=HemiCampaignTime.create({
        state:()=>R,
        mirror:()=>{mirrorClockValues();window.updateDispInfoBar?.();},
        advanceWorldDay:()=>{mirrorPreviousDay();origAdvance?.(1,'day');},
        tick:options=>tick(options),
        save:()=>{try{window.saveActiveNow?.(true);}catch(e){/* normal save captures the clock */}},
        saveSoon:()=>{try{if(window.saveActiveSoon)window.saveActiveSoon();else window.saveActiveNow?.(true);}catch(e){/* normal save captures the clock */}}
    });
    function mirrorPreviousDay(){
        if(!R?.clock)return;const p=Clock.parts(R.clock.day-1);
        for(const [id,v]of [['nationDateYear',p.y],['nationDateMonth',p.m],['nationDateDay',p.d]]){const e=document.getElementById(id);if(e)e.value=v;}
    }
    if (typeof origAdvance === 'function') window.advanceNationDate = function () {
        if(R){toast('시나리오 시간의 진행/일시정지 또는 다음 턴을 사용하세요.');return false;}
        return origAdvance.apply(this,arguments);
    };
    const origApply = window.elecApplyToParliament;
    if (typeof origApply === 'function') window.elecApplyToParliament = function () {
        const r = origApply.apply(this, arguments);
        if (R) setTimeout(tick, 10);
        return r;
    };

    // ---------------------------------------------------------------
    // 창: 슈퍼 모달 (격변 시작 · 결말 · 엔딩 · 시나리오 소개)
    // ---------------------------------------------------------------
    function superModal(o, buttons) {
        const ov = el(`<div class="cp-overlay"><div class="cp-super" role="dialog" aria-modal="true" style="${o.color ? `--cp-c:${esc(o.color)}` : ''}">
            ${o.image ? `<img class="cp-super-img" src="${esc(o.image)}" alt="">` : ''}
            <div class="cp-kicker">${esc(o.kicker || '')}</div>
            <h2 class="cp-super-title">${esc(fillT(o.title || ''))}</h2>
            <div class="cp-super-body">${paras(fillT(o.text || ''))}</div>
            ${o.extra || ''}
            <div class="cp-row cp-end">${(buttons || [{ text: '확인', primary: true }]).map((b, i) => `<button type="button" class="cp-btn ${b.primary ? 'cp-primary' : ''}" data-i="${i}">${esc(b.text)}</button>`).join('')}</div>
        </div></div>`);
        const close = () => { ov.remove(); document.removeEventListener('keydown', onKey, true); };
        const onKey = e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
        ov.querySelectorAll('[data-i]').forEach(b => { b.onclick = () => { close(); const f = (buttons || [])[+b.dataset.i]?.on; if (f) f(); }; });
        document.addEventListener('keydown', onKey, true);
        document.body.appendChild(ov);
        ov.querySelector('.cp-primary, [data-i]')?.focus();
    }
    function showIntro() {
        if (!R) return;
        const d = R.data, s = (d.starts || []).find(x => x.id === R.startId);
        superModal({ kicker: `시나리오${d.author ? ` · 제작자: ${d.author}` : ''}`, title: d.title || '시나리오', text: [d.lore || d.description || '', s && s.desc ? `▶ ${s.name || ''}\n${s.desc}` : ''].filter(Boolean).join('\n\n'), image: d.image },
            [{ text: '방향성 트리 보기', on: () => openTab('campfocus') }, { text: '시작하기', primary: true, on: () => openTab('campaign') }]);
    }
    function showEnding(e) {
        superModal({ kicker: `${R.data.title || '시나리오'} — 결말`, title: e.title || e.id, text: e.text, image: e.image, extra: `<div class="cp-dim">${esc(labelOf(R.ending && R.ending.at))}</div>` },
            [{ text: '편집기로', on: () => { location.href = 'scenario.html'; } }, { text: '계속 플레이', primary: true }]);
    }

    // Campaign news is a one-time narrative reader and archive, independent of HemiNews.
    let articleWindow = null, articlePump = 0, articleCheck = 0;
    const articleList = () => Array.isArray(R?.data.articles) ? R.data.articles : [];
    function saveArticles() { try { window.saveActiveNow?.(true); } catch (e) { /* normal save still captures the queue */ } }
    function resetArticleWindow() {
        clearTimeout(articlePump); articlePump = 0; clearTimeout(articleCheck); articleCheck = 0;
        articleWindow?.close(false); articleWindow = null;
    }
    function scheduleArticles() {
        clearTimeout(articlePump);
        articlePump = setTimeout(() => {
            articlePump = 0;
            if (!R || articleWindow || !R.articles.queue.length || SM()?.state?.queue?.length || document.querySelector('.cp-overlay,.sm-overlay,.ca-overlay,.dno-dialog-overlay')) return;
            const id = R.articles.queue[0], article = articleList().find(a=>a.id===id);
            if (!article) { R.articles.queue.shift(); scheduleArticles(); return; }
            readArticle(id);
        }, 0);
    }
    // 지도가 바뀌면 날짜를 넘기지 않고 방향성 조건 · 격변 · 기사 · 결말을 다시 본다 (js/scriptmods.js의 "지도 변경 시" 이벤트 검사 뒤에)
    let worldTick = 0;
    window.addEventListener('hemi-world-map-changed', () => { if (!R || worldTick) return; worldTick = setTimeout(() => { worldTick = 0; if (R && !loadingCampaign) tick(); }, 0); });
    window.addEventListener('hemi-script-effects-applied',()=>{if(!R)return;clearTimeout(articleCheck);articleCheck=setTimeout(()=>{articleCheck=0;checkArticles();},0);});
    function publishArticle(id) {
        if (!R) return false;
        const article = articleList().find(a=>a.id===id);
        if (!HemiCampaignArticles.publish(R, article, today())) return false;
        R.articles.published[id].content = Object.fromEntries(['title','subtitle','body','source'].map(k=>[k,fillT(article[k]||'')]));
        saveArticles(); scheduleArticles(); return true;
    }
    function checkArticles() {
        if (!R) return;
        HemiCampaignArticles.due(R.data, R, test, today()).forEach(a=>publishArticle(a.id));
        scheduleArticles();
    }
    function readArticle(id) {
        const article = articleList().find(a=>a.id===id), record = R?.articles.published[id];
        if (!article || !record || articleWindow) return;
        const state = R;
        articleWindow = HemiCampaignArticles.show({...article,...record.content}, {
            date: labelOf(record.at), fill: record.content ? undefined : fillT,
            onClose() {
                articleWindow = null;
                if (R !== state) return;
                record.read = true; R.articles.queue = R.articles.queue.filter(x=>x!==id);
                saveArticles(); refresh(); scheduleArticles();
            }
        });
    }
    function renderArticles(host) {
        const published = Object.entries(R.articles.published).reverse();
        host.innerHTML = `<div class="cp-wrap"><div class="cp-h">시나리오 기사 <span class="cp-dim">${published.length}건</span></div><p class="cp-dim">진행 중 전달된 소식입니다. 기사를 눌러 다시 읽을 수 있습니다.</p>${published.map(([id,record])=>{
            const a=articleList().find(a=>a.id===id);if(!a)return '';
            return `<button type="button" class="cp-btn" data-read-article="${esc(id)}"><b>${esc(record.content?.title||a.title||id)}</b><span class="cp-grow"></span><span class="cp-dim">${esc(labelOf(record.at))}${record.read?'':' · 새 기사'}</span></button>`;
        }).join('')||'<div class="cp-empty">아직 발행된 시나리오 기사가 없습니다.</div>'}</div>`;
        host.querySelectorAll('[data-read-article]').forEach(b=>b.onclick=()=>readArticle(b.dataset.readArticle));
    }
    // Modals are direct body children. Wait for introductions/events/crises to close
    // before presenting the next article, rather than stacking newspaper windows.
    new MutationObserver(() => { if (R?.articles?.queue.length && !articleWindow) scheduleArticles(); }).observe(document.body,{childList:true});

    // ---------------------------------------------------------------
    // 국가 › 시나리오 탭 (왼쪽) · 오른쪽 시각 화면 "시나리오"
    // ---------------------------------------------------------------
    // 시나리오 세이브에서는 맨 위에 "시나리오" 상위 탭 (개요 · 방향성 · 격변) — 사이드 메뉴는 js/sidenav.js가 이 버튼들로 묶음을 만든다
    (function addMainTab() {
        const bar = document.querySelector('.main-tab-container');
        const ref = document.getElementById('mainContentSetup');
        if (!bar || !ref) return;
        bar.insertBefore(el(`<button class="main-tab-btn" onclick="switchMainTab('campaign')" id="mainTabCampaign" style="display:none;">🎯 시나리오</button>`), bar.firstChild);
        ref.parentElement.insertBefore(el(`<div id="mainContentCampaign" class="main-tab-content"><div class="cp-time-bar" data-campaign-time hidden></div>
            <div class="sub-tab-container" style="margin-top:10px;">
                <button class="sub-tab-btn active" id="subTabCampaign" onclick="switchSubTab('campaign','campaign')">개요</button>
                <button class="sub-tab-btn" id="subTabCampfocus" onclick="switchSubTab('campaign','campfocus')">방향성</button>
                <button class="sub-tab-btn" id="subTabCampcrisis" onclick="switchSubTab('campaign','campcrisis')">격변</button>
                <button class="sub-tab-btn" id="subTabCamparticles" onclick="switchSubTab('campaign','camparticles')">기사</button>
            </div>
            <div id="contentCampaign" class="sub-tab-content active"></div>
            <div id="contentCampfocus" class="sub-tab-content"></div>
            <div id="contentCampcrisis" class="sub-tab-content"></div><div id="contentCamparticles" class="sub-tab-content"></div>
        </div>`), ref);
        try { if (typeof currentSubTab !== 'undefined' && !currentSubTab.campaign) currentSubTab.campaign = 'campaign'; } catch (e) { /* 없음 */ }
    })();
    const origSwitchSub = window.switchSubTab;
    window.switchSubTab = function (main, sub) {
        const r = origSwitchSub.apply(this, arguments);
        if (main === 'campaign') {
            if (sub === 'campfocus') ui.view = 'focus';
            if (sub === 'campcrisis') ui.view = 'crisis';
            if (sub === 'camparticles') ui.view = 'articles';
            renderLeft(); showDisp();
        }
        return r;
    };
    const curCampSub = () => (typeof currentMainTab !== 'undefined' && currentMainTab === 'campaign' && typeof currentSubTab !== 'undefined' ? currentSubTab.campaign || 'campaign' : null);
    const onTab = () => !!curCampSub();
    function openTab(sub) { try { switchSubTab('campaign', sub || 'campaign'); } catch (e) { /* 화면 없음 */ } }

    (function addDisp() {
        const after = document.getElementById('dispTabNews') || document.getElementById('dispTabEconomy') || document.getElementById('dispTabCabinet');
        const ref = document.getElementById('dispPanelNews') || document.getElementById('dispPanelEconomy') || document.getElementById('dispPanelCabinet');
        if (!after || !ref) return;
        after.parentElement.insertBefore(el(`<button class="disp-tab-btn" id="dispTabCampaign" data-tab="campaign" onclick="switchDispTab('campaign')" style="display:none;"><span class="disp-tab-label">시나리오</span><span class="disp-tab-close" onclick="event.stopPropagation();closeDispTab('campaign')">×</span></button>`), after.nextSibling);
        ref.parentElement.insertBefore(el(`<div class="disp-panel" id="dispPanelCampaign"><div class="chamber-box cp-disp"><div class="cp-disp-bar" id="cpDispBar"></div><div id="cpDisp"></div></div></div>`), ref.nextSibling);
    })();
    const dispActive = () => !!document.getElementById('dispPanelCampaign')?.classList.contains('active');
    function showDisp() {
        const btn = document.getElementById('dispTabCampaign');
        if (btn) btn.style.display = '';
        try { if (!dispActive()) switchDispTab('campaign'); else renderDisp(); } catch (e) { /* 화면 없음 */ }
    }
    const origDisp = window.switchDispTab;
    window.switchDispTab = function (tab) {
        const r = origDisp.apply(this, arguments);
        if (tab === 'campaign') setTimeout(renderDisp, 20);
        return r;
    };

    function refresh() {
        timeController.render();
        const btn = document.getElementById('mainTabCampaign');
        if (btn) btn.style.display = R ? '' : 'none';
        if (!R) {
            const db = document.getElementById('dispTabCampaign'); if (db) db.style.display = 'none';
            if (onTab()) { try { switchMainTab('nation'); } catch (e) { /* 화면 없음 */ } }
        }
        if (onTab()) renderLeft();
        if (dispActive()) renderDisp();
    }

    const meterHtml = m => {
        const v = varOf(m.id), lo = m.min ?? 0, hi = m.max ?? 100, pct = hi > lo ? (v - lo) / (hi - lo) * 100 : 0;
        return `<div class="cp-meter" title="${esc(m.desc || '')}"><div class="cp-meter-h"><span>${esc(m.name || m.id)}</span><b>${Math.round(v * 10) / 10}${hi === 100 && lo === 0 ? '%' : ` / ${hi}`}</b>${m.perMonth ? `<span class="cp-dim">${m.perMonth > 0 ? '+' : ''}${m.perMonth}/월</span>` : ''}</div>
            <div class="cp-bar"><i style="width:${clamp(pct, 0, 100)}%;${m.color ? `background:${esc(m.color)}` : ''}"></i></div></div>`;
    };
    function missionsHtml(c) {
        const st = R.crises[c.id], nd = nowDay() ?? 0;
        const list = (c.missions || []).filter(m => m && m.id && st.missions[m.id]);
        if (!list.length) return '';
        return `<div class="cp-h">임무</div>${list.map(m => {
            const ms = st.missions[m.id], left = Number(m.days) ? Math.max(0, Number(m.days) - (nd - ms.started)) : null;
            const pct = Number(m.days) ? clamp((nd - ms.started) / Number(m.days) * 100, 0, 100) : 0;
            return `<div class="cp-mission ${ms.status}"><div class="cp-mission-h"><span class="cp-ico">${{ active: '⏳', done: '✔', failed: '✖', cancelled: '–' }[ms.status]}</span><b>${esc(fillT(m.title || m.id))}</b>
                <span class="cp-grow"></span>${ms.status === 'active' && left != null ? `<span class="cp-days">${period(left)} 남음</span>` : `<span class="cp-dim">${{ done: '성공', failed: '실패', cancelled: '취소됨', active: '' }[ms.status]}</span>`}</div>
                ${m.desc ? `<div class="cp-dim">${esc(fillT(m.desc))}</div>` : ''}
                ${ms.status === 'active' && left != null ? `<div class="cp-bar cp-bar-thin"><i style="width:${pct}%"></i></div>` : ''}</div>`;
        }).join('')}`;
    }
    function decisionsHtml(c) {
        const list = SM() ? SM().decisions(modId(), d => d._crisis === c.id) : [];
        if (!list.length) return '';
        return `<div class="cp-h">격변 결정</div>${list.map(d => `<div class="cp-dec ${d.block ? 'off' : ''}"><div class="cp-grow"><b>${esc(d.title)}</b>${d.desc ? `<div class="cp-dim">${esc(d.desc)}</div>` : ''}</div>
            <button type="button" class="cp-btn ${d.block ? '' : 'cp-primary'}" data-take="${esc(d.id)}" ${d.block ? 'disabled' : ''}>${esc(d.block || '결정하기')}</button></div>`).join('')}`;
    }
    function crisisCard(c, big) {
        const st = R.crises[c.id];
        const o = st.outcome && (c.outcomes || []).find(x => x.id === st.outcome);
        return `<div class="cp-crisis ${st.status} ${big ? 'big' : ''}" style="${c.color ? `--cp-c:${esc(c.color)}` : ''}">
            <div class="cp-crisis-h"><span class="cp-tag">${{ active: '진행 중', ended: '끝남', idle: '아직' }[st.status]}</span><b>${esc(c.title || c.id)}</b><span class="cp-grow"></span>${st.started ? `<span class="cp-dim">${esc(labelOf(st.started))}~</span>` : ''}</div>
            ${big && c.image ? `<img class="cp-crisis-img" src="${esc(c.image)}" alt="">` : ''}
            ${c.desc && (big || st.status === 'active') ? `<div class="cp-crisis-desc">${big ? paras(fillT(c.desc)) : esc(fillT(c.desc)).slice(0, 160)}</div>` : ''}
            ${st.status === 'active' ? (c.meters || []).filter(m => m && m.id).map(meterHtml).join('') + missionsHtml(c) + decisionsHtml(c) : ''}
            ${st.status === 'ended' && o ? `<div class="cp-outcome">결말: <b>${esc(o.title || o.id)}</b></div>` : ''}
        </div>`;
    }
    function bindDecisions(host) {
        host.querySelectorAll('[data-take]').forEach(b => { b.onclick = () => { SM().take(modId(), b.dataset.take); setTimeout(() => { tick(); }, 50); }; });
    }

    function renderLeft() {
        const sub = curCampSub();
        if (sub === 'campfocus') { renderFocusLeft(); return; }
        if (sub === 'campcrisis') { renderCrisisLeft(); return; }
        if (sub === 'camparticles') { const host=document.getElementById('contentCamparticles');if(host&&R)renderArticles(host);return; }
        const host = document.getElementById('contentCampaign');
        if (!host) return;
        if (!R) { host.innerHTML = '<div class="cp-empty">이 세이브에는 시나리오가 없습니다. 메인 화면 › 시나리오 · 격변에서 시나리오를 만들고 "시험 플레이"하세요.</div>'; return; }
        const d = R.data, cur = R.focus.cur, f = cur && focusById(cur.id), nd = nowDay() ?? 0;
        const left = cur ? Math.max(0, cur.days - (nd - (cur.started ?? nd))) : 0;
        const active = crisisList().filter(c => R.crises[c.id]?.status === 'active');
        const ended = crisisList().filter(c => R.crises[c.id]?.status === 'ended');
        const avail = focusList().filter(x => focusState(x) === 'available');
        const ending = R.ending && (d.endings || []).find(e => e.id === R.ending.id);
        host.innerHTML = `<div class="cp-wrap">
            <div class="cp-head"><div class="cp-kicker">시나리오 · 테스트</div><div class="cp-title">${esc(d.title || '시나리오')}</div>${d.author ? `<div class="cp-dim">제작자: ${esc(d.author)}</div>` : ''}
                <div class="cp-row"><button type="button" class="cp-btn" data-intro>세계관</button><button type="button" class="cp-btn" data-tree>방향성 트리</button><button type="button" class="cp-btn" data-crisis-view>격변 화면</button><button type="button" class="cp-btn" data-articles>기사</button><a class="cp-btn" href="scenario.html">편집기</a></div></div>
            ${ending ? `<div class="cp-ending">🏁 결말: <b>${esc(ending.title || ending.id)}</b> <button type="button" class="cp-btn" data-ending>다시 보기</button></div>` : ''}
            <div class="cp-card"><div class="cp-h">방향성</div>
                ${cur ? `<div class="cp-focus-cur"><b>${esc(f ? f.title : cur.id)}</b><span class="cp-grow"></span><span class="cp-days">${period(left)} 남음</span></div>
                    <div class="cp-bar"><i style="width:${cur.days ? clamp((cur.days - left) / cur.days * 100, 0, 100) : 100}%"></i></div>`
                : `<div class="cp-dim">${avail.length ? `고를 수 있는 방향성 ${avail.length}개 — 방향성 트리에서 고르세요` : focusList().length ? '지금 고를 수 있는 방향성이 없습니다' : '이 시나리오에는 방향성 트리가 없습니다'}</div>`}
                ${!cur && avail.length ? `<div class="cp-row">${avail.slice(0, 6).map(x => `<button type="button" class="cp-btn" data-focus="${esc(x.id)}">${esc(x.title || x.id)} <span class="cp-dim">${period(Number(x.days)||0)}</span></button>`).join('')}</div>` : ''}
                <div class="cp-dim">끝낸 방향성 ${Object.keys(R.focus.done).length} / ${focusList().length}</div></div>
            <div class="cp-h2">진행 중인 격변 ${active.length}</div>
            ${active.map(c => crisisCard(c, false)).join('') || '<div class="cp-dim">진행 중인 격변이 없습니다.</div>'}
            ${ended.length ? `<div class="cp-h2">지나간 격변</div>${ended.map(c => crisisCard(c, false)).join('')}` : ''}
            <div class="cp-row"><button type="button" class="cp-btn" data-check>지금 확인</button><button type="button" class="cp-btn cp-x" data-quit>시나리오 끝내기</button></div>
        </div>`;
        host.querySelector('[data-intro]').onclick = showIntro;
        host.querySelector('[data-tree]').onclick = () => openTab('campfocus');
        host.querySelector('[data-crisis-view]').onclick = () => openTab('campcrisis');
        host.querySelector('[data-articles]').onclick=()=>openTab('camparticles');
        host.querySelector('[data-ending]')?.addEventListener('click', () => showEnding(ending));
        host.querySelectorAll('[data-focus]').forEach(b => { b.onclick = () => startFocus(b.dataset.focus); });
        host.querySelector('[data-check]').onclick = () => { tick(); toast('시나리오를 확인했습니다'); };
        host.querySelector('[data-quit]').onclick = () => showCustomConfirm('이 세이브에서 시나리오를 뗄까요? 나라는 그대로 두고 방향성 · 격변 · 시나리오 이벤트 · 결정만 없어집니다.', () => { timeController.pause();resetArticleWindow();R = null;timeController.reset();window.dispatchEvent(new Event('hemi-campaign-changed')); bindMod(); refresh(); });
        bindDecisions(host);
    }

    // 시나리오 › 방향성 — 지금 진행 · 고를 수 있는 것 · 끝낸 것 (트리는 오른쪽)
    function renderFocusLeft() {
        const host = document.getElementById('contentCampfocus');
        if (!host || !R) return;
        const cur = R.focus.cur, f = cur && focusById(cur.id), nd = nowDay() ?? 0;
        const left = cur ? Math.max(0, cur.days - (nd - (cur.started ?? nd))) : 0;
        const by = st => focusList().filter(x => focusState(x) === st);
        const item = (x, btn) => `<div class="cp-dec">${iconOf(x, 'cp-li')}<div class="cp-grow"><b>${esc(x.title || x.id)}</b><div class="cp-dim">${period(Number(x.days)||0)}${x.desc ? ' · ' + esc(fillT(x.desc)).slice(0, 80) : ''}</div></div>${btn || ''}</div>`;
        host.innerHTML = `<div class="cp-wrap">
            <div class="cp-card"><div class="cp-h">진행 중</div>
                ${cur ? `<div class="cp-focus-cur"><b>${esc(f ? f.title : cur.id)}</b><span class="cp-grow"></span><span class="cp-days">${period(left)} 남음</span></div><div class="cp-bar"><i style="width:${cur.days ? clamp((cur.days - left) / cur.days * 100, 0, 100) : 100}%"></i></div>` : '<div class="cp-dim">진행 중인 방향성이 없습니다.</div>'}</div>
            <div class="cp-h2">고를 수 있음 ${by('available').length}</div>
            ${by('available').map(x => item(x, `<button type="button" class="cp-btn cp-primary" data-focus="${esc(x.id)}">시작</button>`)).join('') || '<div class="cp-dim">지금 고를 수 있는 방향성이 없습니다.</div>'}
            ${by('done').length ? `<div class="cp-h2">끝냄 ${by('done').length}</div>${by('done').map(x => item(x, `<span class="cp-dim">${esc(labelOf(R.focus.done[x.id] > 1 ? R.focus.done[x.id] : null))}</span>`)).join('')}` : ''}
            <div class="cp-dim">오른쪽 방향성 트리에서 상자를 눌러 자세히 보고 고를 수도 있습니다.</div>
        </div>`;
        host.querySelectorAll('[data-focus]').forEach(b => { b.onclick = () => startFocus(b.dataset.focus); });
    }
    // 시나리오 › 격변 — 진행 중인 격변은 크게, 지나간 격변은 결말과 함께
    function renderCrisisLeft() {
        const host = document.getElementById('contentCampcrisis');
        if (!host || !R) return;
        const active = crisisList().filter(c => R.crises[c.id]?.status === 'active');
        const ended = crisisList().filter(c => R.crises[c.id]?.status === 'ended');
        const idle = crisisList().filter(c => R.crises[c.id]?.status === 'idle');
        host.innerHTML = `<div class="cp-wrap">
            <div class="cp-h2">진행 중 ${active.length}</div>
            ${active.map(c => crisisCard(c, false)).join('') || '<div class="cp-dim">진행 중인 격변이 없습니다.</div>'}
            ${ended.length ? `<div class="cp-h2">지나감 ${ended.length}</div>${ended.map(c => crisisCard(c, false)).join('')}` : ''}
            ${idle.length ? `<div class="cp-dim">아직 시작하지 않은 격변 ${idle.length}개 — 날짜 · 조건이 맞으면 시작됩니다.</div>` : ''}
        </div>`;
        bindDecisions(host);
    }

    function renderDisp() {
        const bar = document.getElementById('cpDispBar'), box = document.getElementById('cpDisp');
        if (!bar || !box) return;
        if(!R||ui.view!=='focus'){box._treeViewport?.destroy();box._treeViewport=null;}
        if (!R) { bar.innerHTML = ''; box.innerHTML = '<div class="cp-empty">시나리오가 없습니다.</div>'; return; }
        bar.innerHTML = `<div class="cp-seg"><button type="button" data-view="focus" class="${ui.view === 'focus' ? 'on' : ''}">방향성 트리</button><button type="button" data-view="crisis" class="${ui.view === 'crisis' ? 'on' : ''}">격변</button><button type="button" data-view="articles" class="${ui.view === 'articles' ? 'on' : ''}">기사</button></div><span class="cp-grow"></span><b class="cp-disp-title">${esc(R.data.title || '')}</b>`;
        bar.querySelectorAll('[data-view]').forEach(b => { b.onclick = () => { ui.view = b.dataset.view; renderDisp(); }; });
        if (ui.view === 'crisis') renderCrisisView(box); else if(ui.view === 'articles')renderArticles(box); else renderTree(box);
    }

    // 방향성 트리 — 칸(x, y)에 놓인 상자들, 앞선 방향성(prereq: 실선, any: 점선)과 배타(exclusive: 빨간 ✕)
    function renderTree(box) {
        const oldWrap=box.querySelector('.cp-tree-wrap'), scroll=oldWrap?{x:oldWrap.scrollLeft,y:oldWrap.scrollTop}:{x:0,y:0};
        box._treeViewport?.destroy();box._treeViewport=null;
        const list = focusList();
        if (!list.length) { box.innerHTML = '<div class="cp-empty">이 시나리오에는 방향성 트리가 없습니다.</div>'; return; }
        const FV = window.HemiFocusView, st = FV ? FV.style(R.data) : { width: 150, height: 74, gapX: 30, gapY: 46 };
        const W = st.width, H = st.height, GX = st.gapX, GY = st.gapY, P = FV ? FV.padding(R.data,st) : 20;
        const pos = f => ({ x: P + (Number(f.x) || 0) * (W + GX), y: P + (Number(f.y) || 0) * (H + GY) });
        const maxX = Math.max(...list.map(f => pos(f).x)) + W + P, maxY = Math.max(...list.map(f => pos(f).y)) + H + P;
        let lines = '';
        list.forEach(f => {
            const b = pos(f);
            const link = (id, dash) => { const a = focusById(id); if (!a) return; const p = pos(a); const x1 = p.x + W / 2, y1 = p.y + H, x2 = b.x + W / 2, y2 = b.y, my = (y1 + y2) / 2;
                lines += `<path d="M${x1},${y1} V${my} H${x2} V${y2}" class="cp-link ${R.focus.done[id] ? 'on' : ''}" ${dash ? 'stroke-dasharray="5 4"' : ''}/>`; };
            (f.prereq || []).forEach(id => link(id, false));
            (f.any || []).forEach(id => link(id, true));
            (f.exclusive || []).forEach(id => { const a = focusById(id); if (!a || id < f.id) return; const p = pos(a); const y = Math.min(p.y, b.y) + H / 2;
                if (Math.abs(p.y - b.y) < 1) { const x1 = Math.min(p.x, b.x) + W, x2 = Math.max(p.x, b.x); lines += `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" class="cp-excl"/><text x="${(x1 + x2) / 2}" y="${y + 5}" text-anchor="middle" class="cp-excl-t">✕</text>`; } });
        });
        const sel = ui.sel && focusById(ui.sel);
        box.innerHTML = `<div class="cp-row cp-tree-tools"><span class="cp-dim">방향성 ${Object.keys(R.focus.done).length} / ${list.length} 완료</span><span class="cp-grow"></span><button type="button" class="cp-btn" data-tree-zoom="out" aria-label="트리 축소">−</button><span class="cp-dim" data-tree-zoom-label>${Math.round(ui.treeZoom*100)}%</span><button type="button" class="cp-btn" data-tree-zoom="in" aria-label="트리 확대">+</button><button type="button" class="cp-btn" data-tree-fit>전체 보기</button></div><div class="cp-tree-wrap"><div style="width:${maxX*ui.treeZoom}px;height:${maxY*ui.treeZoom}px"><div class="cp-tree hf-scope" id="cpFocusTree" style="width:${maxX}px;height:${maxY}px;transform:scale(${ui.treeZoom});transform-origin:top left">${FV ? FV.styleTag(st, '#cpFocusTree') : ''}
            <svg class="cp-tree-svg" width="${maxX}" height="${maxY}">${lines}</svg>
            ${list.map(f => { const p = pos(f), s = focusState(f), cur = R.focus.cur && R.focus.cur.id === f.id;
                const nd = nowDay() ?? 0, pct = cur && R.focus.cur.days ? clamp((nd - (R.focus.cur.started ?? nd)) / R.focus.cur.days * 100, 0, 100) : 0;
                const daysText = s === 'done' ? '완료' : cur ? `${period(Math.max(0,R.focus.cur.days-(nd-(R.focus.cur.started??nd))))} 남음` : `${period(Number(f.days)||0)}`;
                return `<button type="button" class="cp-node hf-node hf-${s} ${ui.sel === f.id ? 'sel' : ''}" data-node="${esc(f.id)}" style="left:${p.x}px;top:${p.y}px;width:${W}px;height:${H}px" title="${esc(f.title || f.id)}">
                    ${FV ? FV.inner(f, { status: s, daysText, progress: pct, current: cur }, st) : esc(f.title || f.id)}</button>`; }).join('')}
        </div></div></div>
        ${sel ? `<div class="cp-node-detail"><div class="cp-row">${iconOf(sel, 'cp-li')}<b>${esc(sel.title || sel.id)}</b><span class="cp-grow"></span><span class="cp-dim">${period(Number(sel.days)||0)} · ${{ done: '완료', current: '진행 중', available: '고를 수 있음', locked: '아직 못 고름', blocked: '다른 길을 골라 막힘' }[focusState(sel)]}</span></div>
            ${sel.desc ? `<div class="cp-crisis-desc">${paras(fillT(sel.desc))}</div>` : ''}
            ${(sel.prereq || []).length ? `<div class="cp-dim">먼저: ${sel.prereq.map(id => esc((focusById(id) || {}).title || id)).join(', ')}</div>` : ''}
            ${(sel.any || []).length ? `<div class="cp-dim">이 중 하나 먼저: ${sel.any.map(id => esc((focusById(id) || {}).title || id)).join(', ')}</div>` : ''}
            ${(sel.exclusive || []).length ? `<div class="cp-dim">함께 못 고름: ${sel.exclusive.map(id => esc((focusById(id) || {}).title || id)).join(', ')}</div>` : ''}
            ${focusState(sel) === 'available' ? `<div class="cp-row"><button type="button" class="cp-btn cp-primary" data-start-focus="${esc(sel.id)}">이 방향으로 (${period(Number(sel.days)||0)})</button></div>` : ''}</div>` : '<div class="cp-dim cp-hint">휠로 확대/축소하고 휠 버튼을 누른 채 끌어 이동합니다. 상자를 눌러 방향성을 고르세요. 한 번에 하나씩 진행합니다.</div>'}`;
        const wrap=box.querySelector('.cp-tree-wrap');
        box._treeViewport=HemiTreeViewport.mount(wrap,box.querySelector('#cpFocusTree'),{
            zoom:ui.treeZoom,left:scroll.x,top:scroll.y,
            onChange:view=>{ui.treeZoom=view.zoom;box.querySelector('[data-tree-zoom-label]').textContent=Math.round(view.zoom*100)+'%';}
        });
        box.querySelectorAll('[data-tree-zoom]').forEach(b=>b.onclick=()=>box._treeViewport.zoomBy(b.dataset.treeZoom==='in'?.15:-.15));
        box.querySelector('[data-tree-fit]').onclick=()=>box._treeViewport.fit();
        box.querySelectorAll('[data-node]').forEach(b => { b.onclick = () => { ui.sel = b.dataset.node; renderTree(box); }; b.ondblclick = () => startFocus(b.dataset.node); });
        box.querySelector('[data-start-focus]')?.addEventListener('click', e => startFocus(e.target.dataset.startFocus));
    }
    function renderCrisisView(box) {
        const list = crisisList().filter(c => R.crises[c.id]?.status !== 'idle');
        if (!list.length) { box.innerHTML = `<div class="cp-empty">아직 시작된 격변이 없습니다.${crisisList().length ? ` 이 시나리오의 격변 ${crisisList().length}개는 날짜 · 조건이 맞으면 시작됩니다.` : ''}</div>`; return; }
        const active = list.filter(c => R.crises[c.id].status === 'active');
        const pick = list.find(c => c.id === ui.sel) || active[0] || list[0];
        box.innerHTML = `${list.length > 1 ? `<div class="cp-row">${list.map(c => `<button type="button" class="cp-chip ${c === pick ? 'on' : ''} ${R.crises[c.id].status}" data-pick="${esc(c.id)}">${esc(c.title || c.id)}</button>`).join('')}</div>` : ''}${crisisCard(pick, true)}`;
        box.querySelectorAll('[data-pick]').forEach(b => { b.onclick = () => { ui.sel = b.dataset.pick; renderCrisisView(box); }; });
        bindDecisions(box);
    }

    // ---------------------------------------------------------------
    // 시작: scenario.html이 맡긴 시나리오를 새 세이브에 붙이기
    // ---------------------------------------------------------------
    let pendingRaw = null, pendingStash = false;
    try {
        pendingRaw = sessionStorage.getItem('hemiBootCampaign'); sessionStorage.removeItem('hemiBootCampaign');
        pendingStash = !!sessionStorage.getItem('hemiBootCampaignPending'); sessionStorage.removeItem('hemiBootCampaignPending');
    } catch (e) { /* sessionStorage 없음 */ }
    async function takePending() {
        let raw = pendingRaw; pendingRaw = null;
        if (!raw && pendingStash) { pendingStash = false; try { const v = await window.HemiFile.take('bootCampaign'); raw = v && v.text; } catch (e) { raw = null; } }
        if (!raw) return null;
        try { const d = JSON.parse(raw); return d && d.format === FORMAT ? d : null; } catch (e) { return null; }
    }
    function attach(d, startId) {
        resetArticleWindow();
        const data = JSON.parse(JSON.stringify(d));
        (data.starts || []).forEach(s => { delete s.state; }); // 시작 세이브는 세이브에 다시 넣지 않는다
        delete data._startId;
        R = normalize({ data, startId: startId || null, focus: { cur: null, done: {} }, crises: {}, ending: null, startedAt: today() },true);
        R.worldBindings = declaredBindings(R);
        R.playRules = isObj(data.playRules) ? JSON.parse(JSON.stringify(data.playRules)) : {};
        bindMod();timeController.reset();window.dispatchEvent(new Event('hemi-campaign-changed'));R.startedAt=today();
        tick();
        refresh();
        openTab('campaign');
        showIntro();
        try { if (typeof window.saveActiveNow === 'function') window.saveActiveNow(true); } catch (e) { /* 자동저장에 맡김 */ }
    }
    if (pendingRaw || pendingStash) {
        const origCreate = window.createNamedSlotFromCurrentState;
        if (typeof origCreate === 'function') window.createNamedSlotFromCurrentState = function () {
            const r = origCreate.apply(this, arguments);
            window.createNamedSlotFromCurrentState = origCreate;
            takePending().then(d => { if (d) setTimeout(() => attach(d, d._startId), 250); });
            return r;
        };
    }

    window.HemiCampaign = { get state() { return R; }, tick, startFocus, publishArticle, attach, showIntro, showDisp, FORMAT, toMod, worldContext, lockReason,
        nextTurn:timeController.nextTurn, play:timeController.play, pause:timeController.pause, setSpeed:timeController.speed,
        scriptDate:id=>!loadingCampaign&&R?.clock&&id===modId()?{...Clock.parts(R.clock.day),key:today()}:null,
        scriptDateLabel:id=>!loadingCampaign&&R?.clock&&id===modId()?Clock.label(R.clock):null };

    const css = document.createElement('style');
    css.textContent = `
        .cp-wrap { display: flex; flex-direction: column; gap: 10px; font-size: .85rem; }
        .cp-head { display: flex; flex-direction: column; gap: 3px; padding-bottom: 8px; border-bottom: 1px dashed #2a3138; }
        .cp-kicker { color: #8a94a3; font-size: .72rem; letter-spacing: 1px; }
        .cp-title { color: var(--tno-gold, #ffd700); font-size: 1.15rem; }
        .cp-dim { color: #8a94a3; font-size: .76rem; } .cp-grow { flex: 1 1 auto; min-width: 0; }
        .cp-row { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; } .cp-end { justify-content: center; margin-top: 14px; }
        .cp-btn { cursor: pointer; font: inherit; font-size: .8rem; padding: 5px 10px; background: transparent; border: 1px solid #444; color: #ccc; text-decoration: none; display: inline-flex; align-items: center; gap: 5px; }
        .cp-btn:hover { border-color: var(--tno-neon); color: var(--tno-neon); } .cp-btn:disabled { opacity: .5; cursor: default; }
        .cp-btn.cp-primary { border-color: var(--tno-gold, #ffd700); color: var(--tno-gold, #ffd700); } .cp-btn.cp-x:hover { border-color: #ef6461; color: #ef6461; }
        .cp-card { border: 1px solid #2a2f36; padding: 8px 10px; display: flex; flex-direction: column; gap: 6px; }
        .cp-h { color: var(--tno-gold, #ffd700); font-size: .78rem; letter-spacing: 1px; margin-top: 4px; }
        .cp-h2 { color: #ccc; font-size: .82rem; margin-top: 4px; }
        .cp-focus-cur { display: flex; align-items: baseline; gap: 8px; }
        .cp-days { color: var(--tno-neon); font-size: .78rem; }
        .cp-bar { height: 8px; background: #1a1f26; border: 1px solid #2a2f36; } .cp-bar i { display: block; height: 100%; background: var(--cp-c, var(--tno-neon)); transition: width .3s; }
        .cp-bar-thin { height: 4px; }
        .cp-crisis { --cp-c: #e5484d; border: 1px solid #2a2f36; border-left: 3px solid var(--cp-c); padding: 8px 10px; display: flex; flex-direction: column; gap: 6px; }
        .cp-crisis.ended { opacity: .75; }
        .cp-crisis.big { border-width: 1px 1px 1px 4px; padding: 12px 14px; }
        .cp-crisis-h { display: flex; align-items: center; gap: 8px; } .cp-crisis.big .cp-crisis-h b { font-size: 1.15rem; color: var(--cp-c); }
        .cp-tag { font-size: .66rem; padding: 0 6px; border: 1px solid var(--cp-c); color: var(--cp-c); }
        .cp-crisis-img { width: 100%; max-height: 220px; object-fit: cover; border: 1px solid #333; }
        .cp-crisis-desc { color: #b8c0c8; line-height: 1.65; font-size: .84rem; } .cp-crisis-desc p { margin: 0 0 8px; }
        .cp-meter-h { display: flex; align-items: baseline; gap: 8px; } .cp-meter-h b { color: var(--cp-c); }
        .cp-mission { border: 1px dashed #2a3138; padding: 6px 8px; display: flex; flex-direction: column; gap: 4px; }
        .cp-mission-h { display: flex; align-items: center; gap: 6px; } .cp-mission.done { border-color: #2f6f4f; } .cp-mission.failed { border-color: #6f2f2f; opacity: .8; }
        .cp-dec { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border: 1px solid #2a2f36; } .cp-dec.off { opacity: .65; }
        .cp-outcome { color: #ddd; } .cp-outcome b { color: var(--cp-c); }
        html[data-theme-family="modern"] .cp-node.sel { outline-color: var(--m-accent); }
        .cp-ending { border: 1px solid var(--tno-gold, #ffd700); padding: 8px 10px; color: var(--tno-gold, #ffd700); display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .cp-empty { color: #777; padding: 20px 6px; text-align: center; line-height: 1.7; }
        .cp-disp { display: flex; flex-direction: column; gap: 10px; }
        .cp-disp-bar { display: flex; align-items: center; gap: 8px; } .cp-disp-title { color: var(--tno-gold, #ffd700); font-weight: normal; }
        .cp-seg { display: inline-flex; border: 1px solid #333; } .cp-seg button { cursor: pointer; font: inherit; font-size: .82rem; padding: 5px 12px; background: transparent; border: none; color: #999; } .cp-seg button.on { background: var(--tno-neon); color: #000; }
        .cp-chip { cursor: pointer; font: inherit; font-size: .78rem; padding: 3px 10px; background: transparent; border: 1px solid #3a3f46; color: #aaa; } .cp-chip.on { border-color: var(--tno-neon); color: #fff; } .cp-chip.ended { opacity: .7; }
        .cp-tree-wrap { overflow: auto; height: 62vh; min-height: 260px; max-height: 62vh; border: 1px solid #2a3138; background: #090b0f; }
        .cp-tree { position: relative; }
        .cp-tree-svg { position: absolute; left: 0; top: 0; pointer-events: none; }
        .cp-link { fill: none; stroke: #3a4450; stroke-width: 2; } .cp-link.on { stroke: #3ecf8e; }
        .cp-excl { stroke: #ef6461; stroke-width: 2; stroke-dasharray: 3 3; } .cp-excl-t { fill: #ef6461; font-size: 13px; }
        .cp-node { position: absolute; cursor: pointer; }
        .cp-node.sel { outline: 2px dashed var(--tno-neon); outline-offset: 3px; }
        .cp-li-img { width: 28px; height: 28px; object-fit: contain; flex: 0 0 auto; } .cp-li-ico { font-size: 1.2rem; flex: 0 0 auto; }
        .cp-node-detail { border: 1px solid #2a2f36; padding: 10px 12px; display: flex; flex-direction: column; gap: 6px; }
        .cp-hint { padding: 4px 2px; }
        .cp-overlay { position: fixed; inset: 0; z-index: 100003; display: flex; align-items: center; justify-content: center; padding: 16px; background: rgba(0,0,0,.82); }
        .cp-super { --cp-c: var(--tno-gold, #ffd700); width: 660px; max-width: 100%; max-height: calc(100vh - 32px); overflow: auto; background: #0b0d12; color: #ddd; border: 2px solid var(--cp-c); padding: 22px 26px; text-align: center; box-shadow: 0 0 40px color-mix(in srgb, var(--cp-c) 30%, transparent); }
        .cp-super-img { width: 100%; max-height: 300px; object-fit: cover; margin-bottom: 12px; border: 1px solid #333; }
        .cp-super-title { margin: 6px 0 14px; font-size: 1.8rem; font-weight: normal; color: var(--cp-c); letter-spacing: 1px; }
        .cp-super-body { text-align: left; line-height: 1.8; font-size: .92rem; } .cp-super-body p { margin: 0 0 10px; }
        html[data-theme-family="modern"] .cp-title, html[data-theme-family="modern"] .cp-h { color: var(--m-text); font-weight: 700; letter-spacing: 0; }
        html[data-theme-family="modern"] .cp-dim, html[data-theme-family="modern"] .cp-kicker, html[data-theme-family="modern"] .cp-empty, html[data-theme-family="modern"] .cp-node-d { color: var(--m-text-3); }
        html[data-theme-family="modern"] .cp-h2 { color: var(--m-text-2); font-weight: 600; }
        html[data-theme-family="modern"] .cp-btn { border-color: var(--m-border); color: var(--m-text); border-radius: 8px; }
        html[data-theme-family="modern"] .cp-btn.cp-primary { background: var(--m-accent); border-color: var(--m-accent); color: var(--m-on-accent, #fff); }
        html[data-theme-family="modern"] .cp-card, html[data-theme-family="modern"] .cp-crisis, html[data-theme-family="modern"] .cp-dec, html[data-theme-family="modern"] .cp-node-detail { border-color: var(--m-border); border-radius: 12px; background: var(--m-surface); }
        html[data-theme-family="modern"] .cp-crisis { border-left: 4px solid var(--cp-c); }
        html[data-theme-family="modern"] .cp-mission { border-color: var(--m-border); border-radius: 8px; }
        html[data-theme-family="modern"] .cp-bar { background: var(--m-surface-2); border: none; border-radius: 4px; overflow: hidden; }
        html[data-theme-family="modern"] .cp-days { color: var(--m-accent); }
        html[data-theme-family="modern"] .cp-crisis-desc { color: var(--m-text-2); }
        html[data-theme-family="modern"] .cp-tag { border: none; border-radius: 999px; background: color-mix(in srgb, var(--cp-c) 16%, transparent); font-weight: 600; }
        html[data-theme-family="modern"] .cp-seg { border: none; background: var(--m-surface-2); border-radius: 10px; padding: 3px; } html[data-theme-family="modern"] .cp-seg button { border-radius: 7px; color: var(--m-text-3); font-weight: 600; } html[data-theme-family="modern"] .cp-seg button.on { background: var(--m-surface); color: var(--m-text); box-shadow: var(--m-shadow-sm); }
        html[data-theme-family="modern"] .cp-disp-title { color: var(--m-text); font-weight: 700; }
        html[data-theme-family="modern"] .cp-chip { border-color: var(--m-border); color: var(--m-text-2); border-radius: 999px; } html[data-theme-family="modern"] .cp-chip.on { border-color: var(--m-text); color: var(--m-text); }
        html[data-theme-family="modern"] .cp-tree-wrap { background: var(--m-surface-2); border-color: var(--m-border); border-radius: 12px; }
        html[data-theme-family="modern"] .cp-link { stroke: var(--m-border-strong); } html[data-theme-family="modern"] .cp-link.on { stroke: var(--m-success); }
        html[data-theme-family="modern"] .cp-ending { border-radius: 12px; border-color: var(--m-gold); color: var(--m-text); }
        html[data-theme-family="modern"] .cp-super { background: var(--m-surface); color: var(--m-text); border: 1px solid var(--m-border); border-top: 4px solid var(--cp-c); border-radius: 16px; box-shadow: 0 30px 80px rgba(0,0,0,.4); }
        html[data-theme-family="modern"] .cp-super-title { font-weight: 800; }
        html[data-theme-family="modern"] .cp-super-img, html[data-theme-family="modern"] .cp-crisis-img { border: none; border-radius: 12px; }
    `;
    document.head.appendChild(css);
})();
