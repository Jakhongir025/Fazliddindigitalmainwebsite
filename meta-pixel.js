/* Optional Meta integration. No form names, phones or messages are passed to Meta. */
(function(){
 'use strict';
 const pixel=document.currentScript?.dataset.pixelId;
 if(!/^\d{5,25}$/.test(pixel||'')||window.fbq)return;
 const fbq=window.fbq=function(){fbq.callMethod?fbq.callMethod.apply(fbq,arguments):fbq.queue.push(arguments);};
 if(!window._fbq)window._fbq=fbq;
 fbq.push=fbq;fbq.loaded=true;fbq.version='2.0';fbq.queue=[];
 fbq('set','autoConfig',false,pixel);
 fbq('init',pixel);
 fbq('track','PageView');
 const sent=new Set();
 window.addEventListener('lead:confirmed',function(event){
  const id=event.detail?.id;
  if(typeof id!=='string'||sent.has(id))return;
  sent.add(id);fbq('track','Lead',{}, {eventID:id});
 });
 const script=document.createElement('script');script.async=true;
 script.src='https://connect.facebook.net/en_US/fbevents.js';document.head.appendChild(script);
})();
