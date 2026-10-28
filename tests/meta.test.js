'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {renderMeta}=require('../scripts/meta-config');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
test('Meta stays disabled without IDs and rejects tag injection',()=>{
 assert.ok(!renderMeta(html).html.includes('src="/meta-pixel.js"'));
 assert.throws(()=>renderMeta(html,{META_PIXEL_ID:'"><script>'}));
 assert.throws(()=>renderMeta(html,{META_DOMAIN_VERIFICATION:'" onload="bad'}));
 const enabled=renderMeta(html,{META_PIXEL_ID:'123456789',META_DOMAIN_VERIFICATION:'testverification'}).html;
 assert.ok(enabled.includes('facebook-domain-verification'));assert.ok(enabled.includes("https://connect.facebook.net;"));
});
test('Pixel counts page views and deduplicates confirmed leads without form fields',()=>{
 const listeners={},win={addEventListener:(name,fn)=>listeners[name]=fn};
 const doc={currentScript:{dataset:{pixelId:'123456789'}},createElement:()=>({}),head:{appendChild(){}}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../meta-pixel.js'),'utf8'),{window:win,document:doc,Set});
 assert.equal(win.fbq.queue.filter(args=>args[1]==='PageView').length,1);
 assert.equal(win.fbq.queue.filter(args=>args[1]==='Lead').length,0);
 const event={detail:{id:'test-request',name:'must not send',phone:'must not send'}};
 listeners['lead:confirmed'](event);listeners['lead:confirmed'](event);
 const leads=win.fbq.queue.filter(args=>args[1]==='Lead');assert.equal(leads.length,1);
 assert.ok(!JSON.stringify(leads).includes('must not send'));
});
