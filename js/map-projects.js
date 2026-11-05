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
        if (!data) { status('저장할 지도를 먼저 여세요. 기존 프로젝트는 제작물 목록에 남아 있습니다.'); return queue; }
        projectId ||= uid();
        const item = { id: projectId, title: $('mapProjectTitle').value.trim() || '이름 없는 지도', updatedAt: Date.now(), data };
        dirty = false; status('저장 중…');
        // Serialize writes so a slower previous save cannot replace the latest edit.
        queue = queue.catch(() => {}).then(async () => {
            await store.put('map', item); localStorage.setItem(store.types.map.last, item.id);
            if(projectId===item.id)history.replaceState(null,'','map.html?item='+encodeURIComponent(item.id));
            if (!dirty) status('✓ 프로젝트 저장됨');
        }).catch(e => { dirty = true; status('저장 실패 · 프로젝트 저장을 다시 누르거나 파일로 내보내세요.'); throw e; });
        return queue;
    }
    function changed() {
        if (restoring || !shapes.length) return;
        if ($('mapProjectTitle').value === '새 지도' && $('exportName').value !== 'map') $('mapProjectTitle').value = $('exportName').value;
        dirty = true; status('변경 사항 저장 대기…'); clearTimeout(timer);
        timer = setTimeout(() => { saveNow().catch(() => {}); }, 600);
    }
    function restore(item) {
        const data = item.data;
        if (!data || data.format !== 'hemicycle-map-project@1' || typeof data.svg !== 'string' || !Array.isArray(data.shapes)) throw Error('읽을 수 없는 지도 프로젝트입니다.');
        loadSvgText(data.svg);
        if (!shapes.length || shapes.length !== data.shapes.length) throw Error('저장된 도형과 지도 데이터가 일치하지 않습니다.');
        shapes.forEach((s, i) => {
            for (const k of ['id','defaultId','rawName','origId','key','abbr','seats','pop']) if (Object.hasOwn(data.shapes[i],k)) s[k] = data.shapes[i][k];
        });
        loadedPreset = data.loadedPreset || null;
        $('exportName').value = data.exportName || 'map';
        $('mapProjectTitle').value = item.title || '이름 없는 지도';
        fileNameDisplay.textContent = data.sourceName || item.title;
        $('toggleInfo').checked = data.showInfo !== false; document.body.classList.toggle('mm-noinfo', data.showInfo === false);
        $('wrapSvg').checked = data.wrapSvg !== false; $('toggleIds').checked = data.useIds !== false;
        renderList(); attachHoverHandlers();
        shapes.forEach((s, i) => setSelected(s, !!data.shapes[i].selected));
        projectId = item.id; status('✓ 프로젝트 불러옴');
    }
    $('btnSaveProject').onclick = () => { saveNow().catch(() => {}); };
    $('mapMakerBack').addEventListener('click', async e => {
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        try { if (dirty || timer) await saveNow(); else await queue; location.href = 'maker.html'; }
        catch (err) { await DnoUI.alert('저장하지 못했습니다. 프로젝트 저장을 다시 누르거나 파일로 내보내세요.'); }
    });
    document.addEventListener('input', changed); document.addEventListener('change', changed);
    window.addEventListener('mapmakerchange', changed);
    window.addEventListener('mapmakerreset', () => { clearTimeout(timer); timer = 0; projectId = null; dirty = false; $('mapProjectTitle').value = '새 지도'; status('새 지도 · 기존 프로젝트는 제작물 목록에 남아 있습니다.'); });
    window.addEventListener('beforeunload', e => { if (dirty) { saveNow().catch(() => {}); e.preventDefault(); e.returnValue = ''; } });
    (async () => {
        try {
            const params = new URLSearchParams(location.search), id = params.get('item') || (!params.has('new') && localStorage.getItem(store.types.map.last));
            if (id) { const item = await store.get('map', id); if (item) restore(item); else status('삭제되었거나 없는 지도입니다. 제작물 목록에서 다시 선택하세요.'); }
        } catch (e) { status('프로젝트를 불러오지 못했습니다. 제작물 목록에서 다시 선택하거나 파일을 여세요.'); }
        finally { restoring = false; }
    })();
    window.HemiMapProjects = { save: saveNow, get id() { return projectId; } };
})();
