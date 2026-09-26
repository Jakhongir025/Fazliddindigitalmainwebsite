'use strict';
const {configuration,validate,rateLimit,storeLead}=require('../lib/leads');
module.exports=async(req,res)=>{
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({ok:false});}
 const config=configuration();if(!config)return res.status(503).json({ok:false});
 if(req.headers.origin!==config.origin)return res.status(403).json({ok:false});
 if(!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type']||''))return res.status(415).json({ok:false});
 let lead;
 try{
  const raw=typeof req.body==='string'?req.body:JSON.stringify(req.body);
  if(!raw||Buffer.byteLength(raw)>8192)return res.status(413).json({ok:false});
  lead=validate(typeof req.body==='string'?JSON.parse(req.body):req.body);
 }catch{return res.status(400).json({ok:false});}
 try{
  // Vercel supplies this header; do not deploy behind an untrusted proxy.
  const ip=String(req.headers['x-vercel-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0].trim();
  if(!await rateLimit(config,ip)){res.setHeader('Retry-After','600');return res.status(429).json({ok:false});}
  await storeLead(config,lead);
  return res.status(200).json({ok:true,id:lead.requestId});
 }catch{
  // Deliberately omit exception details: upstream URLs can contain credentials.
  return res.status(503).json({ok:false});
 }
};
