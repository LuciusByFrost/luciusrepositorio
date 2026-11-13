// Run: node tools/check_chests.cjs
const assert=require('node:assert/strict'),{boot}=require('./game_fixture.cjs');
let count=0;const plain=v=>v===undefined?undefined:JSON.parse(JSON.stringify(v));
function equal(a,b,msg){assert.deepEqual(plain(a),plain(b),msg);count++}
function ok(v,msg){assert(v,msg);count++}
const fixture=boot(),{p,Ch,K,ctx,E,text}=fixture;
function fresh(level=1){p.newGame('nopal');const g=p.game;g.spawn=10000;g.nextBoss=10000;
 Object.values(g.weapons).forEach(w=>w.level=0);setLevel(g,level);return g}
function setLevel(g,level){g.level=level;g.xp=0;g.xpNeed=12;for(let i=1;i<level;i++)g.xpNeed=Math.floor(g.xpNeed*1.23+4)}
function drain(){let n=0;while(p.screen==='upgrade'&&n<250){p.pickUpgrade(0);n++}return n}
function quizChest(g){g.knowledgeUsed=new Set();const c=K.create(g.player.x+20,g.player.y,1);g.chests=[c];p.interactWithKnowledgeChest();return c}

equal(Ch.balance.growth,1.25);equal([1,10,20].map(l=>Ch.reward(l)),[12,89,833]);
equal([1,10,20].map(l=>Ch.reward(l,'boss')),[30,224,2082]);
for(let level=1;level<=100;level++){
 for(const [kind,base] of [['common',12],['boss',30],['knowledge',16]]){
  equal(Ch.reward(level,kind,8),Math.round(base*1.25**(level-1)));
  if(level>1)ok(Ch.reward(level,kind,8)>Ch.reward(level-1,kind,8));
 }
}
equal(Ch.reward(-10),12);equal(Ch.reward(NaN),12);equal(Ch.reward(10000),Number.MAX_SAFE_INTEGER);
equal(Ch.reward(10000,'knowledge',0),0);ok(Number.isSafeInteger(Ch.reward(10000,'knowledge',1e308)));

// Common XP, exactly one reward, and proper level-card queuing.
let g=fresh(),c=Ch.create(0,0);ok(p.openChest(c));equal(c.rewardXP,12);equal(c.rewardLevel,1);equal(g.level,2);equal(g.xp,0);
equal(p.screen,'upgrade');equal(g.pendingUpgrades,0);const state=plain(g);ok(!p.openChest(c));equal(plain(g),state);equal(drain(),1);equal(p.screen,'playing');

// Boss chest gives 30 XP at level 1: two levels, one choice per level.
g=fresh();c=Ch.create(0,0,'boss');ok(p.openChest(c));equal(c.rewardXP,30);equal(g.level,3);equal(g.xp,0);equal(g.pendingUpgrades,1);equal(drain(),2);

// Reward is calculated at collection time, not when the chest spawned.
g=fresh();c=Ch.create(0,0);setLevel(g,10);p.openChest(c);equal(c.rewardXP,89);equal(c.rewardLevel,10);

// Leftover XP and threshold progression are conserved across several levels.
g=fresh(10);g.xp=g.xpNeed-1;const initial=g.xp,amount=Ch.reward(10,'boss');
let expectedXP=initial+amount,expectedNeed=g.xpNeed,expectedLevel=10,levels=0;
while(expectedXP>=expectedNeed){expectedXP-=expectedNeed;expectedNeed=Math.floor(expectedNeed*1.23+4);expectedLevel++;levels++}
c=Ch.create(0,0,'boss');p.openChest(c);equal([g.level,g.xp,g.xpNeed],[expectedLevel,expectedXP,expectedNeed]);equal(drain(),levels);

// Original weapon evolution and heal/upgrade remain alongside XP.
g=fresh();g.weapons.revolver.level=3;p.openChest(Ch.create(0,0));ok(g.weapons.revolver.evolved);equal(g.weapons.revolver.level,5);equal(g.player.damage,1);
g=fresh();g.weapons.solar.level=3;p.openChest(Ch.create(0,0,'boss'));ok(g.weapons.solar.evolved);equal(g.weapons.solar.level,5);
g=fresh();g.player.hp=50;for(const w of Object.values(g.weapons))w.level=w.max;
p.openChest(Ch.create(0,0));equal(g.player.hp,85);equal(g.level,2);ok(Object.values(g.weapons).every(w=>w.level===w.max));

// Real pickup consumes a chest once, and E only interacts with knowledge chests.
g=fresh();c=Ch.create(0,0);g.chests=[c];p.update(.01);equal(g.chests.length,0);equal(g.level,2);equal(g.chestBursts.length,1);
p.update(.5);equal(g.level,2,'level choice pauses collection');drain();p.update(.9);equal(g.chestBursts.length,0);
g=fresh();g.chests=[Ch.create(50,0)];p.interactWithKnowledgeChest();equal(p.screen,'playing');equal(g.knowledgeQuiz,undefined);
equal(K.nearest(g.chests,g.player,100),null);

// Correct answer scales at answer level, grants once, and defers upgrades.
g=fresh(10);g.xp=g.xpNeed-1;c=quizChest(g);equal(p.screen,'knowledge');
const q=g.knowledgeQuiz.quiz;q.question.reward={xp:8,weaponChance:0};const expected=Ch.reward(10,'knowledge',8);
p.drawKnowledgePanel();ok(text.some(t=>t.includes('ACERTO: +'+Ch.format(expected))));
p.answerKnowledgeQuestion(q.question.correct);equal(q.rewardXP,expected);equal(q.rewardLevel,10);ok(g.level>10);equal(p.screen,'knowledge');ok(g.pendingUpgrades>0);
const rewarded=plain(g);p.awardKnowledgeReward(q);p.answerKnowledgeQuestion(q.question.correct);equal(plain(g),rewarded);
p.closeKnowledgePanel();equal(g.chests.length,0);equal(p.screen,'upgrade');const queue=g.pendingUpgrades+1;equal(drain(),queue);

// Wrong answers and unanswered reopens do not produce rewards or reroll XP.
g=fresh(10);c=quizChest(g);const wrong=g.knowledgeQuiz.quiz;
p.answerKnowledgeQuestion((wrong.question.correct+1)%4);equal(g.level,10);equal(g.xp,0);equal(g.pendingUpgrades,0);ok(!g.chestBursts);p.closeKnowledgePanel();equal(g.chests.length,0);
g=fresh();c=quizChest(g);const sameQuestion=g.knowledgeQuiz.quiz.question;p.closeKnowledgePanel();equal(g.chests.length,1);equal(g.xp,0);
setLevel(g,20);p.interactWithKnowledgeChest();equal(g.knowledgeQuiz.quiz.question,sameQuestion);
p.answerKnowledgeQuestion(sameQuestion.correct);equal(c.quiz.rewardLevel,20);equal(c.quiz.rewardXP,Ch.reward(20,'knowledge',sameQuestion.reward.xp));

// No automatic elemental synergy; multiple level rewards remain manual cards.
g=fresh(10);for(const id of ['fire_1','fire_2','electric_1','electric_2'])ok(E.select(g,id));
c=Ch.create(0,0,'boss');p.openChest(c);ok(!E.has(g,'infernal'));ok(g.choices.every(card=>!card.elementalId||E.canSelect(g,card.elementalId)));

// Boss death marks the higher-tier loot without granting XP until collection.
g=fresh(10);const boss=p.spawnEnemy('iron_colonel');Object.assign(boss,{x:500,y:0});g.boss=boss;g.bossWave=true;
p.damageEnemy(boss,boss.hp+1,false);p.update(.01);equal(g.chests.length,1);c=g.chests[0];equal(Ch.type(c),'boss');equal(c.bossName,'Coronel Ferrugem');equal(g.xp,0);
g.gems=[];g.player.x=c.x;g.player.y=c.y;p.update(.01);equal(c.rewardXP,224);equal(g.chests.length,0);

// Pixel renderers are pure, cached, paused and bounded.
g=fresh(20);const canvases=fixture.stats().created;
for(const kind of ['common','boss','knowledge']){
 c=kind==='knowledge'?K.create(100,100,2):Ch.create(100,100,kind);
 const before=plain(c);Ch.draw(ctx,c,100,100,g.time,Ch.preview(g.level,c),true);equal(plain(c),before);
 Ch.burst(g,c,Ch.reward(g.level,kind,8));
}
const before=plain(g);Ch.effects(ctx,g,x=>x,y=>y);equal(plain(g),before);equal(fixture.stats().created,canvases);
for(const screen of ['pause','upgrade','knowledge']){p.setScreen(screen);p.update(1);equal(plain(g),before)}
for(let i=0;i<30;i++)Ch.burst(g,Ch.create(0,0),12);equal(g.chestBursts.length,12);
g.time=1;Ch.tick(g);equal(g.chestBursts.length,0);
p.newGame('iris');equal(p.game.chestBursts,undefined);equal(p.game.level,1);equal(p.game.xp,0);equal(p.game.pendingUpgrades,0);
console.log(`PASS: ${count} checks; exponential XP, common/boss/quiz rewards, no duplicates, thresholds/queued choices, evolutions, quiz correctness, boss drops, pure cached visuals, pause and restart.`);
