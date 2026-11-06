// Run: node tools/check_roster_bosses.cjs
const assert=require('node:assert/strict'),{boot}=require('./game_fixture.cjs');
let checks=0;const plain=v=>v===undefined?undefined:JSON.parse(JSON.stringify(v));
function equal(a,b,msg){assert.deepEqual(plain(a),plain(b),msg);checks++}
function ok(v,msg){assert(v,msg);checks++}
const fixture=boot(),{p,C,B,E}=fixture,api={shoot:p.shootHostile,spawn:p.spawnEnemy,hurt:p.hurtPlayer};
function fresh(hero='nopal'){
 p.newGame(hero);const g=p.game;g.spawn=10000;g.nextBoss=10000;Object.values(g.weapons).forEach(w=>w.level=0);return g;
}
function boss(kind,enraged=false){const g=fresh(),e=p.spawnEnemy(kind);Object.assign(e,{x:400,y:0,speed:0,cd:0});
 g.boss=e;g.bossWave=true;if(enraged)e.hp=e.maxHp*.4;return {g,e};
}
function step(seconds){for(let i=0;i<Math.ceil(seconds*60);i++)p.update(1/60)}

// Four starter choices, exactly three additions, using existing weapons only.
equal(C.list.length,4);equal(C.list.map(c=>c.weapon),['revolver','shotgun','dynamite','lasso']);
equal(C.get('missing').id,'nopal');equal(C.get('constructor').id,'nopal');
for(const hero of C.list){
 p.newGame(hero.id);const g=p.game;
 equal(g.player.characterId,hero.id);equal(g.player.startWeapon,hero.weapon);
 equal(Object.values(g.weapons).filter(w=>w.level>0).map(w=>w.id),[hero.weapon]);
 equal([g.player.r,g.player.hp,g.player.maxHp,g.player.speed],[15,100,100,205]);
 equal(g.elements.active,0);equal(Object.keys(g.weapons).length,8);
 g.spawn=10000;g.weapons[hero.weapon].cool=10000;p.update(.8);
 equal(g.player.heldWeapon,hero.weapon,'idle must not display an unowned revolver');
 g.weapons[hero.weapon].level=3;p.openChest();ok(g.weapons[hero.weapon].evolved,'starter must still evolve');
 p.newGame();equal(p.game.player.characterId,hero.id,'retry must keep selected character');
 equal(Object.values(p.game.weapons).filter(w=>w.level>0).length,1);equal(p.game.elements.active,0);
}
equal(JSON.parse(fixture.storage.get('cactus-save')).characterId,'iris');
ok(boot({save:{characterId:'invalid'}}).p.game.player.characterId==='nopal');

// Actual title -> select -> start flow; repeat Enter cannot skip selection.
const menu=boot({autoStart:false});
function key(key,repeat=false){menu.dispatch('keydown',{key,code:key===' '?'Space':key,repeat,preventDefault(){}})}
equal(menu.p.screen,'title');key('Enter');equal(menu.p.screen,'characters');key('Enter',true);equal(menu.p.screen,'characters');
key('3');equal(menu.p.selected,'bento');key('Enter');equal(menu.p.screen,'playing');equal(menu.p.game.player.startWeapon,'dynamite');
menu.p.openCharacterSelect();key('ArrowRight');equal(menu.p.selected,'iris');key('Escape');equal(menu.p.screen,'title');
menu.p.openCharacterSelect();const desktop=C.layout(1200,800),card=desktop.cards[1];
menu.p.handleClick({clientX:card.x+10,clientY:card.y+10});equal(menu.p.selected,'rosa');equal(menu.p.screen,'characters');
menu.p.handleClick({clientX:desktop.start.x+10,clientY:desktop.start.y+10});equal(menu.p.screen,'playing');equal(menu.p.game.player.startWeapon,'shotgun');
menu.p.setScreen('dead');menu.p.handleClick({clientX:600,clientY:800*.62+53});equal(menu.p.screen,'characters');
for(const [w,h] of [[1200,800],[480,800],[640,360]]){
 menu.setViewport(w,h);menu.p.openCharacterSelect();const layout=C.layout(w,h);
 equal(layout.cards.length,4);ok(layout.cards.every(r=>r.x>=0&&r.y>=0&&r.x+r.w<=w+.01&&r.y+r.h<layout.start.y));
 ok(layout.start.y+layout.start.h<=h);const before=plain(menu.p.game),canvases=menu.stats().created;
 menu.p.drawCharacterSelect();equal(plain(menu.p.game),before,'menu preview must not mutate the run');equal(menu.stats().created,canvases,'sprite variants must be cached');
 menu.p.handleCharacterClick({x:layout.cards[2].x+5,y:layout.cards[2].y+5});equal(menu.p.selected,'bento');
 key('ArrowRight');equal(menu.p.selected,'iris');
}

// The classic boss's original ring attack remains intact.
let run=boss('boss');p.update(.01);equal(run.g.hostile.length,10);ok(!run.e.bossKind);
run=boss('boss',true);p.update(.01);equal(run.g.hostile.length,18);
equal(Object.keys(B.profiles).length,3);equal(new Set(Object.values(B.profiles).map(d=>d.name)).size,3);

// Each new boss warns first, attacks once due, pauses, and rewards correctly.
for(const kind of Object.keys(B.profiles)){
 const {g,e}=boss(kind);p.update(.01);
 ok(e.boss&&e.type==='boss');equal(e.bossKind,kind);ok(g.bossHazards.length>0);ok(g.bossHazards.every(h=>!h.done));
 equal(g.hostile.length,0,'no projectile before telegraph');equal(g.player.hp,100);
 if(kind==='grave_keeper')equal(g.bossHazards.find(h=>h.kind==='charge').r,e.r,'charge warning must cover the boss body radius');
 const frozen=plain(g);p.setScreen('pause');p.update(1);equal(plain(g),frozen,'boss warning must pause');p.setScreen('playing');
 const canvases=fixture.stats().created,before=plain(g);p.drawWorld();equal(plain(g),before);equal(fixture.stats().created,canvases);
 g.player.invuln=10000;step(1.2);
 if(kind==='iron_colonel')ok(g.hostile.length>=3);
 if(kind==='storm_widow')ok(g.bossHazards.some(h=>h.kind==='lightning'&&h.done));
 if(kind==='grave_keeper')ok(e.dashUntil>0&&Number.isFinite(e.x));
 // Kill with pending new warnings and make sure none survive the owner.
 e.cd=0;e.summon=0;p.update(.01);ok(g.bossHazards.length>0);
 p.damageEnemy(e,e.hp+1,false);p.update(.01);
 equal(g.kills,1);equal(g.chests.length,1);equal(g.gems.length,1);ok(!g.bossWave);equal(g.boss,null);
 ok(!g.bossHazards.some(h=>h.owner===e));p.update(.01);equal(g.kills,1);
}

// Low-health phases add patterns without changing the sheriff or enemy AI.
for(const kind of Object.keys(B.profiles)){
 let {g,e}=boss(kind);e.summon=0;p.update(.01);const normal=g.bossHazards.length;
 ({g,e}=boss(kind,true));e.summon=0;p.update(.01);ok(g.bossHazards.length>normal,'enraged pattern '+kind);
}

// Ground lightning uses its marked radius, respects immunity, and fires once.
run=boss('storm_widow');p.update(.01);let g=run.g;
const center=g.bossHazards.find(h=>Math.hypot(h.x,h.y)<2);
g.time=center.start+center.delay+.001;B.tickHazards(g,api);equal(g.player.hp,88);
g.player.invuln=0;B.tickHazards(g,api);equal(g.player.hp,88,'resolved strike must not repeat');
run=boss('storm_widow');p.update(.01);g=run.g;g.player.x=300;g.player.y=300;g.time=1.2;B.tickHazards(g,api);equal(g.player.hp,100,'leaving telegraph must evade damage');

// Frozen bosses cannot begin new attacks, but already committed marks resolve.
for(const kind of Object.keys(B.profiles)){
 const {g,e}=boss(kind);g.level=20;ok(E.select(g,'ice_1'));ok(E.select(g,'ice_2'));
 for(let i=0;i<3;i++)E.apply(g,e,'ice');equal(e.elementState.ice.frozenUntil,.25);
 const x=e.x,y=e.y;p.update(.1);equal([e.x,e.y],[x,y]);ok(!g.bossHazards?.length);
 p.update(.17);ok(g.bossHazards.length>0);ok(!E.frozen(g,e));
}

// Minion, projectile and pending-warning budgets survive extreme trigger rates.
run=boss('grave_keeper',true);g=run.g;run.e.summon=0;
for(let i=0;i<13;i++){const minion=p.spawnEnemy('bandit');if(minion)Object.assign(minion,{x:1000+i*30,y:1000})}
equal(g.enemies.length,14);p.update(.01);g.time=1.3;B.tickHazards(g,api);equal(g.enemies.length,14);
run=boss('iron_colonel',true);g=run.g;
for(let i=0;i<100;i++){run.e.cd=0;B.update(g,run.e,.01,1,api)}
equal(g.bossHazards.length,24);g.hostile=Array.from({length:220},()=>({}));g.time=1.2;B.tickHazards(g,api);equal(g.hostile.length,220);
run.e.hp=0;B.tickHazards(g,api);equal(g.bossHazards.length,0);

// Encounter rotation and reward reset are per-run; wave clock pauses in fights.
g=fresh();g.player.invuln=10000;
for(const expected of B.order){
 g.waveTime=g.nextBoss;p.update(.01);equal(g.boss.bossKind||'boss',expected);
 const wave=g.waveTime;p.update(.1);equal(g.waveTime,wave);
 p.damageEnemy(g.boss,g.boss.hp+1,false);p.update(.01);ok(!g.bossWave);
}
equal(g.bossRound,4);equal(g.chests.length,4);
p.newGame('bento');equal(p.game.bossRound,undefined);equal(p.game.bossHazards,undefined);equal(p.game.player.startWeapon,'dynamite');

// Real integration: each new character can use all talents and face a new boss.
for(let index=1;index<C.list.length;index++){
 p.newGame(C.list[index].id);g=p.game;g.spawn=10000;g.nextBoss=10000;g.level=20;g.player.invuln=10000;
 for(const def of E.definitions)ok(E.select(g,def.id));
 const e=p.spawnEnemy(B.order[index]);Object.assign(e,{x:120,y:40,hp:50000,maxHp:50000,cd:0});g.boss=e;g.bossWave=true;
 for(const w of Object.values(g.weapons))Object.assign(w,{level:3,evolved:true,cool:0});
 for(let i=0;i<180;i++){p.update(1/60);for(let k=0;k<20&&p.screen==='upgrade';k++)p.pickUpgrade(0);if(i%30===0)p.drawWorld()}
 ok(g.time>2.9);ok(e.hp<50000);ok(g.enemies.every(n=>Number.isFinite(n.x)&&Number.isFinite(n.y)&&Number.isFinite(n.hp)));
 ok((g.bossHazards?.length||0)<=24);ok(g.elements.fx.length<=96);
}
console.log(`PASS: ${checks} checks; four characters, menu keyboard/click/layout/cache, starter weapons/evolutions, three bosses, telegraphs, phases, freeze, caps, rewards, rotation, reset and elemental integration.`);
