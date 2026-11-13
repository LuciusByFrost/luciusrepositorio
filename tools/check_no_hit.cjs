// Run: node tools/check_no_hit.cjs
const assert=require('node:assert/strict');
const {boot}=require('./game_fixture.cjs');
const f=boot(),{p,C,Ch}=f;
function fresh(mode='nohit'){
 p.newGame('nopal',mode);const g=p.game;g.spawn=10000;g.nextBoss=Infinity;g.nextKnowledgeChest=Infinity;
 for(const w of Object.values(g.weapons))w.level=0;
 return g;
}
function key(key,repeat=false){f.dispatch('keydown',{key,code:key,repeat,preventDefault(){}})}
// Click/touch targets and the keyboard shortcut choose the mode before starting.
for(const [w,h] of [[1200,800],[480,800],[360,640],[640,360]]){
 f.setViewport(w,h);const l=C.layout(w,h);
 assert(l.cards.every(r=>r.y+r.h<l.difficulties[0].y-12));
 for(const r of l.difficulties){
  assert(r.x>=0&&r.x+r.w<=w);assert(r.y+r.h<l.start.y);
 }
 p.openCharacterSelect();p.handleCharacterClick({x:l.difficulties[1].x+5,y:l.difficulties[1].y+5});
 p.drawCharacterSelect();assert(f.text.includes('NO HIT: um acerto fatal. Sem cura ou armadura.'));
 key('Enter');assert.equal(p.game.difficulty,'nohit');assert.equal(p.game.player.hp,1);
 p.openCharacterSelect();key('d');key('d',true);key('Enter');assert.equal(p.game.difficulty,'normal');
}
f.setViewport(1200,800);
let g=fresh();p.hurtPlayer(.001);assert.equal(g.player.hp,0);assert(g.completed);assert(!g.victory);assert.equal(p.screen,'dead');
p.draw();assert(f.text.includes('FIM DE JOGO · NO HIT'));
const dead=JSON.stringify(g);p.hurtPlayer(100);p.update(100);assert.equal(JSON.stringify(g),dead);
assert.equal(p.openChest(Ch.create(0,0)),false);
key('Enter');assert.equal(p.game.difficulty,'nohit');assert.equal(p.game.player.hp,1);assert(!p.game.completed);
key('Escape');p.handleClick({clientX:600,clientY:800*.45+55});assert.equal(p.game.difficulty,'nohit');assert.equal(p.game.time,0);
assert.equal(JSON.parse(f.storage.get('cactus-save')).difficulty,'nohit');
assert.equal(boot({save:{difficulty:'nohit'}}).p.game.difficulty,'nohit');
assert.equal(boot({save:{difficulty:'invalid'}}).p.game.difficulty,'normal');
// Ignore HP/armor bonuses for fatality; ordinary mode retains damage mitigation.
g=fresh();Object.assign(g.player,{hp:10000,maxHp:10000,armor:1});p.hurtPlayer(1);assert(g.completed);assert.equal(g.player.hp,0);
g=fresh('normal');g.player.armor=.35;p.hurtPlayer(10);assert.equal(g.player.hp,93.5);assert(!g.completed);
// All damage paths end immediately, before XP, chests, or regen could run.
for(const hit of ['contact','projectile','lightning','mortar']){
 g=fresh();g.player.regen=10000;
 g.gems=[{x:0,y:0,r:5,value:100,bob:0}];g.chests=[Ch.create(0,0)];
 const e=p.spawnEnemy(hit==='contact'?'bandit':'storm_widow');
 Object.assign(e,{x:hit==='contact'?1:300,y:0,speed:0,cd:10000,summon:10000});
 if(hit==='projectile')g.hostile=[{x:0,y:0,vx:0,vy:0,r:5,life:4,damage:1}];
 if(['lightning','mortar'].includes(hit))g.bossHazards=[{owner:e,kind:hit,x:0,y:0,r:40,start:-2,delay:1}];
 p.update(.01);assert(g.completed,hit);assert.equal(g.player.hp,0);assert.equal(g.level,1);assert.equal(g.xp,0);
 assert.equal(g.chests[0].rewardClaimed,false);assert.equal(p.screen,'dead');
 const stopped=JSON.stringify(g);p.update(1);assert.equal(JSON.stringify(g),stopped);
}
g=fresh();const excluded=p.upgradePool.filter(u=>u.survivalUpgrade||u.armorUpgrade);
assert.equal(excluded.length,4);
for(const u of excluded){assert(!p.canTakeUpgrade(g,u));assert.equal(p.takeUpgrade(g,u),false)}
for(let i=0;i<150;i++){
 p.setScreen('playing');p.openUpgrades();assert(g.choices.every(u=>!u.survivalUpgrade&&!u.armorUpgrade));p.pickUpgrade(0);
}
assert.equal(g.player.maxHp,1);assert.equal(g.player.regen,0);assert.equal(g.player.armor,0);
// No implicit healing from chests, even if life was artificially changed.
g=fresh();g.player.hp=.5;g.player.regen=1;p.update(.1);assert.equal(g.player.hp,.5);
for(const kind of ['common','boss']){
 p.setScreen('playing');const c=Ch.create(500,500,kind);assert(p.openChest(c));assert.equal(g.player.hp,.5);assert(c.rewardXP>0);
}
p.drawHUD();assert(f.text.includes('NÍVEL 1   NO HIT · 1 ACERTO FATAL')||f.text.some(t=>t.includes('NO HIT · 1 ACERTO FATAL')));
g=fresh();g.time=899.99;p.update(.04);assert(g.completed);assert(g.victory);p.draw();assert(f.text.includes('VITÓRIA NO HIT!'));
g=fresh('normal');assert.equal(g.player.hp,100);assert.equal(g.player.maxHp,100);
assert(excluded.every(u=>p.canTakeUpgrade(g,u)));
console.log('PASS: No hit selection/layout/save/retry, lethal contact/projectiles/boss areas, no armor/healing/regen offers or chest healing, immediate single ending, normal mode and 15min victory.');
