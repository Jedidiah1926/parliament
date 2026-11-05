// Regular game playback reuses the scenario timer without sharing its saved clock.
(function(){
    'use strict';
    if(document.documentElement.getAttribute('data-app-mode')==='logo')return;
    const Clock=HemiCampaignClock;
    let holder=null,loading=false,advancing=false;
    const active=()=>!window.HemiCampaign?.state&&HemiTimeMode.get()==='realtime'?holder:null;
    function worldDay(){
        const y=+document.getElementById('nationDateYear').value,m=+document.getElementById('nationDateMonth').value,d=+document.getElementById('nationDateDay').value;
        if(!y||!m||!d)return null;
        return Clock.dayFromKey(y*10000+m*100+d);
    }
    function writeDay(day){const p=Clock.parts(day);for(const [id,value]of [['nationDateYear',p.y],['nationDateMonth',p.m],['nationDateDay',p.d]])document.getElementById(id).value=value;}
    function mirror(){if(active()&&!loading&&!advancing)writeDay(holder.clock.day);}
    const origInfo=window.updateDispInfoBar;
    window.updateDispInfoBar=function(){mirror();const r=origInfo.apply(this,arguments);if(active()&&!loading)document.getElementById('dispInfoDate').textContent=Clock.label(holder.clock);return r;};
    const origAdvance=window.advanceNationDate;
    const controller=HemiCampaignTime.create({
        owner:'world',state:active,
        mirror:()=>{mirror();window.updateDispInfoBar();},
        advanceWorldDay:()=>{advancing=true;try{writeDay(holder.clock.day-1);origAdvance(1,'day');}finally{advancing=false;}},
        tick:()=>{},save:()=>{try{window.saveActiveNow?.(true);}catch(e){/* autosave retries */}}
    });
    function configure(saved){
        const day=worldDay();
        holder=HemiTimeMode.get()==='realtime'&&day!=null?{clock:Clock.normalize(saved,{time:{mode:'realtime'}},Clock.dateKey(day))}:null;
        controller.reset();
    }
    const origGet=window.getAppState;
    window.getAppState=function(){mirror();const s=origGet.apply(this,arguments);if(active()&&!loading)s.worldClock={...holder.clock};return s;};
    const origSet=window.setAppState;
    window.setAppState=function(s){let r;loading=true;try{r=origSet.apply(this,arguments);}finally{loading=false;}configure(s?.worldClock);return r;};
    window.advanceNationDate=function(){if(active()){window.showKbdToast?.('실시간 진행/일시정지로 시간을 조작하세요.');return false;}const r=origAdvance.apply(this,arguments);if(HemiTimeMode.get()==='realtime'&&!holder)configure();return r;};
    const origSettings=window.openSettingsPanel;
    if(origSettings)window.openSettingsPanel=function(){window.HemiCampaign?.pause();controller.pause('설정 · 일시정지');return origSettings.apply(this,arguments);};
    window.addEventListener('hemi-time-mode-changed',()=>configure(active()?.clock));
    window.addEventListener('hemi-campaign-changed',()=>{if(window.HemiCampaign?.state){holder=null;controller.reset();}else configure();});
    for(const id of ['nationDateYear','nationDateMonth','nationDateDay'])document.getElementById(id).addEventListener('change',()=>{if(!active())configure();});
    window.HemiWorldTime={get state(){return active()?.clock||null;},play:controller.play,pause:controller.pause,setSpeed:controller.speed};
    configure();
})();
