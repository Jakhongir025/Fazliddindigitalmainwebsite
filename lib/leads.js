'use strict';
function configuration(env=process.env){
 const token=(env.TELEGRAM_BOT_TOKEN||'').trim();
 const chats=[...new Set((env.TELEGRAM_CHAT_IDS||'').split(',').map(x=>x.trim()))];
 if(!/^\d+:[A-Za-z0-9_-]{25,}$/.test(token)||chats.length>5||chats.some(x=>!(/^[1-9]\d{0,15}$/).test(x)))return null;
 const site=env.SITE_ORIGIN|| (env.VERCEL_PROJECT_PRODUCTION_URL?'https://'+env.VERCEL_PROJECT_PRODUCTION_URL:'https://fazliddindigitalmainwebsite.vercel.app');
 try{return {token,chats,origin:new URL(site).origin};}catch{return null;}
}
function validate(body){
 if(!body||typeof body!=='object'||Array.isArray(body))throw Error('invalid');
 const limits={name:[2,80],phone:[5,64],service:[1,20],plan:[1,20],business:[0,20],message:[0,2000],website:[0,200],lang:[2,2],requestId:[36,36]};
 const result={};
 for(const [key,[min,max]]of Object.entries(limits)){
  if(typeof body[key]!=='string')throw Error('invalid');
  const value=body[key].trim();if(value.length<min||value.length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value))throw Error('invalid');result[key]=value;
 }
 if(result.website||!['uz','ky','ru'].includes(result.lang)||result.service!=='targeting'||!['start','business','premium'].includes(result.plan)||!['','ecommerce','services','realestate','education','other'].includes(result.business)||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(result.requestId))throw Error('invalid');
 const digits=result.phone.replace(/\D/g,'');
 if(!/^@[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(result.phone)&&!(/^[+\d][\d ()-]{5,30}$/.test(result.phone)&&digits.length>=7&&digits.length<=15))throw Error('invalid');
 return result;
}

// Bounded per-instance counters; no persistence of contact details.
const windows=new Map(), deliveries=new Map();
function consume(key,limit){
 const now=Date.now();let w=windows.get(key);
 if(!w||w.until<=now){for(const [k,v] of windows)if(v.until<=now)windows.delete(k);if(windows.size>=2048)return false;windows.set(key,w={n:0,until:now+600000});}
 return ++w.n<=limit;
}
function rateLimit(_,ip){return consume('ip:'+ip,5)&&consume('global',100);}
async function storeLead(config,d){
 const now=Date.now();for(const [k,v] of deliveries)if(v.until<=now)deliveries.delete(k);
 const fingerprint=require('node:crypto').createHash('sha256').update(JSON.stringify(d)).digest('hex');
 let entry=deliveries.get(d.requestId);
 if(entry&&entry.fingerprint!==fingerprint)throw Error('conflict');
 if(!entry){if(deliveries.size>=1024)throw Error('busy');deliveries.set(d.requestId,entry={fingerprint,until:now+600000,sent:new Set()});}
 if(entry.pending)return entry.pending;
 const text=['Yangi ariza','Ism: '+d.name,'Telefon / Telegram: '+d.phone,'Tarif: '+d.plan,'Biznes: '+(d.business||'—'),'Xabar: '+(d.message||'—'),'Til: '+d.lang,'ID: '+d.requestId].join('\n');
 entry.pending=Promise.allSettled(config.chats.filter(id=>!entry.sent.has(id)).map(async id=>{
 const res=await fetch('https://api.telegram.org/bot'+config.token+'/sendMessage',{method:'POST',redirect:'error',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:id,text}),signal:AbortSignal.timeout(10000)});
 if(!res.ok||(await res.json()).ok!==true)throw Error('delivery');entry.sent.add(id);
 })).then(()=>{if(config.chats.some(id=>!entry.sent.has(id)))throw Error('delivery');});
 try{await entry.pending;}finally{entry.pending=null;}
}
module.exports={configuration,validate,rateLimit,storeLead};
