'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const file=path.resolve(__dirname,'../index.html');let html=fs.readFileSync(file,'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/);
if(!script)throw Error('Inline script not found');
const hash=crypto.createHash('sha256').update(script[1]).digest('base64');
html=html.replace(/script-src 'sha256-[^']+'/,"script-src 'sha256-"+hash+"'");
fs.writeFileSync(file,html);console.log('CSP hash updated.');
