// Run against python3 -m http.server 8000 from the repository root.
// Uses the environment's Playwright + Chromium, in a fresh browser context.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const base=process.env.STUDIO_TEST_URL||'http://127.0.0.1:8000';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true});
 try{
 const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});
 const page=await context.newPage(),errors=[];page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
 // External optional fonts aren't needed for functional tests.
 await context.route('https://fonts.googleapis.com/**',r=>r.abort());
 await page.goto(base+'/scenario.html');await page.waitForSelector('[data-starter]');
 await page.locator('[data-starter]').click();await page.waitForSelector('[data-node="opening"]');
 assert.equal(await page.locator('[data-node]').count(),6);
 await page.locator('[data-branch]').click();assert.equal(await page.locator('[data-node]').count(),8);
 await page.locator('[data-history="undo"]').click();assert.equal(await page.locator('[data-node]').count(),6);
 await page.locator('[data-history="redo"]').click();assert.equal(await page.locator('[data-node]').count(),8);
 await page.locator('[data-history="undo"]').click();
 console.log('PASS: template, mutually exclusive branch creation, undo/redo');
 // Forms write the same script data as JSON.
 await page.locator('[data-node="dialogue"]').click();
 await page.locator('[data-guide="focus.1.effects"] [data-gf="number"]').fill('-22');
 assert.equal(await page.evaluate(()=>HemiCampaignEditor.data.focus[1].effects[0].add_var.value),-22);
 await page.locator('[data-tab="crises"]').click();assert.ok(await page.locator('[data-guide]').count()>4);
 await page.locator('[data-tab="adv"]').click();
 assert.equal(await page.locator('[data-wholejson]').count(),0);
 await page.locator('[data-script-add="events"]').click();
 assert.equal(await page.locator('[data-script-field$=".title"]').count(),2);
 await page.locator('[data-script-field="events.1.title"]').fill('폼으로 쓴 이벤트');
 await page.locator('[data-option-add="events.1.options"]').click();
 assert.equal(await page.evaluate(()=>HemiCampaignEditor.data.events[1].options.length),2);
 console.log('PASS: beginner conditions/effects, crisis, event and option forms');
 // Explicit apply prevents invalid/unapplied JSON from replacing data or disappearing on navigation.
 await page.locator('#cpStudioBar [data-mode="json"]').click();
 const json=page.locator('[data-wholejson]');const original=await json.inputValue();
 await json.fill('{');await page.locator('[data-whole-apply]').click();
 assert.equal(await page.evaluate(()=>HemiCampaignEditor.data.title),'갈림길의 공화국');
 await page.locator('[data-tab="focus"]').click();assert.equal(await json.count(),1);
 await json.fill(JSON.stringify({format:'hemicycle-campaign@1',id:'bad',starts:[null]}));await page.locator('[data-whole-apply]').click();
 assert.equal(await page.evaluate(()=>HemiCampaignEditor.data.title),'갈림길의 공화국');
 await json.fill(original);await page.locator('[data-whole-apply]').click();
 await page.locator('[data-tab="focus"]').click();
 await page.locator('[data-node="opening"]').click();
 const nodeJson=page.locator('[data-objjson]');const f=JSON.parse(await nodeJson.inputValue());f.id='intro';f.extension={custom:'preserved'};
 await nodeJson.fill(JSON.stringify(f));await page.locator('[data-objapply]').click();
 assert.equal(await page.evaluate(()=>HemiCampaignEditor.data.crises[0].trigger.flag),'focus_intro');
 assert.deepEqual(await page.evaluate(()=>HemiCampaignEditor.data.focus[0].extension),{custom:'preserved'});
 console.log('PASS: JSON apply guard and focus rename including runtime flag references');
 await page.locator('[data-style-preset="dossier"]').click();
 await page.locator('[data-layout]').click();await page.locator('[data-fit]').click();
 assert.ok(parseInt(await page.locator('#cpZoomLabel').textContent())<=100);
 await page.locator('#cpFocusSearch').fill('내일');assert.equal(await page.locator('[data-node]:not(.cpe-search-dim)').count(),1);
 await page.locator('#cpFocusSearch').fill('');
 // Drag with zoom applied, then undo restores the original cell.
 const prior=await page.evaluate(()=>({...HemiCampaignEditor.data.focus[0]}));
 await page.locator('[data-zoom="in"]').click();
 await page.locator('[data-node="intro"]').scrollIntoViewIfNeeded();
 const bounds=await page.locator('[data-node="intro"]').boundingBox();const zoom=await page.locator('#cpeTree').evaluate(el=>new DOMMatrix(getComputedStyle(el).transform).a);
 await page.mouse.move(bounds.x+bounds.width/2,bounds.y+20);await page.mouse.down();await page.mouse.move(bounds.x+bounds.width/2+188*zoom,bounds.y+20,{steps:8});await page.mouse.up();
 assert.notEqual(await page.evaluate(()=>HemiCampaignEditor.data.focus[0].x),prior.x);
 await page.locator('[data-history="undo"]').click();assert.equal(await page.evaluate(()=>HemiCampaignEditor.data.focus[0].x),prior.x);
 await page.locator('#cpValidate').click();assert.match(await page.locator('#cpIssues').innerText(),/구조 검사 통과/);
 console.log('PASS: design, layout, fit, search and scaled drag');
 await page.locator('[data-tab="starts"]').click();await page.locator('[data-add-start]').click();await page.locator('[data-start] [data-sf="name"]').last().fill('두 번째 시작 나라');
 // Export + import round trip uses compressed campaign file, with all custom metadata intact.
 const downloadPromise=page.waitForEvent('download');await page.locator('#cpExport').click();const download=await downloadPromise;const file=await download.path();
 const saved=await page.evaluate(()=>JSON.parse(JSON.stringify(HemiCampaignEditor.data)));
 await page.evaluate(()=>{DnoUI.confirm=async()=>true;});
 await page.locator('#cpFile').setInputFiles(file);await page.waitForTimeout(300);
 assert.deepEqual(await page.evaluate(()=>HemiCampaignEditor.data),saved);
 await page.waitForFunction(()=>document.querySelector('#cpSaveStatus').textContent.includes('자동 저장됨'));
 await page.reload();await page.waitForFunction(()=>HemiCampaignEditor.data.focus[0].id==='intro');
 assert.deepEqual(await page.evaluate(()=>HemiCampaignEditor.data),saved);
 console.log('PASS: compressed export/import and IndexedDB reload retain data');
 await page.setViewportSize({width:390,height:844});await page.locator('#cpStudioBar [data-mode="form"]').click();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
 await page.setViewportSize({width:1440,height:1000});
 // Persist a challenge through the actual editor, including its builder condition format.
 await page.goto(base+'/challenge.html');await page.waitForFunction(()=>!!window.HemiChallengeEditor);
 await page.evaluate(()=>{const d=HemiChallengeEditor.data;d.title='UI test challenge';d.goals=[{id:'g1',text:'Keep support',kind:'approval',p:{of:'cabinet',op:'gte',n:40}}];});
 // The title input triggers the editor's own autosave.
 await page.locator('[data-f="title"]').fill('UI test challenge');await page.waitForTimeout(650);
 await page.goto(base+'/index.html');await page.evaluate(()=>openSaveSelectModal('stories'));
 await page.waitForSelector('#campaignSelectList [data-play]');await page.waitForSelector('#challengeSelectList [data-play]');
 assert.match(await page.locator('#challengeSelectList').innerText(),/UI test challenge/);
 await page.locator('#storySearch').fill('not found');await page.waitForFunction(()=>document.querySelector('#campaignSelectList').textContent.includes('검색 결과'));
 await page.locator('#storySearch').fill('');await page.waitForSelector('#campaignSelectList [data-play]');
 // Campaign launch from SAVE SELECT actually attaches to a new gameplay save.
 await page.locator('#campaignSelectList .story-library-card').filter({hasText:'갈림길의 공화국'}).locator('[data-play]').click();await page.waitForSelector('.story-start-dialog');await page.locator('.story-start-dialog [data-cancel]').click();assert.match(page.url(),/index.html/);await page.locator('#campaignSelectList .story-library-card').filter({hasText:'갈림길의 공화국'}).locator('[data-play]').click();await page.locator('.story-start-dialog [data-start="1"]').click();await page.waitForURL('**/main.html');
 await page.waitForFunction(()=>window.HemiCampaign?.state?.data.focus[0].id==='intro',{timeout:20000});
 assert.equal(await page.evaluate(()=>HemiCampaign.state.data.focusStyle.template.includes('dossier')),true);
 assert.equal(await page.evaluate(()=>HemiCampaign.state.startId),saved.starts[1].id);
 await page.locator('.cp-overlay .cp-primary').click();await page.evaluate(()=>HemiCampaign.showDisp());await page.locator('[data-tree-zoom="out"]').click();assert.match(await page.locator('#cpFocusTree').getAttribute('style'),/scale\(0.85\)/);await page.locator('[data-tree-fit]').click();
 await page.evaluate(()=>HemiCampaign.startFocus('intro'));
 assert.equal(await page.evaluate(()=>HemiCampaign.state.focus.cur.id),'intro');
 await page.evaluate(()=>{advanceNationDate(7,'day');});
 await page.waitForFunction(()=>!!HemiCampaign.state.focus.done.intro);
 assert.equal(await page.evaluate(()=>HemiCampaign.state.crises.unrest.status),'active');
 assert.equal(await page.evaluate(()=>getAppState().campaign.data.id),saved.id);
 await page.evaluate(()=>HemiCampaign.startFocus('dialogue'));
 await page.evaluate(()=>HemiCampaign.startFocus('order'));
 assert.equal(await page.evaluate(()=>HemiCampaign.state.focus.cur.id),'dialogue');
 console.log('PASS: SAVE SELECT campaign launch, focus completion, crisis trigger and exclusive route lock');
 await page.goto(base+'/index.html');await page.evaluate(()=>openSaveSelectModal('stories'));await page.waitForSelector('#challengeSelectList [data-play]');
 await page.locator('#challengeSelectList [data-play]').click();await page.waitForURL('**/main.html');
 await page.waitForFunction(()=>getAppState().challenge?.data?.title==='UI test challenge',{timeout:20000});
 assert.deepEqual(await page.evaluate(()=>getAppState().challenge.data.goals[0].condition),{approval:{of:'cabinet',gte:40}});
 assert.equal(await page.evaluate(()=>!!getAppState().campaign),false);
 console.log('PASS: SAVE SELECT challenge launch compiles form conditions and clears previous campaign boot');
 await page.goto(base+'/index.html');await page.evaluate(()=>openSaveSelectModal('stories'));await page.waitForSelector('#campaignSelectList [data-delete]');
 await page.evaluate(()=>{DnoUI.confirm=async()=>false;});await page.locator('#campaignSelectList .story-library-card').filter({hasText:'갈림길의 공화국'}).locator('[data-delete]').click();assert.equal(await page.locator('#campaignSelectList [data-play]').count(),2);
 await page.evaluate(()=>{DnoUI.confirm=async()=>true;});await page.locator('#campaignSelectList .story-library-card').filter({hasText:'갈림길의 공화국'}).locator('[data-delete]').click();await page.waitForFunction(()=>!document.querySelector('#campaignSelectList').textContent.includes('갈림길의 공화국'));await page.locator('#campaignSelectList [data-delete]').click();await page.waitForFunction(()=>document.querySelector('#campaignSelectList').textContent.includes('저장된 캠페인이 없습니다'));
 await page.locator('#challengeSelectList [data-delete]').click();await page.waitForFunction(()=>document.querySelector('#challengeSelectList').textContent.includes('저장된 챌린지가 없습니다'));
 await page.reload();await page.evaluate(()=>openSaveSelectModal('stories'));await page.waitForFunction(()=>document.querySelector('#campaignSelectList').textContent.includes('저장된 캠페인이 없습니다'));
 assert.equal(await page.evaluate(()=>loadSaveSlotsForMenu().length>=2),true);
 console.log('PASS: delete cancel/confirm, persistent deletion and independent play saves');
 assert.deepEqual(errors,[]);console.log('PASS: no uncaught browser errors');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
