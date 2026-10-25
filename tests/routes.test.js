import test from 'node:test';
import assert from 'node:assert/strict';
import {searchRoutes} from '../src/core.js';
import {readFileSync} from 'node:fs';
test('standard directions precede all variants in every bundled KMB route',()=>{
 const db={KMB:JSON.parse(readFileSync('dist/data/KMB.json'))};
 for(const route of new Set(db.KMB.routes.map(r=>r.route))){
 const result=searchRoutes(db,route).filter(r=>r.route===route);
 const directions=new Set(result.map(r=>r.dir));
 assert.equal(new Set(result.slice(0,directions.size).map(r=>r.dir)).size,directions.size,route);
 for(const r of result.slice(0,directions.size)) if(result.some(x=>x.dir===r.dir&&x.service==='1'))assert.equal(r.service,'1',route);
 }
});
test('exact number precedes suffix routes and blank input is empty',()=>{
 const db={KMB:{routes:[{id:'a',route:'1A',dir:'O',service:'1'},{id:'b',route:'1',dir:'O',service:'2'},{id:'c',route:'1',dir:'I',service:'1'},{id:'d',route:'1',dir:'O',service:'1'}]}};
 assert.deepEqual(searchRoutes(db,' 1 ').map(r=>r.id),['c','d','b','a']);assert.deepEqual(searchRoutes(db,''),[]);
});

test('nearest boarding compares directions, excludes terminus and handles missing location',async()=>{
 const {nearestBoarding}=await import('../src/core.js');
 const db={KMB:{byId:{a:{lat:22.3,lng:114.171},b:{lat:22.3,lng:114.174},end:{lat:22.3,lng:114.17}}}};
 const routes=[{op:'KMB',dir:'O',stops:['b','end']},{op:'KMB',dir:'I',stops:['a','end']}];
 const result=nearestBoarding(routes,db,{lat:22.3,lng:114.17});
 assert.equal(result.route.dir,'I');assert.equal(result.index,0);assert.equal(result.stop,db.KMB.byId.a);
 assert.equal(nearestBoarding(routes,db,null),null);
 assert.equal(nearestBoarding([routes[0]],db,{lat:22.3,lng:114.17}).route.dir,'O');
});

test('variant descriptions use stop differences without guessing operating schedules',async()=>{
 const {routeVariant}=await import('../src/core.js');
 const base={route:'X',dir:'O',service:'1',stops:['a','b','c']};
 const db={routes:[base],byId:{a:{name:'Alpha'},b:{name:'Beta'},c:{name:'Gamma'}}};
 assert.equal(routeVariant(base,db).kind,'Standard route');
 const skip=routeVariant({...base,service:'2',stops:['a','c']},db);
 assert.equal(skip.kind,'Alternative stopping pattern');assert.deepEqual(skip.details,[{label:'Does not serve',value:'Beta'}]);
 assert.equal(routeVariant({...base,service:'3',stops:['b','c']},db).kind,'Different starting stop');
 assert.equal(routeVariant({...base,service:'4'},db).kind,'Alternative service');
});
