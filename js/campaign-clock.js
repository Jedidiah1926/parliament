// Calendar math for the campaign-owned clock. No wall clock or DOM dependency.
(function (root) {
    'use strict';
    const SPEED_MS = {1:2000,2:1000,3:500,4:250,5:100};
    const DAY_MS = 86400000;
    function dayFromDate(text) {
        const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(text||''));if(!m)return null;
        const y=+m[1],month=+m[2],day=+m[3];if(y<1||y>9999)return null;
        const date=new Date(0);date.setUTCHours(0,0,0,0);date.setUTCFullYear(y,month-1,day);
        return date.getUTCFullYear()===y&&date.getUTCMonth()===month-1&&date.getUTCDate()===day?date.getTime()/DAY_MS:null;
    }
    function parts(day) {const d=new Date(day*DAY_MS);return {y:d.getUTCFullYear(),m:d.getUTCMonth()+1,d:d.getUTCDate()};}
    function dateKey(day) {const p=parts(day);return p.y*10000+p.m*100+p.d;}
    function dayFromKey(key) {if(!Number.isFinite(key))return null;return dayFromDate(`${String(Math.floor(key/10000)).padStart(4,'0')}-${String(Math.floor(key/100)%100).padStart(2,'0')}-${String(key%100).padStart(2,'0')}`);}
    function config(data) {
        const t=data?.time||{};
        return {mode:t.mode==='realtime'?'realtime':'turn',startDate:t.startDate||'',startHour:Number.isInteger(t.startHour)&&t.startHour>=0&&t.startHour<=23?t.startHour:0,defaultSpeed:Object.hasOwn(SPEED_MS,t.defaultSpeed)?Number(t.defaultSpeed):1};
    }
    function normalize(value, data, worldDate) {
        const cfg=config(data),s=value&&typeof value==='object'?value:{};
        const day=Number.isInteger(s.day)&&dateKey(s.day)>=10101&&dateKey(s.day)<=99991231?s.day:dayFromDate(cfg.startDate)??dayFromKey(worldDate)??dayFromDate('2000-01-01');
        return {mode:cfg.mode,day,hour:cfg.mode==='turn'?0:Number.isInteger(s.hour)&&s.hour>=0&&s.hour<24?s.hour:cfg.startHour,
            turn:Number.isSafeInteger(s.turn)&&s.turn>=0?s.turn:0,paused:true,speed:Object.hasOwn(SPEED_MS,s.speed)?Number(s.speed):cfg.defaultSpeed};
    }
    function advance(clock) {
        const next={...clock};
        if(next.mode==='turn'){next.day++;next.turn++;next.hour=0;}
        else {next.hour++;if(next.hour===24){next.hour=0;next.day++;}}
        if(dateKey(next.day)>99991231)return null;
        return next;
    }
    function label(clock) {const p=parts(clock.day);return `${p.y}년 ${p.m}월 ${p.d}일`+(clock.mode==='realtime'?` ${String(clock.hour).padStart(2,'0')}:00`:` · 제${clock.turn+1}턴`);}
    const api={SPEED_MS,dayFromDate,dayFromKey,dateKey,parts,config,normalize,advance,label};
    if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.HemiCampaignClock=api;
})(typeof window==='undefined'?globalThis:window);
