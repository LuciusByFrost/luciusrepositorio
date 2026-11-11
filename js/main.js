/* Cactus Survivors — self-contained Canvas game; no network assets or dependencies. */
(()=>{'use strict';
const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d'),toast=document.querySelector('#toast'),touch=document.querySelector('#touch'),knob=touch.querySelector('i'),interactButton=document.querySelector('#interact');
const TAU=Math.PI*2, clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), rand=(a,b)=>a+Math.random()*(b-a), choose=a=>a[Math.floor(Math.random()*a.length)], dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
let W=960,H=600,dpr=1,screen='title',last=0,keys=new Set(),pointer={x:0,y:0,down:false},audioOn=true,audioCtx=null,stick={x:0,y:0},camera={x:0,y:0},shake=0,toastUntil=0;
let selectedCharacterId;
const save=readSave();selectedCharacterId=CharacterRoster.get(save.characterId).id;function readSave(){try{return Object.assign({best:0,sound:true},JSON.parse(localStorage.getItem('cactus-save')||'{}'))}catch{return{best:0,sound:true}}}function persist(){try{localStorage.setItem('cactus-save',JSON.stringify(save))}catch{}}
const weaponDefs={
 revolver:{name:'Revólver do Deserto',icon:'✦',desc:'Disparo preciso no alvo mais próximo.',cd:.8,damage:16,range:430,qty:1,speed:560,color:'#ffd36a',level:1,max:8},
 shotgun:{name:'Espingarda Serrada',icon:'✹',desc:'Leque de chumbo a curta distância.',cd:2.1,damage:11,range:260,qty:5,speed:420,color:'#ff9b52',level:0,max:8},
 dynamite:{name:'Dinamite',icon:'♨',desc:'Explosão de pólvora com amplo raio e alto dano.',cd:4.2,damage:70,range:360,qty:1,speed:210,color:'#f36c45',level:0,max:8},
 thorns:{name:'Cacto Giratório',icon:'❋',desc:'Espinhos orbitais ferem ao tocar.',cd:.42,damage:12,range:70,qty:2,speed:0,color:'#9df078',level:0,max:8},
 lasso:{name:'Laço Elétrico',icon:'ϟ',desc:'Descargas saltam entre inimigos.',cd:3.4,damage:22,range:250,qty:3,speed:0,color:'#8be9ff',level:0,max:8},
 rain:{name:'Chuva de Balas',icon:'☄',desc:'Rajada circular de projéteis.',cd:6.5,damage:13,range:340,qty:10,speed:500,color:'#ffe58a',level:0,max:8},
 meteor:{name:'Meteoro de Ouro',icon:'★',desc:'Pedras flamejantes caem do céu.',cd:5.8,damage:48,range:330,qty:2,speed:0,color:'#ffb94e',level:0,max:8},
 solar:{name:'Canhão Sol Dourado',icon:'✷',desc:'Raio lendário perfurante que atravessa a horda.',cd:2.7,damage:86,range:680,qty:1,speed:780,color:'#ffe675',level:0,max:8,legendary:true}
};
const upgradePool=[
 {name:'Pólvora Fina',desc:'+20% de dano em todas as armas.',rarity:'Comum',icon:'✹',apply:g=>g.player.damage*=1.2},
 {name:'Mão Leve',desc:'+15% de velocidade de ataque.',rarity:'Incomum',icon:'⌁',apply:g=>g.player.attackSpeed*=1.15},
 {name:'Botas de Poeira',desc:'+12% de velocidade de movimento.',rarity:'Comum',icon:'➤',apply:g=>g.player.speed*=1.12},
 {name:'Bolso Magnético',desc:'+30% de alcance de coleta.',rarity:'Comum',icon:'◎',apply:g=>g.player.magnet*=1.3},
 {name:'Coração de Nopal',desc:'+20% de vida máxima e recupera 20%.',rarity:'Incomum',icon:'♥',apply:g=>{g.player.maxHp*=1.2;g.player.hp=Math.min(g.player.maxHp,g.player.hp+g.player.maxHp*.2)}},
 {name:'Olho de Águia',desc:'+6% de chance crítica.',rarity:'Rara',icon:'◉',apply:g=>g.player.crit+=.06},
 {name:'Casca Grossa',desc:'+10% de redução de dano.',rarity:'Incomum',icon:'⬟',apply:g=>g.player.armor=Math.min(.55,g.player.armor+.1)},
 {name:'Sorte do Forasteiro',desc:'+15% de sorte: melhores ofertas e gemas.',rarity:'Rara',icon:'♣',apply:g=>g.player.luck+=.15},
 {name:'Regeneração',desc:'+1.2 vida por segundo.',rarity:'Incomum',icon:'✚',apply:g=>g.player.regen+=1.2},
 {name:'Munição Perfurante',desc:'Revólver atravessa +1 inimigo.',rarity:'Rara',icon:'➶',weapon:'revolver',apply:g=>g.player.pierce++},
 {name:'Cartucho Extra',desc:'Espingarda dispara +2 projéteis.',rarity:'Incomum',weapon:'shotgun',icon:'✹',apply:g=>g.weapons.shotgun.qty+=2},
 {name:'Pavio Longo',desc:'Explosões +25% de área.',rarity:'Rara',weapon:'dynamite',icon:'♨',apply:g=>g.player.area*=1.25},
 {name:'Corrente Viva',desc:'Laço salta para +2 alvos.',rarity:'Épica',weapon:'lasso',icon:'ϟ',apply:g=>g.weapons.lasso.qty+=2},
 {name:'Núcleo de Ouro',desc:'Meteoro +1 impacto por salva.',rarity:'Épica',weapon:'meteor',icon:'★',apply:g=>g.weapons.meteor.qty++},
 {name:'Frasco de Tônico',desc:'Recupera 35% da vida máxima.',rarity:'Comum',icon:'⚗',apply:g=>g.player.hp=Math.min(g.player.maxHp,g.player.hp+g.player.maxHp*.35)}
];
let game;
const BOSS_ENEMY_CAP=14;
const bossApi={shoot:shootHostile,spawn:spawnEnemy,hurt:hurtPlayer};
// Keep bushes unchanged; retain only the rarest third of decorative cacti.
const MAP_CACTUS_THRESHOLD=.98;
function newGame(characterId=selectedCharacterId){const hero=CharacterRoster.get(characterId);selectedCharacterId=hero.id;game={time:0,waveTime:0,kills:0,stage:1,spawn:0,boss:null,bossWave:false,level:1,xp:0,xpNeed:12,choices:[],pendingUpgrades:0,chests:[],player:{characterId:hero.id,startWeapon:hero.weapon,x:0,y:0,r:15,hp:100,maxHp:100,speed:205,damage:1,attackSpeed:1,magnet:120,crit:.05,critMult:1.8,armor:0,regen:0,luck:0,pierce:0,area:1,invuln:0,facing:1,walk:0,attack:0},weapons:{},enemies:[],shots:[],hostile:[],gems:[],particles:[],floaters:[],hazards:[],nextBoss:65};for(const [id,d] of Object.entries(weaponDefs))game.weapons[id]={...d,level:0,cool:rand(.1,.5),angle:0,evolved:false};game.weapons[hero.weapon].level=1;save.characterId=hero.id;persist();keys.clear();stick.x=stick.y=0;knob.style.transform='translate(0,0)';game.elements=ElementSystem.create();camera.x=camera.y=0;shake=0;screen='playing';say('O DESERTO NÃO PERDOA',1800);sound(220,.12);EnemySprites.reset()}
function say(t,ms=1500){toast.textContent=t;toastUntil=performance.now()+ms}
function sound(freq=260,dur=.08,type='square'){if(!audioOn)return;try{audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();const o=audioCtx.createOscillator(),v=audioCtx.createGain();o.type=type;o.frequency.setValueAtTime(freq,audioCtx.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(40,freq*.45),audioCtx.currentTime+dur);v.gain.setValueAtTime(.055,audioCtx.currentTime);v.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+dur);o.connect(v);v.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+dur)}catch{}}
function resize(){const r=canvas.getBoundingClientRect();dpr=1;canvas.width=Math.max(1,Math.round(r.width*dpr));canvas.height=Math.max(1,Math.round(r.height*dpr));W=r.width;H=r.height;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.imageSmoothingEnabled=false}window.addEventListener('resize',resize);resize();
function handleGameKeyDown(e){
 if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();
 if(e.repeat&&['Enter',' '].includes(e.key)&&['title','characters','dead'].includes(screen))return;
 if(screen==='characters'){
  if(e.key==='Escape'){screen='title';return}
  const numeric=['1','2','3','4'].indexOf(e.key);
  if(numeric>=0){selectedCharacterId=CharacterRoster.list[numeric].id;return}
  const index=CharacterRoster.list.findIndex(c=>c.id===selectedCharacterId),cols=CharacterRoster.layout(W,H).columns;
  const shift={ArrowLeft:-1,ArrowRight:1,ArrowUp:-cols,ArrowDown:cols}[e.key];
  if(shift){selectedCharacterId=CharacterRoster.list[(index+shift+4)%4].id;return}
  if(e.key==='Enter'||e.code==='Space')newGame();return;
 }
 if(screen==='title'&&e.key==='Enter'){openCharacterSelect();return}
 if(screen==='dead'&&e.key==='Enter'){newGame();return}
 keys.add(e.key.toLowerCase());
 if(e.key==='Escape'){if(screen==='playing')screen='pause';else if(screen==='pause')screen='playing'}
 if(screen==='upgrade'&&['1','2','3'].includes(e.key))pickUpgrade(+e.key-1);
 else if(screen==='upgrade'&&e.code==='Space')pickUpgrade(0);
}
window.addEventListener('keydown',handleGameKeyDown);window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>keys.clear());
window.addEventListener('keydown',e=>{if(screen==='playing'&&e.key.toLowerCase()==='e'){e.preventDefault();interactWithKnowledgeChest();return}if(screen!=='knowledge')return;const q=game?.knowledgeQuiz;if(!q)return;if(!q.quiz.answered&&['1','2','3','4'].includes(e.key)){e.preventDefault();answerKnowledgeQuestion(+e.key-1)}else if(q.quiz.answered&&['Enter',' ','e','Escape'].includes(e.key)){e.preventDefault();closeKnowledgePanel()}else if(e.key==='Escape'&&!q.quiz.answered){e.preventDefault();closeKnowledgePanel()}});
canvas.addEventListener('pointermove',e=>{const r=canvas.getBoundingClientRect();pointer.x=e.clientX-r.left;pointer.y=e.clientY-r.top});canvas.addEventListener('pointerdown',e=>{pointer.down=true;handleClick(e)});window.addEventListener('pointerup',()=>pointer.down=false);
canvas.addEventListener('pointerdown',e=>{if(screen==='knowledge')handleKnowledgePointer(e)});
interactButton.addEventListener('pointerdown',e=>{e.preventDefault();interactWithKnowledgeChest()});
function handleClick(e){if(screen==='title'){const p=pos(e);if(p.y>H*.48&&p.y<H*.59)openCharacterSelect();else if(p.y>H*.59&&p.y<H*.665){save.sound=!save.sound;audioOn=save.sound;persist();say(audioOn?'SOM LIGADO':'SOM DESLIGADO')}else if(p.y>H*.665&&p.y<H*.77)say('WASD / SETAS: MOVER • ESPAÇO: CONFIRMAR')}else if(screen==='characters'){handleCharacterClick(pos(e))}else if(screen==='upgrade'){const p=pos(e),l=upgradeLayout();for(let i=0;i<3;i++)if(p.x>=l.x+i*(l.cw+l.gap)&&p.x<=l.x+i*(l.cw+l.gap)+l.cw&&p.y>=l.y&&p.y<=l.y+l.h)pickUpgrade(i)}else if(screen==='pause'){const p=pos(e);if(Math.abs(p.y-H*.45)<25)screen='playing';else if(Math.abs(p.y-(H*.45+55))<25)newGame();else if(Math.abs(p.y-(H*.45+110))<25)screen='title'}else if(screen==='dead'){const p=pos(e);if(Math.abs(p.y-H*.62)<25)newGame();else if(Math.abs(p.y-(H*.62+53))<25)openCharacterSelect()}}function pos(e){const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}}
touch.addEventListener('pointerdown',e=>{touch.setPointerCapture(e.pointerId);moveStick(e)});touch.addEventListener('pointermove',e=>{if(e.buttons)moveStick(e)});touch.addEventListener('pointerup',()=>{stick.x=stick.y=0;knob.style.transform='translate(0,0)'});function moveStick(e){const r=touch.getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2,n=Math.hypot(x,y),m=Math.min(42,n);stick.x=n?x/n*m/42:0;stick.y=n?y/n*m/42:0;knob.style.transform=`translate(${stick.x*m}px,${stick.y*m}px)`}
function addParticle(x,y,color,n=5,power=90){for(let i=0;i<n;i++){const a=rand(0,TAU),s=rand(power*.25,power);game.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:rand(.2,.65),max:.65,color,size:rand(2,5)})}}
function knowledgeChestSpotIsClear(x,y){const g=game;if(dist({x,y},g.player)<108)return false;if(g.enemies.some(e=>e.hp>0&&Math.hypot(e.x-x,e.y-y)<52))return false;if(g.chests.some(c=>!c.dead&&Math.hypot(c.x-x,c.y-y)<72))return false;const tx=Math.floor(x/64),ty=Math.floor(y/64);for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){const wx=(tx+ox)*64,wy=(ty+oy)*64,seed=Math.abs(Math.sin(wx*12.989+wy*78.233)*43758.5453)%1;if(seed>.78){const px=wx+12+(seed*47)%39,py=wy+44;if(Math.hypot(px-x,py-y)<(seed>.94?43:29))return false}}return true}
function spawnKnowledgeChest(){const g=game,p=g.player,maxR=Math.min(250,Math.min(W,H)*.4);for(let tries=0;tries<48;tries++){const a=rand(0,TAU),r=rand(Math.min(125,maxR*.72),maxR),x=p.x+Math.cos(a)*r,y=p.y+Math.sin(a)*r,sx0=x-camera.x+W/2,sy0=y-camera.y+H/2;if(sx0<38||sx0>W-38||sy0<48||sy0>H-30||!knowledgeChestSpotIsClear(x,y))continue;const chest=KnowledgeChestSystem.create(x,y,++g.knowledgeChestId);chest.knowledge=true;chest.special=true;g.chests.push(chest);addParticle(x,y,'#ffe675',18,115);addParticle(x,y,'#f0bd63',10,70);say('BAÚ DO CONHECIMENTO POR PERTO — APERTE E',2700);sound(740,.24,'sine');return true}return false}
function spawnEnemy(type){
 const custom=BossSystem.isNew(type),isBoss=type==='boss'||custom;
 if(game.bossWave&&!isBoss&&game.enemies.filter(e=>e.hp>0).length>=BOSS_ENEMY_CAP)return null;
 const p=game.player,a=rand(0,TAU),r=Math.max(W,H)*.63+rand(30,150),x=p.x+Math.cos(a)*r,y=p.y+Math.sin(a)*r,scale=1+game.time*.0018;
 const defs={bandit:[24,68,9,12,'#a95138'],runner:[15,126,7,10,'#e17b48'],gunslinger:[28,48,7,10,'#548397'],brute:[105,31,19,17,'#68504b'],gravedigger:[75,40,13,13,'#6e526f'],armored:[72,48,14,14,'#b58d50'],boss:[780+game.time*3,36,28,31,'#46333b']};
 const d=custom?BossSystem.stats(type,game.time):defs[type]||defs.bandit;
 const e={type:custom?'boss':type,x,y,hp:d[0]*scale,maxHp:d[0]*scale,speed:d[1]*(1+game.time*.0004),damage:d[2]*(1+game.time*.001),r:d[3],color:d[4],cd:rand(1,3),attack:rand(1,3),phase:0,hit:0,knock:0,anim:rand(0,TAU),boss:isBoss,summon:6};
 if(custom)BossSystem.configure(e,type);game.enemies.push(e);return e;
}
function openCharacterSelect(){keys.clear();stick.x=stick.y=0;knob.style.transform='translate(0,0)';screen='characters'}
function handleCharacterClick(point){
 const layout=CharacterRoster.layout(W,H);
 for(const card of layout.cards)if(CharacterRoster.inside(point,card)){selectedCharacterId=card.id;return}
 if(CharacterRoster.inside(point,layout.start))newGame();else if(CharacterRoster.inside(point,layout.back))screen='title';
}
function drawCharacterPreview(hero,x,y,scale=1,t=performance.now()/1000){
 ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(Math.max(1,Math.round(scale)),Math.max(1,Math.round(scale)));
 drawPlayer({characterId:hero.id,startWeapon:hero.weapon,heldWeapon:hero.weapon,visualTime:t,x:camera.x-W/2,y:camera.y-H/2,facing:1,walk:0,invuln:0,attack:0,muzzleFlash:0});
 ctx.restore();
}
function drawCharacterSelect(){CharacterRoster.draw(ctx,W,H,selectedCharacterId,drawCharacterPreview,weaponDefs,performance.now()/1000)}
function stageFor(t){return Math.floor(t/45)+1}
function update(dt){if(screen!=='playing')return;const g=game,p=g.player;g.time+=dt;ChestSystem.tick(g);ElementSystem.tick(g,dt,damageEnemy);if(g.weaponFx)g.weaponFx=g.weaponFx.filter(f=>g.time-f.start<.6);if(g.lassoArcs)g.lassoArcs=g.lassoArcs.filter(a=>g.time-a.start<.36);if(g.nextKnowledgeChest==null){g.nextKnowledgeChest=g.time+rand(32,52);g.knowledgeUsed=new Set();g.knowledgeChestId=0}if(!g.bossWave)g.waveTime+=dt;const previousStage=g.stage;g.stage=stageFor(g.waveTime);p.invuln=Math.max(0,p.invuln-dt);p.attack=Math.max(0,p.attack-dt);p.muzzleFlash=Math.max(0,(p.muzzleFlash||0)-dt);p.weaponPose=Math.max(0,(p.weaponPose||0)-dt);if(!p.weaponPose){p.heldWeapon=p.startWeapon||'revolver';p.weaponAngle=p.facing<0?Math.PI:0}p.hp=Math.min(p.maxHp,p.hp+p.regen*dt);p.walk+=dt*12;
 let dx=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0)+stick.x,dy=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0)+stick.y,n=Math.hypot(dx,dy);if(n>1){dx/=n;dy/=n}p.visualMoving=n>0;if(p.characterId==='iris'){if(n>0)p.irisWalkTime=(p.irisWalkTime||0)+dt;else p.irisWalkTime=0}if(p.characterId==='nopal'){if(n>0)p.nopalWalkTime=(p.nopalWalkTime||0)+dt;else p.nopalWalkTime=0}if(n>0&&(p.characterId==='bento'||p.characterId==='iris'||p.characterId==='nopal'))p.visualDirection=(Math.round(Math.atan2(-dx,dy)/(Math.PI/4))+8)%8;if(dy)p.visualBack=dy<0;p.visualStride=(p.visualStride||0)+Math.min(n,1)*p.speed*dt*.065;p.x+=dx*p.speed*dt;p.y+=dy*p.speed*dt;if(dx)p.facing=Math.sign(dx);camera.x+=(p.x-camera.x)*Math.min(1,dt*8);camera.y+=(p.y-camera.y)*Math.min(1,dt*8);
 const interval=Math.max(.22,1.05-g.stage*.075);if(!g.bossWave){g.spawn-=dt;if(g.spawn<=0){const choices=['bandit','bandit'];if(g.stage>=2)choices.push('runner');if(g.stage>=3)choices.push('gunslinger');if(g.stage>=4)choices.push('brute','armored');if(g.stage>=6)choices.push('gravedigger','armored');for(let i=0;i<Math.min(1+Math.floor(g.stage/4),3);i++)spawnEnemy(choose(choices));g.spawn=interval*rand(.7,1.25)}}if(!g.bossWave&&g.waveTime>=g.nextBoss){g.bossWave=true;g.enemies=g.enemies.filter(e=>e.hp>0).sort((a,b)=>dist(p,a)-dist(p,b)).slice(0,BOSS_ENEMY_CAP-1);g.boss=spawnEnemy(BossSystem.nextType(g));g.nextBoss+=Math.max(72,105-g.stage*2);say(BossSystem.name(g.boss).toUpperCase()+' — ELE CHEGOU!',2500);sound(90,.5,'sawtooth')} if(!g.bossWave&&g.time>=g.nextKnowledgeChest&&!g.chests.some(c=>c.knowledge&&!c.used)){g.nextKnowledgeChest=g.time+rand(65,100);spawnKnowledgeChest()}
 for(const e of g.enemies){
  if(e.hp<=0)continue;const elementSpeed=ElementSystem.speed(g,e);
  e.anim+=dt*8;e.cd-=dt;e.hit=Math.max(0,e.hit-dt);
  if(e.knock){e.x+=e.kx*dt;e.y+=e.ky*dt;e.knock=Math.max(0,e.knock-dt)}
  const vx=p.x-e.x,vy=p.y-e.y,d=Math.hypot(vx,vy)||1;
  if(e.boss&&BossSystem.isNew(e.bossKind))BossSystem.update(g,e,dt,elementSpeed,bossApi);
  else{
   if(e.type==='gunslinger'){
    if(d>245){e.x+=vx/d*e.speed*elementSpeed*dt;e.y+=vy/d*e.speed*elementSpeed*dt}
    else if(d<165){e.x-=vx/d*e.speed*elementSpeed*dt;e.y-=vy/d*e.speed*elementSpeed*dt}
    if(e.cd<=0&&d<500&&!ElementSystem.frozen(g,e)){shootHostile(e,vx/d,vy/d);e.cd=2.4}
   }else{e.x+=vx/d*e.speed*elementSpeed*dt;e.y+=vy/d*e.speed*elementSpeed*dt}
   if(e.boss){
    e.phase+=dt;
    if(e.cd<=0&&!ElementSystem.frozen(g,e)){
     for(let i=0;i<10;i++){const a=i*TAU/10+e.phase*.25;shootHostile(e,Math.cos(a),Math.sin(a),190,11)}e.cd=2.5;
     if(e.hp<e.maxHp*.5){for(let i=0;i<8;i++){const a=i*TAU/8;shootHostile(e,Math.cos(a),Math.sin(a),260,13)}e.cd=1.55}
    }
    e.summon-=dt;if(e.summon<=0){spawnEnemy('runner');spawnEnemy('bandit');e.summon=8}
   }
  }
  if(d<e.r+p.r+2&&p.invuln<=0&&!ElementSystem.frozen(g,e)){hurtPlayer(e.damage);const kx=vx/d,ky=vy/d;p.x+=kx*12;p.y+=ky*12}
 }
 for(const w of Object.values(g.weapons)){w.cool-=dt;w.angle+=dt*(w.id==='thorns'?2:0);if(w.level&&w.cool<=0)fireWeapon(w);}if(p.characterId==='bento'){const bomb=g.weapons.dynamite;p.bentoWindup=!!(bomb.level&&bomb.cool>0&&bomb.cool<=.12)}
 for(const s of g.shots){s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt;if(s.bomb&&s.life<=0)explode(s);else if(!s.bomb){for(const e of g.enemies){if(e.hp<=0||s.hitTargets?.has(e))continue;if(Math.hypot(e.x-s.x,e.y-s.y)<e.r+s.r){damageEnemy(e,s.damage,s.crit,s.visualWeapon);WeaponVisuals.emit(g,'hit',s.x,s.y,Math.atan2(s.vy,s.vx),0,s.visualWeapon);(s.hitTargets||=(new Set())).add(e);s.pierce--;if(s.pierce<0){s.life=0;break}}}}}g.shots=g.shots.filter(s=>s.life>0);
 BossSystem.tickHazards(g,bossApi);
 for(const s of g.hostile){s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt;if(Math.hypot(s.x-p.x,s.y-p.y)<p.r+s.r&&p.invuln<=0){hurtPlayer(s.damage);s.life=0}}g.hostile=g.hostile.filter(s=>s.life>0);
 for(const h of g.hazards){h.t+=dt;if(h.t>=h.delay&&!h.done){h.done=true;for(const e of g.enemies)if(Math.hypot(e.x-h.x,e.y-h.y)<h.r+e.r)damageEnemy(e,h.damage,false,'meteor');addParticle(h.x,h.y,'#ffb542',28,180);shake=Math.max(shake,5)}}g.hazards=g.hazards.filter(h=>h.t<h.delay+.25);
 for(const gem of g.gems){gem.bob+=dt*4;const d=Math.hypot(p.x-gem.x,p.y-gem.y);if(d<p.magnet){gem.x+=(p.x-gem.x)*Math.min(1,dt*(5+90/(d+20)));gem.y+=(p.y-gem.y)*Math.min(1,dt*(5+90/(d+20)))}if(d<p.r+gem.r+5){g.xp+=gem.value;gem.dead=true;addParticle(gem.x,gem.y,gem.color,4,50);while(g.xp>=g.xpNeed){g.xp-=g.xpNeed;g.level++;g.xpNeed=Math.floor(g.xpNeed*1.23+4);openUpgrades()}sound(560,.035,'sine')}}g.gems=g.gems.filter(x=>!x.dead);
 for(const c of g.chests){c.bob+=dt*3;c.glow=(c.glow||0)+dt;if(c.knowledge)continue;if(Math.hypot(p.x-c.x,p.y-c.y)<p.r+24){openChest(c);break}}g.nearKnowledgeChest=KnowledgeChestSystem.nearest(g.chests,p,58);g.chests=g.chests.filter(c=>!c.dead&&!c.used);
 for(const f of g.floaters){f.y-=30*dt;f.life-=dt}g.floaters=g.floaters.filter(f=>f.life>0);for(const a of g.particles){a.x+=a.vx*dt;a.y+=a.vy*dt;a.vx*=Math.pow(.05,dt);a.vy*=Math.pow(.05,dt);a.life-=dt}g.particles=g.particles.filter(a=>a.life>0);shake=Math.max(0,shake-dt*15);
 ElementSystem.resolveDeaths(g,damageEnemy);const dead=g.enemies.filter(e=>e.hp<=0);for(const e of dead){EnemySprites.defeat(e,g.time);g.kills++;const value=e.boss?28:e.type==='brute'||e.type==='gravedigger'||e.type==='armored'?3:1;g.gems.push({x:e.x,y:e.y,r:value>10?9:5,value:Math.min(Number.MAX_SAFE_INTEGER,Math.round(value*1.20**(g.level-1))),color:value>10?'#ffbd52':value>2?'#68e3cf':'#65c5e8',bob:0});addParticle(e.x,e.y,e.color,8,e.boss?190:80);if(e.boss){BossSystem.cancel(g,e);g.chests.push(ChestSystem.create(e.x+20,e.y,'boss',BossSystem.name(e)));g.bossWave=false;g.boss=null;say(BossSystem.name(e).toUpperCase()+' DERROTADO! BAÚ DE RECOMPENSA',2300);shake=12}else if(Math.random()<.008+g.player.luck*.025)g.chests.push(ChestSystem.create(e.x,e.y))}g.enemies=g.enemies.filter(e=>e.hp>0);g.boss=g.enemies.find(e=>e.boss)||null;
 EnemySprites.tick(g);
 if(p.hp<=0)endGame();if(g.stage>previousStage)say(`ESTÁGIO ${g.stage} — MAIS FORASTEIROS`,1800)
}
function shootHostile(e,dx,dy,speed=220,damage=10){game.hostile.push({x:e.x,y:e.y,vx:dx*speed,vy:dy*speed,r:5,life:4,damage,color:e.boss?'#ff6254':'#f4d178'});EnemySprites.fired(e,game.time,dx,dy)}
function hurtPlayer(d){const p=game.player;if(p.invuln>0)return;p.hp-=d*(1-p.armor);p.invuln=1.05;addParticle(p.x,p.y,'#ff775f',12,100);sound(100,.13,'sawtooth')}
// Visual links are snapshots of the actual hit chain, never extra damage events.
function addLassoArc(from,to,index,evolved){
 const arcs=game.lassoArcs||=([]);
 arcs.push({x1:from.x,y1:from.y,x2:to.x,y2:to.y,r:to.r,
  start:game.time+Math.min(index,6)*.04,evolved});
 if(arcs.length>64)arcs.splice(0,arcs.length-64);
}
function showWeaponAttack(p,w,target){p.attack=.18;p.muzzleFlash=['revolver','shotgun','rain'].includes(w.id) ? .07 : 0;p.heldWeapon=w.id;p.weaponPose=.72;if(target)p.weaponAngle=Math.atan2(target.y-p.y,target.x-p.x);if(w.id==='revolver'&&p.characterId==='nopal'){p.nopalShotAt=game.time;p.nopalShotAngle=p.weaponAngle||0}if(w.id==='shotgun'&&p.characterId==='rosa'){p.rosaShotAt=game.time;p.rosaShotAngle=p.weaponAngle||0}WeaponVisuals.emit(game,w.id,p.x,p.y-5,p.weaponAngle||0)}
function fireWeapon(w){const g=game,p=g.player;w.cool=w.cd/p.attackSpeed;const enemies=g.enemies.filter(e=>e.hp>0&&dist(p,e)<w.range+100).sort((a,b)=>dist(p,a)-dist(p,b)),target=enemies[0];
 if(w.id==='thorns'){showWeaponAttack(p,w,target);for(let i=0;i<w.qty;i++){const a=w.angle+i*TAU/w.qty,r=w.range+(w.evolved?18:0),x=p.x+Math.cos(a)*r,y=p.y+Math.sin(a)*r;for(const e of enemies)if(Math.hypot(e.x-x,e.y-y)<e.r+19){damageEnemy(e,w.damage*p.damage,false,'thorns');WeaponVisuals.emit(g,'hit',e.x,e.y,a,0,'thorns')}addParticle(x,y,w.color,1,10)}return}
 if(w.id==='lasso'){if(!target)return;showWeaponAttack(p,w,target);let chain=target,hit=new Set(),source={x:p.x+Math.cos(p.weaponAngle)*15,y:p.y-5+Math.sin(p.weaponAngle)*4};for(let i=0;i<w.qty&&chain;i++){addLassoArc(source,chain,i,w.evolved);source=chain;hit.add(chain);damageEnemy(chain,w.damage*p.damage,Math.random()<p.crit,'lasso');for(let j=0;j<5;j++){const a=j*TAU/5;game.particles.push({x:chain.x,y:chain.y,vx:Math.cos(a)*90,vy:Math.sin(a)*90,life:.32,max:.32,color:w.color,size:3})}chain=enemies.find(e=>e.hp>0&&!hit.has(e)&&dist(e,chain)<(w.evolved?245:165))}return}
 if(w.id==='meteor'){showWeaponAttack(p,w,target);for(let i=0;i<w.qty;i++){let t=enemies[i%Math.max(1,enemies.length)],x=t?t.x+rand(-28,28):p.x+rand(-w.range,w.range),y=t?t.y+rand(-28,28):p.y+rand(-w.range,w.range);game.hazards.push({x,y,r:76*p.area,damage:w.damage*p.damage*(w.evolved?1.45:1),t:0,delay:.65});}return}
 if(w.id==='rain'){showWeaponAttack(p,w,target);for(let i=0;i<w.qty;i++){const a=i*TAU/w.qty+rand(-.06,.06);game.shots.push({visualWeapon:w.id,visualBorn:g.time,x:p.x,y:p.y,vx:Math.cos(a)*w.speed,vy:Math.sin(a)*w.speed,r:5,damage:w.damage*p.damage,life:1.4,pierce:p.pierce,crit:Math.random()<p.crit,color:w.color})}sound(210,.12);return}
 if(w.id==='dynamite'){showWeaponAttack(p,w,target);const a=target?Math.atan2(target.y-p.y,target.x-p.x):rand(0,TAU),x=p.x+Math.cos(a)*Math.min(w.range,170),y=p.y+Math.sin(a)*Math.min(w.range,170);if(p.characterId==='bento'){p.bentoThrowAt=g.time;p.bentoThrowAngle=a}game.shots.push({visualWeapon:w.id,visualBorn:g.time,x:p.x,y:p.y,vx:Math.cos(a)*w.speed,vy:Math.sin(a)*w.speed,r:7,damage:w.damage*p.damage,life:.85,bomb:true,tx:x,ty:y,color:w.color});sound(145,.2);return}
 if(w.id==='solar'){if(!target)return;showWeaponAttack(p,w,target);const a=Math.atan2(target.y-p.y,target.x-p.x);game.shots.push({visualWeapon:w.id,visualBorn:g.time,x:p.x+Math.cos(a)*15,y:p.y+Math.sin(a)*15,vx:Math.cos(a)*w.speed,vy:Math.sin(a)*w.speed,r:9,damage:w.damage*p.damage,life:w.range/w.speed+.5,pierce:99,crit:Math.random()<p.crit,color:w.color});sound(115,.18,'sawtooth');return}
 if(!target)return;showWeaponAttack(p,w,target);const base=Math.atan2(target.y-p.y,target.x-p.x),qty=w.id==='shotgun'?w.qty:1,spread=w.id==='shotgun'?.78:.0;for(let i=0;i<qty;i++){const a=base+(qty===1?0:(i/(qty-1)-.5)*spread);game.shots.push({visualWeapon:w.id,visualBorn:g.time,x:p.x+Math.cos(a)*13,y:p.y+Math.sin(a)*13,vx:Math.cos(a)*w.speed,vy:Math.sin(a)*w.speed,r:w.id==='shotgun'?4:5,damage:w.damage*p.damage,life:w.range/w.speed+1,pierce:p.pierce,crit:Math.random()<p.crit,color:w.color})}sound(w.id==='shotgun'?135:320,w.id==='shotgun'?.13:.055)}
function explode(s){s.x=s.tx;s.y=s.ty;const radius=110*game.player.area*(game.weapons.dynamite.evolved?1.35:1);WeaponVisuals.emit(game,'blast',s.x,s.y,0,radius);for(const e of game.enemies)if(Math.hypot(e.x-s.x,e.y-s.y)<radius+e.r){damageEnemy(e,s.damage,Math.random()<game.player.crit,'dynamite');const d=Math.hypot(e.x-s.x,e.y-s.y)||1;e.knock=.22;e.kx=(e.x-s.x)/d*140;e.ky=(e.y-s.y)/d*140}addParticle(s.x,s.y,'#ff924b',28,190);addParticle(s.x,s.y,'#ffdc72',15,130);shake=Math.max(shake,6);sound(75,.3,'sawtooth')}
function damageEnemy(e,d,crit,source){
 if(e.hp<=0)return;
 d*=ElementSystem.multiplier(game,e);if(crit)d*=game.player.critMult;
 e.hp-=d;e.hit=.1;
 if(source==='element'){
  // Group rapid periodic/reaction numbers; no extra combat RNG for UI jitter.
  const number=e.elementNumber;
  if(number&&number.until>game.time&&number.floater.life>0){number.amount+=d;number.floater.text=Math.round(number.amount)}
  else if(game.floaters.length<ElementSystem.limits.numbers){
   const floater={x:e.x,y:e.y-e.r,life:.7,text:Math.round(d),color:'#c1d9b2',crit:false};
   game.floaters.push(floater);e.elementNumber={floater,amount:d,until:game.time+.3};
  }
 }else game.floaters.push({x:e.x+rand(-8,8),y:e.y-e.r,life:.7,text:Math.round(d),color:crit?'#ffe06a':'#fff1ca',crit});
 if(e.hp<=0)addParticle(e.x,e.y,e.color,6,90);
 if(source&&source!=='element')ElementSystem.onHit(game,e,source,damageEnemy);
}
function openUpgrades(){if(screen==='upgrade'){game.pendingUpgrades++;return}if(screen!=='playing')return;const pool=[...upgradePool.filter(u=>!u.weapon||game.weapons[u.weapon].level>0),...ElementSystem.cards(game)];for(const [id,w] of Object.entries(game.weapons)){if(w.level<8&&(id!=='solar'||w.level>0))pool.push({name:w.level?`Melhorar: ${w.name}`:`Nova arma: ${w.name}`,desc:w.level?`Nível ${w.level} → ${w.level+1}: +18% dano e recarga mais rápida.`:`Adiciona ${w.name} à sua coleção. ${w.desc}`,rarity:w.level?'Incomum':'Rara',icon:w.icon,weapon:id,apply:g=>{const a=g.weapons[id];if(!a.level){a.level=1;a.cool=.2}else a.level++;a.damage*=1.18;a.cd*=.94}})}const selected=[];for(let i=0;i<3&&pool.length;i++){let weights=pool.map(u=>{let base={Comum:55,Incomum:27,Rara:13,Épica:4,Lendária:1}[u.rarity]||1;if(u.elementalId)base=u.weight;return base*(1+game.player.luck*({Comum:-.25,Incomum:0,Rara:1.1,Épica:2,Lendária:2.7}[u.rarity]||0))}),sum=weights.reduce((a,b)=>a+b,0),n=Math.random()*sum,j=weights.findIndex(w=>(n-=w)<0);selected.push(pool.splice(Math.max(0,j),1)[0])}game.choices=selected;screen='upgrade';sound(700,.2,'sine')}
function pickUpgrade(i){if(screen!=='upgrade'||!game.choices[i])return;if(game.choices[i].elementalId&&!ElementSystem.canSelect(game,game.choices[i].elementalId))return;game.choices[i].apply(game);say(game.choices[i].name.toUpperCase(),1500);game.choices=[];screen='playing';sound(500,.1,'sine');if(game.pendingUpgrades>0){game.pendingUpgrades--;openUpgrades()}}
function interactWithKnowledgeChest(){if(screen!=='playing'||!game)return;const chest=KnowledgeChestSystem.nearest(game.chests,game.player,58);if(!chest)return;game.nearKnowledgeChest=chest;const quiz=KnowledgeChestSystem.open(chest,game.stage,game.level,game.knowledgeUsed);if(!quiz)return;game.knowledgeQuiz={chest,quiz};screen='knowledge';interactButton.hidden=true;sound(520,.14,'sine')}
function grantChestXP(amount,defer=false){
 const g=game,xp=Number.isFinite(amount)?Math.max(0,Math.min(Number.MAX_SAFE_INTEGER,Math.floor(amount))):0;
 g.xp=Math.min(Number.MAX_SAFE_INTEGER,g.xp+xp);let levels=0;
 while(g.xp>=g.xpNeed&&g.xpNeed>0){g.xp-=g.xpNeed;g.level++;g.xpNeed=Math.floor(g.xpNeed*1.23+4);levels++}
 g.pendingUpgrades+=levels;
 if(!defer&&screen==='playing'&&g.pendingUpgrades>0){g.pendingUpgrades--;openUpgrades()}
 return levels;
}
function awardKnowledgeReward(quiz){
 if(quiz.rewardApplied||!quiz.correct)return;
 const g=game;quiz.rewardApplied=true;quiz.rewardLevel=g.level;
 quiz.rewardXP=ChestSystem.reward(g.level,'knowledge',quiz.question.reward.xp);
 grantChestXP(quiz.rewardXP,true);let message=`+${ChestSystem.format(quiz.rewardXP)} XP · nível ${quiz.rewardLevel}`;
 if(Math.random()<quiz.question.reward.weaponChance){
  const options=Object.values(g.weapons).filter(w=>w.level>0&&w.level<w.max);
  if(options.length){const weapon=choose(options);weapon.level++;weapon.damage*=1.12;weapon.cd*=.96;message+=` • ${weapon.name} aprimorada`}
 }
 quiz.rewardText=message;
 if(g.knowledgeQuiz?.quiz===quiz)ChestSystem.burst(g,g.knowledgeQuiz.chest,quiz.rewardXP);
 for(let i=0;i<18;i++)addParticle(g.player.x,g.player.y,choose(['#e9c16b','#f6dfa0','#d18b4e']),1,125);
 sound(850,.28,'sine');
}
function answerKnowledgeQuestion(index){if(screen!=='knowledge'||!game?.knowledgeQuiz)return;const state=game.knowledgeQuiz;if(!KnowledgeChestSystem.answer(state.quiz,index))return;state.chest.opening=1;state.chest.openedAt=performance.now();if(state.quiz.correct)awardKnowledgeReward(state.quiz);else{state.quiz.rewardText='Sem recompensa desta vez. Você pode continuar a partida.';sound(120,.2,'sawtooth')}}
function closeKnowledgePanel(){if(screen!=='knowledge'||!game?.knowledgeQuiz)return;const state=game.knowledgeQuiz;KnowledgeChestSystem.close(state.chest);if(state.chest.used)game.chests=game.chests.filter(c=>c!==state.chest);game.knowledgeQuiz=null;game.nearKnowledgeChest=KnowledgeChestSystem.nearest(game.chests,game.player,58);screen='playing';if(game.pendingUpgrades>0){game.pendingUpgrades--;openUpgrades()}}
function handleKnowledgePointer(e){const p=pos(e),state=game?.knowledgeQuiz;if(!state)return;if(state.quiz.answered){const r=knowledgeContinueRect();if(p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h)closeKnowledgePanel();return}for(const [i,r] of knowledgeAnswerRects().entries())if(p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h){answerKnowledgeQuestion(i);break}}
function openChest(chest){
 const g=game,c=chest||ChestSystem.create(g.player.x,g.player.y);
 if(c.rewardClaimed||c.used||c.knowledge)return false;
 c.rewardClaimed=true;c.dead=true;c.rewardLevel=g.level;c.rewardXP=ChestSystem.reward(g.level,ChestSystem.type(c));
 const candidates=Object.values(g.weapons).filter(w=>w.level>=3&&w.level<8&&!w.evolved),w=candidates.length?choose(candidates):null;
 let message;
 if(w){
  w.evolved=true;w.level=Math.min(8,w.level+2);
  const names={revolver:'PISTOLEIRO FANTASMA',shotgun:'TEMPESTADE DE CHUMBO',dynamite:'DEMOLIÇÃO DO OESTE',thorns:'FURACÃO DE ESPINHOS',lasso:'CORRENTE DA TEMPESTADE',rain:'SALVA DO APOCALIPSE',meteor:'CHUVA DE OURO',solar:'SOL DO JUÍZO FINAL'};
  message=`ARMA EVOLUÍDA: ${names[w.id]}`;g.player.damage*=1.12;sound(800,.5,'sine');
  for(let i=0;i<35;i++)addParticle(g.player.x,g.player.y,choose(['#ffe56d','#f07e49','#72e8dc']),1,160);
 }else{
  g.player.hp=Math.min(g.player.maxHp,g.player.hp+g.player.maxHp*.35);
  const options=Object.values(g.weapons).filter(x=>x.level<8),weapon=options.length?choose(options):null;
  if(weapon)weapon.level++;
  message=weapon?'BAÚ: TÔNICO E MELHORIA DE ARMA':'BAÚ: TÔNICO';sound(650,.25,'sine');
 }
 ChestSystem.burst(g,c,c.rewardXP);grantChestXP(c.rewardXP);
 say(`${message} · +${ChestSystem.format(c.rewardXP)} XP`,3000);return true;
}
function endGame(){if(screen==='dead')return;screen='dead';if(game.time>save.best)save.best=game.time;persist();sound(72,.8,'sawtooth')}
const sx=x=>Math.round(x-camera.x+W/2),sy=y=>Math.round(y-camera.y+H/2);
function syncKnowledgeButton(){interactButton.hidden=!(screen==='playing'&&game?.nearKnowledgeChest);touch.style.display=screen==='playing'?'':'none'}
function draw(){syncKnowledgeButton();ctx.clearRect(0,0,W,H);if(screen==='title'){drawTitle();return}if(screen==='characters'){drawCharacterSelect();return}if(!game){drawTitle();return}ctx.save();if(shake>0)ctx.translate(rand(-shake,shake),rand(-shake,shake));drawWorld();ctx.restore();drawHUD();ElementVisuals.hud(ctx,game,W);if(screen==='upgrade')drawUpgrade();if(screen==='pause')drawPause();if(screen==='knowledge')drawKnowledgePanel();if(screen==='dead')drawDead();if(performance.now()<toastUntil){ctx.save();ctx.globalAlpha=clamp((toastUntil-performance.now())/240,.45,1);toast.style.display='block';ctx.restore()}else toast.style.display='none'}
function drawWorld(){const g=game;ctx.fillStyle='#cfaa72';ctx.fillRect(0,0,W,H);drawGround();BossSystem.warnings(ctx,g,sx,sy);drawScenery(false);for(const c of g.chests)drawChest(c);for(const h of g.hazards)WeaponVisuals.meteor(ctx,h,sx,sy);
 for(const gem of g.gems)drawGemSprite(gem);
 for(const s of g.shots)drawProjectileSprite(s);
 for(const s of g.hostile){ctx.fillStyle=s.color;ctx.beginPath();ctx.arc(sx(s.x),sy(s.y),s.r,0,TAU);ctx.fill();ctx.strokeStyle='#fff8';ctx.stroke()}
 WeaponVisuals.orbits(ctx,g,sx,sy);for(const e of g.enemies)drawEnemy(e);EnemySprites.effects(ctx,g,sx,sy);drawPlayer(g.player);drawScenery(true);WeaponVisuals.effects(ctx,g,sx,sy);ChestSystem.effects(ctx,g,sx,sy);drawLassoEffects();ElementVisuals.world(ctx,g,sx,sy);for(const a of g.particles){ctx.globalAlpha=clamp(a.life/a.max,0,1);ctx.fillStyle=a.color;ctx.fillRect(sx(a.x)-a.size/2,sy(a.y)-a.size/2,a.size,a.size)}ctx.globalAlpha=1;for(const f of g.floaters){ctx.globalAlpha=clamp(f.life*1.5,0,1);ctx.fillStyle=f.color;ctx.font=`${f.crit?'bold ':''}${f.crit?16:12}px Georgia`;ctx.textAlign='center';ctx.fillText(f.text,sx(f.x),sy(f.y))}ctx.globalAlpha=1}
function drawGround(){const camX=Math.floor((camera.x-W/2)/64),camY=Math.floor((camera.y-H/2)/64),cols=Math.ceil(W/64)+2,rows=Math.ceil(H/64)+2;for(let y=-1;y<rows;y++)for(let x=-1;x<cols;x++){const wx=(camX+x)*64,wy=(camY+y)*64,px=wx-camera.x+W/2,py=wy-camera.y+H/2,seed=Math.abs(Math.sin(wx*12.989+wy*78.233)*43758.5453)%1;ctx.fillStyle='#cfaa72';ctx.fillRect(px,py,64,64);if(seed<.2){const ox=8+(seed*73)%45,oy=7+(seed*91)%45;ctx.fillStyle='#b89464';ctx.fillRect(px+ox,py+oy,5+seed*8,2+seed*4);ctx.fillStyle='#e1c28c';ctx.fillRect(px+ox+2,py+oy,3,2)}else if(seed>.78){ctx.fillStyle='#dfbd83';ctx.fillRect(px+10+(seed*47)%40,py+8+(seed*23)%44,3,2)}if(seed>.58&&seed<.72){ctx.fillStyle='#af885e';ctx.fillRect(px+29,py+28,10,7);ctx.fillStyle='#d7b984';ctx.fillRect(px+29,py+27,7,3);ctx.fillStyle='#85684d';ctx.fillRect(px+32,py+35,12,2)}if(seed>.72&&seed<.86){ctx.fillStyle='#8a9b63';ctx.fillRect(px+25,py+30,2,9);ctx.fillRect(px+19,py+31,6,2);ctx.fillRect(px+27,py+34,6,2);ctx.fillStyle='#c0aa70';ctx.fillRect(px+18,py+33,3,2)}}}
function drawScenery(front){const camX=Math.floor((camera.x-W/2)/64),camY=Math.floor((camera.y-H/2)/64),cols=Math.ceil(W/64)+2,rows=Math.ceil(H/64)+2,feet=game.player.y+11;for(let y=-1;y<rows;y++)for(let x=-1;x<cols;x++){const wx=(camX+x)*64,wy=(camY+y)*64,seed=Math.abs(Math.sin(wx*12.989+wy*78.233)*43758.5453)%1;if(seed<=.78||(seed>.94&&seed<=MAP_CACTUS_THRESHOLD))continue;const propX=wx+12+(seed*47)%39,propY=wy+44,px=propX-camera.x+W/2,py=propY-camera.y+H/2;if((propY>=feet)!==front)continue;if(seed>.94)drawCactusProp(px,py,.78+seed*.3);else drawDryBush(px,py,.72+seed*.35)}}
function drawDryBush(x,y,s=1){ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(s,s);ctx.fillStyle='#79533c';ctx.fillRect(-13,1,27,3);ctx.fillStyle='#88734e';ctx.fillRect(-11,-5,6,8);ctx.fillRect(-4,-9,7,12);ctx.fillRect(3,-6,8,9);ctx.fillStyle='#a28a5b';ctx.fillRect(-9,-5,3,4);ctx.fillRect(-2,-8,3,4);ctx.fillRect(5,-5,4,4);ctx.fillStyle='#d0b47c';ctx.fillRect(-1,-11,3,3);ctx.restore()}
function drawCactusProp(x,y,s=1){ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(s,s);ctx.fillStyle='#604a37';ctx.fillRect(-13,16,27,4);ctx.fillStyle='#315743';ctx.fillRect(-6,-29,13,47);ctx.fillRect(-17,-16,10,23);ctx.fillRect(-17,-17,17,8);ctx.fillRect(7,-9,11,27);ctx.fillRect(1,-10,17,8);ctx.fillStyle='#4f7950';ctx.fillRect(-4,-27,9,43);ctx.fillRect(-15,-14,8,18);ctx.fillRect(9,-7,7,23);ctx.fillStyle='#79a365';ctx.fillRect(-2,-25,4,39);ctx.fillRect(-13,-12,3,14);ctx.fillRect(11,-5,3,18);ctx.fillStyle='#a2b174';ctx.fillRect(-5,-20,2,2);ctx.fillRect(2,-13,2,3);ctx.fillRect(-3,-4,2,2);ctx.fillRect(3,5,2,2);ctx.fillRect(-12,-9,2,2);ctx.fillRect(12,1,2,2);ctx.fillStyle='#d8c28a';ctx.fillRect(-2,-31,5,3);ctx.fillRect(-1,-34,3,3);ctx.restore()}
function drawPlayer(p){const x=Math.round(sx(p.x)),y=Math.round(sy(p.y)),walk=Math.round(Math.sin(p.walk)*2);ctx.save();ctx.translate(x,y);if(p.facing<0)ctx.scale(-1,1);if(p.invuln>0&&Math.floor(p.invuln*14)%2)ctx.globalAlpha=.45;ctx.fillStyle='#49352d';ctx.fillRect(-16,11,32,5);ctx.fillRect(-12,15,24,2);ctx.fillStyle='#76513c';ctx.fillRect(-12,8+walk,9,7);ctx.fillRect(3,8-walk,9,7);ctx.fillStyle='#283e38';ctx.fillRect(-11,-16,22,29);ctx.fillStyle='#3e704a';ctx.fillRect(-9,-15,18,27);ctx.fillStyle='#62945a';ctx.fillRect(-7,-14,12,24);ctx.fillRect(-17,-10+walk,9,6);ctx.fillRect(-17,-10+walk,5,13);ctx.fillRect(8,-7-walk,9,6);ctx.fillRect(12,-10-walk,5,13);ctx.fillStyle='#89ad69';ctx.fillRect(-5,-12,2,20);ctx.fillRect(-2,-13,3,4);ctx.fillRect(3,-6,2,3);ctx.fillRect(-5,3,2,4);ctx.fillStyle='#d95b4d';ctx.fillRect(-9,-1,18,5);ctx.fillRect(7,1,5,3);ctx.fillStyle='#a83e40';ctx.fillRect(-8,3,15,2);ctx.fillStyle='#f4d9a0';ctx.fillRect(2,-12,2,3);ctx.fillStyle='#292929';ctx.fillRect(3,-12,1,1);for(let i=0;i<6;i++){const sx0=-6+(i%3)*6,sy0=-8+Math.floor(i/3)*10;ctx.fillStyle='#dce5b0';ctx.fillRect(sx0-1,sy0-3,2,4)}ctx.fillStyle='#493126';ctx.fillRect(-11,-16,22,3);ctx.fillRect(-8,-19,17,5);ctx.fillRect(-6,-23,13,5);ctx.fillRect(-3,-25,8,3);ctx.fillStyle='#bd7d3e';ctx.fillRect(-7,-22,14,2);ctx.fillStyle='#d5a04d';ctx.fillRect(-14,-16,28,3);ctx.fillRect(8,-20,3,3);ctx.fillStyle='#f2d184';ctx.fillRect(-2,-21,7,1);ctx.fillStyle='#efe0ac';ctx.fillRect(-10,-15,4,1);ctx.fillRect(7,-15,4,1);ctx.fillStyle='#604332';ctx.fillRect(-15,5,5,5);ctx.fillRect(10,5,5,5);ctx.fillStyle='#d8b078';ctx.fillRect(-10,12,8,2);ctx.fillRect(4,12,8,2);ctx.restore()}
function drawEnemy(e){EnemySprites.draw(ctx,e,sx(e.x),sy(e.y),game.time)}
function drawChest(c){const x=sx(c.x),y=sy(c.y)+Math.sin(c.bob)*3;ctx.fillStyle='#603a24';ctx.fillRect(x-12,y-7,24,17);ctx.fillStyle='#c7913f';ctx.fillRect(x-12,y-8,24,5);ctx.fillRect(x-2,y-8,4,18);ctx.fillStyle='#ffe384';ctx.fillRect(x-2,y-2,4,5)}
function drawHUD(){const g=game,p=g.player,pad=18;ctx.save();ctx.fillStyle='#2a1d1bdc';ctx.fillRect(12,12,280,76);ctx.strokeStyle='#e5bd74';ctx.lineWidth=2;ctx.strokeRect(12,12,280,76);ctx.fillStyle='#140f10';ctx.fillRect(24,25,250,13);ctx.fillStyle='#a84038';ctx.fillRect(24,25,250*clamp(p.hp/p.maxHp,0,1),13);ctx.strokeStyle='#f2d99b';ctx.strokeRect(24,25,250,13);ctx.fillStyle='#21191a';ctx.fillRect(24,49,250,10);ctx.fillStyle='#55c9d1';ctx.fillRect(24,49,250*clamp(g.xp/g.xpNeed,0,1),10);ctx.strokeStyle='#eee0b1';ctx.strokeRect(24,49,250,10);ctx.fillStyle='#fff1d0';ctx.font='bold 13px Georgia';ctx.textAlign='left';ctx.fillText(`NÍVEL ${g.level}   ♥ ${Math.ceil(p.hp)}/${Math.ceil(p.maxHp)}`,24,80);
 ctx.textAlign='center';ctx.font='bold 18px Georgia';ctx.fillStyle='#fff1cb';ctx.fillText(fmtTime(g.time),W/2,29);ctx.font='12px Georgia';ctx.fillText(`ESTÁGIO ${g.stage}  •  ${g.kills} FORASTEIROS`,W/2,47);ctx.textAlign='right';ctx.font='13px Georgia';ctx.fillText('ESC Ⅱ',W-18,27);if(W>=700){ctx.fillStyle=CharacterRoster.get(p.characterId).color;ctx.fillText(CharacterRoster.get(p.characterId).name,W-18,47)}
 let by=105;for(const w of Object.values(g.weapons).filter(x=>x.level)){ctx.fillStyle='#241a19c9';ctx.fillRect(14,by,198,24);ctx.fillStyle=w.color;ctx.font='bold 13px Georgia';ctx.textAlign='left';ctx.fillText(`${w.icon} ${w.name}${w.evolved?' ✦':''}`,22,by+16);ctx.fillStyle='#fff1ce';ctx.textAlign='right';ctx.fillText(`${w.level}`,204,by+16);by+=28}if(g.boss){ctx.fillStyle='#2d1c20';ctx.fillRect(W*.27,H-28,W*.46,13);ctx.fillStyle='#c8423b';ctx.fillRect(W*.27,H-28,W*.46*clamp(g.boss.hp/g.boss.maxHp,0,1),13);ctx.strokeStyle='#f0d18d';ctx.strokeRect(W*.27,H-28,W*.46,13);ctx.fillStyle='#fff0cf';ctx.font='12px Georgia';ctx.textAlign='center';ctx.fillText(BossSystem.name(g.boss).toUpperCase()+(g.boss.hp<g.boss.maxHp*.5?' · ENFURECIDO':''),W/2,H-34)}ctx.restore()}
function drawTitle(){ctx.fillStyle='#c88149';ctx.fillRect(0,0,W,H);for(let i=0;i<8;i++){const y=H*.46+i*i*3;ctx.fillStyle=['#a65e43','#9a5542','#80453b'][i%3];ctx.beginPath();ctx.moveTo(0,y+45);ctx.lineTo(W*.12,y-25-i*3);ctx.lineTo(W*.25,y+15);ctx.lineTo(W*.43,y-55-i*3);ctx.lineTo(W*.62,y+20);ctx.lineTo(W*.82,y-42-i*2);ctx.lineTo(W,y+5);ctx.lineTo(W,y+120);ctx.lineTo(0,y+120);ctx.fill()}ctx.fillStyle='#e9b36b';ctx.fillRect(0,H*.69,W,H*.31);for(let i=0;i<7;i++)drawCactusProp((i*197+55)%W,H*.81+(i%3)*20,.9+(i%2)*.3);ctx.fillStyle='#39251f';ctx.textAlign='center';ctx.font=`bold ${Math.min(54,W*.075)}px Georgia`;ctx.fillText('CACTUS SURVIVORS',W/2,H*.24);ctx.fillStyle='#f0cc84';ctx.font=`bold ${Math.min(22,W*.035)}px Georgia`;ctx.fillText('O ÚLTIMO CACTO DO OESTE',W/2,H*.31);drawCharacterPreview(CharacterRoster.get(selectedCharacterId),W/2,H*.44,1);const labels=['JOGAR',`OPÇÕES — SOM ${save.sound?'LIGADO':'DESLIGADO'}`,'COMO JOGAR'];ctx.font='bold 19px Georgia';for(let i=0;i<3;i++){const y=H*(.53+i*.09);ctx.fillStyle='#613522';ctx.fillRect(W/2-143,y-25,286,40);ctx.strokeStyle='#edc276';ctx.lineWidth=2;ctx.strokeRect(W/2-143,y-25,286,40);ctx.fillStyle='#fff0cf';ctx.fillText(labels[i],W/2,y+2)}ctx.font='14px Georgia';ctx.fillStyle='#432c24';ctx.fillText(`RECORDE: ${fmtTime(save.best||0)}  •  WASD / SETAS PARA MOVER  •  ESC PARA PAUSAR`,W/2,H*.91)}
function card(x,y,w,h,c,index){const hover=pointer.x>=x&&pointer.x<=x+w&&pointer.y>=y&&pointer.y<=y+h;ElementVisuals.card(ctx,{x,y,w,h},c,hover,index)}
function wrapText(text,x,y,max,lineH){let words=text.split(' '),line='';for(const word of words){const test=line?line+' '+word:word;if(ctx.measureText(test).width>max&&line){ctx.fillText(line,x,y);y+=lineH;line=word}else line=test}if(line)ctx.fillText(line,x,y)}
function knowledgeLayout(){const state=game?.knowledgeQuiz;if(!state)return null;const q=state.quiz.question,pw=Math.min(920,W-26),ph=Math.min(650,H-22),px=(W-pw)/2,py=(H-ph)/2,font=Math.min(20,W*.045),qMax=pw-50;ctx.font=`bold ${font}px Georgia`;const lines=estimateLines(q.question,qMax),qY=py+112,lineH=Math.max(18,font*1.3),contentY=Math.max(py+150,qY+lines*lineH+16),gap=12,cardW=(pw-42-gap)/2,cardH=clamp((py+ph-contentY-28-gap)/2,48,82),answers=Array.from({length:4},(_,i)=>({x:px+21+(i%2)*(cardW+gap),y:contentY+Math.floor(i/2)*(cardH+gap),w:cardW,h:cardH}));return{q,pw,ph,px,py,font,qY,lineH,contentY,answers,continue:{x:W/2-112,y:py+ph-52,w:224,h:38}}}
function estimateLines(text,maxWidth){let lines=1,line='';for(const word of text.split(' ')){const test=line?`${line} ${word}`:word;if(ctx.measureText(test).width>maxWidth&&line){lines++;line=word}else line=test}return lines}
function drawKnowledgeRewardPreview(state,l){
 if(state.quiz.answered)return;
 ctx.fillStyle='#50705b';ctx.font=`bold ${Math.min(14,W*.03)}px Georgia`;
 ctx.fillText(`ACERTO: +${ChestSystem.format(ChestSystem.reward(game.level,'knowledge',l.q.reward.xp))} XP · NÍVEL ${game.level}`,W/2,l.py+94);
}
function knowledgeAnswerRects(){return knowledgeLayout()?.answers||[]}
function knowledgeContinueRect(){return knowledgeLayout()?.continue||{x:0,y:0,w:0,h:0}}
function drawKnowledgePanel(){const state=game?.knowledgeQuiz,l=knowledgeLayout();if(!state||!l)return;ctx.fillStyle='#090d17dc';ctx.fillRect(0,0,W,H);ctx.fillStyle='#493025';ctx.fillRect(l.px,l.py,l.pw,l.ph);ctx.fillStyle='#b87b3f';ctx.fillRect(l.px+6,l.py+6,l.pw-12,l.ph-12);ctx.fillStyle='#ead6a9';ctx.fillRect(l.px+13,l.py+13,l.pw-26,l.ph-26);ctx.strokeStyle='#f0c86d';ctx.lineWidth=3;ctx.strokeRect(l.px,l.py,l.pw,l.ph);ctx.textAlign='center';ctx.fillStyle='#45291f';ctx.font=`bold ${Math.min(30,W*.068)}px Georgia`;ctx.fillText('BAÚ DO CONHECIMENTO',W/2,l.py+43);ctx.fillStyle='#725037';ctx.font=`bold ${Math.min(14,W*.035)}px Georgia`;ctx.fillText(`${l.q.category.toUpperCase()}   •   DIFICULDADE ${l.q.difficulty.toUpperCase()}`,W/2,l.py+72);drawKnowledgeRewardPreview(state,l);ctx.fillStyle='#30231f';ctx.font=`bold ${l.font}px Georgia`;wrapText(l.q.question,W/2,l.qY,l.pw-50,l.lineH);
 if(!state.quiz.answered){for(let i=0;i<4;i++){const r=l.answers[i],hover=pointer.x>=r.x&&pointer.x<=r.x+r.w&&pointer.y>=r.y&&pointer.y<=r.y+r.h;ctx.fillStyle=hover?'#f7e7c4':'#dfc99b';ctx.fillRect(r.x,r.y,r.w,r.h);ctx.strokeStyle=hover?'#b17a3e':'#89623c';ctx.lineWidth=hover?3:2;ctx.strokeRect(r.x,r.y,r.w,r.h);ctx.fillStyle='#6d442b';ctx.fillRect(r.x+8,r.y+8,25,25);ctx.fillStyle='#fff0c9';ctx.font='bold 15px Georgia';ctx.fillText(String.fromCharCode(65+i),r.x+20.5,r.y+26);ctx.fillStyle='#32261f';ctx.font=`${Math.min(16,W*.04)}px Georgia`;wrapText(l.q.options[i],r.x+r.w/2+10,r.y+r.h/2-7,r.w-54,Math.min(18,W*.045))}ctx.fillStyle='#694932';ctx.font='13px Georgia';ctx.fillText('Pressione 1–4 ou clique em uma alternativa  •  ESC fecha e guarda a pergunta',W/2,l.py+l.ph-14);return}
 const boxY=Math.max(l.contentY,l.py+l.ph*.48),boxH=Math.max(78,l.py+l.ph-64-boxY);ctx.fillStyle=state.quiz.correct?'#d2dfad':'#e1c29c';ctx.fillRect(l.px+24,boxY,l.pw-48,boxH);ctx.strokeStyle=state.quiz.correct?'#71874b':'#a46a42';ctx.lineWidth=2;ctx.strokeRect(l.px+24,boxY,l.pw-48,boxH);ctx.fillStyle=state.quiz.correct?'#35552e':'#7f392e';ctx.font='bold 20px Georgia';ctx.fillText(state.quiz.correct?'CORRETO!':'RESPOSTA INCORRETA',W/2,boxY+25);ctx.fillStyle='#36261f';ctx.font=`${Math.min(15,W*.038)}px Georgia`;const chosen=l.q.options[state.quiz.selected],correct=l.q.options[l.q.correct];wrapText(state.quiz.correct?`Sua resposta: ${chosen}`:`Resposta correta: ${correct}`,W/2,boxY+48,l.pw-76,19);wrapText(l.q.explanation,W/2,boxY+70,l.pw-76,19);ctx.fillStyle='#6b442d';ctx.font='bold 14px Georgia';ctx.fillText(state.quiz.rewardText||'Sem recompensa desta vez.',W/2,l.py+l.ph-62);const b=l.continue;ctx.fillStyle='#5a3826';ctx.fillRect(b.x,b.y,b.w,b.h);ctx.strokeStyle='#f0c86d';ctx.lineWidth=2;ctx.strokeRect(b.x,b.y,b.w,b.h);ctx.fillStyle='#fff0c9';ctx.font='bold 15px Georgia';ctx.fillText('CONTINUAR  •  ENTER',W/2,b.y+25)}
function drawOverlay(title,subtitle){ctx.fillStyle='#160f0fbd';ctx.fillRect(0,0,W,H);ctx.textAlign='center';ctx.fillStyle='#f2d391';ctx.font=`bold ${Math.min(44,W*.07)}px Georgia`;ctx.fillText(title,W/2,H*.3);ctx.fillStyle='#fff1d4';ctx.font='16px Georgia';ctx.fillText(subtitle,W/2,H*.37)}
function upgradeLayout(){const gap=W<600?8:16,cw=Math.min(270,(W-24-gap*2)/3),h=Math.min(380,H*.68);return {gap,cw,h,x:(W-(3*cw+2*gap))/2,y:H*.25}}
function drawUpgrade(){ctx.fillStyle='#11151be8';ctx.fillRect(0,0,W,H);ctx.textAlign='center';ctx.fillStyle='#e8ce94';ctx.font=`bold ${Math.min(32,W*.055)}px Georgia`;ctx.fillText('ESCOLHA SEU DESTINO',W/2,H*.12);ctx.fillStyle='#bcbaa7';ctx.font=`${Math.min(15,W*.032)}px Georgia`;ctx.fillText('Escolha uma carta · a partida está pausada',W/2,H*.18);const l=upgradeLayout();for(let i=0;i<3;i++){const c=game.choices[i];if(c)card(l.x+i*(l.cw+l.gap),l.y,l.cw,l.h,c,i)}}
function drawPause(){drawOverlay('PAUSADO','ESC para continuar');const ls=['CONTINUAR','REINICIAR PARTIDA','VOLTAR AO MENU'];ctx.textAlign='center';for(let i=0;i<3;i++){const y=H*.45+i*55;ctx.fillStyle='#5a3827';ctx.fillRect(W/2-140,y-24,280,40);ctx.strokeStyle='#d5ad68';ctx.strokeRect(W/2-140,y-24,280,40);ctx.fillStyle='#fff1d0';ctx.font='bold 17px Georgia';ctx.fillText(ls[i],W/2,y+2)}}
function drawDead(){drawOverlay('FIM DE JOGO','O deserto ficou com a última palavra');ctx.fillStyle='#fff0ce';ctx.textAlign='center';ctx.font='18px Georgia';ctx.fillText(`Sobreviveu ${fmtTime(game.time)}   •   ${game.kills} derrotados   •   nível ${game.level}`,W/2,H*.45);ctx.fillText(`Recorde: ${fmtTime(save.best)}   •   Armas: ${Object.values(game.weapons).filter(w=>w.level).length}`,W/2,H*.5);const ls=['TENTAR NOVAMENTE','ESCOLHER PERSONAGEM'];for(let i=0;i<2;i++){const y=H*.62+i*53;ctx.fillStyle='#5a3827';ctx.fillRect(W/2-145,y-23,290,39);ctx.strokeStyle='#d5ad68';ctx.strokeRect(W/2-145,y-23,290,39);ctx.fillStyle='#fff1d0';ctx.font='bold 17px Georgia';ctx.fillText(ls[i],W/2,y+2)}}
function pixelBlock(color,x,y,w,h){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)))}
function drawHeldWeapon(p){const id=p.heldWeapon||p.startWeapon||'revolver';
 if(typeof WeaponSprites!=='undefined'&&WeaponSprites.held(ctx,p,Math.round(sx(p.x)),Math.round(sy(p.y)),p.visualTime??(game?.player===p?game.time:performance.now()/1000)))return;
 if(typeof IrisSprite!=='undefined'&&IrisSprite.active(p)&&id==='lasso')return; // Whip/bracelet are already in the PNG; world electrical effects remain active.
 if(typeof BentoSprite!=='undefined'&&BentoSprite.active(p)&&id==='dynamite')return;
 if(typeof RosaSprite!=='undefined'&&RosaSprite.active(p)){
  if(id==='shotgun')return; // The Rosa PNG already contains its shotgun and flash.
  p={...p,facing:RosaSprite.pose(p,p.visualTime??game?.time??0).face,visualTime:p.visualTime??game?.time??0};
 }
 if(typeof NopalSprite!=='undefined'&&NopalSprite.active(p)){
  if(id==='revolver'||NopalSprite.pose(p,p.visualTime??game?.time??0).shooting)return; // The PNG arm already contains the only revolver/flash.
  p={...p,facing:NopalSprite.pose(p,p.visualTime??game?.time??0).face,visualTime:p.visualTime??game?.time??0};
 }
 const face=p.facing||1,worldAngle=p.weaponAngle??(face<0?Math.PI:0),localAngle=Math.atan2(Math.sin(worldAngle),Math.cos(worldAngle)*face);
 const weaponTime=p.visualTime??(game?.player===p?game.time:performance.now()/1000),anim=WeaponVisuals.pose(id,p,weaponTime),mount=CactusHero.mount(p,weaponTime,worldAngle);
 CactusHero.drawReach(ctx,p,Math.round(sx(p.x)),Math.round(sy(p.y)),weaponTime,worldAngle,anim);
 ctx.save();ctx.imageSmoothingEnabled=false;if(p.invuln>0&&Math.floor(p.invuln*14)%2)ctx.globalAlpha=.55;
 CactusHero.rasterWeapon(ctx,Math.round(sx(p.x))+mount.x,Math.round(sy(p.y))+mount.y,face,localAngle,anim,g=>paintHeldWeapon(g,id,p,weaponTime));ctx.restore();
}
function paintHeldWeapon(ctx,id,p,weaponTime){
 const pixelBlock=(color,x,y,w,h)=>{ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)))};
 if(id==='revolver'){CactusHero.drawRevolver(ctx)}
 else if(id==='rain'){pixelBlock('#302a2b',0,-5,18,8);pixelBlock('#403b39',8,-7,13,3);pixelBlock('#5c5145',9,-4,13,4);pixelBlock('#26272a',19,-4,5,5);pixelBlock('#d3ad69',21,-3,3,3);pixelBlock('#9d7048',3,-6,8,9);pixelBlock('#d0a35b',5,-5,4,2);pixelBlock('#8b5737',4,2,7,11);pixelBlock('#b87541',6,3,3,7);pixelBlock('#d0a35b',4,1,7,2);pixelBlock('#302a2b',5,8,5,3);pixelBlock('#665b4c',2,-9,5,3);pixelBlock('#352e30',7,-10,14,4);pixelBlock('#b98b51',8,-9,6,2);pixelBlock('#a34c39',20,-9,3,3)}
 else if(id==='shotgun'){pixelBlock('#382e2c',-3,-3,8,6);pixelBlock('#82583a',-5,-2,5,8);pixelBlock('#4b423a',4,-4,22,7);pixelBlock('#343235',7,-3,21,2);pixelBlock('#d9bd83',19,-2,8,2);pixelBlock('#937249',5,3,5,6);pixelBlock('#d7a66b',1,-5,3,2)}
 else if(id==='dynamite'){pixelBlock('#452f2d',0,-5,14,11);pixelBlock('#a94438',2,-7,4,13);pixelBlock('#c95743',7,-7,4,13);pixelBlock('#da7047',12,-5,3,10);pixelBlock('#d9bc82',1,-8,15,2);pixelBlock('#d3a04d',14,-10,2,4);if(p.attack>0)pixelBlock('#ffed98',16,-12,3,3)}
 else if(id==='thorns'){pixelBlock('#33563d',1,-4,13,8);pixelBlock('#5d9656',3,-3,10,6);pixelBlock('#d5e0a0',5,-7,2,4);pixelBlock('#d5e0a0',9,-6,2,4);pixelBlock('#d5e0a0',13,-4,2,4);pixelBlock('#d5e0a0',8,3,2,4);pixelBlock('#cce79b',4,-2,2,2)}
 else if(id==='lasso')drawElectricLasso(p,ctx,weaponTime);
 else if(id==='meteor'){pixelBlock('#8d542f',1,-4,13,9);pixelBlock('#efaa3c',3,-6,9,10);pixelBlock('#ffd967',5,-5,5,5);pixelBlock('#fff0a0',7,-4,2,2);pixelBlock('#e5653f',12,-3,4,5);pixelBlock('#ffda72',15,-5,3,3)}
 else if(id==='solar'){pixelBlock('#312936',-2,-7,25,13);pixelBlock('#8b5938',0,-6,8,11);pixelBlock('#d2a457',1,-5,4,8);pixelBlock('#423640',5,-5,19,8);pixelBlock('#d8b75d',7,-7,13,2);pixelBlock('#ffe675',10,-4,15,5);pixelBlock('#fff2ae',17,-3,7,3);pixelBlock('#fff6c4',23,-3,4,3);pixelBlock('#d7744a',4,5,4,7);pixelBlock('#f9d978',22,-6,4,2)}
 WeaponVisuals.heldDetail(ctx,id,p,weaponTime);CactusHero.drawGrip(ctx,p.characterId);WeaponVisuals.muzzle(ctx,id,p,weaponTime);}
function drawElectricLasso(p,ctx,t){
 const pixelBlock=(color,x,y,w,h)=>{ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))};
 const spin=t*12;
 const cast=clamp((p.attack||0)/.18,0,1),rx=10+Math.round(cast*5),ry=4+Math.round((Math.sin(spin)+1)*2+cast*3);
 pixelBlock('#202d35',-2,-2,8,7);pixelBlock('#806347',-1,0,5,4);pixelBlock('#c3a16a',0,0,2,3);
 // Braided coil with a moving bright strand; no blur or Canvas shadow filter.
 for(let i=0;i<32;i++){
  const a=i*TAU/32,x=12+Math.round(Math.cos(a)*rx),y=Math.round(Math.sin(a)*ry);
  pixelBlock('#1c4a60',x-1,y-1,4,4);
 }
 for(let i=0;i<32;i++){
  const a=i*TAU/32,x=12+Math.round(Math.cos(a)*rx),y=Math.round(Math.sin(a)*ry);
  pixelBlock((i+Math.floor(t*24))%8<3?'#c8fff1':'#52c9d4',x,y,2,2);
 }
 for(let i=0;i<3;i++){
  const a=spin-i*.28,x=12+Math.round(Math.cos(a)*rx),y=Math.round(Math.sin(a)*ry);
  pixelBlock(i===0?'#f1fff5':'#85e4ee',x,y,i===0?3:2,i===0?3:2);
 }
 pixelBlock('#c7e9bb',2,1,3,2);
}
// Rasterize thick electric threads with square pixels and deterministic jitter.
function drawElectricThread(x1,y1,x2,y2,color,size){
 const dx=x2-x1,dy=y2-y1,n=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))/2));
 ctx.fillStyle=color;
 for(let i=0;i<=n;i++)ctx.fillRect(Math.round(x1+dx*i/n)-Math.floor(size/2),Math.round(y1+dy*i/n)-Math.floor(size/2),size,size);
}
function drawLassoEffects(){
 const arcs=game.lassoArcs;if(!arcs?.length)return;
 ctx.save();
 for(const arc of arcs){
  const age=game.time-arc.start;if(age<0||age>=.36)continue;
  const x1=sx(arc.x1),y1=sy(arc.y1),x2=sx(arc.x2),y2=sy(arc.y2),dx=x2-x1,dy=y2-y1,length=Math.hypot(dx,dy)||1;
  const reveal=clamp(age/.055,0,1),fade=clamp((.36-age)/.17,0,1),segments=Math.min(28,Math.max(4,Math.ceil(length/12))),tick=Math.floor(age*36);
  ctx.globalAlpha=fade;
  // Three passes keep the white core continuous and the dark cyan rim readable.
  for(let pass=0;pass<3;pass++){
   let lastX=x1,lastY=y1;
   for(let j=1;j<=segments;j++){
    const u=Math.min(j/segments,reveal),offset=u>=1?0:Math.sin(j*13.7+tick*2.3)*Math.sin(u*Math.PI)*(arc.evolved?9:6);
    const x=x1+dx*u-dy/length*offset,y=y1+dy*u+dx/length*offset;
    drawElectricThread(lastX,lastY,x,y,pass===0?'#17445c':pass===1?(arc.evolved?'#7baef5':'#50c8df'):'#ddfff6',pass===0?5:pass===1?3:1);
    lastX=x;lastY=y;if(u>=reveal)break;
   }
  }
  // A contracting electric loop and outward sparks mark each actual hit.
  if(age>=.055){
   const radius=Math.max(7,arc.r+7-Math.min(1,(age-.055)/.2)*7);
   for(let i=0;i<16;i++){
    const a=i*TAU/16+age*5,x=x2+Math.cos(a)*radius,y=y2+Math.sin(a)*radius*.7;
    pixelBlock(i%4===tick%4?'#effff5':'#79deed',x,y,2,2);
   }
   for(let i=0;i<4;i++){
    const a=i*TAU/4+arc.x2*.01,r=arc.r+5+age*25;
    pixelBlock('#c4fff0',x2+Math.cos(a)*r,y2+Math.sin(a)*r,2,2);
   }
  }
 }
 ctx.restore();
}
function drawProjectileSprite(s){WeaponVisuals.projectile(ctx,s,game.time,sx,sy)}
function drawGemSprite(g){const x=sx(g.x),y=sy(g.y)+Math.round(Math.sin(g.bob)*2),r=g.r;pixelBlock('#72503977',x-r-1,y+r-1,r*2+3,3);pixelBlock('#294c60',x-r,y-r*.25,r*2,r*1.45);pixelBlock(g.color,x-r+2,y-r*.45,r*2-4,r*1.35);pixelBlock('#f2eed0',x-r*.35,y-r*.48,Math.max(2,r*.45),Math.max(2,r*.48));pixelBlock('#ffffffaa',x-r*.15,y-r*.55,Math.max(1,r*.2),Math.max(1,r*.2));pixelBlock('#397184',x-r+2,y+r*.48,r*2-4,Math.max(2,r*.2))}
function drawPlayerSprite(p){const x=sx(p.x),y=sy(p.y),step=Math.round(Math.sin(p.walk)*2),atk=p.attack>0;ctx.save();ctx.translate(x,y);if(p.facing<0)ctx.scale(-1,1);if(p.invuln>0&&Math.floor(p.invuln*14)%2)ctx.globalAlpha=.42;ctx.fillStyle='#79543a88';ctx.beginPath();ctx.ellipse(0,17,18,7,0,0,TAU);ctx.fill();pixelBlock('#382b27',-14,12+step,11,8);pixelBlock('#382b27',4,12-step,11,8);pixelBlock('#a96e3e',-13,13+step,9,4);pixelBlock('#a96e3e',5,13-step,9,4);pixelBlock('#e4bf7a',-12,17+step,8,2);pixelBlock('#e4bf7a',6,17-step,8,2);pixelBlock('#263d36',-12,-21,24,34);pixelBlock('#426f48',-10,-20,20,30);pixelBlock('#5d9256',-8,-18,15,27);pixelBlock('#79a567',-5,-16,3,20);pixelBlock('#3f6847',-17,-14,8,18);pixelBlock('#527f4e',-16,-14,6,13);pixelBlock('#3b6545',9,-13,8,17);pixelBlock('#57864f',10,-12,5,12);pixelBlock('#9eb678',-8,-12,2,2);pixelBlock('#d9e1ae',-9,-13,2,3);pixelBlock('#9eb678',1,-16,2,3);pixelBlock('#d9e1ae',2,-17,2,3);pixelBlock('#9eb678',6,-3,2,3);pixelBlock('#d9e1ae',7,-4,2,3);pixelBlock('#a9bc7c',-4,5,2,3);pixelBlock('#d9e1ae',-5,4,2,3);pixelBlock('#d9e1ae',-15,-9,2,3);pixelBlock('#d9e1ae',11,-7,2,3);pixelBlock('#b33f40',-11,-3,22,7);pixelBlock('#dc5a4d',-10,-4,20,5);pixelBlock('#ef9a70',-5,-3,11,2);pixelBlock('#a63d3e',7,0,6,4);pixelBlock('#312a28',-4,-13,10,5);pixelBlock('#f5d79e',-3,-12,2,2);pixelBlock('#f5d79e',3,-12,2,2);pixelBlock('#282321',-2,-12,1,1);pixelBlock('#282321',4,-12,1,1);pixelBlock('#e8c88f',-1,-8,5,1);pixelBlock('#392923',-17,-25,34,6);pixelBlock('#503526',-12,-34,24,11);pixelBlock('#68432b',-9,-37,18,6);pixelBlock('#805333',-7,-35,13,4);pixelBlock('#bc7b3e',-12,-31,24,2);pixelBlock('#e0a653',-17,-25,34,3);pixelBlock('#f0cc75',-8,-31,16,1);pixelBlock('#e9c86b',9,-31,3,3);pixelBlock('#f3d481',10,-31,1,1);pixelBlock('#50362a',-15,5,5,8);pixelBlock('#50362a',10,5,5,8);pixelBlock('#d6ad6d',-10,8,3,3);pixelBlock('#d6ad6d',7,8,3,3);if(atk){pixelBlock('#76503a',12,-12,8,5);pixelBlock('#dcb477',18,-13,5,3)}ctx.restore()}
function drawCactusSprite(x,y,s=1){ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(s,s);pixelBlock('#654a34',-15,17,31,4);pixelBlock('#263e35',-7,-30,15,49);pixelBlock('#263e35',-19,-17,11,24);pixelBlock('#263e35',-18,-19,18,9);pixelBlock('#263e35',8,-9,12,28);pixelBlock('#263e35',2,-11,18,9);pixelBlock('#47724a',-5,-28,11,44);pixelBlock('#47724a',-16,-15,9,18);pixelBlock('#47724a',10,-7,8,24);pixelBlock('#669253',-3,-26,5,40);pixelBlock('#669253',-14,-13,4,14);pixelBlock('#669253',12,-5,3,18);pixelBlock('#9bb36f',-6,-22,2,3);pixelBlock('#d9e1ae',-7,-23,2,3);pixelBlock('#9bb36f',2,-16,2,3);pixelBlock('#d9e1ae',3,-17,2,3);pixelBlock('#9bb36f',-3,-7,2,3);pixelBlock('#d9e1ae',-4,-8,2,3);pixelBlock('#9bb36f',3,2,2,3);pixelBlock('#d9e1ae',4,1,2,3);pixelBlock('#d2bd82',-2,-33,5,4);pixelBlock('#d8a487',1,-33,2,2);pixelBlock('#d2bd82',-1,-37,3,4);ctx.restore()}
function drawChestSprite(c){const x=sx(c.x),y=sy(c.y)+Math.round(Math.sin(c.bob)*2);pixelBlock('#49352c',x-14,y+8,29,5);pixelBlock('#392d2a',x-13,y-5,27,14);pixelBlock('#8e5934',x-11,y-10,23,10);pixelBlock('#bd8045',x-9,y-9,19,7);pixelBlock('#d9a552',x-13,y-4,27,4);pixelBlock('#a96c39',x-10,y-2,4,10);pixelBlock('#a96c39',x+7,y-2,4,10);pixelBlock('#efcb72',x-2,y-10,5,19);pixelBlock('#f5df8a',x-1,y-3,3,4);pixelBlock('#6d472f',x-10,y+8,5,3);pixelBlock('#6d472f',x+6,y+8,5,3)}
function drawSpecialChest(c){const kind=ChestSystem.type(c),amount=ChestSystem.preview(game.level,c),near=kind==='knowledge'?game.nearKnowledgeChest===c:dist(game.player,c)<100;ChestSystem.draw(ctx,c,sx(c.x),sy(c.y),game.time,amount,near&&screen==='playing')}
function drawPlayerNight(p){CactusHero.draw(ctx,p,sx(p.x),sy(p.y),p.visualTime??(game?.player===p?game.time:performance.now()/1000))}
function drawCactusNight(x,y,s=1){ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(s,s);pixelBlock('#111b20',-16,17,33,5);pixelBlock('#152722',-8,-31,17,51);pixelBlock('#152722',-20,-18,12,25);pixelBlock('#152722',-19,-20,19,10);pixelBlock('#152722',8,-10,13,29);pixelBlock('#152722',2,-12,19,10);pixelBlock('#315b43',-6,-29,13,46);pixelBlock('#315b43',-17,-16,10,19);pixelBlock('#315b43',10,-8,9,25);pixelBlock('#4d8855',-3,-27,6,41);pixelBlock('#4d8855',-15,-14,5,15);pixelBlock('#4d8855',12,-6,4,19);pixelBlock('#a5cf73',-6,-22,2,3);pixelBlock('#e8e3a5',-7,-23,2,3);pixelBlock('#a5cf73',2,-15,2,3);pixelBlock('#e8e3a5',3,-16,2,3);pixelBlock('#a5cf73',-3,-5,2,3);pixelBlock('#e8e3a5',-4,-6,2,3);pixelBlock('#a5cf73',4,4,2,3);pixelBlock('#e8e3a5',5,3,2,3);pixelBlock('#e7bb68',-2,-34,5,4);pixelBlock('#f28d7d',1,-34,2,2);pixelBlock('#e7bb68',-1,-38,3,4);ctx.restore()}
function drawGroundNight(){const camX=Math.floor((camera.x-W/2)/64),camY=Math.floor((camera.y-H/2)/64),cols=Math.ceil(W/64)+2,rows=Math.ceil(H/64)+2;ctx.fillStyle='#242a32';ctx.fillRect(0,0,W,H);for(let y=-1;y<rows;y++)for(let x=-1;x<cols;x++){const wx=(camX+x)*64,wy=(camY+y)*64,px=wx-camera.x+W/2,py=wy-camera.y+H/2,seed=Math.abs(Math.sin(wx*12.989+wy*78.233)*43758.5453)%1;const patch=(Math.sin(wx/512)+Math.cos(wy/768))*.25+.5;ctx.fillStyle=patch<.3?'#323538':patch>.7?'#363737':'#34363a';ctx.fillRect(px,py,64,64);drawDustTrail(wx,wy,px,py);if(seed<.28){pixelBlock('#4b4541',px+8+(seed*51)%40,py+8+(seed*73)%44,5+seed*8,2+seed*3);pixelBlock('#625349',px+12+(seed*43)%37,py+12+(seed*33)%43,2,2)}if(seed>.58&&seed<.72){pixelBlock('#423a35',px+29,py+28,10,7);pixelBlock('#635348',px+29,py+27,7,3);pixelBlock('#282a31',px+32,py+35,12,2)}if(seed>.72&&seed<.86){pixelBlock('#394c3d',px+25,py+30,2,9);pixelBlock('#426044',px+19,py+31,6,2);pixelBlock('#426044',px+27,py+34,6,2)}}}
// Continuous world-space trail: decorative only, sampled on a four-pixel grid.
// Tile clipping keeps its edges stable while the camera moves.
function drawDustTrail(wx,wy,px,py){
 const middle=wy+32,near=Math.sin(middle/640)*180+Math.sin(middle/2300)*380;
 if(wx+64<near-80||wx>near+80)return;
 for(let row=0;row<64;row+=4){
  const worldY=wy+row,center=Math.round((Math.sin(worldY/640)*180+Math.sin(worldY/2300)*380)/4)*4;
  const band=(left,right,color)=>{const a=Math.max(wx,left),b=Math.min(wx+64,right);if(b>a)pixelBlock(color,px+a-wx,py+row,b-a,4)};
  band(center-56,center+56,'#3d3b37');band(center-44,center+44,'#494139');
  band(center-28,center-24,'#3c3733');band(center+24,center+28,'#3c3733');
  if(Math.floor(worldY/12)%3===0)band(center-8,center+4,'#51473b');
 }
}
function drawBushNight(x,y,s=1){ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(s,s);pixelBlock('#201f25',-14,1,29,4);pixelBlock('#30353a',-12,-5,7,8);pixelBlock('#3b3a3c',-5,-10,8,13);pixelBlock('#293d37',3,-7,9,10);pixelBlock('#415543',-9,-5,4,4);pixelBlock('#566047',-2,-9,4,4);pixelBlock('#647150',6,-6,4,3);pixelBlock('#b7935c',-1,-12,3,3);ctx.restore()}
function drawNightVignette(){const r=Math.max(W,H)*.72,g=ctx.createRadialGradient(W/2,H/2,20,W/2,H/2,r);g.addColorStop(0,'rgba(255,187,112,.07)');g.addColorStop(.55,'rgba(24,26,37,.04)');g.addColorStop(1,'rgba(9,13,24,.38)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H)}
function installDetailedSprites(){drawPlayer=p=>{const t=p.visualTime??(game?.player===p?game.time:performance.now()/1000),behind=typeof WeaponSprites!=='undefined'&&WeaponSprites.ready()&&WeaponSprites.heldState(p,t).behind;if(behind)drawHeldWeapon(p);drawPlayerNight(p);if(!behind)drawHeldWeapon(p)};drawCactusProp=drawCactusNight;drawDryBush=drawBushNight;drawGround=()=>{drawGroundNight();drawNightVignette()};drawChest=drawSpecialChest}
function fmtTime(t){return`${Math.floor(t/60).toString().padStart(2,'0')}:${Math.floor(t%60).toString().padStart(2,'0')}`}
function frame(now){const dt=Math.min(.04,(now-last)/1000||0);last=now;update(dt);draw();requestAnimationFrame(frame)}requestAnimationFrame(frame);
// Attach stable identifiers after cloning definitions, then initialise menu state.
for(const [id,d] of Object.entries(weaponDefs))d.id=id;audioOn=save.sound;installDetailedSprites();
})();
