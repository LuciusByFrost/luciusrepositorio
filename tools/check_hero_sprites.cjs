const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {boot}=require('./game_fixture.cjs');
const pending=[],calls=[];
class Image{constructor(){pending.push(this)}set src(v){this.url=v}get src(){return this.url}load(){const p=new URL(this.src).pathname.replace('/game/','');const b=fs.readFileSync(p);this.complete=true;this.naturalWidth=b.readUInt32BE(16);this.naturalHeight=b.readUInt32BE(20);this.onload()}}
const ctx=new Proxy({drawImage(...args){calls.push(args)}},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
const box={URL,Image,console,document:{currentScript:{src:'file:///game/js/hero_sprite.js'},createElement:()=>({getContext:()=>ctx})}};vm.createContext(box);
vm.runInContext(fs.readFileSync('js/hero_sprite.js','utf8'),box);
for(const id of ['nopal','rosa','bento','iris']){
 const name=id[0].toUpperCase()+id.slice(1);for(const f of ['assets/characters/'+id+'/atlas.js','js/'+id+'_sprite.js'])vm.runInContext(fs.readFileSync(f,'utf8'),box);
 const S=vm.runInContext(name+'Sprite',box),M=vm.runInContext(name+'Atlas',box),p={characterId:id,visualMoving:false};
 assert(!S.active(p));for(const img of pending.slice(-2))img.load();assert(S.active(p));
 for(const sheet of ['walk','attack']){
  const d=M[sheet],cols=sheet==='walk'?6:4;assert.equal(d.frames.length,8*cols);
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(d.source)).digest('hex').toUpperCase(),d.sourceSHA256);
  const png=fs.readFileSync(d.source),width=png.readUInt32BE(16),height=png.readUInt32BE(20);
  for(const f of d.frames){const [x,y,w,h]=f.sourceRect;assert(x>=0&&y>=0&&x+w<=width&&y+h<=height);assert(Math.abs(f.bodyHeight*f.scale-M.worldBodyHeight)<1e-8);assert.deepEqual(Array.from(f.anchor),[64,88]);assert(f.offset[0]>=3&&f.offset[1]>=3&&f.offset[0]+f.drawSize[0]<=125&&f.offset[1]+f.drawSize[1]<=125)}
  for(let i=0;i<d.frames.length;i++)for(let j=i+1;j<d.frames.length;j++){
   const a=d.frames[i].sourceRect,b=d.frames[j].sourceRect;
   assert(a[0]+a[2]<=b[0]||b[0]+b[2]<=a[0]||a[1]+a[3]<=b[1]||b[1]+b[3]<=a[1],'neighboring source crops overlap');
  }
 }
 for(let dir=0;dir<8;dir++){
  const angle=Math.PI/2+dir*Math.PI/4;p.visualDirection=dir;
  assert.equal(S.direction(Math.cos(angle),Math.sin(angle)),dir);
  for(let col=0;col<6;col++){p.visualMoving=true;p.visualWalkTime=(col+.1)/10;const a=S.pose(p,10);assert.equal(a.sheet,'walk');assert.equal(a.frame,dir*6+col)}
  p.visualMoving=false;assert.equal(S.pose(p,11).frame,dir*6);assert.equal(S.pose(p,18).frame,dir*6);
  p.heroAttackAt=20;p.heroAttackAngle=angle;p.visualMoving=true;
  for(let col=0;col<4;col++){const t=20+(col+.1)/12.5,a=S.pose(p,t);assert.equal(a.sheet,'attack');assert.equal(a.frame,dir*4+col);calls.length=0;const before=JSON.stringify(p);assert(S.draw(ctx,p,50.2,70.8,t));assert.equal(calls.length,1);assert.equal(JSON.stringify(p),before);assert.equal(ctx.imageSmoothingEnabled,false);assert(calls[0].slice(1).every(Number.isInteger))}
  assert.equal(S.pose(p,20.321).sheet,'walk');p.visualMoving=false;assert.equal(S.pose(p,20.321).frame,dir*6);delete p.heroAttackAt;
 }
 const warn=box.console;box.console={...console,warn(){}};pending.at(-1).onerror();assert(!S.active(p));assert.equal(S.status().state,'error');assert(!S.draw(ctx,p,0,0,0));box.console=warn;
}
// Use real combat, including target selection, every starter and moving attacks.
for(const id of ['nopal','rosa','bento','iris']){
 const f=boot();f.p.newGame(id);const g=f.p.game;g.spawn=100;g.nextBoss=Infinity;
 Object.assign(f.p.spawnEnemy('brute'),{x:70,y:0,hp:100000,maxHp:100000,speed:0});
 g.time=5;f.p.fireWeapon(g.weapons[g.player.startWeapon]);assert.equal(g.player.heroAttackAt,5);assert.equal(g.player.heroAttackAngle,0);
 const x=g.player.x;f.p.keys.add('d');f.p.update(.05);assert(g.player.x>x,'movement blocked by attack');
 const age=g.player.heroAttackAt;f.p.fireWeapon(g.weapons.solar);assert.equal(g.player.heroAttackAt,age,'secondary weapon restarted authored starter attack');
 const before=JSON.stringify(g);f.p.draw();assert.equal(JSON.stringify(g),before,'drawing mutated combat');
 f.p.setScreen('pause');const t=g.time;f.p.update(.2);assert.equal(g.time,t);
}
console.log('PASS four heroes: 320 measured crops/hashes/body anchors; 192 walking and 128 attack frames; 32 stable idles; real combat events, secondary weapons, movement, recovery, pause, render purity.');
