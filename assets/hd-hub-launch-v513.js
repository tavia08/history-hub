/* History Defense Hub launcher - v2.8 auth server fix */
(()=>{'use strict';
 const OPT={serverUrl:'https://script.google.com/macros/s/AKfycbxaNVvX4B1moP5mlKyk2wUP1NMfOyghLXGtRlWbK7l4x4uKRHOdW-Uj53QvjVYkYHhg/exec',defenseOrigin:'https://tavia08.github.io'};
 const waiters=new Map();
 function jsonp(p){return new Promise((resolve,reject)=>{
  const callback='hd513_'+Date.now()+'_'+Math.random().toString(36).slice(2);
  const script=document.createElement('script');
  const timer=setTimeout(()=>{clean();reject(Error('로그인 서버 응답 지연'))},15000);
  function clean(){clearTimeout(timer);delete window[callback];script.remove()}
  window[callback]=r=>{clean();if(r?.status==='ok')resolve(r);else reject(Error(r?.message||'인증 실패'))};
  script.onerror=()=>{clean();reject(Error('인증 서버 연결 실패'))};
  script.src=OPT.serverUrl+'?'+new URLSearchParams({...p,callback}).toString();
  document.head.appendChild(script);
 })}
 window.addEventListener('message',e=>{
  if(e.origin!==OPT.defenseOrigin||e.data?.type!=='HD_AUTH_READY_V513')return;
  const x=waiters.get(e.source);
  if(!x||Date.now()>x.deadline)return;
  try{
    e.source.postMessage({
      type:'HD_AUTH_HANDOFF_V513',
      token:x.token,expiresAt:x.expiresAt,student:x.student,serverUrl:OPT.serverUrl
    },OPT.defenseOrigin);
    x.delivered=true;
  }catch{}
 });
 async function openDefense(identity,gameUrl){
  if(!identity?.studentNo||!identity?.studentName)throw Error('학습실 로그인 정보가 필요합니다.');
  const u=new URL(gameUrl);
  if(u.origin!==OPT.defenseOrigin)throw Error('디펜스 주소가 허용된 사이트가 아닙니다.');
  const target=window.open('about:blank','_blank');
  if(!target)throw Error('새 창이 차단됐습니다. 브라우저 팝업 허용을 확인하세요.');
  try{
   const issued=await jsonp({
     action:'issueToken',
     studentNo:identity.studentNo,
     studentName:identity.studentName
   });
   if(!issued.token||!issued.expiresAt)throw Error('서버가 인증 토큰을 발급하지 않았습니다.');
   const x={
     token:issued.token,expiresAt:issued.expiresAt,student:issued.student,
     deadline:Date.now()+60000,delivered:false
   };
   waiters.set(target,x);
   target.location.replace(u.href);
   setTimeout(()=>waiters.delete(target),65000);
  }catch(err){
   target.close();
   throw err;
  }
 }
 window.HDHubLaunch513={
   configure(c){if(c?.serverUrl)OPT.serverUrl=String(c.serverUrl).replace(/\/$/,'');},
   openDefense
 };
})();
