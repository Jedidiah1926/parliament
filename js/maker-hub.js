(function () {
    'use strict';
    const store = window.HemiMakerStore, types = store.types;
    const $ = id => document.getElementById(id);
    const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
    let filter = new URLSearchParams(location.search).get('type') || 'all', projects = [], failures = [], loadId = 0;
    if (!Object.hasOwn(types, filter)) filter = 'all';
    const demo = !!window.HEMI_BUILD?.demo;
    if (demo) {
        const link = document.querySelector('[data-new="map"]');
        link.removeAttribute('href'); link.setAttribute('aria-disabled', 'true');
        link.querySelector('.maker-new-action').textContent = '🔒 정식판에서';
    }
    const stamp = date => Number.isFinite(date) ? new Date(date).toLocaleDateString('ko-KR') : '';
    function render() {
        $('makerTabs').innerHTML = [['all','전체'], ...Object.entries(types).map(([k,t]) => [k,t.name])].map(([k,title]) => `<button type="button" class="cpe-tab ${k === filter ? 'on' : ''}" aria-pressed="${k === filter}" data-filter="${k}">${title} <span class="scn-n">${projects.filter(p => k === 'all' || p.kind === k).length}</span></button>`).join('');
        $('makerTabs').querySelectorAll('[data-filter]').forEach(b => b.onclick = () => { filter = b.dataset.filter; history.replaceState(null, '', filter === 'all' ? 'maker.html' : 'maker.html?type=' + filter); render(); });
        const query = $('makerSearch').value.trim().toLowerCase();
        const rows = projects.filter(p => (filter === 'all' || p.kind === filter) && `${p.title} ${p.data?.description || ''} ${p.data?.author || ''}`.toLowerCase().includes(query));
        $('makerStatus').textContent = failures.length ? failures.map(k => types[k].name + ' 목록을 읽지 못했습니다. 새로고침해 주세요.').join(' ') : `${rows.length}개 제작물 · 이 브라우저 / 앱에 저장된 작업`;
        $('makerStatus').classList.toggle('maker-error', !!failures.length);
        $('makerProjects').innerHTML = rows.length ? rows.map((p,i) => `<article class="scn-card maker-project" data-kind="${p.kind}"><div class="maker-project-meta"><span class="maker-kind">${types[p.kind].name}</span><span class="scn-grow"></span><time>${esc(stamp(p.updatedAt))}</time></div><h2>${esc(p.title || '(제목 없음)')}</h2><p class="scn-dim">${esc(p.data?.description || (p.kind === 'map' ? `${p.data?.shapes?.length || 0}개 도형` : '설명이 없습니다.'))}</p>${p.data?.author ? `<span class="scn-dim">${esc(p.data.author)}</span>` : ''}<div class="maker-project-actions">${demo && p.kind === 'map' ? '<span class="scn-dim">🔒 정식판에서 편집</span>' : `<a class="scn-btn scn-primary" href="${esc(store.url(p.kind,p.id))}" data-edit>편집 이어하기</a>`}<button type="button" class="scn-btn scn-danger" data-delete="${i}" aria-label="${esc(p.title)} 삭제">삭제</button></div></article>`).join('') : `<div class="maker-empty"><h2>${query ? '검색 결과가 없습니다.' : failures.length ? '제작물 목록을 확인하지 못했습니다.' : '아직 저장된 제작물이 없습니다.'}</h2><p class="scn-dim">${query ? '다른 검색어나 종류를 선택해 보세요.' : '위의 메이커에서 새로 만들거나 파일을 불러오세요. 시나리오·챌린지는 자동 저장되며, 맵은 지도 편집 시 프로젝트 저장됩니다.'}</p></div>`;
        $('makerProjects').querySelectorAll('[data-delete]').forEach(b => b.onclick = async () => {
            const p = rows[+b.dataset.delete];
            const yes = await DnoUI.confirm(`“${p.title || '(제목 없음)'}” ${types[p.kind].name} 제작물을 삭제할까요? 되돌릴 수 없습니다. 이미 생성한 게임 세이브와 내보낸 파일은 남습니다.`, { title: '제작물 삭제', tone: 'danger', okText: '삭제', focusCancel: true });
            if (!yes) return;
            b.disabled = true;
            try { await store.remove(p.kind,p.id); await load(); }
            catch (e) { b.disabled = false; await DnoUI.alert('삭제하지 못했습니다. 다시 시도해 주세요.'); }
        });
    }
    async function load() {
        const id = ++loadId;
        $('makerStatus').textContent = '제작물을 불러오는 중…';
        const results = await Promise.allSettled(Object.keys(types).map(kind => store.list(kind)));
        if (id !== loadId) return;
        projects = []; failures = [];
        results.forEach((result, i) => { const kind = Object.keys(types)[i]; if (result.status === 'fulfilled') projects.push(...result.value.map(p => ({...p,kind}))); else failures.push(kind); });
        projects.sort((a,b) => (b.updatedAt || 0) - (a.updatedAt || 0)); render();
    }
    $('makerSearch').oninput = render;
    $('makerRefresh').onclick = load;
    window.addEventListener('pageshow', e => { if (e.persisted) load(); });
    window.addEventListener('focus', load);
    load();
})();
