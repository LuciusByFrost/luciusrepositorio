const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {boot}=require('./game_fixture.cjs');
const pending=[],draws=[],scales=[];
class Image{constructor(){pending.push(this)}load(){this.complete=true;this.naturalWidth=887;this.naturalHeight=1774;this.onload()}}
const ctx=new Proxy({drawImage(...a){draws.push(a)},scale(...a){scales.push(a)}},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
const box={URL,Image,console,document:{currentScript:{src:'file:///game/js/iris_sprite.js'},createElement:()=>({getContext:()=>ctx})}};
vm.createContext(box);
for(const f of ['js/nopal_sprite.js','assets/characters/iris/atlas.js','js/iris_sprite.js'])vm.runInContext(fs.readFileSync(f,'utf8'),box);
const S=vm.runInContext('IrisSprite',box),M=vm.runInContext('IrisAtlas',box),p={characterId:'iris'};
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(M.source)).digest('hex').toUpperCase(),M.sourceSHA256);
assert.equal(M.frames.length,32);assert(M.transparentPixels>0);assert(M.partialAlphaPixels>0);
assert(!S.active(p));pending.at(-1).load();assert(S.active(p));assert(pending.at(-1).src.endsWith('/assets/characters/iris/iris_spritesheet.png'));
for(const f of M.frames){assert(f.x>=0&&f.y>=0&&f.x+f.w<=887&&f.y+f.h<=1774);assert(f.anchor[0]>=f.x&&f.anchor[0]<f.x+f.w);assert.equal(f.anchor[1],f.y+f.h)}
for(let dir=0;dir<8;dir++)for(let col=0;col<4;col++){
 const sample={...p,visualDirection:dir,visualMoving:true,irisWalkTime:(col+.1)/8,attack:.2,weaponAngle:2};
 assert.equal(S.pose(sample,100).frame,dir*4+col,'attack must not select another row');
 const before=JSON.stringify(sample);S.draw(ctx,sample,2.3,4.8,100);assert.equal(JSON.stringify(sample),before);
 const call=draws.at(-1);assert(call.slice(1).every(Number.isInteger));assert.equal(call[6]+call[8],22,'feet baseline');
 assert.equal(S.pose({...sample,visualMoving:false},999).frame,dir*4);
}
assert.equal(scales.length,0,'authored art must never mirror');assert.equal(ctx.imageSmoothingEnabled,false);
pending.at(-1).onerror();assert(!S.active(p));
const fixture=boot();fixture.p.newGame('iris');const g=fixture.p.game;
const dirs=[['s'],['s','a'],['a'],['w','a'],['w'],['w','d'],['d'],['s','d']];
for(let dir=0;dir<8;dir++){
 fixture.p.keys.clear();for(const key of dirs[dir])fixture.p.keys.add(key);
 fixture.p.update(.02);assert.equal(g.player.visualDirection,dir);assert(g.player.irisWalkTime>0);
 fixture.p.keys.clear();fixture.p.update(.02);assert.equal(g.player.visualDirection,dir);assert.equal(g.player.irisWalkTime,0);
}
assert.equal(g.player.r,15);assert.equal(g.player.startWeapon,'lasso');
const source=fs.readFileSync('js/main.js','utf8');
const previous=source.replace("if(p.characterId==='iris'){if(n>0)p.irisWalkTime=(p.irisWalkTime||0)+dt;else p.irisWalkTime=0}",'').replace("(p.characterId==='bento'||p.characterId==='iris')","p.characterId==='bento'");
assert.notEqual(previous,source);
const plain=g=>JSON.parse(JSON.stringify(g,(k,v)=>['irisWalkTime','visualDirection'].includes(k)?undefined:v));
for(const evolved of [false,true]){
 const old=boot({mainSource:previous}),now=boot();
 for(const f of [old,now]){
  f.p.newGame('iris');f.p.game.spawn=100;
  Object.assign(f.p.spawnEnemy('brute'),{x:70,y:0,hp:100000,maxHp:100000,speed:0});
  for(const w of Object.values(f.p.game.weapons))Object.assign(w,{level:1,evolved,cool:0,cd:.3});
 }
 for(let i=0;i<180;i++){
  for(const f of [old,now]){f.p.keys.clear();for(const key of dirs[Math.floor(i/24)%8])f.p.keys.add(key);f.p.update(1/60)}
  assert.deepEqual(plain(now.p.game),plain(old.p.game),'Iris gameplay/RNG changed at '+i);
 }
}
for(const screen of ['pause','upgrade','knowledge','dead']){fixture.p.setScreen(screen);const before=JSON.stringify(g);fixture.p.update(.1);assert.equal(JSON.stringify(g),before)}
console.log('PASS Iris: source hash/alpha, 32 crops, eight directions/four frames, foot anchors, no mirroring, rest, attacks independent, pure draw, fallback, movement, hitbox and pause.');
console.log('PASS Iris: 180-frame all-weapon gameplay/RNG equivalence, normal and evolved.');
