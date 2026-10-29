import React,{useEffect,useMemo,useRef,useState} from 'react';
import {createReminder,evaluateReminder,hasCoordinates,REMINDER_DISTANCES,REMINDER_KEY,restoreReminder} from './reminders.js';
import {localizedTree,tr} from './i18n.js';

function readReminder(){try{return restoreReminder(JSON.parse(localStorage.getItem(REMINDER_KEY)))}catch{return null}}

export function useArrivalReminder({all,db,pos,gpsError,loading,locate,locale}){
 const [reminder,setReminder]=useState(readReminder),[resumed,setResumed]=useState(false);
 const [now,setNow]=useState(Date.now()),[visible,setVisible]=useState(!document.hidden);
 const [radius,setRadius]=useState(500),[keepAwake,setKeepAwake]=useState(true),[wakeStatus,setWakeStatus]=useState('off');
 const [sound,setSound]=useState('off'),[notification,setNotification]=useState('off'),[storageError,setStorageError]=useState(false);
 const audio=useRef(null),lastFired=useRef(null),wake=useRef(null),alarmHeading=useRef(null);
 const route=useMemo(()=>reminder?all.find(r=>r.op+':'+r.id===reminder.route):null,[all,reminder?.route]);
 const stop=route&&route.stops[reminder.target]===reminder.stopId?db[route.op]?.byId[reminder.stopId]:null;
 const active=Boolean(reminder&&resumed&&reminder.firedAt===null&&now<reminder.expiresAt);
 const result=reminder?evaluateReminder(reminder,stop,pos,now,visible):null;

 useEffect(()=>{
  try{if(reminder)localStorage.setItem(REMINDER_KEY,JSON.stringify(reminder));else localStorage.removeItem(REMINDER_KEY);setStorageError(false)}catch{setStorageError(true)}
 },[reminder]);
 useEffect(()=>{
  if(!reminder)return;
  const timer=setInterval(()=>setNow(Date.now()),1000);
  const visibility=()=>{setVisible(!document.hidden);setNow(Date.now())};
  document.addEventListener('visibilitychange',visibility);
  return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',visibility)};
 },[Boolean(reminder)]);
 useEffect(()=>()=>{if(audio.current){audio.current.onstatechange=null;audio.current.close().catch(()=>{})}},[]);
 useEffect(()=>{
  if(!reminder?.firedAt||document.hidden)return;
  alarmHeading.current?.focus({preventScroll:true});
  alarmHeading.current?.scrollIntoView({block:'center',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
 },[reminder?.firedAt]);

 // Wake locks are released automatically when hidden. Re-request on return,
 // and release when cancelled/fired, including pending asynchronous requests.
 useEffect(()=>{
  let disposed=false,lock=null;
  if(!active||!keepAwake||!visible){setWakeStatus('off');return}
  if(!navigator.wakeLock?.request){setWakeStatus('unsupported');return}
  setWakeStatus('requesting');
  navigator.wakeLock.request('screen').then(value=>{
   if(disposed){value.release().catch(()=>{});return}
   lock=value;wake.current=value;setWakeStatus('on');
   value.addEventListener('release',()=>{if(!disposed)setWakeStatus('released')});
  }).catch(()=>{if(!disposed)setWakeStatus('blocked')});
  return()=>{disposed=true;if(wake.current===lock)wake.current=null;lock?.release().catch(()=>{})};
 },[active,keepAwake,visible]);

 function vibrate(){try{return navigator.vibrate?.([400,150,400,150,600])||false}catch{return false}}
 function playTone(){
  const ctx=audio.current;if(!ctx||ctx.state!=='running')return false;
  try{
   for(let i=0;i<3;i++){
    const oscillator=ctx.createOscillator(),gain=ctx.createGain(),at=ctx.currentTime+i*.45;
    oscillator.frequency.value=i===1?1046:784;gain.gain.setValueAtTime(0,at);
    gain.gain.linearRampToValueAtTime(.2,at+.02);gain.gain.exponentialRampToValueAtTime(.001,at+.3);
    oscillator.connect(gain);gain.connect(ctx.destination);oscillator.start(at);oscillator.stop(at+.32);
    oscillator.onended=()=>{oscillator.disconnect();gain.disconnect()};
   }
   return true;
  }catch{return false}
 }
 async function testAlert(){
  vibrate();
  try{
   const Audio=window.AudioContext||window.webkitAudioContext;
   if(!Audio)throw Error();
   if(!audio.current||audio.current.state==='closed'){
    audio.current=new Audio();
    audio.current.onstatechange=()=>{if(audio.current?.state!=='running')setSound('blocked')};
   }
   // Called from the user's tap, as required by mobile browsers.
   await audio.current.resume();
   setSound(playTone()?'on':'blocked');
  }catch{setSound('blocked')}
 }
 async function enableNotifications(){
  if(!('Notification' in window)||!('serviceWorker' in navigator)){setNotification('unsupported');return}
  try{
   const permission=await Notification.requestPermission();
   setNotification(permission==='granted'?'on':permission==='denied'?'blocked':'off');
  }catch{setNotification('unsupported')}
 }
 async function notify(name){
  if(notification!=='on'||!('Notification' in window)||Notification.permission!=='granted')return;
  try{
   // Never wait indefinitely for a worker that failed to install offline.
   const registration=await navigator.serviceWorker.getRegistration();
   if(!registration?.active)throw Error();
   await registration.showNotification(tr('Time to alight',locale),{
    body:tr('Approaching',locale)+' '+name+' '+tr('— prepare to alight.',locale),
    tag:'nextstop-arrival',icon:'./icons/icon-192.png',data:{url:new URL('./',location.href).href}
   });
  }catch{setNotification('blocked')}
 }
 useEffect(()=>{
  if(!active||!result||gpsError||!stop)return;
  if(result.leftArea){setReminder(current=>({...current,waitForDeparture:false}));return}
  if(!result.shouldFire||lastFired.current===reminder.armedAt)return;
  lastFired.current=reminder.armedAt;
  setReminder(current=>({...current,firedAt:Date.now()}));
  vibrate();if(sound==='on'&&!playTone())setSound('blocked');
  void notify(stop.name);
 },[reminder,pos,now,visible,resumed,gpsError,stop]);

 function arm(route,index,start){
  try{
   const record=createReminder(route,db[route.op]?.byId[route.stops[index]],index,start,pos,radius);
   if(gpsError)throw Error('A fresh, precise location is needed. Refresh location and try again.');
   setReminder(record);setResumed(true);setNow(Date.now());lastFired.current=null;locate();return '';
  }catch(error){locate();return error.message}
 }
 function resume(){setResumed(true);setNow(Date.now());locate()}
 function cancel(){setReminder(null);setResumed(false);try{navigator.vibrate?.(0)}catch{}}
 const expired=result?.status==='expired';
 const unavailable=!loading&&reminder&&!hasCoordinates(stop);
 let status=!resumed?'Saved reminder — resume your trip':gpsError||{
  missing:'Waiting for location…',stale:'Location is old. Refresh location to continue.',
  inaccurate:'Location is not precise enough. Allow precise location or try near a window.',
  hidden:'Paused while the app is hidden.',unavailable:'This stop has no GPS coordinates. Arrival reminders are unavailable.',
  depart:'Already near this stop. Leave the reminder area, then return to trigger the alert.',
  tracking:'Watching your distance to the stop.'
 }[result?.status];
 if(loading&&!stop)status='Loading your saved destination…';
 if(unavailable)status='The saved route or stop has changed. Cancel and select your destination again.';
 if(expired)status='This reminder expired after four hours. Set a new reminder for your next trip.';
 if(reminder?.firedAt!==null&&reminder)status='Approaching';
 const settings=<>
  <p>Reminders use straight-line distance, not a count of stops. Choose your alert distance before setting a reminder.</p>
  <label>Alert distance<select className="field" value={radius} onChange={e=>setRadius(Number(e.target.value))}>{REMINDER_DISTANCES.map(n=><option key={n} value={n}>{n+' m'}</option>)}</select></label>
  <label className="reminder-check"><input type="checkbox" checked={keepAwake} onChange={e=>setKeepAwake(e.target.checked)}/>Keep screen on during a reminder</label>
  <div className="actions"><button className="reminder-primary" onClick={testAlert}>Enable sound & test alert</button><button onClick={enableNotifications}>Enable phone notifications</button></div>
  <p role="status">{sound==='on'?'Sound enabled for this session. Test again after reopening.':sound==='blocked'?'Sound could not play. Tap test again and check your volume.':'Sound is off. Tap the test button to enable it.'}</p>
  <p>Keep media volume audible. iPhone and iPad browsers do not provide vibration.</p>
  <p role="status">{notification==='on'?'Phone notifications enabled for this session.':notification==='blocked'?'Phone notification unavailable. Check permissions and reopen the app online.':notification==='unsupported'?'Phone notifications are unavailable here. On iPhone or iPad, install to the Home Screen and open from its icon.':'Phone notifications are optional; the on-screen alert always remains available.'}</p>
  <p>Notifications can be sent only when this open app detects your arrival. They do not enable tracking while locked or in the background.</p>
  <p>Android: allow precise location for Chrome and this site. iPhone / iPad: allow location for Safari or the installed app and enable Precise Location.</p>
 </>;
 const panel=reminder&&<section className={'surface reminder-panel'+(reminder.firedAt!==null?' reminder-arrived':'')} aria-label="Arrival reminder">
  <h2 ref={alarmHeading} tabIndex={-1}>{reminder.firedAt!==null?'Time to alight':'Arrival reminder'}</h2>
  <p><strong>{route?.route} {stop?.name||reminder.stopId}</strong></p>
  <div role={reminder.firedAt!==null?'alert':'status'}><p>{status}{reminder.firedAt!==null&&<> {stop?.name} — prepare to alight.</>}</p></div>
  {reminder.firedAt===null&&<>
   <p>{Number.isFinite(result?.distance)?Math.round(result.distance)+' m away · straight-line distance':''}</p>
   <p>Alert distance: {reminder.radius} m</p>
   {pos&&<p>{'GPS accuracy ±'+Math.round(pos.accuracy)+' m'}</p>}
   <p>{wakeStatus==='on'?'Screen is being kept on.':wakeStatus==='unsupported'?'Screen-awake support is unavailable. Keep your screen on manually.':wakeStatus==='blocked'||wakeStatus==='released'?'Screen may turn off. Keep it on manually or retry.':'Keep this app visible and your screen unlocked.'}</p>
   <p>Locking the phone or switching apps pauses location reminders.</p>
   {storageError&&<p>Could not save this reminder. Keep this session open.</p>}
  </>}
  <div className="actions">
   {!resumed&&!expired&&!unavailable&&!loading&&reminder.firedAt===null&&<button className="reminder-primary" onClick={resume}>Resume reminder</button>}
   {active&&<><button onClick={locate}>Refresh location</button><button onClick={testAlert}>Test alert</button>{(wakeStatus==='released'||wakeStatus==='blocked')&&<button onClick={()=>{setKeepAwake(false);setTimeout(()=>setKeepAwake(true),0)}}>Retry keeping screen on</button>}</>}
   <button onClick={cancel}>{reminder.firedAt!==null?'Dismiss alert':'Cancel reminder'}</button>
  </div>
  {active&&sound!=='on'&&<p>Sound is off. Use Test alert to enable it for this session.</p>}
 </section>;
 return {arm,settings:localizedTree(settings,locale),panel:localizedTree(panel,locale)};
}
