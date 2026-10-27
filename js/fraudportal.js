// ===== 부정선거 시각 탭 — "검은 투표함" 뒷세계 포털 =====
// 선거 › 부정선거(⚠) 탭을 열면 오른쪽 시각 화면에 나타난다. 모든 테마에서 같은 어두운 화면 — 음지 사이트처럼.
//   - 진행 중인 의뢰: 정당마다 부정선거 시도(대상 원 · 득표 부풀리기 · 조작 지역구 · 발각 위험) — 다음 총선 개표 1회에 실행
//   - 조작 지역구 지도: 의뢰한 정당 색으로 칠하고 나머지는 어둡게 (지도 방식 지역구일 때)
//   - 거래 기록: 지난 시도의 결과(은폐 · 발각) — js/main.js 개표가 HemiFraudOutcome으로 넘겨 주고, 세이브의 fraudLedger 칸에 남는다
/* global parties, chamberDisplayName, districtSvgMapFor, renderDistrictSvgInto, districtNames, escapeHtmlText, getAppState, setAppState, switchSubTab, switchDispTab */
(function () {
    'use strict';
    const root = document.documentElement;
    if (root.getAttribute('data-app-mode') === 'logo') return;

    const esc = s => (typeof escapeHtmlText === 'function' ? escapeHtmlText(String(s ?? '')) : String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])));
    const chName = ch => (typeof chamberDisplayName === 'function' ? chamberDisplayName(ch) : ch);
    let ledger = []; // [{ id, date, title, year, chamberName, ops: [{ name, color, boostPct, rigged, catchChance, caught }] }]

    // ---- 저장 ----
    const origGet = window.getAppState;
    window.getAppState = function () {
        const st = origGet.apply(this, arguments);
        if (st && typeof st === 'object') st.fraudLedger = JSON.parse(JSON.stringify(ledger));
        return st;
    };
    const origSet = window.setAppState;
    window.setAppState = function (state) {
        const r = origSet.apply(this, arguments);
        ledger = Array.isArray(state && state.fraudLedger) ? JSON.parse(JSON.stringify(state.fraudLedger)).slice(0, 50) : [];
        render();
        return r;
    };
    window.HemiFraudOutcome = rec => {
        ledger.unshift({ id: 'f' + Date.now().toString(36), ...rec });
        ledger = ledger.slice(0, 50);
        render();
    };

    // 의뢰 번호 — 정당 · 원으로 늘 같은 암호 같은 이름
    function codeOf(s) {
        let h = 2166136261;
        for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
        const x = (h >>> 0).toString(16).toUpperCase().padStart(8, '0');
        return `#${x.slice(0, 3)}-${x.slice(3, 5)}`;
    }
    const RISK = v => (v < 20 ? ['낮음', 'lo'] : v < 45 ? ['보통', 'mid'] : v < 70 ? ['높음', 'hi'] : ['치명적', 'crit']);
    // 가짜 주소 — 세이브마다 달라 보이게 국가명으로
    function onion() {
        const nation = document.getElementById('nationNameInput')?.value || 'state';
        let h = 0; for (const c of nation) h = (h * 31 + c.charCodeAt(0)) >>> 0;
        const abc = 'abcdefghijklmnopqrstuvwxyz234567';
        let s = ''; for (let i = 0; i < 16; i++) { h = (Math.imul(h, 1103515245) + 12345) >>> 0; s += abc[h >>> 27]; }
        return `${s}.onion/ballot`;
    }

    function render() {
        const box = document.getElementById('fraudPortal');
        if (!box) return;
        const ops = (typeof parties !== 'undefined' ? parties : []).filter(p => p.fraudAttempt);
        const opsHtml = ops.length ? ops.map(p => {
            const fa = p.fraudAttempt, risk = RISK(fa.catchChance ?? 0);
            const names = (fa.riggedDistricts || []).map(k => (typeof districtNames !== 'undefined' && (districtNames[fa.chamber]?.[k] || districtNames.house?.[k])) || k);
            return `<div class="fp-op">
                <div class="fp-op-head"><span class="fp-code">${codeOf(p.id + ':' + fa.chamber)}</span><i class="fp-dot" style="--pc:${esc(p.color)}"></i><b>${esc(p.name)}</b><span class="fp-tag">${esc(chName(fa.chamber))}</span><span class="fp-status">● 대기 — 다음 총선 개표 때 실행</span></div>
                <div class="fp-op-body">
                    <div><span class="fp-k">득표 부풀리기</span><span class="fp-v">+${fa.boostPct || 0}%p</span></div>
                    <div><span class="fp-k">조작 지역구</span><span class="fp-v">${names.length}곳</span></div>
                    <div class="fp-risk ${risk[1]}"><span class="fp-k">발각 위험</span><span class="fp-v">${fa.catchChance ?? 0}% · ${risk[0]}</span><span class="fp-meter"><span style="width:${Math.min(100, fa.catchChance ?? 0)}%"></span></span></div>
                </div>
                <div class="fp-m fp-escrow"><span>🔐 에스크로 예치됨</span><span>판매자 ghost_ballot · ★ 4.9</span></div>
                ${names.length ? `<div class="fp-dist">${names.slice(0, 12).map(n => `<span>${esc(n)}</span>`).join('')}${names.length > 12 ? `<span>외 ${names.length - 12}곳</span>` : ''}</div>` : ''}
            </div>`;
        }).join('') : '<div class="fp-empty">&gt; 진행 중인 의뢰 없음. 왼쪽에서 정당을 골라 거래를 시작하세요<span class="fp-cursor">_</span></div>';
        const led = ledger.length ? ledger.map(r => (r.ops || []).map(o => `<div class="fp-led ${o.caught ? 'bad' : 'ok'}">
                <span class="fp-led-st">${o.caught ? '✘ 발각' : '✔ 은폐됨'}</span>
                <i class="fp-dot" style="--pc:${esc(o.color)}"></i><span class="fp-led-name">${esc(o.name)}</span>
                <span class="fp-led-meta">${esc([r.title, r.year].filter(Boolean).join(' '))} · ${esc(r.chamberName || '')}${r.date ? ` · ${esc(r.date)}` : ''} · +${o.boostPct}%p · ${o.rigged}곳 · 위험 ${o.catchChance}%</span>
            </div>`).join('')).join('') : '<div class="fp-empty">&gt; 기록 없음</div>';
        box.innerHTML = `<div class="fp">
            <div class="fp-bar"><span class="fp-onion">🧅</span><span class="fp-url">http://${esc(onion())}</span><span class="fp-sec">🔒 3홉 회로 · 추적 불가</span></div>
            <div class="fp-hero">
                <div class="fp-logo" data-text="BLACK BALLOT">BLACK <em>BALLOT</em></div>
                <div class="fp-sub">검은 투표함 — 표 중개 · 개표 조정 · 흔적 정리</div>
                <div class="fp-warn">이 페이지는 존재하지 않습니다. 당신은 아무것도 보지 않았습니다.</div>
                <div class="fp-m fp-cats"><span class="on">전체</span><span>표 매수</span><span>개표 조정</span><span>흔적 정리</span><span>증인 관리</span></div>
            </div>
            <div class="fp-sec-h"><i class="fp-br">[ </i>진행 중인 의뢰 <b>${ops.length}</b><i class="fp-br"> ]</i></div>
            ${opsHtml}
            <div id="fpMaps"></div>
            <div class="fp-sec-h"><i class="fp-br">[ </i>거래 기록<i class="fp-br"> ]</i></div>
            <div class="fp-ledger">${led}</div>
            <div class="fp-foot">세션 ${codeOf(onion()).slice(1)} · 로그는 접속을 끊으면 지워집니다 · 발각되면 그 정당은 활동 금지</div>
        </div>`;
        // 조작 지역구 지도 — 원마다 (지도 방식 지역구일 때)
        const maps = box.querySelector('#fpMaps');
        const byCh = {};
        ops.forEach(p => (p.fraudAttempt.riggedDistricts || []).forEach(k => { (byCh[p.fraudAttempt.chamber] = byCh[p.fraudAttempt.chamber] || {})[k] = p; }));
        Object.entries(byCh).forEach(([ch, rig]) => {
            if (typeof districtSvgMapFor !== 'function' || !districtSvgMapFor(ch) || typeof renderDistrictSvgInto !== 'function') return;
            const wrap = document.createElement('div');
            wrap.className = 'fp-map';
            wrap.innerHTML = `<div class="fp-sec-h"><i class="fp-br">[ </i>표적 지역구 — ${esc(chName(ch))}<i class="fp-br"> ]</i></div><div class="fp-map-in"></div>`;
            maps.appendChild(wrap);
            renderDistrictSvgInto(wrap.querySelector('.fp-map-in'), {
                chamber: ch, zoomKey: 'fraud:' + ch, hideAbbr: true,
                getFill: k => (rig[k] ? rig[k].color : '#0b0f0c'),
                title: k => `${(districtNames[ch]?.[k] || districtNames.house?.[k] || k)}${rig[k] ? ` — ${rig[k].name}` : ''}`,
            });
        });
    }

    // 부정선거 탭을 열면 포털을 띄운다
    const origSub = window.switchSubTab;
    if (typeof origSub === 'function') {
        window.switchSubTab = function (main, sub) {
            const r = origSub.apply(this, arguments);
            if ((main === 'vote' || main === 'nation') && sub === 'fraud') {
                const btn = document.getElementById('dispTabFraud');
                if (btn) btn.style.display = '';
                try { switchDispTab('fraud'); } catch (e) { /* 시각 화면 없음 */ }
                render();
            }
            return r;
        };
    }
    const origFraud = window.renderFraudTab;
    if (typeof origFraud === 'function') window.renderFraudTab = function () { const r = origFraud.apply(this, arguments); render(); return r; };
    const origDisp = window.switchDispTab;
    if (typeof origDisp === 'function') window.switchDispTab = function (tab) { const r = origDisp.apply(this, arguments); if (tab === 'fraud') render(); return r; };
    // 지역구 선택은 왼쪽 목록을 다시 그리지 않으므로 포털만 따로 갱신
    const origRig = window.updateFraudRiggedDistricts;
    if (typeof origRig === 'function') window.updateFraudRiggedDistricts = function () { const r = origRig.apply(this, arguments); render(); return r; };
    window.HemiFraudPortal = { render, get ledger() { return ledger; } };

    const style = document.createElement('style');
    style.textContent = `
        #dispPanelFraud.active { background: #050706; }
        /* 왼쪽 부정선거 탭 — 오른쪽 포털과 같은 음지 화면 (모든 테마) */
        #contentFraud { --fp-bg: #050706; --fp-ink: #8dffb0; --fp-dim: #3e6b4c; --fp-line: #12301c; --fp-red: #ff2e4d; --fp-amber: #ffb02e;
            background: var(--fp-bg); color: var(--fp-ink); border: 1px solid var(--fp-line); padding: 10px; position: relative; box-shadow: inset 0 0 40px rgba(0,0,0,.9); }
        #contentFraud.active { display: block; }
        #contentFraud::before { content: ''; position: absolute; inset: 0; pointer-events: none; z-index: 2; background: repeating-linear-gradient(0deg, rgba(0,0,0,.3) 0 1px, transparent 1px 3px); }
        #contentFraud, #contentFraud * { font-family: 'NeoDunggeunmo', 'VT323', Consolas, monospace !important; }
        #contentFraud .fl-intro { color: var(--fp-dim); font-size: .74rem; line-height: 1.55; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px dashed var(--fp-line); }
        #contentFraud .fl-intro-h { color: #d8ffe3; font-size: .86rem; letter-spacing: 2px; margin-bottom: 4px; text-shadow: 0 0 6px rgba(141,255,176,.45); }
        #contentFraud .fl-cursor { animation: fp-blink 1s infinite steps(1); }
        #contentFraud .fl-card { border: 1px solid var(--fp-line); border-left: 3px solid var(--fp-dim); background: rgba(10,20,13,.8); padding: 8px; margin-bottom: 8px; }
        #contentFraud .fl-card:has(.fl-deal.on) { border-left-color: var(--fp-red); }
        #contentFraud .fl-head { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
        #contentFraud .fl-dot { width: 9px; height: 9px; border-radius: 50%; background: var(--pc); box-shadow: 0 0 6px var(--pc); flex-shrink: 0; }
        #contentFraud .fl-name { color: #d8ffe3; font-size: .88rem; }
        #contentFraud .fl-deal { padding: 6px 8px; border: 1px dashed var(--fp-line); background: #070b08; }
        #contentFraud .fl-deal.on { border: 1px solid rgba(255,46,77,.4); background: rgba(255,46,77,.04); }
        #contentFraud .fl-toggle { display: flex; align-items: center; gap: 8px; cursor: pointer; color: var(--fp-ink); font-size: .82rem; }
        #contentFraud .fl-deal.on .fl-toggle { color: var(--fp-red); margin-bottom: 8px; }
        #contentFraud .fl-toggle small { display: block; font-size: .64rem; color: var(--fp-dim); }
        #contentFraud .fl-fields { display: flex; flex-direction: column; gap: 6px; }
        #contentFraud .fl-row { display: flex; align-items: center; gap: 6px; }
        #contentFraud .fl-k { color: var(--fp-dim); font-size: .72rem; width: 100px; flex-shrink: 0; }
        #contentFraud div > .fl-k { width: auto; display: block; }
        #contentFraud .fl-u { color: var(--fp-dim); font-size: .72rem; flex-shrink: 0; }
        #contentFraud .fl-in { flex: 1; min-width: 0; background: #020302 !important; color: var(--fp-ink) !important; border: 1px solid var(--fp-line) !important; border-radius: 0 !important; box-shadow: none !important; }
        #contentFraud .fl-in:focus { border-color: var(--fp-ink) !important; outline: none; }
        #contentFraud .fl-in:disabled { opacity: .45; }
        #contentFraud .fl-in option { background: #020302; color: var(--fp-ink); }
        #contentFraud .fl-in option:checked { background: var(--fp-red); color: #fff; }
        #contentFraud .fl-multi { width: 100%; box-sizing: border-box; height: 96px; margin-top: 4px; }
        #contentFraud .fl-manual { display: flex; align-items: center; gap: 3px; color: var(--fp-dim); font-size: .68rem; flex-shrink: 0; cursor: pointer; white-space: nowrap; }
        #contentFraud .fl-note { color: var(--fp-dim); font-size: .66rem; margin-left: 106px; }
        #contentFraud .fl-fine { color: #7a3a44; font-size: .66rem; line-height: 1.5; border-top: 1px dashed var(--fp-line); padding-top: 6px; }
        #contentFraud .fl-empty { color: var(--fp-dim); font-size: .76rem; }
        #contentFraud input[type=checkbox] { accent-color: var(--fp-red); }
        #contentFraud input[type=checkbox]:not(:checked) { background-color: #020302 !important; border-color: var(--fp-dim) !important; }
        /* 부정선거 탭에서는 국기를 내린다 — 음지에서 국가의 얼굴은 보이지 않게 */
        .controls:has(#mainContentVote.active #contentFraud.active) #nationFlagBanner { display: none !important; }
        #dispPanelFraud { --fp-bg: #050706; --fp-ink: #8dffb0; --fp-dim: #3e6b4c; --fp-line: #12301c; --fp-red: #ff2e4d; --fp-amber: #ffb02e; }
        .fp, .fp * { font-family: 'NeoDunggeunmo', 'VT323', Consolas, monospace !important; }
        .fp { background: var(--fp-bg); color: var(--fp-ink); padding: 0 0 14px; min-height: 100%; position: relative; overflow: hidden;
            border: 1px solid var(--fp-line); box-shadow: inset 0 0 60px rgba(0,0,0,.9); }
        .fp::before { content: ''; position: absolute; inset: 0; pointer-events: none; z-index: 2;
            background: repeating-linear-gradient(0deg, rgba(0,0,0,.35) 0 1px, transparent 1px 3px), radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,.65)); }
        .fp > * { position: relative; z-index: 1; }
        .fp-bar { display: flex; align-items: center; gap: 8px; padding: 6px 10px; background: #0a0d0b; border-bottom: 1px solid var(--fp-line); font-size: .72rem; color: var(--fp-dim); }
        .fp-url { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #6fbf86; }
        .fp-sec { white-space: nowrap; }
        .fp-hero { text-align: center; padding: 18px 12px 10px; border-bottom: 1px dashed var(--fp-line); }
        .fp-logo { position: relative; z-index: 0; display: inline-block; font-size: 1.9rem; letter-spacing: 6px; color: #d8ffe3; text-shadow: 0 0 8px rgba(141,255,176,.55); }
        /* 색수차 — 빨강은 왼쪽 위, 파랑은 오른쪽 아래로 글자 전체를 비껴서 글자 뒤에 깐다. 가끔 가로로 찢어지는 글리치 */
        .fp-logo::before, .fp-logo::after { content: attr(data-text); position: absolute; left: 0; top: 0; width: 100%; z-index: -1; text-shadow: none; mix-blend-mode: screen; }
        .fp-logo::before { color: var(--fp-red); transform: translate(-2px, -2px); animation: fp-glitch-r 3.2s infinite steps(1); }
        .fp-logo::after { color: #39f; transform: translate(2px, 2px); animation: fp-glitch-b 2.7s infinite steps(1); }
        @keyframes fp-glitch-r { 0%, 88%, 100% { transform: translate(-2px, -2px); clip-path: none; } 90% { transform: translate(-6px, -2px); clip-path: inset(15% 0 55% 0); } 93% { transform: translate(-1px, -3px); clip-path: inset(60% 0 8% 0); } 96% { transform: translate(-4px, -1px); clip-path: none; } }
        @keyframes fp-glitch-b { 0%, 86%, 100% { transform: translate(2px, 2px); clip-path: none; } 89% { transform: translate(6px, 2px); clip-path: inset(50% 0 20% 0); } 92% { transform: translate(1px, 3px); clip-path: inset(5% 0 65% 0); } 95% { transform: translate(4px, 1px); clip-path: none; } }
        @media (prefers-reduced-motion: reduce) { .fp-logo::before, .fp-logo::after, .fp-cursor { animation: none; } }
        .fp-sub { font-size: .78rem; color: #6fbf86; margin-top: 6px; letter-spacing: 1px; }
        .fp-warn { display: inline-block; margin-top: 10px; font-size: .7rem; color: var(--fp-red); border: 1px solid rgba(255,46,77,.45); padding: 3px 8px; background: rgba(255,46,77,.06); }
        .fp-sec-h { padding: 12px 12px 6px; font-size: .78rem; color: var(--fp-dim); letter-spacing: 2px; }
        .fp-sec-h b { color: var(--fp-ink); }
        .fp-op { margin: 0 12px 8px; border: 1px solid var(--fp-line); border-left: 3px solid var(--fp-red); background: rgba(10,20,13,.8); padding: 8px 10px; }
        .fp-op-head { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; font-size: .82rem; }
        .fp-code { color: var(--fp-amber); font-size: .72rem; }
        .fp-dot { width: 9px; height: 9px; border-radius: 50%; background: var(--pc); box-shadow: 0 0 6px var(--pc); display: inline-block; }
        .fp-tag { font-size: .66rem; border: 1px solid var(--fp-dim); color: var(--fp-dim); padding: 0 5px; }
        .fp-status { margin-left: auto; font-size: .68rem; color: var(--fp-amber); animation: fp-blink 1.6s infinite steps(1); }
        @keyframes fp-blink { 50% { opacity: .35; } }
        .fp-op-body { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; margin-top: 8px; }
        .fp-op-body > div { display: flex; flex-direction: column; gap: 2px; }
        .fp-k { font-size: .64rem; color: var(--fp-dim); }
        .fp-v { font-size: .9rem; color: #d8ffe3; }
        .fp-risk.hi .fp-v { color: var(--fp-amber); } .fp-risk.crit .fp-v { color: var(--fp-red); }
        .fp-meter { display: block; height: 4px; background: #0e1a12; margin-top: 3px; }
        .fp-meter span { display: block; height: 100%; background: linear-gradient(90deg, #2fd56b, var(--fp-amber) 55%, var(--fp-red)); }
        .fp-dist { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px; }
        .fp-dist span { font-size: .66rem; color: #9fd3ad; border: 1px dashed var(--fp-line); padding: 1px 5px; }
        .fp-empty { margin: 0 12px 8px; font-size: .78rem; color: var(--fp-dim); }
        .fp-cursor { animation: fp-blink 1s infinite steps(1); color: var(--fp-ink); }
        .fp-map { margin: 0 12px; }
        .fp-map-in { border: 1px solid var(--fp-line); background: #020302; filter: saturate(.8); }
        .fp-map-in svg { max-height: 420px; }
        .fp-map-in svg path { stroke: #12301c !important; }
        .fp-map-in [class*="zoom"] { background: #0a0d0b !important; border-color: var(--fp-line) !important; color: var(--fp-ink) !important; box-shadow: none !important; }
        .fp-map-in [class*="zoom"] button { background: transparent !important; color: var(--fp-ink) !important; }
        .fp-ledger { margin: 0 12px; display: flex; flex-direction: column; gap: 4px; }
        .fp-led { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; font-size: .72rem; padding: 4px 6px; border-left: 2px solid #2fd56b; background: rgba(10,20,13,.6); }
        .fp-led.bad { border-left-color: var(--fp-red); }
        .fp-led-st { min-width: 4.5em; color: #2fd56b; } .fp-led.bad .fp-led-st { color: var(--fp-red); }
        .fp-led-name { color: #d8ffe3; } .fp-led-meta { color: var(--fp-dim); font-size: .66rem; }
        .fp-foot { margin: 14px 12px 0; font-size: .62rem; color: #2a4a35; text-align: center; letter-spacing: 1px; }

        /* ===== 라이트 · 다크(모던) 테마 — CRT 효과 없이 깔끔한 블랙마켓 장터 ===== */
        .fp-m { display: none; }
        .fp-logo em { font-style: normal; }
        html[data-theme-family="modern"] #dispPanelFraud,
        html[data-theme-family="modern"] #contentFraud { --fp-bg: #111113; --fp-card: #19191c; --fp-ink: #ececee; --fp-dim: #8b8b93; --fp-line: #2a2a2f; --fp-red: #ef4444; --fp-amber: #f5a524; }
        html[data-theme-family="modern"] #dispPanelFraud.active { background: var(--fp-bg); }
        html[data-theme-family="modern"] .fp, html[data-theme-family="modern"] .fp *,
        html[data-theme-family="modern"] #contentFraud, html[data-theme-family="modern"] #contentFraud * { font-family: var(--m-font, 'Pretendard Variable', system-ui, sans-serif) !important; }
        html[data-theme-family="modern"] .fp { border: none; box-shadow: none; padding-bottom: 20px; }
        html[data-theme-family="modern"] .fp::before, html[data-theme-family="modern"] #contentFraud::before { display: none; }
        html[data-theme-family="modern"] .fp-m { display: flex; }
        html[data-theme-family="modern"] .fp-br { display: none; }
        html[data-theme-family="modern"] .fp-bar { background: #0b0b0d; color: var(--fp-dim); font-size: .74rem; padding: 8px 14px; }
        html[data-theme-family="modern"] .fp-url { color: #b5b5bc; background: #1c1c20; border-radius: 999px; padding: 3px 12px; }
        html[data-theme-family="modern"] .fp-hero { text-align: left; padding: 22px 16px 14px; border-bottom: 1px solid var(--fp-line); }
        html[data-theme-family="modern"] .fp-logo { font-size: 1.7rem; font-weight: 900; letter-spacing: -1px; color: #fff; text-shadow: none; }
        html[data-theme-family="modern"] .fp-logo em { color: var(--fp-red); }
        html[data-theme-family="modern"] .fp-logo::before, html[data-theme-family="modern"] .fp-logo::after { display: none; }
        html[data-theme-family="modern"] .fp-sub { color: var(--fp-dim); letter-spacing: 0; font-size: .8rem; margin-top: 4px; }
        html[data-theme-family="modern"] .fp-warn { border: none; border-radius: 6px; background: rgba(239,68,68,.12); color: #fca5a5; font-size: .72rem; padding: 4px 10px; }
        html[data-theme-family="modern"] .fp-cats { gap: 6px; margin-top: 14px; flex-wrap: wrap; }
        html[data-theme-family="modern"] .fp-cats span { font-size: .74rem; color: var(--fp-dim); background: var(--fp-card); border: 1px solid var(--fp-line); border-radius: 999px; padding: 4px 11px; font-weight: 600; }
        html[data-theme-family="modern"] .fp-cats span.on { color: #111; background: var(--fp-amber); border-color: var(--fp-amber); }
        html[data-theme-family="modern"] .fp-sec-h { color: var(--fp-ink); font-weight: 800; font-size: .9rem; letter-spacing: -.2px; padding: 18px 16px 8px; }
        html[data-theme-family="modern"] .fp-sec-h b { color: var(--fp-amber); }
        html[data-theme-family="modern"] .fp-op { margin: 0 16px 10px; border: 1px solid var(--fp-line); border-left: 1px solid var(--fp-line); border-radius: 12px; background: var(--fp-card); padding: 12px 14px; }
        html[data-theme-family="modern"] .fp-op-head { font-size: .9rem; font-weight: 700; }
        html[data-theme-family="modern"] .fp-code { color: var(--fp-dim); font-weight: 600; }
        html[data-theme-family="modern"] .fp-dot { box-shadow: none; }
        html[data-theme-family="modern"] .fp-tag { border: none; border-radius: 6px; background: #26262b; color: #c4c4cc; padding: 1px 7px; font-weight: 600; }
        html[data-theme-family="modern"] .fp-status { animation: none; color: var(--fp-amber); background: rgba(245,165,36,.12); border-radius: 999px; padding: 2px 9px; font-weight: 600; }
        html[data-theme-family="modern"] .fp-op-body { margin-top: 12px; gap: 10px; }
        html[data-theme-family="modern"] .fp-op-body > div { background: #141417; border-radius: 8px; padding: 8px 10px; }
        html[data-theme-family="modern"] .fp-k { font-size: .68rem; font-weight: 600; }
        html[data-theme-family="modern"] .fp-v { font-size: 1.05rem; font-weight: 800; color: #fff; }
        html[data-theme-family="modern"] .fp-meter { height: 5px; border-radius: 3px; background: #26262b; margin-top: 6px; overflow: hidden; }
        html[data-theme-family="modern"] .fp-meter span { border-radius: 3px; background: linear-gradient(90deg, #22c55e, var(--fp-amber) 55%, var(--fp-red)); }
        html[data-theme-family="modern"] .fp-escrow { justify-content: space-between; gap: 8px; flex-wrap: wrap; margin-top: 10px; font-size: .7rem; color: var(--fp-dim); }
        html[data-theme-family="modern"] .fp-escrow span:first-child { color: #86efac; font-weight: 600; }
        html[data-theme-family="modern"] .fp-dist span { border: none; border-radius: 6px; background: #26262b; color: #c4c4cc; padding: 2px 8px; }
        html[data-theme-family="modern"] .fp-empty { margin: 0 16px 8px; color: var(--fp-dim); font-size: .8rem; }
        html[data-theme-family="modern"] .fp-cursor { display: none; }
        html[data-theme-family="modern"] .fp-map { margin: 0 16px; }
        html[data-theme-family="modern"] .fp-map-in { border-radius: 12px; overflow: hidden; background: #0c0c0e; border-color: var(--fp-line); filter: none; }
        html[data-theme-family="modern"] .fp-map-in svg path { stroke: #2a2a2f !important; }
        html[data-theme-family="modern"] .fp-ledger { margin: 0 16px; gap: 6px; }
        html[data-theme-family="modern"] .fp-led { border-left: none; border-radius: 10px; background: var(--fp-card); border: 1px solid var(--fp-line); padding: 8px 12px; font-size: .78rem; }
        html[data-theme-family="modern"] .fp-led-st { min-width: auto; border-radius: 999px; padding: 1px 8px; font-weight: 700; font-size: .68rem; color: #86efac; background: rgba(34,197,94,.12); }
        html[data-theme-family="modern"] .fp-led.bad .fp-led-st { color: #fca5a5; background: rgba(239,68,68,.14); }
        html[data-theme-family="modern"] .fp-led-name { font-weight: 700; color: #fff; }
        html[data-theme-family="modern"] .fp-foot { color: #55555c; letter-spacing: 0; margin-top: 18px; }
        /* 왼쪽 탭 */
        html[data-theme-family="modern"] #contentFraud { background: var(--fp-bg); color: var(--fp-ink); border: none; border-radius: 12px; box-shadow: none; padding: 14px; }
        html[data-theme-family="modern"] #contentFraud .fl-intro { color: var(--fp-dim); border-bottom: 1px solid var(--fp-line); font-size: .76rem; }
        html[data-theme-family="modern"] #contentFraud .fl-intro-h { color: #fff; font-weight: 900; letter-spacing: -.3px; text-shadow: none; font-size: .95rem; }
        html[data-theme-family="modern"] #contentFraud .fl-cursor { display: none; }
        html[data-theme-family="modern"] #contentFraud .fl-card { background: var(--fp-card); border: 1px solid var(--fp-line); border-radius: 12px; padding: 10px 12px; }
        html[data-theme-family="modern"] #contentFraud .fl-card:has(.fl-deal.on) { border-color: rgba(239,68,68,.55); }
        html[data-theme-family="modern"] #contentFraud .fl-dot { box-shadow: none; }
        html[data-theme-family="modern"] #contentFraud .fl-name { color: #fff; font-weight: 700; }
        html[data-theme-family="modern"] #contentFraud .fl-deal { border: none; border-radius: 8px; background: #141417; }
        html[data-theme-family="modern"] #contentFraud .fl-deal.on { border: none; background: rgba(239,68,68,.07); }
        html[data-theme-family="modern"] #contentFraud .fl-toggle, html[data-theme-family="modern"] #contentFraud .fl-toggle span { color: var(--fp-ink) !important; font-weight: 600; }
        html[data-theme-family="modern"] #contentFraud .fl-deal.on .fl-toggle, html[data-theme-family="modern"] #contentFraud .fl-deal.on .fl-toggle span { color: #fca5a5 !important; }
        html[data-theme-family="modern"] #contentFraud .fl-toggle small { color: var(--fp-dim) !important; font-weight: 500; }
        html[data-theme-family="modern"] #contentFraud .fl-manual { color: var(--fp-dim) !important; }
        html[data-theme-family="modern"] #contentFraud .fl-k { font-weight: 600; }
        html[data-theme-family="modern"] #contentFraud .fl-in { background: #0c0c0e !important; color: var(--fp-ink) !important; border-color: var(--fp-line) !important; border-radius: 8px !important; }
        html[data-theme-family="modern"] #contentFraud .fl-in:focus { border-color: var(--fp-amber) !important; }
        html[data-theme-family="modern"] #contentFraud .fl-in option { background: #0c0c0e; color: var(--fp-ink); }
        html[data-theme-family="modern"] #contentFraud .fl-in option:checked { background: var(--fp-red); }
        html[data-theme-family="modern"] #contentFraud .fl-fine { color: #a1a1aa; border-top: 1px solid var(--fp-line); }
        html[data-theme-family="modern"] #contentFraud input[type=checkbox]:not(:checked) { background-color: #0c0c0e !important; border-color: #3f3f46 !important; }
    `;
    document.head.appendChild(style);
})();
