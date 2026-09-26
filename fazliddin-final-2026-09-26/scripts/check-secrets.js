'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..');
const patterns=[/\b\d{6,}:[A-Za-z0-9_-]{25,}\b/,/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,/\bgh[pousr]_[A-Za-z0-9]{30,}\b/,/\bgithub_pat_[A-Za-z0-9_]{40,}\b/,/"private_key"\s*:\s*"-----/,/\bAIza[A-Za-z0-9_-]{30,}\b/];
let failures=[];
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
 if(['.git','.vercel','node_modules','public','img','icons'].includes(entry.name))continue;
 const full=path.join(dir,entry.name),relative=path.relative(root,full);
 if(entry.isSymbolicLink())continue;
 if(entry.isDirectory()){walk(full);continue;}
 if(entry.name==='PrivateSettings.gs')continue;
 if(/^\.env(?:\.|$)/.test(entry.name)&&entry.name!=='.env.example')continue;
 if(!/\.(?:js|json|html|gs|md|yml|yaml|example|txt)$/.test(entry.name))continue;
 const content=fs.readFileSync(full,'utf8');if(patterns.some(p=>p.test(content)))failures.push(relative);
}}
walk(root);
try{
 const files=cp.execFileSync('git',['ls-files','--cached'],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore']}).split('\n');
 for(const name of files){
  if(name.split('/').pop()==='PrivateSettings.gs')failures.push(name+' (private configuration must not be tracked)');
  if(/(^|\/)\.env(?:\.|$)/.test(name)&&!name.endsWith('.env.example'))failures.push(name+' (tracked environment file)');
  if(/\.(?:js|json|html|gs|md|yml|yaml|example|txt)$/.test(name)){
   try{const staged=cp.execFileSync('git',['show',':./'+name],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore']});if(patterns.some(p=>p.test(staged)))failures.push(name+' (staged content)');}catch{}
  }
 }
}catch{/* ZIP without a Git repository. */}
if(failures.length){console.error('Potential secrets detected (values hidden):\n'+[...new Set(failures)].join('\n'));process.exit(1);}
console.log('Known secret patterns and tracked environment files: clear. Manual review is still required.');
