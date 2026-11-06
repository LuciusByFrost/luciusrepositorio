/* Isolated browser review: --preview --elements; ?mode=world for all effects. */
(()=>{
 const h=heroPreview,E=ElementSystem,V=ElementVisuals,c=document.querySelector('#game'),g=c.getContext('2d');
 h.setSound(false);let frames=0;
 if(new URLSearchParams(location.search).get('mode')!=='world'){
  c.style.width='100vw';c.style.height='100vh';window.dispatchEvent(new Event('resize'));
 }
 window.addEventListener('error',e=>document.documentElement.dataset.elementError=e.message);
 function build(ids){h.newGame();const game=h.game;game.level=20;for(const id of ids)E.select(game,id);return game}
 function basics(...ids){return ids.flatMap(id=>[id+'_1',id+'_2'])}
 function target(x,y){const e=h.spawnEnemy('brute');Object.assign(e,{x,y,hp:5000,maxHp:5000,speed:0});return e}
 function paint(){
  document.documentElement.dataset.elementFrames=String(++frames);
  g.setTransform(1,0,0,1,0,0);g.imageSmoothingEnabled=false;g.globalAlpha=1;
  if(new URLSearchParams(location.search).get('mode')==='play'){
   const game=build(E.definitions.map(d=>d.id));game.player.invuln=1000;game.spawn=10000;game.nextBoss=10000;
   for(const [x,y] of [[70,40],[110,-30],[160,50],[210,-70],[250,30]])target(x,y);
   const boss=h.spawnEnemy('boss');Object.assign(boss,{x:200,y:100,hp:50000,maxHp:50000,cd:10000,summon:10000});game.boss=boss;game.bossWave=true;
   for(const w of Object.values(game.weapons))Object.assign(w,{level:3,evolved:true,cool:0});
   for(let i=0;i<180;i++){h.update(1/60);for(let k=0;k<20&&game.choices.length;k++)h.pickUpgrade(0);if(i%15===0)h.drawWorld()}
   const valid=game.time>2.9&&game.elements.fx.length<=96&&game.enemies.every(e=>Number.isFinite(e.hp)&&Number.isFinite(e.x)&&Number.isFinite(e.y));
   document.documentElement.dataset.elementSmoke=valid?'passed':'failed';document.documentElement.dataset.elementTime=game.time.toFixed(2);
   h.drawWorld();V.hud(g,game,c.width);g.fillStyle='#e5d6b0';g.textAlign='left';g.font='15px Georgia';
   g.fillText('Build completa: quatro elementos + quatro sinergias / teste '+(valid?'OK':'FALHOU'),24,c.height-22);return;
  }
  if(new URLSearchParams(location.search).get('mode')!=='world'){
   const game=build(basics('fire','electric')),offers=E.cards(game);
   game.choices=['infernal','fire_3','ice_1'].map(id=>offers.find(d=>d.id===id));
   h.setScreen('upgrade');h.drawUpgrade();return;
  }
  const cases=[['Fogo',['fire_1'],'fire'],['Gelo',basics('ice'),'ice'],['Eletricidade',['electric_1'],'electric'],['Veneno',['poison_1'],'poison'],
   ['Tempestade Infernal',[...basics('fire','electric'),'infernal'],'infernal'],['Combustão Tóxica',[...basics('fire','poison'),'combustion'],'combustion'],
   ['Estilhaços Condutores',[...basics('ice','electric'),'shards'],'shards'],['Praga Cristalizada',[...basics('ice','poison'),'plague'],'plague']];
  g.fillStyle='#242a32';g.fillRect(0,0,c.width,c.height);
  cases.forEach(([name,ids,type],i)=>{
   const game=build(ids),left=i%4*300,top=Math.floor(i/4)*390;
   game.player.x=-570;game.player.y=-170;
   const e=target(-480,-215);target(-430,-190);target(-395,-240);
   if(['fire','infernal','combustion'].includes(type))E.apply(game,e,'fire');
   if(['poison','combustion','plague'].includes(type))E.apply(game,e,'poison');
   if(['ice','shards','plague'].includes(type))for(let j=0;j<3;j++)E.apply(game,e,'ice');
   game.elements.seed=type==='combustion'?2:1;
   if(type==='electric')E.discharge(game,e,h.damageEnemy);
   if(type==='infernal'||type==='shards')E.lightningReactions(game,e,h.damageEnemy);
   if(type==='combustion')E.onHit(game,e,'revolver',h.damageEnemy);
   game.time=.12;
   g.save();g.beginPath();g.rect(left,top,298,388);g.clip();g.translate(left,top);
   g.fillStyle=i%2?'#2b3037':'#303637';g.fillRect(0,0,298,388);
   g.fillStyle='#e2c78f';g.font='bold 15px Georgia';g.textAlign='left';g.fillText(name,12,28);
   g.fillStyle='#aab7ad';g.font='12px Georgia';g.fillText(i<4?'EFEITO ELEMENTAL':'SINERGIA SELECIONADA',12,48);
   for(const enemy of game.enemies)h.drawEnemy(enemy);
   V.world(g,game,x=>x+600,y=>y+400);g.restore();
  });
 }
 window.addEventListener('resize',paint);paint();
})();
