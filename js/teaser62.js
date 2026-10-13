// ===== Hemicycle 티저 1.6.2 (teaser62.html 전용) — "Vive la Révolution!" 미리보기 =====
// teaser62.html = main.html + js/teaser61.js(1.6.1 쿠데타 · 군정 · 군부 설정) + 이 파일. 저장 공간은 따로 ('hemicycleTeaser62:')
//
//   - 내각 › 혁명: 민중이 주체 — 주도 이념(민주 · 공산주의)과 혁명 정당을 고르면 성공 확률을 요인별로 보여 준다
//     (정부 불신 · 군정/당-국가/계엄 · 활동 금지 정당 · 혁명 정당 지지율 · 그 정당이 앞서는 지역의 인구 · 군의 충성)
//       공산주의 혁명 성공 → 숨겨진 정부 형태 "당-국가 체제": 혁명 정당 일당 집권, 다른 정당은 활동 금지 또는 우당(통일전선),
//         총서기 겸 국가주석 · 총리, 의회는 최고인민회의(의석은 혁명 정당 85% · 우당이 나머지 → 거의 만장일치), 선거는 단일 후보 찬반 투표
//       민주 혁명 성공 → 군정 · 당-국가 체제 · 계엄 붕괴, 막혔던 정당 복권, 새 헌법(법령 › 헌법), 새 총선 안내
//       둘 다: 혁명 뒤 국호 · 국기를 바꿀 수 있다 / 실패: 혁명 정당 활동 금지 · 지지율 절반, 정부가 계엄령 선포
//   - 선거인단 시스템 (선거 › 방식에서 선거인단제를 고르면): 선거인 단위(권역 · 지역구), 선거인 수(인구 비례 · 의석 수 + 가산 · 직접 입력),
//     승자독식 · 비례 배분, 과반 기준과 과반 미달 시(의회 결정 · 최다 득표), 신의 없는 선거인(%), 결과 지도
/* global getAppState, setAppState, switchSubTab, parties, coalitions, president, pm, elecStore, emergencyPowers, seatKeyFor,
   chamberList, chamberDisplayName, renderEmergencyPowers, applyMartialLawEffects, simulate, refreshUI, showCustomAlert,
   showCustomConfirm, escapeHtmlText, formatNationDate, effRoleLabel, elecRun, elecRunByElection, regions, districtRegionMap,
   districtGrid, districtSeatCounts, districtPopulation, districtNames, districtTendencyFor, candidateUnionOf, nationFlag,
   renderNationConfig, updateNationIdBar, legisGetState, legisSetState, renderDistrictSvgInto, tendencyColorForPct,
   presElectionMode, ideologyName, findIdeology */
(function () {
    'use strict';
    const root = document.documentElement;
    if (root.getAttribute('data-app-mode') !== 'teaser' || root.getAttribute('data-teaser') !== '62') return;

    const esc = s => (typeof escapeHtmlText === 'function' ? escapeHtmlText(String(s ?? '')) : String(s ?? ''));
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const uid = () => 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const partyById = id => parties.find(p => String(p.id) === String(id)) || null;
    const T61 = () => window.T61 || null;
    const isInd = p => p && p.ideologyId === 9999;
    const activeParty = p => p && p.status !== 'banned' && p.status !== 'dissolved' && !isInd(p);
    const support = pid => Math.max(0, Number(elecStore?.house?.[pid]?.prob) || 0);
    const isGovParty = p => !!p && (p.isRuling || coalitions.some(c => c.isRuling && (c.members || []).some(id => String(id) === String(p.id))));
    const DEFAULT_POP = 100000;

    // ---- 상태 (세이브의 teaser62 칸) ----
    //   partyState: null | { partyId, allies:[pid], banned:[pid], prevNames:{house,senate,third}, since }
    //   revBanned: [pid] — 혁명 뒤 활동 금지된 정당 (민주 혁명 때 복권)
    //   log: [{ id, at, date, kind, party, chance, success, effects }]
    //   ec: 선거인단 설정
    let S = fresh();
    function fresh() {
        return { partyState: null, revBanned: [], log: [],
            ec: { unit: 'region', electors: 'pop', total: 538, bonus: 2, manual: {}, alloc: 'wta', noMajority: 'parliament', faithless: 0 } };
    }
    let ui = { kind: 'democratic', partyId: '', allies: {}, newName: '', newFlag: '', lastId: null };

    const origGet = window.getAppState;
    window.getAppState = function () {
        const st = origGet.apply(this, arguments);
        if (st && typeof st === 'object') st.teaser62 = JSON.parse(JSON.stringify(S));
        return st;
    };
    const origSet = window.setAppState;
    window.setAppState = function (state) {
        const r = origSet.apply(this, arguments);
        const src = state && state.teaser62;
        const base = fresh();
        S = { ...base, ...(src && typeof src === 'object' ? JSON.parse(JSON.stringify(src)) : {}) };
        S.ec = { ...base.ec, ...(S.ec || {}) };
        if (!Array.isArray(S.log)) S.log = [];
        if (!Array.isArray(S.revBanned)) S.revBanned = [];
        refresh();
        return r;
    };

    // ================= 혁명 =================
    function houseKeys() { return Object.keys(districtGrid.house || {}).filter(k => districtGrid.house[k]); }
    const popOf = k => Number(districtPopulation?.house?.[k]) || DEFAULT_POP;
    // 혁명 정당(없으면 정부 · 여당이 아닌 정당 전체)이 성향 1위인 지역의 인구 비율 — "여론 · 인구와 연계"
    function popShareLed(partyId) {
        const keys = houseKeys();
        if (!keys.length || typeof districtTendencyFor !== 'function') return null;
        let led = 0, all = 0;
        keys.forEach(k => {
            const pop = popOf(k); all += pop;
            const v = districtTendencyFor(k, 'house').values || {};
            const ranked = parties.filter(activeParty).map(p => [p, Number(v[p.id]) || 0]).sort((a, b) => b[1] - a[1]);
            if (!ranked.length || ranked[0][1] <= 0) return;
            const top = ranked[0][0];
            if (partyId ? String(top.id) === String(partyId) : !isGovParty(top)) led += pop;
        });
        return all ? led / all : null;
    }
    function revChance(kind, partyId) {
        const f = [];
        const add = (label, v) => f.push({ label, v: Math.round(v) });
        const t61 = T61();
        const junta = t61 && t61.junta;
        const martial = emergencyPowers?.martialLaw?.active;
        add('기본', 10);
        if (junta) add('군정에 대한 반감', 20);
        else if (S.partyState && kind === 'democratic') add('당-국가 체제에 대한 반감', 15);
        else {
            const gov = Math.min(100, parties.filter(isGovParty).reduce((a, p) => a + support(p.id), 0));
            add(`정부 불신 (정부 · 여당 지지율 ${Math.round(gov)}%)`, (100 - gov) * 0.3);
        }
        if (martial && !junta) add('계엄령', 10);
        const bannedN = parties.filter(p => p.status === 'banned').length;
        if (bannedN) add(`활동 금지된 정당 ${bannedN}곳`, Math.min(20, bannedN * 4));
        const p = partyById(partyId);
        if (p) add(`${p.name} 지지율 (${support(p.id)}%)`, support(p.id) * 0.4);
        else if (kind === 'communist') add('혁명 정당 없음', -30);
        const share = popShareLed(p ? p.id : null);
        if (share != null) add(`${p ? p.name + '이(가)' : '반정부 세력이'} 앞서는 지역의 인구 (${Math.round(share * 100)}%)`, share * 20);
        if (t61 && t61.military && t61.military.length) {
            const loyal = t61.military.reduce((a, m) => a + (Number(m.loyalty) || 0), 0) / t61.military.length;
            add(`군의 충성 (평균 ${Math.round(loyal)})`, -(loyal - 50) * 0.4);
        }
        return { factors: f, chance: clamp(Math.round(f.reduce((a, x) => a + x.v, 0)), 5, 90) };
    }

    function liftMartialLaw() {
        emergencyPowers.martialLaw.active = false;
        emergencyPowers.martialLaw.suspendParliament = false;
        if (typeof renderEmergencyPowers === 'function') renderEmergencyPowers();
        if (typeof applyMartialLawEffects === 'function') applyMartialLawEffects();
    }
    function chamberNameInput(ch) { return document.getElementById(ch + 'NameInput'); }
    function setChamberName(ch, name) {
        const inp = chamberNameInput(ch);
        if (!inp) return;
        inp.value = name;
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        inp.dispatchEvent(new Event('change', { bubbles: true }));
    }
    function applyNationIdentity() {
        if (ui.newName.trim()) { const inp = document.getElementById('nationNameInput'); if (inp) { inp.value = ui.newName.trim(); } }
        if (ui.newFlag) window.nationFlag = ui.newFlag; // main.js 전역 let — 같은 이름으로 바꾼다
        try { if (ui.newFlag) nationFlag = ui.newFlag; } catch (e) { /* 이름 접근 불가 */ } // eslint-disable-line no-global-assign
        try { renderNationConfig(); updateNationIdBar(); } catch (e) { /* 화면 준비 전 */ }
    }
    const nationName = () => document.getElementById('nationNameInput')?.value?.trim() || '';
    function setConstitution(c) {
        if (typeof legisGetState !== 'function') return;
        const cur = legisGetState();
        const prev = cur.constitution;
        const revisions = prev ? [...(prev.revisions || []), { date: formatNationDate(), note: `혁명으로 "${prev.title}" 폐지 · "${c.title}" 제정` }] : [];
        legisSetState({ ...cur, constitution: { ...c, revisions } });
    }
    function democraticConstitution() {
        const nm = nationName();
        return { title: `${nm ? nm + ' ' : ''}헌법`,
            preamble: '우리 국민은 독재에 맞서 일어선 혁명의 정신을 이어받아, 자유롭고 민주적인 기본 질서를 굳게 세우고 국민 모두의 존엄과 권리를 지키기 위하여 이 헌법을 제정한다.',
            articles: [
                { title: '국민주권', text: '주권은 국민에게 있고, 모든 권력은 국민으로부터 나온다.' },
                { title: '기본권', text: '모든 국민은 인간으로서의 존엄과 가치를 가지며, 국가는 개인이 가지는 불가침의 기본적 인권을 확인하고 이를 보장할 의무를 진다.' },
                { title: '복수정당제', text: '정당의 설립은 자유이며, 복수정당제는 보장된다.' },
                { title: '선거', text: '의회 의원과 국가 원수는 국민의 보통 · 평등 · 직접 · 비밀 선거로 뽑는다.' },
                { title: '권력 분립', text: '입법권은 의회에, 행정권은 정부에, 사법권은 법원에 속한다.' },
                { title: '계엄의 제한', text: '계엄은 의회의 동의 없이 60일을 넘길 수 없으며, 계엄 중에도 의회의 활동은 정지되지 아니한다.' },
            ] };
    }
    function partyStateConstitution(p) {
        const nm = nationName();
        return { title: `${nm ? nm + ' ' : ''}사회주의 헌법`,
            preamble: `${nm || '우리 나라'}는 ${p.name}의 영도 아래 혁명으로 세워진 인민의 국가이다. 인민은 혁명의 위업을 이어 사회주의 건설을 완성하기 위하여 이 헌법을 채택한다.`,
            articles: [
                { title: '국가의 성격', text: `${nm || '국가'}는 노동자 · 농민 · 근로 인텔리를 비롯한 전체 인민의 이익을 대표하는 사회주의 국가이다.` },
                { title: '당의 영도', text: `국가는 ${p.name}의 영도 아래 모든 활동을 한다.` },
                { title: '통일전선', text: '국가는 혁명에 찬동하는 우당 및 사회단체와 통일전선을 이룬다.' },
                { title: '최고주권기관', text: '최고인민회의는 국가의 최고주권기관이다.' },
                { title: '국가주석', text: '국가주석은 국가의 수반이며, 당의 총서기가 겸임한다.' },
                { title: '선거', text: '최고인민회의 대의원은 통일전선이 추천한 단일 후보에 대한 찬반 투표로 선출한다.' },
            ] };
    }
    // 당-국가 체제의 의석: 혁명 정당 85% · 우당이 지지율 비율로 나머지 (원마다 총 의석은 그대로)
    function partyStateSeats(p, allies) {
        chamberList().forEach(ch => {
            const key = seatKeyFor(ch);
            const total = parties.reduce((a, x) => a + (x[key] || 0), 0);
            if (!total) return;
            const allyList = allies.map(partyById).filter(Boolean);
            const allyTotal = allyList.length ? Math.round(total * 0.15) : 0;
            parties.forEach(x => { x[key] = 0; });
            p[key] = total - allyTotal;
            const w = allyList.map(a => Math.max(1, support(a.id)));
            const sw = w.reduce((a, b) => a + b, 0) || 1;
            let given = 0;
            allyList.forEach((a, i) => { const n = i === allyList.length - 1 ? allyTotal - given : Math.round(allyTotal * w[i] / sw); a[key] = n; given += n; });
            (p.factions || []).forEach(f => { f[key] = 0; });
        });
    }
    function endPartyState() {
        if (!S.partyState) return;
        const prev = S.partyState.prevNames || {};
        Object.keys(prev).forEach(ch => { if (prev[ch] != null) setChamberName(ch, prev[ch]); });
        S.partyState = null;
    }
    function restoreRevBanned() {
        (S.revBanned || []).forEach(id => { const p = partyById(id); if (p && p.status === 'banned') p.status = 'active'; });
        S.revBanned = [];
    }

    function revolt() {
        const kind = ui.kind;
        const p = partyById(ui.partyId);
        if (kind === 'communist' && !activeParty(p)) { showCustomAlert('공산주의 혁명은 혁명 정당을 골라야 합니다.'); return; }
        if (kind === 'communist' && S.partyState) { showCustomAlert('이미 당-국가 체제입니다.'); return; }
        const { chance } = revChance(kind, ui.partyId);
        const label = kind === 'communist' ? '공산주의 혁명' : '민주 혁명';
        showCustomConfirm(`${label}을 일으킵니다${p ? ` — 혁명 정당: ${p.name}` : ''}, 성공 확률 ${chance}%. 계속하시겠습니까?`, () => {
            const success = Math.random() * 100 < chance;
            const effects = success ? (kind === 'communist' ? communistWin(p) : democraticWin(p)) : revFail(p);
            const entry = { id: uid(), at: Date.now(), date: formatNationDate(), kind, party: p ? p.name : '', chance, success, effects };
            S.log.unshift(entry);
            ui.lastId = entry.id;
            ui.newName = ''; ui.newFlag = '';
            try { simulate(); refreshUI(); } catch (e) { /* 화면 준비 전 */ }
            if (T61()) T61().refresh();
            refresh();
        });
    }
    function communistWin(p) {
        const fx = [];
        const t61 = T61();
        if (t61 && t61.junta) { t61.endJunta('revolution'); fx.push('군정 붕괴'); }
        liftMartialLaw();
        const allies = Object.keys(ui.allies).filter(id => ui.allies[id] && String(id) !== String(p.id) && activeParty(partyById(id)));
        const banned = [];
        parties.forEach(x => {
            if (x === p || allies.includes(String(x.id)) || isInd(x) || x.status === 'banned' || x.status === 'dissolved') return;
            x.status = 'banned'; banned.push(x.id);
        });
        S.revBanned = [...new Set([...(S.revBanned || []), ...banned])];
        parties.forEach(x => { x.isRuling = x === p; });
        coalitions.forEach(c => { c.isRuling = false; });
        const prevNames = {};
        chamberList().forEach(ch => { prevNames[ch] = chamberNameInput(ch)?.value ?? null; });
        S.partyState = { partyId: p.id, allies, banned, prevNames, since: formatNationDate() };
        applyNationIdentity();
        setChamberName('house', '최고인민회의');
        partyStateSeats(p, allies);
        const leader = p.leaderName || `${p.name} 총서기`;
        Object.assign(president, { name: leader, photo: p.leaderPhoto || '', partyId: p.id, linkedSeat: null });
        setConstitution(partyStateConstitution(p));
        fx.push(`숨겨진 정부 형태: 당-국가 체제 — ${p.name} 일당 집권`, `총서기 겸 국가주석: ${leader}`,
            allies.length ? `우당(통일전선) ${allies.length}곳 · 활동 금지 ${banned.length}곳` : `다른 정당 ${banned.length}곳 활동 금지`,
            '의회 → 최고인민회의 (혁명 정당 85% · 우당이 나머지)', '사회주의 헌법 채택 · 선거는 단일 후보 찬반 투표');
        if (ui.newName.trim()) fx.push(`국호: ${ui.newName.trim()}`);
        if (ui.newFlag) fx.push('국기 교체');
        return fx;
    }
    function democraticWin(p) {
        const fx = [];
        const t61 = T61();
        if (t61 && t61.junta) { t61.endJunta('revolution'); fx.push('군정 붕괴'); }
        if (S.partyState) { endPartyState(); fx.push('당-국가 체제 붕괴 · 의회 이름 되돌림'); }
        if (emergencyPowers?.martialLaw?.active) { liftMartialLaw(); fx.push('계엄령 해제'); }
        const bannedBefore = parties.filter(x => x.status === 'banned').length;
        restoreRevBanned();
        if (t61) t61.restoreBanned();
        const restored = bannedBefore - parties.filter(x => x.status === 'banned').length;
        if (restored > 0) fx.push(`활동 금지됐던 정당 ${restored}곳 복권`);
        Object.assign(president, { name: '', photo: '', partyId: null, linkedSeat: null });
        Object.assign(pm, { name: '', photo: '', partyId: null, linkedSeat: null });
        parties.forEach(x => { x.isRuling = false; });
        coalitions.forEach(c => { c.isRuling = false; });
        applyNationIdentity();
        setConstitution(democraticConstitution());
        fx.push('일반 정부 형태로 복귀 · 대통령 · 총리 공석', '새 헌법 제정 (입법 › 법령)', '새 총선을 치르세요 (선거 › 총선)');
        if (p) fx.push(`혁명을 이끈 ${p.name}의 지지율 상승`), cutSupport(p.id, 1.2);
        if (ui.newName.trim()) fx.push(`국호: ${ui.newName.trim()}`);
        if (ui.newFlag) fx.push('국기 교체');
        return fx;
    }
    function cutSupport(pid, factor) {
        chamberList().forEach(ch => { const st = elecStore?.[ch]?.[pid]; if (st) st.prob = Math.round(Math.min(100, (Number(st.prob) || 0) * factor) * 10) / 10; });
    }
    function revFail(p) {
        const fx = [];
        if (p) { p.status = 'banned'; cutSupport(p.id, 0.5); fx.push(`${p.name} 활동 금지 · 지지율 절반으로`); }
        if (!(T61() && T61().junta) && !S.partyState && !emergencyPowers?.martialLaw?.active) {
            emergencyPowers.martialLaw.holder = 'president';
            emergencyPowers.martialLaw.suspendParliament = false;
            emergencyPowers.martialLaw.active = true;
            if (typeof renderEmergencyPowers === 'function') renderEmergencyPowers();
            if (typeof applyMartialLawEffects === 'function') applyMartialLawEffects();
            fx.push('정부가 계엄령 선포 (진압)');
        } else fx.push('진압당함');
        return fx;
    }
    // 당-국가 체제의 선거: 단일 후보 찬반 투표 (의석은 그대로 다시 나눔)
    function yesNoElection() {
        if (!S.partyState) return;
        const p = partyById(S.partyState.partyId);
        const turnout = 99 + Math.random() * 0.9;
        const yes = 97 + Math.random() * 2.9;
        partyStateSeats(p, S.partyState.allies || []);
        S.log.unshift({ id: uid(), at: Date.now(), date: formatNationDate(), kind: 'yesno', party: p ? p.name : '', chance: null, success: true,
            effects: [`최고인민회의 대의원 선거 — 단일 후보 찬반 투표`, `투표율 ${turnout.toFixed(2)}% · 찬성 ${yes.toFixed(2)}%`, '통일전선 후보 전원 당선'] });
        ui.lastId = S.log[0].id;
        try { simulate(); refreshUI(); } catch (e) { /* 화면 준비 전 */ }
        refresh();
    }

    // 당-국가 체제: 직책 이름 · 선거
    const origRole = window.effRoleLabel;
    window.effRoleLabel = function (key) {
        if (S.partyState && key === 'president') return '국가주석';
        return origRole.apply(this, arguments);
    };
    const blockIfPartyState = fn => function () {
        if (S.partyState) { showCustomAlert('당-국가 체제에서는 경쟁 선거가 없습니다 — 내각 › 혁명의 "찬반 선거 치르기"로 최고인민회의 대의원을 뽑습니다.'); return; }
        return fn.apply(this, arguments);
    };
    ['elecRun', 'elecRunByElection'].forEach(n => { if (typeof window[n] === 'function') window[n] = blockIfPartyState(window[n]); });

    // ================= 선거인단 =================
    // 선거인 단위 — 권역(기준 원의 권역, 권역에 안 든 지역구는 따로 한 단위) 또는 지역구
    function ecUnits(ch) {
        const keys = Object.keys(districtGrid[ch] || {}).filter(k => districtGrid[ch][k]);
        const name = k => districtNames?.[ch]?.[k] || districtNames?.house?.[k] || k;
        if (S.ec.unit === 'region' && (regions[ch] || []).length) {
            const units = (regions[ch] || []).map(r => ({ id: 'r:' + r.id, name: r.name, keys: keys.filter(k => String(districtRegionMap[ch]?.[k]) === String(r.id)) })).filter(u => u.keys.length);
            const inR = new Set(units.flatMap(u => u.keys));
            keys.filter(k => !inR.has(k)).forEach(k => units.push({ id: 'd:' + k, name: name(k), keys: [k] }));
            return units;
        }
        return keys.map(k => ({ id: 'd:' + k, name: name(k), keys: [k] }));
    }
    function largestRemainder(weights, total) {
        const sum = weights.reduce((a, b) => a + b, 0);
        if (!sum || total <= 0) return weights.map(() => 0);
        const raw = weights.map(w => w / sum * total);
        const out = raw.map(Math.floor);
        let left = total - out.reduce((a, b) => a + b, 0);
        raw.map((r, i) => [r - out[i], i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (left > 0) { out[i]++; left--; } });
        return out;
    }
    function ecElectorCounts(ch, units) {
        const e = S.ec;
        if (e.electors === 'manual') return units.map(u => Math.max(0, Math.round(Number(e.manual[u.id]) || 3)));
        if (e.electors === 'seats') return units.map(u => u.keys.reduce((a, k) => a + (districtSeatCounts[k]?.[ch] || 0), 0) + Math.max(0, Number(e.bonus) || 0));
        // 인구 비례: 총 선거인 수를 인구로 나누되 단위마다 최소 1명
        const total = Math.max(units.length, Math.round(Number(e.total) || 538));
        const pops = units.map(u => u.keys.reduce((a, k) => a + popOf(k), 0));
        const base = units.map(() => 1);
        const extra = largestRemainder(pops, total - units.length);
        return base.map((b, i) => b + extra[i]);
    }
    function ecResult(candidates, ch) {
        const units = ecUnits(ch);
        if (!units.length) return null;
        const counts = ecElectorCounts(ch, units);
        const cid = pid => {
            const u = typeof candidateUnionOf === 'function' ? candidateUnionOf(pid, 'pres') : null;
            if (u) { const c = candidates.find(c => u.partyIds.some(id => String(id) === String(c.id))); if (c) return c.id; }
            return pid;
        };
        const ids = candidates.map(c => c.id);
        const popTotals = Object.fromEntries(ids.map(id => [id, 0]));
        const electors = Object.fromEntries(ids.map(id => [id, 0]));
        const unitRows = units.map((u, ui) => {
            const votes = Object.fromEntries(ids.map(id => [id, 0]));
            u.keys.forEach(k => {
                const t = typeof districtTendencyFor === 'function' ? districtTendencyFor(k, ch).values : {};
                const has = Object.values(t || {}).some(v => Number(v) > 0);
                parties.forEach(p => {
                    const c = cid(p.id);
                    if (!ids.includes(c)) return;
                    const base = has ? (Number(t[p.id]) || 0) : (Number(elecStore?.[ch]?.[p.id]?.prob) || 0);
                    if (base <= 0) return;
                    votes[c] += Math.max(0, base + (Math.random() * 10 - 5)) * popOf(k);
                });
            });
            const vsum = Object.values(votes).reduce((a, b) => a + b, 0) || 1;
            ids.forEach(id => { popTotals[id] += votes[id]; });
            const n = counts[ui];
            let alloc;
            if (S.ec.alloc === 'prop') alloc = largestRemainder(ids.map(id => votes[id]), n);
            else { const win = ids.slice().sort((a, b) => votes[b] - votes[a])[0]; alloc = ids.map(id => (id === win ? n : 0)); }
            // 신의 없는 선거인: 선거인마다 확률만큼 다른 후보에게
            let faithless = 0;
            const fp = clamp(Number(S.ec.faithless) || 0, 0, 100) / 100;
            if (fp > 0 && ids.length > 1) {
                const moved = ids.map(() => 0);
                alloc.forEach((cnt, i) => { for (let j = 0; j < cnt; j++) if (Math.random() < fp) { moved[i]--; let to = Math.floor(Math.random() * (ids.length - 1)); if (to >= i) to++; moved[to]++; faithless++; } });
                alloc = alloc.map((c, i) => c + moved[i]);
            }
            ids.forEach((id, i) => { electors[id] += alloc[i]; });
            const winner = ids.slice().sort((a, b) => votes[b] - votes[a])[0];
            return { id: u.id, name: u.name, keys: u.keys, electors: n, alloc: Object.fromEntries(ids.map((id, i) => [id, alloc[i]])), share: votes[winner] / vsum * 100, winner, faithless };
        });
        const totalE = counts.reduce((a, b) => a + b, 0);
        const need = Math.floor(totalE / 2) + 1;
        const popSum = Object.values(popTotals).reduce((a, b) => a + b, 0) || 1;
        const round1 = ids.map(id => ({ partyId: id, electors: electors[id], pct: totalE ? electors[id] / totalE * 100 : 0, popPct: popTotals[id] / popSum * 100 })).sort((a, b) => b.electors - a.electors);
        let winnerPartyId = round1[0] ? round1[0].partyId : null, contingent = null;
        if (round1[0] && round1[0].electors < need) {
            if (S.ec.noMajority === 'parliament') {
                // 과반 미달 — 의회가 상위 3명 중에서 정한다 (기준 원 의석이 가장 많은 쪽, 단일화면 참여 정당 의석 합)
                const key = seatKeyFor(ch);
                const seatsFor = id => { const u = typeof candidateUnionOf === 'function' ? candidateUnionOf(id, 'pres') : null; const members = u ? u.partyIds : [id]; return members.reduce((a, m) => a + (partyById(m)?.[key] || 0), 0); };
                const top3 = round1.slice(0, 3);
                const pick = top3.slice().sort((a, b) => seatsFor(b.partyId) - seatsFor(a.partyId))[0];
                winnerPartyId = pick.partyId;
                contingent = { how: 'parliament', top3: top3.map(x => ({ partyId: x.partyId, seats: seatsFor(x.partyId) })) };
            } else contingent = { how: 'plurality' };
        }
        return { round1, winnerPartyId, units: unitRows, totalE, need, contingent, chamber: ch, unitMode: S.ec.unit };
    }
    let lastEC = null;
    const origRounds = window.computeElectionRounds;
    window.computeElectionRounds = function (mode, chamberBasis, candidates) {
        if (mode === 'electoral') {
            const r = ecResult(candidates, chamberBasis);
            if (r) { lastEC = r; return { round1: r.round1, round2: null, winnerPartyId: r.winnerPartyId }; }
        }
        return origRounds.apply(this, arguments);
    };
    function ecDetailsHtml(r) {
        const name = id => { const p = partyById(id); return p ? p.name : '?'; };
        const color = id => partyById(id)?.color || '#888';
        const winner = r.round1.find(x => x.partyId === r.winnerPartyId);
        const faithless = r.units.reduce((a, u) => a + u.faithless, 0);
        return `
            <div class="t62-ec">
                <div class="t62-ec-head">선거인단 ${r.totalE}명 · 과반 ${r.need}명 · ${S.ec.alloc === 'prop' ? '비례 배분' : '승자독식'}${faithless ? ` · 신의 없는 선거인 ${faithless}명` : ''}</div>
                <div class="t62-ec-bar">${r.round1.filter(x => x.electors > 0).map(x => `<span style="width:${x.pct}%;background:${color(x.partyId)}" title="${esc(name(x.partyId))} ${x.electors}명"></span>`).join('')}<i style="left:${r.need / r.totalE * 100}%"></i></div>
                ${r.round1.map(x => `<div class="t62-ec-row"><span><span class="t62-dot" style="background:${color(x.partyId)}"></span>${esc(name(x.partyId))}</span><span>선거인 <b>${x.electors}</b> · 득표 ${x.popPct.toFixed(1)}%</span></div>`).join('')}
                ${r.contingent ? `<div class="t62-ec-note">과반(${r.need}명) 미달 — ${r.contingent.how === 'parliament'
                    ? `의회가 상위 ${r.contingent.top3.length}명 중에서 정함 (${esc(chamberDisplayName(r.chamber))} 의석: ${r.contingent.top3.map(x => `${esc(name(x.partyId))} ${x.seats}석`).join(' · ')}) → <b>${esc(name(r.winnerPartyId))}</b>`
                    : `최다 선거인 확보 후보 <b>${esc(name(r.winnerPartyId))}</b> 당선`}</div>` : (winner ? `<div class="t62-ec-note">${esc(name(winner.partyId))} 과반 확보 (${winner.electors}명)</div>` : '')}
                <div class="t62-ec-map" data-ec-map></div>
                <details class="t62-ec-units"><summary>${r.unitMode === 'region' ? '권역' : '지역구'}별 선거인 (${r.units.length})</summary>
                    ${r.units.map(u => `<div class="t62-ec-unit" style="border-left-color:${color(u.winner)}"><b>${esc(u.name)}</b> <span class="t62-dim">선거인 ${u.electors}명</span>
                        <div class="t62-dim">${Object.entries(u.alloc).filter(([, n]) => n > 0).map(([id, n]) => `${esc(name(id))} ${n}`).join(' · ')}${u.faithless ? ` · 이탈 ${u.faithless}` : ''}</div></div>`).join('')}
                </details>
            </div>`;
    }
    function appendEcDetails(panelId, result) {
        const panel = document.getElementById(panelId);
        if (!panel || !result || result.mode !== 'electoral' || !lastEC || lastEC.round1 !== result.round1) return;
        const wrap = document.createElement('div');
        wrap.innerHTML = ecDetailsHtml(lastEC);
        const firstBtn = panel.querySelector('button');
        panel.insertBefore(wrap.firstElementChild, firstBtn || null);
        const mapEl = panel.querySelector('[data-ec-map]');
        if (mapEl && typeof renderDistrictSvgInto === 'function') {
            const byKey = {};
            lastEC.units.forEach(u => u.keys.forEach(k => { byKey[k] = u; }));
            mapEl.style.aspectRatio = '3 / 2';
            renderDistrictSvgInto(mapEl, {
                chamber: lastEC.chamber, zoomKey: 't62:ec:' + panelId,
                getFill: k => { const u = byKey[k]; const p = u && partyById(u.winner); return p ? tendencyColorForPct(p.color, 45 + Math.min(55, u.share * 0.55)) : 'transparent'; },
                title: k => { const u = byKey[k]; return u ? `${u.name}: 선거인 ${u.electors}명 · ${Object.entries(u.alloc).filter(([, n]) => n > 0).map(([id, n]) => `${partyById(id)?.name || '?'} ${n}`).join(' · ')}` : k; },
                groupOf: lastEC.unitMode === 'region' ? k => byKey[k]?.id ?? null : undefined,
            });
        }
    }
    const origPres = window.renderPresElecResultPanel;
    window.renderPresElecResultPanel = function () { const r = origPres.apply(this, arguments); appendEcDetails('presElecResultPanel', window.presElectionLastResult || safeGet(() => presElectionLastResult)); return r; };
    const origPm = window.renderPmElecResultPanel;
    if (origPm) window.renderPmElecResultPanel = function () { const r = origPm.apply(this, arguments); appendEcDetails('pmElecResultPanel', safeGet(() => pmElectionLastResult)); return r; };
    function safeGet(fn) { try { return fn(); } catch (e) { return null; } }

    // 선거인단 설정 칸 — 선거 › 방식의 선거 방식 버튼 아래 (선거인단제일 때만)
    function renderEcPanel() {
        let box = document.getElementById('t62EcPanel');
        const hint = document.getElementById('presElecModeHint');
        if (!hint) return;
        if (!box) { box = document.createElement('div'); box.id = 't62EcPanel'; hint.parentElement.insertBefore(box, hint.nextSibling); }
        const mode = safeGet(() => presElectionMode);
        box.style.display = mode === 'electoral' ? '' : 'none';
        if (mode !== 'electoral') return;
        const e = S.ec;
        const ch = safeGet(() => window.presElectionChamberBasis) || safeGet(() => presElectionChamberBasis) || 'house';
        const units = ecUnits(ch);
        const counts = ecElectorCounts(ch, units);
        const totalE = counts.reduce((a, b) => a + b, 0);
        const radio = (field, v, t) => `<button type="button" class="system-radio-btn ${e[field] === v ? 'active' : ''}" data-f="${field}" data-v="${v}">${t}</button>`;
        box.innerHTML = `
            <div class="t62-ecset">
                <div class="t62-ecset-title">선거인단 설정 <span class="t62-dim">— ${units.length}개 단위 · 선거인 ${totalE}명 · 과반 ${Math.floor(totalE / 2) + 1}명</span></div>
                <label class="t62-dim">선거인 단위</label>
                <div class="system-radio-group">${radio('unit', 'region', '권역마다')}${radio('unit', 'district', '지역구마다')}</div>
                ${e.unit === 'region' && !(regions[ch] || []).length ? '<div class="t62-dim t62-small">이 원에 권역이 없어 지역구마다로 셉니다 (국가 › 권역에서 만들 수 있어요)</div>' : ''}
                <label class="t62-dim">선거인 수</label>
                <div class="system-radio-group">${radio('electors', 'pop', '인구 비례')}${radio('electors', 'seats', '의석 수 + 가산')}${radio('electors', 'manual', '직접 입력')}</div>
                ${e.electors === 'pop' ? `<div class="t62-row"><span class="t62-dim">총 선거인 수</span><input type="number" min="1" data-n="total" value="${e.total}"></div><div class="t62-dim t62-small">인구에 비례해 나누되 단위마다 최소 1명 (인구 미입력 지역구는 ${DEFAULT_POP.toLocaleString()}명으로)</div>` : ''}
                ${e.electors === 'seats' ? `<div class="t62-row"><span class="t62-dim">단위마다 가산</span><input type="number" min="0" data-n="bonus" value="${e.bonus}"></div><div class="t62-dim t62-small">그 단위의 ${esc(chamberDisplayName(ch))} 지역구 의석 수 + 가산 (미국식: 하원 의석 + 상원 2)</div>` : ''}
                ${e.electors === 'manual' ? `<details class="t62-manual" open><summary class="t62-dim">단위별 선거인 수</summary>${units.map((u, i) => `<div class="t62-row"><span>${esc(u.name)}</span><input type="number" min="0" data-u="${esc(u.id)}" value="${counts[i]}"></div>`).join('')}</details>` : ''}
                <label class="t62-dim">배분 방식</label>
                <div class="system-radio-group">${radio('alloc', 'wta', '승자독식')}${radio('alloc', 'prop', '비례 배분')}</div>
                <label class="t62-dim">과반 미달이면</label>
                <div class="system-radio-group">${radio('noMajority', 'parliament', '의회가 결정 (상위 3명)')}${radio('noMajority', 'plurality', '최다 선거인 당선')}</div>
                <div class="t62-row"><span class="t62-dim">신의 없는 선거인</span><input type="number" min="0" max="100" step="0.5" data-n="faithless" value="${e.faithless}"><span class="t62-dim">%</span></div>
            </div>`;
        box.querySelectorAll('[data-f]').forEach(b => { b.onclick = () => { S.ec[b.dataset.f] = b.dataset.v; renderEcPanel(); }; });
        box.querySelectorAll('[data-n]').forEach(i => { i.onchange = () => { S.ec[i.dataset.n] = Number(i.value) || 0; renderEcPanel(); }; });
        box.querySelectorAll('[data-u]').forEach(i => { i.onchange = () => { S.ec.manual[i.dataset.u] = Math.max(0, Number(i.value) || 0); renderEcPanel(); }; });
    }
    ['setPresElectionMode', 'setPresElectionChamberBasis'].forEach(n => {
        const o = window[n];
        if (typeof o === 'function') window[n] = function () { const r = o.apply(this, arguments); renderEcPanel(); return r; };
    });

    // ================= 화면: 내각 › 혁명 =================
    function el(html) { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }
    (function addTabs() {
        const cab = document.getElementById('mainContentCabinet');
        const bar = cab && cab.querySelector(':scope > .sub-tab-container');
        if (!bar) return;
        const after = document.getElementById('subTabCoup');
        const btn = el(`<button class="sub-tab-btn" onclick="switchSubTab('cabinet','revolution')" id="subTabRevolution">혁명</button>`);
        if (after && after.nextSibling) bar.insertBefore(btn, after.nextSibling); else bar.appendChild(btn);
        cab.appendChild(el(`<div id="contentRevolution" class="sub-tab-content"></div>`));
    })();
    const origSwitch = window.switchSubTab;
    window.switchSubTab = function (main, sub) {
        const r = origSwitch.apply(this, arguments);
        if (main === 'cabinet' && sub === 'revolution') renderRevolution();
        if (main === 'vote' && sub === 'elecSettings') renderEcPanel();
        return r;
    };
    const origCab = window.renderCabinetDisplay;
    window.renderCabinetDisplay = function () {
        const r = origCab.apply(this, arguments);
        const grid = document.getElementById('cabinetDisplayGrid');
        if (grid) {
            let b = document.getElementById('t62PartyStateBanner');
            const p = S.partyState && partyById(S.partyState.partyId);
            if (p) {
                if (!b) { b = el('<div id="t62PartyStateBanner" class="t62-banner"></div>'); grid.parentElement.insertBefore(b, grid); }
                b.innerHTML = `★ 당-국가 체제 — ${esc(p.name)} 일당 집권 · 총서기 겸 국가주석 <b>${esc(president.name || '')}</b>${S.partyState.since ? ` · ${esc(S.partyState.since)}부터` : ''}`;
            } else if (b) b.remove();
        }
        return r;
    };

    const kindName = k => ({ democratic: '민주 혁명', communist: '공산주의 혁명', yesno: '찬반 선거' }[k] || k);
    function renderRevolution() {
        const box = document.getElementById('contentRevolution');
        if (!box) return;
        const t61 = T61();
        const junta = t61 && t61.junta;
        const ps = S.partyState && partyById(S.partyState.partyId);
        if (ps && ui.kind === 'communist') ui.kind = 'democratic'; // 당-국가 체제는 민주 혁명으로만 무너뜨린다
        const kind = ui.kind;
        const cands = parties.filter(activeParty).filter(p => !(ps && p === ps));
        if (ui.partyId && !cands.some(p => String(p.id) === String(ui.partyId))) ui.partyId = '';
        if (kind === 'communist' && !ui.partyId) {
            const left = cands.filter(p => /사회|공산|혁명|노동/.test((typeof ideologyName === 'function' ? ideologyName(p.ideologyId) : '') + p.name));
            ui.partyId = (left[0] || cands.slice().sort((a, b) => support(b.id) - support(a.id))[0] || {}).id || '';
        }
        const p = partyById(ui.partyId);
        const { factors, chance } = revChance(kind, ui.partyId);
        const last = S.log.find(x => x.id === ui.lastId);
        const status = junta ? `⚔ 군정 (의장 ${esc(junta.chairName)})` : ps ? `★ 당-국가 체제 (${esc(ps.name)})` : emergencyPowers?.martialLaw?.active ? '계엄령 선포 중' : '일반 정부';
        box.innerHTML = `
            <div class="t62-intro">민중이 일으키는 혁명입니다. 주도 이념에 따라 결과 체제가 달라져요 — 공산주의 혁명은 당-국가 체제, 민주 혁명은 독재 · 군정을 무너뜨리고 새 헌법을 세웁니다.</div>
            <div class="t62-status">지금 체제: <b>${status}</b></div>
            ${ps ? `<div class="t62-ps">
                <div class="t62-ps-title">★ 당-국가 체제</div>
                <div class="t62-dim">${esc(ps.name)} 일당 집권 · 총서기 겸 국가주석 ${esc(president.name || '')} · 의회: 최고인민회의${(S.partyState.allies || []).length ? ` · 우당 ${S.partyState.allies.map(id => esc(partyById(id)?.name || '?')).join(' · ')}` : ''}</div>
                <button type="button" class="t62-btn" data-act="yesno">🗳 찬반 선거 치르기 (최고인민회의 대의원)</button>
                <div class="t62-dim t62-small">벗어나려면 아래에서 민주 혁명을 일으키세요.</div>
            </div>` : ''}
            <label class="t62-dim">주도 이념</label>
            <div class="system-radio-group">
                <button type="button" class="system-radio-btn ${kind === 'democratic' ? 'active' : ''}" data-kind="democratic">민주 혁명</button>
                <button type="button" class="system-radio-btn ${kind === 'communist' ? 'active' : ''}" data-kind="communist" ${ps ? 'disabled' : ''}>공산주의 혁명</button>
            </div>
            <label class="t62-dim">혁명 정당 ${kind === 'democratic' ? '(없어도 됨 — 시민 혁명)' : ''}</label>
            <select data-pick="party">
                ${kind === 'democratic' ? '<option value="">— 시민 혁명 (정당 없음) —</option>' : ''}
                ${cands.map(x => `<option value="${esc(x.id)}" ${String(x.id) === String(ui.partyId) ? 'selected' : ''}>${esc(x.name)} · ${esc(typeof ideologyName === 'function' ? (ideologyName(x.ideologyId) || '') : '')} · 지지율 ${support(x.id)}%${isGovParty(x) ? ' · 여당' : ''}</option>`).join('')}
            </select>
            ${kind === 'communist' && p ? `<details class="t62-allies" open><summary class="t62-dim">우당(통일전선)으로 남길 정당 — 고르지 않은 정당은 활동 금지</summary>
                ${cands.filter(x => x !== p).map(x => `<label class="t62-row"><input type="checkbox" data-ally="${esc(x.id)}" ${ui.allies[x.id] ? 'checked' : ''}> ${esc(x.name)}</label>`).join('') || '<div class="t62-dim">다른 정당 없음</div>'}
            </details>` : ''}
            <details class="t62-identity"><summary class="t62-dim">혁명 뒤 국호 · 국기 바꾸기 (선택)</summary>
                <div class="t62-row"><input type="text" data-id="name" placeholder="새 국호 (비우면 그대로)" value="${esc(ui.newName)}"></div>
                <div class="t62-row"><label class="leader-photo-box t62-flag" title="새 국기">${ui.newFlag ? `<img src="${ui.newFlag}" alt="">` : '<span class="photo-ph">🏳️</span>'}<input type="file" accept="image/*" data-id="flag"></label>
                    ${ui.newFlag ? '<button type="button" class="t62-btn" data-act="noflag">✕ 국기 빼기</button>' : '<span class="t62-dim t62-small">눌러서 새 국기 고르기</span>'}</div>
            </details>
            <div class="t62-chance">
                <div class="t62-chance-head"><span>성공 확률</span><b>${chance}%</b></div>
                <div class="t62-bar"><span style="width:${chance}%"></span></div>
                ${factors.map(x => `<div class="t62-factor"><span>${esc(x.label)}</span><span class="${x.v >= 0 ? 't62-plus' : 't62-minus'}">${x.v >= 0 ? '+' : ''}${x.v}%p</span></div>`).join('')}
                <div class="t62-dim t62-small">합계는 5~90% 사이로 맞춥니다.</div>
            </div>
            <button type="button" class="t62-go" data-act="go">✊ ${kind === 'communist' ? '공산주의 혁명' : '민주 혁명'} 일으키기</button>
            ${last ? `<div class="t62-result ${last.success ? 'ok' : 'fail'}">
                <div class="t62-result-head">${last.kind === 'yesno' ? '🗳 찬반 선거' : last.success ? '✔ 성공' : '✘ 실패'} — ${esc(kindName(last.kind))}${last.chance != null ? ` <span class="t62-dim">(확률 ${last.chance}%)</span>` : ''}</div>
                <div class="t62-dim">${last.party ? `혁명 정당: ${esc(last.party)} · ` : ''}${esc(last.date || '')}</div>
                <ul>${(last.effects || []).map(e => `<li>${esc(e)}</li>`).join('')}</ul></div>` : ''}
            ${S.log.length ? `<details class="t62-log"><summary>혁명 기록 (${S.log.length})</summary>${S.log.map(x => `<div class="t62-log-row"><span class="${x.kind === 'yesno' ? '' : x.success ? 't62-plus' : 't62-minus'}">${x.kind === 'yesno' ? '🗳' : x.success ? '✔' : '✘'}</span><span>${esc(kindName(x.kind))}${x.party ? ` · ${esc(x.party)}` : ''}${x.date ? ` · ${esc(x.date)}` : ''}${x.chance != null ? ` · ${x.chance}%` : ''}</span></div>`).join('')}</details>` : ''}`;
        box.querySelectorAll('[data-kind]').forEach(b => { b.onclick = () => { ui.kind = b.dataset.kind; ui.partyId = ''; ui.lastId = null; renderRevolution(); }; });
        const sel = box.querySelector('[data-pick="party"]'); if (sel) sel.onchange = () => { ui.partyId = sel.value; renderRevolution(); };
        box.querySelectorAll('[data-ally]').forEach(c => { c.onchange = () => { ui.allies[c.dataset.ally] = c.checked; }; });
        const nm = box.querySelector('[data-id="name"]'); if (nm) nm.oninput = () => { ui.newName = nm.value; };
        const fl = box.querySelector('[data-id="flag"]'); if (fl) fl.onchange = () => { const f = fl.files && fl.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = ev => { ui.newFlag = ev.target.result; renderRevolution(); box.querySelector('.t62-identity').open = true; }; rd.readAsDataURL(f); };
        const nf = box.querySelector('[data-act="noflag"]'); if (nf) nf.onclick = () => { ui.newFlag = ''; renderRevolution(); };
        box.querySelector('[data-act="go"]').onclick = revolt;
        const yn = box.querySelector('[data-act="yesno"]'); if (yn) yn.onclick = yesNoElection;
    }

    function refresh() {
        renderRevolution();
        renderEcPanel();
        try { window.renderCabinetDisplay && window.renderCabinetDisplay(); } catch (e) { /* 화면 준비 전 */ }
    }

    const style = document.createElement('style');
    style.textContent = `
        .t62-intro { color: #777; font-size: .78rem; line-height: 1.6; margin: 8px 0 10px; }
        .t62-status { font-size: .85rem; color: #aaa; margin-bottom: 10px; }
        .t62-row { display: flex; align-items: center; gap: 6px; margin: 4px 0; }
        .t62-row input[type=text] { flex: 1; min-width: 0; }
        .t62-row input[type=number] { width: 6em; }
        .t62-dim { color: #777; font-size: .8rem; }
        .t62-small { font-size: .72rem; }
        #contentRevolution > label.t62-dim { display: block; margin: 10px 0 4px; }
        #contentRevolution select { width: 100%; box-sizing: border-box; }
        .t62-allies, .t62-identity, .t62-manual { margin: 8px 0; font-size: .85rem; }
        .t62-allies summary, .t62-identity summary, .t62-manual summary { cursor: pointer; }
        .t62-flag { width: 72px; height: 48px; flex-shrink: 0; }
        .t62-flag img { width: 100%; height: 100%; object-fit: cover; }
        .t62-chance { border: 1px solid #333; padding: 10px; margin: 10px 0; background: rgba(255,255,255,.02); }
        .t62-chance-head { display: flex; justify-content: space-between; align-items: baseline; color: #aaa; }
        .t62-chance-head b { font-size: 1.6rem; color: #ff6b3d; }
        .t62-bar { height: 8px; background: #222; margin: 6px 0 8px; }
        .t62-bar span { display: block; height: 100%; background: #ff6b3d; }
        .t62-factor { display: flex; justify-content: space-between; gap: 8px; font-size: .78rem; color: #999; padding: 2px 0; }
        .t62-plus { color: #5fbf7f; } .t62-minus { color: #e06060; }
        .t62-go { width: 100%; cursor: pointer; font-family: inherit; font-size: 1rem; padding: 10px; background: transparent; border: 2px solid #ff6b3d; color: #ff6b3d; letter-spacing: 1px; }
        .t62-btn { cursor: pointer; font-family: inherit; font-size: .85rem; padding: 6px 12px; background: transparent; border: 1px solid #555; color: #ccc; margin-top: 6px; }
        .t62-result { margin-top: 12px; padding: 10px; border: 1px solid #333; border-left: 4px solid #888; }
        .t62-result.ok { border-left-color: #5fbf7f; } .t62-result.fail { border-left-color: #e06060; }
        .t62-result-head { font-size: 1rem; margin-bottom: 4px; }
        .t62-result ul { margin: 6px 0 0 18px; padding: 0; font-size: .82rem; color: #bbb; }
        .t62-log { margin-top: 12px; font-size: .82rem; } .t62-log summary { cursor: pointer; color: #999; }
        .t62-log-row { display: flex; gap: 6px; padding: 3px 0; color: #aaa; border-bottom: 1px solid #1c1c1c; }
        .t62-ps { border: 1px solid #c0392b; padding: 10px; margin: 0 0 12px; background: rgba(80,0,0,.2); }
        .t62-ps-title { color: #e74c3c; font-size: 1rem; margin-bottom: 4px; letter-spacing: 1px; }
        .t62-banner { margin: 0 0 10px; padding: 8px 12px; border: 1px solid #c0392b; color: #e74c3c; font-size: .9rem; background: rgba(80,0,0,.3); letter-spacing: 1px; }
        .t62-ecset { margin-top: 10px; padding: 10px; border: 1px dashed #444; }
        .t62-ecset > label.t62-dim { display: block; margin: 8px 0 4px; }
        .t62-ecset-title { color: var(--tno-neon); font-size: .9rem; }
        .t62-ec { margin: 10px 0; padding: 10px; border: 1px solid #333; }
        .t62-ec-head { color: #aaa; font-size: .82rem; margin-bottom: 6px; }
        .t62-ec-bar { position: relative; display: flex; height: 14px; background: #222; margin-bottom: 6px; }
        .t62-ec-bar span { height: 100%; }
        .t62-ec-bar i { position: absolute; top: -3px; bottom: -3px; width: 2px; background: #fff; }
        .t62-ec-row { display: flex; justify-content: space-between; font-size: .82rem; color: #bbb; padding: 2px 0; }
        .t62-dot { display: inline-block; width: 9px; height: 9px; border-radius: 50%; margin-right: 6px; }
        .t62-ec-note { margin: 6px 0; font-size: .82rem; color: #ddd; }
        .t62-ec-map { width: 100%; margin: 8px 0; }
        .t62-ec-units summary { cursor: pointer; color: #999; font-size: .82rem; }
        .t62-ec-unit { border-left: 3px solid #888; padding: 3px 8px; margin: 4px 0; font-size: .82rem; color: #ccc; }
        html[data-theme-family="modern"] .t62-intro, html[data-theme-family="modern"] .t62-dim { color: var(--m-text-3); }
        html[data-theme-family="modern"] .t62-status, html[data-theme-family="modern"] .t62-chance-head, html[data-theme-family="modern"] .t62-factor { color: var(--m-text-2); }
        html[data-theme-family="modern"] .t62-chance, html[data-theme-family="modern"] .t62-ec, html[data-theme-family="modern"] .t62-ecset { border: 1px solid var(--m-border); border-radius: 12px; background: var(--m-surface-2); }
        html[data-theme-family="modern"] .t62-bar, html[data-theme-family="modern"] .t62-ec-bar { background: var(--m-border); border-radius: 4px; overflow: hidden; }
        html[data-theme-family="modern"] .t62-go { border-radius: 12px; font-weight: 600; letter-spacing: 0; }
        html[data-theme-family="modern"] .t62-btn { border: 1px solid var(--m-border-strong); border-radius: 8px; color: var(--m-text); }
        html[data-theme-family="modern"] .t62-result { border: 1px solid var(--m-border); border-left-width: 4px; border-radius: 10px; background: var(--m-surface); }
        html[data-theme-family="modern"] .t62-result ul, html[data-theme-family="modern"] .t62-ec-row, html[data-theme-family="modern"] .t62-ec-unit, html[data-theme-family="modern"] .t62-ec-note { color: var(--m-text-2); }
        html[data-theme-family="modern"] .t62-ps, html[data-theme-family="modern"] .t62-banner { border-radius: 12px; background: color-mix(in srgb, #c0392b 8%, var(--m-surface)); }
        html[data-theme-family="modern"] .t62-ecset-title { color: var(--m-text); font-weight: 600; }
        html[data-theme-family="modern"] .t62-log-row { color: var(--m-text-2); border-bottom-color: var(--m-border); }
    `;
    document.head.appendChild(style);
    window.addEventListener('load', () => setTimeout(refresh, 0));
})();
