// Run: node tools/check_enemy_levels.cjs
const assert=require('node:assert/strict');
const {boot}=require('./game_fixture.cjs');
const f=boot(),{p,B}=f;
const close=(a,b)=>assert(Math.abs(a-b)<1e-8,`${a} != ${b}`);
function fresh(time=0){
 p.newGame();const g=p.game;g.spawn=10000;g.nextBoss=Infinity;g.nextKnowledgeChest=Infinity;
 for(const w of Object.values(g.weapons))w.level=0;
 g.player.invuln=10000;g.time=time;p.update(0);return g;
}
const types=['bandit','runner','gunslinger','brute','gravedigger','armored',...B.order];
// Existing wounded enemies level at the exact thresholds, once; newly spawned
// enemies get the same tier, regardless of the boss-wave clock.
for(const type of types){
 const g=fresh(299.75),e=p.spawnEnemy(type);
 Object.assign(e,{x:300,y:0,speed:0,cd:10000,summon:10000});
 g.bossWave=true;if(e.boss)g.boss=e;
 const max=e.maxHp,damage=e.damage;e.hp=max*.4;
 p.update(.125);assert.equal(e.level,1);assert.equal(e.resistance,0);
 p.update(.125);assert.equal(g.time,300);assert.equal(g.enemyLevel,2);
 close(e.maxHp,max*1.5);close(e.hp/e.maxHp,.4);close(e.damage,damage*1.35);close(e.resistance,.15);
 const stats=[e.maxHp,e.hp,e.damage];p.update(.01);assert.deepEqual([e.maxHp,e.hp,e.damage],stats);
 g.time=599.875;p.update(.125);assert.equal(g.enemyLevel,3);assert.equal(e.level,3);
 close(e.maxHp,max*2);close(e.hp/e.maxHp,.4);close(e.damage,damage*1.7);close(e.resistance,.3);
 assert.equal(e.extraProjectiles,1);assert(g.waveTime<1,'boss clock must not gate levels');
 for(const source of ['revolver','dynamite','meteor','element']){
  e.hp=10000;
  const hp=e.hp;p.damageEnemy(e,10,false,source);close(hp-e.hp,7);
 }
 const spawned=p.spawnEnemy(type);assert.equal(spawned.level,3);close(spawned.resistance,.3);
}
// A skipped threshold applies the final tier directly, without multiplying twice.
let g=fresh(),e=p.spawnEnemy('brute');e.x=1000;e.speed=0;
const initial=e.maxHp;g.time=610;p.update(0);assert.equal(e.level,3);close(e.maxHp,initial*2);
for(const state of ['pause','upgrade','knowledge']){
 g=fresh(299.875);e=p.spawnEnemy('bandit');p.setScreen(state);
 const frozen=JSON.stringify(g);p.update(700);assert.equal(JSON.stringify(g),frozen);
 p.setScreen('playing');p.update(.125);assert.equal(g.enemyLevel,2);assert.equal(e.level,2);
}
// Exactly one additional projectile per volley, not per original bullet.
for(const [time,bonus,multiplier] of [[599.99,0,1.35],[600,1,1.7],[899,1,1.7]]){
 g=fresh(time);e=p.spawnEnemy('gunslinger');Object.assign(e,{x:300,y:0,speed:0,cd:0});
 p.update(0);assert.equal(g.hostile.length,1+bonus);close(g.hostile[0].damage,10*multiplier);
 if(bonus)assert.notEqual(g.hostile[0].vy,g.hostile[1].vy);
 for(const enraged of [false,true]){
  g=fresh(time);e=p.spawnEnemy('boss');Object.assign(e,{x:300,y:0,speed:0,cd:0});g.boss=e;g.bossWave=true;
  if(enraged)e.hp=e.maxHp*.4;
  p.update(0);assert.equal(g.hostile.length,10+bonus+(enraged?8+bonus:0));
  close(g.hostile[0].damage,11*multiplier);
  for(const [type,kind] of [['iron_colonel','cannon'],['storm_widow','storm_fan']]){
   g=fresh(time);e=p.spawnEnemy(type);Object.assign(e,{x:300,y:0});
   if(enraged)e.hp=e.maxHp*.4;
   const h={owner:e,kind,x:0,y:0,start:time-2,delay:.7};g.bossHazards=[h];
   assert.equal(B.warningGeometry(h).rays.length,(enraged?5:3)+bonus);
   B.tickHazards(g,{shoot:p.shootHostile,spawn:p.spawnEnemy,hurt:p.hurtPlayer});
   assert.equal(g.hostile.length,(enraged?5:3)+bonus);
   close(g.hostile[0].damage,(kind==='cannon'?13:11)*multiplier);
  }
 }
}
// Ground attacks scale too; projectile budget and completion still apply.
g=fresh(600);e=p.spawnEnemy('storm_widow');g.player.invuln=0;
g.bossHazards=[{owner:e,kind:'lightning',x:0,y:0,r:34,start:598,delay:1}];
B.tickHazards(g,{shoot:p.shootHostile,spawn:p.spawnEnemy,hurt:p.hurtPlayer});close(g.player.hp,100-12*1.7);
g.hostile=Array.from({length:B.limits.hostile},()=>({}));p.shootHostile(e,1,0);assert.equal(g.hostile.length,B.limits.hostile);
g.time=899.99;p.update(.04);assert(g.completed);assert(g.victory);assert.equal(g.enemyLevel,3);assert.equal(g.hostile.length,0);
p.newGame();assert.equal(p.game.enemyLevel,1);assert.equal(p.spawnEnemy('gunslinger').extraProjectiles,0);
p.drawHUD();assert(f.text.includes('INIMIGOS NV. 1'));
console.log('PASS: 300/600s tiers across all enemies/bosses, damage/resistance, wounded health, existing/new enemies, pause/resume, volley counts/telegraphs, attack damage, caps, completion and reset.');
