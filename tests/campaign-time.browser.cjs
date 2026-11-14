const {chromium}=require('playwright'),assert=require('node:assert/strict');
const base=process.env.STUDIO_TEST_URL||'http://127.0.0.1:8000';
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true});try{
 const context=await browser.newContext({viewport:{width:1440,height:1000}}),p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));p.setDefaultTimeout(15000);await context.route('https://fonts.googleapis.com/**',r=>r.abort());
 await p.goto(base+'/scenario.html');await p.waitForFunction(()=>!!window.HemiCampaignEditor);
 assert.equal(await p.locator('a[href="challenge.html"]').count(),0);
 assert.match(await p.locator('#cpTabs').innerText(),/격변/);assert.match(await p.title(),/Scenario/);
 await p.locator('[data-time="mode"]').selectOption('realtime');await p.locator('[data-time="startDate"]').fill('2026-01-01');await p.locator('[data-time="startDate"]').blur();await p.locator('[data-time="startHour"]').fill('23');await p.locator('[data-time="startHour"]').blur();await p.locator('[data-time="defaultSpeed"]').selectOption('3');
 assert.deepEqual(await p.evaluate(()=>HemiCampaignEditor.data.time),{mode:'realtime',startDate:'2026-01-01',startHour:23,defaultSpeed:3});
 await p.locator('[data-time="mode"]').selectOption('turn');assert.equal(await p.locator('[data-time="startHour"]').count(),0);
 await p.locator('[data-tab="events"]').click();await p.locator('[data-script-add="events"]').click();
 await p.locator('[data-script-field="events.0.title"]').fill('협상가');await p.locator('[data-script-field="events.0.desc"]').fill('첫 문단.\n\n<script>window.eventUnsafe=true</script>');
 const png=await p.evaluate(()=>{const c=document.createElement('canvas');c.width=200;c.height=150;c.getContext('2d').fillRect(0,0,200,150);return c.toDataURL().split(',')[1];});
 await p.locator('[data-event-image]').setInputFiles({name:'portrait.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});await p.waitForFunction(()=>!!HemiCampaignEditor.data.events[0].image);
 await p.locator('[data-event-preview]').click();assert.equal(await p.locator('.sm-narrative').count(),1);assert.equal(await p.locator('.ce-portrait').count(),1);assert.match(await p.locator('.sm-ev-desc').innerText(),/<script>/);assert.equal(await p.evaluate(()=>!!window.eventUnsafe),false);await p.keyboard.press('Escape');assert.equal(await p.locator('.sm-overlay').count(),0);
 console.log('PASS: author chooses clock mode/start, dedicated event forms, image upload and safe preview');
 // Launch authored turn mode. No crises are required for a choice event.
 await p.evaluate(()=>{const d=HemiCampaignEditor.data;d.time={mode:'turn',startDate:'2026-01-01'};d.focus[0].days=2;d.crises=[];d.endings=[];d.articles=[];d.variables={negotiation:0};d.events=[{id:'talk',title:'협상가',desc:'긴 이야기\n\n선택하십시오.',trigger:{date_after:'2026-01-02'},immediate:[{add_var:{name:'negotiation',value:1}}],options:[{text:'자리에 앉는다',effects:[{add_var:{name:'negotiation',value:5}},{set_flag:'sat_down'}]},{text:'숨긴 선택',trigger:{flag:'never'},effects:[{set_flag:'bad'}]}]}];});
 await p.locator('#cpPlay').click();await p.waitForURL('**/main.html');await p.waitForFunction(()=>!!window.HemiCampaign?.state);await p.locator('.cp-overlay .cp-primary').click();
 const initial=await p.evaluate(()=>getAppState());assert.equal(initial.campaign.clock.mode,'turn');assert.equal(await p.locator('#nationDateYear').isDisabled(),true);
 await p.evaluate(()=>{HemiCampaign.startFocus('f1');advanceNationDate(7,'day');advanceNationDate(1,'month');});
 assert.equal(await p.evaluate(()=>HemiCampaign.state.clock.day),initial.campaign.clock.day);
 await p.locator('#mainContentCampaign [data-campaign-next-turn]').click();await p.waitForSelector('.sm-narrative');assert.equal(await p.locator('.sm-ev-opt').count(),1);
 assert.equal(await p.evaluate(()=>HemiCampaign.state.clock.turn),1);assert.equal(await p.evaluate(()=>HemiScriptMods.vars('campaign.'+HemiCampaign.state.data.id).negotiation),1);
 assert.equal(await p.evaluate(()=>HemiCampaign.nextTurn()),false);assert.equal(await p.evaluate(()=>HemiCampaign.state.clock.turn),1);
 await p.keyboard.press('Escape');assert.equal(await p.locator('.sm-overlay').count(),1);
 // Saving in the event and restoring must not replay its immediate effects.
 await p.evaluate(()=>setAppState(getAppState()));await p.waitForSelector('.sm-narrative');
 assert.equal(await p.evaluate(()=>HemiScriptMods.vars('campaign.'+HemiCampaign.state.data.id).negotiation),1);
 await p.locator('.sm-ev-opt').click();assert.equal(await p.evaluate(()=>HemiScriptMods.vars('campaign.'+HemiCampaign.state.data.id).negotiation),6);
 await p.locator('#mainContentCampaign [data-campaign-next-turn]').click();assert.equal(await p.evaluate(()=>HemiCampaign.state.clock.turn),2);assert.ok(await p.evaluate(()=>HemiCampaign.state.focus.done.f1));
 const current=await p.evaluate(()=>getAppState());assert.equal(current.campaign.clock.day-initial.campaign.clock.day,2);
 console.log('PASS: one turn only, legacy bulk blocked, conditional narrative choice, queued save/load, effects once and direction completion');
 // Old campaign saves acquire a clock without losing partial progress.
 await p.evaluate(()=>{const s=getAppState();delete s.campaign.clock;s.campaign.focus={cur:{id:'f1',started:HemiCampaignClock.dayFromDate('2026-01-02'),days:2},done:{}};setAppState(s);});
 assert.equal(await p.evaluate(()=>HemiCampaign.state.clock.day),current.campaign.clock.day);assert.equal(await p.evaluate(()=>HemiCampaign.state.focus.cur.started),current.campaign.clock.day-1);
 // Realtime starts at 23:00; midnight runs the normal day systems and date conditions once.
 await p.evaluate(()=>{const s=getAppState();s.campaign.data.time={mode:'realtime',startDate:'2026-01-03',startHour:23,defaultSpeed:1};delete s.campaign.clock;s.campaign.data.events=[];s.campaign.data.articles=[{id:'midnight',title:'한밤의 소식',body:'멈추고 읽으세요',when:'date',date:'2026-01-04'}];s.campaign.articles={published:{},queue:[]};s.campaign.focus={cur:null,done:{}};setAppState(s);});
 assert.equal(await p.evaluate(()=>HemiCampaign.state.clock.paused),true);assert.equal(await p.evaluate(()=>HemiCampaign.state.clock.hour),23);
 await p.clock.install();await p.clock.pauseAt(new Date());
 await p.evaluate(()=>HemiCampaign.play());await p.clock.runFor(1999);assert.equal(await p.evaluate(()=>HemiCampaign.state.clock.hour),23);
 await p.clock.runFor(50);await p.waitForSelector('.ca-overlay');assert.equal(await p.evaluate(()=>HemiCampaignClock.dateKey(HemiCampaign.state.clock.day)),20260104);assert.equal(await p.evaluate(()=>HemiCampaign.state.clock.hour),0);assert.equal(await p.evaluate(()=>HemiCampaign.state.clock.paused),true);
 await p.locator('.ca-confirm').click();await p.clock.runFor(10000);assert.equal(await p.evaluate(()=>HemiCampaign.state.clock.hour),0);
 await p.evaluate(()=>HemiCampaign.setSpeed(5));await p.keyboard.press('Space');await p.clock.runFor(300);assert.equal(await p.evaluate(()=>HemiCampaign.state.clock.hour),3);await p.keyboard.press('Space');await p.clock.runFor(1000);assert.equal(await p.evaluate(()=>HemiCampaign.state.clock.hour),3);
 await p.evaluate(()=>{HemiCampaign.play();setAppState(getAppState());});assert.equal(await p.evaluate(()=>HemiCampaign.state.clock.paused),true);await p.clock.runFor(5000);assert.equal(await p.evaluate(()=>HemiCampaign.state.clock.hour),3);
 assert.equal(await p.evaluate(()=>HemiCampaign.state.clock.speed),5);
 // The independent clock wins over the general editable fields.
 await p.evaluate(()=>{document.getElementById('nationDateYear').value='2999';updateDispInfoBar();});assert.match(await p.locator('#dispInfoDate').innerText(),/2026/);
 console.log('PASS: real-time hourly pacing, midnight/date article, auto pause, Space, speeds and paused reload with no wall-clock catchup');
 // Live narrative events pause as well, and do not resume themselves on a choice.
 await p.evaluate(()=>{const s=getAppState();s.campaign.data.events=[{id:'instant',title:'협상가',presentation:'narrative',trigger_only:true,options:[{text:'수락',effects:[{set_flag:'accepted'}]},{text:'거절',effects:[]}]}];setAppState(s);HemiCampaign.play();HemiScriptMods.fire('campaign.'+HemiCampaign.state.data.id,'instant');});
 await p.waitForSelector('.sm-narrative');assert.equal(await p.evaluate(()=>HemiCampaign.state.clock.paused),true);
 for(const mode of ['tno','light','dark']){await p.evaluate(m=>setThemeMode(m),mode);await p.setViewportSize({width:390,height:844});assert.equal(await p.locator('.sm-event').evaluate(el=>el.scrollWidth<=el.clientWidth+1),true);await p.setViewportSize({width:1440,height:1000});}
 await p.locator('.sm-ev-opt').first().click();await p.clock.runFor(1000);assert.equal(await p.evaluate(()=>HemiCampaign.state.clock.hour),3);
 // Switching away removes the timer and restores editable ordinary dates.
 await p.evaluate(()=>{HemiCampaign.play();const s=getAppState();delete s.campaign;setAppState(s);});await p.clock.runFor(1000);assert.equal(await p.evaluate(()=>HemiCampaign.state),null);assert.equal(await p.locator('#nationDateYear').isDisabled(),false);
 const day=await p.locator('#nationDateDay').inputValue();await p.evaluate(()=>advanceNationDate(7,'day'));assert.equal(+await p.locator('#nationDateDay').inputValue(),+day+7);
 await p.goto(base+'/challenge.html');await p.waitForFunction(()=>!!window.HemiChallengeEditor);assert.equal(await p.locator('a[href="scenario.html"]').count(),0);
 await p.goto(base+'/index.html');assert.match(await p.locator('#homeVersion').innerText(),new RegExp('v'+require('../package.json').version.replace(/\./g,'\\.')+' · v0\\.\\d+\\.\\d+'));
 assert.deepEqual(errors,[]);console.log('PASS: choice event pause, themes/mobile, normal save date controls and timer cleanup, removed maker links, paired version; no browser errors');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
