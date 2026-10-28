/* Hub v5.13 adapter: load this file in the integrated learning room and call
   HDSurvivalHubLaunch.openDefense({studentNo,studentName}, gameUrl)
   ONLY after the existing learning-room login has succeeded.
   Configure serverUrl and survivalOrigin with the actual tested URLs.
   This uses the existing v5.11 issueToken flow; it is NOT stronger authentication.
 */
(()=>{'use strict';
 const OPT={serverUrl:'https://script.google.com/macros/s/AKfycbxaNVvX4B1moP5mlKyk2wUP1NMfOyghLXGtRlWbK7l4x4uKRHOdW-Uj53QvjVYkYHhg/exec',survivalOrigin:'https://tavia08.github.io'};
 const waiters=new Map();
 function jsonp(p){return new Promise((resolve,reject)=>{
  if(!OPT.serverUrl||!/^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/.test(OPT.serverUrl)) return reject(Error('hub 인증 서버 주소를 설정하세요.'));
  const callback='hd513_'+Date.now()+'_'+Math.random().toString(36).slice(2);
  const script=document.createElement('script');
  const timer=setTimeout(()=>{clean();reject(Error('로그인 서버 응답 지연'))},15000);
  function clean(){clearTimeout(timer);delete window[callback];script.remove()}
  window[callback]=r=>{clean();if(r?.status==='ok')resolve(r);else reject(Error(r?.message||'인증 실패'))};
  script.onerror=()=>{clean();reject(Error('인증 서버 연결 실패'))};
  script.src=OPT.serverUrl+'?'+new URLSearchParams({...p,callback}).toString();document.head.appendChild(script);
 })}
 window.addEventListener('message',e=>{
  if(e.origin!==OPT.survivalOrigin||e.data?.type!=='HS_AUTH_READY_V13')return;
  const x=waiters.get(e.source);
  if(!x||Date.now()>x.deadline)return;
  try{e.source.postMessage({type:'HS_AUTH_HANDOFF_V13',token:x.token,expiresAt:x.expiresAt,student:x.student,serverUrl:OPT.serverUrl},OPT.survivalOrigin);x.delivered=true}catch{}
 });
 async function open(identity,gameUrl){
  if(!identity||!identity.studentNo||!identity.studentName)throw Error('학습실 로그인 정보가 필요합니다.');
  const u=new URL(gameUrl);if(u.origin!==OPT.survivalOrigin)throw Error('디펜스 주소가 허용된 사이트가 아닙니다.');
  // Open synchronously, before await, to prevent popup blocking.
  const target=window.open('about:blank','_blank');
  if(!target)throw Error('새 창이 차단됐습니다. 브라우저 팝업 허용을 확인하세요.');
  try{
   const issued=await jsonp({action:'issueToken',studentNo:identity.studentNo,studentName:identity.studentName});
   if(!issued.token||!issued.expiresAt)throw Error('서버가 인증 토큰을 발급하지 않았습니다.');
   const x={token:issued.token,expiresAt:issued.expiresAt,student:issued.student,deadline:Date.now()+60000,delivered:false};
   waiters.set(target,x);target.location.replace(u.href);
   setTimeout(()=>waiters.delete(target),65000);
  }catch(err){target.close();throw err}
 }
 window.HDSurvivalHubLaunch={configure(c){if(c?.serverUrl)OPT.serverUrl=String(c.serverUrl).replace(/\/$/,'');if(c?.survivalOrigin)OPT.survivalOrigin=new URL(c.survivalOrigin).origin},open};
})();
