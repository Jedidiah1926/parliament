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
        link.querySelector('.maker-new-action').textContent = i18n('maker.makerHub.1');
    }
    const stamp = date => Number.isFinite(date) ? new Date(date).toLocaleDateString('ko-KR') : '';
    function render() {
        $('makerTabs').innerHTML = [['all',i18n('sim.contentVote.21')], ...Object.entries(types).map(([k,t]) => [k,t.name])].map(([k,title]) => `<button type="button" class="cpe-tab ${k === filter ? 'on' : ''}" aria-pressed="${k === filter}" data-filter="${k}">${title} <span class="scn-n">${projects.filter(p => k === 'all' || p.kind === k).length}</span></button>`).join('');
        $('makerTabs').querySelectorAll('[data-filter]').forEach(b => b.onclick = () => { filter = b.dataset.filter; history.replaceState(null, '', filter === 'all' ? 'maker.html' : 'maker.html?type=' + filter); render(); });
        const query = $('makerSearch').value.trim().toLowerCase();
        const rows = projects.filter(p => (filter === 'all' || p.kind === filter) && `${p.title} ${p.data?.description || ''} ${p.data?.author || ''}`.toLowerCase().includes(query));
        $('makerStatus').textContent = failures.length ? failures.map(k => types[k].name + (" " + i18n('maker.makerHub.2'))).join(' ') : i18n('maker.makerHub.3', { rows: rows.length });
        $('makerStatus').classList.toggle('maker-error', !!failures.length);
        $('makerProjects').innerHTML = rows.length ? rows.map((p,i) => `<article class="scn-card maker-project" data-kind="${p.kind}"><div class="maker-project-meta"><span class="maker-kind">${types[p.kind].name}</span><span class="scn-grow"></span><time>${esc(stamp(p.updatedAt))}</time></div><h2>${esc(p.title || esc(i18n('sim.news.8')))}</h2><p class="scn-dim">${esc(p.data?.description || (p.kind === 'map' ? esc(i18n('maker.makerHub.4', { shapes: p.data?.shapes?.length || 0 })) : esc(i18n('maker.makerHub.5'))))}</p>${p.data?.author ? `<span class="scn-dim">${esc(p.data.author)}</span>` : ''}<div class="maker-project-actions">${demo && p.kind === 'map' ? `<span class="scn-dim">${esc(i18n('maker.makerHub.6'))}</span>` : `<a class="scn-btn scn-primary" href="${esc(store.url(p.kind,p.id))}" data-edit>${esc(i18n('maker.makerHub.7'))}</a>`}<button type="button" class="scn-btn scn-danger" data-delete="${i}" aria-label="${esc(i18n('maker.hub.deleteOf', { title: p.title }))}">${esc(i18n('common.delete'))}</button></div></article>`).join('') : `<div class="maker-empty"><h2>${query ? i18n('common.noResults') : failures.length ? i18n('maker.makerHub.8') : i18n('maker.makerHub.9')}</h2><p class="scn-dim">${query ? i18n('maker.makerHub.10') : i18n('maker.makerHub.11')}</p></div>`;
        $('makerProjects').querySelectorAll('[data-delete]').forEach(b => b.onclick = async () => {
            const p = rows[+b.dataset.delete];
            const yes = await HemiUI.confirm(i18n('maker.makerHub.12', { title: p.title || i18n('sim.news.8'), name: types[p.kind].name }), { title: i18n('maker.makerHub.13'), tone: 'danger', okText: i18n('common.delete'), focusCancel: true });
            if (!yes) return;
            b.disabled = true;
            try { await store.remove(p.kind,p.id); await load(); }
            catch (e) { b.disabled = false; await HemiUI.alert(i18n('maker.makerHub.14')); }
        });
    }
    async function load() {
        const id = ++loadId;
        $('makerStatus').textContent = i18n('maker.makerHub.15');
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
