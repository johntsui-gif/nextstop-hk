import test from 'node:test';
import assert from 'node:assert/strict';
import {createReminder,evaluateReminder,locationStatus,restoreReminder,REMINDER_LIFETIME} from '../src/reminders.js';
import {tr} from '../src/i18n.js';

const now=Date.now();
const stop={id:'end',lat:22.3,lng:114.17};
const route={op:'KMB',id:'test-O',stops:['start','middle','end']};
const fix=(metres,extra={})=>({lat:stop.lat+metres/111195,lng:stop.lng,accuracy:10,at:now,...extra});
const armed=()=>createReminder(route,stop,2,0,fix(2500),500,now);

test('can trigger after missing all intermediate stop fixes',()=>{
 const reminder=armed();
 assert.equal(evaluateReminder(reminder,stop,fix(2500),now).shouldFire,false);
 assert.equal(evaluateReminder(reminder,stop,fix(400),now).shouldFire,true);
});
test('distance setting controls when the reminder fires',()=>{
 const reminder=createReminder(route,stop,2,0,fix(2500),300,now);
 assert.equal(evaluateReminder(reminder,stop,fix(400),now).shouldFire,false);
 assert.equal(evaluateReminder(reminder,stop,fix(200),now).shouldFire,true);
});
test('hidden, stale, inaccurate and invalid fixes cannot trigger',()=>{
 const reminder=armed();
 for(const pos of [fix(100,{at:now-30001}),fix(100,{at:now+5001}),fix(100,{accuracy:101}),fix(100,{accuracy:NaN}),fix(100,{accuracy:-1}),fix(100,{lat:NaN}),fix(100,{lng:181}),null]){
  assert.ok(!evaluateReminder(reminder,stop,pos,now).shouldFire);
 }
 assert.equal(evaluateReminder(reminder,stop,fix(100),now,false).status,'hidden');
 assert.equal(locationStatus(fix(100,{accuracy:100,at:now-30000}),now),'ready');
});
test('a newly armed reminder near its destination must leave the area first',()=>{
 let reminder=createReminder(route,stop,2,0,fix(100),500,now);
 assert.equal(reminder.waitForDeparture,true);
 assert.ok(!evaluateReminder(reminder,stop,fix(0),now).shouldFire);
 assert.ok(!evaluateReminder(reminder,stop,fix(550),now).leftArea);
 assert.equal(evaluateReminder(reminder,stop,fix(700),now).leftArea,true);
 reminder={...reminder,waitForDeparture:false};
 assert.equal(evaluateReminder(reminder,stop,fix(400),now).shouldFire,true);
});
test('rejects upstream targets, absent coordinates and unreliable starting fixes',()=>{
 assert.throws(()=>createReminder(route,stop,2,2,fix(2500),500,now),/after your boarding stop/);
 assert.throws(()=>createReminder(route,stop,2,undefined,fix(2500),500,now),/boarding stop/);
 assert.throws(()=>createReminder(route,{id:'end'},2,0,fix(2500),500,now),/no GPS coordinates/);
 assert.throws(()=>createReminder(route,stop,2,0,fix(2500,{accuracy:500}),500,now),/fresh, precise/);
});
test('saved reminders restore trip references without GPS data',()=>{
 const reminder=armed();
 assert.deepEqual(restoreReminder({...reminder,lat:22,lng:114,position:fix(0)},now),reminder);
 assert.equal(restoreReminder({...reminder,expiresAt:now+REMINDER_LIFETIME+1},now),null);
 assert.equal(restoreReminder({...reminder,target:'2'},now),null);
 assert.equal(restoreReminder({...reminder,waitForDeparture:'false'},now),null);
 assert.equal(restoreReminder({...reminder,firedAt:now+1},now),null);
 assert.equal(restoreReminder(reminder,now+REMINDER_LIFETIME),null);
 assert.equal(restoreReminder(null,now),null);
});
test('fired and expired reminders cannot trigger a second alert',()=>{
 const reminder=armed();
 assert.equal(evaluateReminder({...reminder,firedAt:now},stop,fix(100),now).status,'arrived');
 assert.equal(evaluateReminder(reminder,stop,fix(100),reminder.expiresAt).status,'expired');
});
test('mobile reminder controls and diagnostics translate in both Chinese locales',()=>{
 for(const text of ['Arrival reminder','Enable sound & test alert','Resume reminder','This stop has no GPS coordinates. Arrival reminders are unavailable.','Locking the phone or switching apps pauses location reminders.']){
  assert.notEqual(tr(text,'zh-Hant'),text);
  assert.notEqual(tr(text,'zh-Hans'),text);
 }
});
