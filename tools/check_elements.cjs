// Run: node tools/check_elements.cjs. Real modules + real game in a Canvas mock.
const assert=require('node:assert/strict');
const {boot}=require('./game_fixture.cjs');
let assertions=0;
function ok(value,message){assert(value,message);assertions++}
function equal(a,b,message){assert.deepEqual(snapshot(a),snapshot(b),message);assertions++}
const {p,E,V,ctx,text}=boot();
function fresh(ids=[]){p.newGame();const g=p.game;g.level=20;g.spawn=10000;g.nextBoss=10000;
 Object.values(g.weapons).forEach(w=>w.level=0);for(const id of ids)ok(E.select(g,id),'select '+id);return g}
function enemy(g,x=100,y=0,boss=false,hp=1000){const e=p.spawnEnemy(boss?'boss':'brute');Object.assign(e,{x,y,hp,maxHp:hp,speed:0,cd:10000,summon:10000});return e}
function basics(...ids){return ids.flatMap(id=>[id+'_1',id+'_2'])}
function advance(g,time,step=.05){const start=g.time;for(let i=1;i<=Math.ceil(time/step);i++){g.time=start+Math.min(time,i*step);E.tick(g,step,p.damageEnemy)}}
function snapshot(value){return value===undefined?undefined:JSON.parse(JSON.stringify(value))}

// Trees, exact pair whitelist and manual, one-time synergy selection.
equal(E.definitions.length,16);equal(E.definitions.filter(d=>d.synergy).length,4);
equal(E.definitions.filter(d=>d.synergy).map(d=>d.id),['infernal','combustion','shards','plague']);
let g=fresh();g.level=2;
equal(E.cards(g).map(c=>c.id),['fire_1','ice_1','electric_1','poison_1']);
ok(!E.select(g,'fire_2'));ok(!E.select(g,'infernal'));ok(E.select(g,'fire_1'));ok(!E.select(g,'fire_1'));
g.level=3;ok(!E.canSelect(g,'fire_2'));g.level=4;ok(E.select(g,'fire_2'));ok(E.select(g,'electric_1'));ok(E.select(g,'electric_2'));
g.level=5;ok(!E.canSelect(g,'infernal'));g.level=6;
ok(E.cards(g).some(c=>c.id==='infernal'));ok(!E.has(g,'infernal'),'eligibility must not activate synergy');
const card=E.cards(g).find(c=>c.id==='infernal');ok(card.apply(g));ok(!card.apply(g));ok(!E.cards(g).some(c=>c.id==='infernal'));

// Fixed-rate damage, expiration, refresh and hard stack caps.
g=fresh(['fire_1']);let e=enemy(g);for(let i=0;i<20;i++)E.apply(g,e,'fire');equal(e.elementState.burn.stacks,3);
advance(g,.5);equal(e.hp,991,'3 stacks * 3 damage at first half-second');
g.time=.6;E.apply(g,e,'fire');equal(e.elementState.burn.next,1,'refresh must not postpone or duplicate ticks');
advance(g,3.5);ok(!e.elementState.burn);ok(Number.isFinite(e.hp));
g=fresh(basics('fire'));e=enemy(g);for(let i=0;i<20;i++)E.apply(g,e,'fire');equal(e.elementState.burn.stacks,5);advance(g,.5);equal(e.hp,980);
g=fresh(['poison_1']);e=enemy(g);for(let i=0;i<20;i++)E.apply(g,e,'poison');equal(e.elementState.poison.stacks,4);advance(g,.5);equal(e.hp,992);
advance(g,5);ok(!e.elementState.poison);

// Slow, freeze, recovery and boss immunity window; base speed is never mutated.
g=fresh(['ice_1']);e=enemy(g);e.speed=68;E.apply(g,e,'ice');equal(E.speed(g,e),.75);equal(e.speed,68);
for(let i=0;i<3;i++)E.apply(g,e,'ice');ok(E.frozen(g,e));equal(E.speed(g,e),0);
g.time=.51;ok(!E.frozen(g,e));equal(E.speed(g,e),.75);g.time=2.1;equal(E.speed(g,e),1);
g=fresh(basics('ice'));const boss=enemy(g,200,0,true);e=enemy(g);
for(let i=0;i<3;i++){E.apply(g,boss,'ice');E.apply(g,e,'ice')}
equal(boss.elementState.ice.frozenUntil,.25);equal(e.elementState.ice.frozenUntil,1);
g.time=.3;for(let i=0;i<30;i++)E.apply(g,boss,'ice');ok(!E.frozen(g,boss));equal(E.speed(g,boss),.85);
g.time=4.3;for(let i=0;i<3;i++)E.apply(g,boss,'ice');ok(E.frozen(g,boss));

// Electricity hits each target once and respects chain count and jump radius.
g=fresh(['electric_1']);e=enemy(g,0);const n1=enemy(g,50),n2=enemy(g,100),far=enemy(g,500);
E.discharge(g,e,p.damageEnemy);equal([e.hp,n1.hp,n2.hp,far.hp],[992,992,992,1000]);
const health=e.hp;E.discharge(g,e,p.damageEnemy);equal(e.hp,health,'electric interval');

// Poison propagation: three recipients, once per death, bounded generations.
g=fresh(basics('poison'));e=enemy(g,0);const neighbors=Array.from({length:5},(_,i)=>enemy(g,20+i*5));
E.apply(g,e,'poison');e.hp=0;E.resolveDeaths(g,p.damageEnemy);
equal(neighbors.filter(n=>n.elementState?.poison).length,3);equal(neighbors[0].elementState.poison.generation,1);
const poisonFx=g.elements.fx.length;E.resolveDeaths(g,p.damageEnemy);equal(g.elements.fx.length,poisonFx);
const gen1=neighbors[0];gen1.hp=0;E.resolveDeaths(g,p.damageEnemy);
ok(neighbors.some(n=>n.elementState?.poison?.generation===2));
g=fresh(basics('poison'));e=enemy(g,0);const uninfected=enemy(g,30);E.apply(g,e,'poison',2);e.hp=0;E.resolveDeaths(g,p.damageEnemy);ok(!uninfected.elementState?.poison);
g=fresh(basics('poison'));e=enemy(g,0,0,false,20);const finalTickNeighbor=enemy(g,30);
E.apply(g,e,'poison');advance(g,5);equal(e.hp,0);E.resolveDeaths(g,p.damageEnemy);
ok(finalTickNeighbor.elementState?.poison,'death on the final poison tick must still spread');

// Tempestade Infernal: card gate, burning gate, radius, damage, cooldown.
g=fresh(basics('fire','electric'));e=enemy(g,0);let near=enemy(g,50),out=enemy(g,130);
E.apply(g,e,'fire');g.elements.seed=1;E.lightningReactions(g,e,p.damageEnemy);equal(near.hp,1000);
ok(E.select(g,'infernal'));g.elements.seed=1;E.lightningReactions(g,e,p.damageEnemy);
equal([e.hp,near.hp,out.hp],[982,982,1000]);ok(g.elements.fx.some(f=>f.type==='infernal'));
E.lightningReactions(g,e,p.damageEnemy);equal(near.hp,982);

// Combustão Tóxica: death trigger and propagation, no automatic combination.
g=fresh(basics('fire','poison'));e=enemy(g,0);near=enemy(g,40);E.apply(g,e,'fire');E.apply(g,e,'poison');e.hp=0;
g.elements.seed=1;E.resolveDeaths(g,p.damageEnemy);equal(near.hp,1000);
g=fresh([...basics('fire','poison'),'combustion']);e=enemy(g,0);near=enemy(g,40);out=enemy(g,150);
E.apply(g,e,'fire');E.apply(g,e,'poison');e.hp=0;g.elements.seed=1;E.resolveDeaths(g,p.damageEnemy);
equal([near.hp,out.hp],[986,1000]);ok(near.elementState.burn);ok(near.elementState.poison);equal(near.elementState.poison.generation,1);
ok(g.elements.fx.some(f=>f.type==='combustion'));
// Live targets may also combust from a direct weapon hit; secondary damage is
// not allowed to call onHit again or activate a reaction automatically.
g=fresh([...basics('fire','poison'),'combustion']);e=enemy(g,0);near=enemy(g,40);
E.apply(g,e,'fire');E.apply(g,e,'poison');g.elements.seed=2;E.onHit(g,e,'revolver',p.damageEnemy);
ok(g.elements.fx.some(f=>f.type==='combustion'));equal(near.hp,986);
const budgetAfter=g.elements.budget;E.onHit(g,near,'element',p.damageEnemy);equal(g.elements.budget,budgetAfter);

// Estilhaços Condutores: freeze condition, four targets and one activation.
g=fresh([...basics('ice','electric'),'shards']);e=enemy(g,0);const shardTargets=Array.from({length:6},(_,i)=>enemy(g,25+i*10));
E.lightningReactions(g,e,p.damageEnemy);equal(shardTargets.filter(n=>n.hp<1000).length,0);
for(let i=0;i<3;i++)E.apply(g,e,'ice');E.lightningReactions(g,e,p.damageEnemy);
equal(shardTargets.filter(n=>n.hp===986).length,4);equal(e.hp,1000);
E.lightningReactions(g,e,p.damageEnemy);equal(shardTargets.filter(n=>n.hp===986).length,4);

// Praga Cristalizada multiplies every kind of damage exactly once, while active.
g=fresh([...basics('ice','poison'),'plague']);e=enemy(g);E.apply(g,e,'poison');equal(E.multiplier(g,e),1);
for(let i=0;i<3;i++)E.apply(g,e,'ice');equal(E.multiplier(g,e),1.3);
p.damageEnemy(e,10,false,'element');equal(e.hp,987);g.time=1.01;equal(E.multiplier(g,e),1);

// All eight real weapon entry points apply elements, including area and orbit.
const savedOnHit=E.onHit,seen={};E.onHit=(game,target,source,damage)=>{seen[source]=(seen[source]||0)+1;return savedOnHit(game,target,source,damage)};
for(const id of ['revolver','shotgun','dynamite','thorns','lasso','rain','meteor','solar']){
 g=fresh(['fire_1']);e=enemy(g,id==='dynamite'?170:70);g.player.crit=0;g.elements.seed=12345;
 const w=g.weapons[id];w.level=1;w.cool=10000;p.fireWeapon(w);w.cool=10000;
 for(let i=0;i<72;i++)p.update(1/60);
 ok(seen[id]>0,id+' must reach onHit');ok(e.elementState?.burn,id+' must burn at controlled proc seed');
 equal(g.player.r,15);ok(Number.isFinite(e.hp));
}
E.onHit=savedOnHit;

// The native lasso's real discharge triggers an explicitly selected synergy.
g=fresh([...basics('fire','electric'),'infernal']);e=enemy(g,70);near=enemy(g,105);
E.apply(g,e,'fire');g.elements.seed=1;p.fireWeapon(g.weapons.lasso);
ok(g.elements.fx.some(f=>f.type==='infernal'));ok(near.hp<1000);
g=fresh([...basics('fire','electric'),'infernal']);e=enemy(g,70);near=enemy(g,110,0,false,10);const surviving=enemy(g,150);
g.player.crit=0;E.apply(g,e,'fire');g.elements.seed=1;p.fireWeapon(g.weapons.lasso);
equal(g.lassoArcs.map(a=>a.x2),[70,150],'lasso must skip a target killed by the previous elemental blast');ok(surviving.hp<1000);

// A stronger shotgun/rain volley lowers per-target proc probability rather
// than multiplying elemental stacks by projectile count.
function procRate(id,qty){let hits=0;const sample=fresh(['fire_1']);sample.weapons[id].qty=qty;
 for(let i=0;i<1000;i++){const n={x:0,y:0,r:10,hp:1000};E.onHit(sample,n,id,p.damageEnemy);if(n.elementState?.burn)hits++}
 return hits;
}
const single=procRate('revolver',1),pellets=procRate('shotgun',5),rain=procRate('rain',10);
ok(single>300&&single<460);ok(pellets<single*.65);ok(rain<pellets);

// Same-frame area/pellet spam gets one roll per enemy+weapon every .28 seconds.
g=fresh(['fire_1']);e=enemy(g);g.elements.seed=12345;
for(let i=0;i<1000;i++)E.onHit(g,e,'shotgun',p.damageEnemy);
equal(e.elementState.burn.stacks,1);const seedAfter=g.elements.seed;
E.onHit(g,e,'shotgun',p.damageEnemy);equal(g.elements.seed,seedAfter,'blocked hit must not roll again');
g.time=.29;E.onHit(g,e,'shotgun',p.damageEnemy);ok(g.elements.seed!==seedAfter);
g=fresh(['fire_1']);e=enemy(g,100,0,false,10000);
for(let i=0;i<100;i++)p.damageEnemy(e,1,false,'element');equal(g.floaters.length,1);equal(g.floaters[0].text,100);
equal(e.hp,9900,'number aggregation must not change total damage');

// Complete build under dense repeated impacts: no recursive procs or unbounded FX.
g=fresh(E.definitions.map(d=>d.id));const crowd=Array.from({length:32},(_,i)=>enemy(g,(i%8)*20,Math.floor(i/8)*20,false,1e6));
for(const n of crowd){E.apply(g,n,'fire');E.apply(g,n,'poison');for(let i=0;i<3;i++)E.apply(g,n,'ice')}
for(let frame=0;frame<120;frame++){
 g.time+=1/60;E.tick(g,1/60,p.damageEnemy);
 for(const n of crowd)for(const weapon of Object.keys(g.weapons))E.onHit(g,n,weapon,p.damageEnemy);
 E.resolveDeaths(g,p.damageEnemy);
 ok(g.elements.budget>=0&&g.elements.budget<=12,'reaction budget');ok(g.elements.fx.length<=96,'effect budget');
}
ok(crowd.every(n=>Number.isFinite(n.hp)));ok(crowd.every(n=>(n.elementState.burn?.stacks||0)<=5&&(n.elementState.poison?.stacks||0)<=6));

// Pause, card screens, quizzes and death freeze every elemental clock.
for(const screen of ['pause','upgrade','knowledge','dead']){
 const before=snapshot(g);p.setScreen(screen);p.update(.5);equal(snapshot(g),before,screen+' must pause elements');
}
p.setScreen('playing');

// Real upgrade menu: eligibility, no duplicates, invalid stale card rejected.
g=fresh();g.level=2;
for(let i=0;i<100;i++){
 p.setScreen('playing');p.openUpgrades();equal(g.choices.length,3);
 const ids=g.choices.filter(c=>c.elementalId).map(c=>c.elementalId);equal(new Set(ids).size,ids.length);
 for(const c of g.choices)if(c.elementalId)ok(E.canSelect(g,c.elementalId));
}
let applied=false;g.choices=[{elementalId:'infernal',apply:()=>{applied=true}}];p.pickUpgrade(0);ok(!applied);
g.choices=E.cards(g).slice(0,3);const chosen=g.choices[0].id,l=p.upgradeLayout();
p.handleClick({clientX:l.x+10,clientY:l.y-10});ok(!E.has(g,chosen),'click above card must do nothing');
p.handleClick({clientX:l.x+10,clientY:l.y+10});ok(E.has(g,chosen));equal(p.screen,'playing');

// Chests preserve the build and never grant a synergy automatically.
g=fresh(basics('fire','electric'));const owned=snapshot(g.elements.owned);
g.weapons.revolver.level=3;p.openChest();ok(g.weapons.revolver.evolved);equal(snapshot(g.elements.owned),owned);ok(!E.has(g,'infernal'));
g.knowledgeUsed=new Set();
// Use the actual chest system from the already-running game via spawn initialization.
g.chests=[{id:1,knowledge:true,special:true,x:g.player.x,y:g.player.y,bob:0,used:false,opened:false,quiz:null}];
p.setScreen('playing');p.interactWithKnowledgeChest();equal(p.screen,'knowledge');
const quiz=g.knowledgeQuiz.quiz;quiz.answered=true;quiz.correct=true;quiz.question.reward={xp:100,weaponChance:0};
p.awardKnowledgeReward(quiz);const level=g.level;p.awardKnowledgeReward(quiz);equal(g.level,level);equal(snapshot(g.elements.owned),owned);
p.closeKnowledgePanel();equal(p.screen,'upgrade');ok(g.choices.every(c=>!c.elementalId||E.canSelect(g,c.elementalId)));

// Elemental deaths still award a boss chest, kills and XP gems exactly once.
g=fresh(['fire_1']);const deadBoss=enemy(g,500,0,true,2);g.boss=deadBoss;g.bossWave=true;E.apply(g,deadBoss,'fire');
p.update(.5);equal(g.kills,1);equal(g.enemies.length,0);equal(g.chests.length,1);equal(g.gems.length,1);ok(!g.bossWave);
p.update(.1);equal(g.kills,1);
g=fresh([...basics('fire','poison'),'combustion']);e=enemy(g,500);near=enemy(g,530,0,false,10);
for(const n of [e,near]){E.apply(g,n,'fire');E.apply(g,n,'poison')}
e.hp=0;g.elements.seed=1;p.update(.01);equal(g.kills,2,'secondary death must not lose its reward');equal(g.gems.length,2);

// Rendering must be pure and cards display the actual prerequisites.
g=fresh(basics('fire','electric'));const offers=E.cards(g),synergy=offers.find(c=>c.id==='infernal');
g.choices=[synergy,offers.find(c=>c.id==='fire_3'),offers.find(c=>c.id==='ice_1')];p.setScreen('upgrade');
const before=snapshot(g);p.drawUpgrade();equal(snapshot(g),before);ok(text.some(s=>s.includes('PRÉ-REQUISITOS')));ok(text.some(s=>s.includes('SINERGIA')));
const rects=[],hudContext=new Proxy({fillRect:(...r)=>rects.push(r)},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
V.hud(hudContext,g,480);equal(rects[0],[348,103,120,72],'narrow-screen build HUD must sit below health and to the right of weapons');
// Every synergy also works on a boss during its short freeze window.
for(const synergy of ['infernal','combustion','shards','plague']){
 g=fresh([...basics('fire','ice','electric','poison'),synergy]);
 e=enemy(g,150,0,true);near=enemy(g,190);
 E.apply(g,e,'fire');E.apply(g,e,'poison');for(let i=0;i<3;i++)E.apply(g,e,'ice');
 g.elements.seed=1;
 if(synergy==='combustion'){e.hp=0;E.resolveDeaths(g,p.damageEnemy)}
 else if(synergy==='plague'){p.damageEnemy(e,10,false,'element');equal(e.hp,987)}
 else E.lightningReactions(g,e,p.damageEnemy);
 ok(g.elements.fx.some(f=>f.type===synergy),'boss synergy '+synergy);
}
// Full real-game simulation with every node, synergy, weapon and evolution.
g=fresh(E.definitions.map(d=>d.id));g.player.invuln=10000;
const campaignBoss=enemy(g,180,0,true,50000);g.boss=campaignBoss;g.bossWave=true;
for(let i=0;i<12;i++)enemy(g,60+i%4*45,-50+Math.floor(i/4)*45,false,200);
for(const w of Object.values(g.weapons))Object.assign(w,{level:3,evolved:true,cool:0});
for(let i=0;i<180;i++){
 p.update(1/60);for(let k=0;k<20&&p.screen==='upgrade';k++)p.pickUpgrade(0);
 ok(g.elements.fx.length<=96);ok(g.enemies.every(n=>Number.isFinite(n.hp)&&Number.isFinite(n.x)&&Number.isFinite(n.y)));
 if(i%30===0){const renderState=snapshot(g);p.drawWorld();V.hud(ctx,g,1200);equal(snapshot(g),renderState)}
}
ok(g.time>2.9);ok(campaignBoss.hp<50000);ok(Object.keys(g.elements.owned).length===16);
p.newGame();equal(Object.keys(p.game.elements.owned).length,0);equal(p.game.elements.fx.length,0);equal(p.game.elements.active,0);equal(p.game.enemies.length,0);
console.log(`PASS: ${assertions} checks; four elements, four manual synergies, prerequisites, caps, boss resistance, all weapons, pause, chests, XP/rewards, UI and restart.`);
