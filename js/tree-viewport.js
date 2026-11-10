// Shared camera controls for the campaign maker and the in-game direction tree.
(function () {
    'use strict';
    function mount(wrap, tree, options = {}) {
        const controller = new AbortController(), signal = controller.signal;
        const layer = tree.parentElement;
        const width = parseFloat(tree.style.width), height = parseFloat(tree.style.height);
        const min = .1, max = 2.5, clamp = value => Math.max(min, Math.min(max, value));
        let zoom = clamp(options.zoom || 1), pan = null;
        wrap.dataset.treeViewport = '';
        if (!wrap.hasAttribute('tabindex')) wrap.tabIndex = 0;
        if (!wrap.hasAttribute('aria-label')) wrap.setAttribute('aria-label', '방향성 트리 · 휠 확대/축소 · 휠 버튼 드래그 이동');
        // Clip the unscaled layout box to the scaled surface, avoiding phantom
        // scroll extents after zooming out. Artwork padding is part of the tree.
        layer.style.position = 'relative'; layer.style.overflow = 'hidden';
        tree.style.position = 'absolute'; tree.style.left = '0'; tree.style.top = '0';
        tree.style.transformOrigin = 'top left';
        const emit = () => options.onChange?.({zoom, left:wrap.scrollLeft, top:wrap.scrollTop});
        function geometry() {
            layer.style.width = width * zoom + 'px'; layer.style.height = height * zoom + 'px';
            tree.style.transform = `scale(${zoom})`;
        }
        function setZoom(value, point) {
            if (!Number.isFinite(value)) return;
            const next = clamp(value);
            const x = point?.x ?? wrap.clientWidth / 2, y = point?.y ?? wrap.clientHeight / 2;
            const worldX = (wrap.scrollLeft + x) / zoom, worldY = (wrap.scrollTop + y) / zoom;
            zoom = next; geometry();
            wrap.scrollLeft = worldX * zoom - x; wrap.scrollTop = worldY * zoom - y;
            emit();
        }
        function fit() {
            zoom = clamp(Math.min(1, Math.max(1,wrap.clientWidth-24)/width, Math.max(1,wrap.clientHeight-24)/height));
            geometry(); wrap.scrollLeft = 0; wrap.scrollTop = 0; emit();
        }
        function endPan() {
            if (!pan) return;
            const pointerId = pan.id; pan = null; wrap.classList.remove('panning');
            if (wrap.hasPointerCapture?.(pointerId)) wrap.releasePointerCapture(pointerId);
        }
        wrap.addEventListener('wheel', e => {
            e.preventDefault(); e.stopPropagation();
            if (pan || e.buttons) return;
            const delta = (e.deltaY || e.deltaX) * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? wrap.clientHeight : 1);
            const rect = wrap.getBoundingClientRect();
            setZoom(zoom * Math.exp(-delta * .0015), {x:e.clientX-rect.left-wrap.clientLeft, y:e.clientY-rect.top-wrap.clientTop});
        }, {passive:false, signal});
        wrap.addEventListener('pointerdown', e => {
            const middle = e.button === 1;
            const blankPrimary = e.button === 0 && options.panPrimary !== false && !e.target.closest('[data-node]');
            if ((!middle && !blankPrimary) || pan) return;
            e.preventDefault(); e.stopPropagation();
            pan = {id:e.pointerId, x:e.clientX, y:e.clientY, left:wrap.scrollLeft, top:wrap.scrollTop};
            wrap.setPointerCapture?.(e.pointerId); wrap.classList.add('panning'); wrap.focus({preventScroll:true});
        }, {signal});
        window.addEventListener('pointermove', e => {
            if (!pan || e.pointerId !== pan.id) return;
            e.preventDefault();
            wrap.scrollLeft = pan.left - (e.clientX - pan.x); wrap.scrollTop = pan.top - (e.clientY - pan.y); emit();
        }, {passive:false, signal});
        window.addEventListener('pointerup', e => { if (e.pointerId === pan?.id) endPan(); }, {signal});
        window.addEventListener('pointercancel', endPan, {signal});
        window.addEventListener('blur', endPan, {signal});
        wrap.addEventListener('lostpointercapture', endPan, {signal});
        for (const type of ['mousedown','auxclick']) wrap.addEventListener(type, e => { if (e.button === 1) { e.preventDefault(); e.stopPropagation(); } }, {signal});
        wrap.addEventListener('keydown', e => {
            if (e.ctrlKey || e.metaKey || e.altKey || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
            if (e.key === '+' || e.key === '=') setZoom(zoom + .15);
            else if (e.key === '-') setZoom(zoom - .15);
            else if (e.key === '0') fit();
            else if (e.target === wrap && e.key.startsWith('Arrow')) {
                if (e.key === 'ArrowLeft') wrap.scrollLeft -= 70;
                if (e.key === 'ArrowRight') wrap.scrollLeft += 70;
                if (e.key === 'ArrowUp') wrap.scrollTop -= 70;
                if (e.key === 'ArrowDown') wrap.scrollTop += 70;
                emit();
            } else return;
            e.preventDefault(); e.stopPropagation();
        }, {signal});
        geometry(); wrap.scrollLeft = options.left || 0; wrap.scrollTop = options.top || 0; emit();
        return {setZoom, zoomBy:delta=>setZoom(zoom+delta), fit, destroy(){endPan();controller.abort();}};
    }
    window.HemiTreeViewport = {mount};
})();
