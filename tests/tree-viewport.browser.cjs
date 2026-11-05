const {chromium}=require('playwright'),assert=require('node:assert/strict');
const base=process.env.STUDIO_TEST_URL||'http://127.0.0.1:8000';
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true});try{
 const context=await browser.newContext({viewport:{width:1440,height:1000}}),p=await context.newPage(),errors=[];p.setDefaultTimeout(15000);p.on('pageerror',e=>errors.push(e.message));await context.route('https://fonts.googleapis.com/**',r=>r.abort());
 await p.goto(base+'/scenario.html');await p.waitForFunction(()=>!!window.HemiCampaignEditor);
 await p.evaluate(()=>{const d=HemiCampaignTools.starter('camera-test');d.articles=[];d.crises=[];d.endings=[];HemiCampaignEditor.data=d;HemiCampaignEditor.setTab('focus');});
 const data=await p.evaluate(()=>HemiCampaignEditor.data);
 async function camera(selector,treeSelector){
  const wrap=p.locator(selector),tree=p.locator(treeSelector);
  await wrap.scrollIntoViewIfNeeded();
  await wrap.evaluate(el=>{el.scrollLeft=300;el.scrollTop=200;});
  const rect=await wrap.boundingBox(),point={x:200,y:140};
  const snapshot=()=>wrap.evaluate(el=>({left:el.scrollLeft,top:el.scrollTop,zoom:new DOMMatrix(getComputedStyle(el.querySelector('.cpe-tree,.cp-tree')).transform).a,pageY:scrollY}));
  const before=await snapshot();await p.mouse.move(rect.x+point.x+1,rect.y+point.y+1);await p.mouse.wheel(0,-200);
  await p.waitForFunction(([selector,zoom])=>new DOMMatrix(getComputedStyle(document.querySelector(selector).querySelector('.cpe-tree,.cp-tree')).transform).a>zoom,[selector,before.zoom]);
  const after=await snapshot();assert.ok(after.zoom>before.zoom);
  assert.ok(Math.abs((before.left+point.x)/before.zoom-(after.left+point.x)/after.zoom)<1);
  assert.ok(Math.abs((before.top+point.y)/before.zoom-(after.top+point.y)/after.zoom)<1);
  assert.equal(after.pageY,before.pageY);
  await p.mouse.wheel(0,150);await p.waitForFunction(([selector,zoom])=>new DOMMatrix(getComputedStyle(document.querySelector(selector).querySelector('.cpe-tree,.cp-tree')).transform).a<zoom,[selector,after.zoom]);
  // Middle drag works directly over a direction, without moving or selecting it.
  await wrap.evaluate(el=>{el.scrollLeft=0;el.scrollTop=0;});
  const node=tree.locator('[data-node="opening"]');await node.scrollIntoViewIfNeeded();
  const n=await node.boundingBox(),start={x:n.x+n.width/2,y:n.y+n.height/2};const prePan=await snapshot();
  const selected=await tree.locator('.sel').count();await p.mouse.move(start.x,start.y);await p.mouse.down({button:'middle'});await p.mouse.move(start.x-80,start.y-65,{steps:8});await p.mouse.up({button:'middle'});
  const pan=await snapshot();assert.ok(pan.left>prePan.left+60);assert.ok(pan.top>prePan.top+50);assert.equal(await tree.locator('.sel').count(),selected);
  assert.equal(await wrap.evaluate(el=>el.classList.contains('panning')),false);
  // Native autoscroll/new-tab action is explicitly cancelled for middle clicks.
  assert.equal(await wrap.evaluate(el=>el.dispatchEvent(new MouseEvent('auxclick',{button:1,bubbles:true,cancelable:true}))),false);
  for(const mode of ['tno','light','dark']){await p.evaluate(m=>setThemeMode(m),mode);assert.equal(await wrap.evaluate(el=>getComputedStyle(el).scrollbarWidth),'none');assert.equal(await wrap.evaluate(el=>getComputedStyle(el,'::-webkit-scrollbar').display),'none');}
  // Zooming way out also shrinks the true scroll surface, not just its painting.
  await wrap.evaluate(el=>{const r=el.getBoundingClientRect();el.dispatchEvent(new WheelEvent('wheel',{deltaY:100000,clientX:r.x+100,clientY:r.y+100,bubbles:true,cancelable:true}));});
  const small=await wrap.evaluate(el=>({width:el.scrollWidth,visibleWidth:el.clientWidth,height:el.scrollHeight,visibleHeight:el.clientHeight}));assert.ok(small.width<=small.visibleWidth+1);assert.ok(small.height<=small.visibleHeight+1);
  await wrap.focus();await p.keyboard.press('0');const fit=await snapshot();assert.ok(fit.zoom<=1&&fit.zoom>=.1);await p.keyboard.press('+');assert.ok((await snapshot()).zoom>fit.zoom);
  return snapshot;
 }
 await camera('.cpe-tree-wrap','#cpeTree');assert.deepEqual(await p.evaluate(()=>HemiCampaignEditor.data),data);
 // Left-button node dragging still snaps to the grid after wheel zooming.
 const tree=p.locator('#cpeTree'),node=tree.locator('[data-node="opening"]');await node.scrollIntoViewIfNeeded();const box=await node.boundingBox();const z=await tree.evaluate(el=>new DOMMatrix(getComputedStyle(el).transform).a);
 await p.mouse.move(box.x+box.width/2,box.y+box.height/2);await p.mouse.down();await p.mouse.move(box.x+box.width/2+272*z,box.y+box.height/2,{steps:8});await p.mouse.up();assert.equal(await p.evaluate(()=>HemiCampaignEditor.data.focus[0].x),3);
 console.log('PASS: editor wheel anchor, middle pan over nodes, hidden scrollbars, true zoom bounds, keyboard and scaled node drag');
 await p.evaluate(d=>HemiCampaignEditor.data=d,data);await p.locator('#cpPlay').click();await p.waitForURL('**/main.html');await p.waitForFunction(()=>!!window.HemiCampaign?.state);await p.locator('.cp-overlay .cp-primary').click();await p.evaluate(()=>HemiCampaign.showDisp());await p.waitForSelector('#cpFocusTree');
 const saved=await p.evaluate(()=>JSON.stringify(HemiCampaign.state.focus));await camera('.cp-tree-wrap','#cpFocusTree');assert.equal(await p.evaluate(()=>JSON.stringify(HemiCampaign.state.focus)),saved);
 // Refreshing and switching runtime views retain one working camera and no stale pan.
 const zoom=await p.locator('#cpFocusTree').evaluate(el=>new DOMMatrix(getComputedStyle(el).transform).a);await p.evaluate(()=>HemiCampaign.tick());assert.equal(await p.locator('#cpFocusTree').evaluate(el=>new DOMMatrix(getComputedStyle(el).transform).a),zoom);
 await p.locator('[data-view="articles"]').click();await p.locator('[data-view="focus"]').click();await p.waitForSelector('#cpFocusTree');await p.locator('[data-tree-zoom="out"]').click();assert.ok(await p.locator('#cpFocusTree').evaluate(el=>new DOMMatrix(getComputedStyle(el).transform).a)<zoom);
 assert.deepEqual(errors,[]);console.log('PASS: runtime camera matches editor, does not choose directions, survives refresh/view changes, no browser errors');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
