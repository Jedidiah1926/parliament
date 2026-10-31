// ===== 입법 1.6.0 — 조항 · 상임위원회 · 헌법 · 법령집 (js/main.js의 법안 기능 위에 얹힘) =====
// main.js보다 뒤에 불러온다. 상태(committees · constitution)는 main.js의 getAppState/setAppState가 함께 저장한다.
//
// 법안(bill)에 더해지는 값
//   articles:        [{ title, text }]  — 제1조 · 제2조 … (없던 예전 법안은 content를 "제N조" 줄로 나눠 읽음)
//   kind:            'law'(법률안, 기본) | 'constitution'(헌법 개정안)
//   committeeId:     소관 상임위원회 (없으면 위원회 심사 없이 본회의로)
//   committeeStatus: null | 'pending' | 'pass' | 'fail'   — 'fail'이면 법안은 폐기(최종 부결)
//   committeeVote:   { yea, nay, abs, total, required, stances: { partyId: 'yea'|'nay'|'abs' } }
//   enacted:         헌법 개정안이 가결돼 헌법에 반영됐는지
// 상임위원회: { id, name, chamber, size, chairPartyId, tags: [] }
// 헌법: { title, preamble, articles: [{title,text}], revisions: [{ billId, title, date, at }] } | null

let committees = [];
let constitution = null;

// ── 조항 ─────────────────────────────────────
const ART_HEAD_RE = /^\s*제\s*(\d+)\s*조\s*(?:\(([^)]*)\))?\s*/;

// 법안의 조항 목록 — articles가 없으면 content를 "제N조" 줄로 나눠 읽는다 (예전 법안 · 자동 생성 법안)
function billArticles(bill) {
    if (!bill) return [];
    if (Array.isArray(bill.articles) && bill.articles.length) return bill.articles;
    return parseArticlesFromText(bill.content || '');
}
function parseArticlesFromText(text) {
    const src = String(text || '').trim();
    if (!src) return [];
    const lines = src.split('\n');
    if (!lines.some(l => ART_HEAD_RE.test(l))) return [{ title: '', text: src }];
    const out = [];
    let cur = null;
    lines.forEach(line => {
        const m = ART_HEAD_RE.exec(line);
        if (m) {
            if (cur) out.push(cur);
            cur = { title: (m[2] || '').trim(), text: line.slice(m[0].length).trim() };
        } else if (cur) {
            cur.text = cur.text ? cur.text + '\n' + line : line;
        } else if (line.trim()) {
            cur = { title: '', text: line.trim() };
        }
    });
    if (cur) out.push(cur);
    return out;
}
// 조항 → 한 덩어리 글 (검색 · 예전 화면 호환용 content)
function articlesToText(arts) {
    return (arts || []).map((a, i) => `제${i + 1}조${a.title ? `(${a.title})` : ''} ${a.text || ''}`.trim()).join('\n');
}
function legisEsc(s) {
    return typeof escapeHtmlText === 'function' ? escapeHtmlText(s) : String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}
// 조항 목록 HTML — 법안 카드 · 법령집에서 사용 (limit을 주면 앞쪽 몇 조만)
function articlesHtml(arts, limit) {
    const list = arts || [];
    if (!list.length) return '';
    const shown = limit ? list.slice(0, limit) : list;
    const more = limit && list.length > limit ? `<div class="art-more">… 외 ${list.length - limit}개 조</div>` : '';
    // 조 번호는 UI(번역됨), 조 제목 · 본문은 세이브 데이터라 번역하지 않는다(translate="no")
    return `<ol class="art-list">${shown.map((a, i) => `
        <li><span class="art-head">제${i + 1}조</span>${a.title ? `<span class="art-head" translate="no">(${legisEsc(a.title)})</span>` : ''} <span class="art-body" translate="no">${legisEsc(a.text || '')}</span></li>`).join('')}</ol>${more}`;
}
// 법안 카드 본문 — 조항이 있으면 조문으로, 없으면 아무것도
function billBodyHtml(bill, limit) {
    const arts = billArticles(bill);
    return arts.length ? `<div class="bill-card-body art-card-body">${articlesHtml(arts, limit || 3)}</div>` : '';
}

// ── 조항 편집기 (제출 · 수정 · 헌법 편집 공용) ──
const artEditorState = {}; // containerId → [{title,text}]
function legisRenderArticleEditor(id, articles) {
    const box = document.getElementById(id);
    if (!box) return;
    const arts = (articles && articles.length ? articles : [{ title: '', text: '' }]).map(a => ({ title: a.title || '', text: a.text || '' }));
    artEditorState[id] = arts;
    box.classList.add('art-editor');
    box.innerHTML = arts.map((a, i) => `
        <div class="art-row" data-idx="${i}">
            <div class="art-row-head">
                <span class="art-no">제${i + 1}조</span>
                <input type="text" class="art-title" placeholder="조 제목 (선택, 예: 목적)" value="${legisEsc(a.title)}" maxlength="60">
                <button type="button" class="order-btn" title="위로" onclick="legisArticleAction('${id}',${i},'up')" ${i === 0 ? 'disabled style="opacity:0.2"' : ''}>▲</button>
                <button type="button" class="order-btn" title="아래로" onclick="legisArticleAction('${id}',${i},'down')" ${i === arts.length - 1 ? 'disabled style="opacity:0.2"' : ''}>▼</button>
                <button type="button" class="remove-btn" title="이 조 삭제" onclick="legisArticleAction('${id}',${i},'remove')">X</button>
            </div>
            <textarea class="art-text" rows="2" placeholder="조문 내용">${legisEsc(a.text)}</textarea>
        </div>`).join('') + `<button type="button" class="art-add" onclick="legisArticleAction('${id}',-1,'add')">+ 조 추가</button>`;
}
function legisReadArticleRows(id) {
    const box = document.getElementById(id);
    if (!box) return artEditorState[id] || [];
    return Array.from(box.querySelectorAll('.art-row')).map(row => ({
        title: row.querySelector('.art-title')?.value.trim() || '',
        text: row.querySelector('.art-text')?.value.trim() || '',
    }));
}
// 편집기에서 비어 있지 않은 조항만
function legisReadArticles(id) {
    return legisReadArticleRows(id).filter(a => a.title || a.text);
}
function legisArticleAction(id, idx, action) {
    const arts = legisReadArticleRows(id);
    if (action === 'add') arts.push({ title: '', text: '' });
    else if (action === 'remove') { arts.splice(idx, 1); if (!arts.length) arts.push({ title: '', text: '' }); }
    else if (action === 'up' && idx > 0) [arts[idx - 1], arts[idx]] = [arts[idx], arts[idx - 1]];
    else if (action === 'down' && idx < arts.length - 1) [arts[idx + 1], arts[idx]] = [arts[idx], arts[idx + 1]];
    legisRenderArticleEditor(id, arts);
    if (action === 'add') document.querySelector(`#${id} .art-row:last-of-type .art-text`)?.focus();
}

// ── 법안 종류 (제출 탭) ──
// 헌법 개정안을 고르면 비어 있는 편집기에 지금 헌법 조문을 채우고 가결 기준을 2/3로
function legisOnBillKindChange() {
    const kind = document.getElementById('newBillKind')?.value || 'law';
    if (kind !== 'constitution') return;
    if (!constitution) {
        showCustomAlert('아직 헌법이 없습니다. 입법 › 법령에서 헌법을 먼저 제정하면, 그 조문을 바탕으로 개정안을 낼 수 있어요.\n(빈 개정안을 내면 가결될 때 그 조문이 새 헌법이 됩니다)');
    }
    const current = legisReadArticles('newBillArticles');
    if (!current.length && constitution) legisRenderArticleEditor('newBillArticles', constitution.articles);
    const title = document.getElementById('newBillTitle');
    if (title && !title.value.trim()) title.value = legisUiText(`${constitution?.title || legisUiText('헌법')} 개정안`);
    const thr = document.getElementById('newBillThreshold');
    if (thr && thr.value === '0.5') { thr.value = '0.667'; if (typeof toggleCustomThreshold === 'function') toggleCustomThreshold(); }
}
// 법령 탭의 "헌법 개정안 발의" — 제출 탭으로 옮겨 지금 헌법 조문을 채운다
function legisProposeConstitutionAmendment() {
    switchSubTab('law', 'bill');
    const kind = document.getElementById('newBillKind');
    if (kind) kind.value = 'constitution';
    document.getElementById('newBillTitle').value = legisUiText(`${constitution?.title || legisUiText('헌법')} 개정안`);
    legisRenderArticleEditor('newBillArticles', constitution ? constitution.articles : []);
    const thr = document.getElementById('newBillThreshold');
    if (thr) { thr.value = '0.667'; if (typeof toggleCustomThreshold === 'function') toggleCustomThreshold(); }
    document.getElementById('newBillTitle')?.focus();
}
// 새로 만드는 데이터(기본 위원회 이름 · 개정안 제목 등)는 지금 화면 언어로 — 화면 번역은 데이터를 바꾸지 않으므로 만들 때 바꿔 둔다
function legisUiText(ko) {
    if (!window.DnoLang) return ko;
    return (DnoLang.exact && DnoLang.exact(ko)) || (DnoLang.t ? DnoLang.t(ko) : ko);
}
function billKindLabel(bill) {
    return bill && bill.kind === 'constitution' ? '헌법 개정안' : '';
}

// ── 상임위원회 ───────────────────────────────
const COMMITTEE_DEFAULT_SIZE = 15;
// 기본 위원회 — [이름, 소관 태그, 영어 태그]. 이름은 지금 화면 언어 사전으로, 태그는 영어 화면이면 영어 태그로 만든다
const COMMITTEE_PRESETS = [
    ['법제사법위원회', ['법무', '사법', '법제'], ['Justice', 'Judiciary', 'Legislation']],
    ['기획재정위원회', ['경제', '재정', '예산', '세금'], ['Economy', 'Finance', 'Budget', 'Tax']],
    ['외교통일위원회', ['외교', '통일'], ['Diplomacy', 'Unification']],
    ['국방위원회', ['국방', '안보', '군사'], ['Defense', 'Security', 'Military']],
    ['행정안전위원회', ['행정', '치안', '선거'], ['Administration', 'Policing', 'Elections']],
    ['교육위원회', ['교육'], ['Education']],
    ['보건복지위원회', ['보건', '복지'], ['Health', 'Welfare']],
    ['환경노동위원회', ['환경', '노동'], ['Environment', 'Labor']],
];
function committeeById(id) { return committees.find(c => c.id === id) || null; }
function committeeChamberOk(c) {
    const list = typeof chamberList === 'function' ? chamberList() : ['house'];
    return list.includes(c.chamber) ? c.chamber : list[0];
}
// 위원을 받을 수 있는 정당 — 그 원에 의석이 있고 활동 금지 · 해산되지 않은 정당
function committeePool(c) {
    const ch = committeeChamberOk(c);
    const seatKey = seatKeyFor(ch), inKey = inKeyFor(ch);
    return parties.filter(p => p[inKey] && p.status !== 'banned' && p.status !== 'dissolved' && (p[seatKey] || 0) > 0)
        .map(p => ({ id: p.id, name: p.name, color: p.color, seats: p[seatKey] || 0, n: 0 }));
}
// 위원 배정 — 기본은 그 원의 정당 의석에 비례해 위원 수를 나눈다 (동트 방식).
// 위원 구성을 직접 정했으면(c.manual = { 정당 id: 위원 수 }) 그 수 그대로 — 위원 수는 그 합
function committeeComposition(c) {
    const pool = committeePool(c);
    if (!pool.length) return [];
    if (c.manual && typeof c.manual === 'object') {
        pool.forEach(p => { p.n = Math.max(0, parseInt(c.manual[p.id]) || 0); });
        return pool.filter(p => p.n > 0).sort((a, b) => b.n - a.n || b.seats - a.seats);
    }
    const size = Math.max(1, parseInt(c.size) || COMMITTEE_DEFAULT_SIZE);
    for (let k = 0; k < size; k++) {
        let best = null, bestQ = -1;
        pool.forEach(p => { const q = p.seats / (p.n + 1); if (q > bestQ) { bestQ = q; best = p; } });
        best.n++;
    }
    return pool.filter(p => p.n > 0).sort((a, b) => b.n - a.n || b.seats - a.seats);
}
function committeeChair(c, comp) {
    const list = comp || committeeComposition(c);
    return list.find(p => String(p.id) === String(c.chairPartyId)) || list[0] || null;
}
function partyIsRulingSide(pid) {
    const p = parties.find(x => String(x.id) === String(pid));
    if (!p) return false;
    return !!p.isRuling || coalitions.some(co => co.isRuling && co.members.includes(p.id));
}
// 태그가 위원회 소관과 겹치면 그 위원회를 추천
function suggestCommitteeFor(bill) {
    const tags = (bill.tags || []).map(t => String(t).trim());
    if (!tags.length) return null;
    return committees.find(c => (c.tags || []).some(t => tags.includes(t))) || null;
}
// 본회의 표결을 막는 이유 (위원회 심사 전 · 폐기) — 없으면 null
function legisPlenaryBlock(bill) {
    if (!bill || billTabledTo(bill) !== 'parliament' || !bill.committeeId) return null;
    const c = committeeById(bill.committeeId);
    if (!c) return null; // 위원회가 지워졌으면 그냥 본회의로
    if (bill.committeeStatus === 'pass') return null;
    if (bill.committeeStatus === 'fail') return `${c.name}에서 부결돼 폐기된 법안입니다.`;
    return `${c.name} 심사가 끝나야 본회의에 올릴 수 있습니다.`;
}
function setBillCommittee(id, committeeId) {
    const bill = bills.find(b => b.id === id);
    if (!bill) return;
    if (bill.committeeStatus === 'pass' || bill.committeeStatus === 'fail') {
        showCustomAlert('위원회 심사가 끝난 법안은 소관 위원회를 바꿀 수 없습니다.');
        renderBillList();
        return;
    }
    bill.committeeId = committeeId || null;
    bill.committeeStatus = committeeId ? 'pending' : null;
    bill.committeeVote = null;
    if (activeBillId === id && legisPlenaryBlock(bill)) { activeBillId = null; voteState = { house: {}, senate: {}, third: {} }; redrawAll(); updateVoteResults(); }
    renderBillList(); syncBillSelect(); renderCommitteeTab();
}
// 위원회 표결 확정 — 정당마다 고른 입장대로 그 정당 위원 수만큼 찬성 · 반대 · 기권. 위원 과반 찬성이면 통과
// ── 위원회 표결 — 위원 의석(가운데 위원장 · 마주 보는 두 줄)에서 의원 한 명씩 (본회의 표결처럼) ──
// bill.committeeSeatVotes = { sig: 위원 구성, votes: ['yea'|'nay'|'abs', …] } — 구성이 바뀌면(의석 변동) 기본값으로 다시
let cmVoteMode = 'yea';
function committeeSeats(bill, c) {
    const comp = committeeComposition(c);
    const chair = committeeChair(c, comp);
    // 가운데 위원장 한 자리 + 왼쪽(여당 쪽) · 오른쪽(야당 쪽) 마주 보는 두 줄 — 정당 순서(의회 › 정당)대로 채운다
    const order = new Map(parties.map((p, i) => [String(p.id), i]));
    const sorted = comp.slice().sort((x, y) => (order.get(String(x.id)) ?? 999) - (order.get(String(y.id)) ?? 999));
    const list = [];
    if (chair) list.push({ pid: chair.id, color: chair.color, name: chair.name, side: 'C' });
    ['L', 'R'].forEach(side => sorted.forEach(p => {
        if ((partyIsRulingSide(p.id) ? 'L' : 'R') !== side) return;
        const n = p.n - (chair && String(chair.id) === String(p.id) ? 1 : 0);
        for (let k = 0; k < n; k++) list.push({ pid: p.id, color: p.color, name: p.name, side });
    }));
    const sig = list.map(x => `${x.pid}${x.side}`).join(',');
    const saved = bill.committeeSeatVotes && bill.committeeSeatVotes.sig === sig ? bill.committeeSeatVotes.votes : null;
    list.forEach((x, i) => { x.v = (saved && saved[i]) || (partyIsRulingSide(x.pid) ? 'yea' : 'nay'); });
    if (!saved) bill.committeeSeatVotes = { sig, votes: list.map(x => x.v) };
    return list;
}
function committeeTally(seats) {
    const t = { yea: 0, nay: 0, abs: 0 };
    seats.forEach(x => { t[x.v] = (t[x.v] || 0) + 1; });
    return t;
}
// 자리 — 위원장은 맨 위 가운데(통로, 양쪽 줄보다 한 칸 위), 양쪽은 같은 칸 수의 격자를 위에서부터 줄마다 채운다
function committeeSeatLayout(seats, W) {
    const nL = seats.filter(x => x.side === 'L').length, nR = seats.filter(x => x.side === 'R').length, side = Math.max(nL, nR, 1);
    const cols = Math.max(2, Math.ceil(Math.sqrt(side * 1.15)));
    const rows = Math.ceil(side / cols);
    const pad = 6, aisleMin = 34;
    const cell = Math.min(24, (W - pad * 2 - aisleMin) / (cols * 2));
    const aisle = W - pad * 2 - cell * cols * 2;
    const top = pad + cell * 0.2, hasChair = seats.some(x => x.side === 'C'), benchTop = top + (hasChair ? cell : 0);
    const pts = [];
    let iL = 0, iR = 0;
    seats.forEach(x => {
        if (x.side === 'C') { pts.push({ x: W / 2, y: top + cell / 2 }); return; }
        const k = x.side === 'L' ? iL++ : iR++;
        const r = Math.floor(k / cols), col = k % cols;
        const x0 = x.side === 'L' ? pad : pad + cell * cols + aisle;
        pts.push({ x: x0 + col * cell + cell / 2, y: benchTop + r * cell + cell / 2 });
    });
    return { pts, r: cell / 2 * 0.86, bottom: benchTop + rows * cell };
}
const CM_VOTE_COLOR = { yea: '#00c46a', nay: '#ff3355', abs: '#8a8f98' };
function committeeVoteHtml(bill, c) {
    const seats = committeeSeats(bill, c);
    if (!seats.length) return '';
    const W = 320, L = committeeSeatLayout(seats, W), pts = L.pts, r = L.r, H = Math.ceil(L.bottom + 44);
    const t = committeeTally(seats), required = requiredSeatsFor(seats.length, 0.5), pass = t.yea >= required;
    const ring = Math.max(1.4, r * 0.3);
    const word = { yea: '찬성', nay: '반대', abs: '기권' };
    const dots = seats.map((x, i) => `<circle class="cm-seat${x.side === 'C' ? ' cm-chair' : ''}" data-i="${i}" cx="${pts[i].x.toFixed(1)}" cy="${pts[i].y.toFixed(1)}" r="${(r - ring / 2).toFixed(1)}" fill="${x.color}" stroke="${CM_VOTE_COLOR[x.v]}" stroke-width="${ring.toFixed(1)}"><title>${x.side === 'C' ? '위원장 · ' : ''}${legisEsc(x.name)} — ${word[x.v]}</title></circle>`).join('');
    const chairPt = seats[0] && seats[0].side === 'C' ? pts[0] : null;
    const partyRows = [];
    seats.forEach(x => { if (!partyRows.some(p => String(p.pid) === String(x.pid))) partyRows.push({ pid: x.pid, name: x.name, color: x.color }); });
    return `
        <div class="cm-vote-modes" role="group" aria-label="누를 때 던질 표">${[['yea', '▲ 찬성'], ['nay', '▼ 반대'], ['abs', '— 기권']].map(([v, l]) => `<button type="button" class="cm-mode cm-mode-${v}${cmVoteMode === v ? ' on' : ''}" data-mode="${v}" aria-pressed="${cmVoteMode === v}">${l}</button>`).join('')}<span class="cm-vote-hint">의석을 누르거나 끌어서 표를 바꿔요</span></div>
        <svg class="cm-hemi" viewBox="0 0 ${W} ${H}" role="img" aria-label="위원회 의석 — 찬성 ${t.yea} · 반대 ${t.nay} · 기권 ${t.abs}">${dots}
            ${chairPt ? `<text x="${W / 2}" y="${(chairPt.y + r + 11).toFixed(1)}" class="cm-chair-label">위원장</text>` : ''}
            <text x="${W / 2}" y="${(L.bottom + 22).toFixed(1)}" class="cm-hemi-num">${t.yea} : ${t.nay}</text><text x="${W / 2}" y="${H - 4}" class="cm-hemi-sub ${pass ? 'pass' : 'fail'}">${pass ? '통과 예상' : '부결 예상'} · 과반 ${required}</text></svg>
        <div class="cm-tally"><span class="y">찬성 ${t.yea}</span><span class="n">반대 ${t.nay}</span><span class="a">기권 ${t.abs}</span></div>
        <div class="cm-stances">${partyRows.map(p => {
            const mine = seats.filter(x => String(x.pid) === String(p.pid)), cnt = committeeTally(mine);
            const all = ['yea', 'nay', 'abs'].find(k => cnt[k] === mine.length);
            return `<div class="cm-stance-row"><i style="background:${p.color}"></i><span>${legisEsc(p.name)} <em>${mine.length}명${all ? '' : ` · ${cnt.yea}/${cnt.nay}/${cnt.abs}`}</em></span>
                <span class="cm-seg">${[['yea', '찬성'], ['nay', '반대'], ['abs', '기권']].map(([v, l]) => `<button type="button" class="cm-pv cm-pv-${v}${all === v ? ' on' : ''}" data-pid="${p.pid}" data-v="${v}" aria-pressed="${all === v}">${l}</button>`).join('')}</span></div>`;
        }).join('')}</div>`;
}
function committeeVoteRefresh(billId) {
    const bill = bills.find(b => b.id === billId), c = bill && committeeById(bill.committeeId), box = document.getElementById('cmVote-' + billId);
    if (!bill || !c || !box) return;
    box.innerHTML = committeeVoteHtml(bill, c);
    committeeVoteBind(billId);
}
function committeeVoteSet(billId, fn) {
    const bill = bills.find(b => b.id === billId), c = bill && committeeById(bill.committeeId);
    if (!bill || !c) return;
    const seats = committeeSeats(bill, c);
    const votes = seats.map((x, i) => fn(x, i) || x.v);
    bill.committeeSeatVotes = { sig: bill.committeeSeatVotes.sig, votes };
    committeeVoteRefresh(billId);
}
function committeeVoteBind(billId) {
    const box = document.getElementById('cmVote-' + billId);
    if (!box) return;
    box.querySelectorAll('[data-mode]').forEach(b => { b.onclick = () => { cmVoteMode = b.dataset.mode; document.querySelectorAll('.cm-vote').forEach(v => v.querySelectorAll('[data-mode]').forEach(m => { m.classList.toggle('on', m.dataset.mode === cmVoteMode); m.setAttribute('aria-pressed', m.dataset.mode === cmVoteMode); })); }; });
    box.querySelectorAll('.cm-pv').forEach(b => { b.onclick = () => committeeVoteSet(billId, x => (String(x.pid) === b.dataset.pid ? b.dataset.v : null)); });
    // 의석 누르기 · 끌어서 칠하기
    const svg = box.querySelector('.cm-hemi');
    if (!svg) return;
    let painting = false;
    const paint = el => {
        const i = el && el.dataset && el.dataset.i;
        if (i == null) return;
        if (el.getAttribute('stroke') === CM_VOTE_COLOR[cmVoteMode]) return;
        const bill = bills.find(b => b.id === billId);
        bill.committeeSeatVotes.votes[+i] = cmVoteMode;
        el.setAttribute('stroke', CM_VOTE_COLOR[cmVoteMode]);
    };
    svg.addEventListener('pointerdown', e => { if (!e.target.classList.contains('cm-seat')) return; painting = true; svg.setPointerCapture(e.pointerId); paint(e.target); e.preventDefault(); });
    svg.addEventListener('pointermove', e => { if (!painting) return; paint(document.elementFromPoint(e.clientX, e.clientY)); });
    const end = () => { if (!painting) return; painting = false; committeeVoteRefresh(billId); };
    svg.addEventListener('pointerup', end);
    svg.addEventListener('pointercancel', end);
}
function confirmCommitteeVote(billId) {
    const bill = bills.find(b => b.id === billId);
    const c = bill && committeeById(bill.committeeId);
    if (!bill || !c) return;
    const comp = committeeComposition(c);
    if (!comp.length) { showCustomAlert('이 위원회에 배정할 위원이 없습니다. 그 원에 의석을 가진 정당이 있어야 합니다.'); return; }
    const seats = committeeSeats(bill, c);
    const { yea, nay, abs } = committeeTally(seats);
    // 정당별로 가장 많이 던진 표 (예전 기록과 같은 모양)
    const stances = {};
    comp.forEach(p => {
        const cnt = { yea: 0, nay: 0, abs: 0 };
        seats.filter(x => String(x.pid) === String(p.id)).forEach(x => { cnt[x.v]++; });
        stances[p.id] = ['yea', 'nay', 'abs'].reduce((a, k) => (cnt[k] > cnt[a] ? k : a), 'yea');
    });
    const total = comp.reduce((a, p) => a + p.n, 0);
    const required = requiredSeatsFor(total, 0.5);
    const result = yea >= required ? 'pass' : 'fail';
    bill.committeeStatus = result;
    bill.committeeVote = { yea, nay, abs, total, required, stances, seats: seats.map(x => x.v) };
    delete bill.committeeSeatVotes;
    if (!bill.voteHistory) bill.voteHistory = [];
    bill.voteHistory.push({ chamber: 'committee', committeeId: c.id, committeeName: c.name, result, date: bill.voteDate || '', yea, nay, abs, total, required, threshold: 0.5, at: new Date().toISOString() });
    renderCommitteeTab(); renderBillList(); renderArchiveList(); syncBillSelect();
    if (typeof showKbdToast === 'function') showKbdToast(result === 'pass' ? `✔ ${c.name} 통과 — 본회의에 올릴 수 있어요` : `✘ ${c.name}에서 부결 — 폐기`);
}
function addCommittee(name, tags) {
    const ch = (typeof chamberList === 'function' ? chamberList() : ['house'])[0];
    committees.push({ id: 'cm' + Date.now() + Math.floor(Math.random() * 1000), name: name || legisUiText('새 위원회'), chamber: ch, size: COMMITTEE_DEFAULT_SIZE, chairPartyId: null, tags: tags || [] });
    renderCommitteeTab();
}
function addDefaultCommittees() {
    const have = new Set(committees.map(c => c.name));
    const en = typeof getLang === 'function' && getLang() === 'en';
    COMMITTEE_PRESETS.forEach(([n, t, tEn], i) => {
        const name = legisUiText(n);
        if (!have.has(name)) committees.push({ id: 'cm' + Date.now() + i, name, chamber: 'house', size: COMMITTEE_DEFAULT_SIZE, chairPartyId: null, tags: (en ? tEn : t).slice() });
    });
    renderCommitteeTab(); renderBillList();
}
function updateCommittee(id, field, value) {
    const c = committeeById(id);
    if (!c) return;
    if (field === 'size') c.size = Math.max(1, Math.min(999, parseInt(value) || COMMITTEE_DEFAULT_SIZE));
    else if (field === 'tags') c.tags = String(value || '').split(',').map(t => t.trim()).filter(Boolean);
    else if (field === 'name') c.name = String(value || '').trim() || c.name;
    else c[field] = value || null;
    renderCommitteeTab(); renderBillList();
}
// 위원 구성 직접 정하기 — 켤 때는 지금 자동 배정을 그대로 옮겨 놓고 시작
function setCommitteeManual(id, on) {
    const c = committeeById(id);
    if (!c) return;
    if (on) c.manual = Object.fromEntries(committeeComposition({ ...c, manual: null }).map(p => [p.id, p.n]));
    else {
        const total = committeeComposition(c).reduce((a, p) => a + p.n, 0);
        if (total > 0) c.size = total; // 자동으로 돌아가도 위원 수는 직접 정한 합계 그대로
        c.manual = null;
    }
    renderCommitteeTab(); renderBillList();
}
function setCommitteeMembers(id, pid, value) {
    const c = committeeById(id);
    if (!c || !c.manual) return;
    c.manual[pid] = Math.max(0, Math.min(999, parseInt(value) || 0));
    renderCommitteeTab(); renderBillList();
}
function removeCommittee(id) {
    const c = committeeById(id);
    if (!c) return;
    const pending = bills.filter(b => b.committeeId === id && b.committeeStatus === 'pending').length;
    showCustomConfirm(`"${c.name}"을(를) 삭제할까요?${pending ? `\n심사 중인 법안 ${pending}건은 위원회 심사 없이 본회의로 넘어갑니다.` : ''}`, () => {
        committees = committees.filter(x => x.id !== id);
        bills.forEach(b => { if (b.committeeId === id && b.committeeStatus === 'pending') { b.committeeId = null; b.committeeStatus = null; } });
        renderCommitteeTab(); renderBillList(); syncBillSelect();
    });
}

// ── 법안 태그 고르기 ───────────────────────────
// 원래 입력 칸(#newBillTags · #editBillTags, 쉼표로 구분)은 숨겨 두고 값의 원본으로 그대로 쓴다 — 법안 추가 · 수정 코드는 지금처럼 .value를 읽고 쓴다.
// 그 자리에 고른 태그 칩(×로 빼기) · 새 태그 칸(Enter · 쉼표로 더하기) · 위원회 소관 태그(눌러서 붙이기) · 다른 법안에서 쓴 태그를 그린다.
const BILL_TAG_INPUTS = ['newBillTags', 'editBillTags'];
const billTagList = v => String(v || '').split(',').map(t => t.trim()).filter(Boolean);
function initBillTagPicker(id) {
    const input = document.getElementById(id);
    if (!input || input.dataset.tagPicker) return;
    input.dataset.tagPicker = '1';
    input.type = 'hidden';
    const box = document.createElement('div');
    box.className = 'bill-tag-picker'; box.id = id + 'Picker';
    input.insertAdjacentElement('afterend', box);
    // 코드가 .value를 바꿔도(개정안 발의 · 수정할 법안 불러오기 · 추가 뒤 비우기) 칩이 따라오게
    const desc = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    Object.defineProperty(input, 'value', { configurable: true, get() { return desc.get.call(this); }, set(v) { desc.set.call(this, v); renderBillTagPicker(id); } });
    renderBillTagPicker(id);
}
function setBillTags(id, list) {
    const input = document.getElementById(id);
    if (!input) return;
    const uniq = [];
    list.forEach(t => { t = String(t).replace(/,/g, ' ').trim(); if (t && !uniq.includes(t)) uniq.push(t); });
    input.value = uniq.join(', ');
}
function refreshBillTagPickers() { BILL_TAG_INPUTS.forEach(id => { if (document.getElementById(id + 'Picker')) renderBillTagPicker(id); }); }
function renderBillTagPicker(id) {
    const input = document.getElementById(id), box = document.getElementById(id + 'Picker');
    if (!input || !box) return;
    const T = legisUiText;
    const tags = billTagList(input.value);
    const old = box.querySelector('.btp-new');
    const draft = old ? old.value : '', hadFocus = old && document.activeElement === old;
    const cms = (typeof committees !== 'undefined' ? committees : []).filter(c => (c.tags || []).length);
    const cmTags = new Set(cms.flatMap(c => c.tags));
    // 다른 법안에서 쓴 태그 (소관 태그 말고) — 많이 쓴 순
    const used = new Map();
    (typeof bills !== 'undefined' ? bills : []).forEach(b => (b.tags || []).forEach(t => { if (!cmTags.has(t)) used.set(t, (used.get(t) || 0) + 1); }));
    const others = [...used].sort((a, b) => b[1] - a[1]).slice(0, 14).map(x => x[0]);
    const opt = t => `<button type="button" class="btp-opt${tags.includes(t) ? ' on' : ''}" data-add="${legisEsc(t)}" aria-pressed="${tags.includes(t)}">${tags.includes(t) ? '✓' : '+'} ${legisEsc(t)}</button>`;
    const council = typeof isCouncilVotingMode === 'function' && isCouncilVotingMode();
    const sug = id === 'newBillTags' && !council && tags.length && cms.length ? suggestCommitteeFor({ tags }) : undefined;
    box.innerHTML = `
        <div class="btp-row">${tags.map(t => `<span class="btp-chip"># ${legisEsc(t)}<button type="button" data-del="${legisEsc(t)}" aria-label="${legisEsc(T('태그 빼기'))}">×</button></span>`).join('')}<input type="text" class="btp-new" value="${legisEsc(draft)}" placeholder="${legisEsc(T(tags.length ? '태그 더하기 (Enter)' : '태그 — 아래에서 고르거나 새로 입력 (Enter · 쉼표)'))}" aria-label="${legisEsc(T('새 태그'))}"></div>
        ${cms.length ? `<div class="btp-sec"><div class="btp-h">${legisEsc(T('위원회 소관 태그'))} <span>— ${legisEsc(T('누르면 붙고, 태그가 겹치는 위원회가 심사해요'))}</span></div>
            ${cms.map(c => `<div class="btp-cm"><span class="btp-cm-name">${legisEsc(c.name)}</span>${c.tags.map(opt).join('')}</div>`).join('')}</div>`
            : `<div class="btp-hint">${legisEsc(T('상임위원회가 없어요 — 입법 › 위원회에서 만들면 소관 태그를 골라 붙일 수 있어요'))}</div>`}
        ${others.length ? `<div class="btp-sec"><div class="btp-h">${legisEsc(T('다른 법안에서 쓴 태그'))}</div><div class="btp-cm">${others.map(opt).join('')}</div></div>` : ''}
        ${sug !== undefined ? `<div class="btp-hint btp-route">${sug ? `→ ${legisEsc(T('소관 위원회'))}: <b>${legisEsc(sug.name)}</b>` : `→ ${legisEsc(T('소관 태그와 겹치지 않아 위원회 심사 없이 본회의로'))}`}</div>` : ''}`;
    const nw = box.querySelector('.btp-new');
    const commit = () => { const add = billTagList(nw.value.replace(/[，、]/g, ',')); if (!add.length) return false; nw.value = ''; setBillTags(id, tags.concat(add)); return true; };
    nw.addEventListener('keydown', e => {
        if (e.isComposing) return; // 한글 조합 중에는 Enter를 넘김
        if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commit(); box.querySelector('.btp-new').focus(); }
        else if (e.key === 'Backspace' && !nw.value && tags.length) { e.preventDefault(); setBillTags(id, tags.slice(0, -1)); box.querySelector('.btp-new').focus(); }
    });
    nw.addEventListener('blur', () => { if (nw.value.trim()) commit(); }); // 입력하다 "법안 추가"를 눌러도 들어가게
    box.querySelectorAll('[data-del]').forEach(b => { b.onclick = () => setBillTags(id, tags.filter(t => t !== b.dataset.del)); });
    box.querySelectorAll('[data-add]').forEach(b => { b.onclick = () => { const t = b.dataset.add; setBillTags(id, tags.includes(t) ? tags.filter(x => x !== t) : tags.concat(t)); }; });
    if (hadFocus) { nw.focus(); nw.setSelectionRange(nw.value.length, nw.value.length); }
}
BILL_TAG_INPUTS.forEach(initBillTagPicker);

// 직접 정하기 — 정당마다 위원 수 칸 (그 원에 의석이 있는 정당)
function committeeManualHtml(c) {
    const pool = committeePool(c);
    if (!pool.length) return '';
    return `<div class="cm-manual">${pool.map(p => `
        <label title="${legisEsc(p.name)} — 의석 ${p.seats}"><i style="background:${p.color}"></i><span>${legisEsc(p.name)}</span>
            <input type="number" min="0" max="999" value="${Math.max(0, parseInt(c.manual[p.id]) || 0)}" onchange="setCommitteeMembers('${c.id}','${p.id}',this.value)"></label>`).join('')}
        <div class="cm-note">정당마다 위원 수를 정합니다 (위원 수 = 합계). 의석이 바뀌어도 그대로이고, "자동 (의석 비례)"로 돌리면 이 합계로 다시 나눠요.</div></div>`;
}
function renderCommitteeTab() {
    refreshBillTagPickers(); // 위원회 소관 태그가 바뀌면 법안 태그 고르기 목록도
    const box = document.getElementById('committeeList');
    if (!box) return;
    const chambers = typeof chamberList === 'function' ? chamberList() : ['house'];
    if (!committees.length) {
        box.innerHTML = `
            <div class="cm-empty">아직 상임위원회가 없습니다. 위원회를 만들면 법안을 본회의 전에 소관 위원회에서 먼저 심사해요.
                <div class="cm-empty-btns">
                    <button class="add-btn" onclick="addDefaultCommittees()">기본 위원회 만들기 (${COMMITTEE_PRESETS.length}개)</button>
                    <button class="add-btn" onclick="addCommittee()">+ 위원회 추가</button>
                </div>
            </div>`;
        return;
    }
    box.innerHTML = committees.map(c => {
        const comp = committeeComposition(c);
        const chair = committeeChair(c, comp);
        const ch = committeeChamberOk(c);
        const reviewing = bills.filter(b => b.committeeId === c.id && b.committeeStatus === 'pending' && getBillOverallStatus(b) === 'pending');
        const done = bills.filter(b => b.committeeId === c.id && (b.committeeStatus === 'pass' || b.committeeStatus === 'fail')).length;
        const total = comp.reduce((a, p) => a + p.n, 0);
        const compBar = comp.length ? `<div class="cm-bar">${comp.map(p => `<span style="flex:${p.n};background:${p.color};" title="${legisEsc(p.name)} ${p.n}명"></span>`).join('')}</div>
            <div class="cm-legend">${comp.map(p => `<span><i style="background:${p.color}"></i>${legisEsc(p.name)} ${p.n}</span>`).join('')}</div>`
            : '<div class="cm-note">그 원에 의석을 가진 정당이 없어 위원을 배정할 수 없습니다.</div>';
        const reviewHtml = reviewing.length ? reviewing.map(b => `
            <div class="cm-bill">
                <div class="cm-bill-title">${legisEsc(b.title)} ${billKindLabel(b) ? `<span class="bill-version-badge">${billKindLabel(b)}</span>` : ''}</div>
                ${billBodyHtml(b, 2)}
                <div class="cm-vote" id="cmVote-${b.id}">${committeeVoteHtml(b, c)}</div>
                <button class="add-btn cm-confirm" onclick="confirmCommitteeVote('${b.id}')">▶ 위원회 심사 확정 (위원 ${total}명 중 과반 ${requiredSeatsFor(total, 0.5)}명 찬성이면 통과)</button>
            </div>`).join('') : '<div class="cm-note">심사 중인 법안이 없습니다. 입법 › 상정에서 법안의 소관 위원회를 고르세요.</div>';
        return `
        <div class="vote-panel cm-card">
            <div class="cm-head">
                <input type="text" class="cm-name" value="${legisEsc(c.name)}" onchange="updateCommittee('${c.id}','name',this.value)">
                <button class="remove-btn" title="위원회 삭제" onclick="removeCommittee('${c.id}')">X</button>
            </div>
            <div class="cm-fields">
                ${chambers.length > 1 ? `<label>원 <select onchange="updateCommittee('${c.id}','chamber',this.value)">${chambers.map(x => `<option value="${x}" ${x === ch ? 'selected' : ''}>${legisEsc(chamberDisplayName(x))}</option>`).join('')}</select></label>` : ''}
                <label>위원 구성 <select onchange="setCommitteeManual('${c.id}', this.value === 'manual')"><option value="auto" ${c.manual ? '' : 'selected'}>자동 (의석 비례)</option><option value="manual" ${c.manual ? 'selected' : ''}>직접 정하기</option></select></label>
                ${c.manual ? `<label>위원 수 <b class="cm-total">${total}</b></label>` : `<label>위원 수 <input type="number" min="1" max="999" value="${c.size || COMMITTEE_DEFAULT_SIZE}" onchange="updateCommittee('${c.id}','size',this.value)"></label>`}
                <label>위원장 <select onchange="updateCommittee('${c.id}','chairPartyId',this.value)">${comp.map(p => `<option value="${p.id}" ${chair && String(chair.id) === String(p.id) ? 'selected' : ''}>${legisEsc(p.name)}</option>`).join('') || '<option value="">-</option>'}</select></label>
                <label class="cm-tags">소관 태그 <input type="text" value="${legisEsc((c.tags || []).join(', '))}" placeholder="예: 경제, 예산" onchange="updateCommittee('${c.id}','tags',this.value)"></label>
            </div>
            ${c.manual ? committeeManualHtml(c) : ''}
            ${compBar}
            <div class="cm-sub">심사 중 ${reviewing.length}건 · 심사 끝 ${done}건</div>
            ${reviewHtml}
        </div>`;
    }).join('') + `<button class="add-btn" onclick="addCommittee()">+ 위원회 추가</button>`;
    box.querySelectorAll('.cm-vote').forEach(v => committeeVoteBind(v.id.replace(/^cmVote-/, '')));
}

// ── 헌법 · 법령집 (입법 › 법령 · 입법 › 헌법) ────────────────────────────
// 가결된 헌법 개정안을 헌법에 반영 (한 번만). 표결 · 서명으로 상태가 바뀔 때마다(기록 목록을 그릴 때) 확인한다
function legisApplyEnactments() {
    bills.forEach(b => {
        if (b.kind !== 'constitution' || b.enacted || getBillOverallStatus(b) !== 'passed') return;
        const arts = billArticles(b).map(a => ({ title: a.title || '', text: a.text || '' }));
        if (!constitution) constitution = { title: legisUiText('헌법'), preamble: '', articles: [], revisions: [] };
        constitution.articles = arts;
        constitution.revisions = constitution.revisions || [];
        constitution.revisions.push({ billId: b.id, title: b.title, date: b.voteDate || '', at: new Date().toISOString() });
        b.enacted = true;
    });
}
// 법률 — 가결된 법률안을 개정 계보(원 법안 → 개정안 …)마다 가장 최근에 가결된 판으로 묶는다
function lawChainRoot(bill) {
    let cur = bill, guard = 0;
    while (cur && cur.parentBillId && guard++ < 100) {
        const parent = bills.find(b => b.id === cur.parentBillId);
        if (!parent) break;
        cur = parent;
    }
    return cur;
}
function lawBookEntries() {
    const passed = bills.filter(b => b.kind !== 'constitution' && getBillOverallStatus(b) === 'passed' && billTabledTo(b) !== 'council' && !b.isNoConfidence && !b.isPmConfirmation && !b.isMartialLawLift);
    const groups = new Map();
    passed.forEach(b => {
        const root = lawChainRoot(b);
        if (!groups.has(root.id)) groups.set(root.id, []);
        groups.get(root.id).push(b);
    });
    return [...groups.values()].map(list => {
        const latest = list.reduce((a, b) => ((b.version || 1) >= (a.version || 1) ? b : a));
        const first = list.reduce((a, b) => ((b.version || 1) <= (a.version || 1) ? b : a));
        return { latest, first, revisions: list.length - 1 };
    });
}
let lawBookQuery = '';
let constitutionEditing = false;
function renderLawBookTab() {
    const box = document.getElementById('lawBook');
    if (!box) return;
    legisApplyEnactments();
    // 법률
    const q = lawBookQuery.trim().toLowerCase();
    const entries = lawBookEntries().filter(e => !q || e.latest.title.toLowerCase().includes(q) || (e.latest.content || '').toLowerCase().includes(q) || (e.latest.tags || []).some(t => String(t).toLowerCase().includes(q)));
    const lawsHtml = entries.length ? entries.map(e => `
        <div class="bill-card lb-law">
            <div class="bill-card-title">${legisEsc(e.latest.title)}${(e.latest.version || 1) > 1 ? ` <span class="bill-version-badge">제${e.latest.version}판</span>` : ''}</div>
            ${articlesHtml(billArticles(e.latest)) || '<div class="cm-note">조문이 없습니다.</div>'}
            <div class="bill-card-footer">
                <span class="lb-meta">${e.first.voteDate ? `제정 ${legisEsc(e.first.voteDate)}` : '제정'}${e.revisions ? ` · 개정 ${e.revisions}회${e.latest.voteDate ? ` (최근 ${legisEsc(e.latest.voteDate)})` : ''}` : ''}</span>
                ${typeof buildTagHtml === 'function' ? buildTagHtml(e.latest) : ''}
                <button class="bill-amend-btn" style="margin-left:auto;" onclick="startAmendment('${e.latest.id}')">📝 개정안 발의</button>
            </div>
        </div>`).join('') : `<div class="cm-note">${q ? '검색 결과가 없습니다.' : '아직 가결된 법률이 없습니다. 의회에서 가결된 법률안이 조문 그대로 여기에 모여요.'}</div>`;
    box.innerHTML = `
        <div class="lb-section-title">법률 <span class="lb-count">${lawBookEntries().length}</span></div>
        <div class="bill-search-bar"><input type="text" placeholder="법률 검색..." value="${legisEsc(lawBookQuery)}" oninput="lawBookQuery=this.value; renderLawBookTab(); const i=document.querySelector('#lawBook .bill-search-bar input'); if(i){i.focus(); i.setSelectionRange(i.value.length,i.value.length);}"></div>
        ${lawsHtml}`;
}
// 헌법 탭 — 헌법 조문 · 제정 · 직접 편집 · 개정안 발의 · 개정 이력
function renderConstitutionTab() {
    const box = document.getElementById('constitutionBook');
    if (!box) return;
    legisApplyEnactments();
    // 헌법
    let consHtml;
    if (constitutionEditing) {
        consHtml = `
            <div class="vote-panel lb-cons">
                <div class="vote-panel-title"><span class="tno-prompt">&gt; </span>${constitution ? '헌법 직접 편집' : '헌법 제정'}</div>
                <input type="text" id="consTitleInput" class="vote-bill-input" placeholder="이름 (예: 대한민국헌법)" value="${legisEsc(constitution?.title || legisUiText('헌법'))}" style="margin-bottom:6px;">
                <textarea id="consPreambleInput" class="art-text" rows="2" placeholder="전문 (선택)">${legisEsc(constitution?.preamble || '')}</textarea>
                <div id="consArticles"></div>
                <div class="lb-btns">
                    <button class="add-btn" onclick="saveConstitutionEdit()">[✔] 저장</button>
                    <button class="add-btn" onclick="constitutionEditing=false; renderConstitutionTab();">취소</button>
                </div>
                <div class="cm-note">직접 편집은 표결 없이 바로 바뀝니다 (처음 헌법을 만들 때 · 고칠 때). 표결을 거치려면 "개정안 발의"를 쓰세요.</div>
            </div>`;
    } else if (constitution) {
        const revs = constitution.revisions || [];
        consHtml = `
            <div class="vote-panel lb-cons">
                <div class="lb-cons-head">
                    <div class="lb-cons-title">${legisEsc(constitution.title || '헌법')}</div>
                    <div class="lb-btns">
                        <button class="bill-amend-btn" onclick="legisProposeConstitutionAmendment()">📝 개정안 발의</button>
                        <button class="bill-select-btn" onclick="constitutionEditing=true; renderConstitutionTab();">✎ 직접 편집</button>
                    </div>
                </div>
                ${constitution.preamble ? `<div class="lb-preamble" translate="no">${legisEsc(constitution.preamble)}</div>` : ''}
                ${articlesHtml(constitution.articles) || '<div class="cm-note">조문이 없습니다.</div>'}
                <div class="lb-revs">${revs.length ? `개정 ${revs.length}회 — ${revs.map((r, i) => `#${i + 1}${r.date ? ` (${legisEsc(r.date)})` : ''}`).join(' · ')}` : '개정 이력 없음'}</div>
            </div>`;
    } else {
        consHtml = `
            <div class="vote-panel lb-cons cm-empty">아직 헌법이 없습니다.
                <div class="cm-empty-btns"><button class="add-btn" onclick="constitutionEditing=true; renderConstitutionTab();">헌법 제정하기</button></div>
            </div>`;
    }
    box.innerHTML = consHtml;
    if (constitutionEditing) legisRenderArticleEditor('consArticles', constitution ? constitution.articles : []);
}
function saveConstitutionEdit() {
    const title = document.getElementById('consTitleInput')?.value.trim() || '헌법';
    const preamble = document.getElementById('consPreambleInput')?.value.trim() || '';
    const articles = legisReadArticles('consArticles');
    if (!articles.length && !preamble) { showCustomAlert('조문을 하나 이상 적어 주세요.'); return; }
    constitution = { title, preamble, articles, revisions: constitution?.revisions || [] };
    constitutionEditing = false;
    renderConstitutionTab();
}

// ── 입법 › 표결 기록 — 원 · 위원회마다 (선거 › 선거 기록의 종류 칩처럼) ──
// 칩을 고르면 그 원의 본회의 표결 · 그 위원회의 심사를 하나씩 최근 순으로 (심사 중인 법안의 위원회 심사도), 안 고르면 끝난 법안 목록
let archiveBody = null; // null | 'house' | 'senate' | 'third' | 'cm:<위원회 id>' | 'cmn:<이름>'(지운 위원회)
function voteBodyKey(h) {
    if (!h || h.result === 'skip') return null;
    if (h.chamber === 'committee') {
        if (h.committeeId && committeeById(h.committeeId)) return 'cm:' + h.committeeId;
        const c = committees.find(x => x.name === h.committeeName);
        return c ? 'cm:' + c.id : 'cmn:' + (h.committeeName || '상임위원회');
    }
    return ['house', 'senate', 'third'].includes(h.chamber) ? h.chamber : null;
}
function legisVoteEvents() {
    const out = [];
    bills.forEach(b => (b.voteHistory || []).forEach(h => { const key = voteBodyKey(h); if (key) out.push({ bill: b, h, key }); }));
    return out.sort((x, y) => String(y.h.at || '').localeCompare(String(x.h.at || '')));
}
function archiveBodies(events) {
    const n = k => events.filter(e => e.key === k).length;
    const list = (typeof chamberList === 'function' ? chamberList() : ['house']).map(ch => ({ key: ch, label: voteChamberLabel(ch), n: n(ch), committee: false }));
    committees.forEach(c => list.push({ key: 'cm:' + c.id, label: c.name, n: n('cm:' + c.id), committee: true }));
    [...new Set(events.filter(e => e.key.startsWith('cmn:')).map(e => e.key))].forEach(k => list.push({ key: k, label: k.slice(4), n: n(k), committee: true }));
    return list;
}
function toggleArchiveBody(key) {
    archiveBody = archiveBody === key ? null : key;
    renderArchiveList('law');
}
function renderArchiveBodyFilter() {
    const el = document.getElementById('archiveBodyFilter');
    if (!el) return;
    const bodies = archiveBodies(legisVoteEvents());
    if (archiveBody && !bodies.some(b => b.key === archiveBody)) archiveBody = null;
    const chip = b => `<span class="tag-badge${archiveBody === b.key ? ' active' : ''}${b.committee ? ' ab-cm' : ''}" data-body="${legisEsc(b.key)}">${b.committee ? '⚖ ' : ''}${legisEsc(b.label)}<span style="opacity:.7;margin-left:5px;">${b.n}</span></span>`;
    el.innerHTML = bodies.map(chip).join('');
    el.querySelectorAll('[data-body]').forEach(x => { x.onclick = () => toggleArchiveBody(x.dataset.body); });
}
function renderArchiveBodyList(container, sc, query, activeTag) {
    const events = legisVoteEvents().filter(e => e.key === archiveBody);
    const statusEl = document.getElementById('archiveStatusFilter');
    if (statusEl) statusEl.innerHTML = '';
    const evBills = [...new Set(events.map(e => e.bill))];
    renderTagFilter(sc.tags, getAllTags(evBills), activeTag, t => { sc.set('tag', sc.get().tag === t ? null : t); renderArchiveList('law'); });
    const isCm = archiveBody.startsWith('cm');
    if (!events.length) {
        container.innerHTML = `<div style="color:#333; text-align:center; padding:20px; border:1px dashed #222;">${isCm ? '이 위원회의 심사 기록이 없습니다' : '이 원의 표결 기록이 없습니다'}</div>`;
        return;
    }
    const shown = events.filter(e => billMatchesFilter(e.bill, query, activeTag));
    if (!shown.length) {
        container.innerHTML = '<div style="color:#444; text-align:center; padding:16px; border:1px dashed #222;">검색 결과가 없습니다</div>';
        return;
    }
    const pass = shown.filter(e => e.h.result === 'pass').length;
    container.innerHTML = `<div class="ab-summary">${isCm ? '심사' : '표결'} ${shown.length}건 · <span class="y">가결 ${pass}</span> · <span class="n">부결 ${shown.length - pass}</span></div>` + shown.map(e => `
        <div class="bill-card" style="border-left-color:${e.h.result === 'pass' ? 'var(--vote-yea)' : 'var(--vote-nay)'};">
            <div class="bill-card-title">${legisEsc(e.bill.title)}${(e.bill.version || 1) > 1 ? ` <span class="bill-version-badge">제${e.bill.version}판</span>` : ''}</div>
            <div style="margin-top:4px;">${buildTagHtml(e.bill)}</div>
            ${voteHistoryRowHtml(e.h)}
            <div class="bill-card-footer">${buildBillBadges(e.bill)}</div>
        </div>`).join('');
}

// ── 내각 › 서명 — 의회를 통과해 거부권 주체(내각 › 정부 형태 · 권한)의 서명을 기다리는 법안: 서명하면 가결, 거부권을 행사하면 최종 부결 ──
function renderSignList() {
    const box = document.getElementById('signList');
    if (!box || typeof bills === 'undefined') return;
    const holder = vetoHolderLabel();
    const waiting = bills.filter(b => getBillOverallStatus(b) === 'awaiting_veto');
    const done = bills.filter(b => b.vetoStatus === 'signed' || b.vetoStatus === 'vetoed').filter(b => ['passed', 'vetoed'].includes(getBillOverallStatus(b))).slice(-5).reverse();
    const head = holder
        ? `<div class="cm-note">의회를 통과한 법안에 <b>${legisEsc(holder)}</b>이(가) 서명하면 가결되고, 거부권을 행사하면 최종 부결됩니다. 거부권 주체는 내각 › 정부 형태 · 권한에서 정해요.</div>`
        : `<div class="cm-note">거부권 주체가 없어 의회를 통과한 법안은 바로 가결됩니다. 서명 단계를 쓰려면 내각 › 정부 형태 · 권한에서 거부권 주체를 정하세요.</div>`;
    const card = b => `
        <div class="bill-card" style="border-left-color:var(--tno-gold);">
            <div class="bill-card-title">${legisEsc(b.title)}${(b.version || 1) > 1 ? ` <span class="bill-version-badge">제${b.version}판</span>` : ''}</div>
            ${billBodyHtml(b, 3)}
            <div style="margin-top:4px;">${buildTagHtml(b)}</div>
            <div class="bill-card-footer">
                ${buildBillBadges(b)}
                <span class="bill-history-toggle" onclick="event.stopPropagation(); toggleBillHistory('${b.id}')">▾ 세부 기록</span>
                <div style="margin-left:auto; display:flex; gap:5px;">
                    <button class="bill-amend-btn" onclick="signBill('${b.id}')">✍ ${legisEsc(holder)} 서명</button>
                    <button class="bill-remove-btn" onclick="vetoBill('${b.id}')">🛑 거부권 행사</button>
                </div>
            </div>
            ${buildBillHistoryHtml(b)}
        </div>`;
    const recent = done.length ? `<div class="lb-section-title">최근 결정</div>` + done.map(b => `
        <div class="sign-done ${b.vetoStatus === 'vetoed' ? 'n' : 'y'}">${b.vetoStatus === 'vetoed' ? '🛑 거부' : '✍ 서명'} · ${legisEsc(b.title)}</div>`).join('') : '';
    box.innerHTML = `${head}
        <div class="lb-section-title">서명 대기 <span class="lb-count">${waiting.length}</span></div>
        ${waiting.length ? waiting.map(card).join('') : '<div style="color:#444; text-align:center; padding:16px; border:1px dashed #222;">서명을 기다리는 법안이 없습니다</div>'}
        ${recent}`;
}

// ── 입법 단계 막대 (입법 메뉴 맨 위) — 제출 → 위원회 → 본회의 → 서명 → 법령, 단계마다 법안 수 · 누르면 그 탭으로 ──
function renderLawPipeline() {
    const box = document.getElementById('lawPipeline');
    if (!box || typeof bills === 'undefined') return;
    const parl = bills.filter(b => billTabledTo(b) === 'parliament');
    const pending = parl.filter(b => getBillOverallStatus(b) === 'pending');
    const inCommittee = pending.filter(b => legisPlenaryBlock(b)).length;
    const plenary = pending.length - inCommittee;
    const awaiting = parl.filter(b => getBillOverallStatus(b) === 'awaiting_veto').length;
    const laws = lawBookEntries().length;
    const cur = (typeof currentSubTab !== 'undefined' && currentSubTab.law) || 'bill';
    const steps = [
        ['bill', '제출', null],
        ['committee', '위원회', inCommittee],
        ['table', '본회의', plenary],
        ['sign', '서명', awaiting || null, 'cabinet'],
        ['archive', '기록', null],
        ['lawbook', '법령', laws],
    ];
    box.innerHTML = steps.map(([tab, label, n, main], i) => `${i ? '<span class="lp-arrow">›</span>' : ''}<button type="button" class="lp-step${cur === tab ? ' active' : ''}" onclick="switchSubTab('${main || 'law'}','${tab}')"${main ? ` title="${main === 'cabinet' ? '내각 › 서명' : ''}"` : ''}>${label}${n != null ? ` <b>${n}</b>` : ''}</button>`).join('');
}

// ── 저장 · 불러오기 (main.js의 getAppState/setAppState가 부름) ──
function legisGetState() {
    return { committees: JSON.parse(JSON.stringify(committees)), constitution: constitution ? JSON.parse(JSON.stringify(constitution)) : null };
}
function legisSetState(leg) {
    committees = Array.isArray(leg?.committees) ? leg.committees.map(c => ({ size: COMMITTEE_DEFAULT_SIZE, chamber: 'house', chairPartyId: null, tags: [], ...c })) : [];
    constitution = leg?.constitution && typeof leg.constitution === 'object'
        ? { title: '헌법', preamble: '', articles: [], revisions: [], ...leg.constitution }
        : null;
    constitutionEditing = false;
    lawBookQuery = '';
    archiveBody = null;
    refreshBillTagPickers(); // 불러온 위원회의 소관 태그로
}
