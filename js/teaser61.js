// ===== Teaser 1.6.1 — 인간은 자유롭게 태어났다 "L'homme est né libre." =====
// 국가 › 사람 탭: 인물을 미리 만들어 두고(이름 · 사진 · 이념 · 소속 정당 · 파벌), 의석 · 당직 · 내각 자리에 배정한다.
//  - 자리(지역구 · 비례 · 무소속 의원, 당수 · 원내대표, 대통령 · 총리 · 부총리 · 내각 구성원)에는 personId를 붙여 연결하고,
//    인물의 이름 · 사진을 고치면 연결된 모든 자리에 반영한다.
//  - 지역구 후보: 선거 전에 인물을 지역구 후보로 내세우면, 총선 · 보궐선거 결과를 반영할 때 그 지역구에서 인물의 정당이
//    이긴 의석에 바로 배정한다 (후보가 없으면 같은 정당의 현역이 다시 그 자리에). 낙선해도 인물은 남는다.
//  - 선거 · 당적 변경 · 궐석으로 의석이 사라져도 인물은 사람 탭에 그대로 남는다 (예전엔 자리와 함께 이름 · 사진이 사라졌다).
/* global parties, ideologies, chamberList, chamberDisplayName, districtMembers, districtMemberKeys, districtMemberKeysOf,
   districtMemberLabel, districtBaseKey, districtSortedKeys, districtNames, listMembers, independents, president, pm,
   collectiveChair, deputyPms, cabinetMembers, effRoleLabel, simulate, refreshUI, showCustomAlert, showCustomConfirm,
   escapeHtmlText, ideologyName, startDragReorder, formatNationDate, elecLastResults, elecLastResult */
(function () {
    'use strict';
    const root = document.documentElement;
    if (root.getAttribute('data-app-mode') !== 'teaser' || !['61', '62', '63', '64', '65', '66', '67'].includes(root.getAttribute('data-teaser'))) return;

    const esc = s => (typeof escapeHtmlText === 'function' ? escapeHtmlText(String(s ?? '')) : String(s ?? ''));
    const uid = () => 'h' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const partyById = id => parties.find(p => String(p.id) === String(id)) || null;
    const sameId = (a, b) => a != null && b != null && String(a) === String(b);
    const IND = 9999;
    const chs = () => (typeof chamberList === 'function' ? chamberList() : ['house']);
    const chName = ch => (typeof chamberDisplayName === 'function' ? chamberDisplayName(ch) : ch);

    // ---- 상태 (세이브의 teaser61 칸) ----
    //   people: [{ id, name, photo, ideologyId, partyId, factionId, bio }]
    //   candidates: { [chamber]: { [지역구 키]: [personId] } }
    //   lastElection: { date, chamber, elected: [{ personId, place }], lost: [{ personId, place }] } | null
    let S = fresh();
    function fresh() { return { people: [], candidates: {}, lastElection: null }; }
    const ui = { q: '', filter: 'all', openId: null };

    const origGet = window.getAppState;
    window.getAppState = function () {
        const st = origGet.apply(this, arguments);
        if (st && typeof st === 'object') st.teaser61 = JSON.parse(JSON.stringify(S));
        return st;
    };
    const origSet = window.setAppState;
    window.setAppState = function (state) {
        const r = origSet.apply(this, arguments);
        const src = state && state.teaser61;
        S = { ...fresh(), ...(src && typeof src === 'object' ? JSON.parse(JSON.stringify(src)) : {}) };
        if (!Array.isArray(S.people)) S.people = [];
        if (!S.candidates || typeof S.candidates !== 'object') S.candidates = {};
        refresh();
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
            out.push({ key: `pf:${p.id}`, kind: 'floor', group: '당직', partyId: p.id, label: `${p.name} 원내대표`, obj: p, nameKey: 'floorLeaderName', photoKey: 'floorLeaderPhoto', pidKey: 'floorLeaderPersonId', name: () => p.floorLeaderName || '' });
        });
        const role = k => { try { return effRoleLabel(k); } catch (e) { return k; } };
        out.push({ key: 'c:president', kind: 'cabinet', group: '내각', label: role('president'), obj: president, name: () => president.name || '' });
        out.push({ key: 'c:pm', kind: 'cabinet', group: '내각', label: role('pm'), obj: pm, name: () => pm.name || '' });
        if (typeof collectiveChair !== 'undefined' && collectiveChair) out.push({ key: 'c:chair', kind: 'cabinet', group: '내각', label: '집단지도체제 의장', obj: collectiveChair, name: () => collectiveChair.name || '' });
        (deputyPms || []).forEach(d => out.push({ key: `c:dpm:${d.id}`, kind: 'cabinet', group: '내각', label: d.position || '부총리', obj: d, name: () => d.name || '' }));
        (cabinetMembers || []).forEach(c => out.push({ key: `c:cm:${c.id}`, kind: 'cabinet', group: '내각', label: c.position || '내각 구성원', obj: c, name: () => c.name || '' }));
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
        ['renderMembersList', 'renderCabinetDisplay', 'renderCabinetMembersList', 'renderPartyInfoList', 'renderPresidentCard', 'renderPmCard'].forEach(f => { try { if (typeof window[f] === 'function') window[f](); } catch (e) { /* 없음 */ } });
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

    // ---- 지금 의원 · 당직 · 내각에 적힌 이름으로 인물 만들기 (같은 이름은 한 사람으로) ----
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
        showCustomAlert(made || linked ? `인물 ${made}명을 새로 만들고, 자리 ${linked}곳을 사람 탭의 인물과 연결했습니다.` : '이름이 적힌 자리가 없습니다 — 의원 · 당수 · 내각 자리에 이름을 적거나, 여기서 사람을 직접 추가하세요.');
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
                <button type="button" class="t61-btn" data-act="import" title="의원 · 당수 · 원내대표 · 내각 자리에 적힌 이름으로 인물을 만들고 연결 (같은 이름은 한 사람)">의원 · 내각에서 가져오기</button>
                <input type="search" class="t61-search" data-ui="q" placeholder="이름 검색" value="${esc(ui.q)}">
            </div>
            <div class="system-radio-group t61-filter">${[['all', '전체'], ['seated', '자리 있음'], ['none', '자리 없음'], ['cand', '지역구 후보']].map(([k, t]) => `<button type="button" class="system-radio-btn ${ui.filter === k ? 'active' : ''}" data-filter="${k}">${t} <span class="t61-n">${counts[k]}</span></button>`).join('')}</div>
            ${le ? `<div class="t61-result"><b>지난 선거 (${esc(le.chamber)}${le.date ? ` · ${esc(le.date)}` : ''})</b>
                ${le.elected.length ? `<div>✔ 당선 · 배정: ${le.elected.map(x => `${esc((personById(x.personId) || {}).name || '?')} <span class="t61-dim">(${esc(x.place)})</span>`).join(', ')}</div>` : ''}
                ${le.lost.length ? `<div>✘ 낙선: ${le.lost.map(x => `${esc((personById(x.personId) || {}).name || '?')} <span class="t61-dim">(${esc(x.place)})</span>`).join(', ')} — 사람 탭에 남아 다음 선거에 다시 나갈 수 있어요</div>` : ''}
                <button type="button" class="t61-x" data-act="clearres" title="닫기">✕</button></div>` : ''}
            <div id="t61List" class="t61-list">${list.length ? list.map(p => card(p, posMap.get(p.id) || [])).join('') : `<div class="t61-empty">${S.people.length ? '조건에 맞는 사람이 없습니다.' : '아직 사람이 없습니다. "＋ 사람 추가"로 만들거나, "의원 · 내각에서 가져오기"로 지금 자리에 적힌 이름을 인물로 옮겨 보세요.'}</div>`}</div>`;
        bind(box);
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
                <div class="t61-row"><select data-act="assign" class="t61-grow">${seatOptions(p)}</select><select data-act="cand" class="t61-grow">${candOptions()}</select></div>
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

    window.T61 = { get people() { return S.people; }, get candidates() { return S.candidates; }, get lastElection() { return S.lastElection; }, seats, assign, unassign, importFromSeats, positionsOf };

    const css = document.createElement('style');
    css.textContent = `
        .t61-intro { font-size: .8rem; color: #8a94a3; margin-bottom: 8px; line-height: 1.5; }
        .t61-bar { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px; }
        .t61-search { flex: 1; min-width: 120px; }
        .t61-btn { cursor: pointer; background: transparent; border: 1px solid #333; color: #aaa; font-family: inherit; padding: 5px 10px; }
        .t61-btn:hover { border-color: var(--tno-neon); color: var(--tno-neon); }
        .t61-primary { border-color: var(--tno-neon); color: var(--tno-neon); }
        .t61-danger { color: var(--tno-alert, #e74c3c); border-color: currentColor; }
        .t61-filter { margin-bottom: 8px; }
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
        .t61-body textarea { width: 100%; box-sizing: border-box; resize: vertical; font-family: inherit; }
        html[data-theme-family="modern"] .t61-card { border-color: var(--m-border); border-left-color: var(--pc); background: var(--m-surface); border-radius: 8px; }
        html[data-theme-family="modern"] .t61-btn, html[data-theme-family="modern"] .t61-more, html[data-theme-family="modern"] .t61-x { border-color: var(--m-border-strong); color: var(--m-text); border-radius: 8px; }
        html[data-theme-family="modern"] .t61-primary { background: var(--m-accent, #2563eb); border-color: transparent; color: #fefefe; }
        html[data-theme-family="modern"] .t61-chip { border-color: var(--m-border); color: var(--m-text); border-radius: 999px; }
        html[data-theme-family="modern"] .t61-result { border-color: var(--m-border); border-left-color: #b07d10; border-radius: 8px; }`;
    document.head.appendChild(css);
})();
