'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const port=8777,origin='http://127.0.0.1:'+port;
process.env.SITE_ORIGIN=origin;
const routes={'/api/config':require('../api/config'),'/api/leads':require('../api/leads')};
const root=path.resolve(__dirname,'../public'),types={'.html':'text/html; charset=utf-8','.jpg':'image/jpeg','.png':'image/png','.js':'application/javascript'};
http.createServer(async(req,res)=>{
 try{
 const url=new URL(req.url,origin);
 if(req.headers.host!=='127.0.0.1:'+port){res.writeHead(403).end();return;}
 if(Object.hasOwn(routes,url.pathname)){
 res.status=n=>{res.statusCode=n;return res;};res.json=obj=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(obj));};
 if(req.method==='POST'){let chunks=[],n=0;for await(const chunk of req){n+=chunk.length;if(n>8192){res.writeHead(413).end();return;}chunks.push(chunk);}req.body=Buffer.concat(chunks).toString();}
 return await routes[url.pathname](req,res);
 }
 const file=url.pathname==='/'?'index.html':url.pathname.slice(1);
 if(req.method!=='GET'||!(/^(index\.html|meta-pixel\.js|(?:img|icons)\/[\w.-]+\.(?:jpg|png))$/).test(file)){res.writeHead(404).end();return;}
 const data=await fs.promises.readFile(path.join(root,file));res.setHeader('Content-Type',types[path.extname(file)]);res.end(data);
 }catch{if(!res.headersSent)res.writeHead(404);res.end();}
}).listen(port,'127.0.0.1',()=>console.log(origin));
