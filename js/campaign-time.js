// Playback of a saved campaign clock. Timers never survive save switches or loads.
(function () {
    'use strict';
    const Clock=window.HemiCampaignClock;
    function create(api) {
        const world=api.owner==='world',hostSelector=world?'[data-world-time]':'[data-campaign-time]';
        let timer=0,generation=0,busy=false,lastSave=0,reason='';
        const state=()=>api.state(),clock=()=>state()?.clock;
        function blocked() {
            if(document.body.classList.contains('no-open-tab'))return '플레이할 세이브를 열어 주세요';
            if(document.hidden)return '다른 화면으로 이동해 일시정지';
            if([...document.querySelectorAll('[role="dialog"][aria-modal="true"]')].some(el=>el.getClientRects().length)||window.HemiScriptMods?.state?.queue?.length||state()?.articles?.queue?.length)return '소식을 확인한 뒤 진행하세요';
            const settings=document.getElementById('settingsPanelLayer');if(settings&&getComputedStyle(settings).display!=='none')return '설정을 닫은 뒤 진행하세요';
            if(window.isDatePanelOpen?.()||window.isSavePanelOpen?.())return '열린 설정을 닫은 뒤 진행하세요';
            return '';
        }
        function stopTimer(){clearTimeout(timer);timer=0;generation++;}
        function save(){lastSave=performance.now();api.save();}
        function pause(message='일시정지') {
            stopTimer();const c=clock();if(!c)return false;
            const changed=!c.paused;c.paused=true;reason=message;render();if(changed)save();return true;
        }
        function schedule() {
            if(!clock()||clock().mode!=='realtime'||clock().paused||timer)return;
            const token=generation;
            timer=setTimeout(()=>{timer=0;if(token!==generation||!clock()||clock().paused)return;step('realtime');schedule();},Clock.SPEED_MS[clock().speed]);
        }
        function step(mode) {
            const s=state(),c=s?.clock;if(!c||c.mode!==mode||busy)return false;
            const block=blocked();if(block){if(mode==='realtime')pause(block);else {reason=block;render();}return false;}
            const next=Clock.advance(c);if(!next){pause('달력 범위의 끝입니다');return false;}
            busy=true;
            try{
                s.clock=next;
                // A campaign step can cross at most one midnight. Run existing
                // world-day systems once, then reassert the authoritative clock.
                if(c.day!==next.day)api.advanceWorldDay();
                api.mirror();api.tick({hourly:mode==='realtime'&&c.day===next.day});
                if(state()!==s)return false;
                const blockAfter=blocked();if(blockAfter&&mode==='realtime')pause(blockAfter);
                if(mode==='turn'||c.day!==next.day||performance.now()-lastSave>=5000)save();
                reason=blockAfter||'';return true;
            }finally{busy=false;render();}
        }
        function nextTurn(){return step('turn');}
        function play() {
            const c=clock();if(!c||c.mode!=='realtime')return false;
            const block=blocked();if(block){reason=block;render();return false;}
            c.paused=false;reason='';render();save();schedule();return true;
        }
        function speed(value) {
            const c=clock();if(!c||c.mode!=='realtime'||!Object.hasOwn(Clock.SPEED_MS,value))return false;
            stopTimer();c.speed=Number(value);render();save();schedule();return true;
        }
        function render() {
            const c=clock(),root=document.documentElement;
            root.toggleAttribute(world?'data-world-clock':'data-campaign-clock',!!c);
            document.querySelectorAll(hostSelector).forEach(host=>{
                host.hidden=!c;
                if(!c){host.replaceChildren();delete host.dataset.playbackKey;return;}
                // Hourly date changes must not replace a focused speed selector.
                const key=[c.mode,c.speed,c.paused,busy].join(':');
                if(host.dataset.playbackKey!==key){
                    const focused=host.contains(document.activeElement)?document.activeElement:null;
                    const focusRole=focused?.hasAttribute('data-campaign-toggle')?'[data-campaign-toggle]':focused?.hasAttribute('data-campaign-next-turn')?'[data-campaign-next-turn]':null;
                    host.dataset.playbackKey=key;
                    host.innerHTML=`<span class="cp-time-label">${world?'일반 게임':'시나리오'} · ${c.mode==='turn'?'턴제':'실시간'}</span><strong class="cp-time-date"></strong><span class="cp-time-controls">${c.mode==='turn'?`<button type="button" class="cp-time-button" data-campaign-next-turn ${busy?'disabled':''}>다음 턴</button><span class="cp-time-note">1턴 = 1일</span>`:`<button type="button" class="cp-time-button" data-campaign-toggle>${c.paused?'▶ 진행':'Ⅱ 일시정지'}</button><label class="cp-time-speed-label">속도 <select data-campaign-speed aria-label="${world?'일반 게임':'시나리오'} 진행 속도">${[1,2,3,4,5].map(n=>`<option value="${n}" ${n===c.speed?'selected':''}>${n}</option>`).join('')}</select></label><span class="cp-time-note"></span>`}</span>`;
                    host.querySelector('[data-campaign-next-turn]')?.addEventListener('click',nextTurn);
                    host.querySelector('[data-campaign-toggle]')?.addEventListener('click',()=>clock()?.paused?play():pause());
                    host.querySelector('[data-campaign-speed]')?.addEventListener('change',e=>speed(+e.target.value));
                    if(focusRole)host.querySelector(focusRole)?.focus({preventScroll:true});
                }
                host.querySelector('.cp-time-date').textContent=Clock.label(c);
                if(c.mode==='realtime')host.querySelector('.cp-time-note').textContent=c.paused?(reason||'일시정지'):'진행 중';
            });
            const locked=root.hasAttribute('data-campaign-clock')||root.hasAttribute('data-world-clock');
            for(const id of ['nationDateYear','nationDateMonth','nationDateDay']){const el=document.getElementById(id);if(el)el.disabled=locked;}
            if(c){const date=document.getElementById('dispInfoDate');if(date)date.textContent=Clock.label(c);}
        }
        function reset(){stopTimer();busy=false;lastSave=performance.now();reason=clock()?'불러온 게임 · 일시정지':'';if(clock())clock().paused=true;api.mirror();render();}
        // Observe direct modal additions/removals, not every clock label update.
        new MutationObserver(records=>{
            if(!clock()||!records.some(r=>r.type==='attributes'||[...r.addedNodes,...r.removedNodes].some(n=>n.nodeType===1&&(n.matches?.('[role="dialog"]')||n.querySelector?.('[role="dialog"]')))))return;
            if(!clock().paused&&blocked())pause(blocked());else render();
        }).observe(document.body,{childList:true,attributes:true,attributeFilter:['class']});
        document.addEventListener('visibilitychange',()=>{if(document.hidden&&clock())pause('다른 화면으로 이동해 일시정지');else render();});
        document.addEventListener('keydown',e=>{
            if(e.repeat&&e.target.closest?.('[data-campaign-next-turn]')){e.preventDefault();return;}
            if(e.code!=='Space'||e.repeat||e.ctrlKey||e.metaKey||e.altKey||!clock()||clock().mode!=='realtime'||/^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(e.target.tagName)||e.target.closest?.('[role="button"],[contenteditable="true"]')||blocked())return;
            e.preventDefault();e.stopPropagation();clock().paused?play():pause();
        },true);
        window.addEventListener('beforeunload',()=>{stopTimer();if(clock()){clock().paused=true;save();}});
        return {render,reset,pause,play,speed,nextTurn};
    }
    window.HemiCampaignTime={create};
})();
