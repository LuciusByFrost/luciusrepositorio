const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {boot}=require('./game_fixture.cjs');
const calls=[],rotations=[],pending=[];
class Image{constructor(){pending.push(this)}set src(v){this.url=v}get src(){return this.url}load(){const path=new URL(this.src).pathname.replace('/game/','');const png=fs.readFileSync(path);this.complete=true;this.naturalWidth=png.readUInt32BE(16);this.naturalHeight=png.readUInt32BE(20);this.onload()}}
const ctx=new Proxy({drawImage(...a){calls.push(a)},rotate(...a){rotations.push(a)}},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
const box={URL,Image,console,document:{currentScript:{src:'file:///game/js/weapon_sprites.js'},createElement:()=>({getContext:()=>ctx})}};vm.createContext(box);
for(const f of ['js/nopal_sprite.js','assets/weapons/atlas.js','js/weapon_sprites.js'])vm.runInContext(fs.readFileSync(f,'utf8'),box);
const S=vm.runInContext('WeaponSprites',box),M=vm.runInContext('WeaponAtlas',box);
assert(!S.ready());assert(!S.draw(ctx,'solar',0,0,0));for(const img of pending)img.load();assert(S.ready());
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(M.source)).digest('hex').toUpperCase(),M.sourceSHA256);assert(M.transparentPixels>0);assert(M.partialAlphaPixels>0);
for(const [id,data] of Object.entries(M.weapons)){
 assert.equal(data.frames.length,8);
 const sharedScale=S.geometry(id,0).scale;
 for(let dir=0;dir<8;dir++){
  const f=data.frames[dir];assert(f.x>=0&&f.y>=0&&f.x+f.w<=1254&&f.y+f.h<=1254);
  assert(f.pivot[0]>=0&&f.pivot[0]<f.w&&f.pivot[1]>=0&&f.pivot[1]<f.h,id+' grip outside crop '+dir);
  assert.equal(S.direction(dir*Math.PI/4),dir);
  const g=S.geometry(id,dir);assert.equal(g.scale,sharedScale,'per-view width normalization');assert(Math.max(g.w,g.h)<=data.worldSize);
  calls.length=0;const rendered=S.draw(ctx,id,50,70,dir*Math.PI/4);assert.equal(calls.length,1);assert(calls[0].slice(1).every(Number.isInteger));assert.equal(ctx.imageSmoothingEnabled,false);
  assert.equal(calls[0][5]+g.pivotX,50,'grip X');assert.equal(calls[0][6]+g.pivotY,70,'grip Y');
  if(f.muzzle){assert.equal(rendered.muzzle.x,calls[0][5]+Math.round(f.muzzle[0]*g.w/f.w));assert.equal(rendered.muzzle.y,calls[0][6]+Math.round(f.muzzle[1]*g.h/f.h))}
  const initial=calls[0].slice(1);calls.length=0;S.draw(ctx,id,50,70,dir*Math.PI/4,{scale:3});assert.deepEqual(calls[0].slice(1),initial,'weapon applied a second presentation scale');
 }
}
// Doubling the entire source sheet must produce exactly the same game geometry.
const doubled=JSON.parse(JSON.stringify(M));
for(const data of Object.values(doubled.weapons))for(const f of data.frames){for(const k of ['x','y','w','h'])f[k]*=2;f.pivot=f.pivot.map(v=>v*2);if(f.muzzle)f.muzzle=f.muzzle.map(v=>v*2)}
const other={WeaponAtlas:doubled,createAtlasHeroSprite:()=>({isReady:()=>false})};vm.createContext(other);vm.runInContext(fs.readFileSync('js/weapon_sprites.js','utf8'),other);
const D=vm.runInContext('WeaponSprites',other);
for(const id of Object.keys(M.weapons))for(let dir=0;dir<8;dir++){
 const a=S.geometry(id,dir),b=D.geometry(id,dir);for(const k of ['w','h','pivotX','pivotY'])assert.equal(a[k],b[k],'source resolution changed '+k);
}
assert.equal(rotations.length,0,'directional art must never rotate twice');
assert.equal(S.direction(Math.PI/8+.04,0),0);assert.equal(S.direction(Math.PI/8+.15,0),1);assert.equal(S.direction(-.02,0),0);
pending.at(-1).onerror();assert(!S.ready());assert(!S.draw(ctx,'revolver',0,0));
// Load real PNG dimensions into the complete deterministic game harness.
class AutoImage extends Image{set src(v){this.url=v;this.load()}get src(){return this.url}}
const loaded=()=>boot({globals:{Image:AutoImage,URL}});
const fixtures=[boot(),loaded()];
for(const evolved of [false,true]){
 for(const f of fixtures){f.p.newGame('iris');const g=f.p.game;g.spawn=100;g.nextBoss=Infinity;Object.assign(f.p.spawnEnemy('brute'),{x:70,y:0,hp:100000,maxHp:100000,speed:0});for(const w of Object.values(g.weapons))Object.assign(w,{level:1,evolved,cd:.3,cool:0})}
 for(let i=0;i<180;i++){
  for(const f of fixtures){f.p.keys.clear();f.p.keys.add(i<90?'d':'a');f.p.update(1/60);const before=JSON.stringify(f.p.game);f.p.draw();assert.equal(JSON.stringify(f.p.game),before,'drawing changed gameplay')}
  assert.deepEqual(JSON.parse(JSON.stringify(fixtures[1].p.game)),JSON.parse(JSON.stringify(fixtures[0].p.game)),'loaded visuals changed combat/RNG at '+i);
 }
}
console.log('PASS weapons: source hash/alpha, 64 measured crops/pivots, direction/hysteresis, integer nearest sampling, no second rotation, fallback; loaded-vs-fallback 180-frame all-weapon combat/RNG equivalence normal/evolved and render purity.');
