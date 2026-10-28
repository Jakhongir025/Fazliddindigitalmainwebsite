'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
test('secret guard detects staged content even if working file was cleaned, without printing the value',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'lead-secret-test-'));
 try{
  fs.mkdirSync(path.join(dir,'scripts'));fs.copyFileSync(path.join(__dirname,'../scripts/check-secrets.js'),path.join(dir,'scripts/check-secrets.js'));
  cp.execFileSync('git',['init','-q'],{cwd:dir});
  const fixture='123456789'+':'+('A'.repeat(35));
  fs.writeFileSync(path.join(dir,'sample.js'),'const token="'+fixture+'";');
  cp.execFileSync('git',['add','sample.js'],{cwd:dir});fs.writeFileSync(path.join(dir,'sample.js'),'// cleaned working copy');
  const result=cp.spawnSync(process.execPath,['scripts/check-secrets.js'],{cwd:dir,encoding:'utf8'});
  assert.equal(result.status,1);assert.match(result.stderr,/staged content/);assert.ok(!result.stderr.includes(fixture));
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('spreadsheet links and configured Telegram IDs are blocked without exposing values',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'lead-private-test-'));
 try{
  fs.mkdirSync(path.join(dir,'scripts'));fs.copyFileSync(path.join(__dirname,'../scripts/check-secrets.js'),path.join(dir,'scripts/check-secrets.js'));
  for(const value of ['https://docs.google.com/spreadsheets/d/'+'a'.repeat(32)+'/edit', 'TELEGRAM_CHAT_IDS: "'+['987654321','123456789'].join(',')+'"']){
   fs.writeFileSync(path.join(dir,'private-copy.txt'),value);
   const result=cp.spawnSync(process.execPath,['scripts/check-secrets.js'],{cwd:dir,encoding:'utf8'});
   assert.equal(result.status,1);assert.ok(!result.stderr.includes(value));
  }
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('ignored private backups stay local, but force-staging them is blocked',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'lead-ignored-test-'));
 try{
  fs.mkdirSync(path.join(dir,'scripts'));fs.mkdirSync(path.join(dir,'secrets'));
  fs.copyFileSync(path.join(__dirname,'../scripts/check-secrets.js'),path.join(dir,'scripts/check-secrets.js'));
  cp.execFileSync('git',['init','-q'],{cwd:dir});fs.writeFileSync(path.join(dir,'.gitignore'),'secrets/');
  const fixture='123456789'+':'+('B'.repeat(35));fs.writeFileSync(path.join(dir,'secrets','backup.md'),fixture);
  const run=()=>cp.spawnSync(process.execPath,['scripts/check-secrets.js'],{cwd:dir,encoding:'utf8'});
  assert.equal(run().status,0);
  cp.execFileSync('git',['add','-f','secrets/backup.md'],{cwd:dir});const result=run();
  assert.equal(result.status,1);assert.ok(!result.stderr.includes(fixture));
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
