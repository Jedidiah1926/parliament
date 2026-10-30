// ===== 1.6.9 — 정치: 후보 선출 방법 · 공동교섭단체 · 정권 상태에 따른 부정선거 =====
// 1.6.9 미리보기(예전 teaser69pol)에서 본 게임으로 옮겨 왔다 — 로고 제작 화면만 빼고 돈다.
// main.html은 경제(js/economycharts.js · js/economy.js) 다음에 이 파일을 읽는다.
//
//   - 후보 선출 방법 더하기 — 후보 단일화(선거 › 후보)와 지방선거 연대(선거 › 지방선거)가 함께 쓰는 방식 목록(js/main.js의 HemiCandMethods)에:
//       동일 후보수 분배(참여 정당이 같은 수씩 나눠 맡음) · 의석수 비례 분배(지금 의석 비율대로) · 현직 우선(그 지역구를 가진 정당이 다시) · 추첨
//     (지지율 1위 · 지지율 비례 분배 · 예비선거는 본 게임에 이미 있음)
//   - 공동교섭단체 — 의회 › 집권과 연정 아래에서 교섭단체 기준(위키 틀과 같은 값)에 못 미치는 정당들이 함께 교섭단체를 이룬다.
//     기준을 넘기면 성립, 위키 틀에서 비교섭단체 대신 그 정당들로 보이고 "…이라는 공동교섭단체로 활동함" 각주가 붙는다
/* global parties, seatKeyFor, chamberList, chamberDisplayName, districtEffectiveBreakdown, president, pm, electionKind,
   getAppState, setAppState, escapeHtmlText, IND_IDEOLOGY_ID */
(function () {
    'use strict';
    const root = document.documentElement;
    if (root.getAttribute('data-app-mode') === 'logo') return;
    const H = window.HemiCandMethods;
    const esc = s => (typeof escapeHtmlText === 'function' ? escapeHtmlText(String(s ?? '')) : String(s ?? ''));
    const partyById = id => parties.find(p => String(p.id) === String(id)) || null;
    const seatsIn = (p, ch) => Number(p?.[seatKeyFor(ch || 'house')]) || 0;

    // ================= 후보 선출 방법 =================
    if (H) {
        // 그 지역구(들)를 지금 가진 참여 정당 — 지난 선거 당선 의석이 가장 많은 쪽
        const holderOf = (members, ch, keys) => {
            let br = null;
            try { br = districtEffectiveBreakdown(ch || 'house') || {}; } catch (e) { br = {}; }
            let best = null, bestN = 0;
            members.forEach(p => {
                const n = (keys || []).reduce((a, k) => a + (Number(br[k]?.[p.id]) || 0), 0);
                if (n > bestN) { best = p; bestN = n; }
            });
            return best;
        };
        H.add({ id: 'equal', label: '동일 후보수 분배', kind: 'split', weights: members => members.map(() => 1),
            hint: '총선 지역구를 참여 정당이 같은 수씩 나눠 맡습니다 (각자 상대적으로 강한 지역구부터). 대선 · 총리 선거는 같은 확률로 추첨해요.',
            localHint: '권역 · 지역구를 참여 정당이 같은 수씩 나눠 맡아요 (각자 상대적으로 강한 곳부터).' });
        H.add({ id: 'seats', label: '의석수 비례 분배', kind: 'split', weights: (members, ch) => members.map(p => seatsIn(p, ch)),
            hint: '총선 지역구를 참여 정당의 지금 의석 비율대로 나눠 맡습니다 (각자 상대적으로 강한 지역구부터). 대선 · 총리 선거는 의석 비례 추첨으로 정해요.',
            localHint: '권역 · 지역구를 참여 정당의 지금 의석 비율대로 나눠 맡아요 (각자 상대적으로 강한 곳부터).' });
        H.add({ id: 'incumbent', label: '현직 우선', kind: 'pick',
            pick: (members, scoreOf, ctx) => holderOf(members, ctx.chamber, ctx.keys || (ctx.key != null ? [ctx.key] : [])),
            pickPres: members => {
                const holder = (typeof electionKind !== 'undefined' && electionKind === 'pm') ? pm : president;
                return members.find(p => holder && String(p.id) === String(holder.partyId)) || null;
            },
            hint: '지역구마다 지금 그 지역구를 가진(지난 선거 당선) 참여 정당이 다시 나섭니다. 현직이 없으면 지지율 1위. 대선 · 총리 선거는 현직 대통령 · 총리의 정당이 참여했으면 그 정당이에요.',
            localHint: '권역 · 지역구마다 그곳 지역구 의석을 가장 많이 가진 참여 정당이 나서요. 없으면 지지율 1위.' });
        H.add({ id: 'lottery', label: '추첨', kind: 'pick',
            pick: members => members[Math.floor(Math.random() * members.length)] || null,
            pickPres: members => members[Math.floor(Math.random() * members.length)] || null,
            hint: '지역구마다 참여 정당 중 한 곳을 같은 확률로 추첨합니다. 대선 · 총리 선거도 추첨이에요.',
            localHint: '권역 · 지역구마다 참여 정당 중 한 곳을 같은 확률로 추첨해요.' });
    }

    // ================= 공동교섭단체 =================
    // groups = [{ id, name, partyIds:[pid], chamber }] — 교섭단체 기준은 위키 틀의 "교섭단체 기준"(window.T65.wiki.groupMin)과 같은 값
    let groups = [];
    const DEFAULT_MIN = 20;
    const minSeats = () => Math.max(0, Number(window.T65?.wiki?.groupMin) || 0);
    const isInd = p => p && typeof IND_IDEOLOGY_ID !== 'undefined' && p.ideologyId === IND_IDEOLOGY_ID;
    const clean = list => (Array.isArray(list) ? list : []).filter(g => g && g.id).map(g => ({
        id: String(g.id), name: String(g.name || '').slice(0, 40), partyIds: (Array.isArray(g.partyIds) ? g.partyIds : []).map(String),
        chamber: ['house', 'senate', 'third'].includes(g.chamber) ? g.chamber : 'house',
    }));
    const membersOf = g => g.partyIds.map(partyById).filter(p => p && p.status !== 'banned' && p.status !== 'dissolved');
    const groupName = g => g.name.trim() || membersOf(g).map(p => p.name).join(' · ') || '공동교섭단체';
    const groupSeats = (g, ch) => membersOf(g).reduce((a, p) => a + seatsIn(p, ch || g.chamber), 0);
    const isValid = (g, ch) => membersOf(g).length >= 2 && (ch || g.chamber) === g.chamber && groupSeats(g, ch) >= Math.max(1, minSeats());
    window.HemiJointGroups = {
        // 기준을 넘긴 공동교섭단체 — 위키 틀(js/history.js)이 쓴다
        validGroups: ch => groups.filter(g => isValid(g, ch)).map(g => ({ id: g.id, name: groupName(g), parties: membersOf(g), seats: groupSeats(g, ch) })),
        groupOf: (pid, ch) => { const g = groups.find(x => isValid(x, ch) && x.partyIds.includes(String(pid))); return g ? { id: g.id, name: groupName(g) } : null; },
        get groups() { return groups; },
    };

    const origGet = window.getAppState;
    window.getAppState = function () {
        const st = origGet.apply(this, arguments);
        if (st && typeof st === 'object') st.jointGroups = { groups: groups.map(g => ({ ...g, partyIds: g.partyIds.slice() })) };
        return st;
    };
    const origSet = window.setAppState;
    window.setAppState = function (state) {
        const r = origSet.apply(this, arguments);
        groups = clean(state && state.jointGroups && state.jointGroups.groups);
        render();
        return r;
    };

    function el(html) { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }
    function host() {
        let box = document.getElementById('t69JointGroups');
        const parent = document.getElementById('contentCoalition');
        if (!box && parent) { box = el('<div id="t69JointGroups" class="jg-box"></div>'); parent.appendChild(box); }
        return box;
    }
    function render() {
        const box = host();
        if (!box) return;
        const chs = typeof chamberList === 'function' ? chamberList() : ['house'];
        const min = minSeats();
        const chName = ch => (typeof chamberDisplayName === 'function' ? chamberDisplayName(ch) : ch);
        const used = (g, pid) => groups.some(x => x !== g && x.chamber === g.chamber && x.partyIds.includes(String(pid)));
        // 교섭단체 현황 (첫 번째 원 — 양원이면 하원)
        const ch0 = chs[0] || 'house';
        const live = parties.filter(p => seatsIn(p, ch0) > 0 && p.status !== 'dissolved' && !isInd(p));
        const inValid = new Set(groups.filter(g => isValid(g, ch0)).flatMap(g => g.partyIds));
        const solo = min > 0 ? live.filter(p => seatsIn(p, ch0) >= min && !inValid.has(String(p.id))) : live.filter(p => !inValid.has(String(p.id)));
        const minor = min > 0 ? live.filter(p => seatsIn(p, ch0) < min && !inValid.has(String(p.id))) : [];
        const dot = c => `<span class="jg-dot" style="background:${esc(c)}"></span>`;
        box.innerHTML = `
            <div class="jg-head"><span>🤝 공동교섭단체</span></div>
            <div class="jg-dim">교섭단체 기준에 못 미치는 정당들이 함께 교섭단체를 이룹니다. 합쳐서 기준을 넘기면 성립하고, 위키 틀에서 비교섭단체 대신 그 정당들로 보이며 각주가 붙어요.</div>
            <div class="jg-row"><span class="jg-dim">교섭단체 기준</span><input type="number" min="0" class="jg-num" data-act="min" value="${min}"><span class="jg-dim">석 ${min ? '' : '— 0이면 기준 없음 (위키 틀과 같은 값)'}</span>
                ${min ? '' : `<button type="button" class="jg-btn" data-act="min20">${DEFAULT_MIN}석으로</button>`}</div>
            ${groups.map(g => {
                const ms = membersOf(g), seats = groupSeats(g), ok = isValid(g);
                const cand = parties.filter(p => seatsIn(p, g.chamber) > 0 && p.status !== 'dissolved' && p.status !== 'banned');
                return `<div class="jg-card${ok ? ' jg-ok' : ''}" data-id="${esc(g.id)}">
                    <div class="jg-row"><input type="text" data-f="name" value="${esc(g.name)}" maxlength="40" placeholder="교섭단체 이름 (비우면 정당 이름을 이어서)">
                        ${chs.length > 1 ? `<select data-f="chamber">${chs.map(c => `<option value="${c}" ${c === g.chamber ? 'selected' : ''}>${esc(chName(c))}</option>`).join('')}</select>` : ''}
                        <button type="button" class="jg-btn" data-act="del" title="공동교섭단체 해산">✕</button></div>
                    <div class="jg-parties">${cand.map(p => `<label class="jg-party${used(g, p.id) ? ' jg-off' : ''}"><input type="checkbox" data-p="${esc(p.id)}" ${g.partyIds.includes(String(p.id)) ? 'checked' : ''} ${used(g, p.id) ? 'disabled' : ''}>${dot(p.color)}${esc(p.name)} <span class="jg-dim">${seatsIn(p, g.chamber)}석</span></label>`).join('') || '<span class="jg-dim">의석이 있는 정당이 없습니다</span>'}</div>
                    <div class="jg-status">${ms.length < 2 ? '정당을 두 곳 이상 고르세요.' : ok
                        ? `✔ 교섭단체 성립 — ${esc(groupName(g))} ${seats}석 (기준 ${Math.max(1, min)}석)`
                        : `✘ 기준 미달 — ${seats}석 / ${Math.max(1, min)}석`}</div>
                </div>`;
            }).join('')}
            <button type="button" class="jg-add" data-act="add">+ 공동교섭단체 구성</button>
            <div class="jg-sum">
                <div class="jg-sum-title">교섭단체 현황 — ${esc(chName(ch0))}</div>
                ${solo.map(p => `<div class="jg-line">${dot(p.color)}${esc(p.name)} <span class="jg-dim">${seatsIn(p, ch0)}석</span></div>`).join('')}
                ${groups.filter(g => isValid(g, ch0)).map(g => `<div class="jg-line">${membersOf(g).map(p => dot(p.color)).join('')}${esc(groupName(g))} <span class="jg-dim">공동교섭단체 · ${groupSeats(g, ch0)}석</span></div>`).join('')}
                ${minor.length ? `<div class="jg-line jg-dim">비교섭단체: ${minor.map(p => `${esc(p.name)} ${seatsIn(p, ch0)}석`).join(', ')}</div>` : ''}
            </div>`;
        const minIn = box.querySelector('[data-act="min"]');
        const setMin = v => { if (window.T65 && window.T65.wiki) window.T65.wiki.groupMin = Math.max(0, Number(v) || 0); render(); };
        minIn.onchange = () => setMin(minIn.value);
        box.querySelector('[data-act="min20"]')?.addEventListener('click', () => setMin(DEFAULT_MIN));
        box.querySelector('[data-act="add"]').onclick = () => {
            groups.push({ id: 'jg' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), name: '', partyIds: [], chamber: chs[0] || 'house' });
            render();
        };
        box.querySelectorAll('.jg-card').forEach(card => {
            const g = groups.find(x => x.id === card.dataset.id);
            if (!g) return;
            card.querySelector('[data-act="del"]').onclick = () => { groups = groups.filter(x => x !== g); render(); };
            card.querySelector('[data-f="name"]').onchange = e => { g.name = e.target.value; render(); };
            const sel = card.querySelector('[data-f="chamber"]'); if (sel) sel.onchange = () => { g.chamber = sel.value; g.partyIds = []; render(); };
            card.querySelectorAll('[data-p]').forEach(c => { c.onchange = () => {
                const pid = String(c.dataset.p);
                g.partyIds = c.checked ? [...new Set([...g.partyIds, pid])] : g.partyIds.filter(x => x !== pid);
                render();
            }; });
        });
    }
    // 연정 화면을 다시 그릴 때 · 탭을 열 때 함께
    const origRC = window.renderCoalitions;
    if (typeof origRC === 'function') window.renderCoalitions = function () { const r = origRC.apply(this, arguments); render(); return r; };
    const origSwitch = window.switchSubTab;
    window.switchSubTab = function (main, sub) { const r = origSwitch.apply(this, arguments); if (main === 'setup' && sub === 'coalition') render(); return r; };

    const style = document.createElement('style');
    style.textContent = `
        .jg-box { margin-top: 14px; border-top: 1px dashed #333; padding-top: 10px; }
        .jg-head { display: flex; align-items: center; gap: 8px; color: var(--tno-neon); font-size: .95rem; margin-bottom: 4px; }
        .jg-badge { font-size: .65rem; padding: 1px 6px; border: 1px solid currentColor; opacity: .7; }
        .jg-dim { color: #777; font-size: .76rem; line-height: 1.5; }
        .jg-row { display: flex; align-items: center; gap: 6px; margin: 6px 0; flex-wrap: wrap; }
        .jg-row { flex-wrap: nowrap; }
        .jg-row input[type=text] { flex: 1 1 auto; min-width: 0; width: auto !important; }
        .jg-row select { flex: 0 0 auto; width: auto !important; max-width: 40%; }
        .jg-row .jg-btn { flex: 0 0 auto; }
        .jg-num { flex: 0 0 auto; width: 5em !important; }
        .jg-card { border: 1px solid #333; padding: 8px; margin: 8px 0; border-left: 3px solid #555; }
        .jg-card.jg-ok { border-left-color: #3fbf7f; }
        .jg-parties { display: flex; flex-wrap: wrap; gap: 4px 12px; font-size: .82rem; margin: 6px 0; }
        .jg-party { display: inline-flex; align-items: center; gap: 4px; cursor: pointer; }
        .jg-party.jg-off { opacity: .4; cursor: not-allowed; }
        .jg-dot { display: inline-block; width: 9px; height: 9px; border-radius: 50%; margin-right: 3px; }
        .jg-status { font-size: .8rem; color: #aaa; }
        .jg-ok .jg-status { color: #3fbf7f; }
        .jg-btn, .jg-add { cursor: pointer; font-family: inherit; background: transparent; border: 1px solid #555; color: #ccc; padding: 4px 10px; font-size: .78rem; }
        .jg-add { width: 100%; margin: 4px 0 8px; }
        .jg-sum { border: 1px solid #2a2a2a; padding: 8px; background: rgba(255,255,255,.02); }
        .jg-sum-title { font-size: .82rem; color: #aaa; margin-bottom: 4px; }
        .jg-line { font-size: .8rem; color: #ccc; padding: 2px 0; }
        html[data-theme-family="modern"] .jg-box { border-top-color: var(--m-border); }
        html[data-theme-family="modern"] .jg-head { color: var(--m-text); font-weight: 600; }
        html[data-theme-family="modern"] .jg-dim { color: var(--m-text-3); }
        html[data-theme-family="modern"] .jg-card { border: 1px solid var(--m-border); border-left: 3px solid var(--m-border-strong); border-radius: 10px; background: var(--m-surface-2); }
        html[data-theme-family="modern"] .jg-card.jg-ok { border-left-color: #2e9e64; }
        html[data-theme-family="modern"] .jg-status, html[data-theme-family="modern"] .jg-line, html[data-theme-family="modern"] .jg-sum-title { color: var(--m-text-2); }
        html[data-theme-family="modern"] .jg-btn, html[data-theme-family="modern"] .jg-add { border: 1px solid var(--m-border-strong); border-radius: 8px; color: var(--m-text); }
        html[data-theme-family="modern"] .jg-sum { border: 1px solid var(--m-border); border-radius: 10px; background: var(--m-surface); }
    `;
    document.head.appendChild(style);
    window.addEventListener('load', () => setTimeout(render, 0));
})();

// ===== 1.6.9 — 정권 상태에 따른 부정선거 =====
// 발각 확률과 발각 뒤 조치가 정권 상태에 따라 달라진다 (js/main.js의 개표가 window.HemiFraudRegime을 부름):
//   일반(민주 · 입헌군주제) — 그대로 (발각되면 활동 금지)
//   계엄령 — 정부 · 여당 쪽 ×0.5, 발각돼도 금지 대신 지지율 20% 하락 / 야당 ×1.5, 발각되면 금지 + 지지율 절반
//   전제군주정 — 왕당파(군주를 지지하는 정당) ×0.3, 발각돼도 금지 대신 "왕실 스캔들"(왕당파 지지율 25% 하락 → 혁명 확률 상승) / 야당 ×1.5, 금지 + 지지율 절반
//   군정 — 선거는 원래 중단, "관제 선거"를 허용하면 치를 수 있음: 군부 쪽 정당 ×0.2, 발각돼도 금지 대신 지지율 15% 하락 / 야당 ×1.5, 강제 해산(금지) + 지지율 절반
/* global parties, coalitions, elecStore, emergencyPowers, chamberList, getAppState, setAppState, escapeHtmlText */
(function () {
    'use strict';
    const root = document.documentElement;
    if (root.getAttribute('data-app-mode') === 'logo') return;
    const esc = s => (typeof escapeHtmlText === 'function' ? escapeHtmlText(String(s ?? '')) : String(s ?? ''));
    let managed = false; // 군정 관제 선거 허용
    const isGov = p => !!p && (p.isRuling || (typeof coalitions !== 'undefined' && coalitions.some(c => c.isRuling && (c.members || []).some(id => String(id) === String(p.id)))));
    function regime() {
        if (window.T62 && window.T62.junta) return 'junta';
        const m = window.T66 && window.T66.monarchy;
        if (m && m.kind === 'absolute') return 'absolute';
        if (typeof emergencyPowers !== 'undefined' && emergencyPowers?.martialLaw?.active) return 'martial';
        return 'normal';
    }
    // 정권 쪽 정당인가
    function onSide(p, r) {
        if (!p) return false;
        if (r === 'absolute') {
            const m = window.T66.monarchy;
            const c = (window.T66.dynasties || []).flatMap(d => d.claimants || []).find(x => String(x.id) === String(m.claimantId));
            return (c && (c.partyIds || []).some(id => String(id) === String(p.id))) || isGov(p);
        }
        if (r === 'junta') return (window.T62.military || []).some(m => String(m.partyId) === String(p.id)) || isGov(p);
        if (r === 'martial') return isGov(p);
        return false;
    }
    const RULES = {
        normal: null,
        martial: { name: '계엄령', side: 0.5, opp: 1.5, sideCut: 0.8, sideText: '활동 금지 대신 부정선거 규탄 여론 — 지지율 20% 하락', sideLabel: '정부 · 여당' },
        absolute: { name: '전제군주정', side: 0.3, opp: 1.5, sideCut: 0.75, sideText: '활동 금지 대신 왕실 스캔들 — 지지율 25% 하락 (혁명 확률 상승)', sideLabel: '왕당파' },
        junta: { name: '군정 (관제 선거)', side: 0.2, opp: 1.5, sideCut: 0.85, sideText: '활동 금지 대신 관제 선거 의혹 — 지지율 15% 하락', sideLabel: '군부 쪽 정당' },
    };
    const OPP_TEXT = { martial: '활동 금지 + 지지율 절반 (계엄 당국의 처벌)', absolute: '활동 금지 + 지지율 절반 (왕실의 처벌)', junta: '강제 해산(활동 금지) + 지지율 절반' };
    function cutSupport(pid, factor) {
        (typeof chamberList === 'function' ? chamberList() : ['house']).forEach(ch => {
            const st = elecStore?.[ch]?.[pid];
            if (st) st.prob = Math.round(Math.min(100, (Number(st.prob) || 0) * factor) * 10) / 10;
        });
    }
    window.HemiFraudRegime = {
        regime,
        catchChance(p, base) {
            const r = regime(), R = RULES[r];
            if (!R) return base;
            return Math.max(0, Math.min(100, Math.round(base * (onSide(p, r) ? R.side : R.opp))));
        },
        punish(p) {
            const r = regime(), R = RULES[r];
            if (!R) return { ban: true, text: '활동 금지' };
            if (onSide(p, r)) { cutSupport(p.id, R.sideCut); return { ban: false, text: R.sideText }; }
            cutSupport(p.id, 0.5);
            return { ban: true, text: OPP_TEXT[r] };
        },
        managedElections: () => managed && !!(window.T62 && window.T62.junta),
        get managed() { return managed; },
    };

    const origGet = window.getAppState;
    window.getAppState = function () {
        const st = origGet.apply(this, arguments);
        if (st && typeof st === 'object') st.fraudRegime = { managed };
        return st;
    };
    const origSet = window.setAppState;
    window.setAppState = function (state) {
        const r = origSet.apply(this, arguments);
        managed = !!(state && state.fraudRegime && state.fraudRegime.managed);
        return r;
    };

    function el(html) { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }
    // 선거 › ⚠ — 지금 정권 상태와 정당마다 실제 발각 확률
    function renderBanner() {
        const host = document.getElementById('contentFraud');
        if (!host) return;
        let box = document.getElementById('t69FraudRegime');
        if (!box) { box = el('<div id="t69FraudRegime" class="fr-box"></div>'); host.insertBefore(box, document.getElementById('fraudPartyList')); }
        const r = regime(), R = RULES[r];
        const tries = parties.filter(p => p.fraudAttempt);
        box.innerHTML = !R
            ? `<div class="fr-head">정권 상태: 일반</div><div class="fr-dim">발각 확률은 그대로, 발각되면 활동 금지. 계엄령 · 전제군주정 · 군정(관제 선거)에서는 정권 쪽 정당은 덜 발각되고 처벌도 가벼워요.</div>`
            : `<div class="fr-head">정권 상태: ${esc(R.name)}</div>
               <div class="fr-dim">${esc(R.sideLabel)} 발각 확률 ×${R.side} · 발각 시 ${esc(R.sideText)}<br>야당 발각 확률 ×${R.opp} · 발각 시 ${esc(OPP_TEXT[r])}</div>
               ${tries.length ? `<div class="fr-list">${tries.map(p => { const base = p.fraudAttempt.catchChance ?? 0, eff = window.HemiFraudRegime.catchChance(p, base); return `<div>${esc(p.name)} <span class="fr-dim">${onSide(p, r) ? esc(R.sideLabel) : '야당'}</span> — 실제 발각 확률 <b>${eff}%</b> <span class="fr-dim">(기본 ${base}%)</span></div>`; }).join('')}</div>` : ''}`;
    }
    const origRF = window.renderFraudTab;
    if (typeof origRF === 'function') window.renderFraudTab = function () { const res = origRF.apply(this, arguments); try { renderBanner(); } catch (e) { /* 화면 준비 전 */ } return res; };
    // 내각 › 쿠데타 — 군정이면 관제 선거 허용 스위치
    function renderJuntaToggle() {
        const host = document.getElementById('contentCoup');
        if (!host) return;
        let box = document.getElementById('t69Managed');
        if (!(window.T62 && window.T62.junta)) { if (box) box.remove(); return; }
        if (!box) { box = el('<div id="t69Managed" class="fr-box"></div>'); host.insertBefore(box, host.firstChild); }
        box.innerHTML = `<label class="fr-row"><input type="checkbox" ${managed ? 'checked' : ''}> 관제 선거 허용</label>
            <div class="fr-dim">켜면 군정 중에도 총선 · 대선 · 지방선거를 치릅니다. 군부 쪽 정당의 부정선거는 거의 들키지 않고(×0.2) 들켜도 지지율만 떨어지지만, 야당이 들키면 강제 해산돼요.</div>`;
        box.querySelector('input').onchange = e => { managed = e.target.checked; };
    }
    const origSwitch = window.switchSubTab;
    window.switchSubTab = function (main, sub) {
        const res = origSwitch.apply(this, arguments);
        if (main === 'cabinet' && sub === 'coup') renderJuntaToggle();
        return res;
    };
    // 쿠데타 화면이 다시 그려질 때(군정 시작 · 민정 이양 등)도
    const hookT62 = () => {
        if (!window.T62 || window.T62.__t69) return;
        const orig = window.T62.refresh;
        if (typeof orig === 'function') { window.T62.refresh = function () { const res = orig.apply(this, arguments); renderJuntaToggle(); return res; }; window.T62.__t69 = true; }
    };
    hookT62();
    // 쿠데타 화면은 coup.js 안에서 통째로 다시 그려지므로, 스위치가 사라지면 다시 넣는다
    const watchCoup = () => {
        const host = document.getElementById('contentCoup');
        if (!host || host.__t69obs) return;
        host.__t69obs = new MutationObserver(() => {
            const has = !!document.getElementById('t69Managed');
            if (has !== !!(window.T62 && window.T62.junta)) renderJuntaToggle();
        });
        host.__t69obs.observe(host, { childList: true });
    };
    watchCoup();
    window.addEventListener('load', () => { hookT62(); watchCoup(); setTimeout(renderJuntaToggle, 0); });

    const style = document.createElement('style');
    style.textContent = `
        .fr-box { border: 1px dashed #553; padding: 8px 10px; margin: 8px 0 10px; }
        .fr-head { font-size: .88rem; color: #e0b030; display: flex; align-items: center; gap: 8px; }
        .fr-badge { font-size: .62rem; padding: 1px 6px; border: 1px solid currentColor; opacity: .7; color: #aaa; }
        .fr-dim { color: #888; font-size: .76rem; line-height: 1.55; margin-top: 3px; }
        .fr-list { margin-top: 6px; font-size: .8rem; color: #ccc; }
        .fr-row { display: flex; align-items: center; gap: 6px; font-size: .86rem; cursor: pointer; }
        html[data-theme-family="modern"] .fr-box { border-color: var(--m-border-strong); border-radius: 10px; background: var(--m-surface-2); }
        html[data-theme-family="modern"] .fr-dim { color: var(--m-text-3); }
        html[data-theme-family="modern"] .fr-list, html[data-theme-family="modern"] .fr-row { color: var(--m-text); }
    `;
    document.head.appendChild(style);
})();
