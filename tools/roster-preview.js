/* Browser review only: --preview --roster; ?mode=bosses / ?mode=play. */
(()=>{
 const h=heroPreview,c=document.querySelector('#game'),g=c.getContext('2d'),query=new URLSearchParams(location.search);
 h.setSound(false);window.addEventListener('error',e=>document.documentElement.dataset.rosterError=e.message);
 const mode=query.get('mode');
 const fixed=['bosses','characters','pixels','enemies','enemy-pixels'].includes(mode);
 c.style.width=mode==='mobile'?'360px':fixed?'1200px':'100vw';
 c.style.height=mode==='mobile'?'740px':fixed?'800px':'100vh';
 window.dispatchEvent(new Event('resize'));
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
   EnemySprites.tick(game);
   if(i===0)for(const shot of game.hostile){shot.x+=shot.vx*.25;shot.y+=shot.vy*.25}
   g.save();g.beginPath();g.rect(i*300,0,298,800);g.clip();g.translate(i*300,0);
   h.drawWorld();g.fillStyle='#111922df';g.fillRect(0,0,298,95);
   g.fillStyle='#e8ce92';g.textAlign='center';g.font='bold 17px Georgia';g.fillText(BossSystem.name(boss),149,32);
   g.fillStyle='#b8b5a7';g.font='12px Georgia';
   const text=['Círculos de balas e reforços','Canhões e morteiros','Raios e movimento lateral','Investidas e invocações'][i];g.fillText(text,149,56);g.fillText('FASE ENFURECIDA',149,77);g.restore();
  });
 }
 function characters(){
  g.setTransform(1,0,0,1,0,0);g.imageSmoothingEnabled=false;g.fillStyle='#191f28';g.fillRect(0,0,c.width,c.height);
  const states=['Repouso','Caminhada','Ataque','Dano','Piscar'];
  CharacterRoster.list.forEach((hero,i)=>{
   h.newGame(hero.id);const game=h.game;
   g.fillStyle=hero.color;g.font='bold 18px Georgia';g.textAlign='center';g.fillText(hero.name,i*300+150,32);
   g.font='12px Georgia';g.fillText(hero.title,i*300+150,53);
   g.fillStyle='#bdb8a8';g.fillText(game.weapons[hero.weapon].name,i*300+150,74);
   states.forEach((label,row)=>{
    game.time=row===4?[4.63,4.13,2.93,3.03][i]:1;
    Object.assign(game.player,{x:-600,y:-400,heldWeapon:hero.weapon,weaponAngle:0,visualMoving:row===1,visualStride:Math.PI/2,attack:row===2?.09:0,muzzleFlash:row===2?.05:0,invuln:row===3?1:0});
    const y=151+row*128;
    g.fillStyle='#242b32';g.fillRect(i*300+8,y-53,284,122);
    g.save();g.translate(i*300+63,y+12);h.drawPlayer(game.player);g.restore();
    g.save();g.translate(i*300+177,y+35);g.scale(2,2);h.drawPlayer(game.player);g.restore();
    g.fillStyle='#bdb8a8';g.font='11px Georgia';g.fillText(label,i*300+60,y-35);
   });
  });
  document.documentElement.dataset.characterPreview='passed';
 }
 // Browser-only pixel assertions: Canvas mocks cannot detect antialiasing.
 function pixels(){
  let checks=0;
  const assert=(ok,msg)=>{if(!ok)throw Error(msg);checks++};
  // A transformed opaque source may only produce transparent or opaque pixels.
  // Any intermediate alpha here exposes filtering on a real browser canvas.
  for(const angle of [0,.17,.37,.78,1.19,2.43,3.72]){
   g.clearRect(0,0,c.width,c.height);
   CactusHero.rasterWeapon(g,64,64,1,angle,{turn:.035,kick:2,lift:1},p=>{
    p.fillStyle='#151d21';p.fillRect(-4,-5,32,12);p.fillStyle='#bda66a';p.fillRect(0,-3,25,3);
   });
   const data=g.getImageData(16,16,96,96).data;
   assert(data.some((v,i)=>i%4===3&&v===255),'empty rotated weapon sample');
   assert(data.every((v,i)=>i%4!==3||v===0||v===255),'filtered alpha in rotated weapon: '+angle);
  }
  for(const hero of CharacterRoster.list){
   h.newGame(hero.id);const run=h.game;run.time=1.33;
   Object.assign(run.player,{x:-600,y:-400});
   g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,c.width,c.height);
   g.save();g.translate(64,64);h.drawPlayer(run.player);g.restore();
   const actual=g.getImageData(0,0,128,128).data;
   h.drawCharacterPreview(hero,464,264,1,run.time);
   const menu=g.getImageData(400,200,128,128).data;
   assert(actual.every((v,i)=>v===menu[i]),hero.id+': menu preview differs from gameplay at the same time');
   h.newGame(hero.id);const game=h.game;game.time=1;
   for(const weapon of Object.keys(game.weapons))for(const angle of [0,.37,1.19,2.43,3.72])for(const facing of [-1,1]){
    Object.assign(game.player,{x:-600,y:-400,heldWeapon:weapon,weaponAngle:angle,facing,invuln:0,attack:.09,muzzleFlash:.05,visualMoving:true,visualStride:1.3});
    g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,c.width,c.height);
    g.save();g.translate(64,64);h.drawPlayer(game.player);g.restore();
    const native=g.getImageData(0,0,128,128).data;
    assert(native.some((v,i)=>i%4===3&&v===255),'empty native sample: '+hero.id+'/'+weapon);
    for(const scale of [2,4]){
     g.save();g.translate(400,200);g.scale(scale,scale);g.translate(64,64);h.drawPlayer(game.player);g.restore();
     const enlarged=g.getImageData(400,200,128*scale,128*scale).data;let equal=true;
     for(let y=0;y<128*scale&&equal;y++)for(let x=0;x<128*scale&&equal;x++)for(let k=0;k<4;k++){
      if(enlarged[(y*128*scale+x)*4+k]!==native[(Math.floor(y/scale)*128+Math.floor(x/scale))*4+k]){equal=false;break}
     }
     assert(equal,hero.id+'/'+weapon+': different pixel grid at '+scale+'x, angle='+angle);
     g.clearRect(400,200,512,512);
    }
   }
  }
  characters();document.documentElement.dataset.pixelChecks=String(checks);
  document.documentElement.dataset.pixelResult='passed';
 }
 function enemyRoster(){
  h.newGame();const game=h.game;game.time=1;
  const entries=Object.entries(EnemySprites.profiles).map(([id,p])=>{
   const e=h.spawnEnemy(id);Object.assign(e,{x:-600,y:-400,anim:1.7,hit:0,facing:1,hp:1000,maxHp:1000});return {id,p,e};
  });
  return {game,entries};
 }
 function enemies(){
  const {game,entries}=enemyRoster();
  g.setTransform(1,0,0,1,0,0);g.imageSmoothingEnabled=false;g.fillStyle='#191f28';g.fillRect(0,0,1200,800);
  entries.forEach(({p,e},i)=>{
   const x=i%5*240,y=Math.floor(i/5)*400;
   g.fillStyle='#242b32';g.fillRect(x+5,y+5,230,390);
   g.textAlign='center';g.fillStyle=p.eye;g.font='bold 15px Georgia';g.fillText(p.name,x+120,y+29);
   e.visualState='walk';if(p.boss)e.hp=e.maxHp*.4;
   g.save();g.translate(x+120,y+211);g.scale(2,2);h.drawEnemy(e);g.restore();
   g.textAlign='left';g.fillStyle='#bcb8a5';g.font='11px Georgia';g.fillText(p.boss?'2× · ENFURECIDO':'2× · CAMINHADA',x+12,y+85);
   e.visualState='idle';e.hp=e.maxHp;
   g.save();g.translate(x+120,y+350);h.drawEnemy(e);g.restore();
   g.fillText('1×',x+22,y+340);
  });document.documentElement.dataset.enemyPreview='passed';
 }
 function enemyPixels(){
  const {game,entries}=enemyRoster();let checks=0;
  const assert=(ok,msg)=>{if(!ok)throw Error(msg);checks++};
  for(const {id,p,e} of entries)for(const state of ['idle','walk','attack','hurt','enraged'])for(const facing of [-1,1]){
   e.visualState=state;e.facing=facing;e.hit=state==='hurt'?.12:0;e.hp=state==='enraged'&&p.boss?400:1000;
   g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,1200,800);
   g.save();g.translate(80,104);h.drawEnemy(e);g.restore();
   const native=g.getImageData(0,0,160,160).data;
   assert(native.some((v,i)=>i%4===3&&v===255),id+': empty native art');
   for(const scale of [2,4]){
    g.save();g.translate(400,100);g.scale(scale,scale);g.translate(80,104);h.drawEnemy(e);g.restore();
    const big=g.getImageData(400,100,160*scale,160*scale).data;let equal=true;
    for(let y=0;y<160*scale&&equal;y++)for(let x=0;x<160*scale&&equal;x++)for(let k=0;k<4;k++){
     if(big[(y*160*scale+x)*4+k]!==native[(Math.floor(y/scale)*160+Math.floor(x/scale))*4+k]){equal=false;break}
    }
    assert(equal,id+': pixel grid differs at '+scale+'x in '+state);g.clearRect(400,100,640,640);
   }
  }
  // Actual Canvas workload: 70 ordinary enemies per frame, no Canvas mocks.
  const start=performance.now();
  for(let frame=0;frame<30;frame++)for(let i=0;i<70;i++){
   const e=entries[i%6].e;e.visualState='walk';e.hit=0;g.save();g.translate(80+i%10*110,100+Math.floor(i/10)*95);h.drawEnemy(e);g.restore();
  }
  const ms=(performance.now()-start)/30;
  enemies();document.documentElement.dataset.enemyPixelChecks=String(checks);
  document.documentElement.dataset.enemyFrameMs=ms.toFixed(2);
  document.documentElement.dataset.enemyPixels='passed';
 }
 if(mode==='enemy-pixels'){enemyPixels();window.addEventListener('resize',enemies)}
 else if(mode==='enemies'){enemies();window.addEventListener('resize',enemies)}
 else if(mode==='pixels'){pixels()}
 else if(mode==='characters'){characters();window.addEventListener('resize',characters)}
 else if(mode==='play'){smoke();window.addEventListener('resize',smoke)}
 else if(mode==='bosses'){bosses();window.addEventListener('resize',bosses)}
 else{
  h.openCharacterSelect();let last=0;
  const frame=now=>{h.update(Math.min(.04,(now-last)/1000||0));last=now;h.draw();requestAnimationFrame(frame)};
  requestAnimationFrame(frame);
 }
})();
