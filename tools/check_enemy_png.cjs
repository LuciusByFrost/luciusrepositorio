// Real PNG validation and event controller tests; legacy gameplay assertions stay intact.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {boot}=require('./game_fixture.cjs'),{decode,mapping}=require('./build_enemy_atlas.cjs');
const atlas=vm.runInNewContext(fs.readFileSync('assets/enemy_atlas.js','utf8')+';EnemyAtlas');
const pending=[];class Image{constructor(){pending.push(this)}set src(v){this.url=v}get src(){return this.url}load(){const b=fs.readFileSync(new URL(this.src).pathname.replace('/game/',''));this.naturalWidth=b.readUInt32BE(16);this.naturalHeight=b.readUInt32BE(20);this.onload?.()}}
const f=boot({globals:{URL,Image}}),{p,N}=f;pending.forEach(i=>i.load());
assert.equal(Object.keys(N.status()).length,9);assert(Object.values(N.status()).every(s=>s.state==='ready'));
for(const [id,asset] of Object.entries(mapping)){
 const m=atlas[id];assert.equal(m.asset,asset);assert.equal(crypto.createHash('sha256').update(fs.readFileSync(m.file)).digest('hex'),m.sha256);
 const png=decode(m.file);assert.equal(m.frames.length,64);assert.equal(m.walk.fps,8);assert.equal(m.attack.fps,10);
 for(const frame of m.frames){
  assert(Math.abs(frame.bodyHeight*frame.scale-m.worldHeight)<1e-8,'body height changes');assert.equal(frame.anchor.join(','),m.pivot.join(','));
  let count=0;for(let y=0;y<frame.h;y++)for(let x=0;x<frame.w;x++)if(png.data[((frame.y+y)*png.w+frame.x+x)*4+3]){count++;assert(x>=2&&y>=2&&x<frame.w-2&&y<frame.h-2,'tile clips artwork')}
  assert(count>500,'empty PNG frame');
 }
 p.newGame();const e=p.spawnEnemy(id),g=p.game;g.enemies=[e];g.spawn=g.nextBoss=1e6;Object.values(g.weapons).forEach(w=>w.level=0);Object.assign(e,{x:200,y:200,hp:100000,maxHp:100000});N.reset();N.track(e,g.time);
 const allocation=f.stats().created;
 for(let dir=0;dir<8;dir++){
  const angle=Math.PI/2+dir*Math.PI/4,dx=Math.cos(angle),dy=Math.sin(angle),seen=new Set();
  for(let i=0;i<40;i++){g.time+=1/60;e.x+=dx;e.y+=dy;N.tick(g);const a=N.spritePose(e,g.time);assert.equal(a.direction,dir);assert.equal(a.state,'walk');seen.add(a.column);N.draw(f.ctx,e,100,100,g.time)}assert.equal(seen.size,4);
  g.time+=.01;N.tick(g);assert.equal(N.spritePose(e,g.time).state,'idle');assert.equal(N.spritePose(e,g.time).column,0);assert.equal(N.spritePose(e,g.time).direction,dir);
  N.fired(e,g.time,dx,dy);N.fired(e,g.time,dx,dy); // same volley never restarts
  const columns=[];for(let i=0;i<4;i++){const a=N.spritePose(e,g.time);assert.equal(a.state,'attack');assert.equal(a.direction,dir);columns.push(a.column);N.draw(f.ctx,e,100,100,g.time);g.time+=.10001;N.tick(g)}assert.deepEqual(columns,[4,5,6,7]);assert.equal(N.spritePose(e,g.time).state,'idle');
  N.fired(e,g.time,dx,dy);g.time+=.15;N.tick(g);const paused=JSON.stringify(N.spritePose(e,g.time));p.setScreen('pause');p.update(1);assert.equal(JSON.stringify(N.spritePose(e,g.time)),paused);p.setScreen('playing');
  e.elementState={ice:{frozenUntil:g.time+1}};const frozen=JSON.stringify(N.spritePose(e,g.time));g.time+=.2;N.tick(g);assert.equal(JSON.stringify(N.spritePose(e,g.time)),frozen);delete e.elementState;g.time+=1;N.tick(g);
 }
 assert.equal(f.stats().created,allocation,'PNG draw allocated canvas');
}
assert.equal(N.spritePose({type:'boss',bossKind:'grave_keeper'},0),null);
// A missing PNG falls back once, with no PNG/procedural double drawing.
p.newGame();const e=p.spawnEnemy('bandit'),img=pending.find(i=>i.src.includes('/coyote_marauder/'));let pngDraws=0,legacyDraws=0;
const ctx=new Proxy({drawImage(image){image===img?pngDraws++:legacyDraws++}},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
N.draw(ctx,e,0,0,0);assert.equal(pngDraws,1);assert.equal(legacyDraws,0);img.onerror();N.draw(ctx,e,0,0,0);assert(legacyDraws>0);assert.equal(pngDraws,1);
img.naturalWidth=1;img.onload();assert.equal(N.status().bandit.state,'error');img.load();assert.equal(N.status().bandit.state,'ready');
// Use real melee contact and boss hazard resolution, not inferred cooldowns.
p.newGame();const g=p.game;g.spawn=g.nextBoss=1e6;Object.values(g.weapons).forEach(w=>w.level=0);const melee=p.spawnEnemy('brute');Object.assign(melee,{x:1,y:0,speed:0});p.update(.01);assert.equal(N.spritePose(melee,g.time).state,'attack');
for(const kind of ['boss','iron_colonel','storm_widow','grave_keeper']){p.newGame();const g=p.game;g.spawn=g.nextBoss=1e6;g.player.invuln=1e6;Object.values(g.weapons).forEach(w=>w.level=0);const b=p.spawnEnemy(kind);Object.assign(b,{x:300,y:0,cd:0});let observed=false;for(let i=0;i<90;i++){p.update(1/60);if(N.pose(b,g.time).state==='attack'||N.spritePose(b,g.time)?.state==='attack')observed=true}assert(observed,kind+' never animated its real attack');if(kind==='boss')assert(g.hostile.length>0);}
console.log('PASS: 576 PNG frames, crops/margins/anchors/heights, nine mappings, eight directions, 8 FPS walks, 10 FPS nonloop attacks, idle/recovery, pause/freeze, volley deduplication, actual melee/boss events, fallback/recovery and no frame canvas allocations.');
