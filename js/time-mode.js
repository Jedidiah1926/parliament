// General-game playback preference. Authored scenarios choose their own mode.
(function(){
    'use strict';
    const KEY='dnoTimeMode';
    const get=()=>{try{return localStorage.getItem(KEY)==='realtime'?'realtime':'turn';}catch(e){return 'turn';}};
    function render(){for(const [id,mode]of [['timeModeTurnBtn','turn'],['timeModeRealtimeBtn','realtime']]){const el=document.getElementById(id);if(el){el.classList.toggle('active',get()===mode);el.setAttribute('aria-pressed',String(get()===mode));}}}
    function set(mode){if(!['turn','realtime'].includes(mode))return;try{localStorage.setItem(KEY,mode);}catch(e){return;}render();window.dispatchEvent(new Event('hemi-time-mode-changed'));}
    window.HemiTimeMode={KEY,get,set};
    window.addEventListener('storage',e=>{if(e.key===KEY){render();window.dispatchEvent(new Event('hemi-time-mode-changed'));}});
    document.addEventListener('DOMContentLoaded',render);
})();
