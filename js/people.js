// ===== 1.6.1 — 인간은 자유롭게 태어났다 "L'homme est né libre." (사람 · 시민 · 이민자) =====
// 1.6.1 미리보기(예전 teaser61)에서 본 게임으로 옮겨 왔다 — 본 게임 · 모든 미리보기 화면에서 돈다 (로고 제작 화면만 빼고).
// 국가 › 사람 탭: 인물을 미리 만들어 두고(이름 · 사진 · 이념 · 소속 정당 · 파벌), 의석 · 당직 · 내각 자리에 배정한다.
//  - 자리(지역구 · 비례 · 무소속 의원, 당수 · 원내대표, 대통령 · 총리 · 부총리 · 내각 구성원)에는 personId를 붙여 연결하고,
//    인물의 이름 · 사진을 고치면 연결된 모든 자리에 반영한다.
//  - 지역구 후보: 선거 전에 인물을 지역구 후보로 내세우면, 총선 · 보궐선거 결과를 반영할 때 그 지역구에서 인물의 정당이
//    이긴 의석에 바로 배정한다 (후보가 없으면 같은 정당의 현역이 다시 그 자리에). 낙선해도 인물은 남는다.
//  - 선거 · 당적 변경 · 궐석으로 의석이 사라져도 인물은 사람 탭에 그대로 남는다 (예전엔 자리와 함께 이름 · 사진이 사라졌다).
//  - 시민 · 이민자: 지역구 인구를 시민권자와 이민자로 나눈다 (국가 › 지역구 지도에서 "시민 / 인구"). 시민은 모든 선거에서 투표하고,
//    이민자는 선거마다(대선 · 총리 직선 / 총선 / 지방선거 / 국민투표) 투표권을 줄지 정한다 (선거 › 선거 제도).
//    이민자 성향을 따로 정하면 이민자가 투표하는 선거에서 지역구 · 전국 득표가 그만큼 섞이고, 지방선거 · 국민투표는 유권자 수도 바뀐다.
/* global parties, ideologies, chamberList, chamberDisplayName, districtMembers, districtMemberKeys, districtMemberKeysOf,
   districtMemberLabel, districtBaseKey, districtSortedKeys, districtNames, listMembers, independents, president, pm,
   collectiveChair, deputyPms, cabinetMembers, effRoleLabel, simulate, refreshUI, showCustomAlert, showCustomConfirm,
   escapeHtmlText, ideologyName, startDragReorder, formatNationDate, elecLastResults, elecLastResult,
   districtPopulation, districtGrid, districtMapMode, elecStore, getElecTargets, renderDistrictListPanel, districtRenderNamePanel,
   selectedDistrictKey, districtChamber */
(function () {
    'use strict';
    const root = document.documentElement;
    if (root.getAttribute('data-app-mode') === 'logo') return;

    const esc = s => (typeof escapeHtmlText === 'function' ? escapeHtmlText(String(s ?? '')) : String(s ?? ''));
    const uid = () => 'h' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const partyById = id => parties.find(p => String(p.id) === String(id)) || null;
    const sameId = (a, b) => a != null && b != null && String(a) === String(b);
    const IND = 9999;
    const chs = () => (typeof chamberList === 'function' ? chamberList() : ['house']);
    const chName = ch => (typeof chamberDisplayName === 'function' ? chamberDisplayName(ch) : ch);

    // ---- 상태 (세이브의 people 칸 — 1.6.1 미리보기 세이브는 teaser61 칸) ----
    //   people: [{ id, name, photo, ideologyId, partyId, factionId, bio }]
    //   candidates: { [chamber]: { [지역구 키]: [personId] } }
    //   lastElection: { date, chamber, elected: [{ personId, place }], lost: [{ personId, place }] } | null
    //   citizens: { house|senate|third: { [지역구 키]: 시민권자 수 } } — 비우면 그 지역구 인구 전체가 시민
    //   migrantVote: { presidential, general, local, referendum } — 그 선거에서 이민자도 투표하는지
    //   opinion: { split, migrant } — 여론의 시민 / 이민자 성향 (아래 "여론: 시민 / 이민자 성향")
    //     split: 시민 / 이민자 성향 따로 정하기 (기본 켬) · migrant: 이민자 성향 { svgTendency, regionTendency, tendencyData, prob } | null(아직 시민과 같음)
    //   migrantLean: 예전(전국 % 하나) 이민자 성향 — 불러올 때 opinion.migrant의 지지율로 옮긴다
    let S = fresh();
    function fresh() { return { people: [], candidates: {}, lastElection: null, citizens: { house: {}, senate: {}, third: {} }, migrantVote: { presidential: false, general: false, local: false, referendum: false }, opinion: { split: true, migrant: null } }; }
    const ui = { q: '', filter: 'all', openId: null };
    // 여론의 이민자 탭을 보는 동안에는 본 게임 성향 · 지지율 변수에 이민자 성향이 들어가 있다 ('migrant')
    let layer = 'citizen';
    const CHS3 = ['house', 'senate', 'third'];

    const origGet = window.getAppState;
    window.getAppState = function () {
        const was = layer;
        swapOut(); // 이민자 탭을 보는 중이어도 시민 성향은 시민 칸에, 이민자 성향은 people.opinion에
        const st = origGet.apply(this, arguments);
        if (st && typeof st === 'object') st.people = JSON.parse(JSON.stringify(S));
        if (was === 'migrant') swapIn();
        return st;
    };
    const origSet = window.setAppState;
    window.setAppState = function (state) {
        swapOut();
        const r = origSet.apply(this, arguments);
        const src = state && (state.people || state.teaser61);
        S = { ...fresh(), ...(src && typeof src === 'object' ? JSON.parse(JSON.stringify(src)) : {}) };
        if (!Array.isArray(S.people)) S.people = [];
        if (!S.candidates || typeof S.candidates !== 'object') S.candidates = {};
        const f = fresh();
        S.citizens = { ...f.citizens, ...(S.citizens && typeof S.citizens === 'object' ? S.citizens : {}) };
        S.migrantVote = { ...f.migrantVote, ...(S.migrantVote && typeof S.migrantVote === 'object' ? S.migrantVote : {}) };
        const op = S.opinion && typeof S.opinion === 'object' ? S.opinion : {};
        S.opinion = { split: op.split !== false, migrant: op.migrant ? normMig(op.migrant) : null };
        // 예전 세이브: 전국 % 하나로 정한 이민자 성향 → 이민자 지지율 (원마다 같은 값, 지역구 성향은 시민 것에서 출발)
        const old = S.migrantLean;
        if (!op.migrant && old && old.on && old.values && Object.values(old.values).some(v => Number(v) > 0)) {
            const m = citizenSnapshot();
            CHS3.forEach(ch => { m.prob[ch] = Object.fromEntries(Object.entries(old.values).map(([id, v]) => [id, { prob: Number(v) || 0, err: 0 }])); });
            S.opinion.migrant = m;
        }
        delete S.migrantLean;
        refresh();
        renderMigrantCard();
        renderOverview();
        if (document.getElementById('mainContentElection')?.classList.contains('active') && /^elecSubTabM/.test(document.querySelector('#mainContentElection > .sub-tab-container .sub-tab-btn.active')?.id || '')) {
            try { elecSwitchSub(elecActiveSub()); } catch (e) { /* 화면 준비 전 */ }
        }
        return r;
    };
    const personById = id => S.people.find(p => p.id === id) || null;

    // ---- 자리 목록 — 인물을 앉힐 수 있는 모든 자리 { key, kind, label, group, get(), set(name, photo, personId) } ----
    function seats() {
        const out = [];
        chs().forEach(ch => {
            const cn = chName(ch);
            districtMemberKeys(ch).forEach(key => {
                const m = districtMembers[ch][key];
                if (!m || m.vacant) return;
                const party = partyById(m.partyId);
                const ind = party && party.ideologyId === IND ? independents.find(x => x.chamber === ch && x.districtKey === key) : null;
                out.push({
                    key: `d:${ch}:${key}`, kind: 'district', group: `${cn} 지역구`, partyId: m.partyId,
                    label: `${districtMemberLabel(ch, key)} (${party ? party.name : '?'})`,
                    obj: m, ind,
                    name: () => (ind ? ind.name : m.name) || '',
                });
            });
            parties.forEach(p => (listMembers[ch]?.[p.id] || []).forEach((m, i) => {
                if (!m || m.vacant) return;
                out.push({ key: `l:${ch}:${p.id}:${m.id}`, kind: 'list', group: `${cn} 비례대표`, partyId: p.id, label: `${p.name} ${i + 1}번`, obj: m, name: () => m.name || '' });
            }));
            independents.filter(x => x.chamber === ch && !x.districtKey).forEach((x, i) => {
                out.push({ key: `i:${x.id}`, kind: 'independent', group: `${cn} 무소속`, partyId: (parties.find(p => p.ideologyId === IND) || {}).id, label: `무소속 ${i + 1}`, obj: x, name: () => x.name || '' });
            });
        });
        parties.filter(p => p.ideologyId !== IND).forEach(p => {
            out.push({ key: `pl:${p.id}`, kind: 'leader', group: '당직', partyId: p.id, label: `${p.name} 당수`, obj: p, nameKey: 'leaderName', photoKey: 'leaderPhoto', pidKey: 'leaderPersonId', name: () => p.leaderName || '' });
            // 원내대표는 원마다 (양원제 · 삼원제) — 하원은 예전 칸(floorLeaderName …), 상원 · 삼원은 p.floorLeaders[원]
            const flChs = typeof floorLeaderChambers === 'function' ? floorLeaderChambers(p) : ['house'];
            const multi = chs().length > 1;
            flChs.forEach(ch => {
                if (ch === 'house' || !multi) {
                    out.push({ key: `pf:${p.id}`, kind: 'floor', group: '당직', partyId: p.id, label: `${p.name} 원내대표${multi ? ` (${chName('house')})` : ''}`, obj: p, nameKey: 'floorLeaderName', photoKey: 'floorLeaderPhoto', pidKey: 'floorLeaderPersonId', name: () => p.floorLeaderName || '' });
                } else {
                    p.floorLeaders = p.floorLeaders || {};
                    const f = p.floorLeaders[ch] = p.floorLeaders[ch] || { name: '', photo: '' };
                    out.push({ key: `pf:${p.id}:${ch}`, kind: 'floor', group: '당직', partyId: p.id, label: `${p.name} 원내대표 (${chName(ch)})`, obj: f, nameKey: 'name', photoKey: 'photo', pidKey: 'personId', name: () => f.name || '' });
                }
            });
        });
        const role = k => { try { return effRoleLabel(k); } catch (e) { return k; } };
        out.push({ key: 'c:president', kind: 'cabinet', group: '내각', label: role('president'), obj: president, name: () => president.name || '' });
        out.push({ key: 'c:pm', kind: 'cabinet', group: '내각', label: role('pm'), obj: pm, name: () => pm.name || '' });
        if (typeof collectiveChair !== 'undefined' && collectiveChair) out.push({ key: 'c:chair', kind: 'cabinet', group: '내각', label: '집단지도체제 의장', obj: collectiveChair, name: () => collectiveChair.name || '' });
        (deputyPms || []).forEach(d => out.push({ key: `c:dpm:${d.id}`, kind: 'cabinet', group: '내각', label: d.position || '부총리', obj: d, name: () => d.name || '' }));
        (cabinetMembers || []).forEach(c => out.push({ key: `c:cm:${c.id}`, kind: 'cabinet', group: '내각', label: c.position || '내각 구성원', obj: c, name: () => c.name || '' }));
        // 의장 · 부의장 (원마다)
        if (typeof chamberLeaders !== 'undefined' && chamberLeaders) chs().forEach(ch => {
            const L = chamberLeaders[ch];
            if (!L) return;
            if (L.speaker) out.push({ key: `sp:${ch}`, kind: 'speaker', group: '의장단', label: `${chName(ch)} 의장`, obj: L.speaker, name: () => L.speaker.name || '' });
            const deps = L.deputies || [];
            deps.forEach((d, i) => out.push({ key: `dp:${ch}:${d.id}`, kind: 'speaker', group: '의장단', label: `${chName(ch)} 부의장${deps.length > 1 ? i + 1 : ''}`, obj: d, name: () => d.name || '' }));
        });
        // 파벌 대표
        parties.forEach(p => (p.factions || []).forEach(f => out.push({ key: `fl:${p.id}:${f.id}`, kind: 'leader', group: '당직', partyId: p.id, label: `${p.name} · ${f.name || '파벌'} 대표`, obj: f, nameKey: 'leaderName', photoKey: 'leaderPhoto', pidKey: 'leaderPersonId', name: () => f.leaderName || '' })));
        // 현직 지방 단체장 (선거 › 지방선거 — js/popvote.js)
        if (window.PopVote && typeof PopVote.peopleSeats === 'function') {
            try { PopVote.peopleSeats().forEach(h => out.push({ key: `lh:${h.key}`, kind: 'local', group: '지방 단체장', partyId: h.partyId, label: h.label, obj: h.obj, name: () => h.obj.name || '' })); } catch (e) { /* 지방선거 준비 전 */ }
        }
        // 다른 화면이 더하는 자리 (미리보기의 왕실 등): window.HemiPeopleSeats = [{ seats: () => [{ key, group, label, obj, … }], refresh }]
        (window.HemiPeopleSeats || []).forEach(src => { try { (src.seats() || []).forEach(x => out.push({ kind: 'extra', name: () => x.obj[x.nameKey || 'name'] || '', ...x })); } catch (e) { /* 그 화면 준비 전 */ } });
        return out;
    }
    const pidOf = s => s.obj[s.pidKey || 'personId'];
    // 의석의 원 — 한 사람은 한 원에 의석 하나만 (지역구에 당선되면 같은 원의 비례 자리는 비운다)
    const SEAT_KINDS = ['district', 'list', 'independent'];
    function seatChamber(s) {
        if (s.kind === 'district' || s.kind === 'list') return s.key.split(':')[1];
        if (s.kind === 'independent') return s.obj.chamber;
        return null;
    }
    function seatPerson(s, person) {
        const ch = seatChamber(s);
        if (ch) seats().forEach(o => { if (o.key !== s.key && SEAT_KINDS.includes(o.kind) && seatChamber(o) === ch && pidOf(o) === person.id) write(o, null); });
        write(s, person);
    }
    function write(s, person) {
        const nk = s.nameKey || 'name', pk = s.photoKey || 'photo', ik = s.pidKey || 'personId';
        if (person) {
            s.obj[nk] = person.name || '';
            s.obj[pk] = person.photo || '';
            s.obj[ik] = person.id;
            if (s.ind) { s.ind.name = person.name || ''; s.ind.photo = person.photo || ''; s.ind.personId = person.id; }
            if (s.kind === 'cabinet') {
                s.obj.linkedSeat = null; // 사람 탭에서 정한 인물이 우선 — 의원 연결은 풀어 둔다
                if (person.partyId != null) s.obj.partyId = partyById(person.partyId) ? partyById(person.partyId).id : s.obj.partyId;
            }
        } else {
            s.obj[nk] = ''; s.obj[pk] = ''; delete s.obj[ik];
            if (s.ind) { s.ind.name = ''; s.ind.photo = ''; delete s.ind.personId; }
        }
    }
    const positionsOf = id => seats().filter(s => pidOf(s) === id);
    // 이름 · 사진을 고치면 연결된 모든 자리에 반영
    function push(person) { positionsOf(person.id).forEach(s => write(s, person)); }
    function rerender() {
        try { simulate(); } catch (e) { /* 화면 준비 전 */ }
        try { refreshUI(); } catch (e) { /* 화면 준비 전 */ }
        ['renderMembersList', 'renderCabinetDisplay', 'renderCabinetMembersList', 'renderPartyInfoList', 'renderPresidentCard', 'renderPmCard', 'renderChamberLeaders'].forEach(f => { try { if (typeof window[f] === 'function') window[f](); } catch (e) { /* 없음 */ } });
        try { if (window.PopVote) PopVote.refresh(); } catch (e) { /* 지방선거 준비 전 */ }
        (window.HemiPeopleSeats || []).forEach(src => { try { if (typeof src.refresh === 'function') src.refresh(); } catch (e) { /* 없음 */ } });
    }
    function assign(personId, seatKey) {
        const person = personById(personId);
        const s = seats().find(x => x.key === seatKey);
        if (!person || !s) return;
        const prev = pidOf(s) && pidOf(s) !== personId ? personById(pidOf(s)) : null;
        seatPerson(s, person);
        rerender(); render();
        if (prev) showCustomAlert(`${s.label} 자리에 있던 ${prev.name || '(이름 없음)'}은(는) 자리에서 물러났습니다 (사람 탭에는 그대로 남아요).`);
    }
    function unassign(seatKey) {
        const s = seats().find(x => x.key === seatKey);
        if (!s) return;
        write(s, null);
        rerender(); render();
    }

    // ---- 지역구 후보 ----
    const candOf = ch => S.candidates[ch] || (S.candidates[ch] = {});
    function candidaciesOf(id) {
        const out = [];
        Object.entries(S.candidates).forEach(([ch, m]) => Object.entries(m || {}).forEach(([key, ids]) => { if ((ids || []).includes(id)) out.push({ ch, key }); }));
        return out;
    }
    const placeName = (ch, key) => `${chName(ch)} · ${(districtNames[ch] && districtNames[ch][key]) || key}`;
    // 선거 결과를 반영한 뒤: 후보 → 그 지역구에서 후보의 정당이 이긴 의석에 배정, 후보가 없으면 같은 정당 현역을 다시 그 자리에
    function placeAfterElection(ch, incumbents, onlyBases) {
        const elected = [], lost = [];
        const dm = districtMembers[ch] || {};
        const bases = onlyBases || Array.from(new Set([...Object.keys(candOf(ch)), ...incumbents.map(x => x.base)]));
        bases.forEach(base => {
            const keys = districtMemberKeysOf(ch, base).filter(k => dm[k] && !dm[k].vacant);
            const cands = (candOf(ch)[base] || []).map(personById).filter(Boolean);
            const used = new Set();
            keys.forEach(k => {
                const m = dm[k];
                if (m.personId && personById(m.personId)) return;
                const pick = cands.find(p => !used.has(p.id) && sameId(p.partyId, m.partyId))
                    || incumbents.map(x => x.base === base && sameId(x.partyId, m.partyId) ? personById(x.personId) : null).find(p => p && !used.has(p.id) && !cands.some(c => sameId(c.partyId, p.partyId) && c.id !== p.id));
                if (!pick) return;
                used.add(pick.id);
                const s = seats().find(x => x.key === `d:${ch}:${k}`);
                if (s) { seatPerson(s, pick); elected.push({ personId: pick.id, place: placeName(ch, base) }); }
            });
            cands.forEach(p => { if (!used.has(p.id)) lost.push({ personId: p.id, place: placeName(ch, base) }); });
            delete candOf(ch)[base]; // 이번 선거에 쓴 후보 명단은 비운다
        });
        return { elected, lost };
    }
    const incumbentsOf = ch => districtMemberKeys(ch).map(k => { const m = districtMembers[ch][k]; return m && m.personId ? { base: districtBaseKey(ch, k), personId: m.personId, partyId: m.partyId } : null; }).filter(Boolean);
    const origApply = window.elecApplyToParliament;
    if (typeof origApply === 'function') {
        window.elecApplyToParliament = function () {
            const pending = Object.keys(typeof elecLastResults !== 'undefined' ? elecLastResults : {});
            if (!pending.length && typeof elecLastResult !== 'undefined' && elecLastResult && !elecLastResult.applied) pending.push(elecLastResult.chamber || (elecLastResult.isSenate ? 'senate' : 'house'));
            const inc = Object.fromEntries(pending.map(ch => [ch, incumbentsOf(ch)]));
            const r = origApply.apply(this, arguments);
            if (pending.length) {
                const res = { date: formatNationDate(), chamber: pending.map(chName).join(' · '), elected: [], lost: [] };
                pending.forEach(ch => { const x = placeAfterElection(ch, inc[ch] || []); res.elected.push(...x.elected); res.lost.push(...x.lost); });
                if (res.elected.length || res.lost.length) S.lastElection = res;
                rerender(); refresh();
            }
            return r;
        };
    }
    const origBy = window.elecRunByElection;
    if (typeof origBy === 'function') {
        window.elecRunByElection = async function (chamber, vacantKeys) {
            const bases = Array.from(new Set((vacantKeys || []).map(k => districtBaseKey(chamber, k))));
            const r = await origBy.apply(this, arguments);
            const x = placeAfterElection(chamber, [], bases);
            if (x.elected.length || x.lost.length) S.lastElection = { date: formatNationDate(), chamber: chName(chamber) + ' 보궐선거', ...x };
            rerender(); refresh();
            return r;
        };
    }

    // ---- 지금 자리(의원 · 당직 · 파벌 대표 · 의장단 · 대통령 · 내각 · 지방 단체장 · 왕실 …)에 적힌 이름으로 인물 만들기 (같은 이름은 한 사람으로) ----
    function importFromSeats() {
        const byName = new Map(S.people.map(p => [p.name.trim(), p]));
        let made = 0, linked = 0;
        seats().forEach(s => {
            if (pidOf(s) && personById(pidOf(s))) return;
            const nm = s.name().trim();
            if (!nm) return;
            let p = byName.get(nm);
            if (!p) {
                const party = partyById(s.partyId != null ? s.partyId : s.obj.partyId);
                const photo = s.ind ? s.ind.photo : s.obj[s.photoKey || 'photo'];
                p = { id: uid(), name: nm, photo: photo || '', ideologyId: party ? party.ideologyId : null, partyId: party && party.ideologyId !== IND ? party.id : null, factionId: s.obj.factionId || null, bio: '' };
                S.people.push(p); byName.set(nm, p); made++;
            }
            write(s, p); linked++;
        });
        rerender(); render();
        showCustomAlert(made || linked ? `인물 ${made}명을 새로 만들고, 자리 ${linked}곳을 사람 탭의 인물과 연결했습니다.` : '이름이 적힌 자리가 없습니다 — 의원 · 당수 · 의장 · 내각 같은 자리에 이름을 적거나, 여기서 사람을 직접 추가하세요.');
    }

    // ---- 탭: 국가 › 사람 ----
    function el(html) { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }
    (function addTab() {
        const nation = document.getElementById('mainContentNation');
        const bar = nation && nation.querySelector(':scope > .sub-tab-container');
        if (!bar) return;
        const settingsBtn = document.getElementById('subTabNationSettings');
        bar.insertBefore(el(`<button class="sub-tab-btn" onclick="switchSubTab('nation','people')" id="subTabPeople">사람</button>`), settingsBtn);
        nation.appendChild(el(`<div id="contentPeople" class="sub-tab-content"></div>`));
    })();
    const origSwitch = window.switchSubTab;
    window.switchSubTab = function (main, sub) {
        const r = origSwitch.apply(this, arguments);
        if (main === 'nation' && sub === 'people') render();
        return r;
    };

    function ideologyOptions(cur) {
        const opts = ['<option value="">— 이념 없음 —</option>'];
        (ideologies || []).forEach(i => {
            opts.push(`<option value="${i.id}" ${sameId(i.id, cur) ? 'selected' : ''}>${esc(i.name)}</option>`);
            (i.subs || []).forEach(sb => opts.push(`<option value="${sb.id}" ${sameId(sb.id, cur) ? 'selected' : ''}>　└ ${esc(sb.name)}</option>`));
        });
        return opts.join('');
    }
    function seatOptions(person) {
        const groups = new Map();
        seats().forEach(s => {
            const holder = pidOf(s) ? personById(pidOf(s)) : null;
            if (holder && holder.id === person.id) return;
            const now = holder ? holder.name : s.name();
            if (!groups.has(s.group)) groups.set(s.group, []);
            groups.get(s.group).push(`<option value="${esc(s.key)}">${esc(s.label)}${now ? ` — 지금: ${esc(now)}` : ''}</option>`);
        });
        return '<option value="">＋ 자리 배정…</option>' + [...groups.entries()].map(([g, o]) => `<optgroup label="${esc(g)}">${o.join('')}</optgroup>`).join('')
            + '<optgroup label="내각"><option value="__newcm">새 내각 구성원 자리로 추가</option></optgroup>';
    }
    function candOptions() {
        const out = ['<option value="">＋ 지역구 후보로…</option>'];
        chs().forEach(ch => {
            const keys = typeof districtSortedKeys === 'function' ? districtSortedKeys(ch) : [];
            if (!keys.length) return;
            out.push(`<optgroup label="${esc(chName(ch))}">${keys.map(k => `<option value="${esc(ch)}|${esc(k)}">${esc((districtNames[ch] && districtNames[ch][k]) || k)}</option>`).join('')}</optgroup>`);
        });
        return out.join('');
    }
    const KIND_ICON = { district: '🗳', list: '📜', independent: '🗳', leader: '★', floor: '☆', cabinet: '🏛' };

    function render() {
        const box = document.getElementById('contentPeople');
        if (!box || !box.classList.contains('active')) return;
        const all = seats();
        const posMap = new Map();
        all.forEach(s => { const id = pidOf(s); if (id) { if (!posMap.has(id)) posMap.set(id, []); posMap.get(id).push(s); } });
        const q = ui.q.trim().toLowerCase();
        const list = S.people.filter(p => {
            if (q && !(p.name || '').toLowerCase().includes(q)) return false;
            const n = (posMap.get(p.id) || []).length;
            if (ui.filter === 'seated' && !n) return false;
            if (ui.filter === 'none' && n) return false;
            if (ui.filter === 'cand' && !candidaciesOf(p.id).length) return false;
            return true;
        });
        const counts = { all: S.people.length, seated: S.people.filter(p => posMap.has(p.id)).length };
        counts.none = counts.all - counts.seated;
        counts.cand = S.people.filter(p => candidaciesOf(p.id).length).length;
        const le = S.lastElection;
        box.innerHTML = `
            <div class="t61-intro">인물을 미리 만들어 두고 의석 · 당직 · 내각 자리에 배정합니다. 이름 · 사진을 여기서 고치면 배정된 모든 자리에 반영되고, 선거 · 당적 변경 · 궐석으로 자리가 사라져도 인물은 남아요.</div>
            <div class="t61-bar">
                <button type="button" class="t61-btn t61-primary" data-act="add">＋ 사람 추가</button>
                <button type="button" class="t61-btn" data-act="import" title="의원 · 당수 · 원내대표 · 파벌 대표 · 의장단 · 대통령(국왕) · 내각 · 지방 단체장 등 이름이 적힌 모든 자리에서 인물을 만들고 연결 (같은 이름은 한 사람)">모든 자리에서 가져오기</button>
                <input type="text" class="t61-search" data-ui="q" placeholder="이름 검색" value="${esc(ui.q)}">
            </div>
            ${popSummaryHtml()}
            <div class="system-radio-group t61-filter">${[['all', '전체'], ['seated', '자리 있음'], ['none', '자리 없음'], ['cand', '지역구 후보']].map(([k, t]) => `<button type="button" class="system-radio-btn ${ui.filter === k ? 'active' : ''}" data-filter="${k}">${t} <span class="t61-n">${counts[k]}</span></button>`).join('')}</div>
            ${le ? `<div class="t61-result"><b>지난 선거 (${esc(le.chamber)}${le.date ? ` · ${esc(le.date)}` : ''})</b>
                ${le.elected.length ? `<div>✔ 당선 · 배정: ${le.elected.map(x => `${esc((personById(x.personId) || {}).name || '?')} <span class="t61-dim">(${esc(x.place)})</span>`).join(', ')}</div>` : ''}
                ${le.lost.length ? `<div>✘ 낙선: ${le.lost.map(x => `${esc((personById(x.personId) || {}).name || '?')} <span class="t61-dim">(${esc(x.place)})</span>`).join(', ')} — 사람 탭에 남아 다음 선거에 다시 나갈 수 있어요</div>` : ''}
                <button type="button" class="t61-x" data-act="clearres" title="닫기">✕</button></div>` : ''}
            <div id="t61List" class="t61-list">${list.length ? list.map(p => card(p, posMap.get(p.id) || [])).join('') : `<div class="t61-empty">${S.people.length ? '조건에 맞는 사람이 없습니다.' : '아직 사람이 없습니다. "＋ 사람 추가"로 만들거나, "모든 자리에서 가져오기"로 지금 자리에 적힌 이름을 인물로 옮겨 보세요.'}</div>`}</div>`;
        bind(box);
        box.querySelector('[data-act="migrants"]')?.addEventListener('click', () => { switchSubTab('vote', 'elecSettings'); setTimeout(() => document.getElementById('t61MigrantCard')?.scrollIntoView({ block: 'center' }), 50); });
    }
    function card(p, pos) {
        const party = partyById(p.partyId);
        const color = party ? party.color : '#777';
        const facs = party ? (party.factions || []) : [];
        const cands = candidaciesOf(p.id);
        const open = ui.openId === p.id;
        return `<div class="t61-card ${open ? 'open' : ''}" data-id="${esc(p.id)}" style="--pc:${esc(color)}">
            <div class="t61-head">
                <span class="drag-handle t61-handle" title="끌어서 순서 바꾸기">⋮⋮</span>
                <label class="leader-photo-box t61-photo" title="사진">${p.photo ? `<img src="${p.photo}" alt="">` : '<div class="photo-ph">👤</div>'}<input type="file" accept="image/*" data-f="photo"></label>
                <div class="t61-main">
                    <input type="text" class="t61-name" data-f="name" value="${esc(p.name)}" placeholder="이름">
                    <div class="t61-sub"><i class="t61-dot"></i>${esc(party ? party.name : '무소속 · 정당 없음')}${p.ideologyId != null && ideologyName(+p.ideologyId) ? ` · ${esc(ideologyName(+p.ideologyId))}` : ''}</div>
                    <div class="t61-chips">${pos.map(s => `<span class="t61-chip">${KIND_ICON[s.kind] || '•'} ${esc(s.kind === 'district' || s.kind === 'list' || s.kind === 'independent' ? `${s.group} · ${s.label}` : s.label)}<button type="button" data-unassign="${esc(s.key)}" title="자리에서 빼기 (인물은 남음)">×</button></span>`).join('')}
                        ${cands.map(c => `<span class="t61-chip t61-cand">🎯 ${esc(placeName(c.ch, c.key))} 후보<button type="button" data-uncand="${esc(c.ch)}|${esc(c.key)}" title="후보 취소">×</button></span>`).join('')}
                        ${!pos.length && !cands.length ? '<span class="t61-none">자리 없음</span>' : ''}</div>
                </div>
                <button type="button" class="t61-more" data-act="toggle" title="자세히">${open ? '▴' : '▾'}</button>
            </div>
            ${open ? `<div class="t61-body">
                <div class="t61-grid">
                    <label>이념<select data-f="ideologyId">${ideologyOptions(p.ideologyId)}</select></label>
                    <label>소속 정당<select data-f="partyId"><option value="">— 정당 없음 —</option>${parties.filter(x => x.ideologyId !== IND).map(x => `<option value="${esc(x.id)}" ${sameId(x.id, p.partyId) ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></label>
                    <label>파벌<select data-f="factionId" ${facs.length ? '' : 'disabled'}><option value="">— 파벌 없음 —</option>${facs.map(f => `<option value="${esc(f.id)}" ${sameId(f.id, p.factionId) ? 'selected' : ''}>${esc(f.name)}</option>`).join('')}</select></label>
                </div>
                <div class="t61-stack"><select data-act="assign">${seatOptions(p)}</select><select data-act="cand">${candOptions()}</select></div>
                <textarea data-f="bio" rows="2" placeholder="메모 · 약력">${esc(p.bio || '')}</textarea>
                <div class="t61-row t61-end"><button type="button" class="t61-btn t61-danger" data-act="del">사람 지우기</button></div>
            </div>` : ''}
        </div>`;
    }
    function bind(box) {
        const on = (sel, fn) => box.querySelectorAll(sel).forEach(b => { b.onclick = e => fn(b, e); });
        on('[data-act="add"]', () => { const p = { id: uid(), name: '', photo: '', ideologyId: null, partyId: null, factionId: null, bio: '' }; S.people.unshift(p); ui.openId = p.id; ui.filter = 'all'; ui.q = ''; render(); const n = box.querySelector(`.t61-card[data-id="${p.id}"] .t61-name`); if (n) n.focus(); });
        on('[data-act="import"]', importFromSeats);
        on('[data-act="clearres"]', () => { S.lastElection = null; render(); });
        on('[data-filter]', b => { ui.filter = b.dataset.filter; render(); });
        const q = box.querySelector('[data-ui="q"]');
        if (q) q.oninput = () => { ui.q = q.value; const pos = q.selectionStart; render(); const q2 = box.querySelector('[data-ui="q"]'); if (q2) { q2.focus(); q2.setSelectionRange(pos, pos); } };
        box.querySelectorAll('.t61-card').forEach(c => {
            const p = personById(c.dataset.id); if (!p) return;
            const q1 = s => c.querySelector(s);
            q1('[data-act="toggle"]').onclick = () => { ui.openId = ui.openId === p.id ? null : p.id; render(); };
            c.querySelectorAll('[data-f]').forEach(i => {
                const f = i.dataset.f;
                if (f === 'photo') i.onchange = () => { const file = i.files && i.files[0]; if (!file) return; const rd = new FileReader(); rd.onload = e => { p.photo = e.target.result; push(p); rerender(); render(); }; rd.readAsDataURL(file); };
                else if (f === 'name') { i.oninput = () => { p.name = i.value; }; i.onchange = () => { push(p); rerender(); render(); }; }
                else if (f === 'bio') i.oninput = () => { p.bio = i.value; };
                else i.onchange = () => {
                    const v = i.value === '' ? null : i.value;
                    if (f === 'partyId') { const party = partyById(v); p.partyId = party ? party.id : null; p.factionId = null; if (party && p.ideologyId == null) p.ideologyId = party.ideologyId; }
                    else if (f === 'ideologyId') p.ideologyId = v == null ? null : +v;
                    else p[f] = v;
                    render();
                };
            });
            const as = q1('[data-act="assign"]');
            if (as) as.onchange = () => {
                if (as.value === '__newcm') {
                    const cm = { id: Date.now(), name: '', position: '장관', photo: '', partyId: null, linkedSeat: null };
                    cabinetMembers.push(cm);
                    assign(p.id, `c:cm:${cm.id}`);
                } else if (as.value) assign(p.id, as.value);
            };
            const cs = q1('[data-act="cand"]');
            if (cs) cs.onchange = () => {
                if (!cs.value) return;
                const [ch, key] = cs.value.split('|');
                const list = candOf(ch)[key] || (candOf(ch)[key] = []);
                if (!list.includes(p.id)) list.push(p.id);
                if (!p.partyId) showCustomAlert('정당이 없는 후보는 당선돼도 자리에 자동으로 배정되지 않습니다 — 소속 정당을 정해 두세요 (무소속 당선은 자리 배정으로 직접).');
                render();
            };
            c.querySelectorAll('[data-unassign]').forEach(b => { b.onclick = () => unassign(b.dataset.unassign); });
            c.querySelectorAll('[data-uncand]').forEach(b => { b.onclick = () => { const [ch, key] = b.dataset.uncand.split('|'); candOf(ch)[key] = (candOf(ch)[key] || []).filter(x => x !== p.id); if (!candOf(ch)[key].length) delete candOf(ch)[key]; render(); }; });
            const del = q1('[data-act="del"]');
            if (del) del.onclick = () => showCustomConfirm(`${p.name || '(이름 없음)'}을(를) 지울까요? 배정된 자리에서도 빠집니다 (자리는 남고 이름 · 사진만 비워짐).`, () => {
                positionsOf(p.id).forEach(s => write(s, null));
                Object.keys(S.candidates).forEach(ch => Object.keys(S.candidates[ch]).forEach(k => { S.candidates[ch][k] = S.candidates[ch][k].filter(x => x !== p.id); if (!S.candidates[ch][k].length) delete S.candidates[ch][k]; }));
                S.people = S.people.filter(x => x !== p);
                rerender(); render();
            });
            const h = q1('.t61-handle');
            if (h && typeof startDragReorder === 'function' && !ui.q && ui.filter === 'all') startDragReorder(h, 't61List', '.t61-card', S.people, render);
        });
    }
    function refresh() { render(); }

    // =====================================================================
    // ---- 시민 · 이민자 — 지역구 인구 = 시민권자 + 이민자, 선거마다 이민자 투표권 ----
    // =====================================================================
    const VOTE_KINDS = [['presidential', '대선 · 총리 직선'], ['general', '총선'], ['local', '지방선거'], ['referendum', '국민투표']];
    const fmtN = n => Math.round(n).toLocaleString();
    const excludedKey = k => (typeof window.isDistrictUnrecovered === 'function' && window.isDistrictUnrecovered(k))
        || (typeof window.isDistrictVassal === 'function' && window.isDistrictVassal(k));
    function popRaw(ch, k) {
        const v = districtPopulation[ch]?.[k] ?? districtPopulation.house?.[k];
        return Number.isFinite(v) && v > 0 ? v : null;
    }
    const citRaw = (ch, k) => { const v = S.citizens[ch]?.[k] ?? S.citizens.house?.[k]; return Number.isFinite(v) && v >= 0 ? v : null; };
    // 시민권자 수 — 따로 적지 않았으면 인구 전체, 인구보다 많이 적었으면 인구까지
    function citizensOf(ch, k) {
        const pop = popRaw(ch, k), c = citRaw(ch, k);
        if (c == null) return pop;
        return pop == null ? c : Math.min(c, pop);
    }
    function migrantsOf(ch, k) {
        const pop = popRaw(ch, k);
        return pop == null ? 0 : Math.max(0, pop - (citizensOf(ch, k) || 0));
    }
    const migrantsVote = kind => !!S.migrantVote[kind];
    function totals(ch) {
        let pop = 0, cit = 0, mig = 0;
        Object.keys(districtGrid[ch] || {}).filter(k => districtGrid[ch][k] && !excludedKey(k)).forEach(k => {
            const p = popRaw(ch, k);
            if (p == null) return;
            pop += p; cit += citizensOf(ch, k) || 0; mig += migrantsOf(ch, k);
        });
        return { pop, cit, mig };
    }
    const votingParties = () => parties.filter(p => p.status !== 'banned');
    // 정당별 값 → 몫(합 1), 투표할 수 있는 정당만. 비어 있으면 null
    function sharesOf(vals) {
        if (!vals) return null;
        const list = votingParties().map(p => [String(p.id), Math.max(0, Number(vals[p.id]) || 0)]);
        const t = list.reduce((a, [, v]) => a + v, 0);
        return t > 0 ? Object.fromEntries(list.map(([id, v]) => [id, v / t])) : null;
    }
    // 따로 정한 이민자 성향이 있을 때만 (끄면 · 아직 안 정했으면 이민자도 시민과 같은 성향)
    const splitOn = () => !!(S.opinion.split && S.opinion.migrant);
    const probVals = store => Object.fromEntries(Object.entries(store || {}).filter(([id]) => id !== '__swing__').map(([id, v]) => [id, Number(v && v.prob) || 0]));
    // 이민자 전국 지지율 몫
    function migNationalShares(ch) { swapOut(); return splitOn() ? sharesOf(probVals(S.opinion.migrant.prob[ch])) : null; }
    // 이민자 지역구 몫: 지역구 성향 → 권역 성향 → 이민자 전국 지지율
    function migDistrictShares(key, ch) {
        swapOut();
        if (!splitOn()) return null;
        const M = S.opinion.migrant;
        const own = sharesOf(M.svgTendency[key] && M.svgTendency[key][ch]);
        if (own) return own;
        const rid = typeof districtRegionMap !== 'undefined' ? districtRegionMap[ch]?.[key] : null;
        const reg = rid != null ? sharesOf(M.regionTendency[ch] && M.regionTendency[ch][rid]) : null;
        return reg || sharesOf(probVals(M.prob[ch]));
    }
    // 시민 몫(shares, 합 1)과 이민자 몫(lean, 합 1)을 유권자 수로 섞는다
    function mixShares(shares, c, m, lean) {
        if (!(m > 0) || !(c + m > 0)) return shares;
        if (!lean) return shares;
        const ids = new Set([...Object.keys(shares), ...Object.keys(lean).filter(id => lean[id] > 0)]);
        const out = {};
        ids.forEach(id => { out[id] = (c * (shares[id] || 0) + m * (lean[id] || 0)) / (c + m); });
        return out;
    }

    // ---- 지방선거 · 국민투표 (js/popvote.js가 이걸 보고 유권자 수 · 득표율을 바꾼다) ----
    window.HemiVoters = {
        electorate(ch, k, kind, pop) {
            if (popRaw(ch, k) == null) return pop; // 인구를 적지 않은 지역구는 그대로 (모두 시민)
            return (citizensOf(ch, k) || 0) + (migrantsVote(kind) ? migrantsOf(ch, k) : 0);
        },
        shares(ch, k, kind, shares) {
            if (!migrantsVote(kind)) return shares;
            return mixShares(shares, citizensOf(ch, k) || 0, migrantsOf(ch, k), migDistrictShares(k, ch));
        },
        citizensOf, migrantsOf, totals,
    };

    // ---- 총선 · 대선: 이민자가 투표하면 지역구 성향과 전국 지지율에 이민자 성향을 섞어 개표한다 ----
    let ctx = null; // 지금 치르는 선거 — 'general' | 'presidential'
    const origTend = window.districtTendencyFor;
    if (typeof origTend === 'function') {
        window.districtTendencyFor = function (key, chamber) {
            const r = origTend.apply(this, arguments);
            if (!ctx || !migrantsVote(ctx) || !r || !r.values) return r;
            const m = migrantsOf(chamber, key);
            if (!(m > 0)) return r;
            const T = Object.values(r.values).reduce((a, v) => a + (Number(v) || 0), 0);
            if (T <= 0) return r;
            const base = Object.fromEntries(Object.entries(r.values).map(([id, v]) => [id, (Number(v) || 0) / T]));
            const mixed = mixShares(base, citizensOf(chamber, key) || 0, m, migDistrictShares(key, chamber));
            if (mixed === base) return r;
            return { ...r, values: Object.fromEntries(Object.entries(mixed).map(([id, v]) => [id, v * T])) };
        };
    }
    // 전국 지지율(elecStore)을 그 원의 시민 · 이민자 수로 섞어 둔 채 fn을 치르고, 끝나면 되돌린다
    function withNationalMix(kind, chambers, fn) {
        const saved = {};
        swapOut();
        if (migrantsVote(kind) && typeof elecStore === 'object') {
            chambers.forEach(ch => {
                const lean = migNationalShares(ch);
                const { cit, mig } = totals(ch);
                const store = elecStore[ch];
                if (!lean || !(mig > 0) || !store) return;
                const sumP = parties.reduce((a, p) => a + (Number(store[p.id]?.prob) || 0), 0);
                if (sumP <= 0) return;
                saved[ch] = JSON.parse(JSON.stringify(store));
                parties.forEach(p => {
                    const P = Number(store[p.id]?.prob) || 0, l = lean[String(p.id)] || 0;
                    const np = sumP * (cit * P / sumP + mig * l) / (cit + mig);
                    if (np > 0 || store[p.id]) store[p.id] = { err: 0, ...(store[p.id] || {}), prob: Math.round(np * 100) / 100 };
                });
            });
        }
        const restore = () => Object.entries(saved).forEach(([ch, snap]) => { elecStore[ch] = snap; });
        const prevCtx = ctx;
        ctx = kind;
        let r;
        try { r = fn(); } catch (e) { ctx = prevCtx; restore(); throw e; }
        if (r && typeof r.then === 'function') return r.finally(() => { ctx = prevCtx; restore(); });
        ctx = prevCtx; restore();
        return r;
    }
    const origRun = window.elecRun;
    if (typeof origRun === 'function') {
        window.elecRun = function () {
            if (ctx) return origRun.apply(this, arguments); // 여러 원을 차례로 치를 때 안쪽 호출
            const targets = typeof getElecTargets === 'function' ? getElecTargets() : ['house'];
            return withNationalMix('general', targets, () => origRun.apply(this, arguments));
        };
    }
    ['runPresidentialElection', 'runPmElection'].forEach(n => {
        const orig = window[n];
        if (typeof orig !== 'function') return;
        window[n] = function () {
            const basis = typeof presElectionChamberBasis !== 'undefined' ? presElectionChamberBasis : 'house'; // eslint-disable-line no-undef
            return withNationalMix('presidential', [basis], () => orig.apply(this, arguments));
        };
    });

    // ---- 지역구별 시민 수 입력 (국가 › 지역구 지도의 지역구 목록 · 편집 칸) — 칸에는 "시민 / 인구" ----
    function setCitizens(ch, key, value) {
        const raw = String(value).replace(/,/g, '').trim();
        const n = Math.max(0, Math.floor(Number(raw)));
        const list = districtMapMode === 'svg' ? ['house', 'senate', 'third'] : [ch];
        list.forEach(c => {
            S.citizens[c] = S.citizens[c] || {};
            if (raw === '' || !isFinite(n)) delete S.citizens[c][key]; else S.citizens[c][key] = n;
        });
        try { renderDistrictListPanel(); } catch (e) { /* 화면 전 */ }
        if (key === selectedDistrictKey) try { districtRenderNamePanel(); } catch (e) { /* 화면 전 */ }
        renderMigrantCard();
    }
    window.t61SetCitizens = setCitizens;
    const jsArg = v => JSON.stringify(String(v)).replace(/"/g, '&quot;');
    const citTitle = (ch, k) => {
        const pop = popRaw(ch, k);
        return pop == null ? '시민권자 수 — 인구를 먼저 적으세요' : `시민권자 수 (비우면 인구 전체) · 이민자 ${fmtN(migrantsOf(ch, k))}명`;
    };
    const origList = window.renderDistrictListPanel;
    if (typeof origList === 'function') {
        window.renderDistrictListPanel = function () {
            const r = origList.apply(this, arguments);
            const panel = document.getElementById('districtListPanel');
            if (!panel) return r;
            panel.querySelectorAll('.drag-card-district input[type="number"]:not(.t61-cit)').forEach(inp => {
                const m = /districtSetPopulation\('([^']*)','([^']*)'/.exec(inp.getAttribute('onchange') || '');
                if (!m || inp.previousElementSibling?.classList.contains('t61-cit-sep')) return;
                const [, ch, key] = m;
                inp.placeholder = '인구';
                const c = document.createElement('input');
                c.type = 'number'; c.min = '0'; c.step = '1'; c.className = 't61-cit'; c.placeholder = '시민';
                c.value = citRaw(ch, key) ?? '';
                c.title = citTitle(ch, key);
                c.style.cssText = inp.style.cssText.replace(/width:\s*\d+px/, 'width:74px');
                inp.style.width = '84px'; inp.style.padding = c.style.padding = '4px 3px'; // 이름 칸이 너무 좁아지지 않게 두 숫자 칸을 줄인다
                c.addEventListener('change', () => setCitizens(ch, key, c.value));
                const sep = document.createElement('span');
                sep.className = 't61-cit-sep'; sep.textContent = '/';
                inp.before(c, sep);
            });
            // 합계 줄: 총 인구 → 시민 · 이민자
            const sum = panel.firstElementChild;
            const ch = (panel.querySelector('.drag-card-district input[type="number"]:not(.t61-cit)')?.getAttribute('onchange') || '').match(/districtSetPopulation\('([^']*)'/)?.[1];
            if (sum && ch && /^총 인구/.test(sum.textContent)) {
                const t = totals(ch);
                sum.textContent = `시민 ${fmtN(t.cit)} / 인구 ${fmtN(t.pop)} · 이민자 ${fmtN(t.mig)}`;
            }
            return r;
        };
    }
    const origPopHtml = window.districtPopulationInputHtml;
    if (typeof origPopHtml === 'function') {
        window.districtPopulationInputHtml = function (ch, key, extraStyle) {
            const html = origPopHtml.apply(this, arguments);
            const pop = popRaw(ch, key);
            return html + `<div class="t61-cit-row" style="${extraStyle || ''}">
                    <span>시민</span>
                    <input type="number" min="0" step="1" placeholder="${pop == null ? '인구를 먼저 적으세요' : `비우면 인구 전체 (${fmtN(pop)})`}" value="${citRaw(ch, key) ?? ''}"
                        onchange="t61SetCitizens(${jsArg(ch)},${jsArg(key)},this.value)">
                    <span class="t61-dim">${pop == null ? '' : `이민자 ${fmtN(migrantsOf(ch, key))}명`}</span>
                </div>`;
        };
    }

    // ---- 사람 탭 위쪽 요약 ----
    function popSummaryHtml() {
        const t = totals('house');
        if (!t.pop) return '';
        const on = VOTE_KINDS.filter(([k]) => migrantsVote(k)).map(([, n]) => n);
        return `<div class="t61-pop">
                <div><b>시민 ${fmtN(t.cit)}</b> / 인구 ${fmtN(t.pop)} · 이민자 ${fmtN(t.mig)} <span class="t61-dim">(${t.pop ? (t.mig / t.pop * 100).toFixed(1) : 0}%)</span></div>
                <div class="t61-dim">이민자 투표권: ${on.length ? on.join(' · ') : '없음'} — 지역구별 시민 수는 국가 › 지역구 지도</div>
                <button type="button" class="t61-btn" data-act="migrants">선거 › 선거 제도에서 설정</button>
            </div>`;
    }

    // =====================================================================
    // ---- 여론: 시민 / 이민자 성향 (여론 › 종합 · 이민자 성향 · 이민자 지지율) ----
    // 이민자 성향은 시민 성향과 같은 모양의 데이터로 따로 둔다 (S.opinion.migrant). 이민자 탭을 열면 그 데이터를 본 게임 변수
    // (districtSvgTendency · regionTendency · tendencyData · elecStore[원])와 바꿔 끼워 시민 탭과 똑같은 화면으로 고치고,
    // 다른 탭 · 메뉴로 가거나 저장할 때 되돌린다. "따로 정하기"를 끄면 이민자 탭은 시민 데이터를 그대로 고치고(동기화),
    // 개표에서도 이민자가 시민과 같은 성향으로 투표한다 — 시민 · 인구 수는 따로 (국가 › 지역구 지도).
    // =====================================================================
    const clone = o => JSON.parse(JSON.stringify(o == null ? {} : o));
    function normMig(m) {
        m = m && typeof m === 'object' ? m : {};
        return { svgTendency: m.svgTendency || {}, regionTendency: { house: {}, senate: {}, third: {}, ...(m.regionTendency || {}) },
            tendencyData: m.tendencyData || {}, prob: { house: {}, senate: {}, third: {}, ...(m.prob || {}) } };
    }
    // 지금 시민 성향 그대로 (시민 데이터가 변수에 있을 때 부른다)
    function citizenSnapshot() {
        return { svgTendency: clone(districtSvgTendency), regionTendency: { house: {}, senate: {}, third: {}, ...clone(regionTendency) },
            tendencyData: clone(tendencyData), prob: Object.fromEntries(CHS3.map(ch => [ch, clone(elecStore[ch])])) };
    }
    function exchange() {
        const M = S.opinion.migrant;
        let t;
        t = districtSvgTendency; districtSvgTendency = M.svgTendency; M.svgTendency = t;
        t = regionTendency; regionTendency = M.regionTendency; M.regionTendency = t;
        t = tendencyData; tendencyData = M.tendencyData; M.tendencyData = t;
        CHS3.forEach(ch => { t = elecStore[ch]; elecStore[ch] = M.prob[ch] || {}; M.prob[ch] = t || {}; });
    }
    function swapIn() {
        if (layer === 'migrant') return;
        if (!S.opinion.migrant) S.opinion.migrant = citizenSnapshot(); // 처음 열 때 — 시민 성향에서 출발
        exchange(); layer = 'migrant';
    }
    function swapOut() { if (layer !== 'migrant') return; exchange(); layer = 'citizen'; }
    // 여론 하위 탭을 바꿀 때 js/main.js elecSwitchSub가 부른다
    window.HemiOpinionLayer = function (want) {
        if (want === 'migrant' && S.opinion.split) swapIn(); else swapOut();
        const b = document.getElementById('elecLayerBanner');
        if (!b) return;
        if (want !== 'migrant') { b.style.display = 'none'; return; }
        b.style.display = '';
        b.className = 'opinion-layer-banner' + (S.opinion.split ? '' : ' synced');
        b.innerHTML = S.opinion.split
            ? '<b>이민자 성향</b> — 여기서 바꾼 값은 이민자에게만 적용됩니다 (시민은 시민 성향 · 시민 지지율).'
            : '<b>시민과 동기화됨</b> — 여기서 바꾸면 시민 성향도 함께 바뀝니다. 따로 정하려면 여론 › 종합에서 "시민 / 이민자 성향 따로 정하기"를 켜세요.';
    };
    // 여론 밖으로 나가면 시민 성향으로 되돌린다 (선거 · 지도 등 다른 화면은 늘 시민 성향을 본다)
    const origMain = window.switchMainTab;
    if (typeof origMain === 'function') window.switchMainTab = function (main) { if (main !== 'election') swapOut(); return origMain.apply(this, arguments); };
    const origSub = window.switchSubTab;
    if (typeof origSub === 'function') window.switchSubTab = function (main) { if (main !== 'election') swapOut(); return origSub.apply(this, arguments); };
    function setSplit(on) {
        swapOut();
        // 켜든 끄든 지금 시민 성향에서 출발 — 끄면 그대로 동기화, 켜면 거기서부터 따로 고친다
        S.opinion.migrant = citizenSnapshot();
        S.opinion.split = !!on;
        renderOverview();
    }
    const fmtP = v => (Math.round(v * 10) / 10).toFixed(1);
    function renderOverview() {
        const box = document.getElementById('elecSubOverview');
        if (!box) return;
        const was = layer;
        swapOut();
        const split = S.opinion.split;
        const t = totals('house');
        const on = VOTE_KINDS.filter(([k]) => migrantsVote(k)).map(([, n]) => n);
        const M = S.opinion.migrant;
        const tables = chs().map(ch => {
            const { cit, mig } = totals(ch);
            const cs = elecStore[ch] || {}, ms = split && M ? (M.prob[ch] || {}) : cs;
            const list = parties.filter(p => p.status !== 'banned' && (Number(cs[p.id]?.prob) > 0 || Number(ms[p.id]?.prob) > 0));
            if (!list.length) return `<div class="op-ch">${esc(chName(ch))}</div><div class="t61-dim t61-small">지지율이 없습니다 — 시민 지지율에서 정하세요.</div>`;
            const rows = list.map(p => {
                const c = Number(cs[p.id]?.prob) || 0, m = Number(ms[p.id]?.prob) || 0;
                const all = cit + mig > 0 ? (cit * c + mig * m) / (cit + mig) : c;
                return `<tr><td><span class="t61-dot" style="--pc:${esc(p.color)}"></span>${esc(p.name)}</td><td>${fmtP(c)}%</td><td class="${split && m !== c ? 'op-diff' : 'op-same'}">${fmtP(m)}%</td><td>${fmtP(all)}%</td></tr>`;
            }).join('');
            return `<div class="op-ch">${esc(chName(ch))}</div>
                <table class="op-table"><thead><tr><th>정당</th><th>시민</th><th>이민자</th><th>합산</th></tr></thead><tbody>${rows}</tbody></table>`;
        }).join('');
        box.innerHTML = `
            <div class="op-card">
                <label class="op-toggle"><input type="checkbox" data-op="split" ${split ? 'checked' : ''}> 시민 / 이민자 성향 따로 정하기</label>
                <div class="t61-dim t61-small">${split
                    ? '이민자 성향 · 이민자 지지율에서 이민자 성향을 따로 정합니다. 이민자가 투표하는 선거에서는 지역구마다 시민 · 이민자 수만큼 섞어 개표해요 (총선 비례 · 대선은 전국 수로).'
                    : '꺼져 있으면 이민자 성향은 시민 성향과, 이민자 지지율은 시민 지지율과 같은 값으로 묶이고 이민자도 시민과 같은 성향으로 투표합니다. 시민 · 인구 수는 따로예요.'}</div>
            </div>
            <div class="op-card">
                <div>${t.pop ? `<b>시민 ${fmtN(t.cit)}</b> / 인구 ${fmtN(t.pop)} · 이민자 ${fmtN(t.mig)} <span class="t61-dim">(${t.pop ? (t.mig / t.pop * 100).toFixed(1) : 0}%)</span>` : '지역구 인구가 없습니다 — 국가 › 지역구 지도에서 지역구마다 "시민 / 인구"를 적으세요.'}</div>
                <div class="t61-dim">이민자 투표권: ${on.length ? on.join(' · ') : '없음'}</div>
                <div class="t61-row"><button type="button" class="t61-btn" data-op="territory">국가 › 지역구 지도에서 시민 수</button><button type="button" class="t61-btn" data-op="method">선거 › 선거 제도에서 투표권</button></div>
            </div>
            <div class="op-card"><div class="op-title">정당별 지지율</div>${tables}</div>`;
        box.querySelector('[data-op="split"]').onchange = e => setSplit(e.target.checked);
        box.querySelector('[data-op="territory"]').onclick = () => switchSubTab('nation', 'territory');
        box.querySelector('[data-op="method"]').onclick = () => switchSubTab('vote', 'elecSettings');
        if (was === 'migrant') swapIn();
    }
    window.HemiOpinionOverview = renderOverview;

    // ---- 선거 › 선거 제도: 이민자 투표권 카드 ----
    function renderMigrantCard() {
        const host = document.getElementById('contentElecSettings');
        if (!host) return;
        let box = document.getElementById('t61MigrantCard');
        if (!box) { box = document.createElement('div'); box.id = 't61MigrantCard'; box.className = 't61-mig'; host.appendChild(box); }
        const t = totals('house');
        box.innerHTML = `
            <label class="t61-mig-title">이민자 투표권 <span class="t61-dim">— 시민권자는 모든 선거에서 투표합니다</span></label>
            <div class="t61-dim t61-small">${t.pop ? `시민 ${fmtN(t.cit)} / 인구 ${fmtN(t.pop)} · 이민자 ${fmtN(t.mig)}명` : '지역구 인구가 없습니다 — 국가 › 지역구 지도에서 지역구마다 "시민 / 인구"를 적으세요.'}${t.pop && !t.mig ? ' — 아직 이민자가 없습니다 (국가 › 지역구 지도에서 시민 수를 인구보다 적게 적으세요)' : ''}</div>
            <div class="t61-mig-kinds">${VOTE_KINDS.map(([k, n]) => `<label class="t61-mig-kind"><input type="checkbox" data-kind="${k}" ${migrantsVote(k) ? 'checked' : ''}> ${n}</label>`).join('')}</div>
            <div class="t61-dim t61-small">이민자 성향은 여론 › 종합 · 이민자 성향 · 이민자 지지율에서 정합니다.</div>
            <button type="button" class="t61-btn" data-act="opinion">여론 › 종합으로</button>`;
        box.querySelectorAll('[data-kind]').forEach(c => c.addEventListener('change', () => { S.migrantVote[c.dataset.kind] = c.checked; renderMigrantCard(); render(); }));
        box.querySelector('[data-act="opinion"]').addEventListener('click', () => { switchMainTab('election'); elecSwitchSub('overview'); });
    }
    const origSwitch2 = window.switchSubTab;
    window.switchSubTab = function (main, sub) {
        const r = origSwitch2.apply(this, arguments);
        if (main === 'vote' && sub === 'elecSettings') renderMigrantCard();
        return r;
    };
    window.addEventListener('load', () => setTimeout(renderMigrantCard, 0));

    window.T61 = { get people() { return S.people; }, get candidates() { return S.candidates; }, get lastElection() { return S.lastElection; }, seats, assign, unassign, importFromSeats, positionsOf,
        get citizens() { return S.citizens; }, get migrantVote() { return S.migrantVote; }, get opinion() { return S.opinion; }, setCitizens, totals, setSplit, swapOut };

    const css = document.createElement('style');
    css.textContent = `
        .t61-intro { font-size: .8rem; color: #8a94a3; margin-bottom: 8px; line-height: 1.5; }
        .t61-bar { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px; }
        .t61-search { flex: 1; min-width: 120px; }
        .t61-btn { cursor: pointer; background: transparent; border: 1px solid #333; color: #aaa; font-family: inherit; padding: 5px 10px; }
        .t61-btn:hover { border-color: var(--tno-neon); color: var(--tno-neon); }
        .t61-primary { border-color: var(--tno-neon); color: var(--tno-neon); }
        .t61-danger { color: var(--tno-alert, #e74c3c); border-color: currentColor; }
        .t61-filter { margin-bottom: 8px; flex-wrap: wrap; }
        .t61-filter .system-radio-btn { flex: 1 1 auto; white-space: nowrap; }
        .t61-n { opacity: .6; font-size: .85em; }
        .t61-result { position: relative; font-size: .8rem; line-height: 1.6; border: 1px solid #2a2a2a; border-left: 3px solid var(--tno-gold); padding: 6px 28px 6px 8px; margin-bottom: 8px; }
        .t61-result .t61-x { position: absolute; top: 4px; right: 4px; }
        .t61-x { cursor: pointer; background: transparent; border: 1px solid #333; color: #777; font-family: inherit; padding: 0 6px; }
        .t61-dim { color: #777; }
        .t61-list { display: flex; flex-direction: column; gap: 6px; }
        .t61-empty { color: #666; font-size: .82rem; text-align: center; padding: 20px 8px; }
        .t61-card { border: 1px solid #2a2a2a; border-left: 3px solid var(--pc); background: rgba(0,0,0,.2); }
        .t61-head { display: flex; gap: 8px; align-items: flex-start; padding: 6px; }
        .t61-handle { align-self: center; }
        .t61-photo { width: 44px; height: 56px; flex-shrink: 0; } .t61-photo img { width: 100%; height: 100%; object-fit: cover; }
        .t61-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
        .t61-name { width: 100%; box-sizing: border-box; }
        .t61-sub { font-size: .74rem; color: #8a94a3; display: flex; align-items: center; gap: 5px; }
        .t61-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--pc); display: inline-block; flex: none; }
        .t61-chips { display: flex; flex-wrap: wrap; gap: 4px; }
        .t61-chip { display: inline-flex; align-items: center; gap: 3px; font-size: .72rem; border: 1px solid #333; padding: 1px 2px 1px 6px; color: #bbb; }
        .t61-chip button { cursor: pointer; background: transparent; border: 0; color: #777; font-family: inherit; padding: 0 3px; }
        .t61-chip button:hover { color: var(--tno-alert, #e74c3c); }
        .t61-cand { border-style: dashed; color: var(--tno-gold); }
        .t61-none { font-size: .72rem; color: #666; border: 1px dashed #333; padding: 1px 6px; }
        .t61-more { cursor: pointer; background: transparent; border: 1px solid #333; color: #888; font-family: inherit; padding: 2px 8px; align-self: flex-start; }
        .t61-body { padding: 0 8px 8px; display: flex; flex-direction: column; gap: 6px; }
        .t61-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 6px; }
        .t61-grid label { display: flex; flex-direction: column; gap: 2px; font-size: .72rem; color: #8a94a3; }
        .t61-row { display: flex; gap: 6px; flex-wrap: wrap; } .t61-grow { flex: 1; min-width: 150px; } .t61-end { justify-content: flex-end; }
        .t61-stack { display: flex; flex-direction: column; gap: 6px; } .t61-stack select { width: 100%; }
        .t61-body textarea { width: 100%; box-sizing: border-box; resize: vertical; font-family: inherit; font-size: .9rem; background: #000; border: 1px solid var(--tno-border, #333); color: var(--tno-text, #ddd); padding: 6px 10px; border-radius: 0; }
        .t61-body textarea:focus { outline: none; border-color: var(--tno-neon); }
        html[data-theme-family="modern"] .t61-body textarea { background: var(--m-surface); border: 1px solid var(--m-border-strong); color: var(--m-text); border-radius: 8px; }
        html[data-theme-family="modern"] .t61-body textarea:focus { border-color: var(--m-accent, #2563eb); }
        html[data-theme-family="modern"] .t61-card { border-color: var(--m-border); border-left-color: var(--pc); background: var(--m-surface); border-radius: 8px; }
        html[data-theme-family="modern"] .t61-btn, html[data-theme-family="modern"] .t61-more, html[data-theme-family="modern"] .t61-x { border-color: var(--m-border-strong); color: var(--m-text); border-radius: 8px; }
        html[data-theme-family="modern"] .t61-primary { background: var(--m-accent, #2563eb); border-color: transparent; color: #fefefe; }
        html[data-theme-family="modern"] .t61-chip { border-color: var(--m-border); color: var(--m-text); border-radius: 999px; }
        .t61-small { font-size: .74rem; line-height: 1.5; margin-top: 3px; }
        .t61-pop { display: flex; flex-wrap: wrap; align-items: center; gap: 2px 10px; font-size: .78rem; border: 1px dashed #333; padding: 6px 8px; margin-bottom: 8px; }
        .t61-pop > div { flex: 1 1 100%; } .t61-pop .t61-btn { padding: 2px 8px; font-size: .74rem; margin-top: 3px; }
        .t61-cit-sep { color: #555; flex-shrink: 0; font-size: .8rem; }
        .t61-cit-row { display: flex; align-items: center; gap: 6px; font-size: .75rem; color: #666; }
        .t61-cit-row input { flex: 1; min-width: 0; box-sizing: border-box; background: #000; border: 1px solid #333; color: var(--tno-text); font-family: inherit; font-size: .85rem; padding: 6px; }
        .t61-cit-row .t61-dim { flex-shrink: 0; }
        .t61-mig { margin-top: 14px; padding-top: 10px; border-top: 1px solid #222; font-size: .82rem; }
        .t61-mig-title { color: #888; font-size: .8rem; display: block; }
        .t61-mig-kinds { display: flex; flex-wrap: wrap; gap: 4px 14px; margin: 8px 0 6px; }
        .t61-mig-kind { display: inline-flex; align-items: center; gap: 5px; cursor: pointer; color: #bbb; }
        .opinion-layer-banner { font-size: .78rem; line-height: 1.5; padding: 6px 10px; margin: 8px 0; border: 1px solid var(--tno-gold); color: var(--tno-gold); background: color-mix(in srgb, var(--tno-gold) 8%, transparent); }
        .opinion-layer-banner.synced { border: 1px dashed #555; color: #aaa; background: transparent; }
        .op-card { border: 1px dashed #333; padding: 8px 10px; margin: 8px 0; font-size: .8rem; display: flex; flex-direction: column; gap: 4px; }
        .op-toggle { display: flex; align-items: center; gap: 6px; color: var(--tno-neon); font-size: .9rem; cursor: pointer; }
        .op-title { color: #aaa; } .op-ch { color: var(--tno-gold); margin-top: 6px; font-size: .78rem; }
        .op-table { width: 100%; border-collapse: collapse; font-size: .78rem; }
        .op-table th { text-align: right; color: #666; font-weight: normal; padding: 2px 4px; }
        .op-table td { text-align: right; padding: 3px 4px; border-top: 1px solid #1a1a1a; font-variant-numeric: tabular-nums; }
        .op-table th:first-child, .op-table td:first-child { text-align: left; }
        .op-table .op-diff { color: var(--tno-gold); }
        html[data-theme-family="modern"] .opinion-layer-banner { border-radius: 8px; color: #92400e; border-color: #f59e0b; background: #fffbeb; }
        html[data-theme-family="modern"] .opinion-layer-banner.synced { color: var(--m-text-3, #71717a); border-color: var(--m-border-strong); background: transparent; }
        html[data-theme-family="modern"] .op-card { border: 1px solid var(--m-border); border-radius: 10px; background: var(--m-surface); }
        html[data-theme-family="modern"] .op-toggle { color: var(--m-text); font-weight: 600; }
        html[data-theme-family="modern"] .op-title { color: var(--m-text); font-weight: 600; }
        html[data-theme-family="modern"] .op-ch { color: var(--m-text-2, #52525b); font-weight: 600; }
        html[data-theme-family="modern"] .op-table th { color: var(--m-text-3, #71717a); }
        html[data-theme-family="modern"] .op-table td { border-top-color: var(--m-border); color: var(--m-text); }
        html[data-theme-family="modern"] .op-table .op-diff { color: #b45309; }
        html[data-theme-family="modern"] .t61-pop { border-color: var(--m-border-strong); border-radius: 10px; background: var(--m-surface-2); }
        html[data-theme-family="modern"] .t61-mig { border-top-color: var(--m-border); }
        html[data-theme-family="modern"] .t61-mig-title { color: var(--m-text-2); font-weight: 600; }
        html[data-theme-family="modern"] .t61-mig-kind { color: var(--m-text); }
        html[data-theme-family="modern"] .t61-cit-row input { background: var(--m-surface); border: 1px solid var(--m-border-strong); border-radius: 8px; color: var(--m-text); }
        html[data-theme-family="modern"] .t61-result { border-color: var(--m-border); border-left-color: #b07d10; border-radius: 8px; }`;
    document.head.appendChild(css);
})();
