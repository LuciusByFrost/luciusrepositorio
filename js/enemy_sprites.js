/* PNGs are primary; original cached art is retained for load failures and
   grave_keeper. All animation records live outside combat entities. */
const EnemySprites=(()=>{
 'use strict';
 const ink='#151a23',bone='#dfcfa8',brass='#b89a61',steel='#8b9996',leather='#51392f';
 const profiles={
  bandit:{name:'Bandido',w:10,head:8,top:-28,sole:12,hat:-37,coat:['#3b2c30','#785044','#b07a53'],skin:['#87634b','#c29970'],eye:'#e9bd75',scarf:'#a44c3e',pace:1},
  runner:{name:'Corredor',w:6,head:6,top:-32,sole:14,hat:-44,coat:['#452a2d','#99553a','#ce8a52'],skin:['#936649','#d6a16d'],eye:'#f2cd84',scarf:'#e06b3f',pace:1.8},
  gunslinger:{name:'Pistoleiro',w:8,head:7,top:-30,sole:12,hat:-40,coat:['#232d3d','#3c566d','#718d96'],skin:['#806e61','#b6aa89'],eye:'#a9d6cb',scarf:'#596d78',pace:.9},
  brute:{name:'Brutamontes',w:18,head:9,top:-30,sole:19,hat:-40,coat:['#30292f','#645044','#a07b54'],skin:['#76574e','#ad8970'],eye:'#e5b87d',scarf:'#4b353a',pace:.65},
  gravedigger:{name:'Coveiro',w:9,head:7,top:-30,sole:13,hat:-41,coat:['#292333','#51405f','#8a6c8c'],skin:['#7c8580','#c3c6a7'],eye:'#c4a1f2',scarf:'#3d304c',pace:.75},
  armored:{name:'Encouraçado',w:15,head:9,top:-29,sole:16,hat:-40,coat:['#302e2b','#70634a','#b6985c'],skin:['#5e5a4e','#958b6e'],eye:'#ffe09b',scarf:'#40383b',pace:.7},
  boss:{name:'Xerife Corrupto',boss:true,w:23,head:12,top:-46,sole:26,hat:-62,coat:['#261f2b','#65303c','#a05650'],skin:['#755950','#b18d75'],eye:'#f46b51',scarf:'#ae8044',pace:.65},
  iron_colonel:{name:'Coronel Ferrugem',boss:true,w:28,head:12,top:-45,sole:27,hat:-63,coat:['#302d2b','#76604a','#aa8558'],skin:['#786354','#b49a77'],eye:'#ffc065',scarf:'#806345',pace:.55},
  storm_widow:{name:'Viúva da Tempestade',boss:true,w:14,head:9,top:-52,sole:25,hat:-70,coat:['#242438','#41445f','#79718d'],skin:['#687c84','#a9beb8'],eye:'#9cf3ed',scarf:'#85629a',pace:1.15},
  grave_keeper:{name:'Coveiro do Breu',boss:true,w:22,head:12,top:-47,sole:26,hat:-68,coat:['#25232e','#4b3b55','#897181'],skin:['#81847c','#d0cead'],eye:'#cf9ff1',scarf:'#51405f',pace:.6}
 };
 const cache=new Map();let records=new WeakMap(),deaths=[];
 function key(e){return e.bossKind&&profiles[e.bossKind]?e.bossKind:profiles[e.type]?e.type:'bandit'}
 function bake(id,part){
  const c=document.createElement('canvas');c.width=c.height=128;
  const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.translate(64,88);
  let left=128,top=128,right=0,bottom=0;
  const r=(color,x,y,w,h)=>{
   g.fillStyle=color;g.fillRect(x,y,w,h);
   left=Math.min(left,x+64);top=Math.min(top,y+88);right=Math.max(right,x+64+w);bottom=Math.max(bottom,y+88+h);
  };
  paint(r,profiles[id],id,part);
  cache.set(id+':'+part,{image:c,x:left,y:top,w:Math.max(0,right-left),h:Math.max(0,bottom-top)});
 }
 function blit(g,id,part){const c=cache.get(id+':'+part);if(c?.w&&c.h)g.drawImage(c.image,c.x,c.y,c.w,c.h,c.x-64,c.y-88,c.w,c.h)}
 function paint(r,p,id,part){
  const [shade,coat,light]=p.coat,w=p.w,h=p.head,b=p.boss,top=p.top,sole=p.sole;
  const armored=id==='armored'||id==='iron_colonel',ghost=id==='gravedigger'||id==='grave_keeper';
  if(part==='boot'){
   const x=-w+2,bw=b?12:id==='brute'?12:id==='runner'?5:7,knee=id==='runner'?-3:b?7:3;
   r(ink,x,knee,bw,sole-knee);r(shade,x+1,knee,bw-2,sole-knee-1);
   r(light,x+1,knee+1,2,3);r(leather,x+1,sole-7,bw-2,6);
   r(ink,x-3,sole-3,bw+4,4);r(armored?steel:coat,x-2,sole-3,bw+2,2);
   r(armored?brass:bone,x+1,sole-6,bw-3,1);
   if(b||id==='brute'){r(ink,x+3,sole-1,1,1);r(ink,x+7,sole-1,1,1)}
  }else if(part==='back'){
   if(id==='grave_keeper'){
    // A strapped coffin remains visible outside the undertaker's shoulder.
    r(ink,-37,-47,19,61);r(ink,-34,-51,13,5);r('#493831',-35,-46,15,58);
    r('#795839',-33,-44,10,53);r(brass,-33,-42,11,2);r(brass,-29,-44,2,51);
    r('#a57b4c',-33,8,11,2);r(leather,-35,-24,16,4);r(brass,-30,-24,4,3);
   }
   if(id==='boss'||id==='storm_widow'||id==='gunslinger'||ghost){
    const y=b?-27:-13,hem=b?19:10;
    r(ink,-w-3,y,w*2+6,hem-y);r(shade,-w-2,y+1,w*2+4,hem-y-2);
    for(let i=0;i<5;i++){const x=-w-2+i*Math.floor(w*2/5);r(coat,x,hem-5,3,6+i%3);r(ink,x+3,hem-2,2,5)}
    if(id==='storm_widow'){r('#85629a',-w+1,-23,3,34);r(brass,w-3,-16,2,25)}
   }
  }else if(part==='body'){
   const shoulder=b?-29:id==='runner'?-16:-15,waist=b?17:id==='brute'?13:id==='runner'?5:w-2;
   // Stepped shoulders taper to a separate waist, leaving articulated legs.
   r(ink,-w+3,shoulder,w*2-6,4);r(ink,-w,shoulder+3,w*2,9);
   r(ink,-w+2,shoulder+10,w*2-4,8);r(ink,-waist,-2,waist*2,b?15:8);
   r(shade,-w+1,shoulder+4,w*2-2,8);r(coat,-w+3,shoulder+3,w*2-6,15);
   r(light,-w+4,shoulder+4,b?6:3,b?12:7);r(shade,w-7,shoulder+8,4,b?23:12);
   r(ink,-w-4,shoulder+6,b?10:6,b?24:15);r(coat,-w-3,shoulder+7,b?8:4,b?18:10);
   r(ink,w-4,shoulder+6,b?10:7,b?24:15);r(shade,w-3,shoulder+7,b?8:5,b?18:10);
   r(leather,-w-3,b?-2:0,b?9:6,b?9:5);r(brass,-w-2,b?-1:1,3,1);
   r(leather,w-3,b?-2:0,b?9:6,b?9:5);r(brass,w-2,b?-1:1,3,1);
   r(ink,-waist-1,b?9:4,waist*2+2,4);r(leather,-waist,b?10:5,waist*2,2);
   r(brass,-2,b?9:4,5,4);r(bone,-1,b?10:5,3,1);r(ink,0,b?11:6,2,1);
   if(id==='bandit'){
    r(shade,-8,-2,4,6);r(light,-8,-3,3,1);r(ink,-7,3,2,2);
    r(leather,7,3,5,8);r(brass,8,4,2,1);r(bone,-7,-11,2,1);
   }else if(id==='runner'){
    r(ink,-8,-14,4,9);r(light,-7,-13,2,6);r(leather,-2,-12,2,15);
    r(ink,4,-4,4,4);r(p.scarf,-6,-15,12,3);
   }else if(id==='gunslinger'){
    r(light,-6,-14,3,12);r(shade,-3,-11,4,16);
    for(let i=0;i<4;i++)r(brass,-6+i*4,3,2,3);
    r(bone,2,-10,1,1);r(bone,2,-5,1,1);
   }else if(id==='brute'){
    r(ink,-22,-17,13,9);r(ink,10,-17,13,9);r(light,-21,-16,11,5);r(coat,11,-16,11,5);
    r(leather,-12,-12,25,14);r(light,-10,-10,8,9);r(shade,2,-9,9,11);
    r(bone,-9,-7,3,1);r(ink,-7,-6,2,3);r(brass,9,-10,2,2);
    r(ink,-23,-1,11,10);r(leather,-22,0,9,7);r(brass,-21,1,7,2);
   }else if(armored){
    const y=b?-28:-16,hw=b?22:12;
    r(ink,-hw-2,y,hw*2+4,b?33:20);r(steel,-hw+1,y+1,hw*2-2,3);
    r(coat,-hw,y+4,hw*2,b?26:15);r(light,-hw+2,y+5,b?9:5,b?19:9);
    r(shade,3,y+5,hw-4,b?20:11);r(brass,-hw,y+4,2,b?25:13);
    for(const xx of [-w-5,w-4]){r(ink,xx,y-4,b?15:10,11);r(coat,xx+1,y-3,b?13:8,8);r(light,xx+2,y-2,b?8:4,2);r(brass,xx+2,y+2,2,2)}
    r(ink,-5,b?-15:-10,11,b?14:9);r(b?'#dc853f':brass,-3,b?-13:-8,7,b?10:5);
    r(b?'#ffd17c':bone,-1,b?-11:-7,3,b?6:2);
   }else if(id==='boss'){
    r('#a05650',-17,-26,5,22);r(shade,-12,-22,6,20);r(brass,-11,-19,2,3);
    // Corrupted star: deliberate stepped points, no vector polygon.
    r(ink,4,-23,13,13);r(brass,9,-24,3,15);r(brass,3,-18,15,3);
    r(brass,6,-21,9,9);r(bone,9,-19,3,3);r('#63362e',10,-16,3,4);
    for(let i=0;i<5;i++){r(ink,-16+i*7,6,5,7);r(brass,-15+i*7,7,3,5)}
   }else if(ghost){
    r(light,-w+5,shoulder+5,3,b?29:15);r(shade,-3,shoulder+6,6,b?31:18);
    r(brass,5,b?-19:-9,3,3);r(bone,-5,b?-8:-3,3,2);
    if(b){r(bone,2,-30,2,9);r(bone,-2,-26,10,2);r(ink,-14,12,3,6)}
   }else if(id==='storm_widow'){
    r('#85629a',-10,-29,5,17);r(brass,6,-25,2,29);
    for(let i=0;i<4;i++){r(brass,-8,-12+i*4,5,1);r(p.eye,-7,-11+i*4,2,1)}
    r(p.eye,-10,-27,2,3);r(p.eye,6,1,2,3);
   }
  }else if(part==='head'){
   const faceY=top+3;
   r(ink,-h+2,top,h*2-4,3);r(ink,-h,top+2,h*2,b?18:12);
   r(p.skin[0],-h+1,top+3,h*2-2,b?16:10);r(p.skin[1],-h+2,top+3,h*2-6,b?12:7);
   r(ink,-h+2,b?top+18:top+12,h*2-4,2);
   const ey=faceY+(b?6:3);r(ink,-h+3,ey-1,b?7:4,3);r(ink,2,ey-1,b?7:4,3);
   r(p.eye,-h+4,ey,b?3:2,2);r(p.eye,3,ey,b?3:2,2);
   r(ink,-3,ey+5,b?8:5,1);r(p.skin[0],0,ey+2,2,2);
   r(ink,-h+2,ey-3,b?7:4,1);r(ink,3,ey-3,b?7:4,1);
   if(ghost){r(ink,-1,ey+3,3,3);r(ink,-4,ey+6,9,3);for(let i=0;i<3;i++)r(bone,-3+i*3,ey+6,1,2)}
   if(id==='brute'){r(shade,-h,ey-2,h*2,3);r(bone,-5,ey,2,5);r(ink,1,ey+5,7,3)}
   const hy=p.hat,hw=id==='runner'?9:b?(id==='storm_widow'?23:29):id==='brute'?14:15;
   if(armored){
    const helmetY=top-2;
    r(ink,-h-4,helmetY,h*2+8,b?25:18);r(coat,-h-3,helmetY+1,h*2+6,b?23:16);
    r(light,-h-1,helmetY+2,h-1,b?6:4);r(brass,-h-3,helmetY+7,h*2+6,2);
    r(ink,-hw,hy+16,hw*2,3);
    if(b){r(ink,-17,hy,34,8);r(coat,-15,hy+1,30,6);r(ink,-20,hy+7,40,10);r(coat,-18,hy+8,36,8);r(brass,-17,hy+14,34,2);r(bone,-1,hy+2,3,3)}
    r(ink,-h,ey-1,h*2,5);r(p.eye,-h+3,ey,b?5:3,1);r(p.eye,3,ey,b?5:3,1);
   }else{
    // Each crown has its own width, rake and broken brim; all one-pixel edges.
    const narrow=id==='runner'||id==='gunslinger',crown=narrow?h+1:h+4;
    r(ink,-crown+2,hy,crown*2-4,4);r(ink,-crown,hy+3,crown*2,b?13:9);
    r(id==='bandit'?'#73503a':shade,-crown+1,hy+4,crown*2-2,b?11:7);
    r(id==='bandit'?'#a77a4c':id==='boss'?'#30323e':coat,-crown+3,hy+2,crown-2,b?5:3);
    r(brass,-crown+1,hy+(b?13:9),crown*2-2,2);
    r(ink,-hw,hy+(b?15:11),hw*2,4);r(id==='boss'?'#30323e':coat,-hw+1,hy+(b?16:12),hw*2-2,2);
    r(ink,hw-4,hy+(b?12:8),5,4);r(light,-hw+3,hy+(b?16:12),b?10:5,1);
    if(ghost){r(ink,-crown+3,hy+1,3,4);r(shade,hw-4,hy+(b?17:13),3,3)}
    if(id==='boss'){r(brass,8,hy+7,6,7);r(bone,10,hy+8,2,2)}
    if(id==='storm_widow'){r('#85629a',-h-3,hy+13,h*2+6,2);r(p.eye,10,hy+7,2,6)}
   }
   if(!armored&&!ghost){const sy=top+(b?20:13);r(ink,-h-1,sy,h*2+2,4);r(p.scarf,-h,sy+1,h*2,2);r(shade,-3,sy+3,6,3)}
  }else if(part==='gear'){
   if(id==='gunslinger'||id==='boss'){
    r(ink,-3,-5,b?32:23,8);r(steel,2,-4,b?26:18,2);r('#435259',2,-2,b?26:18,4);
    r(ink,b?27:19,-4,3,6);r(brass,0,1,7,2);r(leather,0,3,5,7);
    r('#ad8656',1,3,2,5);r(brass,5,-3,4,4);r(p.skin[0],-3,2,6,4);
   }else if(id==='iron_colonel'){
    r(ink,-5,-13,39,23);r('#424b4d',-4,-12,36,21);r(steel,-2,-11,32,4);
    r('#626659',1,-6,32,12);r(brass,6,-8,4,16);r(brass,23,-8,3,16);
    r(ink,31,-10,8,17);r('#a7a68b',32,-9,5,3);r('#252d34',34,-5,4,9);
    r('#e2934b',-3,-4,5,7);r(leather,0,7,9,6);r(brass,1,8,6,2);
   }else if(ghost){
    const gx=b?32:18,gy=b?-50:-36,bw=b?18:10;
    r(ink,gx-1,gy,b?5:4,b?73:49);r('#826041',gx,gy+1,b?3:2,b?70:47);
    r(ink,gx-bw/2-1,gy-10,bw+3,14);r('#9c9c81',gx-bw/2,gy-9,bw+1,10);
    r(bone,gx-bw/2+1,gy-8,bw-3,2);r('#73573f',gx+1,gy-4,3,5);
    r(ink,b?25:10,b?-9:-4,b?10:10,6);r(p.skin[0],b?26:11,b?-8:-3,9,4);
    r(p.skin[0],gx-3,b?-8:-3,7,5);
   }else if(id==='storm_widow'){
    r(ink,29,-57,5,81);r('#7c5d48',30,-56,3,78);
    r(ink,24,-63,15,12);r(brass,25,-62,13,10);r('#3b6974',27,-61,9,8);
    r(p.eye,29,-60,5,6);r('#edfff3',30,-60,2,3);r(brass,26,-43,11,3);
    r(ink,17,-15,15,9);r(coat,18,-14,11,6);r(brass,25,-13,3,5);
    r(p.skin[0],27,-12,9,5);r(brass,30,10,3,5);
   }else if(id==='runner'){
    r(ink,-17,-22,12,4);r(p.scarf,-16,-21,10,2);r('#ffb377',-19,-23,6,2);
   }
  }else if(part==='rage'){
   const ey=top+9;
   r(id==='boss'?'#ff947b':id==='iron_colonel'?'#fff1ac':p.eye,-h+4,ey,4,2);
   r(id==='boss'?'#ff947b':id==='iron_colonel'?'#fff1ac':p.eye,3,ey,4,2);
   if(id==='boss'){r('#d35b51',-19,-24,2,18);r('#a52737',12,-22,2,10);r('#ffe3a0',9,-18,4,3)}
   if(id==='iron_colonel'){
    for(const [x,y] of [[-17,-17],[-15,-13],[-13,-9],[13,-23],[15,-19]]){r(ink,x,y,4,3);r('#f6a34d',x+1,y,2,2)}
    r('#ffcf77',-3,-13,7,10);r('#fff2bd',-1,-11,3,6);
   }
   if(id==='storm_widow'){for(let i=0;i<5;i++){r(p.eye,-11+i*3,-20+i*5,4,1);r(p.eye,-8+i*3,-20+i*5,1,4)}}
   if(id==='grave_keeper'){r(bone,-9,-24,3,7);r(bone,-3,-21,3,9);r(p.eye,-16,-12,2,8);r(p.eye,14,2,2,7)}
  }
 }
 for(const id of Object.keys(profiles))for(const part of ['back','boot','body','head','gear','rage']){
  if(part!=='rage'||profiles[id].boss)bake(id,part);
 }
 function reset(){records=new WeakMap();deaths=[]}
 function record(e){let s=records.get(e);if(!s){s={x:e.x,y:e.y,moving:false,shot:-10,cue:-10,rage:false,rageAt:-10,direction:0,walkTime:0,clock:0,lastTime:null,attackAt:-Infinity};records.set(e,s)}return s}
 function track(e,t){const s=record(e);s.x=e.x;s.y=e.y;s.lastTime=t}
 const atlas=typeof EnemyAtlas==='undefined'?{}:EnemyAtlas,images=new Map();
 const directions=['down','down_left','left','up_left','up','up_right','right','down_right'];
 const base=typeof Image==='function'?new URL('../',document.currentScript?.src||document.baseURI):null;
 for(const [id,data] of Object.entries(atlas)){
  const item={state:'loading',image:null};images.set(id,item);
  if(!base){item.state='unavailable';continue}
  const image=item.image=new Image();image.onload=()=>{item.state=image.naturalWidth===data.size[0]&&image.naturalHeight===data.size[1]?'ready':'error'};
  image.onerror=()=>{item.state='error'};image.src=new URL(data.file+'?v='+data.sha256,base).href;
 }
 function direction(dx,dy){return (Math.round(Math.atan2(-dx,dy)/(Math.PI/4))+8)%8}
 function attack(e,t,dx,dy){const s=record(e);if(s.eventAt!==t){s.attackAt=s.clock;s.eventAt=t}if(dx||dy)s.attackDirection=direction(dx,dy)}
 function fired(e,t,dx,dy){const s=record(e);s.shot=t;s.angle=Math.atan2(dy,dx);attack(e,t,dx,dy)}
 function cue(e,t,kind,dx,dy){const s=record(e);s.cue=t;s.kind=kind;attack(e,t,dx??Math.cos(s.aim||0),dy??Math.sin(s.aim||0))}
 function defeat(e,t){deaths.push({x:e.x,y:e.y,t,id:key(e)});if(deaths.length>64)deaths.shift()}
 function tick(game){
  for(const e of game.enemies){
   const s=record(e),dx=e.x-s.x,dy=e.y-s.y,wasMoving=s.moving;
   const dt=s.lastTime===null?0:Math.max(0,game.time-s.lastTime);s.lastTime=game.time;
   const frozen=(e.elementState?.ice?.frozenUntil||0)>game.time;
   if(!frozen)s.clock+=dt;
   if(s.eventAt===game.time)s.attackAt=s.clock;
   s.moving=!frozen&&Math.hypot(dx,dy)>.01;
   if(s.moving){s.direction=direction(dx,dy);s.walkTime=wasMoving?s.walkTime+dt:0}else s.walkTime=0;
   const data=atlas[key(e)];if(data&&s.clock-s.attackAt<data.attack.columns.length/data.attack.fps)s.walkTime=0;
   s.x=e.x;s.y=e.y;
   s.face=game.player.x<e.x?-1:1;s.aim=Math.atan2(game.player.y-e.y,game.player.x-e.x);
   s.preparing=(e.type==='gunslinger'||key(e)==='boss')&&e.cd>0&&e.cd<.4&&Math.hypot(game.player.x-e.x,game.player.y-e.y)<500;
   for(const h of game.bossHazards||[])if(h.owner===e&&!h.done){
    if(!s.preparing||h.kind==='cannon'||h.kind==='storm_fan'||h.kind==='charge'){
     s.aim=Math.atan2(h.y-e.y,h.x-e.x);s.kind=h.kind;
    }s.preparing=true;
   }
   const rage=!!e.boss&&e.hp<e.maxHp*.5;if(rage&&!s.rage)s.rageAt=game.time;s.rage=rage;
  }
  deaths=deaths.filter(d=>game.time-d.t<.45);
 }
 function pose(e,t){
  const p=profiles[key(e)],s=records.get(e),frozen=(e.elementState?.ice?.frozenUntil||0)>t;
  const attack=!frozen&&((s&&t-s.shot<.2)||(s&&t-s.cue<.25)||(e.dashUntil||0)>t||e.visualState==='attack');
  const moving=!frozen&&(e.visualState==='walk'||!!s?.moving),phase=(e.anim||0)*p.pace;
  const hurt=e.hit>0||e.visualState==='hurt',rage=!!e.boss&&e.hp<e.maxHp*.5;
  return {state:hurt?'hurt':attack?'attack':s?.preparing?'aim':moving?'walk':'idle',
   step:moving?Math.round(Math.sin(phase)*(key(e)==='runner'?3:2)):0,
   bob:frozen?0:moving?-Math.round(Math.abs(Math.cos(phase))*(p.boss||key(e)==='brute'?2:1)):Math.round(Math.sin(t*2+p.w)*.55),
   lean:hurt?-2:attack?(key(e)==='grave_keeper'?3:-2):key(e)==='runner'?2:0,
   face:e.facing||s?.face||1,angle:attack?s?.angle??s?.aim??0:s?.aim??0,rage,
   flash:rage&&s&&t-s.rageAt>=0&&t-s.rageAt<.32,gear:frozen?0:attack?-3:Math.round(Math.sin(moving?phase:t*2)*.7)};
 }
 function draw(g,e,x,y,t=0){
  if(drawPNG(g,e,x,y,t))return true;
  const id=key(e),p=profiles[id],a=pose(e,t);x=Math.round(x);y=Math.round(y);
  g.save();g.imageSmoothingEnabled=false;g.translate(x,y);
  g.fillStyle='#10172299';g.fillRect(-p.w-4,p.sole-2,p.w*2+8,3);g.scale(a.face,1);
  const layer=(part,dx=0,dy=0,flip=false)=>{
   const c=cache.get(id+':'+part);if(!c?.w||!c.h)return;
   g.save();g.translate(Math.round(dx),Math.round(dy));if(flip)g.scale(-1,1);
   g.drawImage(c.image,c.x,c.y,c.w,c.h,c.x-64,c.y-88,c.w,c.h);g.restore();
  };
  layer('back',a.lean,a.bob);
  layer('boot',0,Math.min(0,a.step));layer('boot',1,Math.min(0,-a.step),true);
  layer('body',a.lean,a.bob+(a.state==='hurt'?1:0));layer('head',a.lean,a.bob+(a.state==='hurt'?2:0));
  if(!['gunslinger','boss','iron_colonel'].includes(id))layer('gear',a.lean,a.bob+a.gear);
  if(a.rage)layer('rage',a.lean,a.bob);
  if(a.state==='hurt'){
   g.fillStyle=p.eye;g.fillRect(-p.w-7,-17,3,1);g.fillRect(-p.w-5,-22,1,3);
   if(id==='armored'||id==='iron_colonel'){g.fillStyle=bone;g.fillRect(p.w+3,-6,2,2);g.fillRect(p.w+6,-9,1,2)}
  }
  if(a.rage){
   g.fillStyle=p.eye;const off=Math.floor(t*8)%3;
   g.fillRect(-p.w-3,-25-off*3,2,2);g.fillRect(p.w+2,4-off*5,2,2);
   if(id==='boss'){g.fillStyle=Math.floor(t*9)%2?bone:p.eye;g.fillRect(9+a.lean,-18+a.bob,3,3)}
   if(a.flash){
    g.fillStyle=bone;g.fillRect(-p.w-7,-35,6,2);g.fillRect(p.w+1,-35,6,2);
    g.fillRect(-p.w-7,-32,2,5);g.fillRect(p.w+5,-32,2,5);
    g.fillStyle=p.eye;for(let i=0;i<4;i++)g.fillRect(-p.w-8+i*Math.floor(p.w*2/3),-40-(Math.floor(t*18)+i)%3*3,2,2);
   }
  }
  g.restore();
  if(['gunslinger','boss','iron_colonel'].includes(id)){
   const local=Math.atan2(Math.sin(a.angle),Math.cos(a.angle)*a.face),kick=a.state==='attack'?(id==='iron_colonel'?5:3):0;
   const mx=x+a.face*(a.lean+(p.boss?14:7)),my=y+(p.boss?-12:-8)+a.bob;
   g.save();CactusHero.rasterWeapon(g,mx,my,a.face,local,{turn:0,kick,lift:0},ctx=>blit(ctx,id,'gear'));g.restore();
   if(a.state==='attack'){
    const len=id==='iron_colonel'?38:p.boss?29:22;
    g.save();g.fillStyle='#ffe3a0';g.fillRect(Math.round(mx+Math.cos(a.angle)*(len-kick))-2,Math.round(my+Math.sin(a.angle)*(len-kick))-2,4,4);g.restore();
   }
  }
  if(e.hp<e.maxHp||p.boss){
   const bw=p.boss?84:Math.max(22,p.w*2),hy=y+p.hat-8;
   g.save();g.fillStyle='#171b23';g.fillRect(x-Math.floor(bw/2),hy,bw,4);
   g.fillStyle=p.boss?'#d77f67':'#a4c37a';g.fillRect(x-Math.floor(bw/2)+1,hy+1,Math.max(0,Math.round((bw-2)*Math.max(0,e.hp/e.maxHp))),2);g.restore();
  }
  return true;
 }
 function effects(g,game,sx,sy){
  g.save();g.imageSmoothingEnabled=false;
  for(const d of deaths){const u=(game.time-d.t)/.45;if(u<0||u>1)continue;const p=profiles[d.id];
   g.globalAlpha=1-u;
   for(let i=0;i<7;i++){
    const dx=(i-3)*u*(p.boss?13:7),dy=-Math.sin(u*Math.PI)*(8+i%3*3)+u*9;
    g.fillStyle=i%3===0?p.coat[1]:i%3===1?leather:bone;
    g.fillRect(Math.round(sx(d.x)+dx),Math.round(sy(d.y)+dy),i%2?3:2,2);
   }
  }g.restore();
 }
 function spritePose(e,t){
  const data=atlas[key(e)];if(!data)return null;
  const s=records.get(e),clock=s?.clock||0,age=clock-(s?.attackAt??-Infinity),attacking=age>=0&&age<data.attack.columns.length/data.attack.fps;
  const state=attacking?'attack':'walk',a=data[state],moving=!!s?.moving;
  const frame=attacking?Math.min(a.columns.length-1,Math.floor(age*a.fps)):moving?Math.floor(s.walkTime*a.fps)%a.columns.length:0;
  const dir=attacking?s.attackDirection??s.direction:s?.preparing?direction(Math.cos(s.aim),Math.sin(s.aim)):s?.direction||0;
  const row=data.directions.indexOf(directions[dir]);
  return {state:attacking?'attack':moving?'walk':'idle',sheet:state,direction:dir,row,column:a.columns[frame],frame:row*data.columns+a.columns[frame]};
 }
 function drawPNG(g,e,x,y,t){
  const id=key(e),data=atlas[id],item=images.get(id);if(!data||!item)return false;
  // A loading asset has no procedural stand-in. Failures use the cached fallback.
  if(item.state==='loading')return true;if(item.state!=='ready')return false;
  const a=spritePose(e,t),f=data.frames[a.frame],p=profiles[id],s=records.get(e);x=Math.round(x);y=Math.round(y);
  g.save();g.imageSmoothingEnabled=false;
  g.fillStyle='#10172299';g.fillRect(x-p.w-4,y+p.sole-2,p.w*2+8,3);
  if(e.hit>0)g.globalAlpha=.7;
  const [cx,cy,cw,ch]=f.crop;
  g.drawImage(item.image,f.x+cx,f.y+cy,cw,ch,x-data.pivot[0]+cx,y+p.sole-data.pivot[1]+cy,cw,ch);g.globalAlpha=1;
  if(e.boss&&e.hp<e.maxHp*.5){g.fillStyle=p.eye;for(let i=0;i<4;i++)g.fillRect(x-p.w+i*Math.round(p.w*2/3),y+p.sole-5-(Math.floor(t*8)+i)%3*3,2,2);
   if(s&&t-s.rageAt<.32){g.fillStyle=bone;g.fillRect(x-p.w-8,y-data.worldHeight/2,6,2);g.fillRect(x+p.w+2,y-data.worldHeight/2,6,2)}}
  if(e.hp<e.maxHp||e.boss){const bw=e.boss?84:Math.max(22,p.w*2),hy=y+p.sole-data.worldHeight-8;g.fillStyle='#171b23';g.fillRect(x-Math.floor(bw/2),hy,bw,4);g.fillStyle=e.boss?'#d77f67':'#a4c37a';g.fillRect(x-Math.floor(bw/2)+1,hy+1,Math.max(0,Math.round((bw-2)*Math.max(0,e.hp/e.maxHp))),2)}
  g.restore();return true;
 }
 function status(){return Object.fromEntries([...images].map(([id,item])=>[id,{state:item.state,url:item.image?.src,asset:atlas[id].asset}]))}
 return {profiles,draw,pose,tick,reset,fired,cue,defeat,effects,spritePose,status,direction,track};
})();
