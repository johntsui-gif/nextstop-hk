import test from 'node:test';import assert from 'node:assert/strict';
import {tr,chinese,localizeDirectory} from '../src/i18n.js';
import {parseBus} from '../src/core.js';
test('English, Traditional and Simplified interface labels differ correctly',()=>{assert.equal(tr('Preferred transport','en'),'Preferred transport');assert.equal(tr('Preferred transport','zh-Hant'),'偏好交通方式');assert.equal(tr('Saved','zh-Hant'),'已收藏');assert.equal(tr('Install app','zh-Hans'),'安装应用程序');});
test('Chinese conversion is local and preserves identifiers',()=>{assert.equal(chinese('荃灣 968','zh-Hans'),'荃湾 968');});
test('ETA uses provider Chinese destination and remarks',()=>{const r=parseBus({data:[{route:'1',dest_en:'CENTRAL',dest_tc:'中環',rmk_tc:'未開出'}]},'CTB','s','zh-Hans');assert.equal(r[0].dest,'中环');assert.equal(r[0].note,'未开出');});
test('Directory localization preserves route IDs and coordinates',()=>{const d={MTR:{stops:[{id:'CEN',name:'Central',tc:'中環',lat:22,lng:114}],routes:[{id:'TWL-UP',dest:'Central',destTc:'中環',stops:['CEN']}]}};const r=localizeDirectory(d,'zh-Hans');assert.equal(r.MTR.byId.CEN.name,'中环');assert.equal(r.MTR.byId.CEN.lat,22);assert.equal(r.MTR.routes[0].id,'TWL-UP');});

test('Material navigation and settings are translated in both Chinese locales',()=>{
 for(const label of ['Find your minibus','Find your light rail','Color palette','Launch screen','Open the app on','Install NextStop','Nearby radius','Arrival reminders','Official timetable & fares ↗','No current predictions. Check the official timetable.']){
  assert.notEqual(tr(label,'zh-Hant'),label);
  assert.notEqual(tr(label,'zh-Hans'),label);
 }
 assert.equal(tr('Color palette','zh-Hans'),'配色');
 assert.equal(tr('Launch screen','zh-Hans'),'启动页面');
});
