/* Browser review only: --preview --roster; ?mode=bosses / ?mode=play. */
(()=>{
 const h=heroPreview,c=document.querySelector('#game'),g=c.getContext('2d'),query=new URLSearchParams(location.search);
 h.setSound(false);window.addEventListener('error',e=>document.documentElement.dataset.rosterError=e.message);
 const mode=query.get('mode');
 if(mode!=='bosses'){c.style.width='100vw';c.style.height='100vh';window.dispatchEvent(new Event('resize'))}
 const api={shoot:h.shootHostile,spawn:h.spawnEnemy,hurt:h.hurtPlayer};
 function smoke(){
  let valid=true,runs=0;
  for(let index=1;index<CharacterRoster.list.length;index++){
   const hero=CharacterRoster.list[index];h.newGame(hero.id);const game=h.game;
   valid&&=game.weapons[hero.weapon].level===1&&Object.values(game.weapons).filter(w=>w.level>0).length===1;
   game.level=20;game.spawn=10000;game.nextBoss=10000;game.player.invuln=10000;
   for(const def of ElementSystem.definitions)ElementSystem.select(game,def.id);
   for(const w of Object.values(game.weapons))Object.assign(w,{level:3,evolved:true,cool:0});
   const boss=h.spawnEnemy(BossSystem.order[index]);Object.assign(boss,{x:220,y:40,hp:50000,maxHp:50000,cd:0});game.boss=boss;game.bossWave=true;
   for(let i=0;i<180;i++){h.update(1/60);for(let k=0;k<20&&game.choices.length;k++)h.pickUpgrade(0);if(i%30===0)h.drawWorld()}
   valid&&=game.time>2.9&&boss.hp<50000&&game.enemies.every(e=>Number.isFinite(e.hp)&&Number.isFinite(e.x)&&Number.isFinite(e.y))&&(game.bossHazards?.length||0)<=24;
   runs++;
  }
  document.documentElement.dataset.rosterSmoke=valid?'passed':'failed';document.documentElement.dataset.rosterRuns=String(runs);
  h.draw();g.fillStyle='#e5d6b0';g.textAlign='left';g.font='15px Georgia';g.fillText('3 personagens + 3 chefes + build elemental completa · '+(valid?'OK':'FALHOU'),24,c.height-40);
 }
 function bosses(){
  g.setTransform(1,0,0,1,0,0);g.imageSmoothingEnabled=false;g.fillStyle='#20262e';g.fillRect(0,0,c.width,c.height);
  BossSystem.order.forEach((kind,i)=>{
   h.newGame(CharacterRoster.list[i].id);const game=h.game;
   game.spawn=10000;game.nextBoss=10000;game.player.x=-530;game.player.y=-40;game.player.invuln=10000;
   Object.values(game.weapons).forEach(w=>w.level=0);
   const boss=h.spawnEnemy(kind);Object.assign(boss,{x:-450,y:-150,cd:0,summon:0});boss.hp=boss.maxHp*.4;game.boss=boss;game.bossWave=true;
   if(i===0)h.update(.01);else BossSystem.update(game,boss,.01,1,api);
   game.time=.25;
   if(i===0)for(const shot of game.hostile){shot.x+=shot.vx*.25;shot.y+=shot.vy*.25}
   g.save();g.beginPath();g.rect(i*300,0,298,800);g.clip();g.translate(i*300,0);
   h.drawWorld();g.fillStyle='#111922df';g.fillRect(0,0,298,95);
   g.fillStyle='#e8ce92';g.textAlign='center';g.font='bold 17px Georgia';g.fillText(BossSystem.name(boss),149,32);
   g.fillStyle='#b8b5a7';g.font='12px Georgia';
   const text=['Círculos de balas e reforços','Canhões e morteiros','Raios e movimento lateral','Investidas e invocações'][i];g.fillText(text,149,56);g.fillText('FASE ENFURECIDA',149,77);g.restore();
  });
 }
 if(mode==='play'){smoke();window.addEventListener('resize',smoke)}
 else if(mode==='bosses'){bosses();window.addEventListener('resize',bosses)}
 else{
  h.openCharacterSelect();let last=0;
  const frame=now=>{h.update(Math.min(.04,(now-last)/1000||0));last=now;h.draw();requestAnimationFrame(frame)};
  requestAnimationFrame(frame);
 }
})();
