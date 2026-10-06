// ===== Hemicycle 1.5.9 "Pops" — 지방선거 · 국민투표 =====
// 두 선거 모두 지역구 인구(여론 › 지역구의 "인구")로 실제 득표수를 계산한다:
//   유권자 = 인구, 투표자 = 인구 × 투표율(지역마다 조금씩 흔들림), 득표 = 투표자 × 득표율
//   - 지방선거: 단위(권역 또는 지역구)마다 단체장 1명 — 최다 득표 정당이 당선. 정당 득표율은 지역구 성향(%)
//     (없으면 지지율 탭의 전국 지지율) + 노이즈, 후보 단일화("총선 지역구" 적용)도 반영
//   - 국민투표: 정당마다 찬성 · 중립 · 반대 입장을 정하면, 지역구별로 그 정당 지지층이 입장대로 찬반을 나눠
//     찬성 · 반대 득표와 투표율이 나온다. 투표율 기준(예: 50%)을 켜면 그 아래일 때는 결과와 상관없이 부결
// main.js의 전역 상태(parties · districtGrid · districtPopulation · regions …)를 읽기만 하고, 기록은 여기서 관리한다
// (저장 · 불러오기는 main.js getAppState/setAppState가 PopVote.getState/setState를 부름)
/* global parties, districtGrid, districtPopulation, districtNames, districtSvgTendency, districtRegionMap, regions,
   elecStore, chamberList, chamberDisplayName, inKeyFor, applyCandidateUnions, renderDistrictSvgInto, districtSvgMapFor,
   tendencyColorForPct, escapeHtmlText, showCustomAlert, showCustomConfirm, IND_IDEOLOGY_ID */
(function () {
    'use strict';

    const MAX_RECORDS = 30;
    const DEFAULT_POP = 100000;      // 인구를 안 적은 지역구
    const NATION_VOTERS = 10000000;  // 지역구가 하나도 없을 때(국민투표 전국 단위)
    const STANCE_YES = { yes: 0.85, neutral: 0.5, no: 0.15 };

    const S = {
        // holders: 현직 단체장 { '<단위>:<원>:<권역 id | 지역구 키>': { partyId, name, photo, office, since } }
        local: { title: '', year: '', officeRegion: '지사', officeDistrict: '시장', doRegion: true, doDistrict: true, chamber: 'house', turnout: 55, noise: 8, records: [], last: null, holders: {} },
        ref: { question: '', year: '', chamber: 'house', turnout: 55, quorumOn: true, quorum: 50, stances: {}, records: [], last: null },
    };

    const ge = id => document.getElementById(id);
    const esc = s => (typeof escapeHtmlText === 'function' ? escapeHtmlText(String(s == null ? '' : s)) : String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])));
    const fmt = n => Math.round(n).toLocaleString('ko-KR');
    const pct = (a, b) => (b > 0 ? (a / b * 100) : 0);
    const rand = (a) => (Math.random() * 2 - 1) * a;
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    const partyById = id => parties.find(p => String(p.id) === String(id)) || null;
    const chamberOk = ch => chamberList().includes(ch) ? ch : 'house';
    const runningParties = () => parties.filter(p => p.status !== 'banned');

    // ---- 지역구 · 인구 ----
    // 미수복 지역(티저 미리보기 — js/teaser.js)은 선거에서 뺀다
    const excluded = k => typeof window.isDistrictUnrecovered === 'function' && window.isDistrictUnrecovered(k);
    function districtKeys(ch) { return Object.keys(districtGrid[ch] || {}).filter(k => !excluded(k)); }
    function popOf(ch, key) {
        const v = districtPopulation[ch]?.[key] ?? districtPopulation.house?.[key];
        return Number.isFinite(v) && v > 0 ? v : null;
    }
    function nameOf(ch, key) { return districtNames[ch]?.[key] || districtNames.house?.[key] || key; }

    // 지역구 하나의 정당별 득표율(합 100) — 성향이 있으면 성향, 없으면 전국 지지율
    function partySharesFor(ch, key, noise) {
        const list = runningParties();
        const tend = districtSvgTendency[key]?.[ch] || {};
        const hasTend = list.some(p => (tend[p.id] || 0) > 0);
        const store = elecStore[ch] || {};
        const raw = {};
        list.forEach(p => {
            const base = hasTend ? (tend[p.id] || 0) : (store[p.id]?.prob || 0);
            raw[p.id] = base;
        });
        const { scores, withdrawn } = typeof applyCandidateUnions === 'function' ? applyCandidateUnions(raw, 'district') : { scores: raw, withdrawn: new Set() };
        const out = {};
        let total = 0;
        list.forEach(p => {
            if (withdrawn.has(String(p.id))) return;
            const v = scores[p.id] || 0;
            if (v <= 0) return;
            out[p.id] = Math.max(0, v + rand(noise));
            total += out[p.id];
        });
        if (total <= 0) return {};
        Object.keys(out).forEach(k => { out[k] = out[k] / total; });
        return out;
    }

    // ===================== 지방선거 =====================
    // 두 단계를 한 번에 뽑는다 (둘 중 하나만도 가능):
    //   권역 단체장(예: 지사) — 권역마다 1명, 권역에 속한 지역구 표를 모두 합쳐 최다 득표
    //   지역구 단체장(예: 시장) — 지역구마다 1명
    // 결과를 "현직에 반영"하면 내각 화면처럼 권역장 아래에 그 권역의 지역구장이 붙은 현황으로 남는다
    const LEVELS = ['region', 'district'];
    function regionUnits(ch) {
        const keys = districtKeys(ch);
        return (regions[ch] || []).map(r => ({ id: r.id, name: r.name, color: r.color, keys: keys.filter(k => districtRegionMap[ch]?.[k] === r.id) })).filter(u => u.keys.length);
    }
    function districtUnits(ch) { return districtKeys(ch).map(k => ({ id: k, name: nameOf(ch, k), keys: [k] })); }
    function unitsOf(ch, level) { return level === 'region' ? regionUnits(ch) : districtUnits(ch); }
    const officeOf = level => (level === 'region' ? S.local.officeRegion : S.local.officeDistrict) || (level === 'region' ? '지사' : '시장');

    // 지역구 하나의 개표 — 표는 권역 · 지역구 두 선거에 같이 쓰지 않고 선거마다 따로 흔든다
    function countDistrict(ch, k, L) {
        let pop = popOf(ch, k); let missing = false;
        if (pop == null) { pop = DEFAULT_POP; missing = true; }
        const turnout = clamp(L.turnout + rand(5), 5, 100) / 100;
        const cast = Math.round(pop * turnout);
        const votes = {};
        Object.entries(partySharesFor(ch, k, L.noise)).forEach(([pid, s]) => { votes[pid] = cast * s; });
        return { pop, cast, votes, missing };
    }
    function runLevel(ch, level, L) {
        let missingPop = 0;
        const results = unitsOf(ch, level).map(u => {
            const votes = {};
            let voters = 0, electorate = 0;
            u.keys.forEach(k => {
                const c = countDistrict(ch, k, L);
                if (c.missing) missingPop++;
                electorate += c.pop; voters += c.cast;
                Object.entries(c.votes).forEach(([pid, v]) => { votes[pid] = (votes[pid] || 0) + v; });
            });
            Object.keys(votes).forEach(pid => { votes[pid] = Math.round(votes[pid]); });
            const ranked = Object.entries(votes).sort((a, b) => b[1] - a[1]);
            return { id: u.id, name: u.name, keys: u.keys, electorate, voters, votes, winner: ranked[0] ? ranked[0][0] : null };
        });
        return { unit: level, office: officeOf(level), results, missingPop };
    }

    function runLocal() {
        readLocalInputs();
        const L = S.local;
        const ch = chamberOk(L.chamber);
        const want = LEVELS.filter(lv => (lv === 'region' ? L.doRegion : L.doDistrict));
        if (!want.length) { showCustomAlert('권역 단체장 · 지역구 단체장 중 하나 이상을 골라 주세요.'); return; }
        if (!districtKeys(ch).length) {
            showCustomAlert('지방선거를 치를 지역이 없습니다.\n여론 › 지역구에서 지도를 올리고 지역구를 만든 뒤(권역 단위면 여론 › 권역에서 권역도) 다시 시도하세요.');
            return;
        }
        const levels = want.map(lv => runLevel(ch, lv, L)).filter(lv => lv.results.length);
        if (!levels.length) { showCustomAlert('권역이 없습니다 — 여론 › 권역에서 권역을 만들고 지역구를 배정하세요.'); return; }
        const rec = {
            id: 'loc' + Date.now().toString(36),
            title: L.title || `${L.year ? L.year + '년 ' : ''}지방선거`,
            year: L.year, chamber: ch, levels, at: Date.now(),
        };
        L.last = rec;
        L.records.unshift(rec);
        L.records = L.records.slice(0, MAX_RECORDS);
        renderLocal();
        showOnDisplay('local', rec, true);
    }
    // 예전(한 단계만 뽑던) 기록도 같은 모양으로
    function levelsOf(rec) {
        if (Array.isArray(rec.levels)) return rec.levels;
        return rec.results ? [{ unit: rec.unit || 'district', office: rec.office || '단체장', results: rec.results, missingPop: rec.missingPop || 0 }] : [];
    }

    function levelSummary(lv) {
        const won = {}, total = {};
        let allVotes = 0, voters = 0, electorate = 0;
        lv.results.forEach(r => {
            if (r.winner != null) won[r.winner] = (won[r.winner] || 0) + 1;
            Object.entries(r.votes).forEach(([pid, v]) => { total[pid] = (total[pid] || 0) + v; allVotes += v; });
            voters += r.voters; electorate += r.electorate;
        });
        const rows = Object.keys(total).filter(pid => total[pid] > 0 || won[pid]).map(pid => ({ pid, won: won[pid] || 0, votes: total[pid] }))
            .sort((a, b) => b.won - a.won || b.votes - a.votes);
        return { rows, allVotes, voters, electorate };
    }

    function renderLocalResult(rec, box, withMap) {
        if (!rec) { box.innerHTML = ''; return; }
        const levels = levelsOf(rec);
        const first = levels[0] ? levelSummary(levels[0]) : null;
        const missing = Math.max(0, ...levels.map(l => l.missingPop || 0));
        const canToggle = !withMap && hasMap(rec.chamber); // 오른쪽 결과 탭은 위에 큰 지도가 따로 있다
        box.innerHTML = `
            <div class="pv-result">
                <div class="pv-result-title">${esc(rec.title)} <span class="pv-dim">— ${levels.map(l => `${esc(l.office)} ${l.results.length}명`).join(' · ')}</span></div>
                ${first ? `<div class="pv-dim pv-small">투표율 ${pct(first.voters, first.electorate).toFixed(1)}% · 유권자 ${fmt(first.electorate)}명 · 투표 ${fmt(first.voters)}명${missing ? ` · 인구 미입력 ${missing}곳은 ${fmt(DEFAULT_POP)}명으로 계산` : ''}</div>` : ''}
                ${rec.applied ? '<div class="pv-applied">✔ 현직 단체장에 반영됨</div>' : `<button type="button" class="pv-apply" onclick="PopVote.applyLocal('${rec.id}')">✔ 당선자를 현직 단체장으로 반영</button>`}
                ${withMap ? '<div class="pv-map" data-map="local"></div>' : ''}
                ${levels.map(lv => { const sum = levelSummary(lv); const unitWord = lv.unit === 'region' ? '권역' : '지역구'; return `
                <div class="pv-level-head">${esc(lv.office)} <span class="pv-dim">(${unitWord} ${lv.results.length}곳)</span></div>
                <table class="pv-table">
                    <thead><tr><th>정당</th><th>당선</th><th>득표</th><th>득표율</th></tr></thead>
                    <tbody>${sum.rows.map(r => { const p = partyById(r.pid); return `
                        <tr><td><span class="pv-dot" style="background:${p ? p.color : '#888'}"></span>${esc(p ? p.name : '?')}</td>
                        <td>${r.won}</td><td>${fmt(r.votes)}</td><td>${pct(r.votes, sum.allVotes).toFixed(1)}%</td></tr>`; }).join('')}</tbody>
                </table>
                <details class="pv-details${canToggle ? ' pv-units-host' : ''}" data-level="${levels.indexOf(lv)}"><summary>${unitWord}별 결과 (${lv.results.length})</summary>
                    ${canToggle ? unitsToggleHtml() : ''}
                    <div class="pv-units">${lv.results.map(r => {
                        const p = partyById(r.winner);
                        const top = Object.entries(r.votes).sort((a, b) => b[1] - a[1]).slice(0, 3);
                        const all = Object.values(r.votes).reduce((a, b) => a + b, 0);
                        return `<div class="pv-unit" style="border-left-color:${p ? p.color : '#888'}">
                            <div><b>${esc(r.name)}</b> — ${esc(p ? p.name : '당선자 없음')}</div>
                            <div class="pv-dim pv-small">${top.map(([pid, v]) => `${esc(partyById(pid)?.name || '?')} ${fmt(v)}표(${pct(v, all).toFixed(1)}%)`).join(' · ')} · 투표율 ${pct(r.voters, r.electorate).toFixed(1)}%</div>
                        </div>`;
                    }).join('')}</div>
                    ${canToggle ? '<div class="pv-map" data-map="local-units"></div>' : ''}
                </details>`; }).join('')}
            </div>`;
        box.querySelectorAll('.pv-units-host').forEach(host => {
            const lv = levels[+host.dataset.level];
            setupUnitsHost(host, el => drawLevelMap(el, rec, lv));
        });
        const mapEl = box.querySelector('[data-map="local"]');
        if (!mapEl) return;
        // 지도: 지역구장 결과가 있으면 지역구마다, 없으면 권역마다 당선 정당 색 (권역 경계는 굵게)
        const dLv = levels.find(l => l.unit === 'district');
        const rLv = levels.find(l => l.unit === 'region');
        const byKey = {}, regionOfKey = {};
        (dLv || rLv).results.forEach(r => r.keys.forEach(k => { byKey[k] = r; }));
        if (rLv) rLv.results.forEach(r => r.keys.forEach(k => { regionOfKey[k] = r; }));
        drawMap(mapEl, rec.chamber, key => {
            const r = byKey[key];
            const p = r && partyById(r.winner);
            if (!p) return 'transparent';
            const all = Object.values(r.votes).reduce((a, b) => a + b, 0);
            return tendencyColorForPct(p.color, 45 + pct(r.votes[r.winner] || 0, all) * 0.55);
        }, key => {
            const r = byKey[key];
            if (!r) return nameOf(rec.chamber, key);
            const p = partyById(r.winner);
            const rg = regionOfKey[key];
            const rp = rg && rg !== r ? partyById(rg.winner) : null;
            return `${r.name}: ${p ? p.name : '당선자 없음'}${rg && rg !== r ? ` · ${rg.name} ${rLv.office}: ${rp ? rp.name : '당선자 없음'}` : ''}`;
        }, !dLv && rLv ? key => regionOfKey[key]?.id ?? null : null);
    }

    // ===================== 현직 단체장 =====================
    // holders['<region|district>:<원>:<권역 id | 지역구 키>'] = { partyId, name, photo, office, since }
    const holderKey = (unit, ch, id) => `${unit}:${ch}:${id}`;
    // 개표 결과를 현직으로 — 같은 정당이 다시 이기면 이름 · 사진은 그대로(재선), 바뀌면 비워서 새로 적게 한다
    function applyLocal(id) {
        const rec = S.local.records.find(r => r.id === id) || (S.local.last && S.local.last.id === id ? S.local.last : null);
        if (!rec || rec.applied) return;
        const H = S.local.holders;
        levelsOf(rec).forEach(lv => lv.results.forEach(r => {
            const key = holderKey(lv.unit, rec.chamber, r.id);
            const prev = H[key];
            const same = prev && String(prev.partyId) === String(r.winner);
            H[key] = { partyId: r.winner, name: same ? prev.name : '', photo: same ? prev.photo : '', office: lv.office, since: same ? prev.since : (rec.year || '') };
        }));
        rec.applied = true;
        S.local.chamber = rec.chamber;
        renderLocal();
        showHoldersOnDisplay(true);
    }
    function setHolder(key, field, value) {
        const H = S.local.holders;
        const lv = String(key).split(':')[0];
        const h = H[key] || (H[key] = { partyId: '', name: '', photo: '', office: officeOf(lv), since: '' });
        h[field] = value;
        if (field === 'partyId' && !value && !h.name && !h.photo) delete H[key];
        renderHolders();
        if (ge('dispTabPopVote')?.dataset.view === 'holders') showHoldersOnDisplay(false);
    }
    function uploadHolderPhoto(input, key) {
        const file = input.files && input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = e => setHolder(key, 'photo', e.target.result);
        reader.readAsDataURL(file);
    }
    // 권역 → 그 권역의 지역구 묶음 (권역에 안 든 지역구는 맨 끝 "권역 없음")
    function holderTree(ch) {
        const H = S.local.holders;
        const regs = regionUnits(ch);
        const inRegion = new Set();
        const groups = regs.map(r => {
            r.keys.forEach(k => inRegion.add(k));
            return { region: r, rKey: holderKey('region', ch, r.id), head: H[holderKey('region', ch, r.id)] || null,
                districts: r.keys.map(k => ({ id: k, name: nameOf(ch, k), key: holderKey('district', ch, k), h: H[holderKey('district', ch, k)] || null })) };
        });
        const rest = districtKeys(ch).filter(k => !inRegion.has(k));
        if (rest.length) groups.push({ region: null, rKey: null, head: null, districts: rest.map(k => ({ id: k, name: nameOf(ch, k), key: holderKey('district', ch, k), h: H[holderKey('district', ch, k)] || null })) });
        return groups;
    }
    function partyOptions(sel) {
        return `<option value="">— 공석 —</option>` + parties.map(p => `<option value="${p.id}" ${String(p.id) === String(sel) ? 'selected' : ''}>${esc(p.name)}</option>`).join('');
    }
    const filledH = h => !!(h && h.partyId !== '' && h.partyId != null);
    function holderEditRow(key, name, h, office, big) {
        const p = h ? partyById(h.partyId) : null;
        return `<div class="pv-holder${big ? ' pv-holder-big' : ''}" style="border-left-color:${p ? p.color : '#555'}">
            <label class="pv-holder-photo" title="사진">${h && h.photo ? `<img src="${h.photo}" alt="">` : '👤'}
                <input type="file" accept="image/*" data-key="${esc(key)}" onchange="PopVote.uploadHolderPhoto(this, this.dataset.key)"></label>
            <div class="pv-holder-main">
                <div class="pv-holder-unit">${esc(name)} <span class="pv-dim">${esc(office)}${h && h.since ? ` · ${esc(h.since)}~` : ''}</span></div>
                <div class="pv-holder-fields">
                    <input type="text" value="${esc(h ? h.name : '')}" placeholder="이름" data-key="${esc(key)}" onchange="PopVote.setHolder(this.dataset.key,'name',this.value)">
                    <select data-key="${esc(key)}" onchange="PopVote.setHolder(this.dataset.key,'partyId',this.value)">${partyOptions(h ? h.partyId : '')}</select>
                </div>
            </div>
        </div>`;
    }
    function renderHolders() {
        const box = ge('pvHolders');
        if (!box) return;
        const ch = chamberOk(S.local.chamber);
        const groups = holderTree(ch);
        if (!groups.length) { box.innerHTML = ''; return; }
        const all = groups.flatMap(g => (g.region ? [g.head] : []).concat(g.districts.map(d => d.h)));
        const filled = all.filter(filledH).length;
        box.innerHTML = `
            <details class="pv-details pv-holders" ${filled ? 'open' : ''}>
                <summary>현직 단체장 (${filled} / ${all.length})</summary>
                <button type="button" class="pv-holders-map" onclick="PopVote.showHolders()">🏛 단체장 현황 보기</button>
                ${groups.map(g => `
                <div class="pv-holder-group">
                    ${g.region ? holderEditRow(g.rKey, g.region.name, g.head, (g.head && g.head.office) || officeOf('region'), true) : '<div class="pv-holder-nogroup">권역 없음</div>'}
                    <details class="pv-holder-sub"><summary>${esc(officeOf('district'))} ${g.districts.filter(d => filledH(d.h)).length} / ${g.districts.length}</summary>
                        <div class="pv-holder-list">${g.districts.map(d => holderEditRow(d.key, d.name, d.h, (d.h && d.h.office) || officeOf('district'), false)).join('')}</div>
                    </details>
                </div>`).join('')}
            </details>`;
    }
    // 오른쪽 시각 화면: 내각 화면처럼 권역장 카드 아래에 그 권역의 지역구장 카드
    function holderCard(name, h, office, big) {
        const p = h ? partyById(h.partyId) : null;
        return `<div class="pv-hcard${big ? ' pv-hcard-big' : ''}" style="border-left-color:${p ? p.color : '#555'}">
            <span class="pv-holder-photo${big ? '' : ' pv-holder-photo-sm'}">${h && h.photo ? `<img src="${h.photo}" alt="">` : '👤'}</span>
            <span class="pv-hcard-main">
                <span class="pv-hcard-office">${esc(name)} ${esc(office)}</span>
                <b class="pv-hcard-name">${esc(h && h.name ? h.name : (filledH(h) ? '이름 미입력' : '공석'))}</b>
                ${p ? `<span class="pv-hcard-party"><span class="pv-dot" style="background:${p.color}"></span>${esc(p.name)}</span>` : ''}
            </span>
        </div>`;
    }
    function showHoldersOnDisplay(open) {
        const btn = ge('dispTabPopVote');
        const box = ge('pvDisplay');
        if (!btn || !box) return;
        const ch = chamberOk(S.local.chamber);
        const groups = holderTree(ch);
        btn.querySelector('.disp-tab-label').textContent = '지방자치';
        btn.dataset.view = 'holders';
        btn.style.display = '';
        const counts = (list) => { const c = {}; list.forEach(h => { const pid = filledH(h) ? String(h.partyId) : ''; c[pid] = (c[pid] || 0) + 1; }); return c; };
        const chips = c => Object.keys(c).sort((a, b) => (a === '') - (b === '') || c[b] - c[a])
            .map(pid => { const p = partyById(pid); return `<span class="pv-count-chip"><span class="pv-dot" style="background:${p ? p.color : '#888'}"></span>${esc(p ? p.name : '공석')} ${c[pid]}</span>`; }).join('');
        const heads = groups.filter(g => g.region).map(g => g.head);
        const dists = groups.flatMap(g => g.districts.map(d => d.h));
        box.innerHTML = `
            <div class="pv-result">
                <div class="pv-result-title">지방자치 현황</div>
                ${heads.length ? `<div class="pv-level-head">${esc(officeOf('region'))} ${heads.length}명</div><div class="pv-holder-counts">${chips(counts(heads))}</div>` : ''}
                ${dists.length ? `<div class="pv-level-head">${esc(officeOf('district'))} ${dists.length}명</div><div class="pv-holder-counts">${chips(counts(dists))}</div>` : ''}
                <div class="pv-map" data-map="holders"></div>
                ${groups.map(g => `
                <div class="pv-hgroup">
                    ${g.region ? holderCard(g.region.name, g.head, (g.head && g.head.office) || officeOf('region'), true) : '<div class="pv-holder-nogroup">권역 없음</div>'}
                    <div class="pv-hgrid">${g.districts.map(d => holderCard(d.name, d.h, (d.h && d.h.office) || officeOf('district'), false)).join('')}</div>
                </div>`).join('')}
            </div>`;
        // 지도: 지역구장 정당 색, 권역 경계는 굵게 — 지역구장이 하나도 없으면 권역장 색
        const H = S.local.holders;
        const anyDistrict = dists.some(filledH);
        const regionOfKey = {};
        groups.forEach(g => { if (g.region) g.region.keys.forEach(k => { regionOfKey[k] = g; }); });
        drawMap(box.querySelector('[data-map="holders"]'), ch, key => {
            const h = anyDistrict ? H[holderKey('district', ch, key)] : regionOfKey[key]?.head;
            const p = filledH(h) ? partyById(h.partyId) : null;
            return p ? tendencyColorForPct(p.color, 75) : 'transparent';
        }, key => {
            const dh = H[holderKey('district', ch, key)];
            const g = regionOfKey[key];
            const line = (label, h) => `${label}: ${h && h.name ? h.name + ' ' : ''}${filledH(h) ? `(${partyById(h.partyId)?.name || '?'})` : '공석'}`;
            return [line(nameOf(ch, key), dh), g ? line(g.region.name, g.head) : ''].filter(Boolean).join(' · ');
        }, key => regionOfKey[key]?.region.id ?? null);
        if (open) {
            if (typeof showSeatsOnMobile === 'function') showSeatsOnMobile();
            if (typeof switchDispTab === 'function') switchDispTab('popVote');
        }
    }

    // ===================== 국민투표 =====================
    function runRef() {
        readRefInputs();
        const R = S.ref;
        const q = (R.question || '').trim();
        if (!q) { showCustomAlert('국민투표에 부칠 안건(질문)을 적어 주세요.'); return; }
        const ch = chamberOk(R.chamber);
        const keys = districtKeys(ch);
        const stanceW = pid => STANCE_YES[R.stances[pid] || 'neutral'];
        const parts = [];
        let missingPop = 0;
        const partyYes = shares => Object.entries(shares).reduce((a, [pid, s]) => a + s * stanceW(pid), 0);
        if (keys.length) {
            keys.forEach(k => {
                let pop = popOf(ch, k);
                if (pop == null) { pop = DEFAULT_POP; missingPop++; }
                const shares = partySharesFor(ch, k, 5);
                const yesShare = clamp((Object.keys(shares).length ? partyYes(shares) : 0.5) + rand(0.06), 0.01, 0.99);
                const turnout = clamp(R.turnout + rand(6), 5, 100) / 100;
                const cast = Math.round(pop * turnout);
                const yes = Math.round(cast * yesShare);
                parts.push({ key: k, name: nameOf(ch, k), electorate: pop, voters: cast, yes, no: cast - yes });
            });
        } else {
            // 지역구가 없으면 전국 하나로 — 지지율 탭의 전국 지지율 사용
            const store = elecStore[ch] || {};
            const list = runningParties();
            const tot = list.reduce((a, p) => a + (store[p.id]?.prob || 0), 0);
            const shares = {};
            if (tot > 0) list.forEach(p => { if ((store[p.id]?.prob || 0) > 0) shares[p.id] = store[p.id].prob / tot; });
            const yesShare = clamp((Object.keys(shares).length ? partyYes(shares) : 0.5) + rand(0.04), 0.01, 0.99);
            const turnout = clamp(R.turnout + rand(4), 5, 100) / 100;
            const cast = Math.round(NATION_VOTERS * turnout);
            const yes = Math.round(cast * yesShare);
            parts.push({ key: null, name: '전국', electorate: NATION_VOTERS, voters: cast, yes, no: cast - yes });
        }
        const electorate = parts.reduce((a, x) => a + x.electorate, 0);
        const voters = parts.reduce((a, x) => a + x.voters, 0);
        const yes = parts.reduce((a, x) => a + x.yes, 0);
        const no = voters - yes;
        const turnoutPct = pct(voters, electorate);
        const quorumFail = R.quorumOn && turnoutPct < R.quorum;
        const passed = !quorumFail && yes > no;
        const rec = {
            id: 'ref' + Date.now().toString(36),
            question: q, year: R.year, chamber: ch, quorumOn: R.quorumOn, quorum: R.quorum,
            stances: { ...R.stances }, parts, electorate, voters, yes, no, passed, quorumFail, missingPop, at: Date.now(),
        };
        R.last = rec;
        R.records.unshift(rec);
        R.records = R.records.slice(0, MAX_RECORDS);
        renderRef();
        showOnDisplay('ref', rec, true);
    }

    function renderRefResult(rec, box, withMap) {
        if (!rec) { box.innerHTML = ''; return; }
        const yesP = pct(rec.yes, rec.voters), noP = pct(rec.no, rec.voters);
        const canToggle = !withMap && hasMap(rec.chamber) && rec.parts.some(x => x.key); // 오른쪽 결과 탭은 위에 큰 지도가 따로 있다
        const verdict = rec.passed ? '가결' : rec.quorumFail ? '부결 (투표율 미달)' : '부결';
        box.innerHTML = `
            <div class="pv-result">
                <div class="pv-result-title">${esc(rec.question)}${rec.year ? ` <span class="pv-dim">(${esc(rec.year)})</span>` : ''}</div>
                <div class="pv-verdict ${rec.passed ? 'pv-yes' : 'pv-no'}">${verdict}</div>
                <div class="pv-bar"><span class="pv-bar-yes" style="width:${yesP}%"></span><span class="pv-bar-no" style="width:${noP}%"></span></div>
                <div class="pv-ref-nums">
                    <div><span class="pv-dim">찬성</span> <b>${fmt(rec.yes)}</b>표 (${yesP.toFixed(1)}%)</div>
                    <div><span class="pv-dim">반대</span> <b>${fmt(rec.no)}</b>표 (${noP.toFixed(1)}%)</div>
                </div>
                <div class="pv-dim pv-small">투표율 ${pct(rec.voters, rec.electorate).toFixed(1)}% (${fmt(rec.voters)} / ${fmt(rec.electorate)}명)${rec.quorumOn ? ` · 투표율 기준 ${rec.quorum}%` : ''}${rec.missingPop ? ` · 인구 미입력 ${rec.missingPop}곳은 ${fmt(DEFAULT_POP)}명으로 계산` : ''}</div>
                ${withMap && (rec.parts.length > 1 || rec.parts[0]?.key) ? '<div class="pv-map" data-map="ref"></div>' : ''}
                ${rec.parts.length > 1 ? `<details class="pv-details${canToggle ? ' pv-units-host' : ''}"><summary>지역구별 결과 (${rec.parts.length})</summary>${canToggle ? unitsToggleHtml() : ''}<div class="pv-units">${rec.parts.map(x => `
                    <div class="pv-unit" style="border-left-color:${x.yes > x.no ? 'var(--pv-yes)' : 'var(--pv-no)'}"><div><b>${esc(x.name)}</b> — 찬성 ${pct(x.yes, x.voters).toFixed(1)}%</div>
                    <div class="pv-dim pv-small">찬성 ${fmt(x.yes)} · 반대 ${fmt(x.no)} · 투표율 ${pct(x.voters, x.electorate).toFixed(1)}%</div></div>`).join('')}</div>${canToggle ? '<div class="pv-map" data-map="ref-units"></div>' : ''}</details>` : ''}
            </div>`;
        const host = box.querySelector('.pv-units-host');
        if (host) setupUnitsHost(host, el => drawRefMap(el, rec));
        const mapEl = box.querySelector('[data-map="ref"]');
        if (mapEl) drawRefMap(mapEl, rec);
    }

    // 국민투표 지도 — 찬성이 많은 지역구는 초록, 반대가 많은 지역구는 빨강 (차이가 클수록 진하게)
    function drawRefMap(mapEl, rec) {
        const byKey = {};
        rec.parts.forEach(x => { if (x.key) byKey[x.key] = x; });
        drawMap(mapEl, rec.chamber, key => {
            const x = byKey[key];
            if (!x || !x.voters) return 'transparent';
            const y = pct(x.yes, x.voters);
            return y >= 50 ? tendencyColorForPct('#16a34a', 35 + (y - 50) * 1.3) : tendencyColorForPct('#dc2626', 35 + (50 - y) * 1.3);
        }, key => {
            const x = byKey[key];
            return x ? `${x.name}: 찬성 ${pct(x.yes, x.voters).toFixed(1)}% · 투표율 ${pct(x.voters, x.electorate).toFixed(1)}%` : nameOf(rec.chamber, key);
        });
    }

    // ---- 오른쪽 시각 화면의 결과 탭 (지도 포함) ----
    function showOnDisplay(kind, rec, open) {
        const btn = ge('dispTabPopVote');
        const box = ge('pvDisplay');
        if (!btn || !box || !rec) return;
        btn.querySelector('.disp-tab-label').textContent = kind === 'local' ? '지선 결과' : '국민투표 결과';
        btn.dataset.view = kind;
        btn.style.display = '';
        if (kind === 'local') renderLocalResult(rec, box, true); else renderRefResult(rec, box, true);
        if (open) {
            if (typeof window.showSeatsOnMobile === 'function') window.showSeatsOnMobile();
            else if (typeof showSeatsOnMobile === 'function') showSeatsOnMobile();
            if (typeof switchDispTab === 'function') switchDispTab('popVote');
        }
    }

    // ---- 단위별 결과: 목록 ↔ 지도 ----
    // 왼쪽 패널의 "지역구별 · 권역별 결과"를 목록 대신 지도로도 본다. 고른 보기는 이 기기에 기억하고 모든 결과에 같이 적용
    let unitsView = (() => { try { return localStorage.getItem('pvUnitsView') === 'map' ? 'map' : 'list'; } catch (e) { return 'list'; } })();
    const hasMap = ch => typeof districtSvgMapFor === 'function' && !!districtSvgMapFor(ch);
    function unitsToggleHtml() {
        return `<div class="pv-view-toggle" role="group">${[['list', '목록'], ['map', '지도']].map(([v, t]) =>
            `<button type="button" data-v="${v}" onclick="PopVote.setUnitsView('${v}')">${t}</button>`).join('')}</div>`;
    }
    function setupUnitsHost(host, draw) {
        const mapEl = host.querySelector('.pv-map');
        if (mapEl) mapEl._pvDraw = draw;
        applyUnitsView(host);
    }
    function applyUnitsView(host) {
        const map = unitsView === 'map';
        const list = host.querySelector('.pv-units');
        const mapEl = host.querySelector('.pv-map');
        if (list) list.hidden = map;
        if (mapEl) {
            mapEl.hidden = !map;
            // 지도는 처음 지도 보기로 바꿀 때 한 번만 그린다
            if (map && !mapEl.dataset.drawn && mapEl._pvDraw) { mapEl.dataset.drawn = '1'; mapEl._pvDraw(mapEl); }
        }
        host.querySelectorAll('.pv-view-toggle button').forEach(b => b.classList.toggle('active', b.dataset.v === unitsView));
    }
    function setUnitsView(v) {
        unitsView = v === 'map' ? 'map' : 'list';
        try { localStorage.setItem('pvUnitsView', unitsView); } catch (e) { /* 저장 불가 환경 */ }
        document.querySelectorAll('.pv-units-host').forEach(applyUnitsView);
    }
    // 지방선거 한 단계(권역장 또는 지역구장)의 지도 — 당선 정당 색, 득표율이 높을수록 진하게 (권역 단계는 권역 경계를 굵게)
    function drawLevelMap(el, rec, lv) {
        const byKey = {};
        lv.results.forEach(r => r.keys.forEach(k => { byKey[k] = r; }));
        drawMap(el, rec.chamber, key => {
            const r = byKey[key];
            const p = r && partyById(r.winner);
            if (!p) return 'transparent';
            const all = Object.values(r.votes).reduce((a, b) => a + b, 0);
            return tendencyColorForPct(p.color, 45 + pct(r.votes[r.winner] || 0, all) * 0.55);
        }, key => {
            const r = byKey[key];
            if (!r) return nameOf(rec.chamber, key);
            const p = partyById(r.winner);
            const all = Object.values(r.votes).reduce((a, b) => a + b, 0);
            return `${r.name}: ${p ? `${p.name} ${pct(r.votes[r.winner] || 0, all).toFixed(1)}%` : '당선자 없음'}`;
        }, lv.unit === 'region' ? key => byKey[key]?.id ?? null : null);
    }

    // ---- 지도 (지역구 지도가 있을 때만) ----
    // 확대 · 축소 · 이동은 모든 지도 공용(main.js mapZoomAttach — 오른쪽 위 버튼, Shift+스크롤, 휠클릭 드래그).
    // 지도 틀의 가로세로 비율은 실제 도형이 차지하는 범위(맞춘 viewBox)로 정한다 — 저장된 viewBox가 도형보다 훨씬 크면
    // 지도가 틀 가운데에 점처럼 작게 그려지던 문제. 숨은 화면에서 그리면 도형 크기를 잴 수 없어서, 보이게 되면 다시 그린다.
    function drawMap(el, ch, getFill, title, groupOf) {
        if (!el) return;
        const map = typeof districtSvgMapFor === 'function' ? districtSvgMapFor(ch) : null;
        if (!map) { el.remove(); return; }
        if (!el._pz) el._pz = { zoom: 1, cx: null, cy: null, baseViewBox: null };
        const opts = { chamber: ch, getFill, title, groupOf: groupOf || undefined, panZoom: el._pz };
        const render = () => {
            el._pz.baseViewBox = null;
            renderDistrictSvgInto(el, opts);
            const b = el._pz.baseViewBox;
            const vb = b ? [b.w, b.h] : String(map.viewBox || '0 0 100 100').split(/[\s,]+/).map(Number).slice(2);
            if (vb[0] > 0 && vb[1] > 0) el.style.aspectRatio = `${vb[0]} / ${vb[1]}`;
            return !!b;
        };
        if (render() || !window.ResizeObserver) return;
        // 숨은 화면(닫힌 탭 · 접힌 목록)에서 그려져 도형 크기를 못 쟀다 — 보이게 되면 한 번 다시 그린다
        el._pvRO?.disconnect();
        el._pvRO = new ResizeObserver(() => {
            if (el.getBoundingClientRect().width <= 0) return;
            el._pvRO.disconnect();
            el._pvRO = null;
            render();
        });
        el._pvRO.observe(el);
    }

    // ===================== 화면 =====================
    function chamberOptions(sel) {
        return chamberList().map(c => `<option value="${c}" ${c === sel ? 'selected' : ''}>${esc(chamberDisplayName(c))}</option>`).join('');
    }
    function readLocalInputs() {
        const L = S.local;
        L.title = ge('pvLocalTitle')?.value || '';
        L.year = ge('pvLocalYear')?.value || '';
        if (ge('pvLocalOfficeRegion')) {
            L.officeRegion = ge('pvLocalOfficeRegion').value.trim() || '지사';
            L.officeDistrict = ge('pvLocalOfficeDistrict').value.trim() || '시장';
            L.doRegion = !!ge('pvLocalDoRegion').checked;
            L.doDistrict = !!ge('pvLocalDoDistrict').checked;
        }
        L.chamber = ge('pvLocalChamber')?.value || 'house';
        L.turnout = clamp(parseFloat(ge('pvLocalTurnout')?.value) || 55, 1, 100);
        L.noise = clamp(parseFloat(ge('pvLocalNoise')?.value) || 0, 0, 50);
    }
    function readRefInputs() {
        const R = S.ref;
        R.question = ge('pvRefQuestion')?.value || '';
        R.year = ge('pvRefYear')?.value || '';
        R.chamber = ge('pvRefChamber')?.value || 'house';
        R.turnout = clamp(parseFloat(ge('pvRefTurnout')?.value) || 55, 1, 100);
        R.quorumOn = !!ge('pvRefQuorumOn')?.checked;
        R.quorum = clamp(parseFloat(ge('pvRefQuorum')?.value) || 0, 0, 100);
        document.querySelectorAll('#pvRefStances select[data-pid]').forEach(sel => { R.stances[sel.dataset.pid] = sel.value; });
    }

    function popStatus(ch, unit) {
        const keys = districtKeys(ch);
        if (!keys.length) return '지역구가 없습니다 — 여론 › 지역구에서 지도를 올려 주세요.';
        const withPop = keys.filter(k => popOf(ch, k) != null);
        const total = withPop.reduce((a, k) => a + popOf(ch, k), 0);
        const regionCount = (regions[ch] || []).length;
        return `지역구 ${keys.length}곳 · 인구 입력 ${withPop.length}곳 (합계 ${fmt(total)}명)`
            + (unit === 'region' ? ` · 권역 ${regionCount}개${regionCount ? '' : ' (권역이 없어 권역 단체장은 뽑지 않아요)'}` : '');
    }

    function renderLocal() {
        const box = ge('pvLocalForm');
        if (!box) return;
        const L = S.local;
        L.chamber = chamberOk(L.chamber);
        box.innerHTML = `
            <div class="pv-grid2">
                <div><label class="pv-label">선거 제목</label><input type="text" id="pvLocalTitle" value="${esc(L.title)}" placeholder="예: 제1회 전국동시지방선거"></div>
                <div><label class="pv-label">연도</label><input type="number" id="pvLocalYear" value="${esc(L.year)}" placeholder="1995"></div>
            </div>
            <label class="pv-label pv-label-block">뽑는 자리</label>
            <div class="pv-offices">
                <label class="pv-office"><input type="checkbox" id="pvLocalDoRegion" ${L.doRegion ? 'checked' : ''}> 권역마다
                    <input type="text" id="pvLocalOfficeRegion" value="${esc(L.officeRegion)}" placeholder="예: 지사"></label>
                <label class="pv-office"><input type="checkbox" id="pvLocalDoDistrict" ${L.doDistrict ? 'checked' : ''}> 지역구마다
                    <input type="text" id="pvLocalOfficeDistrict" value="${esc(L.officeDistrict)}" placeholder="예: 시장"></label>
            </div>
            <div class="pv-grid3">
                <div><label class="pv-label">지도 · 인구 기준 원</label><select id="pvLocalChamber" onchange="PopVote.refresh()">${chamberOptions(L.chamber)}</select></div>
                <div><label class="pv-label">투표율 (%)</label><input type="number" id="pvLocalTurnout" min="1" max="100" value="${L.turnout}"></div>
                <div><label class="pv-label">노이즈 (±%)</label><input type="number" id="pvLocalNoise" min="0" max="50" value="${L.noise}"></div>
            </div>
            <div class="pv-note">${esc(popStatus(L.chamber, 'region'))}<br>득표율은 지역구 성향(없으면 전국 지지율)에 노이즈를 더해 정하고, 득표수는 인구 × 투표율로 계산합니다.</div>
            <button type="button" class="pv-run" onclick="PopVote.runLocal()" data-modern-label="개표 시작">&gt;&gt; 개표 시작 &lt;&lt;</button>
            <div id="pvLocalResult"></div>
            <div id="pvHolders"></div>
            ${recordsHtml('local')}`;
        renderLocalResult(L.last, ge('pvLocalResult'));
        renderHolders();
    }

    function renderRef() {
        const box = ge('pvRefForm');
        if (!box) return;
        const R = S.ref;
        R.chamber = chamberOk(R.chamber);
        const list = parties.filter(p => p.ideologyId !== (typeof IND_IDEOLOGY_ID !== 'undefined' ? IND_IDEOLOGY_ID : '__none__'));
        box.innerHTML = `
            <div class="pv-grid2">
                <div><label class="pv-label">안건 (질문)</label><input type="text" id="pvRefQuestion" value="${esc(R.question)}" placeholder="예: 헌법 개정안에 찬성하십니까?"></div>
                <div><label class="pv-label">연도</label><input type="number" id="pvRefYear" value="${esc(R.year)}" placeholder="1987"></div>
            </div>
            <div class="pv-grid3">
                <div><label class="pv-label">지도 · 인구 기준 원</label><select id="pvRefChamber" onchange="PopVote.refresh()">${chamberOptions(R.chamber)}</select></div>
                <div><label class="pv-label">투표율 (%)</label><input type="number" id="pvRefTurnout" min="1" max="100" value="${R.turnout}"></div>
                <div><label class="pv-label"><input type="checkbox" id="pvRefQuorumOn" ${R.quorumOn ? 'checked' : ''}> 투표율 기준 (%)</label><input type="number" id="pvRefQuorum" min="0" max="100" value="${R.quorum}"></div>
            </div>
            <label class="pv-label pv-label-block">정당별 입장 <span class="pv-dim">— 지지층이 입장대로 찬반을 나눕니다 (찬성 85% · 중립 50% · 반대 15%가 찬성)</span></label>
            <div id="pvRefStances" class="pv-stances">${list.length ? list.map(p => `
                <div class="pv-stance"><span class="pv-dot" style="background:${p.color}"></span><span class="pv-stance-name">${esc(p.name)}</span>
                    <select data-pid="${p.id}">${[['yes', '찬성'], ['neutral', '중립'], ['no', '반대']].map(([v, t]) => `<option value="${v}" ${(R.stances[p.id] || 'neutral') === v ? 'selected' : ''}>${t}</option>`).join('')}</select></div>`).join('') : '<div class="pv-dim">정당이 없습니다.</div>'}</div>
            <div class="pv-note">${esc(districtKeys(R.chamber).length ? popStatus(R.chamber, 'district') : `지역구가 없어 전국 하나로 계산합니다 (유권자 ${fmt(NATION_VOTERS)}명, 지지율 탭의 전국 지지율 사용).`)}<br>투표율 기준을 켜면 투표율이 그보다 낮을 때 찬성이 많아도 부결됩니다.</div>
            <button type="button" class="pv-run" onclick="PopVote.runRef()" data-modern-label="개표 시작">&gt;&gt; 개표 시작 &lt;&lt;</button>
            <div id="pvRefResult"></div>
            ${recordsHtml('ref')}`;
        renderRefResult(R.last, ge('pvRefResult'));
    }

    function recordsHtml(kind) {
        const list = S[kind].records;
        if (!list.length) return '';
        return `<details class="pv-details pv-records"><summary>지난 기록 (${list.length})</summary>${list.map(r => `
            <div class="pv-record-row">
                <button type="button" class="pv-record-open" onclick="PopVote.show('${kind}','${r.id}')">${esc(kind === 'local' ? r.title : r.question)}${kind === 'ref' ? ` — ${r.passed ? '가결' : '부결'}` : ''}</button>
                <button type="button" class="pv-record-del" title="기록 삭제" onclick="PopVote.remove('${kind}','${r.id}')">✕</button>
            </div>`).join('')}</details>`;
    }

    function show(kind, id) {
        const r = S[kind].records.find(x => x.id === id);
        if (!r) return;
        S[kind].last = r;
        if (kind === 'local') renderLocal(); else renderRef();
        showOnDisplay(kind, r, true);
    }
    function remove(kind, id) {
        showCustomConfirm('이 기록을 삭제할까요?', () => {
            S[kind].records = S[kind].records.filter(x => x.id !== id);
            if (S[kind].last && S[kind].last.id === id) S[kind].last = null;
            if (kind === 'local') renderLocal(); else renderRef();
        });
    }
    function refresh() {
        if (ge('pvLocalForm')) { readLocalInputs(); renderLocal(); }
        if (ge('pvRefForm')) { readRefInputs(); renderRef(); }
    }

    // ---- 저장 · 불러오기 ----
    function getState() {
        return JSON.parse(JSON.stringify(S));
    }
    function setState(st) {
        const base = {
            // holders: 현직 단체장 { '<단위>:<원>:<권역 id | 지역구 키>': { partyId, name, photo, office, since } }
        local: { title: '', year: '', officeRegion: '지사', officeDistrict: '시장', doRegion: true, doDistrict: true, chamber: 'house', turnout: 55, noise: 8, records: [], last: null, holders: {} },
            ref: { question: '', year: '', chamber: 'house', turnout: 55, quorumOn: true, quorum: 50, stances: {}, records: [], last: null },
        };
        const src = st && typeof st === 'object' ? st : {};
        ['local', 'ref'].forEach(k => {
            S[k] = { ...base[k], ...(src[k] && typeof src[k] === 'object' ? src[k] : {}) };
            if (!Array.isArray(S[k].records)) S[k].records = [];
            if (k === 'local' && (!S[k].holders || typeof S[k].holders !== 'object')) S[k].holders = {};
            // 예전(한 단계만 뽑던) 설정 → 두 단계
            if (k === 'local' && src.local && src.local.office && !src.local.officeRegion) {
                if (src.local.unit === 'district') { S.local.officeDistrict = src.local.office; S.local.doRegion = false; }
                else { S.local.officeRegion = src.local.office; }
            }
            if (S[k].last && S[k].records.length && !S[k].records.some(r => r.id === S[k].last.id)) S[k].last = null;
        });
        if (ge('pvLocalForm')) renderLocal();
        if (ge('pvRefForm')) renderRef();
    }

    window.PopVote = {
        runLocal, runRef, renderLocal, renderRef, refresh, show, remove, getState, setState,
        applyLocal, setHolder, uploadHolderPhoto, setUnitsView, showHolders: () => showHoldersOnDisplay(true),
    };
})();
