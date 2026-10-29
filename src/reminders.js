import {haversine} from './core.js';

export const REMINDER_KEY='nextstop-arrival-reminder';
export const REMINDER_LIFETIME=4*60*60*1000;
export const REMINDER_DISTANCES=[300,500,1000];

export function hasCoordinates(stop){
 return Number.isFinite(stop?.lat)&&Math.abs(stop.lat)<=90&&Number.isFinite(stop?.lng)&&Math.abs(stop.lng)<=180;
}

export function locationStatus(pos,now=Date.now()){
 if(!hasCoordinates(pos))return 'missing';
 if(!Number.isFinite(pos.at)||now-pos.at>30000||pos.at>now+5000)return 'stale';
 if(!Number.isFinite(pos.accuracy)||pos.accuracy<0||pos.accuracy>100)return 'inaccurate';
 return 'ready';
}

// Only route/stop references and trip state are saved. Never persist GPS fixes.
export function restoreReminder(value,now=Date.now()){
 if(!value||value.version!==1||typeof value.route!=='string'||typeof value.stopId!=='string'||
  !Number.isInteger(value.target)||value.target<1||!REMINDER_DISTANCES.includes(value.radius)||
  !Number.isFinite(value.armedAt)||value.armedAt>now||!Number.isFinite(value.expiresAt)||
  value.expiresAt<=now||value.expiresAt>value.armedAt+REMINDER_LIFETIME||value.expiresAt<=value.armedAt||
  typeof value.waitForDeparture!=='boolean'||(value.firedAt!==null&&(!Number.isFinite(value.firedAt)||value.firedAt<value.armedAt||value.firedAt>now)))return null;
 return {version:1,route:value.route,stopId:value.stopId,target:value.target,radius:value.radius,
  armedAt:value.armedAt,expiresAt:value.expiresAt,waitForDeparture:value.waitForDeparture,firedAt:value.firedAt};
}

export function createReminder(route,stop,target,start,pos,radius=500,now=Date.now()){
 if(!hasCoordinates(stop))throw Error('This stop has no GPS coordinates. Arrival reminders are unavailable.');
 if(locationStatus(pos,now)!=='ready')throw Error('A fresh, precise location is needed. Refresh location and try again.');
 if(!Number.isInteger(start)||target<=start)throw Error('Select a destination after your boarding stop.');
 if(!Number.isInteger(target)||target>=route.stops.length||route.stops[target]!==stop.id)throw Error('Select a valid destination stop.');
 if(!REMINDER_DISTANCES.includes(radius))throw Error('Select a reminder distance.');
 return {version:1,route:route.op+':'+route.id,stopId:stop.id,target,radius,armedAt:now,
  expiresAt:now+REMINDER_LIFETIME,waitForDeparture:haversine(pos,stop)<=radius,firedAt:null};
}

export function evaluateReminder(reminder,stop,pos,now=Date.now(),visible=true){
 if(now>=reminder.expiresAt)return {status:'expired'};
 if(reminder.firedAt!==null)return {status:'arrived'};
 if(!visible)return {status:'hidden'};
 if(!hasCoordinates(stop))return {status:'unavailable'};
 const status=locationStatus(pos,now);
 if(status!=='ready')return {status};
 const distance=haversine(pos,stop);
 // A destination may share coordinates with the boarding stop on a loop.
 // Require leaving the area before returning; GPS noise alone cannot arm it.
 if(reminder.waitForDeparture)return {status:'depart',distance,leftArea:distance>reminder.radius+150};
 return {status:'tracking',distance,shouldFire:distance<=reminder.radius};
}
