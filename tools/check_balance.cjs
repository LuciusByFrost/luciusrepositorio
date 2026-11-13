const assert=require('node:assert/strict');
const {boot}=require('./game_fixture.cjs');
const {p,Ch}=boot();
const close=(a,b)=>assert(Math.abs(a-b)<1e-9,`${a} != ${b}`);
const fresh=()=>{p.newGame();return p.game};
let g=fresh();
const armor=p.upgradePool.find(u=>u.armorUpgrade),powder=p.upgradePool.find(u=>u.damageUpgrade);
for(let i=0;i<20;i++)p.takeUpgrade(g,armor);
close(g.player.armor,.35);assert(!p.canTakeUpgrade(g,armor));
g.player.invuln=0;p.hurtPlayer(100);close(g.player.hp,35);
g.player.hp=100;g.player.invuln=0;g.player.armor=.99;p.hurtPlayer(100);close(g.player.hp,35);
for(let i=0;i<30;i++)p.takeUpgrade(g,powder);
assert.equal(g.upgradeCounts[powder.name],10);close(g.player.damage,1.5);
assert(!p.canTakeUpgrade(g,powder));
for(const special of p.upgradePool.filter(u=>u.weapon)){
 g.weapons[special.weapon].level=1;
 for(let i=0;i<30;i++)p.takeUpgrade(g,special);
 assert.equal(g.upgradeCounts[special.name],10);assert(!p.canTakeUpgrade(g,special));
}
for(const w of Object.values(g.weapons)){
 const base=w.damage;w.level=0;
 assert(p.improveWeapon(w));assert.equal(w.level,1);assert.equal(w.damage,base);
 for(let i=0;i<30;i++)p.improveWeapon(w);
 assert.equal(w.level,10);close(w.damage,base*1.9);
 const before=JSON.stringify(w);assert.equal(p.improveWeapon(w),false);assert.equal(JSON.stringify(w),before);
}
assert.equal(g.weapons.dynamite.damage,95);
// Capped cards disappear from the real selection menu.
for(let i=0;i<50;i++){
 p.setScreen('playing');p.openUpgrades();
 assert(g.choices.every(u=>!u.weaponLevel&&!u.damageUpgrade&&!u.armorUpgrade&&!u.weapon));
}
// Actual weapon cards and stale callbacks cannot exceed level 10.
g=fresh();g.weapons.dynamite.level=9;let card;
for(let i=0;i<200&&!card;i++){
 p.setScreen('playing');p.openUpgrades();card=g.choices.find(u=>u.weaponLevel&&u.weapon==='dynamite');
}
assert(card);p.pickUpgrade(g.choices.indexOf(card));assert.equal(g.weapons.dynamite.level,10);
const damage=g.weapons.dynamite.damage;card.apply(g);assert.equal(g.weapons.dynamite.level,10);assert.equal(g.weapons.dynamite.damage,damage);
// Evolution, normal loot and quiz rewards all respect the same ceiling.
g=fresh();for(const w of Object.values(g.weapons))Object.assign(w,{level:10,evolved:true});
g.weapons.dynamite.level=9;g.weapons.dynamite.evolved=false;
p.openChest(Ch.create(0,0));assert.equal(g.weapons.dynamite.level,10);assert(g.weapons.dynamite.evolved);
assert.equal(g.player.damage,1,'evolution must not multiply global damage');
const capped=JSON.stringify(g.weapons);p.setScreen('playing');p.openChest(Ch.create(0,0));assert.equal(JSON.stringify(g.weapons),capped);
for(let i=0;i<20;i++)p.awardKnowledgeReward({correct:true,question:{reward:{xp:0,weaponChance:1}}});
assert.equal(JSON.stringify(g.weapons),capped);
g.weapons.dynamite.level=9;
p.awardKnowledgeReward({correct:true,question:{reward:{xp:0,weaponChance:1}}});
assert.equal(g.weapons.dynamite.level,10);
g=fresh();assert.deepEqual(Object.keys(g.upgradeCounts),[]);assert.equal(g.player.damage,1);assert.equal(g.player.armor,0);
assert.equal(g.weapons.dynamite.damage,50);assert.equal(g.weapons.dynamite.level,0);
console.log('PASS: 35% mitigation, 10 damage/special upgrades, level 10 across all weapons/reward sources, additive damage, weaker dynamite, capped offers and restart.');
