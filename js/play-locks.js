// ===== 플레이 규칙 — 시나리오가 잠근 "직접 수정" 막기 (v1.7.1) =====
// 시나리오 제작자가 playRules.locks로 잠근 항목은 플레이어가 편집 화면에서 직접 고칠 수 없다. 이벤트 · 결정 · 방향성의 효과,
// 선거 실행 · 반영, 의회 표결, 왕실 · 쿠데타 · 혁명 같은 게임 진행으로는 그대로 바뀐다. 잠금 여부는 js/campaign.js의 lockReason.
//
// 어디서 막나
//   1) 편집 함수 경계 — 정당 · 의석 · 선거제도 · 정부 항목을 실제로 바꾸는 전역 함수(updateParty · setPartySeats · setGovType …)를 감싼다.
//      플레이어가 직접 조작한 호출(신뢰할 수 있는 사용자 입력 중, 게임 진행 화면 밖에서)만 막고, 세이브 불러오기 · 내부 정리 · 게임 진행은 통과시킨다.
//   2) 편집 칸 — 함수가 모듈 안에 있는 화면(경제 › 시나리오 · 이벤트 · 항목, 여론 › 국정 지지율)은 바꾸는 입력 칸을 꺼 둔다.
//   3) 실행 취소 / 다시 실행 — 잠긴 항목을 되돌리게 되는 실행 취소는 하지 않는다 (잠긴 항목을 건드리지 않는 실행 취소는 그대로).
// 막힌 조작은 상태를 바꾸지 않고 이유를 보여 준 뒤 화면을 다시 그려 입력 칸을 원래 값으로 돌린다. 세계지도 영토 · 경제권 잠금은 js/world-map.js.
/* global currentMainTab, currentSubTab, switchSubTab, refreshUI, showKbdToast, getAppState */
(function () {
    'use strict';

    const SEAT_FIELDS = new Set(['seatsHouse', 'seatsSenate', 'seatsThird', 'inHouse', 'inSenate', 'inThird']);
    // 잠금 항목 → 편집 함수 · 편집 화면(안내를 띄울 곳)
    const LOCKS = {
        parties: {
            tabs: ['contentParty', 'contentIdeology'],
            fns: ['addParty', 'removeParty', 'updateParty', 'duplicateParty', 'updatePartyStatus', 'updatePartyColorText', 'updatePartyColorPicker', 'openPartyMergeDialog', 'executePartyMerge',
                'mergePartiesInto', 'togglePartyMergeSource', 'togglePartyMergeFaction', 'addFaction', 'removeFaction', 'updateFaction', 'updateFactionById', 'updateFactionColorText', 'updateFactionColorPicker',
                'duplicateFaction', 'splitFaction', 'moveFactionsToParty', 'toggleFactionHome', 'setPartyFactionElection', 'addIdeology', 'removeIdeology', 'updateIdeology', 'addSubIdeology', 'removeSubIdeology',
                'updateSubIdeology', 'moveIdeology', 'moveSubIdeology', 'moveParty', 'moveFaction', 'updateLeaderField', 'designatePartyLeaderFromListSeat', 'designatePartyLeaderFromIndependent',
                'designatePartyLeaderFromDistrictSeat', 'autoSortParties', 'setIndependentEnabled', 'updateIndependent', 'addIndependentParty', 'addIndependentIdeology'],
        },
        seats: {
            tabs: ['contentSettings', 'contentMembers', 'contentList'],
            fns: ['setPartySeats', 'setAllPartyChambers', 'togglePartyParticipation', 'updateDistrictMember', 'updateDistrictMemberParty', 'updateListMember', 'updateListMemberParty', 'vacateSeat', 'fillVacantSeat',
                'addChamberDeputy', 'removeChamberDeputy', 'updateChamberDeputy', 'updateChamberLeader', 'setFloorLeader', 'pasteLeaderToSeat', 'pasteFloorLeaderToSeat', 'districtManualSetSeat', 'regionSetSeatResult', 'regionSetManualVote'],
        },
        elections: {
            tabs: ['contentElecSettings', 'contentTerritory', 'contentRegions'],
            fns: ['setElectionSystemField', 'setElectionKind', 'setPresElectionMode', 'setPresElectionChamberBasis', 'setPmDirectElectionEnabled', 'toggleSystem', 'regionAddRegion', 'regionUpdateField', 'regionSetChamber',
                'regionSetVoteMode', 'regionSetSeats', 'districtSetChamber', 'districtSetMode', 'districtSetName', 'districtSetNameByKey', 'districtSetMapShare', 'districtSetPopulation', 'districtClearAll', 'districtSvgSetSeats',
                'districtSvgSetName', 'districtSvgSetAbbr', 'districtSvgRemoveShape', 'districtSvgUpload', 'applyDistrictPreset', 'setDistrictNoise'],
        },
        government: {
            tabs: ['contentSystem', 'contentPresident', 'contentPm', 'contentCabinetmembers', 'contentCoalition'],
            fns: ['setGovType', 'setVetoHolder', 'setEmergencyHolder', 'toggleEmergencyActive', 'setRuling', 'setNoRuling', 'addCoalition', 'removeCoalition', 'updateCoalition', 'moveCoalition', 'toggleCoalitionMember',
                'toggleCoalitionExternalSupport', 'updateCoalitionColorText', 'updateCoalitionColorPicker', 'updateIndCoalitionMembership', 'updatePresidentField', 'updatePmField', 'updatePmNomineeField', 'updateChairField',
                'addCabinetMember', 'removeCabinetMember', 'updateCabinetMember', 'updateCabinetRoleLabel', 'addDeputyPm', 'removeDeputyPm', 'updateDeputyPm', 'linkPresidentToMember', 'linkPmToMember', 'linkPmNomineeToMember',
                'linkChairToMember', 'linkCabinetMemberToSeat', 'linkDeputyPmToSeat', 'unlinkPresident', 'unlinkPm', 'unlinkPmNominee', 'unlinkChair', 'unlinkCabinetMember', 'unlinkDeputyPm', 'appointSeatToPost',
                'unlinkPostFromSeat', 'setSplitDissolutionHolders', 'setConstructiveNoConfidence', 'setDissolutionScope', 'setMartialLawSuspendParliament', 'lockPmMajority', 'unlockPmMajority'],
        },
        opinion: {
            tabs: ['elecSubProb', 'elecSubTendency', 'elecSubApproval'],
            fns: ['elecSetProb', 'elecSetErr', 'tendencySetStrength', 'regionSetTendency', 'districtSvgSetTendency', 'regionClearDistrictTendencies', 'peopleSetCitizens'],
            // 국정 지지율 화면은 js/news.js 안의 처리 — 바꾸는 칸을 꺼 둔다
            controls: ['#elecSubApproval [data-appr] input', '#elecSubApproval [data-auto]', '#elecSubApproval [data-rule]', '#elecSubApproval [data-clear]'],
        },
        economy: {
            tabs: ['contentEcoScenario', 'contentEcoEvents', 'contentEcoItems'],
            fns: [],
            // 경제 › 시나리오 · 이벤트 · 항목 — 지표 흐름 · 경제 사건 · 항목을 직접 고치는 편집 화면. 통화 · 재정(정책)은 게임 진행이라 그대로
            controls: ['#contentEcoScenario :is(input,select,textarea,button):not(.sub-tab-btn)', '#contentEcoEvents :is(input,select,textarea,button):not(.sub-tab-btn)', '#contentEcoItems :is(input,select,textarea,button):not(.sub-tab-btn)'],
        },
    };
    // updateParty는 필드에 따라 정당(이름 · 색 …) 또는 의석(의석 수 · 원 참여) 항목
    const categoryOf = (cat, name, args) => (name === 'updateParty' && SEAT_FIELDS.has(String(args[1])) ? 'seats' : name === 'updateParty' && args[1] === 'isRuling' ? 'government' : cat);
    // 게임 진행 화면 — 여기서 일어난 조작이 편집 함수를 부르면(선거 반영 · 표결 · 왕실 전환 …) 막지 않는다
    const PLAY_SURFACES = ['#mainContentCampaign', '#contentDecisions', '.sm-overlay', '.cp-overlay', '.ca-overlay', '[data-campaign-next-turn]', '[data-campaign-toggle]', '[data-campaign-speed]',
        '#mainContentLaw', '#contentCouncil', '#contentSign', '#contentCouncilArchive', '#contentElecGeneral', '#contentElecPresidential', '#contentElecLocal', '#contentReferendum', '#contentFraud',
        '#contentRoyal', '#contentCoup', '#contentRevolution', '#contentSiege', '#contentEcoMonetary', '#contentEcoFiscal'].join(',');

    const reasonFor = name => { try { return (window.HemiCampaign && window.HemiCampaign.lockReason && window.HemiCampaign.lockReason(name)) || null; } catch (e) { return null; } };
    const anyLock = () => Object.keys(LOCKS).some(reasonFor);
    let bypass = 0; // 게임 진행 중(선거 반영 · 세이브 불러오기 · 효과 실행)에 부른 편집 함수는 통과
    function viaPlayer() {
        if (bypass) return false;
        const ev = window.event;
        if (!ev || !ev.isTrusted) return false; // 사용자 입력 중이 아니면(불러오기 · 타이머 · 내부 정리) 플레이어의 직접 수정이 아니다
        let t = ev.target;
        if (t && t.nodeType === 3) t = t.parentElement;
        return !(t && t.closest && t.closest(PLAY_SURFACES));
    }

    // 막았을 때 — 이유를 알리고(같은 말은 잠깐 한 번만), 화면을 다시 그려 입력 칸을 실제 값으로 돌린다
    let lastToast = '', lastToastAt = 0, redrawT = 0;
    function refuse(why) {
        const now = Date.now();
        if (why !== lastToast || now - lastToastAt > 2500) { lastToast = why; lastToastAt = now; try { if (typeof showKbdToast === 'function') showKbdToast('🔒 ' + why); } catch (e) { /* 알림 없음 */ } }
        clearTimeout(redrawT);
        redrawT = setTimeout(() => {
            try { refreshUI(); } catch (e) { /* 화면 없음 */ }
            try { const m = currentMainTab; if (m && currentSubTab[m]) switchSubTab(m, currentSubTab[m], false); } catch (e) { /* 화면 없음 */ }
            syncUi();
        }, 0);
    }
    // 편집 함수 감싸기
    const wrapped = [];
    Object.entries(LOCKS).forEach(([cat, def]) => def.fns.forEach(name => {
        const orig = window[name];
        if (typeof orig !== 'function') return;
        wrapped.push(name);
        window[name] = function () {
            const c = categoryOf(cat, name, arguments), why = reasonFor(c);
            if (why && viaPlayer()) { refuse(why); return undefined; }
            return orig.apply(this, arguments);
        };
    }));
    // 끌어서 순서 바꾸기 — 정당 · 이념 · 파벌 · 연정 목록 (손잡이를 누르는 순간 막는다)
    const DRAG_LISTS = [[/^(partyInfoList|ideologyList|factionList_)/, 'parties'], [/^coalitionList/, 'government'], [/^partyList(House|Senate|Third)/, 'seats']];
    document.addEventListener('pointerdown', e => {
        const handle = e.target && e.target.closest && e.target.closest('.drag-handle, .faction-drag-handle');
        if (!handle) return;
        const list = handle.closest('[id]');
        let host = list; while (host && !DRAG_LISTS.some(([re]) => re.test(host.id))) host = host.parentElement && host.parentElement.closest('[id]');
        if (!host) return;
        const cat = DRAG_LISTS.find(([re]) => re.test(host.id))[1], why = reasonFor(cat);
        if (why) { e.preventDefault(); e.stopImmediatePropagation(); refuse(why); }
    }, true);

    // 게임 진행 쪽 입구는 통과 구간으로
    const pass = obj => name => {
        const orig = obj && obj[name];
        if (typeof orig !== 'function') return;
        obj[name] = function () { bypass++; try { return orig.apply(this, arguments); } finally { bypass--; } };
    };
    ['elecApplyToParliament', 'elecRun', 'elecRerun', 'elecFinishNow', 'runPresidentialElection', 'runPmElection', 'applyPmElectionWinner', 'applyPresidentialWinner', 'applyStateSafely', 'applyStateFromScratch',
        'startFromPresetOnBoot', 'advanceNationDate', 'advanceNationSession', 'confirmChamberVote', 'finalizeChamberVote', 'signBill', 'vetoBill', 'resolveCabinetCouncilVote', 'simulate'].forEach(pass(window));
    if (window.HemiScriptMods) ['run', 'take', 'fire', 'checkEvents'].forEach(pass(window.HemiScriptMods));
    if (window.HemiCampaign) ['tick', 'nextTurn', 'startFocus', 'attach'].forEach(pass(window.HemiCampaign));

    // 실행 취소 / 다시 실행이 잠긴 항목을 되돌리지 않게 — 불러오기(setAppState)와 구분: 실행 취소 키 · 버튼 중에만 검사
    const isObj = x => !!x && typeof x === 'object' && !Array.isArray(x);
    const pick = (o, keys) => (isObj(o) ? Object.fromEntries(keys.filter(k => k in o).map(k => [k, o[k]])) : null);
    const SLICES = {
        parties: s => ({ ideologies: s.parliament && s.parliament.ideologies, parties: ((s.parliament && s.parliament.parties) || []).map(p => { const o = { ...p }; SEAT_FIELDS.forEach(k => delete o[k]); delete o.isRuling; return o; }), independents: s.parliament && s.parliament.independents }),
        seats: s => ({ seats: ((s.parliament && s.parliament.parties) || []).map(p => pick(p, ['id', ...SEAT_FIELDS])), listMembers: s.parliament && s.parliament.listMembers, district: s.election && s.election.district && s.election.district.members }),
        elections: s => ({ systemType: s.config && s.config.systemType, el: pick(s.election, ['presElectionMode', 'presElectionChamberBasis', 'electionKind', 'regionSystem']), district: s.election && s.election.district && { ...s.election.district, members: undefined } }),
        government: s => ({ cfg: pick(s.config, ['govType', 'vetoHolder', 'emergencyPowers', 'president', 'pm', 'deputyPms', 'collectiveChair', 'cabinetMembers', 'cabinetRoleLabels', 'pmNominee', 'splitDissolutionHolders', 'constructiveNoConfidence', 'pmMajorityLocked', 'pmDirectElectionEnabled']), coalitions: s.parliament && s.parliament.coalitions, ruling: ((s.parliament && s.parliament.parties) || []).map(p => [p.id, !!p.isRuling]) }),
        opinion: s => ({ prob: s.election && s.election.elecStore, tendency: s.election && s.election.tendency, approval: s.news && s.news.approval, auto: s.news && s.news.auto }),
        economy: s => ({ economy: pick(s.economy, ['defs', 'rules', 'ruleStart', 'thresholds', 'sched', 'preset']) }), // 편집 화면이 고치는 정의 · 규칙 · 예정 사건 (흐름 기록 hist는 날짜가 가면 바뀌므로 빼고)
    };
    function undoEvent() {
        const ev = window.event;
        if (!ev || !ev.isTrusted) return false;
        if (ev.type === 'keydown') return (ev.ctrlKey || ev.metaKey) && (ev.key.toLowerCase() === 'z' || ev.key.toLowerCase() === 'y');
        const t = ev.target && ev.target.closest && ev.target.closest('button,[role="button"]');
        return !!t && /performUndo|performRedo|undo|redo/i.test((t.getAttribute('onclick') || '') + ' ' + (t.id || '') + ' ' + (t.dataset.history || ''));
    }
    const origSet = window.setAppState;
    if (typeof origSet === 'function') window.setAppState = function (next) {
        const locked = Object.keys(SLICES).filter(reasonFor);
        if (locked.length && undoEvent() && !(window.HemiWorldMap && document.activeElement && document.activeElement.closest && document.activeElement.closest('#contentWorldmap,#contentEconblocs'))) {
            try {
                const cur = getAppState();
                const hit = locked.find(k => JSON.stringify(SLICES[k](cur)) !== JSON.stringify(SLICES[k](next || {})));
                if (hit) { refuse(reasonFor(hit) + ' (실행 취소로도 되돌릴 수 없습니다)'); return undefined; }
            } catch (e) { /* 비교 실패 — 그대로 진행 */ }
        }
        bypass++;
        try { return origSet.apply(this, arguments); } finally { bypass--; }
    };

    // 편집 화면 안내 · 꺼 둘 입력 칸
    function syncUi() {
        Object.entries(LOCKS).forEach(([cat, def]) => {
            const why = reasonFor(cat);
            def.tabs.forEach(id => {
                const host = document.getElementById(id);
                if (!host) return;
                let note = host.querySelector(':scope > .hemi-lock-note');
                if (why) {
                    if (!note) { note = document.createElement('div'); note.className = 'hemi-lock-note'; note.setAttribute('role', 'status'); host.prepend(note); }
                    note.textContent = '🔒 ' + why;
                } else if (note) note.remove();
            });
            (def.controls || []).forEach(sel => document.querySelectorAll(sel).forEach(el => {
                if (why && !el.disabled) { el.disabled = true; el.dataset.hemiLocked = '1'; }
                else if (!why && el.dataset.hemiLocked) { el.disabled = false; delete el.dataset.hemiLocked; }
            }));
        });
        document.body && document.body.classList.toggle('hemi-play-locked', anyLock());
    }
    // 화면이 다시 그려질 때마다 안내 · 꺼 둔 칸을 다시 맞춘다 (잠금이 있을 때만 지켜본다)
    let observer = null, syncT = 0;
    const schedule = () => { if (!syncT) syncT = requestAnimationFrame(() => { syncT = 0; syncUi(); }); };
    function watch() {
        const on = anyLock();
        if (on && !observer) {
            observer = new MutationObserver(schedule);
            Object.values(LOCKS).flatMap(d => d.tabs).forEach(id => { const el = document.getElementById(id); if (el) observer.observe(el, { childList: true, subtree: true }); });
        } else if (!on && observer) { observer.disconnect(); observer = null; }
        syncUi();
    }
    window.addEventListener('hemi-campaign-changed', () => setTimeout(watch, 0));
    const origSwitch = window.switchSubTab;
    if (typeof origSwitch === 'function') window.switchSubTab = function () { const r = origSwitch.apply(this, arguments); if (observer) schedule(); return r; };

    const css = document.createElement('style');
    css.textContent = `
        .hemi-lock-note { margin: 0 0 10px; padding: 8px 10px; border: 1px solid var(--tno-gold, #ffd700); color: var(--tno-gold, #ffd700); font-size: .8rem; line-height: 1.6; }
        html[data-theme-family="modern"] .hemi-lock-note { border-color: var(--m-border); color: var(--m-text); background: var(--m-surface-2); border-radius: 7px; }
        [data-hemi-locked] { cursor: not-allowed !important; opacity: .5; }
    `;
    document.head.appendChild(css);
    window.HemiPlayLocks = { LOCKS, wrapped, sync: watch, get bypass() { return bypass; } };
    setTimeout(watch, 0);
})();
