const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {boot}=require('./game_fixture.cjs');
const pending=[],calls=[],scales=[];
class Image{constructor(){pending.push(this)}load(w,h){this.complete=true;this.naturalWidth=w;this.naturalHeight=h;this.onload()}}
const ctx=new Proxy({drawImage(...args){calls.push(args)},scale(...a){scales.push(a)}},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
const box={URL,Image,console,document:{currentScript:{src:'file:///game/js/nopal_sprite.js'},createElement:()=>({getContext:()=>ctx})}};
vm.createContext(box);
for(const path of ['assets/characters/nopal/atlas.js','assets/characters/nopal/walk_atlas.js','js/nopal_sprite.js'])vm.runInContext(fs.readFileSync(path,'utf8'),box);
const S=vm.runInContext('NopalSprite',box),M=vm.runInContext('NopalWalkAtlas',box);
const p={characterId:'nopal',startWeapon:'revolver',facing:1};
assert(!S.active(p));pending[0].load(384,384);pending[1].load(384,384);assert(!S.active(p));pending[2].load(887,1774);assert(S.active(p));
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(M.source)).digest('hex').toUpperCase(),M.sourceSHA256);assert.equal(M.frames.length,32);
assert(M.transparentPixels>0);assert.equal(S.status().images.length,3);
for(let dir=0;dir<8;dir++)for(let col=0;col<4;col++){
 const sample={...p,visualMoving:true,visualDirection:dir,nopalWalkTime:(col+.1)/8};
 assert.equal(S.pose(sample,1).frame,dir*4+col);assert.equal(S.pose(sample,1).sheet,'walk');
 calls.length=0;scales.length=0;const before=JSON.stringify(sample);S.draw(ctx,sample,3.2,8.9,1);
 assert.equal(JSON.stringify(sample),before);assert.equal(calls.length,1,'exactly one walking body with baked gun');assert.equal(scales.length,0);
 const d=calls[0];assert(d.slice(1).every(Number.isInteger));assert.equal(d[6]+d[8],22);
 for(const angle of [0,Math.PI,-Math.PI/2,Math.PI/2])for(const [age,frame] of [[0,8],[.04,9],[.12,10],[.24,11]]){
  const shot={...sample,nopalShotAt:1,nopalShotAngle:angle,heldWeapon:'shotgun'};
  const a=S.pose(shot,1+age);assert(a.shooting);assert.equal(a.sheet,'actions');assert.equal(a.frame,frame);if(Math.abs(Math.cos(angle))>.05)assert.equal(a.face,Math.sign(Math.cos(angle)));
  calls.length=0;S.draw(ctx,shot,0,0,1+age);assert.equal(calls.length,3);assert(calls.every(d=>d[0]!==pending[2]),'walking body overlapped attack');
  assert.equal(S.pose(shot,1.33).sheet,'walk');assert.equal(S.pose(shot,1.33).direction,dir);
  const rest=S.pose({...shot,visualMoving:false},1.33);assert.equal(rest.direction,dir);assert.equal(rest.sheet,[1,7].includes(dir)?'actions':'walk');
 }
}
for(const f of M.frames){assert(f.x>=0&&f.y>=0&&f.x+f.w<=887&&f.y+f.h<=1774);assert.equal(f.anchor[1],f.y+f.h);assert(Math.round(f.h*M.scale)>=55&&Math.round(f.h*M.scale)<=64)}
const fixture=boot(),g=fixture.p.game;
fixture.p.fireWeapon(g.weapons.revolver);assert.equal(g.shots.length,0);assert.equal(g.player.nopalShotAt,undefined);
Object.assign(fixture.p.spawnEnemy('brute'),{x:-100,y:0,hp:100000,maxHp:100000,speed:0});g.spawn=100;g.time=1;
fixture.p.fireWeapon(g.weapons.revolver);assert.equal(g.shots.length,1);assert.equal(g.player.nopalShotAt,1);assert.equal(S.pose(g.player,1.04).face,-1);
fixture.p.keys.add('d');const x=g.player.x;fixture.p.update(.04);assert(g.player.x>x);assert.equal(g.player.visualDirection,6);assert.equal(S.pose(g.player,g.time).face,-1);
fixture.p.keys.clear();fixture.p.update(.01);assert.equal(g.player.visualDirection,6);assert(!g.player.visualMoving);assert.equal(S.pose(g.player,1.4).frame,24);
const source=fs.readFileSync('js/main.js','utf8'),previous=source.replace("if(p.characterId==='nopal'){if(n>0)p.nopalWalkTime=(p.nopalWalkTime||0)+dt;else p.nopalWalkTime=0}",'').replace("||p.characterId==='nopal'",'');
assert.notEqual(previous,source);
const plain=g=>JSON.parse(JSON.stringify(g,(k,v)=>['nopalWalkTime','visualDirection'].includes(k)?undefined:v));
for(const evolved of [false,true]){
 const old=boot({mainSource:previous}),now=boot();
 for(const f of [old,now]){f.p.game.spawn=100;Object.assign(f.p.spawnEnemy('brute'),{x:70,y:0,hp:100000,maxHp:100000,speed:0});for(const w of Object.values(f.p.game.weapons))Object.assign(w,{level:1,evolved,cool:0,cd:.3})}
 for(let i=0;i<180;i++){for(const f of [old,now]){f.p.keys.clear();f.p.keys.add(i<90?'a':'d');f.p.update(1/60)}assert.deepEqual(plain(now.p.game),plain(old.p.game))}
}
pending[2].onerror();assert(!S.active(p));
console.log('PASS Nopal walk: 32 crops/hash/alpha, matching heights, feet y=22; all directions, attack priority/angles, single body, moving opposite shot, stop/recovery, actual one-projectile event, fallback; 180-frame all-weapon gameplay/RNG equivalence normal/evolved.');
