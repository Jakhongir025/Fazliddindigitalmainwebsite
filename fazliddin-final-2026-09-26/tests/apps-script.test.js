'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const crypto=require('node:crypto');
function harness(){
 const rows=[];let sends=0,telegramOK=true;
 const secret='s'.repeat(40),props={APPS_SCRIPT_SECRET:secret,SPREADSHEET_ID:'test-sheet',TELEGRAM_BOT_TOKEN:'test-bot',TELEGRAM_CHAT_IDS:'1,2'};
 const sheet={getLastRow:()=>rows.length,appendRow:r=>rows.push(r),setFrozenRows:()=>{},getRange:(row,col)=>({
  setNumberFormat(){return this;},setValues(v){rows[row-1]=v[0];return this;},setValue(v){rows[row-1][col-1]=v;return this;},getValue(){return rows[row-1][col-1];},
  createTextFinder(id){return {matchEntireCell(){return this;},findNext(){const index=rows.findIndex((r,i)=>i>0&&r[0]===id);return index<0?null:{getRow:()=>index+1};}};}
 })};
 const box={Date,JSON,Math,Error,ContentService:{MimeType:{JSON:'json'},createTextOutput:text=>({setMimeType:()=>JSON.parse(text)})},PropertiesService:{getScriptProperties:()=>({getProperty:k=>props[k]})},Utilities:{Charset:{UTF_8:'utf8'},DigestAlgorithm:{SHA_256:'sha256'},computeHmacSha256Signature:(s,k)=>[...crypto.createHmac('sha256',k).update(s).digest()],computeDigest:(_,s)=>[...crypto.createHash('sha256').update(s).digest()]},LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock:()=>{}})},SpreadsheetApp:{openById:()=>({getSheetByName:()=>sheet}),flush:()=>{}},UrlFetchApp:{fetch:()=>{sends++;return {getResponseCode:()=>telegramOK?200:500,getContentText:()=>JSON.stringify({ok:telegramOK})};}}};
 vm.createContext(box);vm.runInContext(fs.readFileSync(path.join(__dirname,'../google-apps-script/Code.gs'),'utf8'),box);
 const lead={requestId:'12345678-1234-4234-8234-123456789abc',name:'=IMPORTXML("x")',phone:'@example_user',service:'targeting',plan:'business',business:'education',message:'=1+1',website:'',lang:'ky'};
 function envelope(d=lead,t=Date.now()){const payload=JSON.stringify(d),timestamp=String(t),signature=crypto.createHmac('sha256',secret).update(timestamp+'.'+payload).digest('hex');return {postData:{contents:JSON.stringify({payload,timestamp,signature})}};}
 return {box,rows,envelope,lead,props,sends:()=>sends,failTelegram:()=>{telegramOK=false;}};
}
test('valid request saves literal cells, sends separately and duplicate does not resend',()=>{
 const h=harness(),r=h.box.doPost(h.envelope());assert.equal(r.ok,true);assert.equal(h.rows.length,2);assert.ok(h.rows[1][2].startsWith("'="));assert.ok(h.rows[1][6].startsWith("'="));assert.equal(h.sends(),2);assert.equal(h.rows[1][10],'business');
 assert.equal(h.box.doPost(h.envelope()).duplicate,true);assert.equal(h.rows.length,2);assert.equal(h.sends(),2);
 assert.equal(h.box.doPost(h.envelope({...h.lead,message:'changed'})).ok,false);
});
test('forged and expired envelopes cannot store or notify',()=>{
 const h=harness(),forged=h.envelope();let data=JSON.parse(forged.postData.contents);data.signature='0'.repeat(64);forged.postData.contents=JSON.stringify(data);
 assert.equal(h.box.doPost(forged).ok,false);assert.equal(h.box.doPost(h.envelope(h.lead,Date.now()-600000)).ok,false);assert.equal(h.rows.length,0);assert.equal(h.sends(),0);
});
test('Telegram failure keeps stored lead and marks failure',()=>{
 const h=harness();h.failTelegram();assert.equal(h.box.doPost(h.envelope()).ok,true);assert.equal(h.rows.length,2);assert.match(h.rows[1][8],/failed/);
});

test('private code configuration works without Script Properties',()=>{
 const h=harness();h.box.PRIVATE_SETTINGS=h.props;
 h.box.PropertiesService={getScriptProperties:()=>({getProperty:()=>null})};
 assert.equal(h.box.doPost(h.envelope()).ok,true);assert.equal(h.rows.length,2);assert.equal(h.sends(),2);
});
