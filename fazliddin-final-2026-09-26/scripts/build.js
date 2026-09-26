'use strict';
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'public');
fs.mkdirSync(out,{recursive:true});
for(const name of ['index.html','img','icons'])fs.cpSync(path.join(root,name),path.join(out,name),{recursive:true});
console.log('Public output contains only the page and image assets.');
