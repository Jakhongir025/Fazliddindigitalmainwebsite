/* Paste into Google Apps Script. All secrets belong in Script Properties. */
function output_(value){return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);}
function hex_(bytes){return bytes.map(function(n){return ('0'+((n+256)%256).toString(16)).slice(-2);}).join('');}
function safeCell_(text){return "'"+String(text||'');}
function doPost(e){
 var saved=false,id='';
 try{
  // Optional code-based configuration lives only in your private Apps Script project.
  var scriptProps=PropertiesService.getScriptProperties();
  var privateSettings=(typeof PRIVATE_SETTINGS!=='undefined')?PRIVATE_SETTINGS:{};
  var props={getProperty:function(key){return privateSettings[key]||scriptProps.getProperty(key);}};
  var secret=props.getProperty('APPS_SCRIPT_SECRET'),sheetId=props.getProperty('SPREADSHEET_ID');
  var bot=props.getProperty('TELEGRAM_BOT_TOKEN'),chats=(props.getProperty('TELEGRAM_CHAT_IDS')||'').split(',').map(function(x){return x.trim();}).filter(Boolean);
  if(!secret||secret.length<32||!sheetId||!bot||chats.length<1||chats.length>5||chats.some(function(x){return !/^-?\d+$/.test(x);}))throw Error('configuration');
  if(!e||!e.postData||e.postData.contents.length>14000)throw Error('body');
  var envelope=JSON.parse(e.postData.contents);
  if(typeof envelope.payload!=='string'||typeof envelope.timestamp!=='string'||!/^\d{13}$/.test(envelope.timestamp)||Math.abs(Date.now()-Number(envelope.timestamp))>300000||typeof envelope.signature!=='string'||!/^[a-f0-9]{64}$/.test(envelope.signature))throw Error('signature');
  var expected=hex_(Utilities.computeHmacSha256Signature(envelope.timestamp+'.'+envelope.payload,secret,Utilities.Charset.UTF_8));
  var diff=0;for(var i=0;i<64;i++)diff|=expected.charCodeAt(i)^envelope.signature.charCodeAt(i);if(diff!==0)throw Error('signature');
  var d=JSON.parse(envelope.payload);id=d.requestId;
  if(typeof id!=='string'||!/^[0-9a-f-]{36}$/i.test(id)||typeof d.name!=='string'||d.name.length<2||d.name.length>80||typeof d.phone!=='string'||d.phone.length>64||typeof d.message!=='string'||d.message.length>2000||['uz','ky','ru'].indexOf(d.lang)<0||d.service!=='targeting'||['start','business','premium'].indexOf(d.plan)<0||['','ecommerce','services','realestate','education','other'].indexOf(d.business)<0||d.website!=='')throw Error('fields');
  var hash=hex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,envelope.payload,Utilities.Charset.UTF_8));
  var lock=LockService.getScriptLock();if(!lock.tryLock(10000))throw Error('busy');
  var sheet,row;
  try{
   var book=SpreadsheetApp.openById(sheetId);sheet=book.getSheetByName('Leads')||book.insertSheet('Leads');
   if(sheet.getLastRow()===0){sheet.appendRow(['Request ID','UTC time','Name','Contact','Service','Business','Message','Language','Telegram status','Payload hash','Tariff']);sheet.setFrozenRows(1);}
   if(sheet.getRange(1,11).getValue()!=='Tariff')sheet.getRange(1,11).setValue('Tariff');
   if(sheet.getLastRow()>1){
    var match=sheet.getRange(2,1,sheet.getLastRow()-1,1).createTextFinder(id).matchEntireCell(true).findNext();
    if(match){if(sheet.getRange(match.getRow(),10).getValue()!==hash)throw Error('id conflict');return output_({ok:true,id:id,duplicate:true});}
   }
   row=sheet.getLastRow()+1;
   sheet.getRange(row,1,1,11).setNumberFormat('@').setValues([[id,new Date().toISOString(),safeCell_(d.name),safeCell_(d.phone),safeCell_(d.service),safeCell_(d.business),safeCell_(d.message),d.lang,'pending',hash,d.plan]]);
   SpreadsheetApp.flush();saved=true;
  }finally{lock.releaseLock();}
  // The lead is safely stored before notifications. Each chat gets its own request.
  var text=['Yangi ariza','ID: '+id,'Ism: '+d.name,'Kontakt: '+d.phone,'Xizmat: '+d.service,'Tarif: '+d.plan+' ($'+({start:250,business:350,premium:650}[d.plan])+')','Biznes: '+(d.business||'—'),'Xabar: '+(d.message||'—'),'Til: '+d.lang].join('\n');
  var outcomes=chats.map(function(chat){
   try{
    var response=UrlFetchApp.fetch('https://api.telegram.org/bot'+bot+'/sendMessage',{method:'post',contentType:'application/json',payload:JSON.stringify({chat_id:chat,text:text}),muteHttpExceptions:true});
    return response.getResponseCode()===200&&JSON.parse(response.getContentText()).ok===true?'sent':'failed';
   }catch(ignore){return 'failed';}
  });
  sheet.getRange(row,9).setValue(outcomes.map(function(state,index){return 'chat '+(index+1)+': '+state;}).join('; '));
  return output_({ok:true,id:id});
 }catch(ignore){
  // Never log request payloads, signatures, credentials or upstream exceptions.
  return output_(saved?{ok:true,id:id}:{ok:false});
 }
}
function doGet(){return output_({ok:false});}
