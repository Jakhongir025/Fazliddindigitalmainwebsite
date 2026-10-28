'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
test('counters complete, release frame handles and honor reduced motion',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
 const source=html.slice(html.indexOf('// Reveal the whole statistics card once'),html.indexOf('</script>',html.indexOf('// Reveal the whole statistics card once')));
 for(const reduced of [false,true]){
  const pending=new Map();let next=0,changed;
  const counters=[300000,100,4].map(n=>({dataset:{prefix:'',count:String(n),suffix:'+'},textContent:''}));
  const card={querySelectorAll:()=>counters,classList:{add(){},remove(){}}};
  const context={document:{querySelector:()=>card,querySelectorAll:()=>counters},window:{matchMedia:()=>({matches:reduced,addListener:fn=>changed=fn})},Set,Number,Math,performance:{now:()=>0},requestAnimationFrame:fn=>{pending.set(++next,fn);return next;},cancelAnimationFrame:id=>pending.delete(id)};
  vm.createContext(context);vm.runInContext(source,context);
  for(let time=0;time<=2500;time+=50){const callbacks=[...pending.values()];pending.clear();callbacks.forEach(fn=>fn(time));}
  assert.deepEqual(counters.map(c=>c.textContent),['300,000+','100+','4+']);assert.equal(pending.size,0);assert.equal(vm.runInContext('frames.size',context),0);assert.equal(typeof changed,'function');
 }
});
