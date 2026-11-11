const assert=require('node:assert/strict');
const {boot}=require('./game_fixture.cjs');
function level(g,n){g.level=n;g.xp=0;g.xpNeed=12;for(let i=1;i<n;i++)g.xpNeed=Math.floor(g.xpNeed*1.23+4)}
const common=[1,1,1,2,2,2,3,4,4,5,6,7,9,11,13,15,18,22,27,32];
for(const character of ['nopal','rosa','bento','iris'])for(const n of [1,2,5,10,20,30])for(const [type,base] of [['bandit',1],['runner',1],['brute',3],['gravedigger',3],['armored',3],['boss',28]]){
 const f=boot();f.p.newGame(character);const g=f.p.game;level(g,n);g.spawn=100;g.nextBoss=Infinity;
 for(const w of Object.values(g.weapons))w.level=0;
 const e=f.p.spawnEnemy(type);Object.assign(e,{x:500,y:500,speed:0});
 f.p.damageEnemy(e,e.hp+1,false);f.p.update(.01);
 assert.equal(g.gems.length,1);assert.equal(g.kills,1);assert.equal(g.xp,0);
 const gem=g.gems[0],expected=Math.round(base*1.2**(n-1));assert.equal(gem.value,expected);
 if(base===1&&n<=20)assert.equal(gem.value,common[n-1]);
 assert.equal(gem.r,base===28?9:5,'scaled XP must not change gem radius/tier');
 assert.equal(gem.color,base===28?'#ffbd52':base===3?'#68e3cf':'#65c5e8');
 // A drop is valued once at defeat; waiting or gaining a level cannot compound it.
 level(g,n+1);const atDrop=gem.value;f.p.update(.01);assert.equal(gem.value,atDrop);
 g.chests=[];Object.assign(gem,{x:g.player.x,y:g.player.y});
 let xp=atDrop,need=g.xpNeed,after=g.level,earned=0;
 while(xp>=need){xp-=need;after++;need=Math.floor(need*1.23+4);earned++}
 f.p.update(.01);assert.equal(g.gems.length,0);assert.equal(g.xp,xp);assert.equal(g.level,after);assert.equal(g.xpNeed,need);
 assert.equal(g.pendingUpgrades,Math.max(0,earned-1));
 f.p.setScreen('playing');f.p.update(.01);assert.equal(g.xp,xp,'gem rewarded twice');
}
const f=boot();level(f.p.game,20);f.p.game.spawn=100;
const e=f.p.spawnEnemy('bandit');e.hp=0;
f.p.setScreen('pause');f.p.update(1);assert.equal(f.p.game.gems.length,0);
f.p.setScreen('playing');f.p.update(.01);assert.equal(f.p.game.gems[0].value,32);
f.p.newGame();assert.equal(f.p.game.level,1);assert.equal(f.p.game.gems.length,0);
console.log('PASS: enemy XP growth across 4 characters, 6 levels and 6 enemy tiers; fixed drop value, original visuals, actual pickup, leftovers/multiple upgrades, no double rewards, pause/reset.');
