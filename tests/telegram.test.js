const test=require('node:test'),assert=require('node:assert/strict');
const {configuration,storeLead}=require('../lib/leads');
test('only allowlisted recipients receive leads and a partial retry skips delivered recipients',async()=>{
 const config=configuration({TELEGRAM_BOT_TOKEN:String(12345)+':'+('A'.repeat(30)),TELEGRAM_CHAT_IDS:['1','2','1'].join(',')});assert.deepEqual(config.chats,['1','2']);
 const original=global.fetch,calls=[];let fail=true;
 global.fetch=async(url,options)=>{assert.equal(new URL(url).hostname,'api.telegram.org');const id=JSON.parse(options.body).chat_id;calls.push(id);return {ok:!fail||id!=='2',json:async()=>({ok:true})};};
 const lead={requestId:'demo-test',name:'Test',phone:'demo',plan:'start',chat_id:'999'};
 try{await assert.rejects(storeLead(config,lead));fail=false;await storeLead(config,lead);await storeLead(config,lead);assert.deepEqual(calls,['1','2','2']);}finally{global.fetch=original;}
});
