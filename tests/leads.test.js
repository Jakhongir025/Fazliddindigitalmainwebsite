'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createHmac}=require('node:crypto');
const {configuration,validate}=require('../lib/leads');
const handler=require('../api/leads');
const configHandler=require('../api/config');
const sample=()=>({name:'Test user',phone:'@example_user',service:'targeting',plan:'business',business:'education',message:'Test',website:'',lang:'ky',requestId:'12345678-1234-4234-8234-123456789abc'});
function response(){return {headers:{},statusCode:200,setHeader(k,v){this.headers[k]=v;},status(n){this.statusCode=n;return this;},json(v){this.body=v;return this;}};}
function req(overrides={}){return {method:'POST',headers:{origin:'https://example.com','content-type':'application/json','x-vercel-forwarded-for':'192.0.2.1'},body:sample(),...overrides};}
const env={SITE_ORIGIN:'https://example.com',APPS_SCRIPT_URL:'https://script.google.com/macros/s/TEST/exec',APPS_SCRIPT_SECRET:'s'.repeat(40),UPSTASH_REDIS_REST_URL:'https://test.upstash.io',UPSTASH_REDIS_REST_TOKEN:'test-only-not-a-token'};
Object.assign(process.env,env);
test('schema rejects spam, unknown services and invalid contacts',()=>{
 assert.equal(validate(sample()).lang,'ky');
 for(const change of [{website:'spam'},{service:'bad'},{service:'google'},{plan:'invalid'},{phone:'abc'},{message:'x'.repeat(2001)},{requestId:'not-uuid'},{name:'x'}])assert.throws(()=>validate({...sample(),...change}));
});
test('configuration fails closed and exposes only a boolean',()=>{
 const r=response();configHandler({method:'GET'},r);assert.deepEqual(r.body,{enabled:true});
 const saved=process.env.APPS_SCRIPT_SECRET;delete process.env.APPS_SCRIPT_SECRET;
 assert.equal(configuration(),null);const r2=response();configHandler({method:'GET'},r2);assert.deepEqual(r2.body,{enabled:false});process.env.APPS_SCRIPT_SECRET=saved;
});
test('method and cross-origin checks happen before any network request',async()=>{
 let n=0;const old=global.fetch;global.fetch=async()=>{n++;throw Error('unexpected');};
 try{for(const [input,status] of [[req({method:'GET'}),405],[req({headers:{origin:'https://evil.example'}}),403],[req({headers:{origin:env.SITE_ORIGIN,'content-type':'text/plain'}}),415],[req({body:{...sample(),message:'x'.repeat(9000)}}),413]]){const r=response();await handler(input,r);assert.equal(r.statusCode,status);}assert.equal(n,0);}finally{global.fetch=old;}
});
test('rate limiting blocks and fails closed on service outage',async()=>{
 const old=global.fetch;
 try{
  global.fetch=async()=>({ok:true,json:async()=>({result:0})});let r=response();await handler(req(),r);assert.equal(r.statusCode,429);
  global.fetch=async()=>{throw Error('sensitive upstream URL');};r=response();await handler(req(),r);assert.equal(r.statusCode,503);assert.deepEqual(r.body,{ok:false});
 }finally{global.fetch=old;}
});
test('success requires signed, confirmed storage; payload is never a query string',async()=>{
 const old=global.fetch;let calls=[];
 try{
  global.fetch=async(url,options)=>{calls.push({url,options});if(url.includes('upstash'))return {ok:true,json:async()=>({result:1})};const envelope=JSON.parse(options.body);assert.equal(envelope.signature,createHmac('sha256',env.APPS_SCRIPT_SECRET).update(envelope.timestamp+'.'+envelope.payload).digest('hex'));assert.equal(JSON.parse(envelope.payload).phone,sample().phone);return {ok:true,json:async()=>({ok:true,id:sample().requestId})};};
  const r=response();await handler(req(),r);assert.equal(r.statusCode,200);assert.equal(calls.length,2);assert.ok(!calls[1].url.includes(sample().phone));
  global.fetch=async url=>({ok:true,json:async()=>url.includes('upstash')?{result:1}:{ok:false}});
  const bad=response();await handler(req(),bad);assert.equal(bad.statusCode,503);
 }finally{global.fetch=old;}
});

test('production domain fallback and pasted trailing slash work without trusting request hosts',()=>{
 const saved={...process.env};
 try{
  process.env.SITE_ORIGIN='  https://example.com/  ';
  assert.equal(configuration().origin,'https://example.com');
  delete process.env.SITE_ORIGIN;process.env.VERCEL_PROJECT_PRODUCTION_URL='fazliddindigitalmainwebsite.vercel.app';
  assert.equal(configuration().origin,'https://fazliddindigitalmainwebsite.vercel.app');
  delete process.env.VERCEL_PROJECT_PRODUCTION_URL;assert.equal(configuration(),null);
  for(const bad of ['https://example.com/path','https://user:pass@example.com','http://example.com']){process.env.SITE_ORIGIN=bad;assert.equal(configuration(),null);}
 }finally{for(const key of Object.keys(process.env))if(!(key in saved))delete process.env[key];Object.assign(process.env,saved);}
});
test('diagnostics contain only variable names and do not enable incomplete integration',()=>{
 const {configurationIssues}=require('../lib/leads');
 assert.deepEqual(configurationIssues({}).sort(),['SITE_ORIGIN','APPS_SCRIPT_URL','APPS_SCRIPT_SECRET','UPSTASH_REDIS_REST_URL','UPSTASH_REDIS_REST_TOKEN'].sort());
 const bad={...env,APPS_SCRIPT_SECRET:'short',APPS_SCRIPT_URL:'https://example.com/private'};
 assert.deepEqual(configurationIssues(bad).sort(),['APPS_SCRIPT_URL','APPS_SCRIPT_SECRET'].sort());
});
