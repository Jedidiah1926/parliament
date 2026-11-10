// ===== 챌린지 편집기 (challenge.html · 0.3.0) — 목표 · 실패 조건이 있는 짧은 도전 (시나리오 · 격변은 scenario.html) =====
// 챌린지(hemicycle-challenge@1, 예전 hemicycle-scenario@1도 읽음) = 시작(내장 프리셋 또는 세이브 파일) + 브리핑 · 승리 · 패배 글 + 목표 · 실패 조건 · 마감일
//                                  + 이벤트 · 결정 · 변수(스크립트 모드 형식 — docs/MODDING.md)
// - 내 챌린지는 이 브라우저 · 앱의 IndexedDB에 저장 (세이브 파일을 시작으로 쓰면 그 세이브도 함께)
// - 내보내기: .hemiscn (gzip으로 압축한 JSON — 세이브 .hemi와 같은 방식), 불러오기: .hemiscn · .json
// - 시험 플레이: 챌린지를 sessionStorage(크면 IndexedDB)에 맡기고 시작 프리셋/세이브로 main.html을 연다 (js/challenge.js가 받음)
/* global DnoPresets, DnoUI */
(function () {
    'use strict';
    const FORMAT = 'hemicycle-challenge@1';
    const OLD_FORMAT = 'hemicycle-scenario@1'; // 0.3.0 처음 판의 이름
    const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const $ = id => document.getElementById(id);
    const alertBox = (m, t) => (window.DnoUI && DnoUI.alert ? DnoUI.alert(m, t ? { title: t } : undefined) : Promise.resolve(alert(m)));
    const confirmBox = m => (window.DnoUI && DnoUI.confirm ? DnoUI.confirm(m) : Promise.resolve(confirm(m)));
    const uid = p => p + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

    // ---------------------------------------------------------------
    // 내 챌린지 (IndexedDB — 저장소 이름은 0.3.0 처음 판 그대로)
    // ---------------------------------------------------------------
    const DB = 'hemicycleScenarios', STORE = 'items';
    function db() {
        return new Promise((res, rej) => {
            const r = indexedDB.open(DB, 1);
            r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains(STORE)) r.result.createObjectStore(STORE, { keyPath: 'id' }); };
            r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
        });
    }
    async function dbAll() { const d = await db(); return new Promise((res, rej) => { const q = d.transaction(STORE).objectStore(STORE).getAll(); q.onsuccess = () => res(q.result || []); q.onerror = () => rej(q.error); }); }
    async function dbPut(item) { const d = await db(); return new Promise((res, rej) => { const t = d.transaction(STORE, 'readwrite'); t.objectStore(STORE).put(item); t.oncomplete = () => res(); t.onerror = () => rej(t.error); }); }
    async function dbDel(id) { const d = await db(); return new Promise((res, rej) => { const t = d.transaction(STORE, 'readwrite'); t.objectStore(STORE).delete(id); t.oncomplete = () => res(); t.onerror = () => rej(t.error); }); }

    // ---------------------------------------------------------------
    // 챌린지 데이터
    // ---------------------------------------------------------------
    function blank() {
        return {
            format: FORMAT, id: uid('scn'), title: '새 챌린지', author: '', version: '1.0', description: '',
            briefing: '', winText: '', loseText: '',
            start: { kind: 'preset', preset: 'builtin:tutorial' }, // { kind: 'preset', preset } | { kind: 'save', name, state }
            deadline: '', surviveToDeadline: false,
            goals: [], failures: [],
            variables: {}, events: [], decisions: [],
        };
    }
    let S = blank();
    let startInfo = null; // 시작 상태 요약 { nation, date, parties: [이름] }
    const LAST = 'hemicycleScenarioLast'; // 저장소 이름은 처음 판 그대로 (만든 챌린지가 그대로 보이게)

    // 조건 고르기 — 화면의 칸(kind · p) → 스크립트 모드 조건(JSON)
    const {OPS,ECON,APPR,KINDS,KIND_LABEL,partyLabel,opLabel,toCond,autoText}=window.HemiChallengeData;
    // ---------------------------------------------------------------
    // 화면
    // ---------------------------------------------------------------
    let presets = [];
    function render() {
        const body = $('scnBody');
        const st = S.start || {};
        const parties = (startInfo && startInfo.parties) || [];
        body.innerHTML = `
        <section class="scn-col">
            <div class="scn-card">
                <div class="scn-h">기본 정보</div>
                <label class="scn-lab">제목</label><input class="scn-in scn-title" data-f="title" maxlength="80" value="${esc(S.title)}">
                <div class="scn-grid2">
                    <div><label class="scn-lab">제작자</label><input class="scn-in" data-f="author" maxlength="60" value="${esc(S.author)}"></div>
                    <div><label class="scn-lab">버전</label><input class="scn-in" data-f="version" maxlength="20" value="${esc(S.version)}"></div>
                </div>
                <label class="scn-lab">한 줄 설명</label><input class="scn-in" data-f="description" maxlength="200" value="${esc(S.description)}" placeholder="목록에 보일 짧은 설명">
                <label class="scn-lab">브리핑 (시작할 때 보이는 글)</label><textarea class="scn-in" data-f="briefing" rows="6" placeholder="상황 설명, 플레이어가 할 일">${esc(S.briefing)}</textarea>
                <div class="scn-grid2">
                    <div><label class="scn-lab">승리했을 때 글</label><textarea class="scn-in" data-f="winText" rows="3">${esc(S.winText)}</textarea></div>
                    <div><label class="scn-lab">패배했을 때 글</label><textarea class="scn-in" data-f="loseText" rows="3">${esc(S.loseText)}</textarea></div>
                </div>
            </div>
            <div class="scn-card">
                <div class="scn-h">시작</div>
                <div class="scn-seg"><button type="button" data-start="preset" class="${st.kind !== 'save' ? 'on' : ''}">내장 프리셋</button><button type="button" data-start="save" class="${st.kind === 'save' ? 'on' : ''}">세이브 파일 (.hemi)</button></div>
                ${st.kind === 'save'
                    ? `<div class="scn-row"><button type="button" class="scn-btn" id="scnSaveBtn">${st.state ? '다른 세이브 고르기' : '세이브 파일 고르기'}</button><span class="scn-dim">${st.state ? esc(st.name || '세이브') : '게임에서 시작 상황을 만들고 저장 › 파일로 저장(.hemi)한 파일'}</span>
                       <input type="file" id="scnSaveFile" accept=".hemi,.json,application/json" hidden></div>`
                    : `<select class="scn-in" id="scnPreset">${presets.filter(p => !p.comingSoon).map(p => `<option value="${esc(p.id)}" ${p.id === st.preset ? 'selected' : ''}>${esc(p.title)}${p.date ? ` — ${esc(p.date)}` : ''}</option>`).join('')}</select>`}
                <div class="scn-start-info">${startInfo ? `🏛 ${esc(startInfo.nation || '(국가명 없음)')} · ${esc(startInfo.date || '날짜 없음')} · 정당 ${parties.length}개` : '<span class="scn-dim">시작 상태를 읽는 중…</span>'}</div>
                <div class="scn-grid2">
                    <div><label class="scn-lab">마감일 (선택)</label><input class="scn-in" data-f="deadline" placeholder="YYYY-MM-DD" value="${esc(S.deadline)}"></div>
                    <div class="scn-check-wrap"><label class="scn-check"><input type="checkbox" data-fb="surviveToDeadline" ${S.surviveToDeadline ? 'checked' : ''}> 마감일까지 목표를 지키면 승리 (아니면 목표를 다 이루는 순간 승리)</label></div>
                </div>
            </div>
            <div class="scn-card">
                <div class="scn-h">고급 — 이벤트 · 결정 · 변수 <span class="scn-dim">(스크립트 모드 형식 · docs/MODDING.md)</span></div>
                <div class="scn-dim scn-small">조건 · 효과에서 쓰는 변수 · 플래그는 이 챌린지 것만 따로 셉니다. 목표의 "플래그" · "챌린지 변수"와 같은 이름을 쓰면 이어집니다.</div>
                ${['variables', 'events', 'decisions'].map(k => `<label class="scn-lab">${{ variables: '변수 (처음 값) — { "이름": 숫자 }', events: '이벤트 — [ { id, title, desc, trigger, options } ]', decisions: '결정 — [ { id, title, desc, available, effects } ]' }[k]}</label>
                    <textarea class="scn-in scn-code" data-json="${k}" rows="${k === 'variables' ? 3 : 7}" spellcheck="false">${esc(JSON.stringify(S[k], null, 2))}</textarea><div class="scn-err" data-err="${k}"></div>`).join('')}
                <div class="scn-row"><button type="button" class="scn-btn" id="scnExample">예제 이벤트 · 결정 넣기</button></div>
            </div>
        </section>
        <section class="scn-col">
            ${condListHtml('goals', '목표', '이루면 승리 — "선택" 목표는 승리에 필요 없음, "끝까지 유지"는 다시 깨질 수 있음', parties)}
            ${condListHtml('failures', '실패 조건', '하나라도 맞으면 패배', parties)}
            <div class="scn-card scn-note">
                <div class="scn-h">시험 플레이 · 공유</div>
                <div class="scn-dim scn-small">▶ 시험 플레이를 누르면 시작 상태로 새 세이브를 만들고 챌린지를 붙여 게임이 열립니다. 오른쪽 아래 🎯 카드에서 목표를 보고, 날짜를 넘기거나 총선 결과를 반영할 때마다 검사합니다.<br>
                내보내기(.hemichl)한 파일을 다른 사람이 여기서 불러오면 같은 챌린지를 할 수 있습니다. 챌린지는 이 기기에 자동 저장됩니다.</div>
                <div class="scn-row"><button type="button" class="scn-btn scn-danger" id="scnDelete">이 챌린지 지우기</button></div>
            </div>
        </section>
        <datalist id="scnParties"><option value="ruling">집권 세력 최대 정당</option><option value="largest">하원 최대 정당</option><option value="opposition">야당 최대 정당</option>${parties.map(n => `<option value="${esc(n)}">`).join('')}</datalist>`;
        bind();
    }

    function condListHtml(key, title, hint, parties) {
        const list = S[key] || [];
        return `<div class="scn-card">
            <div class="scn-h">${title} <span class="scn-n">${list.length}</span></div>
            <div class="scn-dim scn-small">${hint}</div>
            ${list.map((g, i) => condRow(key, g, i)).join('') || `<div class="scn-empty">${key === 'goals' ? '목표가 없으면 자유 플레이입니다.' : '실패 조건 없음'}</div>`}
            <div class="scn-row"><button type="button" class="scn-btn" data-add="${key}">+ ${key === 'goals' ? '목표' : '실패 조건'} 추가</button></div>
        </div>`;
    }
    function condRow(key, g, i) {
        const p = g.p || {}, k = g.kind || 'custom';
        const party = `<input class="scn-in" list="scnParties" data-p="party" value="${esc(p.party || '')}" placeholder="정당 이름" style="width:150px">`;
        const opn = `<select class="scn-in" data-p="op">${OPS.map(([v, l]) => `<option value="${v}" ${(p.op || 'gte') === v ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
        const num = `<input class="scn-in scn-num" type="number" step="any" data-p="n" value="${esc(p.n ?? '')}">`;
        let fields = '';
        switch (k) {
            case 'ruling': case 'not_ruling': fields = party; break;
            case 'party_seats': fields = `${party}<select class="scn-in" data-p="chamber">${[['house', '하원'], ['senate', '상원'], ['third', '삼원']].map(([v, l]) => `<option value="${v}" ${(p.chamber || 'house') === v ? 'selected' : ''}>${l}</option>`).join('')}</select>${num}<label class="scn-check"><input type="checkbox" data-pb="share" ${p.share ? 'checked' : ''}> %</label>${opn}`; break;
            case 'party_support': fields = `${party}${num}<span class="scn-dim">%</span>${opn}`; break;
            case 'ruling_seats': fields = `${num}<label class="scn-check"><input type="checkbox" data-pb="share" ${p.share !== false ? 'checked' : ''}> %</label>${opn}`; break;
            case 'approval': fields = `<select class="scn-in" data-p="of">${APPR.map(([v, l]) => `<option value="${v}" ${(p.of || 'cabinet') === v ? 'selected' : ''}>${l}</option>`).join('')}</select>${num}<span class="scn-dim">%</span>${opn}`; break;
            case 'economy': fields = `<select class="scn-in" data-p="indicator">${ECON.map(([v, l]) => `<option value="${v}" ${(p.indicator || 'growth') === v ? 'selected' : ''}>${l}</option>`).join('')}</select>${num}${opn}`; break;
            case 'date_after': fields = `<input class="scn-in" data-p="date" placeholder="YYYY-MM-DD" value="${esc(p.date || '')}" style="width:130px">`; break;
            case 'party_status': fields = `${party}<select class="scn-in" data-p="is">${[['banned', '활동 금지'], ['dissolved', '해산'], ['active', '활동 중']].map(([v, l]) => `<option value="${v}" ${(p.is || 'banned') === v ? 'selected' : ''}>${l}</option>`).join('')}</select>`; break;
            case 'flag': fields = `<input class="scn-in" data-p="flag" placeholder="플래그 이름" value="${esc(p.flag || '')}" style="width:150px">`; break;
            case 'var': fields = `<input class="scn-in" data-p="name" placeholder="변수 이름" value="${esc(p.name || '')}" style="width:120px">${num}${opn}`; break;
            default: fields = `<textarea class="scn-in scn-code" data-p="json" rows="3" spellcheck="false" placeholder='{ "party_seats": { "party": "ruling", "share": true, "gte": 50 } }'>${esc(p.json || JSON.stringify(g.condition || {}, null, 1))}</textarea>`;
        }
        return `<div class="scn-cond" data-list="${key}" data-i="${i}">
            <div class="scn-row"><select class="scn-in" data-kind>${KINDS.map(([v, l]) => `<option value="${v}" ${k === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
                <span class="scn-grow"></span><button type="button" class="scn-x" data-up title="위로">↑</button><button type="button" class="scn-x" data-del title="빼기">×</button></div>
            <div class="scn-row scn-fields">${fields}</div>
            <div class="scn-row"><input class="scn-in scn-grow" data-text value="${esc(g.text || '')}" placeholder="${esc(autoText(k, p))}">
                ${key === 'goals' ? `<label class="scn-check"><input type="checkbox" data-opt ${g.required === false ? 'checked' : ''}> 선택</label><label class="scn-check"><input type="checkbox" data-hold ${g.hold ? 'checked' : ''}> 끝까지 유지</label>` : ''}</div>
            ${g.condition == null ? '<div class="scn-err">조건 JSON을 읽지 못했습니다</div>' : ''}
        </div>`;
    }

    function sync(g) {
        g.condition = toCond(g.kind, g.p);
        if (!g.text) g.autoText = autoText(g.kind, g.p);
    }
    function bind() {
        const body = $('scnBody');
        body.querySelectorAll('[data-f]').forEach(inp => { inp.oninput = () => { S[inp.dataset.f] = inp.value; touch(); }; });
        body.querySelectorAll('[data-fb]').forEach(inp => { inp.onchange = () => { S[inp.dataset.fb] = inp.checked; touch(); }; });
        body.querySelectorAll('[data-start]').forEach(b => { b.onclick = () => {
            if (b.dataset.start === 'save') S.start = { kind: 'save', name: S.start.kind === 'save' ? S.start.name : '', state: S.start.kind === 'save' ? S.start.state : null };
            else S.start = { kind: 'preset', preset: (presets.find(p => !p.comingSoon) || {}).id || 'builtin:tutorial' };
            startInfo = null; render(); loadStartInfo(); touch();
        }; });
        $('scnPreset')?.addEventListener('change', e => { S.start = { kind: 'preset', preset: e.target.value }; startInfo = null; render(); loadStartInfo(); touch(); });
        $('scnSaveBtn')?.addEventListener('click', () => $('scnSaveFile').click());
        $('scnSaveFile')?.addEventListener('change', async e => {
            const f = e.target.files && e.target.files[0]; e.target.value = '';
            if (!f) return;
            try {
                const obj = JSON.parse(window.HemiFile ? await window.HemiFile.readText(f) : await f.text());
                if (!obj || !(obj.parliament || obj.data) || !Array.isArray((obj.parliament || obj.data).parties)) throw new Error('not a save');
                S.start = { kind: 'save', name: f.name.replace(/\.(hemi|json)$/i, ''), state: obj };
                startInfo = summarize(obj); render(); touch();
            } catch (err) { alertBox('Hemicycle 세이브 파일(.hemi)이 아닙니다.'); }
        });
        body.querySelectorAll('[data-json]').forEach(ta => { ta.oninput = () => {
            const k = ta.dataset.json, err = body.querySelector(`[data-err="${k}"]`);
            try { const v = JSON.parse(ta.value || (k === 'variables' ? '{}' : '[]')); if (k === 'variables' ? (typeof v !== 'object' || Array.isArray(v)) : !Array.isArray(v)) throw new Error(k === 'variables' ? '{ } 객체여야 합니다' : '[ ] 배열이어야 합니다'); S[k] = v; err.textContent = ''; touch(); }
            catch (e2) { err.textContent = 'JSON 오류: ' + e2.message; }
        }; });
        $('scnExample').onclick = () => {
            S.variables = { ...S.variables, crisis: 0 };
            S.events = [...S.events, { id: 'scandal', title: '정치 스캔들', desc: '{party:ruling}의 핵심 인사가 스캔들에 휘말렸습니다.', trigger: { chance: 20 }, once: true,
                options: [{ text: '사과하고 경질한다', effects: [{ support: { party: 'ruling', add: -1 } }, { approval: { of: 'cabinet', add: -2 } }] }, { text: '모르쇠로 버틴다', effects: [{ support: { party: 'ruling', add: -3 } }, { add_var: { name: 'crisis', value: 1 } }] }] }];
            S.decisions = [...S.decisions, { id: 'rally', category: '챌린지', title: '지지층 결집 집회', desc: '여당 지지율 +2 · 국정 지지율 -1 (180일마다)', cooldown_days: 180, effects: [{ support: { party: 'ruling', add: 2 } }, { approval: { of: 'cabinet', add: -1 } }] }];
            render(); touch();
        };
        body.querySelectorAll('[data-add]').forEach(b => { b.onclick = () => {
            const key = b.dataset.add;
            const g = { id: uid(key === 'goals' ? 'g' : 'f'), kind: key === 'goals' ? 'ruling' : 'ruling_seats', p: key === 'goals' ? { party: 'ruling' } : { n: 30, op: 'lt', share: true }, text: '' };
            sync(g); S[key].push(g); render(); touch();
        }; });
        body.querySelectorAll('.scn-cond').forEach(row => {
            const key = row.dataset.list, i = +row.dataset.i, g = S[key][i];
            row.querySelector('[data-kind]').onchange = e => { g.kind = e.target.value; if (g.kind === 'custom') g.p = { json: JSON.stringify(g.condition || {}, null, 1) }; sync(g); render(); touch(); };
            row.querySelectorAll('[data-p]').forEach(inp => {
                const upd = () => { g.p = g.p || {}; g.p[inp.dataset.p] = inp.type === 'number' ? (inp.value === '' ? '' : Number(inp.value)) : inp.value; sync(g); const t = row.querySelector('[data-text]'); if (t) t.placeholder = autoText(g.kind, g.p); touch(); };
                inp.oninput = upd; inp.onchange = upd;
            });
            row.querySelectorAll('[data-pb]').forEach(inp => { inp.onchange = () => { g.p = g.p || {}; g.p[inp.dataset.pb] = inp.checked; sync(g); const t = row.querySelector('[data-text]'); if (t) t.placeholder = autoText(g.kind, g.p); touch(); }; });
            row.querySelector('[data-text]').oninput = e => { g.text = e.target.value; touch(); };
            row.querySelector('[data-opt]')?.addEventListener('change', e => { g.required = e.target.checked ? false : undefined; touch(); });
            row.querySelector('[data-hold]')?.addEventListener('change', e => { g.hold = e.target.checked || undefined; touch(); });
            row.querySelector('[data-del]').onclick = () => { S[key].splice(i, 1); render(); touch(); };
            row.querySelector('[data-up]').onclick = () => { if (i > 0) { [S[key][i - 1], S[key][i]] = [S[key][i], S[key][i - 1]]; render(); touch(); } };
        });
        $('scnDelete').onclick = async () => {
            if (!(await confirmBox(`"${S.title}" 챌린지를 이 기기에서 지울까요? (내보낸 파일은 그대로)`))) return;
            await dbDel(S.id).catch(() => {});
            const all = await dbAll().catch(() => []);
            if (all.length) await openItem(all.sort((a, b) => b.updatedAt - a.updatedAt)[0]); else { S = blank(); startInfo = null; render(); loadStartInfo(); await saveNow(); }
            refreshLibrary();
        };
    }

    // 시작 상태 요약 (국가 · 날짜 · 정당) — 목표의 정당 이름 고르기에 씀
    function summarize(state) {
        const c = state.config || {};
        const parl = state.parliament || state.data || {};
        const parties = (parl.parties || []).filter(p => p && p.ideologyId !== 9999 && p.status !== 'dissolved').map(p => String(p.name || '').trim()).filter(Boolean);
        return { nation: c.nationName || '', date: c.nationDateYear ? `${c.nationDateEra ? c.nationDateEra + ' ' : ''}${c.nationDateYear}년 ${c.nationDateMonth || 1}월 ${c.nationDateDay || 1}일` : '', parties };
    }
    let loadToken = 0;
    async function loadStartInfo() {
        const st = S.start || {};
        const tok = ++loadToken;
        try {
            if (st.kind === 'save') { startInfo = st.state ? summarize(st.state) : { nation: '(세이브를 고르세요)', date: '', parties: [] }; }
            else {
                const p = await DnoPresets.find(st.preset);
                const state = p ? await DnoPresets.loadState(p) : null;
                if (tok !== loadToken) return;
                startInfo = state ? summarize(state) : { nation: '(프리셋을 읽지 못함)', date: '', parties: [] };
            }
        } catch (e) { startInfo = { nation: '(시작 상태를 읽지 못함)', date: '', parties: [] }; }
        if (tok === loadToken) render();
    }

    // ---------------------------------------------------------------
    // 저장 · 목록 · 파일
    // ---------------------------------------------------------------
    let saveTimer = 0;
    function touch() { clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 500); }
    async function saveNow() {
        clearTimeout(saveTimer);
        try { await dbPut({ id: S.id, title: S.title || '(제목 없음)', updatedAt: Date.now(), data: JSON.parse(JSON.stringify(S)) }); localStorage.setItem(LAST, S.id); history.replaceState(null,'','challenge.html?item='+encodeURIComponent(S.id)); } catch (e) { /* 저장 실패 — 내보내기로 */ }
        refreshLibrary();
    }
    async function refreshLibrary() {
        const sel = $('scnLibrary');
        const all = (await dbAll().catch(() => [])).sort((a, b) => b.updatedAt - a.updatedAt);
        sel.innerHTML = `<option value="" disabled>내 챌린지 (${all.length})</option>` + all.map(it => `<option value="${esc(it.id)}" ${it.id === S.id ? 'selected' : ''}>${esc(it.title)}</option>`).join('');
    }
    async function openItem(it) {
        S = normalize(it.data) || blank();
        startInfo = null; render(); loadStartInfo();
        try { localStorage.setItem(LAST, S.id); } catch (e) { /* 무시 */ }
    }
    function normalize(d) {
        if (!d || (d.format !== FORMAT && d.format !== OLD_FORMAT)) return null;
        d = { ...d, format: FORMAT };
        const b = blank();
        const out = { ...b, ...d };
        ['goals', 'failures', 'events', 'decisions'].forEach(k => { if (!Array.isArray(out[k])) out[k] = []; });
        if (!out.variables || typeof out.variables !== 'object' || Array.isArray(out.variables)) out.variables = {};
        if (!out.start || (out.start.kind !== 'save' && out.start.kind !== 'preset')) out.start = b.start;
        ['goals', 'failures'].forEach(k => out[k].forEach(g => { if (!g.id) g.id = uid('g'); if (!g.kind) { g.kind = 'custom'; g.p = { json: JSON.stringify(g.condition || {}, null, 1) }; } }));
        return out;
    }
    // 플레이 · 내보내기용 — 목표 글이 비었으면 자동 글로
    function finalData() {
        const d = JSON.parse(JSON.stringify(S));
        ['goals', 'failures'].forEach(k => d[k].forEach(g => { g.condition = toCond(g.kind, g.p); if (!g.text) g.text = autoText(g.kind, g.p); delete g.autoText; }));
        return d;
    }
    async function exportFile() {
        await saveNow();
        const d = finalData();
        const blob = window.HemiFile ? await window.HemiFile.encode(d) : new Blob([JSON.stringify(d)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${(S.title || 'challenge').replace(/[\\/:*?"<>|]/g, '_')}.hemichl`;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 3000);
    }
    async function importFile(f) {
        try {
            const d = normalize(JSON.parse(window.HemiFile ? await window.HemiFile.readText(f) : await f.text()));
            if (!d) throw new Error('format');
            const all = await dbAll().catch(() => []);
            if (all.some(it => it.id === d.id) && !(await confirmBox(`같은 챌린지("${d.title}")가 이미 있습니다. 불러온 것으로 덮어쓸까요? (취소하면 복사본으로)`))) d.id = uid('scn');
            S = d; startInfo = null; render(); loadStartInfo(); await saveNow();
        } catch (e) { alertBox('Hemicycle 챌린지 파일(.hemichl)이 아닙니다.'); }
    }

    // ---------------------------------------------------------------
    // 시험 플레이
    // ---------------------------------------------------------------
    async function play() {
        await saveNow();
        const d = finalData();
        const st = d.start || {};
        if (st.kind === 'save' && !st.state) { alertBox('시작할 세이브 파일을 고르세요.'); return; }
        const bad = [...d.goals, ...d.failures].find(g => g.condition == null);
        if (bad) { alertBox(`조건을 읽지 못한 항목이 있습니다: ${bad.text || bad.id}`); return; }
        const scn = { ...d, start: { kind: st.kind, preset: st.preset, name: st.name } }; // 시작 세이브는 따로 넘김
        const name = d.title || '챌린지';
        try {
            ['hemiBootCampaign','hemiBootCampaignPending','hemiBootChallenge','hemiBootChallengePending','dnoBootPresetId','dnoBootNewSaveName','dnoBootImportedStateJSON','dnoBootImportedName','dnoBootImportPending'].forEach(k=>sessionStorage.removeItem(k));
            const text = JSON.stringify(scn);
            try { sessionStorage.setItem('hemiBootChallenge', text); }
            catch (e) { await window.HemiFile.stash('bootChallenge', { text }); sessionStorage.setItem('hemiBootChallengePending', '1'); }
            if (st.kind === 'save') {
                const stateText = JSON.stringify(st.state);
                try { sessionStorage.setItem('dnoBootImportedStateJSON', stateText); sessionStorage.setItem('dnoBootImportedName', name); }
                catch (e) {
                    sessionStorage.removeItem('dnoBootImportedStateJSON');
                    await window.HemiFile.stash('bootImport', { name, text: stateText });
                    sessionStorage.setItem('dnoBootImportPending', '1');
                }
            } else {
                sessionStorage.setItem('dnoBootPresetId', st.preset || 'builtin:tutorial');
                sessionStorage.setItem('dnoBootNewSaveName', name);
            }
        } catch (e) { alertBox('챌린지를 넘기지 못했습니다. (저장 공간 부족)'); return; }
        location.href = 'main.html';
    }

    // ---------------------------------------------------------------
    // 시작
    // ---------------------------------------------------------------
    $('scnNew').onclick = async () => { await saveNow(); S = blank(); startInfo = null; render(); loadStartInfo(); await saveNow(); };
    $('scnOpen').onclick = () => $('scnFile').click();
    $('scnFile').onchange = e => { const f = e.target.files && e.target.files[0]; e.target.value = ''; if (f) importFile(f); };
    $('scnExport').onclick = exportFile;
    $('scnPlay').onclick = play;
    $('scnLibrary').onchange = async e => { const selected=e.target.value; await saveNow(); const all = await dbAll().catch(() => []); const it = all.find(x => x.id === selected); if (it) openItem(it); };
    document.querySelector('a.scn-back[href="maker.html"]')?.addEventListener('click',async e=>{
        if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;
        e.preventDefault();await saveNow();location.href='maker.html';
    });
    window.addEventListener('beforeunload', () => { if (saveTimer) saveNow(); });

    (async function init() {
        try { presets = window.DnoPresets ? await DnoPresets.list() : []; } catch (e) { presets = []; }
        const all = (await dbAll().catch(() => [])).sort((a, b) => b.updatedAt - a.updatedAt);
        let last = null; try { last = localStorage.getItem(LAST); } catch (e) { /* 무시 */ }
        const params=new URLSearchParams(location.search), requested=params.get('item');
        const it = params.has('new') ? null : requested ? all.find(x=>x.id===requested) : all.find(x => x.id === last) || all[0];
        if(requested&&!it)alertBox('이 제작물을 찾을 수 없습니다. 제작물 목록에서 다시 선택해 주세요.');
        if (it) S = normalize(it.data) || blank();
        render(); loadStartInfo(); refreshLibrary();
        if (!it) saveNow();
    })();

    window.HemiChallengeEditor = { get data() { return S; }, finalData, play, importFile, toCond, autoText };
})();
