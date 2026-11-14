// ===== 여론 › 기사 · 국정 지지율 (1.7.0) =====
// - 여론 › 기사: 기사 작성 · 수정 · 삭제 · 발행. 제목 · 부제 · 본문 · 날짜 · 언론사 · 기자 · 대표 사진 · 유형,
//   정당 · 정치인 · 정부 · 법안 연결, 발행할 때 지지율 효과(정당 지지율 · 국정 지지율)와 영향 범위(전국 · 권역 · 지역구).
//   발행하면 효과가 한 번 들어가고, 발행을 취소하면 들어간 만큼 정확히 되돌린다.
// - 여론 › 국정 지지율: 대통령 · 총리(또는 집단지도체제 의장) · 내각 지지율, 날짜별 기록,
//   자동 여론 변동(켜기 · 끄기 — 끄면 지금처럼 손으로만): 경제지표 · 기준값 회귀 · 여당 지지율 연동 · 총선 뒤 허니문.
// - 오른쪽 시각 화면 "여론 · 기사": 신문 1면(발행한 기사)과 여론 추이 그래프(정당 지지율 · 국정 지지율 · 기사 시점), 사진으로 저장.
// 세이브의 news 칸에 저장된다. 다른 파일 · 스크립트 모드는 window.HemiNews로.
/* global getAppState, setAppState, parties, coalitions, elecStore, chamberList, chamberDisplayName, govType, president, pm, collectiveChair,
   effRoleLabel, bills, districtSvgTendency, districtSvgMapFor, districtNames, districtMapMode, regions, districtRegionMap,
   elecRenderList, tendencyRenderMaps, switchDispTab, switchMainTab, elecSwitchSub, showCustomAlert, showCustomConfirm, showKbdToast,
   IND_IDEOLOGY_ID */
(function () {
    'use strict';
    const root = document.documentElement;

    // 속성 값(value="…")에도 쓰므로 따옴표까지 바꾼다 (main.js의 escapeHtmlText는 따옴표를 그대로 둠)
    const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const toast = t => { if (typeof showKbdToast === 'function') showKbdToast(t); };
    const clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v));
    const r1 = v => Math.round(v * 10) / 10;
    const el = html => { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; };
    const tr = x => (window.DnoLang && window.DnoLang.t ? window.DnoLang.t(String(x)) : String(x)); // 사진(캔버스)에 그리는 글자는 화면 번역이 닿지 않으므로 직접

    const TYPES = [['politics', '정치'], ['economy', '경제'], ['society', '사회'], ['world', '국제'], ['editorial', '사설'], ['breaking', '속보']];
    const TYPE_LABEL = Object.fromEntries(TYPES);
    const TYPE_COLOR = { politics: '#4f8cff', economy: '#22b573', society: '#f0a030', world: '#a066e0', editorial: '#8a96a3', breaking: '#e5484d' };

    // ---------------------------------------------------------------
    // 상태
    // ---------------------------------------------------------------
    function fresh() {
        return {
            articles: [],
            approval: { president: 50, pm: 50, chair: 50, cabinet: 50 },
            history: [], // [{ key, label, probs: { partyId: 하원 지지율 }, appr: { ... } }]
            auto: { on: false, econ: 1, decay: 3, base: 45, couple: 30, honeymoon: 8 },
            seq: 0,
        };
    }
    let N = fresh();
    let ui = { sub: 'list', editing: null, filter: 'all', type: '', q: '', view: 'paper', outlet: '' };

    const origGet = window.getAppState;
    window.getAppState = function () {
        const st = origGet.apply(this, arguments);
        if (st && typeof st === 'object') st.news = JSON.parse(JSON.stringify(N));
        return st;
    };
    const origSet = window.setAppState;
    window.setAppState = function (state) {
        const r = origSet.apply(this, arguments);
        const src = state && state.news;
        const f = fresh();
        N = src && typeof src === 'object' ? { ...f, ...JSON.parse(JSON.stringify(src)) } : f;
        N.approval = { ...f.approval, ...(N.approval || {}) };
        N.auto = { ...f.auto, ...(N.auto || {}) };
        if (!Array.isArray(N.articles)) N.articles = [];
        if (!Array.isArray(N.history)) N.history = [];
        ui.editing = null;
        refresh();
        return r;
    };

    // ---------------------------------------------------------------
    // 날짜 · 정당 · 정부
    // ---------------------------------------------------------------
    function today() {
        const y = parseInt(document.getElementById('nationDateYear')?.value, 10);
        if (!Number.isFinite(y)) return null;
        const m = parseInt(document.getElementById('nationDateMonth')?.value, 10) || 1, d = parseInt(document.getElementById('nationDateDay')?.value, 10) || 1;
        return { y, m, d, key: y * 10000 + m * 100 + d };
    }
    const keyOf = s => { const m = /^(-?\d{1,5})(?:-(\d{1,2}))?(?:-(\d{1,2}))?$/.exec(String(s ?? '').trim()); return m ? +m[1] * 10000 + (+m[2] || 1) * 100 + (+m[3] || 1) : null; };
    const strOf = k => { if (k == null) return ''; const y = Math.floor(k / 10000), m = Math.floor(k / 100) % 100, d = k % 100; return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`; };
    const labelOf = k => { if (k == null) return ''; const y = Math.floor(k / 10000), m = Math.floor(k / 100) % 100, d = k % 100; return `${y}년 ${m}월 ${d}일`; };
    const dayNum = k => { const y = Math.floor(k / 10000), m = Math.floor(k / 100) % 100, d = k % 100; const dt = new Date(2000, m - 1, d); dt.setFullYear(y, m - 1, d); return Math.round(dt.getTime() / 86400000); };
    const todayStr = () => { const t = today(); return t ? strOf(t.key) : ''; };

    const IND = () => (typeof IND_IDEOLOGY_ID !== 'undefined' ? IND_IDEOLOGY_ID : 9999);
    const allParties = () => (typeof parties !== 'undefined' ? parties : []);
    const realParties = () => allParties().filter(p => p.ideologyId !== IND() && p.status !== 'dissolved');
    const partyById = id => allParties().find(p => String(p.id) === String(id)) || null;
    const chambers = () => { try { return chamberList(); } catch (e) { return ['house']; } };
    const chName = ch => { try { return chamberDisplayName(ch); } catch (e) { return ch; } };
    const isGov = p => !!p && (p.isRuling || (typeof coalitions !== 'undefined' ? coalitions : []).some(c => c.isRuling && (c.members || []).some(id => String(id) === String(p.id) || String(id).startsWith(p.id + '__'))));
    const probOf = (p, ch = 'house') => Number(elecStore?.[ch]?.[p.id]?.prob) || 0;
    const role = k => { try { return effRoleLabel(k); } catch (e) { return { president: '대통령', pm: '총리', chair: '의장' }[k] || k; } };

    // 지금 정부 형태에서 국정 지지율을 매기는 자리 — [{ key, label, name }]
    function targets() {
        const gt = typeof govType !== 'undefined' ? govType : 'parliamentary';
        const out = [];
        if (gt === 'collective') out.push({ key: 'chair', label: role('chair'), name: (typeof collectiveChair !== 'undefined' && collectiveChair?.name) || '' });
        else {
            out.push({ key: 'president', label: role('president'), name: (typeof president !== 'undefined' && president?.name) || '' });
            out.push({ key: 'pm', label: role('pm'), name: (typeof pm !== 'undefined' && pm?.name) || '' });
        }
        out.push({ key: 'cabinet', label: '내각', name: '' });
        return out;
    }
    const targetLabel = k => (targets().find(t => t.key === k) || { label: { president: '대통령', pm: '총리', chair: '의장', cabinet: '내각' }[k] || k }).label;

    // ---------------------------------------------------------------
    // 기록 (여론 추이)
    // ---------------------------------------------------------------
    function snapshot() {
        const t = today();
        const last = N.history[N.history.length - 1];
        const key = t ? t.key : (last ? last.key + 1 : 1);
        const e = { key, label: t ? labelOf(key) : `기록 ${N.history.length + 1}`, probs: {}, appr: { ...N.approval } };
        realParties().forEach(p => { e.probs[p.id] = r1(probOf(p)); });
        const i = N.history.findIndex(h => h.key === key);
        if (i >= 0) N.history[i] = e; else { N.history.push(e); N.history.sort((a, b) => a.key - b.key); }
        if (N.history.length > 3000) N.history.splice(0, N.history.length - 3000);
    }

    // ---------------------------------------------------------------
    // 효과 (발행 · 취소)
    // ---------------------------------------------------------------
    const svgOn = () => typeof districtMapMode === 'undefined' || districtMapMode === 'svg';
    function districtList(ch) {
        let keys = [];
        try { const map = districtSvgMapFor(ch); if (map && Array.isArray(map.shapes)) keys = map.shapes.map(s => s.key); } catch (e) { /* 지도 없음 */ }
        const names = (typeof districtNames !== 'undefined' && districtNames[ch]) || {};
        return keys.map(k => ({ key: k, name: names[k] || k }));
    }
    const regionList = ch => ((typeof regions !== 'undefined' && regions[ch]) || []).map(r => ({ key: r.id, name: r.name }));
    function scopeKeys(scope) {
        if (!scope || scope.kind === 'national') return null;
        const ch = scope.ch || 'house';
        const sel = new Set((scope.keys || []).map(String));
        if (scope.kind === 'district') return districtList(ch).map(d => d.key).filter(k => sel.has(String(k)));
        if (scope.kind === 'region') {
            const rm = (typeof districtRegionMap !== 'undefined' && districtRegionMap[ch]) || {};
            return districtList(ch).map(d => d.key).filter(k => sel.has(String(rm[k])));
        }
        return null;
    }
    function applyEffect(ef, scope, log) {
        const delta = Number(ef.delta) || 0;
        if (!delta) return;
        if (ef.target === 'approval') {
            const w = ef.which || 'cabinet';
            const before = Number(N.approval[w]) || 0, after = clamp(before + delta);
            N.approval[w] = r1(after);
            log.push({ k: 'appr', w, d: N.approval[w] - before });
            return;
        }
        const p = partyById(ef.partyId);
        if (!p) return;
        const keys = scopeKeys(scope);
        if (!keys) {
            chambers().forEach(ch => {
                const st = elecStore?.[ch]; if (!st) return;
                const cur = st[p.id] || (st[p.id] = { prob: 0, err: 0 });
                const before = Number(cur.prob) || 0;
                cur.prob = r1(clamp(before + delta));
                log.push({ k: 'prob', ch, pid: p.id, d: cur.prob - before });
            });
            return;
        }
        const ch = scope.ch || 'house';
        keys.forEach(key => {
            const t = districtSvgTendency[key] || (districtSvgTendency[key] = { house: {}, senate: {}, third: {} });
            const row = t[ch] || (t[ch] = {});
            const before = Number(row[p.id]) || 0;
            row[p.id] = r1(clamp(before + delta));
            log.push({ k: 'tend', key, ch, pid: p.id, d: row[p.id] - before });
        });
    }
    function revert(l) {
        if (l.k === 'appr') { N.approval[l.w] = r1(clamp((Number(N.approval[l.w]) || 0) - l.d)); return; }
        if (l.k === 'prob') { const cur = elecStore?.[l.ch]?.[l.pid]; if (cur) cur.prob = r1(clamp((Number(cur.prob) || 0) - l.d)); return; }
        if (l.k === 'tend') { const row = districtSvgTendency?.[l.key]?.[l.ch]; if (row && l.pid in row) row[l.pid] = r1(clamp((Number(row[l.pid]) || 0) - l.d)); }
    }
    function publish(a, quiet) {
        if (!a || a.status === 'published') return;
        const log = [];
        (a.effects || []).forEach(ef => applyEffect(ef, a.scope, log));
        a.applied = log;
        a.status = 'published';
        if (!a.date) a.date = todayStr();
        snapshot();
        afterChange();
        if (!quiet) toast(`기사 발행: ${a.title || '(제목 없음)'}`);
    }
    function unpublish(a) {
        if (!a || a.status !== 'published') return;
        (a.applied || []).slice().reverse().forEach(revert);
        a.applied = [];
        a.status = 'draft';
        snapshot();
        afterChange();
    }
    function afterChange() {
        try { if (typeof elecRenderList === 'function' && document.getElementById('elecSubProb')?.classList.contains('active')) elecRenderList(); } catch (e) { /* 화면 없음 */ }
        try { if (document.getElementById('elecSubTendency')?.classList.contains('active') && typeof tendencyRenderMaps === 'function') tendencyRenderMaps(); } catch (e) { /* 화면 없음 */ }
        refresh();
    }

    // ---------------------------------------------------------------
    // 자동 여론 변동 (한 달에 한 번)
    // ---------------------------------------------------------------
    const econ = () => (window.HemiEconomy && window.HemiEconomy.state && window.HemiEconomy.state.nat) || null;
    function autoMonth() {
        const A = N.auto;
        const e = econ();
        let de = 0;
        if (e && A.econ) {
            const g = Number(e.growth), u = Number(e.unemp), i = Number(e.infl);
            if (Number.isFinite(g)) de += (g - 2) * 0.3;
            if (Number.isFinite(u)) de -= (u - 5) * 0.2;
            if (Number.isFinite(i)) de -= Math.max(0, i - 3) * 0.25;
            de *= Number(A.econ) || 0;
        }
        const before = Number(N.approval.cabinet) || 0;
        targets().forEach(t => {
            const v = Number(N.approval[t.key]) || 0;
            N.approval[t.key] = r1(clamp(v + de + ((Number(A.base) || 0) - v) * (Number(A.decay) || 0) / 100));
        });
        // 여당 지지율 연동 — 내각 지지율이 움직인 만큼(비율) 집권 세력 정당들의 지지율이 지지율 비례로 따라 움직임
        const dc = (Number(N.approval.cabinet) || 0) - before;
        const k = (Number(A.couple) || 0) / 100;
        if (dc && k) {
            const gov = realParties().filter(isGov);
            const tot = gov.reduce((s, p) => s + probOf(p), 0);
            gov.forEach(p => {
                const share = tot > 0 ? probOf(p) / tot : 1 / gov.length;
                chambers().forEach(ch => { const cur = elecStore?.[ch]?.[p.id]; if (cur) cur.prob = r1(clamp((Number(cur.prob) || 0) + dc * k * share)); });
            });
        }
    }
    const origAdvance = window.advanceNationDate;
    if (typeof origAdvance === 'function') window.advanceNationDate = function () {
        const b = today();
        const r = origAdvance.apply(this, arguments);
        const a = today();
        if (a && (!b || a.key !== b.key)) {
            if (N.auto.on && b && a.key > b.key) {
                const months = Math.min(240, Math.floor((dayNum(a.key) - dayNum(b.key)) / 30.44 + (N.auto._carry || 0)));
                N.auto._carry = ((dayNum(a.key) - dayNum(b.key)) / 30.44 + (N.auto._carry || 0)) - months;
                for (let i = 0; i < months; i++) autoMonth();
            }
            snapshot();
            afterChange();
        }
        return r;
    };
    // 총선 결과를 의회에 반영하면(새 정부) — 허니문: 국정 지지율이 조금 오름 (자동 여론 변동이 켜져 있을 때)
    const origApply = window.elecApplyToParliament;
    if (typeof origApply === 'function') window.elecApplyToParliament = function () {
        const r = origApply.apply(this, arguments);
        setTimeout(() => {
            if (N.auto.on && Number(N.auto.honeymoon)) targets().forEach(t => { N.approval[t.key] = r1(clamp((Number(N.approval[t.key]) || 0) + Number(N.auto.honeymoon))); });
            snapshot();
            refresh();
        }, 0);
        return r;
    };

    // ---------------------------------------------------------------
    // 여론 탭에 "기사" · "국정 지지율" 하위 탭
    // ---------------------------------------------------------------
    (function addTabs() {
        const wrap = document.getElementById('mainContentElection');
        const bar = wrap && wrap.querySelector(':scope > .sub-tab-container');
        if (!bar) return;
        bar.appendChild(el(`<button class="sub-tab-btn" id="elecSubTabArticles" onclick="elecSwitchSub('articles')">기사</button>`));
        bar.appendChild(el(`<button class="sub-tab-btn" id="elecSubTabApproval" onclick="elecSwitchSub('approval')">국정 지지율</button>`));
        wrap.appendChild(el(`<div id="elecSubArticles" class="sub-tab-content"></div>`));
        wrap.appendChild(el(`<div id="elecSubApproval" class="sub-tab-content"></div>`));
    })();
    const MY_SUBS = ['articles', 'approval'];
    const origSwitch = window.elecSwitchSub;
    window.elecSwitchSub = function (sub) {
        const mine = MY_SUBS.includes(sub);
        if (!mine) {
            MY_SUBS.forEach(s => { document.getElementById('elecSubTab' + cap(s))?.classList.remove('active'); document.getElementById('elecSub' + cap(s))?.classList.remove('active'); });
            return origSwitch.apply(this, arguments);
        }
        document.querySelectorAll('#mainContentElection > .sub-tab-container .sub-tab-btn').forEach(b => b.classList.toggle('active', b.id === 'elecSubTab' + cap(sub)));
        document.querySelectorAll('#mainContentElection > .sub-tab-content').forEach(c => c.classList.toggle('active', c.id === 'elecSub' + cap(sub)));
        // 지역구 · 성향 지도가 남아 있으면 의석 화면으로, 그리고 오른쪽에 여론 · 기사 화면
        try {
            const act = document.querySelector('.disp-tab-btn.active')?.dataset.tab;
            if (act === 'district' || act === 'tendency' || act === 'region') switchDispTab('house');
        } catch (e) { /* 화면 없음 */ }
        if (sub === 'approval') ui.view = 'trend';
        if (sub === 'articles' && ui.view !== 'trend') ui.view = 'paper';
        renderLeft();
        showDisp();
    };
    const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
    const activeSub = () => MY_SUBS.find(s => document.getElementById('elecSub' + cap(s))?.classList.contains('active')) || null;

    function refresh() {
        if (activeSub()) renderLeft();
        if (dispActive()) renderDisp();
    }

    // ---------------------------------------------------------------
    // 왼쪽: 기사 목록 · 편집
    // ---------------------------------------------------------------
    function renderLeft() {
        const s = activeSub();
        if (s === 'articles') renderArticles();
        if (s === 'approval') renderApproval();
    }
    const newId = () => 'art_' + Date.now().toString(36) + '_' + (++N.seq);
    function blank() {
        const outlets = [...new Set(N.articles.map(a => a.outlet).filter(Boolean))];
        return { id: newId(), title: '', subtitle: '', body: '', date: todayStr(), outlet: outlets[0] || '', reporter: '', photo: '', type: 'politics',
            links: { parties: [], people: [], gov: false, bills: [] }, effects: [], scope: { kind: 'national', ch: 'house', keys: [] }, status: 'draft', applied: [] };
    }
    function effectText(a) {
        return (a.effects || []).filter(ef => Number(ef.delta)).map(ef => {
            const d = Number(ef.delta), sign = d > 0 ? '+' : '';
            if (ef.target === 'approval') return `${targetLabel(ef.which)} 국정 ${sign}${d}`;
            const p = partyById(ef.partyId);
            return `${p ? p.name : '?'} ${sign}${d}`;
        }).join(' · ');
    }
    function scopeText(sc) {
        if (!sc || sc.kind === 'national') return '전국';
        const n = (sc.keys || []).length;
        return `${sc.kind === 'region' ? '권역' : '지역구'} ${n}곳${chambers().length > 1 ? ` (${chName(sc.ch || 'house')})` : ''}`;
    }
    function renderArticles() {
        const host = document.getElementById('elecSubArticles');
        if (!host) return;
        if (ui.editing) { renderEditor(host); return; }
        const q = ui.q.trim().toLowerCase();
        const list = N.articles.slice().sort((a, b) => (keyOf(b.date) || 0) - (keyOf(a.date) || 0) || String(b.id).localeCompare(String(a.id)))
            .filter(a => (ui.filter === 'all' || (ui.filter === 'published') === (a.status === 'published')) && (!ui.type || a.type === ui.type)
                && (!q || [a.title, a.subtitle, a.body, a.outlet, a.reporter].some(v => String(v || '').toLowerCase().includes(q))));
        const pub = N.articles.filter(a => a.status === 'published').length;
        host.innerHTML = `<div class="nw-wrap">
            <div class="nw-intro">기사를 쓰고 발행하면 정한 만큼 정당 지지율 · 국정 지지율이 움직입니다 (발행 취소하면 그만큼 되돌림). 오른쪽 "여론 · 기사" 화면에 신문 1면과 여론 추이가 보입니다.</div>
            <div class="nw-bar">
                <button type="button" class="nw-btn nw-primary" data-new>+ 새 기사</button>
                <select class="nw-in" data-filter><option value="all">전체 ${N.articles.length}</option><option value="published" ${ui.filter === 'published' ? 'selected' : ''}>발행 ${pub}</option><option value="draft" ${ui.filter === 'draft' ? 'selected' : ''}>초안 ${N.articles.length - pub}</option></select>
                <select class="nw-in" data-type><option value="">모든 유형</option>${TYPES.map(([k, l]) => `<option value="${k}" ${ui.type === k ? 'selected' : ''}>${l}</option>`).join('')}</select>
                <input class="nw-in nw-grow" type="search" data-q placeholder="기사 찾기" value="${esc(ui.q)}">
            </div>
            ${list.length ? list.map(a => `
                <div class="nw-card ${a.status === 'published' ? 'pub' : 'draft'}" data-id="${esc(a.id)}">
                    ${a.photo ? `<img class="nw-thumb" src="${esc(a.photo)}" alt="">` : ''}
                    <div class="nw-card-main">
                        <div class="nw-card-top"><span class="nw-type" style="--c:${TYPE_COLOR[a.type] || '#888'}">${esc(TYPE_LABEL[a.type] || '기사')}</span>
                            <span class="nw-status">${a.status === 'published' ? '발행됨' : '초안'}</span><span class="nw-dim">${esc(labelOf(keyOf(a.date)))}</span></div>
                        <div class="nw-card-title">${esc(a.title || '(제목 없음)')}</div>
                        ${a.subtitle ? `<div class="nw-card-sub">${esc(a.subtitle)}</div>` : ''}
                        <div class="nw-dim">${esc([a.outlet, a.reporter && a.reporter + ' 기자'].filter(Boolean).join(' · '))}</div>
                        ${effectText(a) ? `<div class="nw-eff">📈 ${esc(effectText(a))} <span class="nw-dim">· ${esc(scopeText(a.scope))}</span></div>` : ''}
                        <div class="nw-row">
                            <button type="button" class="nw-btn" data-edit>수정</button>
                            ${a.status === 'published' ? '<button type="button" class="nw-btn" data-unpub>발행 취소</button>' : '<button type="button" class="nw-btn nw-primary" data-pub>발행</button>'}
                            <button type="button" class="nw-btn" data-read>읽기</button>
                            <button type="button" class="nw-btn nw-danger" data-del>삭제</button>
                        </div>
                    </div>
                </div>`).join('') : `<div class="nw-empty">${N.articles.length ? '조건에 맞는 기사가 없습니다.' : '아직 기사가 없습니다. "+ 새 기사"로 첫 기사를 써 보세요.'}</div>`}
        </div>`;
        host.querySelector('[data-new]').onclick = () => { const a = blank(); ui.editing = { draft: a, isNew: true }; renderArticles(); };
        host.querySelector('[data-filter]').onchange = e => { ui.filter = e.target.value; renderArticles(); };
        host.querySelector('[data-type]').onchange = e => { ui.type = e.target.value; renderArticles(); };
        const qi = host.querySelector('[data-q]');
        qi.oninput = () => { ui.q = qi.value; const pos = qi.selectionStart; renderArticles(); const n = document.querySelector('#elecSubArticles [data-q]'); if (n) { n.focus(); n.setSelectionRange(pos, pos); } };
        host.querySelectorAll('.nw-card').forEach(card => {
            const a = N.articles.find(x => x.id === card.dataset.id); if (!a) return;
            card.querySelector('[data-edit]').onclick = () => { ui.editing = { draft: JSON.parse(JSON.stringify(a)), isNew: false }; renderArticles(); };
            card.querySelector('[data-pub]')?.addEventListener('click', () => publish(a));
            card.querySelector('[data-unpub]')?.addEventListener('click', () => showCustomConfirm(`"${a.title || '(제목 없음)'}" 발행을 취소할까요? 들어갔던 지지율 효과만큼 되돌립니다.`, () => unpublish(a)));
            card.querySelector('[data-read]').onclick = () => readArticle(a);
            card.querySelector('[data-del]').onclick = () => showCustomConfirm(`"${a.title || '(제목 없음)'}" 기사를 지울까요?${a.status === 'published' ? '\n(발행된 기사라 지지율 효과도 되돌립니다)' : ''}`, () => {
                if (a.status === 'published') unpublish(a);
                N.articles = N.articles.filter(x => x !== a);
                refresh();
            });
        });
    }

    function renderEditor(host) {
        const a = ui.editing.draft;
        const sc = a.scope || (a.scope = { kind: 'national', ch: 'house', keys: [] });
        const chs = chambers();
        const plist = realParties();
        const people = (window.HemiPeople && Array.isArray(window.HemiPeople.people) ? window.HemiPeople.people : []);
        const billList = (typeof bills !== 'undefined' ? bills : []);
        const outlets = [...new Set(N.articles.map(x => x.outlet).filter(Boolean))];
        const reporters = [...new Set(N.articles.map(x => x.reporter).filter(Boolean))];
        const tg = targets();
        const scopeItems = sc.kind === 'region' ? regionList(sc.ch || 'house') : sc.kind === 'district' ? districtList(sc.ch || 'house') : [];
        const selKeys = new Set((sc.keys || []).map(String));
        const pub = a.status === 'published';
        host.innerHTML = `<div class="nw-wrap nw-editor">
            <div class="nw-bar"><button type="button" class="nw-btn" data-back>← 목록</button><b class="nw-grow">${ui.editing.isNew ? '새 기사' : '기사 수정'}</b>
                ${pub ? '<span class="nw-dim">발행된 기사 — 효과를 바꾸면 저장할 때 다시 계산됩니다</span>' : ''}</div>
            <label class="nw-lab">유형</label>
            <div class="nw-types">${TYPES.map(([k, l]) => `<button type="button" class="nw-chip ${a.type === k ? 'on' : ''}" data-type="${k}" style="--c:${TYPE_COLOR[k]}">${l}</button>`).join('')}</div>
            <label class="nw-lab">제목</label><input class="nw-in nw-title" data-f="title" maxlength="120" value="${esc(a.title)}" placeholder="예: 여당, 예산안 단독 처리">
            <label class="nw-lab">부제</label><input class="nw-in" data-f="subtitle" maxlength="200" value="${esc(a.subtitle)}" placeholder="(선택)">
            <label class="nw-lab">본문</label><textarea class="nw-in nw-body" data-f="body" rows="8" placeholder="기사 본문">${esc(a.body)}</textarea>
            <div class="nw-grid3">
                <div><label class="nw-lab">작성일</label><input class="nw-in" data-f="date" value="${esc(a.date)}" placeholder="YYYY-MM-DD"></div>
                <div><label class="nw-lab">언론사</label><input class="nw-in" data-f="outlet" list="nwOutlets" maxlength="40" value="${esc(a.outlet)}" placeholder="예: 헤미일보"></div>
                <div><label class="nw-lab">기자</label><input class="nw-in" data-f="reporter" list="nwReporters" maxlength="40" value="${esc(a.reporter)}"></div>
            </div>
            <datalist id="nwOutlets">${outlets.map(o => `<option value="${esc(o)}">`).join('')}</datalist>
            <datalist id="nwReporters">${reporters.map(o => `<option value="${esc(o)}">`).join('')}</datalist>
            <label class="nw-lab">대표 사진</label>
            <div class="nw-row">${a.photo ? `<img class="nw-photo" src="${esc(a.photo)}" alt="">` : ''}
                <button type="button" class="nw-btn" data-photo>${a.photo ? '사진 바꾸기' : '사진 올리기'}</button>${a.photo ? '<button type="button" class="nw-btn" data-photo-del>사진 빼기</button>' : ''}
                <input type="file" accept="image/*" data-photo-file hidden></div>

            <div class="nw-sec">연결</div>
            <label class="nw-lab">정당</label>
            <div class="nw-types">${plist.map(p => `<button type="button" class="nw-chip ${a.links.parties.map(String).includes(String(p.id)) ? 'on' : ''}" data-link-party="${esc(p.id)}" style="--c:${esc(p.color || '#888')}">${esc(p.name)}</button>`).join('') || '<span class="nw-dim">정당 없음</span>'}</div>
            <label class="nw-check"><input type="checkbox" data-link-gov ${a.links.gov ? 'checked' : ''}> 정부 (${esc(tg.filter(t => t.key !== 'cabinet').map(t => t.label + (t.name ? ' ' + t.name : '')).join(' · ') || '내각')})</label>
            <label class="nw-lab">정치인</label>
            <div class="nw-row">${a.links.people.map(id => { const pp = people.find(x => x.id === id); return `<span class="nw-tag">${esc(pp ? pp.name : id)} <button type="button" data-unlink-person="${esc(id)}">×</button></span>`; }).join('')}
                <input class="nw-in" data-add-person list="nwPeople" placeholder="이름으로 추가" style="width:140px"></div>
            <datalist id="nwPeople">${people.slice(0, 2000).map(pp => `<option value="${esc(pp.name)}">`).join('')}</datalist>
            <label class="nw-lab">법안</label>
            <div class="nw-row">${a.links.bills.map(id => { const b = billList.find(x => String(x.id) === String(id)); return `<span class="nw-tag">${esc(b ? b.title : id)} <button type="button" data-unlink-bill="${esc(id)}">×</button></span>`; }).join('')}
                <select class="nw-in" data-add-bill><option value="">+ 법안 연결</option>${billList.filter(b => !a.links.bills.map(String).includes(String(b.id))).map(b => `<option value="${esc(b.id)}">${esc(b.title)}</option>`).join('')}</select></div>

            <div class="nw-sec">발행할 때 효과</div>
            <div class="nw-dim nw-small">정당 지지율은 아래 영향 범위에 따라 — 전국이면 모든 원의 지지율, 권역 · 지역구면 그곳의 시민 성향이 움직입니다. 국정 지지율은 언제나 전국.</div>
            ${(a.effects || []).map((ef, i) => `<div class="nw-eff-row" data-eff="${i}">
                <select class="nw-in nw-grow" data-eff-target>
                    <optgroup label="정당 지지율">${plist.map(p => `<option value="party:${esc(p.id)}" ${ef.target === 'party' && String(ef.partyId) === String(p.id) ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</optgroup>
                    <optgroup label="국정 지지율">${tg.map(t => `<option value="approval:${t.key}" ${ef.target === 'approval' && ef.which === t.key ? 'selected' : ''}>${esc(t.label)}</option>`).join('')}</optgroup>
                </select>
                <input class="nw-in nw-num" type="number" step="0.1" min="-30" max="30" data-eff-delta value="${esc(ef.delta)}"> <span class="nw-dim">%p</span>
                <button type="button" class="nw-x" data-eff-del title="빼기">×</button></div>`).join('')}
            <div class="nw-row"><button type="button" class="nw-btn" data-eff-add>+ 효과 추가</button>
                ${a.links.parties.length ? '<button type="button" class="nw-btn" data-eff-fromlinks>연결한 정당으로 채우기</button>' : ''}</div>
            <label class="nw-lab">영향 범위</label>
            <div class="nw-types">
                <button type="button" class="nw-chip ${sc.kind === 'national' ? 'on' : ''}" data-scope="national">전국</button>
                <button type="button" class="nw-chip ${sc.kind === 'region' ? 'on' : ''}" data-scope="region" ${svgOn() && regionList(sc.ch || 'house').length ? '' : 'disabled title="권역이 없습니다"'}>권역</button>
                <button type="button" class="nw-chip ${sc.kind === 'district' ? 'on' : ''}" data-scope="district" ${svgOn() && districtList(sc.ch || 'house').length ? '' : 'disabled title="지역구 지도가 없습니다"'}>개별 지역구</button>
                ${sc.kind !== 'national' && chs.length > 1 ? `<select class="nw-in" data-scope-ch>${chs.map(c => `<option value="${c}" ${(sc.ch || 'house') === c ? 'selected' : ''}>${esc(chName(c))}</option>`).join('')}</select>` : ''}
            </div>
            ${sc.kind !== 'national' ? `<div class="nw-pick">
                <div class="nw-row"><input class="nw-in nw-grow" type="search" data-pick-q placeholder="${sc.kind === 'region' ? '권역' : '지역구'} 찾기"><span class="nw-dim"><b data-pick-n>${selKeys.size}</b> <span>곳 고름</span></span>
                    <button type="button" class="nw-btn" data-pick-all>모두</button><button type="button" class="nw-btn" data-pick-none>비우기</button></div>
                <div class="nw-pick-list">${scopeItems.map(it => `<label class="nw-check" data-name="${esc(String(it.name).toLowerCase())}"><input type="checkbox" data-pick="${esc(it.key)}" ${selKeys.has(String(it.key)) ? 'checked' : ''}> ${esc(it.name)}</label>`).join('')}</div></div>` : ''}

            <div class="nw-bar nw-foot">
                <button type="button" class="nw-btn" data-back>취소</button><span class="nw-grow"></span>
                <button type="button" class="nw-btn" data-save>${pub ? '저장' : '초안 저장'}</button>
                ${pub ? '' : '<button type="button" class="nw-btn nw-primary" data-save-pub>저장하고 발행</button>'}
            </div>
        </div>`;
        const $ = s => host.querySelector(s), $$ = s => host.querySelectorAll(s);
        const keepScroll = fn => { const sc2 = host.closest('.controls-content') || document.scrollingElement; const top = sc2 ? sc2.scrollTop : 0; fn(); if (sc2) sc2.scrollTop = top; };
        const rer = () => keepScroll(() => renderEditor(host));
        $$('[data-f]').forEach(inp => { inp.oninput = () => { a[inp.dataset.f] = inp.value; }; });
        $$('[data-type]').forEach(b => { b.onclick = () => { a.type = b.dataset.type; rer(); }; });
        const pf = $('[data-photo-file]');
        $('[data-photo]').onclick = () => pf.click();
        pf.onchange = () => { const f = pf.files && pf.files[0]; pf.value = ''; if (!f) return; shrinkImage(f, 720, url => { a.photo = url; rer(); }); };
        $('[data-photo-del]')?.addEventListener('click', () => { a.photo = ''; rer(); });
        $$('[data-link-party]').forEach(b => { b.onclick = () => {
            const id = partyById(b.dataset.linkParty)?.id ?? b.dataset.linkParty;
            const has = a.links.parties.map(String).includes(String(id));
            a.links.parties = has ? a.links.parties.filter(x => String(x) !== String(id)) : [...a.links.parties, id];
            rer();
        }; });
        $('[data-link-gov]').onchange = e => { a.links.gov = e.target.checked; };
        const ap = $('[data-add-person]');
        ap.onchange = () => { const pp = people.find(x => x.name === ap.value.trim()); if (pp && !a.links.people.includes(pp.id)) { a.links.people.push(pp.id); rer(); } else ap.value = ''; };
        $$('[data-unlink-person]').forEach(b => { b.onclick = () => { a.links.people = a.links.people.filter(x => x !== b.dataset.unlinkPerson); rer(); }; });
        $('[data-add-bill]').onchange = e => { if (e.target.value) { const b = billList.find(x => String(x.id) === e.target.value); a.links.bills.push(b ? b.id : e.target.value); rer(); } };
        $$('[data-unlink-bill]').forEach(b => { b.onclick = () => { a.links.bills = a.links.bills.filter(x => String(x) !== b.dataset.unlinkBill); rer(); }; });
        $$('[data-eff]').forEach(row => {
            const ef = a.effects[+row.dataset.eff];
            row.querySelector('[data-eff-target]').onchange = e => {
                const [k, v] = e.target.value.split(':');
                if (k === 'approval') { ef.target = 'approval'; ef.which = v; delete ef.partyId; }
                else { ef.target = 'party'; ef.partyId = partyById(v)?.id ?? v; delete ef.which; }
            };
            row.querySelector('[data-eff-delta]').oninput = e => { ef.delta = Number(e.target.value) || 0; };
            row.querySelector('[data-eff-del]').onclick = () => { a.effects.splice(+row.dataset.eff, 1); rer(); };
        });
        $('[data-eff-add]').onclick = () => { const p = partyById(a.links.parties[0]) || plist[0]; a.effects.push(p ? { target: 'party', partyId: p.id, delta: 1 } : { target: 'approval', which: 'cabinet', delta: 1 }); rer(); };
        $('[data-eff-fromlinks]')?.addEventListener('click', () => {
            a.links.parties.forEach(id => { if (!a.effects.some(ef => ef.target === 'party' && String(ef.partyId) === String(id))) a.effects.push({ target: 'party', partyId: id, delta: 1 }); });
            if (a.links.gov && !a.effects.some(ef => ef.target === 'approval')) a.effects.push({ target: 'approval', which: 'cabinet', delta: -1 });
            rer();
        });
        $$('[data-scope]').forEach(b => { b.onclick = () => { if (b.disabled) return; if (sc.kind !== b.dataset.scope) { sc.kind = b.dataset.scope; sc.keys = []; } rer(); }; });
        $('[data-scope-ch]')?.addEventListener('change', e => { sc.ch = e.target.value; sc.keys = []; rer(); });
        const pq = $('[data-pick-q]');
        if (pq) pq.oninput = () => { const q = pq.value.trim().toLowerCase(); host.querySelectorAll('.nw-pick-list .nw-check').forEach(l => { l.style.display = !q || l.dataset.name.includes(q) ? '' : 'none'; }); };
        $$('[data-pick]').forEach(cb => { cb.onchange = () => {
            const k = cb.dataset.pick, set = new Set((sc.keys || []).map(String));
            if (cb.checked) set.add(k); else set.delete(k);
            sc.keys = scopeItems.map(it => it.key).filter(x => set.has(String(x)));
            const n = host.querySelector('[data-pick-n]'); if (n) n.textContent = String(sc.keys.length);
        }; });
        $('[data-pick-all]')?.addEventListener('click', () => { sc.keys = scopeItems.filter(it => { const l = host.querySelector(`.nw-check[data-name] [data-pick="${CSS.escape(String(it.key))}"]`)?.closest('label'); return !l || l.style.display !== 'none'; }).map(it => it.key); rer(); });
        $('[data-pick-none]')?.addEventListener('click', () => { sc.keys = []; rer(); });
        $$('[data-back]').forEach(b => { b.onclick = () => { ui.editing = null; renderArticles(); }; });
        const save = andPublish => {
            if (!String(a.title || '').trim()) { showCustomAlert('기사 제목을 적어 주세요.'); return; }
            if (a.date && keyOf(a.date) == null) { showCustomAlert('작성일은 YYYY-MM-DD 형식으로 적어 주세요. (예: 2026-11-03)'); return; }
            if (sc.kind !== 'national' && !(sc.keys || []).length && (a.effects || []).some(ef => ef.target === 'party')) { showCustomAlert(`영향 범위에서 ${sc.kind === 'region' ? '권역' : '지역구'}을 하나 이상 고르세요.`); return; }
            a.effects = (a.effects || []).filter(ef => Number(ef.delta));
            const i = N.articles.findIndex(x => x.id === a.id);
            if (i >= 0) {
                const old = N.articles[i];
                if (old.status === 'published') {
                    // 발행된 기사를 고치면 — 예전 효과를 되돌리고 새 효과로 다시
                    (old.applied || []).slice().reverse().forEach(revert);
                    a.status = 'draft'; a.applied = [];
                    N.articles[i] = a;
                    ui.editing = null;
                    publish(a, true);
                    toast('발행된 기사를 고쳤습니다');
                    return;
                }
                N.articles[i] = a;
            } else N.articles.push(a);
            ui.editing = null;
            if (andPublish) publish(a); else { toast('초안을 저장했습니다'); refresh(); }
        };
        $('[data-save]').onclick = () => save(false);
        $('[data-save-pub]')?.addEventListener('click', () => save(true));
    }

    function shrinkImage(file, max, done) {
        const fr = new FileReader();
        fr.onload = ev => {
            const img = new Image();
            img.onload = () => {
                const s = Math.min(1, max / Math.max(img.width, img.height));
                const c = document.createElement('canvas');
                c.width = Math.max(1, Math.round(img.width * s)); c.height = Math.max(1, Math.round(img.height * s));
                c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
                let url = '';
                try { url = c.toDataURL('image/webp', 0.82); } catch (e) { /* 지원 안 함 */ }
                if (!url || !url.startsWith('data:image/webp')) { try { url = c.toDataURL('image/jpeg', 0.85); } catch (e) { url = ev.target.result; } }
                done(url);
            };
            img.onerror = () => showCustomAlert('사진을 읽지 못했습니다.');
            img.src = ev.target.result;
        };
        fr.readAsDataURL(file);
    }

    function readArticle(a) {
        const people = (window.HemiPeople && Array.isArray(window.HemiPeople.people) ? window.HemiPeople.people : []);
        const billList = (typeof bills !== 'undefined' ? bills : []);
        const links = [
            ...a.links.parties.map(id => partyById(id)).filter(Boolean).map(p => `<span class="nw-tag" style="border-color:${esc(p.color)}">${esc(p.name)}</span>`),
            ...(a.links.gov ? ['<span class="nw-tag">정부</span>'] : []),
            ...a.links.people.map(id => people.find(x => x.id === id)).filter(Boolean).map(pp => `<span class="nw-tag">${esc(pp.name)}</span>`),
            ...a.links.bills.map(id => billList.find(x => String(x.id) === String(id))).filter(Boolean).map(b => `<span class="nw-tag">📜 ${esc(b.title)}</span>`),
        ];
        const ov = el(`<div class="nw-overlay"><article class="nw-read" role="dialog" aria-modal="true">
            <button type="button" class="nw-read-x" aria-label="닫기">×</button>
            <div class="nw-card-top"><span class="nw-type" style="--c:${TYPE_COLOR[a.type] || '#888'}">${esc(TYPE_LABEL[a.type] || '기사')}</span><span class="nw-dim">${esc([a.outlet, labelOf(keyOf(a.date))].filter(Boolean).join(' · '))}</span></div>
            <h2 class="nw-read-title">${esc(a.title || '(제목 없음)')}</h2>
            ${a.subtitle ? `<div class="nw-read-sub">${esc(a.subtitle)}</div>` : ''}
            ${a.reporter ? `<div class="nw-dim">${esc(a.reporter)} 기자</div>` : ''}
            ${a.photo ? `<img class="nw-read-photo" src="${esc(a.photo)}" alt="">` : ''}
            <div class="nw-read-body">${esc(a.body || '').split(/\n{2,}/).map(par => `<p>${par.replace(/\n/g, '<br>')}</p>`).join('')}</div>
            ${links.length ? `<div class="nw-row">${links.join('')}</div>` : ''}
            ${effectText(a) ? `<div class="nw-eff">📈 ${esc(effectText(a))} · ${esc(scopeText(a.scope))}${a.status === 'published' ? '' : ' (발행하면)'}</div>` : ''}
        </article></div>`);
        const close = () => { ov.remove(); document.removeEventListener('keydown', onKey, true); };
        const onKey = e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
        ov.addEventListener('click', e => { if (e.target === ov) close(); });
        ov.querySelector('.nw-read-x').onclick = close;
        document.addEventListener('keydown', onKey, true);
        document.body.appendChild(ov);
        ov.querySelector('.nw-read-x').focus();
    }

    // ---------------------------------------------------------------
    // 왼쪽: 국정 지지율
    // ---------------------------------------------------------------
    function renderApproval() {
        const host = document.getElementById('elecSubApproval');
        if (!host) return;
        const tg = targets(), A = N.auto;
        const last = N.history[N.history.length - 1];
        const hasEcon = !!econ();
        host.innerHTML = `<div class="nw-wrap">
            <div class="nw-intro">대통령 · 총리 · 내각에 대한 국정 지지율입니다. 날짜를 넘길 때마다 정당 지지율과 함께 기록되어 오른쪽 "여론 추이" 그래프에 그려집니다.</div>
            ${tg.map(t => {
                const v = Number(N.approval[t.key]) || 0;
                const prev = last && last.appr ? Number(last.appr[t.key]) : null;
                const d = prev != null ? r1(v - prev) : 0;
                return `<div class="nw-appr" data-appr="${t.key}">
                    <div class="nw-appr-head"><b>${esc(t.label)}</b>${t.name ? `<span class="nw-dim">${esc(t.name)}</span>` : ''}<span class="nw-grow"></span>
                        <span class="nw-appr-v">${v.toFixed(1)}%</span>${d ? `<span class="nw-delta ${d > 0 ? 'up' : 'down'}">${d > 0 ? '▲' : '▼'}${Math.abs(d)}</span>` : ''}</div>
                    <div class="nw-row"><input type="range" min="0" max="100" step="0.5" value="${v}" class="nw-grow" data-range><input class="nw-in nw-num" type="number" min="0" max="100" step="0.1" value="${v}" data-num></div>
                    <div class="nw-meter"><i style="width:${v}%"></i></div>
                </div>`;
            }).join('')}
            <div class="nw-row"><button type="button" class="nw-btn" data-rec>지금 기록하기</button><button type="button" class="nw-btn" data-trend>여론 추이 보기</button>
                <span class="nw-dim"><span>기록</span> ${N.history.length}</span>${N.history.length ? '<button type="button" class="nw-btn nw-danger" data-clear>기록 지우기</button>' : ''}</div>

            <div class="nw-sec">자동 여론 변동</div>
            <label class="nw-check nw-switch"><input type="checkbox" data-auto ${A.on ? 'checked' : ''}> 날짜를 넘기면 국정 지지율이 저절로 움직이기 (끄면 지금처럼 손으로만)</label>
            <div class="nw-rules ${A.on ? '' : 'off'}">
                <div class="nw-rule"><span>경제 반영 세기</span><input class="nw-in nw-num" type="number" min="0" max="3" step="0.1" data-rule="econ" value="${A.econ}"><span class="nw-dim">${hasEcon ? '성장률 ↑ · 실업률 ↓ · 물가 안정이면 오름' : '경제를 시작한 세이브에서만'}</span></div>
                <div class="nw-rule"><span>기준값으로 돌아가기</span><input class="nw-in nw-num" type="number" min="0" max="50" step="0.5" data-rule="decay" value="${A.decay}"><span class="nw-dim">%/월 — 기준값</span><input class="nw-in nw-num" type="number" min="0" max="100" step="1" data-rule="base" value="${A.base}"><span class="nw-dim">%</span></div>
                <div class="nw-rule"><span>여당 지지율 연동</span><input class="nw-in nw-num" type="number" min="0" max="100" step="5" data-rule="couple" value="${A.couple}"><span class="nw-dim">% — 내각 지지율이 움직인 만큼(이 비율로) 집권 세력 정당 지지율도 (지지율 비례로 나눔)</span></div>
                <div class="nw-rule"><span>총선 뒤 허니문</span><input class="nw-in nw-num" type="number" min="0" max="30" step="1" data-rule="honeymoon" value="${A.honeymoon}"><span class="nw-dim">%p — 총선 결과를 의회에 반영할 때</span></div>
                <div class="nw-dim nw-small">기사 효과는 자동 변동과 상관없이 발행할 때 들어갑니다.</div>
            </div>
        </div>`;
        host.querySelectorAll('[data-appr]').forEach(box => {
            const k = box.dataset.appr, rg = box.querySelector('[data-range]'), nu = box.querySelector('[data-num]');
            const set = (v, done) => {
                N.approval[k] = r1(clamp(Number(v) || 0));
                rg.value = N.approval[k]; nu.value = N.approval[k];
                box.querySelector('.nw-appr-v').textContent = N.approval[k].toFixed(1) + '%';
                box.querySelector('.nw-meter i').style.width = N.approval[k] + '%';
                if (done) { snapshot(); if (dispActive()) renderDisp(); }
            };
            rg.oninput = () => set(rg.value, false); rg.onchange = () => set(rg.value, true);
            nu.onchange = () => set(nu.value, true);
        });
        host.querySelector('[data-rec]').onclick = () => { snapshot(); toast('지금 여론을 기록했습니다'); refresh(); };
        host.querySelector('[data-trend]').onclick = () => { ui.view = 'trend'; showDisp(); };
        host.querySelector('[data-clear]')?.addEventListener('click', () => showCustomConfirm('여론 기록을 모두 지울까요? (지금 지지율은 그대로)', () => { N.history = []; refresh(); }));
        host.querySelector('[data-auto]').onchange = e => { N.auto.on = e.target.checked; renderApproval(); };
        host.querySelectorAll('[data-rule]').forEach(inp => { inp.onchange = () => { N.auto[inp.dataset.rule] = Number(inp.value) || 0; }; });
    }

    // ---------------------------------------------------------------
    // 오른쪽 시각 화면 "여론 · 기사"
    // ---------------------------------------------------------------
    (function addDisp() {
        const after = document.getElementById('dispTabEconomy') || document.getElementById('dispTabTimeline') || document.getElementById('dispTabCabinet');
        const ref = document.getElementById('dispPanelEconomy') || document.getElementById('dispPanelTimeline') || document.getElementById('dispPanelCabinet');
        if (!after || !ref) return;
        after.parentElement.insertBefore(el(`<button class="disp-tab-btn" id="dispTabNews" data-tab="news" onclick="switchDispTab('news')" style="display:none;"><span class="disp-tab-label">여론 · 기사</span><span class="disp-tab-close" onclick="event.stopPropagation();closeDispTab('news')">×</span></button>`), after.nextSibling);
        ref.parentElement.insertBefore(el(`<div class="disp-panel" id="dispPanelNews"><div class="chamber-box nw-disp"><div class="nw-disp-bar" id="nwDispBar"></div><div id="nwDisp"></div></div></div>`), ref.nextSibling);
    })();
    const dispActive = () => !!document.getElementById('dispPanelNews')?.classList.contains('active');
    function showDisp() {
        const btn = document.getElementById('dispTabNews');
        if (btn) btn.style.display = '';
        try { if (!dispActive()) switchDispTab('news'); else renderDisp(); } catch (e) { /* 화면 없음 */ }
    }
    const origDisp = window.switchDispTab;
    window.switchDispTab = function (tab) {
        const r = origDisp.apply(this, arguments);
        if (tab === 'news') setTimeout(renderDisp, 20);
        return r;
    };

    function renderDisp() {
        const bar = document.getElementById('nwDispBar'), box = document.getElementById('nwDisp');
        if (!bar || !box) return;
        const outlets = [...new Set(N.articles.filter(a => a.status === 'published').map(a => a.outlet).filter(Boolean))];
        bar.innerHTML = `<div class="nw-seg"><button type="button" data-view="paper" class="${ui.view === 'paper' ? 'on' : ''}">신문</button><button type="button" data-view="trend" class="${ui.view === 'trend' ? 'on' : ''}">여론 추이</button></div>
            ${ui.view === 'paper' && outlets.length > 1 ? `<select class="nw-in" data-outlet><option value="">모든 언론사</option>${outlets.map(o => `<option ${ui.outlet === o ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>` : ''}
            <span class="nw-grow"></span><button type="button" class="nw-btn" data-png>📷 <span>사진으로 저장</span></button>`;
        bar.querySelectorAll('[data-view]').forEach(b => { b.onclick = () => { ui.view = b.dataset.view; renderDisp(); }; });
        bar.querySelector('[data-outlet]')?.addEventListener('change', e => { ui.outlet = e.target.value; renderDisp(); });
        bar.querySelector('[data-png]').onclick = () => (ui.view === 'trend' ? exportTrend() : exportPaper());
        if (ui.view === 'trend') { box.innerHTML = trendHtml(); bindTrend(box); }
        else { box.innerHTML = paperHtml(); box.querySelectorAll('[data-read]').forEach(x => { x.onclick = () => { const a = N.articles.find(y => y.id === x.dataset.read); if (a) readArticle(a); }; }); }
    }

    function publishedList() {
        return N.articles.filter(a => a.status === 'published' && (!ui.outlet || a.outlet === ui.outlet))
            .sort((a, b) => (keyOf(b.date) || 0) - (keyOf(a.date) || 0) || String(b.id).localeCompare(String(a.id)));
    }
    function paperHtml() {
        const list = publishedList();
        const nation = document.getElementById('nationNameInput')?.value || '';
        const t = today();
        const mast = ui.outlet || (new Set(list.map(a => a.outlet).filter(Boolean)).size === 1 ? list[0].outlet : '') || (nation ? `${nation} 신문` : '오늘의 신문');
        if (!list.length) return `<div class="nw-paper"><div class="nw-mast"><div class="nw-mast-name">${esc(mast)}</div><div class="nw-mast-date">${esc(t ? labelOf(t.key) : '')}</div></div>
            <div class="nw-empty">아직 발행한 기사가 없습니다. 여론 › 기사에서 기사를 쓰고 발행하세요.</div></div>`;
        const lead = list.find(a => a.photo) || list[0];
        const rest = list.filter(a => a !== lead).slice(0, 12);
        const snippet = (s, n) => { const x = String(s || '').replace(/\s+/g, ' ').trim(); return x.length > n ? x.slice(0, n) + '…' : x; };
        const appr = targets().map(tg => `<span><span>${esc(tg.label)}</span> <b>${(Number(N.approval[tg.key]) || 0).toFixed(1)}%</b></span>`).join('');
        return `<div class="nw-paper">
            <div class="nw-mast"><div class="nw-mast-name">${esc(mast)}</div><div class="nw-mast-date"><span>${esc(t ? labelOf(t.key) : '')}</span> · <span>발행 기사</span> ${list.length}</div><div class="nw-mast-appr"><span>국정 지지율</span> ${appr}</div></div>
            <article class="nw-lead" data-read="${esc(lead.id)}">
                ${lead.photo ? `<img src="${esc(lead.photo)}" alt="">` : ''}
                <div><span class="nw-type" style="--c:${TYPE_COLOR[lead.type] || '#888'}">${esc(TYPE_LABEL[lead.type] || '기사')}</span>
                <h3>${esc(lead.title)}</h3>${lead.subtitle ? `<div class="nw-paper-sub">${esc(lead.subtitle)}</div>` : ''}
                <p>${esc(snippet(lead.body, 240))}</p><div class="nw-dim">${esc([lead.outlet, lead.reporter && lead.reporter + ' 기자', labelOf(keyOf(lead.date))].filter(Boolean).join(' · '))}</div></div>
            </article>
            <div class="nw-cols">${rest.map(a => `<article class="nw-item" data-read="${esc(a.id)}">
                <span class="nw-type" style="--c:${TYPE_COLOR[a.type] || '#888'}">${esc(TYPE_LABEL[a.type] || '기사')}</span>
                <h4>${esc(a.title)}</h4><p>${esc(snippet(a.subtitle || a.body, 90))}</p>
                <div class="nw-dim">${esc([a.outlet, labelOf(keyOf(a.date))].filter(Boolean).join(' · '))}</div></article>`).join('')}</div>
        </div>`;
    }

    // ---- 여론 추이 그래프 (SVG) ----
    let trendSel = null; // 보이는 선: Set of 'p:<id>' | 'a:<key>'
    function trendData() {
        const H = N.history;
        const plist = realParties();
        const lastP = H.length ? H[H.length - 1].probs || {} : {};
        const top = plist.slice().sort((a, b) => (Number(lastP[b.id]) || probOf(b)) - (Number(lastP[a.id]) || probOf(a)));
        const series = [
            ...top.map(p => ({ id: 'p:' + p.id, name: p.name, color: p.color || '#888', dash: false, vals: H.map(h => (h.probs && h.probs[p.id] != null ? Number(h.probs[p.id]) : null)) })),
            ...targets().map((t, i) => ({ id: 'a:' + t.key, name: `국정 · ${t.label}`, color: ['#ffd166', '#f78c6b', '#c0c0c0'][i] || '#ccc', dash: true, vals: H.map(h => (h.appr && h.appr[t.key] != null ? Number(h.appr[t.key]) : null)) })),
        ];
        if (!trendSel) trendSel = new Set([...top.slice(0, 6).map(p => 'p:' + p.id), 'a:cabinet', ...targets().filter(t => t.key !== 'cabinet').slice(0, 1).map(t => 'a:' + t.key)]);
        return { H, series };
    }
    function trendSvg(W, H0, forExport) {
        const { H, series } = trendData();
        const shown = series.filter(s => trendSel.has(s.id));
        const padL = 40, padR = 16, padT = 16, padB = 34;
        const iw = W - padL - padR, ih = H0 - padT - padB;
        const xs = H.map(h => (h.key > 100000 ? dayNum(h.key) : h.key));
        const x0 = xs[0], x1 = xs[xs.length - 1];
        const X = v => padL + (x1 > x0 ? (v - x0) / (x1 - x0) * iw : iw / 2);
        let ymax = 10;
        shown.forEach(s => s.vals.forEach(v => { if (v != null && v > ymax) ymax = v; }));
        ymax = Math.min(100, Math.ceil(ymax / 10) * 10);
        const Y = v => padT + ih - v / ymax * ih;
        const pal = forExport || getPal();
        let g = `<rect x="0" y="0" width="${W}" height="${H0}" fill="${pal.bg}"/>`;
        for (let v = 0; v <= ymax; v += ymax > 50 ? 20 : 10) g += `<line x1="${padL}" x2="${W - padR}" y1="${Y(v)}" y2="${Y(v)}" stroke="${pal.grid}" stroke-width="1"/><text x="${padL - 6}" y="${Y(v) + 4}" text-anchor="end" font-size="11" fill="${pal.dim}">${v}%</text>`;
        // 날짜 눈금 (최대 6개)
        const nt = Math.min(6, H.length);
        for (let i = 0; i < nt; i++) { const j = nt === 1 ? 0 : Math.round(i * (H.length - 1) / (nt - 1)); g += `<text x="${X(xs[j])}" y="${H0 - 12}" text-anchor="${i === 0 ? 'start' : i === nt - 1 ? 'end' : 'middle'}" font-size="11" fill="${pal.dim}">${esc(shortLabel(H[j]))}</text>`; }
        // 기사 시점
        const pubs = N.articles.filter(a => a.status === 'published' && keyOf(a.date) != null);
        pubs.forEach(a => {
            const k = keyOf(a.date), xv = H.length && H[0].key > 100000 ? dayNum(k) : null;
            if (xv == null || xv < x0 || xv > x1) return;
            g += `<g class="nw-mark"><line x1="${X(xv)}" x2="${X(xv)}" y1="${padT}" y2="${padT + ih}" stroke="${TYPE_COLOR[a.type] || pal.dim}" stroke-width="1" stroke-dasharray="2 3" opacity=".7"/><circle cx="${X(xv)}" cy="${padT + ih}" r="4" fill="${TYPE_COLOR[a.type] || pal.dim}"/><title>${esc(labelOf(k))} · ${esc(a.title)}</title></g>`;
        });
        shown.forEach(s => {
            let d = '', pen = false;
            s.vals.forEach((v, i) => { if (v == null) { pen = false; return; } d += `${pen ? 'L' : 'M'}${X(xs[i]).toFixed(1)},${Y(v).toFixed(1)}`; pen = true; });
            if (d) g += `<path d="${d}" fill="none" stroke="${esc(s.color)}" stroke-width="${s.dash ? 2 : 2.2}" ${s.dash ? 'stroke-dasharray="6 4"' : ''} stroke-linejoin="round" stroke-linecap="round"/>`;
            const li = s.vals.map((v, i) => (v == null ? -1 : i)).filter(i => i >= 0).pop();
            if (li != null && li >= 0) g += `<circle cx="${X(xs[li])}" cy="${Y(s.vals[li])}" r="3" fill="${esc(s.color)}"><title>${esc(s.name)} ${s.vals[li]}%</title></circle>`;
        });
        return `<svg xmlns="http://www.w3.org/2000/svg" class="nw-chart" viewBox="0 0 ${W} ${H0}" width="${W}" height="${H0}" font-family="${esc(pal.font)}">${g}</svg>`;
    }
    const shortLabel = h => { if (!h) return ''; if (h.key > 100000) { const y = Math.floor(h.key / 10000), m = Math.floor(h.key / 100) % 100; return `${y}.${String(m).padStart(2, '0')}`; } return h.label; };
    function getPal() {
        const modern = root.getAttribute('data-theme-family') === 'modern';
        const cs = getComputedStyle(root);
        const v = (n, d) => (cs.getPropertyValue(n).trim() || d);
        return modern ? { bg: v('--m-surface', '#fff'), grid: v('--m-border', '#e4e4e7'), dim: v('--m-text-3', '#71717a'), text: v('--m-text', '#111'), font: getComputedStyle(document.body).fontFamily }
            : { bg: '#0b0d12', grid: '#1e252d', dim: '#7d8a90', text: '#e0e0e0', font: getComputedStyle(document.body).fontFamily };
    }
    function trendHtml() {
        if (N.history.length < 1) return `<div class="nw-empty">아직 여론 기록이 없습니다. 날짜를 넘기거나 기사를 발행하면, 또는 여론 › 국정 지지율에서 "지금 기록하기"를 누르면 기록됩니다.</div>`;
        const { series } = trendData();
        const last = N.history[N.history.length - 1];
        return `<div class="nw-trend">
            <div class="nw-trend-head"><b>여론 추이</b><span class="nw-dim"><span>${esc(N.history[0].label)}</span> ~ <span>${esc(last.label)}</span> · <span>기록</span> ${N.history.length} · <span>점선은 국정 지지율, 아래 점은 기사</span></span></div>
            <div class="nw-chart-wrap" id="nwChartWrap">${trendSvg(760, 340)}</div>
            <div class="nw-legend">${series.map(s => `<button type="button" class="nw-leg ${trendSel.has(s.id) ? 'on' : ''}" data-ser="${esc(s.id)}"><i style="background:${esc(s.color)}" class="${s.dash ? 'dash' : ''}"></i>${esc(s.name)}${s.vals.length && s.vals[s.vals.length - 1] != null ? ` <span class="nw-dim">${s.vals[s.vals.length - 1]}%</span>` : ''}</button>`).join('')}</div>
            ${N.history.length >= 2 ? changeTable() : ''}
        </div>`;
    }
    function changeTable() {
        const H = N.history, a = H[Math.max(0, H.length - 2)], b = H[H.length - 1];
        const rows = realParties().map(p => ({ name: p.name, color: p.color, v: Number(b.probs?.[p.id]) || 0, d: r1((Number(b.probs?.[p.id]) || 0) - (Number(a.probs?.[p.id]) || 0)) }))
            .sort((x, y) => y.v - x.v).slice(0, 10);
        return `<div class="nw-sec">지난 기록(${esc(a.label)}) 대비</div><div class="nw-change">${rows.map(r => `<div><i class="nw-dot" style="background:${esc(r.color)}"></i>${esc(r.name)}<span class="nw-grow"></span><b>${r.v}%</b>${r.d ? `<span class="nw-delta ${r.d > 0 ? 'up' : 'down'}">${r.d > 0 ? '▲' : '▼'}${Math.abs(r.d)}</span>` : '<span class="nw-delta">–</span>'}</div>`).join('')}</div>`;
    }
    function bindTrend(box) {
        box.querySelectorAll('[data-ser]').forEach(b => { b.onclick = () => { const id = b.dataset.ser; if (trendSel.has(id)) trendSel.delete(id); else trendSel.add(id); renderDisp(); }; });
    }

    // ---- 사진으로 저장 ----
    function download(canvas, name) {
        const go = href => { const a = document.createElement('a'); a.href = href; a.download = name; document.body.appendChild(a); a.click(); a.remove(); };
        if (canvas.toBlob) canvas.toBlob(b => { if (!b) { go(canvas.toDataURL('image/png')); return; } const u = URL.createObjectURL(b); go(u); setTimeout(() => URL.revokeObjectURL(u), 3000); }, 'image/png');
        else go(canvas.toDataURL('image/png'));
    }
    const fileBase = () => (document.getElementById('nationNameInput')?.value || 'hemicycle').replace(/[\\/:*?"<>|]/g, '_');
    function exportTrend() {
        if (!N.history.length) { showCustomAlert('아직 여론 기록이 없습니다.'); return; }
        const pal = getPal();
        const W = 1200, H0 = 560, legendH = 28 * Math.ceil(trendData().series.filter(s => trendSel.has(s.id)).length / 4) + 70;
        const svg = trendSvg(W, H0, pal);
        const img = new Image();
        img.onload = () => {
            const c = document.createElement('canvas'); c.width = W * 2; c.height = (H0 + legendH) * 2;
            const g = c.getContext('2d'); g.scale(2, 2);
            g.fillStyle = pal.bg; g.fillRect(0, 0, W, H0 + legendH);
            g.fillStyle = pal.text; g.font = `bold 20px ${pal.font}`; g.fillText(tr('여론 추이'), 40, 36);
            g.drawImage(img, 0, 50, W, H0 - 50);
            let x = 40, y = H0 + 20; g.font = `14px ${pal.font}`;
            trendData().series.filter(s => trendSel.has(s.id)).forEach((s, i) => {
                if (i && i % 4 === 0) { x = 40; y += 28; }
                g.strokeStyle = s.color; g.lineWidth = 3; g.setLineDash(s.dash ? [6, 4] : []); g.beginPath(); g.moveTo(x, y); g.lineTo(x + 24, y); g.stroke(); g.setLineDash([]);
                const lv = s.vals[s.vals.length - 1];
                g.fillStyle = pal.text; g.fillText(`${s.name.replace(/^국정 · /, tr('국정 지지율') + ' · ')}${lv != null ? ` ${lv}%` : ''}`, x + 32, y + 5);
                x += 280;
            });
            g.fillStyle = pal.dim; g.font = `12px ${pal.font}`; g.fillText(`${tr(N.history[0].label)} ~ ${tr(N.history[N.history.length - 1].label)}`, 40, H0 + legendH - 16);
            download(c, `${fileBase()}-여론추이.png`);
        };
        img.onerror = () => showCustomAlert('그래프를 사진으로 만들지 못했습니다.');
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    }
    function exportPaper() {
        const list = publishedList();
        if (!list.length) { showCustomAlert('발행한 기사가 없습니다.'); return; }
        const pal = getPal();
        const W = 1000, pad = 40;
        const c = document.createElement('canvas');
        const g0 = c.getContext('2d');
        const wrap = (g, text, maxW, font) => { g.font = font; const out = []; let line = ''; String(text || '').replace(/\s+/g, ' ').split('').forEach(ch => { const t = line + ch; if (g.measureText(t).width > maxW && line) { out.push(line); line = ch; } else line = t; }); if (line) out.push(line); return out; };
        const items = list.slice(0, 20);
        // 높이 미리 재기
        let h = 130;
        const blocks = items.map(a => {
            const tl = wrap(g0, a.title, W - pad * 2, `bold 22px ${pal.font}`);
            const bl = wrap(g0, a.subtitle || a.body, W - pad * 2, `15px ${pal.font}`).slice(0, 3);
            const bh = 30 + tl.length * 30 + bl.length * 22 + 34;
            h += bh;
            return { a, tl, bl, bh };
        });
        h += 40;
        c.width = W * 2; c.height = h * 2;
        const g = c.getContext('2d'); g.scale(2, 2);
        g.fillStyle = pal.bg; g.fillRect(0, 0, W, h);
        const nation = document.getElementById('nationNameInput')?.value || '';
        const t = today();
        g.fillStyle = pal.text; g.font = `bold 34px ${pal.font}`; g.textAlign = 'center';
        g.fillText(ui.outlet || (nation ? `${nation} ${tr('신문')}` : tr('오늘의 신문')), W / 2, 62);
        g.font = `14px ${pal.font}`; g.fillStyle = pal.dim;
        g.fillText(`${t ? tr(labelOf(t.key)) : ''} · ${tr('발행 기사')} ${list.length} · ${tr('국정 지지율')} ${targets().map(tg => `${tr(tg.label)} ${(Number(N.approval[tg.key]) || 0).toFixed(1)}%`).join(' · ')}`, W / 2, 92);
        g.textAlign = 'left';
        g.strokeStyle = pal.text; g.lineWidth = 2; g.beginPath(); g.moveTo(pad, 110); g.lineTo(W - pad, 110); g.stroke();
        let y = 130;
        blocks.forEach(({ a, tl, bl, bh }) => {
            g.fillStyle = TYPE_COLOR[a.type] || pal.dim; g.font = `bold 13px ${pal.font}`; const tl0 = tr(TYPE_LABEL[a.type] || '기사'); g.fillText(tl0, pad, y + 18); const tlw = g.measureText(tl0).width;
            g.fillStyle = pal.dim; g.font = `13px ${pal.font}`; g.fillText([a.outlet, a.reporter && a.reporter + ' ' + tr('기자'), tr(labelOf(keyOf(a.date)))].filter(Boolean).join(' · '), pad + tlw + 12, y + 18);
            let yy = y + 30;
            g.fillStyle = pal.text; g.font = `bold 22px ${pal.font}`; tl.forEach(l => { yy += 28; g.fillText(l, pad, yy); });
            g.fillStyle = pal.dim; g.font = `15px ${pal.font}`; bl.forEach(l => { yy += 22; g.fillText(l, pad, yy); });
            g.strokeStyle = pal.grid; g.lineWidth = 1; g.beginPath(); g.moveTo(pad, y + bh - 8); g.lineTo(W - pad, y + bh - 8); g.stroke();
            y += bh;
        });
        download(c, `${fileBase()}-기사.png`);
    }

    // ---------------------------------------------------------------
    // 다른 파일 · 스크립트 모드
    // ---------------------------------------------------------------
    window.HemiNews = {
        get state() { return N; },
        approval: k => (k in N.approval ? Number(N.approval[k]) || 0 : null),
        setApproval(k, v) { if (!(k in N.approval)) return; N.approval[k] = r1(clamp(Number(v) || 0)); snapshot(); refresh(); },
        addApproval(k, v) { if (!(k in N.approval)) return; N.approval[k] = r1(clamp((Number(N.approval[k]) || 0) + (Number(v) || 0))); snapshot(); refresh(); },
        // 스크립트 모드 "article" 효과 — { title, subtitle, body, outlet, reporter, type, effects:[{ party|approval, add }] }
        publishNew(o, partyRef) {
            if (!o || typeof o !== 'object') return null;
            const a = blank();
            ['title', 'subtitle', 'body', 'outlet', 'reporter'].forEach(k => { if (o[k] != null) a[k] = String(o[k]).slice(0, k === 'body' ? 5000 : 200); });
            if (TYPE_LABEL[o.type]) a.type = o.type;
            (Array.isArray(o.effects) ? o.effects : []).forEach(ef => {
                if (!ef) return;
                if (ef.approval) a.effects.push({ target: 'approval', which: String(ef.approval), delta: Number(ef.add) || 0 });
                else if (ef.party != null) { const p = (partyRef && partyRef(ef.party)) || partyById(ef.party); if (p) a.effects.push({ target: 'party', partyId: p.id, delta: Number(ef.add) || 0 }); }
            });
            N.articles.push(a);
            publish(a, true);
            return a.id;
        },
        publish: id => publish(N.articles.find(a => a.id === id)), unpublish: id => unpublish(N.articles.find(a => a.id === id)),
        snapshot, showDisp, refresh, targets, chartSvg: (w, h) => trendSvg(w || 760, h || 340, getPal()),
    };

    // ---------------------------------------------------------------
    // 모양
    // ---------------------------------------------------------------
    const css = document.createElement('style');
    css.textContent = `
        .nw-wrap { font-size: .85rem; display: flex; flex-direction: column; gap: 8px; }
        .nw-intro { color: #8a94a3; font-size: .76rem; line-height: 1.6; }
        .nw-bar, .nw-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .nw-grow { flex: 1 1 auto; min-width: 0; }
        .nw-btn { cursor: pointer; font: inherit; font-size: .8rem; padding: 5px 10px; background: transparent; border: 1px solid #444; color: #ccc; }
        .nw-btn:hover { border-color: var(--tno-neon); color: var(--tno-neon); }
        .nw-btn.nw-primary { border-color: var(--tno-neon); color: var(--tno-neon); }
        .nw-btn.nw-danger:hover { border-color: #e5484d; color: #e5484d; }
        .nw-in { font: inherit; font-size: .82rem; padding: 5px 7px; background: #07090d; border: 1px solid #333; color: var(--tno-text, #ddd); min-width: 0; }
        .nw-in:focus { outline: none; border-color: var(--tno-neon); }
        .nw-num { width: 72px !important; flex: 0 0 auto; }
        .nw-row input[type=range] { flex: 1 1 auto; min-width: 80px; }
        .nw-title { font-size: 1rem; }
        .nw-body { resize: vertical; line-height: 1.6; }
        .nw-lab { color: #8a94a3; font-size: .74rem; margin-top: 4px; }
        .nw-editor .nw-in:not(.nw-num) { width: 100%; box-sizing: border-box; }
        .nw-editor .nw-row .nw-in, .nw-editor .nw-bar .nw-in { width: auto; }
        .nw-grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; }
        .nw-sec { color: var(--tno-gold, #ffd700); font-size: .8rem; letter-spacing: 1px; margin-top: 10px; padding-top: 8px; border-top: 1px dashed #2a3138; }
        .nw-small { font-size: .72rem; line-height: 1.5; }
        .nw-dim { color: #7d8a90; font-size: .74rem; }
        .nw-empty { color: #777; padding: 20px 6px; line-height: 1.7; text-align: center; }
        .nw-types { display: flex; gap: 5px; flex-wrap: wrap; }
        .nw-chip { cursor: pointer; font: inherit; font-size: .78rem; padding: 3px 9px; background: transparent; border: 1px solid #3a3f46; color: #aaa; }
        .nw-chip.on { border-color: var(--c, var(--tno-neon)); color: #fff; background: color-mix(in srgb, var(--c, var(--tno-neon)) 25%, transparent); }
        .nw-chip:disabled { opacity: .4; cursor: not-allowed; }
        .nw-check { display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: .8rem; color: #ccc; }
        .nw-tag { display: inline-flex; align-items: center; gap: 4px; padding: 2px 7px; border: 1px solid #3a3f46; font-size: .75rem; color: #ccc; }
        .nw-tag button { background: none; border: none; color: #888; cursor: pointer; padding: 0; font: inherit; }
        .nw-x { cursor: pointer; background: none; border: 1px solid #3a3f46; color: #888; width: 26px; height: 26px; font: inherit; }
        .nw-eff-row { display: flex; align-items: center; gap: 6px; }
        .nw-pick { border: 1px solid #2a3138; padding: 6px; }
        .nw-pick-list { max-height: 200px; overflow: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 2px 8px; margin-top: 6px; }
        .nw-photo { max-height: 70px; max-width: 120px; object-fit: cover; border: 1px solid #333; }
        .nw-foot { position: sticky; bottom: 0; padding: 8px 0; background: var(--tno-panel, #1a1d26); border-top: 1px solid #2a3138; margin-top: 6px; }
        .nw-card { display: flex; gap: 10px; padding: 9px; border: 1px solid #2a2f36; border-left: 3px solid #555; background: rgba(255,255,255,.015); }
        .nw-card.pub { border-left-color: var(--tno-neon); }
        .nw-card.draft { opacity: .88; }
        .nw-thumb { width: 74px; height: 74px; object-fit: cover; flex: 0 0 auto; border: 1px solid #333; }
        .nw-card-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
        .nw-card-top { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .nw-type { font-size: .68rem; padding: 0 6px; line-height: 1.6; border: 1px solid var(--c); color: var(--c); }
        .nw-status { font-size: .68rem; color: #9aa; }
        .nw-card.pub .nw-status { color: var(--tno-neon); }
        .nw-card-title { color: #eee; font-size: .95rem; line-height: 1.4; word-break: keep-all; }
        .nw-card-sub { color: #aab; font-size: .78rem; }
        .nw-eff { font-size: .74rem; color: #c9b458; }
        .nw-appr { border: 1px solid #2a2f36; padding: 8px 10px; display: flex; flex-direction: column; gap: 6px; }
        .nw-appr-head { display: flex; align-items: baseline; gap: 8px; }
        .nw-appr-v { font-size: 1.15rem; color: var(--tno-neon); }
        .nw-meter { height: 4px; background: #1c2128; } .nw-meter i { display: block; height: 100%; background: var(--tno-neon); }
        .nw-delta { font-size: .72rem; } .nw-delta.up { color: #3ecf8e; } .nw-delta.down { color: #ef6461; }
        .nw-rules { display: flex; flex-direction: column; gap: 6px; } .nw-rules.off { opacity: .5; }
        .nw-rule { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; } .nw-rule > span:first-child { min-width: 130px; color: #ccc; }
        .nw-overlay { position: fixed; inset: 0; z-index: 100001; display: flex; align-items: center; justify-content: center; padding: 16px; background: rgba(0,0,0,.65); }
        .nw-read { position: relative; width: 640px; max-width: 100%; max-height: calc(100vh - 32px); overflow: auto; background: #0d0f14; color: #ddd; border: 1px solid var(--tno-neon); padding: 20px 22px; display: flex; flex-direction: column; gap: 8px; }
        .nw-read-x { position: absolute; top: 10px; right: 10px; width: 30px; height: 30px; background: #000; border: 1px solid #444; color: #ccc; cursor: pointer; font: inherit; font-size: 1.1rem; }
        .nw-read-title { margin: 4px 30px 0 0; font-size: 1.35rem; line-height: 1.35; color: #fff; font-weight: normal; word-break: keep-all; }
        .nw-read-sub { color: #aab; font-size: .95rem; }
        .nw-read-photo { width: 100%; max-height: 360px; object-fit: cover; border: 1px solid #333; }
        .nw-read-body { line-height: 1.8; font-size: .92rem; } .nw-read-body p { margin: 0 0 10px; }
        /* 오른쪽 화면 */
        .nw-disp { display: flex; flex-direction: column; gap: 10px; }
        .nw-disp-bar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .nw-seg { display: inline-flex; border: 1px solid #333; } .nw-seg button { cursor: pointer; font: inherit; font-size: .82rem; padding: 5px 12px; background: transparent; border: none; color: #999; }
        .nw-seg button.on { background: var(--tno-neon); color: #000; }
        .nw-paper { background: #0b0d12; border: 1px solid #2a3138; padding: 16px 18px; }
        .nw-mast { text-align: center; border-bottom: 3px double #556; padding-bottom: 10px; margin-bottom: 14px; }
        .nw-mast-name { font-size: 1.9rem; letter-spacing: 3px; color: #f2f2f2; }
        .nw-mast-date, .nw-mast-appr { color: #8a94a3; font-size: .78rem; margin-top: 4px; } .nw-mast-appr span { margin: 0 6px; } .nw-mast-appr b { color: var(--tno-neon); font-weight: normal; }
        .nw-lead { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); gap: 14px; cursor: pointer; padding-bottom: 14px; border-bottom: 1px solid #2a3138; margin-bottom: 12px; }
        .nw-lead:not(:has(img)) { grid-template-columns: 1fr; }
        .nw-lead img { width: 100%; max-height: 280px; object-fit: cover; }
        .nw-lead h3 { margin: 6px 0; font-size: 1.4rem; line-height: 1.3; color: #fff; font-weight: normal; word-break: keep-all; }
        .nw-lead p, .nw-item p { color: #b8c0c8; font-size: .85rem; line-height: 1.6; margin: 6px 0; }
        .nw-paper-sub { color: #aab; font-size: .9rem; }
        .nw-cols { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px 16px; }
        .nw-item { cursor: pointer; padding-bottom: 10px; border-bottom: 1px dotted #2a3138; }
        .nw-item h4 { margin: 5px 0 0; font-size: 1rem; line-height: 1.35; color: #eee; font-weight: normal; word-break: keep-all; }
        .nw-lead:hover h3, .nw-item:hover h4 { color: var(--tno-neon); }
        .nw-trend { display: flex; flex-direction: column; gap: 10px; }
        .nw-trend-head { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
        .nw-chart-wrap { width: 100%; overflow: hidden; border: 1px solid #2a3138; } .nw-chart { width: 100%; height: auto; display: block; }
        .nw-legend { display: flex; flex-wrap: wrap; gap: 4px 6px; }
        .nw-leg { cursor: pointer; font: inherit; font-size: .76rem; display: inline-flex; align-items: center; gap: 5px; padding: 3px 8px; background: transparent; border: 1px solid #2f353c; color: #777; }
        .nw-leg.on { color: #ddd; border-color: #555; }
        .nw-leg i { width: 14px; height: 3px; display: inline-block; } .nw-leg i.dash { background-image: linear-gradient(90deg, currentColor 60%, transparent 60%) !important; background-size: 6px 3px; }
        .nw-change { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 4px 14px; font-size: .8rem; }
        .nw-change > div { display: flex; align-items: center; gap: 6px; }
        .nw-dot { width: 8px; height: 8px; display: inline-block; border-radius: 50%; }
        /* 라이트 · 다크 */
        html[data-theme-family="modern"] .nw-intro, html[data-theme-family="modern"] .nw-lab, html[data-theme-family="modern"] .nw-dim { color: var(--m-text-3); }
        html[data-theme-family="modern"] .nw-btn { border-color: var(--m-border); color: var(--m-text); border-radius: 8px; }
        html[data-theme-family="modern"] .nw-btn:hover { border-color: var(--m-text-3); color: var(--m-text); }
        html[data-theme-family="modern"] .nw-btn.nw-primary { background: var(--m-accent); border-color: var(--m-accent); color: var(--m-on-accent, #fff); }
        html[data-theme-family="modern"] .nw-in { background: var(--m-surface); border-color: var(--m-border); color: var(--m-text); border-radius: 8px; }
        html[data-theme-family="modern"] .nw-in:focus { border-color: var(--m-text-3); }
        html[data-theme-family="modern"] .nw-sec { color: var(--m-text); font-weight: 700; letter-spacing: 0; border-top-color: var(--m-border); }
        html[data-theme-family="modern"] .nw-chip { border-color: var(--m-border); color: var(--m-text-2); border-radius: 999px; }
        html[data-theme-family="modern"] .nw-chip.on { color: var(--m-text); background: color-mix(in srgb, var(--c, var(--m-accent)) 18%, transparent); border-color: var(--c, var(--m-accent)); }
        html[data-theme-family="modern"] .nw-check, html[data-theme-family="modern"] .nw-rule > span:first-child { color: var(--m-text); }
        html[data-theme-family="modern"] .nw-tag, html[data-theme-family="modern"] .nw-x { border-color: var(--m-border); color: var(--m-text-2); border-radius: 999px; }
        html[data-theme-family="modern"] .nw-x { border-radius: 8px; }
        html[data-theme-family="modern"] .nw-pick { border-color: var(--m-border); border-radius: 10px; }
        html[data-theme-family="modern"] .nw-foot { background: var(--m-bg, var(--m-surface)); border-top-color: var(--m-border); }
        html[data-theme-family="modern"] .nw-card { background: var(--m-surface); border-color: var(--m-border); border-left-color: var(--m-border-strong); border-radius: 12px; }
        html[data-theme-family="modern"] .nw-card.pub { border-left-color: var(--m-accent); }
        html[data-theme-family="modern"] .nw-card.pub .nw-status { color: var(--m-accent); }
        html[data-theme-family="modern"] .nw-card-title { color: var(--m-text); font-weight: 600; }
        html[data-theme-family="modern"] .nw-card-sub { color: var(--m-text-2); }
        html[data-theme-family="modern"] .nw-type { border-radius: 999px; border: none; background: color-mix(in srgb, var(--c) 16%, transparent); font-weight: 600; }
        html[data-theme-family="modern"] .nw-eff { color: color-mix(in srgb, #b8860b 80%, var(--m-text)); }
        html[data-theme-family="modern"] .nw-thumb, html[data-theme-family="modern"] .nw-photo { border-radius: 8px; border-color: var(--m-border); }
        html[data-theme-family="modern"] .nw-appr { border-color: var(--m-border); border-radius: 12px; background: var(--m-surface); }
        html[data-theme-family="modern"] .nw-appr-v { color: var(--m-text); font-weight: 700; }
        html[data-theme-family="modern"] .nw-meter { background: var(--m-surface-2); border-radius: 4px; overflow: hidden; } html[data-theme-family="modern"] .nw-meter i { background: var(--m-accent); }
        html[data-theme-family="modern"] .nw-read { background: var(--m-surface); color: var(--m-text); border: 1px solid var(--m-border); border-radius: 16px; box-shadow: 0 20px 50px rgba(0,0,0,.3); }
        html[data-theme-family="modern"] .nw-read-x { background: var(--m-surface-2); border: none; color: var(--m-text); border-radius: 9px; }
        html[data-theme-family="modern"] .nw-read-title { color: var(--m-text); font-weight: 800; }
        html[data-theme-family="modern"] .nw-read-sub, html[data-theme-family="modern"] .nw-paper-sub { color: var(--m-text-2); }
        html[data-theme-family="modern"] .nw-read-photo, html[data-theme-family="modern"] .nw-lead img { border-radius: 10px; border: none; }
        html[data-theme-family="modern"] .nw-seg { border: none; background: var(--m-surface-2); border-radius: 10px; padding: 3px; }
        html[data-theme-family="modern"] .nw-seg button { border-radius: 7px; color: var(--m-text-3); font-weight: 600; }
        html[data-theme-family="modern"] .nw-seg button.on { background: var(--m-surface); color: var(--m-text); box-shadow: var(--m-shadow-sm); }
        html[data-theme-family="modern"] .nw-paper { background: var(--m-surface); border-color: var(--m-border); border-radius: 14px; }
        html[data-theme-family="modern"] .nw-mast { border-bottom-color: var(--m-text); }
        html[data-theme-family="modern"] .nw-mast-name { color: var(--m-text); font-weight: 800; font-family: Georgia, 'Noto Serif KR', serif; letter-spacing: 1px; }
        html[data-theme-family="modern"] .nw-mast-date, html[data-theme-family="modern"] .nw-mast-appr { color: var(--m-text-3); } html[data-theme-family="modern"] .nw-mast-appr b { color: var(--m-text); font-weight: 700; }
        html[data-theme-family="modern"] .nw-lead { border-bottom-color: var(--m-border); }
        html[data-theme-family="modern"] .nw-lead h3, html[data-theme-family="modern"] .nw-item h4 { color: var(--m-text); font-weight: 700; }
        html[data-theme-family="modern"] .nw-lead p, html[data-theme-family="modern"] .nw-item p { color: var(--m-text-2); }
        html[data-theme-family="modern"] .nw-item { border-bottom-color: var(--m-border); }
        html[data-theme-family="modern"] .nw-lead:hover h3, html[data-theme-family="modern"] .nw-item:hover h4 { color: var(--m-accent); }
        html[data-theme-family="modern"] .nw-chart-wrap { border-color: var(--m-border); border-radius: 12px; }
        html[data-theme-family="modern"] .nw-leg { border-color: var(--m-border); color: var(--m-text-3); border-radius: 999px; }
        html[data-theme-family="modern"] .nw-leg.on { color: var(--m-text); border-color: var(--m-text-3); }
        html[data-theme-family="modern"] .nw-empty { color: var(--m-text-3); }
    `;
    document.head.appendChild(css);
})();
