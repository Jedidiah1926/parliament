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
        local: { title: '', year: '', office: '단체장', unit: 'region', chamber: 'house', turnout: 55, noise: 8, records: [], last: null },
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
    function districtKeys(ch) { return Object.keys(districtGrid[ch] || {}); }
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
    function localUnits(ch, unit) {
        const keys = districtKeys(ch);
        if (unit === 'region') {
            const list = (regions[ch] || []).map(r => ({ id: r.id, name: r.name, color: r.color, keys: keys.filter(k => districtRegionMap[ch]?.[k] === r.id) })).filter(u => u.keys.length);
            if (list.length) return list;
        }
        return keys.map(k => ({ id: k, name: nameOf(ch, k), keys: [k] }));
    }

    function runLocal() {
        readLocalInputs();
        const L = S.local;
        const ch = chamberOk(L.chamber);
        const units = localUnits(ch, L.unit);
        if (!units.length) {
            showCustomAlert('지방선거를 치를 지역이 없습니다.\n여론 › 지역구에서 지도를 올리고 지역구를 만든 뒤(권역 단위면 여론 › 권역에서 권역도) 다시 시도하세요.');
            return;
        }
        let missingPop = 0;
        const results = units.map(u => {
            const votes = {};
            let voters = 0, electorate = 0;
            u.keys.forEach(k => {
                let pop = popOf(ch, k);
                if (pop == null) { pop = DEFAULT_POP; missingPop++; }
                const turnout = clamp(L.turnout + rand(5), 5, 100) / 100;
                const cast = Math.round(pop * turnout);
                electorate += pop;
                voters += cast;
                const shares = partySharesFor(ch, k, L.noise);
                Object.entries(shares).forEach(([pid, s]) => { votes[pid] = (votes[pid] || 0) + cast * s; });
            });
            Object.keys(votes).forEach(pid => { votes[pid] = Math.round(votes[pid]); });
            const ranked = Object.entries(votes).sort((a, b) => b[1] - a[1]);
            return { id: u.id, name: u.name, keys: u.keys, electorate, voters, votes, winner: ranked[0] ? ranked[0][0] : null };
        });
        const rec = {
            id: 'loc' + Date.now().toString(36),
            title: L.title || `${L.year ? L.year + '년 ' : ''}지방선거`,
            year: L.year, office: L.office || '단체장',
            unit: L.unit === 'region' && units.some(u => (regions[ch] || []).some(r => r.id === u.id)) ? 'region' : 'district',
            chamber: ch, results, missingPop, at: Date.now(),
        };
        L.last = rec;
        L.records.unshift(rec);
        L.records = L.records.slice(0, MAX_RECORDS);
        renderLocal();
        showOnDisplay('local', rec, true);
    }

    function localSummary(rec) {
        const won = {}, total = {};
        let allVotes = 0, voters = 0, electorate = 0;
        rec.results.forEach(r => {
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
        const sum = localSummary(rec);
        const unitWord = rec.unit === 'region' ? '권역' : '지역구';
        box.innerHTML = `
            <div class="pv-result">
                <div class="pv-result-title">${esc(rec.title)} <span class="pv-dim">— ${esc(rec.office)} ${rec.results.length}명</span></div>
                <div class="pv-dim pv-small">투표율 ${pct(sum.voters, sum.electorate).toFixed(1)}% · 유권자 ${fmt(sum.electorate)}명 · 투표 ${fmt(sum.voters)}명${rec.missingPop ? ` · 인구 미입력 ${rec.missingPop}곳은 ${fmt(DEFAULT_POP)}명으로 계산` : ''}</div>
                ${withMap ? '<div class="pv-map" data-map="local"></div>' : ''}
                <table class="pv-table">
                    <thead><tr><th>정당</th><th>당선</th><th>득표</th><th>득표율</th></tr></thead>
                    <tbody>${sum.rows.map(r => { const p = partyById(r.pid); return `
                        <tr><td><span class="pv-dot" style="background:${p ? p.color : '#888'}"></span>${esc(p ? p.name : '?')}</td>
                        <td>${r.won}</td><td>${fmt(r.votes)}</td><td>${pct(r.votes, sum.allVotes).toFixed(1)}%</td></tr>`; }).join('')}</tbody>
                </table>
                <details class="pv-details"><summary>${unitWord}별 결과 (${rec.results.length})</summary>
                    <div class="pv-units">${rec.results.map(r => {
                        const p = partyById(r.winner);
                        const top = Object.entries(r.votes).sort((a, b) => b[1] - a[1]).slice(0, 3);
                        const all = Object.values(r.votes).reduce((a, b) => a + b, 0);
                        return `<div class="pv-unit" style="border-left-color:${p ? p.color : '#888'}">
                            <div><b>${esc(r.name)}</b> — ${esc(p ? p.name : '당선자 없음')}</div>
                            <div class="pv-dim pv-small">${top.map(([pid, v]) => `${esc(partyById(pid)?.name || '?')} ${fmt(v)}표(${pct(v, all).toFixed(1)}%)`).join(' · ')} · 투표율 ${pct(r.voters, r.electorate).toFixed(1)}%</div>
                        </div>`;
                    }).join('')}</div>
                </details>
            </div>`;
        const mapEl = box.querySelector('[data-map="local"]');
        if (!mapEl) return;
        const byKey = {};
        rec.results.forEach(r => r.keys.forEach(k => { byKey[k] = r; }));
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
            return `${r.name}: ${p ? p.name : '당선자 없음'}`;
        }, rec.unit === 'region' ? key => byKey[key]?.id ?? null : null);
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
                ${rec.parts.length > 1 ? `<details class="pv-details"><summary>지역구별 결과 (${rec.parts.length})</summary><div class="pv-units">${rec.parts.map(x => `
                    <div class="pv-unit" style="border-left-color:${x.yes > x.no ? 'var(--pv-yes)' : 'var(--pv-no)'}"><div><b>${esc(x.name)}</b> — 찬성 ${pct(x.yes, x.voters).toFixed(1)}%</div>
                    <div class="pv-dim pv-small">찬성 ${fmt(x.yes)} · 반대 ${fmt(x.no)} · 투표율 ${pct(x.voters, x.electorate).toFixed(1)}%</div></div>`).join('')}</div></details>` : ''}
            </div>`;
        const mapEl = box.querySelector('[data-map="ref"]');
        if (!mapEl) return;
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
        btn.style.display = '';
        if (kind === 'local') renderLocalResult(rec, box, true); else renderRefResult(rec, box, true);
        if (open) {
            if (typeof window.showSeatsOnMobile === 'function') window.showSeatsOnMobile();
            else if (typeof showSeatsOnMobile === 'function') showSeatsOnMobile();
            if (typeof switchDispTab === 'function') switchDispTab('popVote');
        }
    }

    // ---- 지도 (지역구 지도가 있을 때만) ----
    function drawMap(el, ch, getFill, title, groupOf) {
        if (!el) return;
        const map = typeof districtSvgMapFor === 'function' ? districtSvgMapFor(ch) : null;
        if (!map) { el.remove(); return; }
        const vb = String(map.viewBox || '0 0 100 100').split(/[\s,]+/).map(Number);
        if (vb[2] > 0 && vb[3] > 0) el.style.aspectRatio = `${vb[2]} / ${vb[3]}`;
        renderDistrictSvgInto(el, { chamber: ch, getFill, title, groupOf: groupOf || undefined });
    }

    // ===================== 화면 =====================
    function chamberOptions(sel) {
        return chamberList().map(c => `<option value="${c}" ${c === sel ? 'selected' : ''}>${esc(chamberDisplayName(c))}</option>`).join('');
    }
    function readLocalInputs() {
        const L = S.local;
        L.title = ge('pvLocalTitle')?.value || '';
        L.year = ge('pvLocalYear')?.value || '';
        L.office = ge('pvLocalOffice')?.value || '단체장';
        L.unit = ge('pvLocalUnit')?.value === 'district' ? 'district' : 'region';
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
            + (unit === 'region' ? ` · 권역 ${regionCount}개${regionCount ? '' : ' (권역이 없어 지역구 단위로 치러요)'}` : '');
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
            <div class="pv-grid2">
                <div><label class="pv-label">뽑는 자리</label><input type="text" id="pvLocalOffice" value="${esc(L.office)}" placeholder="예: 도지사 · 시장"></div>
                <div><label class="pv-label">선거 단위</label><select id="pvLocalUnit" onchange="PopVote.refresh()">
                    <option value="region" ${L.unit === 'region' ? 'selected' : ''}>권역마다 1명</option>
                    <option value="district" ${L.unit === 'district' ? 'selected' : ''}>지역구마다 1명</option></select></div>
            </div>
            <div class="pv-grid3">
                <div><label class="pv-label">지도 · 인구 기준 원</label><select id="pvLocalChamber" onchange="PopVote.refresh()">${chamberOptions(L.chamber)}</select></div>
                <div><label class="pv-label">투표율 (%)</label><input type="number" id="pvLocalTurnout" min="1" max="100" value="${L.turnout}"></div>
                <div><label class="pv-label">노이즈 (±%)</label><input type="number" id="pvLocalNoise" min="0" max="50" value="${L.noise}"></div>
            </div>
            <div class="pv-note">${esc(popStatus(L.chamber, L.unit))}<br>득표율은 지역구 성향(없으면 전국 지지율)에 노이즈를 더해 정하고, 득표수는 인구 × 투표율로 계산합니다.</div>
            <button type="button" class="pv-run" onclick="PopVote.runLocal()" data-modern-label="개표 시작">&gt;&gt; 개표 시작 &lt;&lt;</button>
            <div id="pvLocalResult"></div>
            ${recordsHtml('local')}`;
        renderLocalResult(L.last, ge('pvLocalResult'));
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
            local: { title: '', year: '', office: '단체장', unit: 'region', chamber: 'house', turnout: 55, noise: 8, records: [], last: null },
            ref: { question: '', year: '', chamber: 'house', turnout: 55, quorumOn: true, quorum: 50, stances: {}, records: [], last: null },
        };
        const src = st && typeof st === 'object' ? st : {};
        ['local', 'ref'].forEach(k => {
            S[k] = { ...base[k], ...(src[k] && typeof src[k] === 'object' ? src[k] : {}) };
            if (!Array.isArray(S[k].records)) S[k].records = [];
            if (S[k].last && S[k].records.length && !S[k].records.some(r => r.id === S[k].last.id)) S[k].last = null;
        });
        if (ge('pvLocalForm')) renderLocal();
        if (ge('pvRefForm')) renderRef();
    }

    window.PopVote = { runLocal, runRef, renderLocal, renderRef, refresh, show, remove, getState, setState };
})();
