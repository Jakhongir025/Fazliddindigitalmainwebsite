'use strict';
const {createHmac}=require('node:crypto');
const keys=['SITE_ORIGIN','APPS_SCRIPT_URL','APPS_SCRIPT_SECRET','UPSTASH_REDIS_REST_URL','UPSTASH_REDIS_REST_TOKEN'];
function configuration(){
 const env=process.env;
 if(keys.some(k=>!env[k]))return null;
 try{
  const site=new URL(env.SITE_ORIGIN),sheet=new URL(env.APPS_SCRIPT_URL),redis=new URL(env.UPSTASH_REDIS_REST_URL);
  if(site.protocol!=='https:'||site.origin!==env.SITE_ORIGIN||sheet.origin!=='https://script.google.com'||!/^\/macros\/s\/[^/]+\/exec$/.test(sheet.pathname)||redis.protocol!=='https:'||!redis.hostname.endsWith('.upstash.io')||env.APPS_SCRIPT_SECRET.length<32)return null;
  return {origin:site.origin,sheet:sheet.href,redis:redis.origin,secret:env.APPS_SCRIPT_SECRET,redisToken:env.UPSTASH_REDIS_REST_TOKEN};
 }catch{return null;}
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
async function rateLimit(config,ip){
 const digest=createHmac('sha256',config.secret).update(ip).digest('hex');
 const script="local a=redis.call('INCR',KEYS[1]); if a==1 then redis.call('EXPIRE',KEYS[1],600) end; local b=redis.call('INCR',KEYS[2]); if b==1 then redis.call('EXPIRE',KEYS[2],600) end; if a>5 or b>100 then return 0 end; return 1";
 const response=await fetch(config.redis,{method:'POST',headers:{Authorization:'Bearer '+config.redisToken,'Content-Type':'application/json'},body:JSON.stringify(['EVAL',script,'2','leads:ip:'+digest,'leads:global']),signal:AbortSignal.timeout(5000)});
 if(!response.ok)throw Error('rate unavailable');
 const data=await response.json();if(data.error||![0,1].includes(data.result))throw Error('rate unavailable');return data.result===1;
}
async function storeLead(config,lead){
 const payload=JSON.stringify(lead),timestamp=String(Date.now());
 const signature=createHmac('sha256',config.secret).update(timestamp+'.'+payload).digest('hex');
 const response=await fetch(config.sheet,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({timestamp,payload,signature}),signal:AbortSignal.timeout(20000),redirect:'follow'});
 if(!response.ok)throw Error('upstream');
 const data=await response.json();if(data.ok!==true||data.id!==lead.requestId)throw Error('unconfirmed');return data;
}
module.exports={configuration,validate,rateLimit,storeLead};
