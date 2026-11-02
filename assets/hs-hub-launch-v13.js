/* History Survival Hub launcher - Common Auth v1
 * The History Hub already verified the student. Do NOT re-check a second roster server.
 * Same-origin + same-tab navigation keeps sessionStorage across /history-hub/ -> /history-survival/.
 */
(()=>{'use strict';
 const OPT={survivalOrigin:'https://tavia08.github.io'};
 const COMMON_KEY='HISTORY_HUB_AUTH_V1';
 const RETURN_KEY='HS_HUB_RETURN_URL';

 function clean(v){return String(v??'').trim()}
 function makeSession(identity){
   const studentNo=clean(identity?.studentNo);
   const studentName=clean(identity?.studentName);
   const studentId=clean(identity?.studentId)||clean(localStorage.getItem('studentId'))||`${studentNo}_${studentName}`;
   if(!studentNo||!studentName)throw Error('학습실 로그인 정보가 필요합니다.');
   return {
     version:1,
     source:'history-hub',
     verified:true,
     issuedAt:Date.now(),
     student:{studentNo,studentName,studentId}
   };
 }
 function store(session){
   sessionStorage.setItem(COMMON_KEY,JSON.stringify(session));
   sessionStorage.setItem('HS_COMMON_AUTH_V1',JSON.stringify(session));
 }
 async function open(identity,gameUrl){
   const u=new URL(gameUrl,location.href);
   if(u.origin!==OPT.survivalOrigin)throw Error('서바이벌 주소가 허용된 사이트가 아닙니다.');
   const session=makeSession(identity);
   store(session);
   sessionStorage.setItem(RETURN_KEY,location.href);
   location.assign(u.href);
 }
 window.HDSurvivalHubLaunch={
   configure(){/* Common Auth v1 does not use a second auth server. */},
   open,
   getCommonSession(){try{return JSON.parse(sessionStorage.getItem(COMMON_KEY)||'null')}catch{return null}}
 };
})();
