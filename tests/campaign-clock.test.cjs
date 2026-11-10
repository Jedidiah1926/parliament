const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../js/campaign-clock.js'),Tools=require('../js/campaign-tools.js');
test('strict UTC calendar round trips leap days, year 1 and year end',()=>{
 for(const date of ['0001-01-01','0099-12-31','2000-02-29','2026-12-31','9999-12-31'])assert.equal(C.dayFromKey(C.dateKey(C.dayFromDate(date))),C.dayFromDate(date));
 for(const date of ['2026-02-29','2026-04-31','0000-01-01','2026-13-01','x'])assert.equal(C.dayFromDate(date),null);
});
test('turns advance exactly one day; realtime advances one hour across midnight',()=>{
 const clock=C.normalize(null,{time:{mode:'turn',startDate:'2026-12-31'}},null),next=C.advance(clock);
 assert.equal(next.turn,1);assert.equal(next.day-clock.day,1);assert.equal(C.dateKey(next.day),20270101);assert.equal(clock.turn,0);
 const rt=C.normalize(null,{time:{mode:'realtime',startDate:'2024-02-28',startHour:23}},null),midnight=C.advance(rt);
 assert.equal(C.dateKey(midnight.day),20240229);assert.equal(midnight.hour,0);assert.equal(midnight.turn,0);
 assert.equal(C.advance(C.normalize(null,{time:{mode:'turn',startDate:'9999-12-31'}},null)),null);
});
test('save migration retains dates and loads paused with authored mode and saved speed',()=>{
 const old=C.normalize(null,{},19831120);assert.equal(C.dateKey(old.day),19831120);assert.equal(old.mode,'turn');
 const clock=C.normalize({...old,hour:17,speed:4,turn:22,paused:false},{time:{mode:'realtime',startDate:'2000-01-01'}},20260101);
 assert.equal(clock.day,old.day);assert.equal(clock.paused,true);assert.equal(clock.hour,17);assert.equal(clock.speed,4);assert.equal(clock.turn,22);
 assert.equal(C.normalize(clock,{time:{mode:'turn'}},null).hour,0);
});
test('author validation accepts optional legacy settings and rejects invalid clock configuration',()=>{
 const data=Tools.starter('clock');assert.equal(Tools.validate(data).filter(i=>i.level==='error').length,0);
 delete data.time;assert.equal(Tools.validate(data).filter(i=>i.level==='error').length,0);
 data.time={mode:'skip',startDate:'2026-02-30',startHour:24,defaultSpeed:6};
 assert.deepEqual(Tools.validate(data).filter(i=>i.path.startsWith('time')).map(i=>i.path),['time.mode','time.startDate','time.startHour','time.defaultSpeed']);
});
