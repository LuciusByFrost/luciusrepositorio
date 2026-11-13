// Real art bounds, animation events, telegraph geometry and optional local baseline.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {boot}=require('./game_fixture.cjs');
const canvases=[];
const box={document:{createElement(){
 const c={rects:[]};let tx=0,ty=0;
 const ctx={translate(x,y){tx=x;ty=y},fillRect(x,y,w,h){
  assert([x,y,w,h].every(Number.isInteger),'fractional cached pixel');
  assert(w>0&&h>0);assert(x+tx>=0&&y+ty>=0&&x+tx+w<=128&&y+ty+h<=128,'cropped enemy art');
  c.rects.push([x+tx,y+ty,w,h]);
 }};c.getContext=()=>ctx;canvases.push(c);return c;
}}};
vm.createContext(box);vm.runInContext(fs.readFileSync('js/enemy_sprites.js','utf8'),box);
assert.equal(canvases.length,54,'all reusable layers must be baked at startup');
const masks=[];let index=0;
for(const p of Object.values(vm.runInContext('EnemySprites.profiles',box))){
 const mask=new Uint8Array(128*128),count=p.boss?6:5;
 for(const c of canvases.slice(index,index+count))for(const [x,y,w,h] of c.rects)for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)mask[yy*128+xx]=1;
 masks.push(Buffer.from(mask).toString('base64'));index+=count;
}
assert.equal(new Set(masks).size,10,'all ten silhouettes must differ geometrically');
const f=boot(),{p,N,B}=f;
for(const id of Object.keys(N.profiles)){
 p.newGame();const e=p.spawnEnemy(id),g=p.game;g.spawn=10000;g.nextBoss=10000;
 Object.assign(e,{x:200,y:0,hp:1000,maxHp:1000});N.tick(g);
 const allocated=f.stats().created;
 for(const state of ['idle','walk','attack','hurt'])for(const face of [-1,1])for(const hp of [1000,400]){
  const sample={...e,visualState:state,facing:face,hp},before=JSON.stringify(sample);
  N.draw(f.ctx,sample,100.3,100.8,1.2);assert.equal(JSON.stringify(sample),before,'render mutated enemy');
 }
 assert.equal(f.stats().created,allocated,'enemy frames allocated canvases');
 if(e.boss){
  e.hp=400;g.time=1;N.tick(g);assert(N.pose(e,g.time).flash);
  g.time=1.4;N.tick(g);assert(!N.pose(e,g.time).flash);
  g.time=2;N.tick(g);assert(!N.pose(e,g.time).flash,'enraged flash restarted');
  const pose=JSON.stringify(N.pose(e,g.time));p.setScreen('pause');p.update(1);assert.equal(JSON.stringify(N.pose(e,g.time)),pose);
 }
}
p.newGame();let e=p.spawnEnemy('gunslinger');Object.assign(e,{x:210,y:0,cd:0});p.game.spawn=10000;p.game.nextBoss=10000;
p.update(.01);assert(p.game.hostile.length>0);assert.equal(N.pose(e,p.game.time).state,'attack','shooting must follow actual projectile event');
e.hit=.1;assert.equal(N.pose(e,p.game.time).state,'hurt');
// Fan warnings must match every actual shot, including movement during windup.
for(const kind of ['cannon','storm_fan'])for(const enraged of [false,true]){
 p.newGame();const g=p.game,b=p.spawnEnemy('iron_colonel');Object.assign(b,{x:20,y:30,hp:enraged?400:1000,maxHp:1000});
 const h={owner:b,kind,x:250,y:80,r:0,start:0,delay:.7,done:false};g.bossHazards=[h];
 b.x+=17;const geo=B.warningGeometry(h);g.time=.701;B.tickHazards(g,{shoot:p.shootHostile,spawn:p.spawnEnemy,hurt:p.hurtPlayer});
 assert.equal(geo.rays.length,g.hostile.length);
 assert(Math.abs(N.pose(b,g.time).angle-Math.atan2(h.y-b.y,h.x-b.x))<1e-10,'cannon art must aim at the fan center, not the last pellet or a mortar');
 g.hostile.forEach((s,i)=>assert(Math.abs(Math.atan2(s.vy,s.vx)-geo.rays[i])<1e-10,'warning fan differs from projectile trajectory'));
}
p.newGame();e=p.spawnEnemy('grave_keeper');Object.assign(e,{x:10,y:20});
let geo=B.warningGeometry({owner:e,kind:'charge',x:210,y:120,r:e.r});
assert.equal(geo.half,e.r+2,'include the existing two-pixel contact tolerance');assert.equal(geo.length,185*.85);assert.equal(geo.angle,Math.atan2(100,200));
N.reset();for(let i=0;i<100;i++)N.defeat({type:'bandit',x:i,y:0},0);
let fragments=0;const fxContext={save(){},restore(){},fillRect(){fragments++}};
N.effects(fxContext,{time:.1},x=>x,y=>y);assert.equal(fragments,64*7,'death effect cap');
N.tick({time:.5,enemies:[],player:{x:0,y:0}});fragments=0;
N.effects(fxContext,{time:.5},x=>x,y=>y);assert.equal(fragments,0,'expired death fragments retained');
console.log('PASS: 54 cached layers, integer pixels, no clipping, ten unique silhouettes; poses/facings, render purity, zero frame canvases, actual shooting, one-shot rage transition, pause and exact fan/charge warnings.');
console.log('PASS: deterministic death fragments respect the 64-effect budget and expire on the game clock.');
// The baseline is captured before this visual task, so uncommitted player art
// and combat changes are included. No HEAD reset or approximation is involved.
const baselinePath=process.argv[2];
if(baselinePath){
 const source=fs.readFileSync(baselinePath,'utf8');
 for(const kind of B.order){
  const old=boot({mainSource:source}),now=boot();
  for(const f of [old,now]){
   f.p.newGame('iris');const g=f.p.game;g.spawn=10000;g.nextBoss=10000;g.player.invuln=10000;
   for(const id of ['bandit','runner','gunslinger','brute','gravedigger','armored',kind]){
    const e=f.p.spawnEnemy(id);Object.assign(e,{x:150+g.enemies.length*30,y:40,hp:1000000,maxHp:1000000});
   }
   for(const w of Object.values(g.weapons))Object.assign(w,{level:3,evolved:true,cool:0});
  }
  for(let frame=0;frame<600;frame++){
   for(const f of [old,now]){
    if(frame===180)for(const e of f.p.game.enemies)if(e.boss)e.hp=e.maxHp*.4;
    if(frame===300){const victim=f.p.game.enemies.find(e=>e.type==='bandit');if(victim)f.p.damageEnemy(victim,1e9,false,'revolver')}
    f.p.update(1/60);
   }
   assert.equal(JSON.stringify(now.p.game),JSON.stringify(old.p.game),kind+': simulation changed at frame '+frame);
   if(frame%60===0){const state=JSON.stringify(now.p.game);now.p.drawWorld();assert.equal(JSON.stringify(now.p.game),state)}
  }
 }
 console.log('PASS: 2400 frames identical to the current local pre-redesign simulation; six enemy AIs, four bosses, all eight evolved weapons, enrage thresholds, projectiles and rewards unchanged.');
}
// Validate the primary PNG path as well as the retained procedural fallback.
require('./check_enemy_png.cjs');
