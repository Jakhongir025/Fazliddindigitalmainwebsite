'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const crypto=require('node:crypto');
function harness(){
 const rows=[];let sends=0,telegramOK=true;
 const secret='s'.repeat(40),props={APPS_SCRIPT_SECRET:secret,SPREADSHEET_ID:'test-sheet',TELEGRAM_BOT_TOKEN:'test-bot',TELEGRAM_CHAT_IDS:'1,2'};
 const sheets={};
 function makeSheet(name,data=[]){
  let filter=null,max=1000;
  const sheet={rows:data,getLastRow:()=>data.length,appendRow:r=>data.push(r),setFrozenRows:()=>{},setColumnWidths:()=>{},setColumnWidth:()=>{},getMaxRows:()=>max,insertRowsAfter:(_,n)=>max+=n,getFilter:()=>filter,getRange:(row,col,n=1)=>({
   setNumberFormat(){return this;},setFontWeight(){return this;},setBackground(){return this;},setFontColor(){return this;},setWrap(){return this;},setVerticalAlignment(){return this;},
   setValues(v){data[row-1]=v[0];return this;},setValue(v){data[row-1][col-1]=v;return this;},getValue(){return data[row-1][col-1];},
   createFilter(){filter={getRange:()=>({getNumRows:()=>n}),getColumnFilterCriteria:()=>null,setColumnFilterCriteria:()=>{},remove:()=>filter=null};return filter;},
   createTextFinder(id){return {matchEntireCell(){return this;},findNext(){const index=data.findIndex((r,i)=>i>=row-1&&r[col-1]===id);return index<0?null:{getRow:()=>index+1};}};}
  })};sheets[name]=sheet;return sheet;
 }
 makeSheet('Leads',rows);
 function formatDate(date,tz,format){
  const p=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(date).map(x=>[x.type,x.value]));
  return format==='yyyy-MM-dd'?`${p.year}-${p.month}-${p.day}`:`${p.hour}:${p.minute}:${p.second}`;
 }
 const box={Date,JSON,Math,Error,ContentService:{MimeType:{JSON:'json'},createTextOutput:text=>({setMimeType:()=>JSON.parse(text)})},PropertiesService:{getScriptProperties:()=>({getProperty:k=>props[k]})},Utilities:{formatDate,Charset:{UTF_8:'utf8'},DigestAlgorithm:{SHA_256:'sha256'},computeHmacSha256Signature:(s,k)=>[...crypto.createHmac('sha256',k).update(s).digest()],computeDigest:(_,s)=>[...crypto.createHash('sha256').update(s).digest()]},LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock:()=>{}})},SpreadsheetApp:{openById:()=>({getSheetByName:name=>sheets[name],insertSheet:name=>makeSheet(name)}),flush:()=>{}},UrlFetchApp:{fetch:()=>{sends++;return {getResponseCode:()=>telegramOK?200:500,getContentText:()=>JSON.stringify({ok:telegramOK})};}}};
 vm.createContext(box);vm.runInContext(fs.readFileSync(path.join(__dirname,'../google-apps-script/Code.gs'),'utf8'),box);
 const lead={requestId:'12345678-1234-4234-8234-123456789abc',name:'=IMPORTXML("x")',phone:'@example_user',service:'targeting',plan:'business',business:'education',message:'=1+1',website:'',lang:'ky'};
 function envelope(d=lead,t=Date.now()){const payload=JSON.stringify(d),timestamp=String(t),signature=crypto.createHmac('sha256',secret).update(timestamp+'.'+payload).digest('hex');return {postData:{contents:JSON.stringify({payload,timestamp,signature})}};}
 return {box,rows,sheets,envelope,lead,props,sends:()=>sends,failTelegram:()=>{telegramOK=false;}};
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

test('daily tabs use Bishkek date, form column order and deduplicate retries',()=>{
 const h=harness();assert.equal(h.box.doPost(h.envelope()).ok,true);
 const day=h.box.Utilities.formatDate(new Date(h.rows[1][1]),'Asia/Bishkek','yyyy-MM-dd');
 const daily=h.sheets[day];assert.ok(daily);assert.equal(daily.rows[1][0],"'"+h.lead.name);assert.equal(daily.rows[1][1],"'"+h.lead.phone);
 assert.equal(daily.rows[1][2],'Business — $350');assert.equal(daily.rows[1][3],'Ta’lim');assert.equal(daily.rows[1][4],"'"+h.lead.message);assert.match(daily.rows[1][8],/sent/);assert.ok(daily.getFilter());
 h.box.doPost(h.envelope());assert.equal(daily.rows.length,2);
 h.box.doPost(h.envelope({...h.lead,requestId:'22345678-1234-4234-8234-123456789abc'}));assert.equal(daily.rows.length,3);
});
test('date boundary uses original receipt date even when retry happens later',()=>{
 const h=harness();h.box.doPost(h.envelope());
 h.rows[1][1]='2026-09-26T18:30:00.000Z';
 assert.equal(h.box.doPost(h.envelope()).duplicate,true);
 assert.equal(h.sheets['2026-09-27'].rows[1][6],'00:30:00');assert.equal(h.sends(),2);
});
