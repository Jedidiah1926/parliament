const {test}=require('node:test');
const assert=require('node:assert/strict');
const T=require('../js/campaign-tools.js');
const errors=d=>T.validate(d).filter(i=>i.level==='error');
test('starter is a playable campaign with exclusive routes and OR convergence',()=>{
 const d=T.starter('test');assert.deepEqual(errors(d),[]);
 assert.deepEqual(d.focus.find(f=>f.id==='future').any,['reform','authority']);
 assert.deepEqual(d.focus.find(f=>f.id==='dialogue').exclusive,['order']);
});
test('detects malformed imports, duplicate IDs, missing targets and closed cycles',()=>{
 for(const value of [null,[],{format:'hemicycle-campaign@1',id:'test',focus:[null]}])assert.ok(errors(value).length);
 const d=T.starter('test');d.focus[0].prereq=['future'];assert.ok(errors(d).some(i=>i.message.includes('도달')));
 d.focus[0].prereq=['missing'];assert.ok(errors(d).some(i=>i.message.includes('없는 방향성')));
 d.focus[0].prereq=[];d.focus[1].id='opening';assert.ok(errors(d).some(i=>i.message.includes('중복')));
});
test('OR cycle with a valid external entrance remains reachable',()=>{
 const d=T.starter('test');d.focus[0].any=['dialogue','order'];d.focus[2].prereq=[];assert.deepEqual(errors(d),[]);
});
test('mandatory joins cannot require both mutually exclusive branches',()=>{
 const d=T.starter('test');const f=d.focus.find(f=>f.id==='future');f.any=[];f.prereq=['reform','authority'];assert.ok(errors(d).some(i=>i.message.includes('함께 선택')));
});
test('renaming rewires graph and nested runtime flags without rewriting story text',()=>{
 const d=T.starter('test');d.description='focus_opening';assert.equal(T.renameFocus(d,'opening','intro'),true);
 assert.deepEqual(d.focus[1].prereq,['intro']);assert.equal(d.crises[0].trigger.flag,'focus_intro');assert.equal(d.description,'focus_opening');
 assert.equal(T.renameFocus(d,'intro','future'),false);assert.deepEqual(errors(d),[]);
});
test('layout leaves gameplay and custom fields intact and gives unique positions',()=>{
 const d=T.starter('test');const before=T.clone(d.focus);d.focus[0].extension={custom:42};T.layout(d.focus);
 assert.equal(new Set(d.focus.map(f=>`${f.x},${f.y}`)).size,d.focus.length);
 for(const f of d.focus){const prev=before.find(x=>x.id===f.id);assert.deepEqual(f.effects,prev.effects);assert.deepEqual(f.prereq,prev.prereq);assert.deepEqual(f.any,prev.any);}
 assert.deepEqual(d.focus[0].extension,{custom:42});assert.deepEqual(errors(d),[]);
});
test('invalid script lists and missing focus events fail validation',()=>{
 const d=T.starter('test');d.events[0].options={};assert.ok(errors(d).some(i=>i.path.endsWith('.options')));
 d.events=[];assert.ok(errors(d).some(i=>i.path.endsWith('.event')));
});
