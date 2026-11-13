// Run: node tools/check_match_duration.cjs
const assert=require('node:assert/strict');
const {boot}=require('./game_fixture.cjs');
let nextFrame;
const f=boot({globals:{requestAnimationFrame:callback=>{nextFrame=callback}}});
const {p}=f;
const snapshot=()=>JSON.stringify(p.game);
function fresh(){
 p.newGame();const g=p.game;
 g.spawn=10000;g.nextBoss=Infinity;g.nextKnowledgeChest=Infinity;
 g.knowledgeUsed=new Set();g.knowledgeChestId=0;
 for(const w of Object.values(g.weapons))w.level=0;
 return g;
}
function key(key){f.dispatch('keydown',{key,code:key,preventDefault(){}})}
let writes=0;
const set=f.storage.set.bind(f.storage);
f.storage.set=(...args)=>{writes++;return set(...args)};

// Before, exactly at, crossing, and already beyond the deadline.
let g=fresh();g.time=899.5;p.update(.25);
assert.equal(g.time,899.75);assert.equal(g.completed,false);
p.drawHUD();assert(f.text.includes('14:59 / 15:00'));
for(const [start,dt] of [[899.75,.25],[899.99,.04],[900,0],[901,.01],[1250,.04]]){
 g=fresh();g.time=start;
 const boss=p.spawnEnemy('iron_colonel');g.boss=boss;g.bossWave=true;
 g.bossHazards=[{owner:boss,start:0,delay:0,kind:'mortar',x:0,y:0,r:100}];
 g.hostile=[{x:0,y:0,damage:1000,r:10,life:4,vx:0,vy:0}];
 g.shots=[{life:1}];g.hazards=[{t:0,delay:0}];
 g.spawn=0;g.nextBoss=0;g.nextKnowledgeChest=0;
 g.pendingUpgrades=2;g.choices=[{apply(){throw Error('late upgrade')}}];
 const hp=g.player.hp,kills=g.kills,before=writes;
 p.update(dt);
 assert.equal(g.time,900);assert.equal(g.completed,true);assert.equal(g.victory,true);
 assert.equal(p.screen,'dead');assert.equal(writes,before+1);
 assert.equal(g.player.hp,hp,'deadline must precede lethal attacks');
 assert.equal(g.kills,kills,'completion does not award an undefeated boss');
 assert.equal(g.boss,null);assert.equal(g.bossWave,false);
 for(const field of ['bossHazards','hostile','shots','hazards','choices'])assert.equal(g[field].length,0,field);
 assert.equal(g.pendingUpgrades,0);
 const final=snapshot();p.update(60);p.update(60);
 assert.equal(snapshot(),final);assert.equal(writes,before+1,'completion persisted twice');
 assert.equal(p.spawnEnemy('bandit'),null);
 p.shootHostile(boss,1,0);p.fireWeapon(g.weapons.revolver);
 p.hurtPlayer(1000);p.damageEnemy(boss,100000,false);
 assert.equal(snapshot(),final,'combat callbacks must stop after completion');
 // Completion remains authoritative even if another callback changes the screen.
 p.setScreen('playing');p.update(.04);assert.equal(snapshot(),final);assert.equal(writes,before+1);
 p.setScreen('dead');p.draw();
 assert(f.text.includes('15:00 / 15:00'));assert(f.text.includes('VITÓRIA!'));
 key('Escape');assert.equal(p.screen,'dead');
 key('Enter');assert.equal(p.screen,'playing');assert.equal(p.game.time,0);
 assert.equal(p.game.waveTime,0);assert.equal(p.game.completed,false);assert.equal(p.game.victory,false);
 assert.equal(p.game.boss,null);assert.equal(p.game.pendingUpgrades,0);
}

// Real pause/resume, queued upgrade choices, and knowledge panel all freeze time.
g=fresh();g.time=899.75;
key('Escape');assert.equal(p.screen,'pause');let frozen=snapshot();p.update(120);
assert.equal(snapshot(),frozen);key('Escape');assert.equal(p.screen,'playing');
p.openUpgrades();p.openUpgrades();assert.equal(p.screen,'upgrade');
frozen=snapshot();p.update(120);assert.equal(snapshot(),frozen);
p.pickUpgrade(0);assert.equal(p.screen,'upgrade');p.update(120);assert.equal(g.time,899.75);
p.pickUpgrade(0);assert.equal(p.screen,'playing');
const chest=f.K.create(0,0,1);chest.knowledge=true;g.chests.push(chest);
p.interactWithKnowledgeChest();assert.equal(p.screen,'knowledge');
frozen=snapshot();p.update(120);assert.equal(snapshot(),frozen);
p.closeKnowledgePanel();assert.equal(p.screen,'playing');
p.update(.125);assert.equal(g.time,899.875);assert.equal(g.completed,false);
p.update(.125);assert.equal(g.victory,true);

// The actual RAF loop keeps its clock current while paused: no catch-up on resume.
g=fresh();g.time=899.92;nextFrame(1000);assert(Math.abs(g.time-899.96)<1e-9);
const pausedTime=g.time;key('Escape');nextFrame(61000);assert.equal(g.time,pausedTime);
key('Escape');nextFrame(61020);assert(Math.abs(g.time-899.98)<1e-9);
nextFrame(61060);assert.equal(g.time,900);assert.equal(g.victory,true);
const after=writes;nextFrame(62000);nextFrame(63000);assert.equal(writes,after);

// Death still uses the same result screen, with defeat text and a fresh retry.
g=fresh();g.time=12;g.player.hp=0;p.update(.01);
assert.equal(g.completed,true);assert.equal(g.victory,false);assert.equal(p.screen,'dead');
p.draw();assert(f.text.includes('FIM DE JOGO'));
p.handleClick({clientX:600,clientY:800*.62});
assert.equal(p.screen,'playing');assert.equal(p.game.time,0);assert.equal(p.game.completed,false);
key('Escape');p.handleClick({clientX:600,clientY:800*.45+55});
assert.equal(p.screen,'playing');assert.equal(p.game.time,0);assert.equal(p.game.victory,false);
console.log('PASS: 900s boundary/overshoot, active boss, combat shutdown, one completion, HUD/results, pause/upgrades/knowledge/resume, RAF loop, death and keyboard/click restarts.');
