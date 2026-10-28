/* Paste into Google Apps Script. All secrets belong in Script Properties. */
function output_(value){return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);}
function hex_(bytes){return bytes.map(function(n){return ('0'+((n+256)%256).toString(16)).slice(-2);}).join('');}
function safeCell_(text){return "'"+String(text||'');}
// Private values belong in Apps Script Project Settings -> Script Properties.
function recipientIds_(value){
 var ids=String(value||'').split(',').map(function(id){return id.trim();}).filter(Boolean);
 ids=ids.filter(function(id,index){return ids.indexOf(id)===index;});
 // Only personal Telegram chats; no group/channel destinations or client-supplied IDs.
 if(!ids.length||ids.length>5||ids.some(function(id){return !/^[1-9][0-9]{0,15}$/.test(id);}))throw Error('recipients');
 return ids;
}
function spreadsheetId_(value){
 var text=String(value||'').trim();
 var match=text.match(/^https:\/\/docs\.google\.com\/spreadsheets\/d\/([A-Za-z0-9_-]+)(?:\/[^\s]*)?$/);
 if(match&&match[1]!=='e')return match[1];
 if(/^[A-Za-z0-9_-]+$/.test(text))return text;
 throw Error('spreadsheet');
}
function setupConnection(){
 var props=PropertiesService.getScriptProperties();
 recipientIds_(props.getProperty('TELEGRAM_CHAT_IDS'));
 if(!props.getProperty('TELEGRAM_BOT_TOKEN'))throw Error('Add TELEGRAM_BOT_TOKEN in Script Properties');
 var input=props.getProperty('SPREADSHEET_URL')||props.getProperty('SPREADSHEET_ID');
 var book=input?SpreadsheetApp.openById(spreadsheetId_(input)):SpreadsheetApp.getActiveSpreadsheet();
 if(!book)throw Error('Add SPREADSHEET_URL in Script Properties');
 props.setProperty('SPREADSHEET_ID',book.getId());
 if(!props.getProperty('APPS_SCRIPT_SECRET'))props.setProperty('APPS_SCRIPT_SECRET',Utilities.getUuid().replace(/-/g,'')+Utilities.getUuid().replace(/-/g,''));
 if(props.getProperty('APPS_SCRIPT_SECRET').length<32)throw Error('APPS_SCRIPT_SECRET must contain at least 32 characters');
 // Deliberately do not log the URL, token, IDs or secret.
}
// Dates use server receipt time, never the visitor's device clock.
function findLead_(sheet,id,column){
 if(sheet.getLastRow()<2)return null;
 return sheet.getRange(2,column,sheet.getLastRow()-1,1).createTextFinder(id).matchEntireCell(true).findNext();
}
function dailyLead_(book,d,received,status,timezone){
 var date=new Date(received),day=Utilities.formatDate(date,timezone,'yyyy-MM-dd');
 var sheet=book.getSheetByName(day)||book.insertSheet(day);
 var headers=['Ism','Telefon / Telegram','Tarif','Biznes yo‘nalishi','Xabar','Sana','Vaqt','Til','Telegram holati','Ariza ID'];
 if(sheet.getLastRow()===0){
  sheet.appendRow(headers);sheet.setFrozenRows(1);
  sheet.getRange(1,1,1,10).setFontWeight('bold').setBackground('#14283f').setFontColor('#ffffff');
  sheet.setColumnWidths(1,10,160);sheet.setColumnWidth(5,320);sheet.setColumnWidth(10,300);
 }
 var match=findLead_(sheet,d.requestId,10),row=match?match.getRow():sheet.getLastRow()+1;
 if(row>sheet.getMaxRows())sheet.insertRowsAfter(sheet.getMaxRows(),100);
 var filter=sheet.getFilter();
 if(!filter||filter.getRange().getNumRows()<sheet.getMaxRows()){
  var criteria=[];
  if(filter){for(var c=1;c<=10;c++)criteria[c]=filter.getColumnFilterCriteria(c);filter.remove();}
  filter=sheet.getRange(1,1,sheet.getMaxRows(),10).createFilter();
  for(var c=1;c<=10;c++)if(criteria[c])filter.setColumnFilterCriteria(c,criteria[c]);
 }
 var business={ecommerce:'E-commerce',services:'Xizmatlar',realestate:'Ko‘chmas mulk',education:'Ta’lim',other:'Boshqa'};
 var plans={start:'Start — $250',business:'Business — $350',premium:'Premium — $650'};
 sheet.getRange(row,1,1,10).setNumberFormat('@').setValues([[
  safeCell_(d.name),safeCell_(d.phone),plans[d.plan],business[d.business]||'—',safeCell_(d.message),
  day,Utilities.formatDate(date,timezone,'HH:mm:ss'),d.lang,status,d.requestId
 ]]).setWrap(true).setVerticalAlignment('top');
}
function doPost(e){
 var saved=false,id='';
 try{
  // Optional code-based configuration lives only in your private Apps Script project.
  var scriptProps=PropertiesService.getScriptProperties();
  var privateSettings=(typeof PRIVATE_SETTINGS!=='undefined')?PRIVATE_SETTINGS:{};
  var props={getProperty:function(key){return scriptProps.getProperty(key)||privateSettings[key];}};
  var secret=props.getProperty('APPS_SCRIPT_SECRET'),sheetId=spreadsheetId_(props.getProperty('SPREADSHEET_URL')||props.getProperty('SPREADSHEET_ID'));
  var bot=props.getProperty('TELEGRAM_BOT_TOKEN'),chats=recipientIds_(props.getProperty('TELEGRAM_CHAT_IDS'));
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
  var sheet,row,received,timezone=props.getProperty('SHEET_TIMEZONE')||'Asia/Bishkek';
  try{
   var book=SpreadsheetApp.openById(sheetId);sheet=book.getSheetByName('Leads')||book.insertSheet('Leads');
   if(sheet.getLastRow()===0){sheet.appendRow(['Request ID','UTC time','Name','Contact','Service','Business','Message','Language','Telegram status','Payload hash','Tariff']);sheet.setFrozenRows(1);}
   if(sheet.getRange(1,11).getValue()!=='Tariff')sheet.getRange(1,11).setValue('Tariff');
   if(sheet.getLastRow()>1){
    var match=sheet.getRange(2,1,sheet.getLastRow()-1,1).createTextFinder(id).matchEntireCell(true).findNext();
    if(match){if(sheet.getRange(match.getRow(),10).getValue()!==hash)throw Error('id conflict');dailyLead_(book,d,sheet.getRange(match.getRow(),2).getValue(),sheet.getRange(match.getRow(),9).getValue(),timezone);SpreadsheetApp.flush();return output_({ok:true,id:id,duplicate:true});}
   }
   row=sheet.getLastRow()+1;received=new Date().toISOString();
   sheet.getRange(row,1,1,11).setNumberFormat('@').setValues([[id,received,safeCell_(d.name),safeCell_(d.phone),safeCell_(d.service),safeCell_(d.business),safeCell_(d.message),d.lang,'pending',hash,d.plan]]);
   dailyLead_(book,d,received,'pending',timezone);
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
  var status=outcomes.map(function(state,index){return 'chat '+(index+1)+': '+state;}).join('; ');
  if(!lock.tryLock(10000))throw Error('busy');
  try{
   // Re-find by ID: a user may have sorted the sheet during Telegram delivery.
   var current=findLead_(sheet,id,1);if(!current)throw Error('missing lead');
   sheet.getRange(current.getRow(),9).setValue(status);
   dailyLead_(book,d,received,status,timezone);SpreadsheetApp.flush();
  }finally{lock.releaseLock();}
  return output_({ok:true,id:id});
 }catch(ignore){
  // Never log request payloads, signatures, credentials or upstream exceptions.
  return output_(saved?{ok:true,id:id}:{ok:false});
 }
}
function doGet(){return output_({ok:false});}
