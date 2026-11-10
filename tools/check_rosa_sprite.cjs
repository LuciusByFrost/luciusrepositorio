// Rosa uses the shared renderer, but only actual shotgun events can fire her sheet.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {boot}=require('./game_fixture.cjs');
let created=0;const pending=[],calls=[];
class FakeImage{constructor(){pending.push(this)}load(){this.complete=true;this.naturalWidth=this.naturalHeight=384;this.onload()}}
const ctx=new Proxy({drawImage(...args){calls.push(args)}},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
const box={URL,Image:FakeImage,document:{currentScript:{src:'file:///game/js/rosa_sprite.js'},createElement(){created++;return {getContext:()=>ctx}}}};
vm.createContext(box);
for(const file of ['assets/characters/nopal/atlas.js','js/nopal_sprite.js','assets/characters/rosa/atlas.js','js/rosa_sprite.js'])vm.runInContext(fs.readFileSync(file,'utf8'),box);
const S=vm.runInContext('RosaSprite',box),N=vm.runInContext('NopalSprite',box),M=vm.runInContext('RosaAtlas',box);
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(M.source)).digest('hex').toUpperCase(),M.sourceSHA256,'source PNG changed');
assert.equal(M.frames.length,16);assert.equal(M.scale,.225);
const p={characterId:'rosa',startWeapon:'shotgun',facing:1,invuln:0};
assert(!S.active(p));pending[2].load();assert(!S.active(p),'both layers must load');pending[3].load();assert(S.active(p));
assert(pending.slice(2).every(img=>img.src.startsWith('file:///game/assets/characters/rosa/')),'nonlocal asset path');
for(const characterId of ['nopal','bento','iris',undefined])assert(!S.active({...p,characterId}));
assert(!S.pose({...p,attack:.18,nopalShotAt:1},1).shooting,'generic/revolver attack animated shotgun');
for(const [age,frame] of [[0,8],[.04,9],[.12,10],[.24,11],[.33,1]])assert.equal(S.pose({...p,rosaShotAt:1,rosaShotAngle:0},1+age).frame,frame);
for(const visualBack of [false,true])for(let col=0;col<4;col++)assert.equal(S.pose({...p,visualBack,visualMoving:true,visualStride:col*Math.PI/2+.1},1).frame,(visualBack?12:4)+col);
assert.equal(S.pose({...p,visualBack:true},1).frame,12);
for(const angle of [0,Math.PI/2,Math.PI,-Math.PI/2,-2.3,2.3])for(const facing of [-1,1]){
 const sample={...p,facing,rosaShotAt:1,rosaShotAngle:angle},before=JSON.stringify(sample),n=calls.length;
 S.draw(ctx,sample,10.3,20.8,1.04);assert.equal(JSON.stringify(sample),before);assert.equal(ctx.imageSmoothingEnabled,false);
 const draws=calls.slice(n);assert.equal(draws.length,3,'one body, one weapon raster, one composed shotgun');
 assert(draws[0].slice(1).every(Number.isInteger));assert(draws.at(-1).slice(1).every(Number.isInteger));
}
calls.length=0;S.draw(ctx,{...p,heldWeapon:'revolver'},0,0,1);assert.equal(calls.length,1,'baked shotgun remained with another weapon');
assert.equal(created,2,'per-frame canvas allocation');pending[3].onerror();assert(!S.active(p),'failed image did not restore fallback');
pending[0].load();pending[1].load();assert(N.active({characterId:'nopal'}),'Rosa image failure affected Nopal');
const f=boot();f.p.newGame('rosa');const g=f.p.game;
f.p.fireWeapon(g.weapons.shotgun);assert.equal(g.player.rosaShotAt,undefined,'no target should produce no animation');
const target=f.p.spawnEnemy('brute');Object.assign(target,{x:-100,y:-40,hp:100000,maxHp:100000,speed:0});
g.time=1;f.p.fireWeapon(g.weapons.shotgun);assert.equal(g.player.rosaShotAt,1);assert.equal(g.shots.length,5);assert.equal(S.pose(g.player,1.04).face,-1);
const shot=g.player.rosaShotAt;f.p.fireWeapon(g.weapons.revolver);assert.equal(g.player.rosaShotAt,shot);assert(!S.pose(g.player,1.04).shooting);
f.p.fireWeapon(g.weapons.shotgun);
for(const screen of ['pause','upgrade','knowledge','dead']){
 f.p.setScreen(screen);const before=JSON.stringify(g),pose=JSON.stringify(S.pose(g.player,g.time));f.p.update(1);
 assert.equal(JSON.stringify(g),before);assert.equal(JSON.stringify(S.pose(g.player,g.time)),pose);
}
assert.equal(g.player.r,15);assert.equal(g.player.speed,205);assert.equal(g.weapons.shotgun.damage,11);
// Compare Rosa with the same code before the purely visual shotgun notification.
const source=fs.readFileSync('js/main.js','utf8'),previous=source.replace("if(w.id==='shotgun'&&p.characterId==='rosa'){p.rosaShotAt=game.time;p.rosaShotAngle=p.weaponAngle||0}",'');
assert.notEqual(previous,source,'baseline event was not removed');
const plain=g=>JSON.parse(JSON.stringify(g,(k,v)=>['rosaShotAt','rosaShotAngle'].includes(k)?undefined:v));
for(const evolved of [false,true]){
 const old=boot({mainSource:previous}),now=boot();
 for(const fixture of [old,now]){
  fixture.p.newGame('rosa');const game=fixture.p.game;game.spawn=100;
  const e=fixture.p.spawnEnemy('brute');Object.assign(e,{x:90,y:0,hp:100000,maxHp:100000,speed:0});
  for(const w of Object.values(game.weapons))Object.assign(w,{level:1,evolved,cool:0,cd:.3});
 }
 for(let i=0;i<180;i++){
  for(const fixture of [old,now]){fixture.p.keys.add(i<90?'w':'a');fixture.p.update(1/60)}
  assert.deepEqual(plain(now.p.game),plain(old.p.game),'Rosa combat/RNG changed at frame '+i);
 }
}
console.log('PASS: Rosa original hash, local alpha atlas, all animation states/facings, one shotgun, alternate weapons, fallback independent of Nopal, actual shot/no target, pause, render purity; 180-frame all-weapon combat equivalence, normal/evolved.');
