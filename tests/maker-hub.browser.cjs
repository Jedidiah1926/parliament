// Requires a local static server at STUDIO_TEST_URL and the environment's Playwright.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const base=process.env.STUDIO_TEST_URL||'http://127.0.0.1:8000';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true});
 try{
 const context=await browser.newContext({viewport:{width:1400,height:1000}}),page=await context.newPage(),errors=[];
 page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
 await context.route('https://fonts.googleapis.com/**',r=>r.abort());
 await page.goto(base+'/index.html');assert.equal(await page.locator('#homeMakerHub').getAttribute('href'),'maker.html');assert.match(await page.locator('.home-menu-primary').innerText(),/세이브 허브/);
 await page.locator('#homeMakerHub').click();await page.waitForSelector('.maker-empty');
 assert.equal(await page.locator('[data-new]').count(),3);assert.match(await page.locator('#makerStatus').innerText(),/0개/);
 console.log('PASS: home has separate save and maker hubs, with all three maker entry points');
 await page.locator('[data-new="map"]').click();
 const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100"><g transform="translate(1 2)"><path id="a" d="M0 0H40V80H0ZM50 0H90V80H50Z" fill="red"/><path id="b" d="M100 0H190V80H100Z" fill="blue"/></g></svg>';
 await page.locator('#fileInput').setInputFiles({name:'test-map.svg',mimeType:'image/svg+xml',buffer:Buffer.from(svg)});
 await page.waitForSelector('#elementsList .item');
 await page.locator('#mapProjectTitle').fill('서울 지역구');
 await page.locator('#elementsList .item>input[type="text"]').first().fill('지역 갑');
 await page.locator('.mm-abbr').first().fill('갑');await page.locator('.mm-seats').first().fill('3');await page.locator('.mm-pop').first().fill('240000');
 await page.locator('#mapMakerBack').click();await page.waitForSelector('.maker-project[data-kind="map"]');
 assert.match(await page.locator('.maker-project').innerText(),/서울 지역구/);
 await page.locator('.maker-project [data-edit]').click();await page.waitForFunction(()=>document.querySelector('#mapSaveStatus').textContent.includes('불러옴'));
 assert.equal(await page.locator('#elementsList .item>input[type="text"]').first().inputValue(),'지역 갑');assert.equal(await page.locator('.mm-abbr').first().inputValue(),'갑');assert.equal(await page.locator('.mm-seats').first().inputValue(),'3');assert.equal(await page.locator('.mm-pop').first().inputValue(),'240000');
 assert.equal(await page.locator('#svgContainer g').getAttribute('transform'),'translate(1 2)');
 await page.locator('.mm-cut').first().click();assert.equal(await page.locator('#elementsList .item').count(),3);
 await page.locator('#btnSaveProject').click();await page.waitForFunction(()=>document.querySelector('#mapSaveStatus').textContent.includes('저장됨'));
 const mapId=await page.evaluate(()=>HemiMapProjects.id);await page.reload();await page.waitForFunction(()=>document.querySelector('#mapSaveStatus').textContent.includes('불러옴'));
 assert.equal(await page.locator('#elementsList .item').count(),3);assert.equal(await page.locator('.mm-seats').first().inputValue(),'3');
 console.log('PASS: immediate hub return saves map names/metadata/transform; split geometry survives reload');
 // Ensure the project stores the extras from an imported .hemimap, not just SVG shapes.
 await page.evaluate(()=>{loadedPreset={format:'hemicycle-districts',district:{seatCounts:{a:{house:3,senate:2,third:1}},svgSplit:{senate:true},svgMaps:{senate:{custom:true}}},regions:{regions:{house:[{id:'r',name:'수도권'}],senate:[],third:[]},districtRegionMap:{house:{a:'r'},senate:{},third:{}}}};});
 await page.locator('#btnSaveProject').click();await page.waitForFunction(()=>document.querySelector('#mapSaveStatus').textContent.includes('저장됨'));await page.reload();await page.waitForFunction(()=>document.querySelector('#mapSaveStatus').textContent.includes('불러옴'));
 assert.equal(await page.evaluate(()=>loadedPreset.district.seatCounts.a.senate),2);assert.equal(await page.evaluate(()=>loadedPreset.regions.regions.house[0].name),'수도권');
 // A reset starts another draft, retaining the saved project in the hub.
 await page.locator('#btnClear').click();await page.locator('#mapMakerBack').click();await page.waitForSelector('[data-kind="map"]');
 assert.match(await page.locator('.maker-project').innerText(),/서울 지역구/);
 await page.locator('[data-new="campaign"]').click();await page.waitForSelector('[data-starter]');
 await page.locator('[data-f="title"]').fill('허브 캠페인');await page.locator('a.scn-back').click();await page.waitForSelector('[data-kind="campaign"]');
 await page.locator('[data-new="challenge"]').click();await page.waitForFunction(()=>!!window.HemiChallengeEditor);await page.locator('[data-f="title"]').fill('허브 챌린지');await page.locator('a.scn-back').first().click();await page.waitForSelector('[data-kind="challenge"]');
 assert.equal(await page.locator('.maker-project').count(),3);
 console.log('PASS: map extras retained; clear preserves stored project; campaign/challenge use existing maker stores');
 await page.locator('[data-filter="map"]').click();assert.equal(await page.locator('.maker-project').count(),1);await page.locator('[data-filter="all"]').click();
 await page.locator('#makerSearch').fill('챌린지');assert.equal(await page.locator('.maker-project').count(),1);await page.locator('#makerSearch').fill('');
 const campaign=page.locator('[data-kind="campaign"]');await campaign.locator('[data-edit]').click();await page.waitForFunction(()=>document.querySelector('[data-f="title"]')?.value==='허브 캠페인');await page.locator('a.scn-back').click();await page.waitForSelector('[data-kind="campaign"]');
 await page.locator('[data-new="campaign"]').click();await page.waitForFunction(()=>document.querySelector('[data-f="title"]')?.value==='새 캠페인');await page.waitForFunction(()=>location.search.includes('item='));const newUrl=page.url();await page.reload();await page.waitForSelector('[data-f="title"]');assert.equal(page.url(),newUrl);await page.locator('a.scn-back').click();await page.waitForFunction(()=>document.querySelectorAll('[data-kind="campaign"]').length===2);
 console.log('PASS: search/filter, exact project editing and new project generation without overwriting');
 // Theme switching must keep the established square neon header and modern variants.
 for(const mode of ['tno','light','dark']){await page.evaluate(m=>setThemeMode(m),mode);const radius=await page.locator('.scn-frame').evaluate(el=>getComputedStyle(el).borderRadius);assert.equal(radius==='0px',mode==='tno');await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);await page.setViewportSize({width:1400,height:1000});}
 await page.evaluate(()=>{DnoUI.confirm=async()=>false;});await page.locator('[data-kind="map"] [data-delete]').click();assert.equal(await page.locator('[data-kind="map"]').count(),1);
 await page.evaluate(()=>{DnoUI.confirm=async()=>true;localStorage.setItem('dnoParliamentSaveSlots',JSON.stringify([{id:'existing-play',name:'Existing game',state:{}}]));});await page.locator('[data-kind="map"] [data-delete]').click();await page.waitForFunction(()=>!document.querySelector('[data-kind="map"]'));
 await page.reload();await page.waitForSelector('[data-kind="campaign"]');assert.equal(await page.locator('[data-kind="map"]').count(),0);assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('dnoParliamentSaveSlots'))[0].id),'existing-play');
 console.log('PASS: all themes/mobile, delete cancellation and persistent deletion without touching play saves');
 await page.goto(base+'/index.html#saves');await page.waitForSelector('#saveSelectOverlay:visible');assert.match(await page.locator('.save-select-head').innerText(),/SAVE HUB/);await page.locator('[data-ss-tab="stories"]').click();await page.waitForSelector('#campaignSelectList [data-play]');assert.equal(await page.locator('#challengeSelectList [data-play]').count(),1);
 // Demo keeps access to the hub while disabling only map creation/editing.
 await page.addInitScript(()=>{window.HEMI_BUILD={demo:true};});await page.goto(base+'/maker.html');await page.waitForSelector('[data-new="map"][aria-disabled="true"]');assert.equal(await page.locator('[data-new="map"]').getAttribute('href'),null);assert.equal(await page.locator('[data-new="campaign"]').getAttribute('href'),'scenario.html?new=1');
 assert.deepEqual(errors,[]);console.log('PASS: save hub still lists playable stories; demo restriction preserved; no browser errors');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
