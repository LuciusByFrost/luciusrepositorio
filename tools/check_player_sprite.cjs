// Run: node tools/check_player_sprite.cjs
// Deterministic simulation comparison against the committed game, plus renderer checks.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const current=fs.readFileSync('js/main.js','utf8');
// Compare unrelated mechanics at the explicitly approved dynamite balance.
const baseline=execFileSync('git',['show','HEAD:js/main.js'],{encoding:'utf8'})
 .replace(/dynamite:\{[^\n]+/,current.match(/dynamite:\{[^\n]+/)[0])
 .replace('const radius=74*game.player.area','const radius=110*game.player.area')
 .replace('pierce:0,invuln:0','pierce:0,area:1,invuln:0');
function boot(source){
 let seed=42,created=0,draws=0;
 const math=Object.create(Math);math.random=()=>((seed=seed*16807%2147483647)-1)/2147483646;
 const context=new Proxy({},{get:(o,k)=>o[k]??(o[k]=()=>{if(k==='drawImage')draws++;return {addColorStop(){}}}),set:(o,k,v)=>(o[k]=v,true)});
 const element=()=>({getContext:()=>context,querySelector:()=>element(),addEventListener(){},getBoundingClientRect:()=>({width:960,height:600,left:0,top:0}),style:{}});
 const sandbox={console,Math:math,performance:{now:()=>1000},localStorage:{getItem:()=>'{"sound":false}',setItem(){}},requestAnimationFrame(){},window:{addEventListener(){}},document:{querySelector:()=>element(),createElement:()=>{created++;return element()}}};
 sandbox.addEventListener=()=>{};sandbox.window=sandbox;
 vm.createContext(sandbox);
 for(const f of ['js/network_questions.js','js/knowledge_chests.js','js/characters.js','js/player_sprite.js','js/weapon_visuals.js','js/elements.js','js/element_visuals.js','js/bosses.js','js/chests.js'])vm.runInContext(fs.readFileSync(f,'utf8'),sandbox);
 source=source.replace(/\}\)\(\);\s*$/,`globalThis.probe={newGame,update,draw,drawWorld,drawPlayer,drawHeldWeapon,fireWeapon,explode,hurtPlayer,spawnEnemy,keys,get game(){return game},setScreen:s=>screen=s,get screen(){return screen}};})();`);
 vm.runInContext(source,sandbox);sandbox.probe.newGame();
 return {s:sandbox,p:sandbox.probe,stats:()=>({created,draws}),resetSeed:()=>{seed=42}};
}
const old=boot(baseline),now=boot(current);
function state(p){const g=p.game;return JSON.parse(JSON.stringify(g,(k,v)=>['visualMoving','visualStride','lassoArcs','weaponFx','visualWeapon','visualBorn','elements','characterId','startWeapon'].includes(k)?undefined:v))}
for(let i=0;i<900;i++){
 for(const b of [old,now]){
  b.p.keys.clear();if(i%180<120)b.p.keys.add(i%360<180?'d':'a');if(i%90<30)b.p.keys.add('w');
  b.p.update(1/60);
 }
 assert.deepEqual(state(now.p),state(old.p),`simulation changed at frame ${i}`);
 now.p.draw();
}
const p=now.p.game.player,created=now.stats().created;
for(const b of [old,now]){b.p.keys.clear();b.p.update(1/60)}
assert.equal(p.visualMoving,false);assert.equal(p.r,15);
const snapshot=JSON.stringify(p);
for(const facing of [-1,1])for(const weapon of Object.keys(now.p.game.weapons))for(const angle of [0,Math.PI/2,Math.PI,-Math.PI/2]){
 const sample={...p,facing,heldWeapon:weapon,weaponAngle:angle,attack:.09,muzzleFlash:.05,invuln:1};
 now.p.drawPlayer(sample);
}
assert.equal(JSON.stringify(p),snapshot,'drawing mutated the player');
assert.equal(now.stats().created,created,'renderer allocated new canvases');
const pose=vm.runInContext('CactusHero.pose',now.s);
assert.equal(pose({...p,visualMoving:false},1).step,0);
assert.notEqual(pose({...p,visualMoving:false},0).bob,pose({...p,visualMoving:false},.5).bob);
assert.equal(pose({...p,visualMoving:true,visualStride:Math.PI/2},1).step,2);
assert.equal(pose({...p,invuln:1},1).expression,'hurt');
assert.equal(pose({...p,invuln:0,attack:.09},1).expression,'attack');
assert(pose({...p,attack:.09},1).recoil>0);
assert(pose({...p,attack:.09},1).hatKick>0,'hat must react to firing');
assert.equal(pose({...p,invuln:1},1).squish,true);
assert.equal(pose({...p,invuln:.9},1).squish,false,'compression must recover quickly');
assert.equal(pose({...p,invuln:0,attack:0},4.6).expression,'blink');
assert.equal(pose({...p,invuln:0,attack:0,visualMoving:false},4.8).expression,'idle');
assert.equal(pose({...p,invuln:1},4.6).expression,'hurt','damage overrides blink');
for(const id of Object.keys(now.p.game.weapons)){
 for(const b of [old,now]){b.p.spawnEnemy('bandit');const e=b.p.game.enemies.at(-1);e.x=b.p.game.player.x+60;e.y=b.p.game.player.y;const w=b.p.game.weapons[id];w.level=1;b.p.fireWeapon(w)}
 assert.deepEqual(state(now.p),state(old.p),`weapon mechanics changed: ${id}`);
}
for(const b of [old,now]){b.p.game.player.invuln=0;b.p.hurtPlayer(5)}
assert.deepEqual(state(now.p),state(old.p),'damage mechanics changed');
// Exercise real collision and damage at the enlarged explosion boundary.
now.p.newGame();
assert.equal(now.p.game.player.area,1,'area multiplier must be initialized');
assert.equal(now.p.game.weapons.dynamite.damage,70);
assert.equal(now.p.game.weapons.dynamite.cd,4.2);
function blastCase(area,evolved,inside,outside){
 const g=now.p.game;g.enemies=[];g.player.area=area;g.player.crit=0;g.weapons.dynamite.evolved=evolved;
 for(const x of [0,inside,outside]){const e=now.p.spawnEnemy('brute');Object.assign(e,{x,y:0,r:10,hp:500})}
 now.p.explode({tx:0,ty:0,damage:70});
 assert.deepEqual(Array.from(g.enemies,e=>e.hp),[430,430,500]);
}
blastCase(1,false,119,121);
blastCase(1.25,false,147,149);
blastCase(1,true,158,160);
// Visual lasso links must reflect the original chain without changing its RNG,
// hit order, immediate damage, target limit or normal/evolved jump distance.
for(const evolved of [false,true]){
 for(const b of [old,now]){
  b.resetSeed();b.p.newGame();const g=b.p.game;g.player.crit=0;g.spawn=100;
  for(const x of [70,280,320,340]){const e=b.p.spawnEnemy('bandit');Object.assign(e,{x,y:0,hp:500,speed:0})}
  Object.values(g.weapons).forEach(w=>w.level=0);
  Object.assign(g.weapons.lasso,{level:1,evolved});b.p.fireWeapon(g.weapons.lasso);
 }
 assert.deepEqual(state(now.p),state(old.p),'lasso damage or random sequence changed');
 const arcs=now.p.game.lassoArcs;assert.equal(arcs.length,evolved?3:1);
 assert.equal(arcs[0].x2,70);if(evolved){assert.equal(arcs[1].x1,70);assert.equal(arcs[1].x2,280);assert.equal(arcs[2].x2,320)}
 now.p.setScreen('pause');now.p.update(.2);assert.equal(now.p.game.time,0,'pause advanced lasso animation');now.p.setScreen('playing');
 for(let i=0;i<36;i++){
  for(const b of [old,now])b.p.update(1/60);
  const before=JSON.stringify(now.p.game);now.p.draw();assert.equal(JSON.stringify(now.p.game),before,'lasso render mutated gameplay');
  assert.deepEqual(state(now.p),state(old.p),'lasso animation changed simulation');
 }
 assert.equal(now.p.game.lassoArcs.length,0,'expired arcs were retained');
}
now.p.newGame();now.p.fireWeapon(now.p.game.weapons.lasso);assert.equal(now.p.game.lassoArcs,undefined,'no target should produce no arcs');
console.log('PASS: 900 frames equivalent at approved dynamite balance; all 8 weapons; r=15; sprite poses and cache; dynamite damage=70, radius=110, area upgrades and evolution boundaries.');
console.log('PASS: lasso normal/evolved chain, damage and RNG unchanged; sequential link endpoints, pause, cleanup and render purity.');

// Stress overlapping attacks with every weapon enabled, including evolutions.
for(const evolved of [false,true]){
 for(const b of [old,now]){
  b.resetSeed();b.p.newGame();const g=b.p.game;g.spawn=100;
  for(const [x,y] of [[65,0],[135,30],[220,-40],[280,50]]){
   const e=b.p.spawnEnemy('brute');Object.assign(e,{x,y,hp:100000,maxHp:100000,speed:0});
  }
  for(const w of Object.values(g.weapons))Object.assign(w,{level:1,evolved,cd:.3,cool:0});
 }
 const canvasCount=now.stats().created;
 for(let i=0;i<120;i++){
  for(const b of [old,now])b.p.update(1/60);
  assert.deepEqual(state(now.p),state(old.p),`overlapping weapons changed gameplay at frame ${i}, evolved=${evolved}`);
  const before=JSON.stringify(now.p.game);now.p.drawWorld();
  assert.equal(JSON.stringify(now.p.game),before,'weapon renderer mutated the simulation');
 }
 assert.equal(now.stats().created,canvasCount,'weapon animation allocated canvases during rendering');
 const time=now.p.game.time,fx=JSON.stringify(now.p.game.weaponFx);
 now.p.setScreen('pause');now.p.update(.5);assert.equal(now.p.game.time,time);assert.equal(JSON.stringify(now.p.game.weaponFx),fx);
 now.p.setScreen('playing');for(const w of Object.values(now.p.game.weapons))w.level=0;
 now.p.game.shots=[];now.p.game.hazards=[];now.p.update(.7);
 assert.equal(now.p.game.weaponFx.length,0,'expired weapon effects were retained');
}
const visuals=vm.runInContext('WeaponVisuals',now.s);
for(let i=0;i<150;i++)visuals.emit(now.p.game,'blast',0,0,0,110);
assert.equal(now.p.game.weaponFx.length,96,'effect cap exceeded');
console.log('PASS: all 8 weapons overlap for 120 frames, normal and evolved; gameplay/RNG unchanged; render purity, pause, cleanup, 96-effect cap and no new canvases.');

// Optional self-contained browser inspection page, including the real game renderer.
if(process.argv.includes('--preview')){
 const expose=current.replaceAll('requestAnimationFrame(frame)','void 0').replace(/\}\)\(\);\s*$/,`window.heroPreview={newGame,openChest,awardKnowledgeReward,answerKnowledgeQuestion,interactWithKnowledgeChest,closeKnowledgePanel,draw,drawHUD,drawCharacterSelect,openCharacterSelect,shootHostile,hurtPlayer,drawWorld,drawPlayer,drawEnemy,drawUpgrade,openUpgrades,pickUpgrade,damageEnemy,update,drawLassoEffects,drawProjectileSprite,spawnEnemy,fireWeapon,setGame:g=>game=g,setSound:on=>audioOn=on,get game(){return game},setScreen:s=>screen=s};})();`);
 const scripts=['js/network_questions.js','js/knowledge_chests.js','js/characters.js','js/player_sprite.js','js/weapon_visuals.js','js/elements.js','js/element_visuals.js','js/bosses.js','js/chests.js'].map(f=>fs.readFileSync(f,'utf8')).join('\n');
 const html=`<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#242a32}canvas{width:1200px;height:800px;image-rendering:pixelated}#touch,#toast,#interact{display:none}</style><canvas id="game"></canvas><div id="touch"><i></i></div><div id="toast"></div><button id="interact"></button><script>window.onerror=(m,u,l)=>{document.body.insertAdjacentHTML('beforeend','<pre style="color:white;position:fixed;top:0">'+m+' at '+l+'</pre>')};</script><script>${scripts}\n${expose}\nfunction paintPreview(){const c=document.querySelector('canvas'),g=c.getContext('2d'),h=heroPreview;h.newGame();h.game.time=1;h.drawWorld();const p=h.game.player;g.fillStyle='#242a32';g.fillRect(0,0,1200,800);g.fillStyle='#e5ce9e';g.font='20px monospace';g.fillText('CACTO PISTOLEIRO / camadas Canvas / escala real e 4x',30,36);const cases=[['Idle',{attack:0}],['Walk',{visualMoving:true,visualStride:Math.PI/2}],['Attack',{attack:.09,muzzleFlash:.05}],['Hurt',{invuln:1}],['Aim left',{weaponAngle:Math.PI,facing:1}],['Shotgun',{heldWeapon:'shotgun',weaponAngle:-.7}]];cases.forEach(([name,a],i)=>{g.save();g.translate(90+(i%3)*390,180+Math.floor(i/3)*350);h.drawPlayer({...p,x:-600,y:-400,...a});g.translate(130,70);g.scale(4,4);h.drawPlayer({...p,x:-600,y:-400,...a});g.restore();g.fillStyle='#e5ce9e';g.fillText(name,30+(i%3)*390,70+Math.floor(i/3)*350)});}paintPreview();window.addEventListener('resize',paintPreview);</script>`;
 const output=process.argv.includes('--map')?html.replace("paintPreview();window.addEventListener('resize',paintPreview);",`function paintMap(){heroPreview.newGame();heroPreview.game.time=1;heroPreview.drawWorld();const g=document.querySelector('canvas').getContext('2d');g.fillStyle='#e5ce9e';g.font='18px monospace';g.textAlign='left';g.fillText('Estrada de terra / terreno noturno / cactos esparsos',24,30)}paintMap();window.addEventListener('resize',paintMap);`):html;
 const lassoOutput=process.argv.includes('--lasso')?html.replace("paintPreview();window.addEventListener('resize',paintPreview);",`function paintLasso(){const h=heroPreview;h.newGame();h.game.player.x=-180;for(const [x,y] of [[-70,-60],[50,15],[150,-35]]){const e=h.spawnEnemy('bandit');Object.assign(e,{x,y,hp:500,maxHp:500})}const w=h.game.weapons.lasso;w.level=1;h.fireWeapon(w);h.game.time=.14;h.drawWorld();const g=document.querySelector('canvas').getContext('2d');g.fillStyle='#e5ce9e';g.font='18px monospace';g.textAlign='left';g.fillText('Laco eletrico / corrente entre tres alvos / sem mudar dano',24,30)}paintLasso();window.addEventListener('resize',paintLasso);`):output;
 const finalOutput=process.argv.includes('--weapons')?html.replace("paintPreview();window.addEventListener('resize',paintPreview);",'').replace(/<\/script>$/,'</script><script src="weapon-preview.js"></script>'):lassoOutput;
 const reviewed=process.argv.includes('--elements')?html.replace("paintPreview();window.addEventListener('resize',paintPreview);",'').replace(/<\/script>$/,'</script><script src="element-preview.js"></script>'):finalOutput;
 const roster=process.argv.includes('--roster')?html.replace("paintPreview();window.addEventListener('resize',paintPreview);",'').replace(/<\/script>$/,'</script><script src="roster-preview.js"></script>'):reviewed;
 const chests=process.argv.includes('--chests')?html.replace("paintPreview();window.addEventListener('resize',paintPreview);",'').replace(/<\/script>$/,'</script><script src="chest-preview.js"></script>'):roster;
 fs.writeFileSync('tools/player-preview.generated.html',chests);
 console.log('Generated tools/player-preview.generated.html for browser inspection.');
}
