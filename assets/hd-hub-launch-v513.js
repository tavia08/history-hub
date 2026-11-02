/* History Defense Hub launcher - v3.0 same-tab auth handoff
 * history-hub and history-defense share the same origin (https://tavia08.github.io).
 * Avoids popup/opener/postMessage failures on tablets.
 */
(()=>{'use strict';
 const OPT={
   serverUrl:'https://script.google.com/macros/s/AKfycbxaNVvX4B1moP5mlKyk2wUP1NMfOyghLXGtRlWbK7l4x4uKRHOdW-Uj53QvjVYkYHhg/exec',
   defenseOrigin:'https://tavia08.github.io'
 };
 const KEY='HD512_AUTH_SESSION';

 function jsonp(p){
   return new Promise((resolve,reject)=>{
     const callback='hdhub_'+Date.now()+'_'+Math.random().toString(36).slice(2);
     const script=document.createElement('script');
     let done=false;
     const clean=()=>{
       if(done)return;
       done=true;
       clearTimeout(timer);
       try{delete window[callback]}catch(e){window[callback]=undefined}
       script.remove();
     };
     const timer=setTimeout(()=>{clean();reject(Error('로그인 서버 응답 지연'))},15000);
     window[callback]=r=>{
       clean();
       if(r?.status==='ok')resolve(r);
       else reject(Error(r?.message||'인증 실패'));
     };
     script.onerror=()=>{clean();reject(Error('인증 서버 연결 실패'))};
     script.src=OPT.serverUrl+'?'+new URLSearchParams({...p,callback}).toString();
     document.head.appendChild(script);
   });
 }

 async function openDefense(identity,gameUrl){
   if(!identity?.studentNo||!identity?.studentName){
     throw Error('학습실 로그인 정보가 필요합니다.');
   }
   const u=new URL(gameUrl,location.href);
   if(u.origin!==OPT.defenseOrigin){
     throw Error('디펜스 주소가 허용된 사이트가 아닙니다.');
   }

   const issued=await jsonp({
     action:'issueToken',
     studentNo:identity.studentNo,
     studentName:identity.studentName
   });
   if(!issued.token||!issued.expiresAt){
     throw Error('서버가 인증 토큰을 발급하지 않았습니다.');
   }

   const expires=Date.parse(issued.expiresAt);
   if(!Number.isFinite(expires)||expires<=Date.now()){
     throw Error('발급된 인증 토큰의 만료 시간이 올바르지 않습니다.');
   }

   // Same origin, same tab: the defense command center can read this session directly.
   sessionStorage.setItem(KEY,JSON.stringify({
     token:issued.token,
     expiresAt:expires,
     student:issued.student||{
       studentNo:identity.studentNo,
       studentName:identity.studentName
     }
   }));

   // Return target for future compatibility / diagnostics.
   sessionStorage.setItem('HD_HUB_RETURN_URL',location.href);

   location.assign(u.href);
 }

 window.HDHubLaunch513={
   configure(c){
     if(c?.serverUrl)OPT.serverUrl=String(c.serverUrl).replace(/\/$/,'');
   },
   openDefense
 };
})();
