// Real event/paused simulation plus loaded, pending and failed image render paths.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {boot}=require('./game_fixture.cjs');
const calls=[];let created=0;const pending=[];
class FakeImage{constructor(){pending.push(this)}load(){this.complete=true;this.naturalWidth=this.naturalHeight=384;this.onload()}}
const ctx=new Proxy({drawImage(...args){calls.push(args)}},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
const box={URL,Image:FakeImage,document:{currentScript:{src:'file:///game/js/nopal_sprite.js?v=verification'},createElement(){created++;return {getContext:()=>ctx}}}};
vm.createContext(box);
for(const file of ['assets/characters/nopal/atlas.js','js/nopal_sprite.js'])vm.runInContext(fs.readFileSync(file,'utf8'),box);
const S=vm.runInContext('NopalSprite',box),M=vm.runInContext('NopalAtlas',box);
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(M.source)).digest('hex').toUpperCase(),M.sourceSHA256,'source PNG changed');
assert.equal(M.frames.length,16);assert.equal(M.scale,.225);
const p={characterId:'nopal',startWeapon:'revolver',facing:1,invuln:0};
assert(!S.active(p),'pending image must use procedural fallback');pending[0].load();assert(!S.active(p),'both images must be ready');pending[1].load();assert(S.active(p));
assert.equal(S.status().state,'ready');
assert(S.status().images.every(img=>img.url.startsWith('file:///game/assets/characters/nopal/')&&img.url.endsWith('?v=verification')),'asset revision or root path lost');
for(const characterId of ['rosa','bento','iris',undefined])assert(!S.active({...p,characterId}));
assert(!S.pose({...p,attack:.18},1).shooting,'generic attack must not fire the revolver');
for(const [age,frame] of [[0,8],[.04,9],[.12,10],[.24,11],[.33,1]])assert.equal(S.pose({...p,nopalShotAt:1,nopalShotAngle:0},1+age).frame,frame);
for(const visualBack of [false,true])for(let col=0;col<4;col++){
 const a=S.pose({...p,visualBack,visualMoving:true,visualStride:col*Math.PI/2+.1},1);
 assert.equal(a.frame,(visualBack?12:4)+col);
}
assert.equal(S.pose({...p,visualBack:true},1).frame,12,'back idle must not walk in place');
for(const angle of [0,Math.PI/2,Math.PI,-Math.PI/2,-2.3,2.3])for(const facing of [-1,1])for(let col=0;col<4;col++){
 const sample={...p,facing,visualMoving:true,visualStride:col*Math.PI/2,nopalShotAt:1,nopalShotAngle:angle};
 const before=JSON.stringify(sample),n=calls.length;
 S.draw(ctx,sample,10.3,20.8,1.04);
 assert.equal(JSON.stringify(sample),before,'draw mutated pose');assert.equal(ctx.imageSmoothingEnabled,false);
 const draws=calls.slice(n);assert.equal(draws.length,3,'one body, one arm raster and one composited gun');
 assert(draws[0].slice(1).every(Number.isInteger),'body must use integer, unscaled pixels');
 assert(draws.at(-1).slice(1).every(Number.isInteger));
}
calls.length=0;S.draw(ctx,{...p,heldWeapon:'shotgun'},0,0,1);assert.equal(calls.length,1,'other weapons must not retain the baked revolver');
assert.equal(created,1,'draw allocated canvases');pending[1].onerror();assert(!S.active(p),'failed image must restore procedural fallback');
assert.equal(S.status().state,'error');
// Drive actual combat events (including no-target and overlapping weapons).
const f=boot(),g=f.p.game;
f.p.fireWeapon(g.weapons.revolver);assert.equal(g.player.nopalShotAt,undefined,'no target cannot animate a shot');
const target=f.p.spawnEnemy('brute');Object.assign(target,{x:-100,y:-40,hp:100000,maxHp:100000,speed:0});
g.time=1;f.p.fireWeapon(g.weapons.revolver);
assert.equal(g.player.nopalShotAt,1);assert.equal(g.shots.length,1);
assert.equal(g.player.nopalShotAngle,Math.atan2(-40,-100));assert.equal(S.pose(g.player,1.04).face,-1);
const shot=g.player.nopalShotAt;f.p.fireWeapon(g.weapons.shotgun);assert.equal(g.player.nopalShotAt,shot);assert(!S.pose(g.player,1.04).shooting);
f.p.keys.add('w');f.p.update(.01);assert.equal(g.player.visualBack,true);
f.p.keys.clear();f.p.keys.add('s');f.p.update(.01);assert.equal(g.player.visualBack,false);
f.p.fireWeapon(g.weapons.revolver);
for(const screen of ['pause','upgrade','knowledge','dead']){
 f.p.setScreen(screen);const before=JSON.stringify(g),pose=JSON.stringify(S.pose(g.player,g.time));
 f.p.update(1);assert.equal(JSON.stringify(g),before);assert.equal(JSON.stringify(S.pose(g.player,g.time)),pose);
}
assert.equal(g.player.r,15);assert.equal(g.player.speed,205);assert.equal(g.weapons.revolver.damage,16);
console.log('PASS: source hash; 16 frames; local loading/failure; four rows, both facings, aimed arm, no duplicated gun; actual shot/no target/other weapon; paused simulation and render purity.');
