const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {boot}=require('./game_fixture.cjs');
const pending=[],calls=[];let created=0;
class ImageMock{constructor(){pending.push(this)}load(w,h){this.complete=true;this.naturalWidth=w;this.naturalHeight=h;this.onload()}}
const ctx=new Proxy({drawImage(...args){calls.push(args)}},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
const box={URL,Image:ImageMock,document:{currentScript:{src:'file:///game/js/bento_sprite.js?v=check'},createElement(){created++;return {getContext:()=>ctx}}}};
vm.createContext(box);
for(const file of ['js/nopal_sprite.js','assets/characters/bento/atlas.js','js/bento_sprite.js'])vm.runInContext(fs.readFileSync(file,'utf8'),box);
const S=vm.runInContext('BentoSprite',box),M=vm.runInContext('BentoAtlas',box);
for(const sheet of ['actions','walk']){
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync(M[sheet].source)).digest('hex').toUpperCase(),M[sheet].sourceSHA256);
 assert.equal(M[sheet].frames.length,sheet==='actions'?16:32);
 for(const f of M[sheet].frames){assert.equal(f.visibleBounds[3],71);assert(f.visibleBounds[0]>=2&&f.visibleBounds[2]<=93&&f.visibleBounds[1]>=2)}
}
const p={characterId:'bento',startWeapon:'dynamite',facing:1,invuln:0};
assert(!S.active(p));pending[0].load(384,384);assert(!S.active(p));pending[1].load(384,768);assert(S.active(p));
assert(S.status().images.every(i=>i.url.startsWith('file:///game/assets/characters/bento/')&&i.url.endsWith('?v=check')));
for(const characterId of ['nopal','rosa','iris'])assert(!S.active({...p,characterId}));
const vectors=[[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1],[1,0],[1,1]];
assert.equal(S.direction(0,0),null);
for(const [dir,[dx,dy]] of vectors.entries()){
 assert.equal(S.direction(dx,dy),dir);
 for(let col=0;col<4;col++){
  const a=S.pose({...p,visualMoving:true,visualDirection:dir,visualStride:col*Math.PI/2+.01},1);
  assert.equal(a.sheet,'walk');assert.equal(a.frame,dir*4+col);assert.equal(a.face,1,'authored directions must not be mirrored');
 }
 const sample={...p,visualMoving:false,visualDirection:dir,visualStride:17};
 const a=S.pose(sample,1),b=S.pose(sample,9);assert.deepEqual(a,b,'stopped walking advanced');assert.equal(a.frame,dir*4);
}
assert.equal(S.pose(p,0).sheet,'actions','selection must use the action idle');
assert.equal(S.pose({...p,bentoWindup:true},0).frame,8);
for(const [age,frame] of [[0,9],[.04,9],[.13,10],[.27,11]]){
 const a=S.pose({...p,bentoThrowAt:1,bentoThrowAngle:Math.PI},1+age);assert.equal(a.frame,frame);assert.equal(a.face,-1);
}
assert.equal(S.pose({...p,visualDirection:3,bentoThrowAt:1,bentoThrowAngle:0},1.4).frame,12,'throw did not restore last movement direction');
assert(!S.pose({...p,attack:.18,rosaShotAt:1,nopalShotAt:1},1).throwing);
assert.equal(S.pose({...p,heldWeapon:'revolver'},1).sheet,'walk','other weapons must not retain a held dynamite in the action idle');
for(const dir of vectors.keys())for(const visualMoving of [false,true]){
 const sample={...p,visualMoving,visualDirection:dir,visualStride:2},before=JSON.stringify(sample);calls.length=0;
 assert(S.draw(ctx,sample,10.5,20.7,1));assert.equal(calls.length,1,'procedural/detached dynamite duplicated');
 assert(calls[0].slice(1).every(Number.isInteger));assert.equal(ctx.imageSmoothingEnabled,false);assert.equal(JSON.stringify(sample),before);
}
assert.equal(created,2);pending[1].onerror();assert(!S.active(p));assert.equal(S.status().state,'error');
const f=boot();f.p.newGame('bento');const g=f.p.game;g.spawn=100;
for(const [dir,[dx,dy]] of vectors.entries()){
 f.p.keys.clear();if(dx)f.p.keys.add(dx<0?'a':'d');if(dy)f.p.keys.add(dy<0?'w':'s');
 g.weapons.dynamite.cool=10;f.p.update(.01);assert.equal(g.player.visualDirection,dir);
 f.p.keys.clear();f.p.update(.01);assert.equal(g.player.visualDirection,dir);assert.equal(g.player.visualMoving,false);
}
g.weapons.dynamite.cool=.09;f.p.update(.01);assert(g.player.bentoWindup);assert.equal(S.pose(g.player,g.time).frame,8);
g.enemies=[];g.shots=[];f.p.fireWeapon(g.weapons.dynamite);
assert.equal(g.player.bentoThrowAt,g.time);assert.equal(g.shots.length,1);const s=g.shots[0];
assert(Math.abs(Math.atan2(s.vy,s.vx)-g.player.bentoThrowAngle)<1e-12,'random targetless throw angle was not preserved');
assert.equal(S.pose(g.player,g.time).frame,9,'release must coincide with the real projectile');
const e=f.p.spawnEnemy('brute');Object.assign(e,{x:g.player.x-100,y:g.player.y-40,hp:100000,speed:0});
f.p.fireWeapon(g.weapons.dynamite);assert.equal(g.player.bentoThrowAngle,Math.atan2(-40,-100));
const at=g.player.bentoThrowAt;f.p.fireWeapon(g.weapons.revolver);assert.equal(g.player.bentoThrowAt,at);assert(!S.pose(g.player,g.time).throwing);
f.p.fireWeapon(g.weapons.dynamite);
for(const screen of ['pause','upgrade','knowledge','dead']){
 f.p.setScreen(screen);const before=JSON.stringify(g),pose=JSON.stringify(S.pose(g.player,g.time));f.p.update(1);
 assert.equal(JSON.stringify(g),before);assert.equal(JSON.stringify(S.pose(g.player,g.time)),pose);
}
assert.equal(g.player.r,15);assert.equal(g.player.speed,205);assert.equal(g.weapons.dynamite.damage,70);assert.equal(g.weapons.dynamite.cd,4.2);
// Deterministic comparison with the exact pre-integration logic; exclude only new visual fields.
const source=fs.readFileSync('js/main.js','utf8');
const previous=source.replace("if(n>0&&p.characterId==='bento')p.visualDirection=(Math.round(Math.atan2(-dx,dy)/(Math.PI/4))+8)%8;",'')
 .replace("if(p.characterId==='bento'){const bomb=g.weapons.dynamite;p.bentoWindup=!!(bomb.level&&bomb.cool>0&&bomb.cool<=.12)}",'')
 .replace("if(p.characterId==='bento'){p.bentoThrowAt=g.time;p.bentoThrowAngle=a}",'');
assert.notEqual(previous,source);
const plain=g=>JSON.parse(JSON.stringify(g,(k,v)=>['visualDirection','bentoWindup','bentoThrowAt','bentoThrowAngle'].includes(k)?undefined:v));
for(const evolved of [false,true]){
 const old=boot({mainSource:previous}),now=boot();
 for(const b of [old,now]){b.p.newGame('bento');b.p.game.spawn=100;for(const w of Object.values(b.p.game.weapons))Object.assign(w,{level:1,evolved,cd:.3,cool:0});const e=b.p.spawnEnemy('brute');Object.assign(e,{x:90,y:0,hp:100000,maxHp:100000,speed:0})}
 for(let i=0;i<180;i++){for(const b of [old,now]){b.p.keys.clear();b.p.keys.add(i<90?'w':'a');b.p.update(1/60)}assert.deepEqual(plain(now.p.game),plain(old.p.game),'Bento gameplay/RNG changed at '+i)}
}
console.log('PASS: Bento 48 crops/hashes/soles; eight directions and stopped orientation; real windup/release including random targetless throws; no extra bomb; local loading/fallback; pause/pure rendering; 180-frame all-weapon gameplay/RNG equivalence, normal/evolved.');
