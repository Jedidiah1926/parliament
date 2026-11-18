// Map drafts retain editable SVG + district metadata, not just the exported file.
// Loaded after map.html's editor script so geometry and .hemimap extras stay intact.
(function () {
    'use strict';
    const store = window.HemiMakerStore, $ = id => document.getElementById(id);
    const uid = () => 'map_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    let projectId = null, timer = 0, restoring = true, dirty = false, queue = Promise.resolve();
    const status = text => { $('mapSaveStatus').textContent = text; };
    function snapshot() {
        if (!view || !shapes.length) return null;
        const svg = view.svg.cloneNode(true), base = view.base;
        svg.setAttribute('viewBox', `${base.x} ${base.y} ${base.w} ${base.h}`);
        svg.style.removeProperty('width'); svg.style.removeProperty('height');
        svg.querySelectorAll('.mm-hl,.mm-sel').forEach(el => { el.classList.remove('mm-hl', 'mm-sel'); });
        const live = [...view.svg.querySelectorAll('path,polygon,polyline,rect,circle,ellipse')];
        const metadata = live.map(el => {
            const s = shapes.find(s => s.el === el);
            const out = {};
            for (const k of ['id','defaultId','rawName','origId','key','abbr','seats','pop','selected']) if (s && s[k] != null) out[k] = s[k];
            return out;
        });
        return { format: 'hemicycle-map-project@1', svg: new XMLSerializer().serializeToString(svg), shapes: metadata,
            loadedPreset: loadedPreset ? JSON.parse(JSON.stringify(loadedPreset)) : null,
            exportName: $('exportName').value, sourceName: fileNameDisplay.textContent,
            showInfo: $('toggleInfo').checked, wrapSvg: $('wrapSvg').checked, useIds: $('toggleIds').checked };
    }
    async function saveNow() {
        clearTimeout(timer); timer = 0;
        if (restoring) return queue;
        const data = snapshot();
        if (!data) { status(i18n('map.projects.1')); return queue; }
        projectId ||= uid();
        const item = { id: projectId, title: $('mapProjectTitle').value.trim() || i18n('map.projects.2'), updatedAt: Date.now(), data };
        dirty = false; status(i18n('map.projects.3'));
        // Serialize writes so a slower previous save cannot replace the latest edit.
        queue = queue.catch(() => {}).then(async () => {
            await store.put('map', item); localStorage.setItem(store.types.map.last, item.id);
            if(projectId===item.id)history.replaceState(null,'','map.html?item='+encodeURIComponent(item.id));
            if (!dirty) status(i18n('map.projects.4'));
        }).catch(e => { dirty = true; status(i18n('map.projects.5')); throw e; });
        return queue;
    }
    function changed() {
        if (restoring || !shapes.length) return;
        if (['새 지도', i18n('map.projects.11')].includes($('mapProjectTitle').value) && $('exportName').value !== 'map') $('mapProjectTitle').value = $('exportName').value;
        dirty = true; status(i18n('map.projects.6')); clearTimeout(timer);
        timer = setTimeout(() => { saveNow().catch(() => {}); }, 600);
    }
    function restore(item) {
        const data = item.data;
        if (!data || data.format !== 'hemicycle-map-project@1' || typeof data.svg !== 'string' || !Array.isArray(data.shapes)) throw Error(i18n('map.projects.7'));
        loadSvgText(data.svg);
        if (!shapes.length || shapes.length !== data.shapes.length) throw Error(i18n('map.projects.8'));
        shapes.forEach((s, i) => {
            for (const k of ['id','defaultId','rawName','origId','key','abbr','seats','pop']) if (Object.hasOwn(data.shapes[i],k)) s[k] = data.shapes[i][k];
        });
        loadedPreset = data.loadedPreset || null;
        $('exportName').value = data.exportName || 'map';
        $('mapProjectTitle').value = item.title || i18n('map.projects.2');
        fileNameDisplay.textContent = data.sourceName || item.title;
        $('toggleInfo').checked = data.showInfo !== false; document.body.classList.toggle('mm-noinfo', data.showInfo === false);
        $('wrapSvg').checked = data.wrapSvg !== false; $('toggleIds').checked = data.useIds !== false;
        renderList(); attachHoverHandlers();
        shapes.forEach((s, i) => setSelected(s, !!data.shapes[i].selected));
        projectId = item.id; status(i18n('map.projects.9'));
    }
    $('btnSaveProject').onclick = () => { saveNow().catch(() => {}); };
    $('mapMakerBack').addEventListener('click', async e => {
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        try { if (dirty || timer) await saveNow(); else await queue; location.href = 'maker.html'; }
        catch (err) { await HemiUI.alert(i18n('map.projects.10')); }
    });
    document.addEventListener('input', changed); document.addEventListener('change', changed);
    window.addEventListener('mapmakerchange', changed);
    window.addEventListener('mapmakerreset', () => { clearTimeout(timer); timer = 0; projectId = null; dirty = false; $('mapProjectTitle').value = i18n('map.projects.11'); status(i18n('map.projects.12')); });
    window.addEventListener('beforeunload', e => { if (dirty) { saveNow().catch(() => {}); e.preventDefault(); e.returnValue = ''; } });
    (async () => {
        try {
            const params = new URLSearchParams(location.search), id = params.get('item') || (!params.has('new') && localStorage.getItem(store.types.map.last));
            if (id) { const item = await store.get('map', id); if (item) restore(item); else status(i18n('map.projects.13')); }
        } catch (e) { status(i18n('map.projects.14')); }
        finally { restoring = false; }
    })();
    // 처음 이름 칸의 "새 지도"(map.html에 적힌 한국어)를 지금 언어로
    if ($('mapProjectTitle') && $('mapProjectTitle').value === '새 지도') $('mapProjectTitle').value = i18n('map.projects.11');
    window.HemiMapProjects = { save: saveNow, get id() { return projectId; } };
})();
