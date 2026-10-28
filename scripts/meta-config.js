'use strict';
function renderMeta(html,env={}){
 const pixel=(env.META_PIXEL_ID||'').trim(),verification=(env.META_DOMAIN_VERIFICATION||'').trim();
 if(pixel&&!/^\d{5,25}$/.test(pixel))throw Error('Invalid META_PIXEL_ID');
 if(verification&&!/^[a-zA-Z0-9_-]{8,100}$/.test(verification))throw Error('Invalid META_DOMAIN_VERIFICATION');
 let tags='';
 if(verification)tags+='<meta name="facebook-domain-verification" content="'+verification+'">\n';
 if(pixel){
  tags+='<script defer src="/meta-pixel.js" data-pixel-id="'+pixel+'"></script>\n';
  html=html.replace(/script-src ([^;]+);/,"script-src $1 'self' https://connect.facebook.net;")
   .replace("connect-src 'self';","connect-src 'self' https://www.facebook.com https://connect.facebook.net;")
   .replace("img-src 'self' data:;","img-src 'self' data: https://www.facebook.com;");
 }
 return {html:html.replace('<!-- META_INTEGRATION -->',tags),pixelEnabled:Boolean(pixel)};
}
module.exports={renderMeta};
