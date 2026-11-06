/* Extra encounters. Sheriff logic stays in main.js. Warning clocks use game
   time, attacks resolve once, and dead owners cancel pending attacks. */
const BossSystem=(()=>{
 'use strict';const TAU=Math.PI*2;
 const profiles={
  iron_colonel:{name:'Coronel Ferrugem',hp:980,speed:38,damage:26,r:34,color:'#916b4b'},
  storm_widow:{name:'Viúva da Tempestade',hp:850,speed:61,damage:23,r:29,color:'#657b9b'},
  grave_keeper:{name:'Coveiro do Breu',hp:1120,speed:43,damage:29,r:33,color:'#736178'}
 };
 const order=['boss','iron_colonel','storm_widow','grave_keeper'];
 const limits={hazards:24,hostile:220};
 function isNew(id){return Object.hasOwn(profiles,id)}
 function name(e){return isNew(e?.bossKind)?profiles[e.bossKind].name:'Xerife Corrupto'}
 function nextType(game){const round=game.bossRound||0;game.bossRound=round+1;return order[round%order.length]}
 function stats(id,time){const b=profiles[id];return [b.hp+time*3,b.speed,b.damage,b.r,b.color]}
 function configure(e,id){if(!isNew(id))return;e.bossKind=id;e.cd=1.3;e.summon=6;e.volley=0;e.phase=0}
 function queue(game,e,kind,x,y,r,delay){
  const list=game.bossHazards||=[];if(list.length>=limits.hazards)return;
  list.push({owner:e,kind,x,y,r,start:game.time,delay,done:false});
 }
 function move(e,dx,dy,dt,factor,speed=e.speed){const n=Math.hypot(dx,dy)||1;e.x+=dx/n*speed*dt*factor;e.y+=dy/n*speed*dt*factor}
 function update(game,e,dt,factor,api){
  const p=game.player,dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy)||1,enraged=e.hp<e.maxHp*.5;
  e.phase+=dt;if(factor===0)return;
  if((e.dashUntil||0)<=game.time)e.facing=dx<0?-1:1;
  if(e.bossKind==='iron_colonel'){
   if(d>250)move(e,dx,dy,dt,factor,(e.attackUntil||0)>game.time?e.speed*.25:e.speed);
   if(e.cd<=0){
    e.volley++;e.attackUntil=game.time+.7;
    queue(game,e,'cannon',p.x,p.y,0,.7);
    if(e.volley%2===0||enraged){for(const offset of [-60,60])queue(game,e,'mortar',p.x+offset,p.y+20,48,.95)}
    e.cd=enraged?2.1:2.9;
   }
  }else if(e.bossKind==='storm_widow'){
   const radial=Math.max(-1,Math.min(1,(d-235)/100)),direction=enraged?-1:1;
   move(e,dx/d*radial-dy/d*.85*direction,dy/d*radial+dx/d*.85*direction,dt,factor);
   if(e.cd<=0){
    const angle=e.phase*.7;
    for(let i=-1;i<=1;i++)queue(game,e,'lightning',p.x+Math.cos(angle)*i*78,p.y+Math.sin(angle)*i*78,34,.85+(i+1)*.1);
    if(enraged)queue(game,e,'storm_fan',p.x,p.y,0,.65);
    e.cd=enraged?2.2:3.1;
   }
  }else if(e.bossKind==='grave_keeper'){
   if((e.dashUntil||0)>game.time)move(e,e.dashX,e.dashY,dt,factor,185);
   else if((e.attackUntil||0)<=game.time)move(e,dx,dy,dt,factor);
   if(e.cd<=0&&(e.dashUntil||0)<=game.time){
    const length=Math.min(230,d+45);e.attackUntil=game.time+.85;
    queue(game,e,'charge',e.x+dx/d*length,e.y+dy/d*length,e.r,.85);
    e.cd=enraged?2.8:3.8;
   }
   e.summon-=dt;
   if(e.summon<=0){
    for(let i=0;i<(enraged?3:2);i++){const a=e.phase+i*TAU/3;queue(game,e,'grave',p.x+Math.cos(a)*85,p.y+Math.sin(a)*85,27,1.05)}
    e.summon=enraged?6:9;
   }
  }
 }
 function fan(game,e,target,api,count,spread,speed,color,damage){
  const base=Math.atan2(target.y-e.y,target.x-e.x);
  for(let i=0;i<count;i++){
   if(game.hostile.length>=limits.hostile)break;
   const a=base+(count===1?0:(i/(count-1)-.5)*spread);
   api.shoot(e,Math.cos(a),Math.sin(a),speed,damage);
   const shot=game.hostile[game.hostile.length-1];if(shot)shot.color=color;
  }
 }
 function tickHazards(game,api){
  if(!game.bossHazards?.length)return;
  for(const h of game.bossHazards){
   if(h.done||h.owner.hp<=0||!game.enemies.includes(h.owner)||game.time-h.start<h.delay)continue;
   h.done=true;h.firedAt=game.time;
   const e=h.owner,enraged=e.hp<e.maxHp*.5;
   if(h.kind==='cannon'||h.kind==='storm_fan')fan(game,e,h,api,enraged?5:3,h.kind==='cannon'?.48:.95,h.kind==='cannon'?245:205,h.kind==='cannon'?'#efb16a':'#a8e7ee',h.kind==='cannon'?13:11);
   else if(h.kind==='charge'){
    const dx=h.x-e.x,dy=h.y-e.y,n=Math.hypot(dx,dy)||1;
    e.dashX=dx/n;e.dashY=dy/n;e.dashUntil=game.time+.85;
   }else if(h.kind==='grave'){
    const minion=api.spawn(enraged?'armored':'gravedigger');
    if(minion){minion.x=h.x;minion.y=h.y}
   }else if(Math.hypot(game.player.x-h.x,game.player.y-h.y)<h.r+game.player.r)api.hurt(h.kind==='mortar'?14:12);
  }
  game.bossHazards=game.bossHazards.filter(h=>h.owner.hp>0&&game.enemies.includes(h.owner)&&(!h.done||game.time-h.firedAt<.3));
 }
 function cancel(game,e){if(game.bossHazards)game.bossHazards=game.bossHazards.filter(h=>h.owner!==e)}
 function pixel(g,c,x,y,w=2,h=w){g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),w,h)}
 function line(g,x1,y1,x2,y2,c,width=2){const n=Math.max(1,Math.ceil(Math.max(Math.abs(x2-x1),Math.abs(y2-y1))/3));
  for(let i=0;i<=n;i++)pixel(g,c,x1+(x2-x1)*i/n,y1+(y2-y1)*i/n,width);
 }
 function warnings(g,game,sx,sy){
  if(!game.bossHazards?.length)return;g.save();
  for(const h of game.bossHazards){
   if(h.owner.hp<=0)continue;const age=game.time-h.start,u=Math.min(1,age/h.delay),x=sx(h.x),y=sy(h.y),lightning=h.kind==='lightning'||h.kind==='storm_fan';
   const color=lightning?'#86d8e9':h.kind==='grave'?'#b29ad0':'#df9b60';
   if(h.kind==='cannon'||h.kind==='charge'||h.kind==='storm_fan'){
    if(h.done)continue;const x1=sx(h.owner.x),y1=sy(h.owner.y),dx=x-x1,dy=y-y1,n=Math.hypot(dx,dy)||1,half=h.kind==='charge'?h.r:7;
    g.globalAlpha=.55+u*.35;line(g,x1-dy/n*half,y1+dx/n*half,x-dy/n*half,y+dx/n*half,color);
    line(g,x1+dy/n*half,y1-dx/n*half,x+dy/n*half,y-dx/n*half,color);
    pixel(g,'#f7dca1',x-3,y-3,6,6);
   }else{
    g.globalAlpha=h.done?Math.max(0,1-(game.time-h.firedAt)/.3):.5+u*.5;
    for(let i=0;i<32;i++){const a=i*TAU/32;pixel(g,color,x+Math.cos(a)*h.r,y+Math.sin(a)*h.r,3)}
    if(!h.done){for(let i=0;i<16;i++){const a=i*TAU/16;pixel(g,color,x+Math.cos(a)*h.r*(1-u),y+Math.sin(a)*h.r*(1-u),2)}}
    else if(lightning){line(g,x-7,y-70,x+5,y-30,'#e5fff6',4);line(g,x+5,y-30,x-4,y,'#e5fff6',4)}
    else for(let i=0;i<8;i++){const a=i*TAU/8,r=(game.time-h.firedAt)*100;pixel(g,color,x+Math.cos(a)*r,y+Math.sin(a)*r,4)}
   }
  }g.restore();
 }
 function draw(g,e,x,y){
  if(!isNew(e.bossKind))return false;
  const kind=e.bossKind,t=e.phase||0,step=Math.round(Math.sin(e.anim)*1.5);
  g.save();g.imageSmoothingEnabled=false;g.translate(Math.round(x),Math.round(y));
  pixel(g,'#101722aa',-30,23,60,8);g.scale(2*(e.facing||1),2);
  if(e.hit>.05)g.globalAlpha=.7;
  const r=(c,x,y,w,h)=>pixel(g,c,x,y,w,h),ink='#151a23';
  r(ink,-12,8+step,9,9);r(ink,3,8-step,9,9);r('#735b46',-10,10+step,6,5);r('#735b46',5,10-step,6,5);
  if(kind==='iron_colonel'){
   r(ink,-15,-18,30,31);r('#584d42',-13,-17,26,28);r('#96816a',-11,-15,9,20);r('#70685c',0,-16,11,22);
   r('#c2ad82',-11,-13,22,2);r(ink,-17,-17,8,9);r('#a18e6b',-16,-16,7,5);r('#d6bd7b',-15,-15,4,1);
   r(ink,-9,-28,18,13);r('#92735a',-8,-27,16,11);r('#d1af76',-7,-26,12,5);
   r(ink,-13,-33,26,7);r('#6f5946',-10,-35,20,5);r('#bc9a61',-12,-29,24,2);
   r('#24282d',-6,-22,5,3);r('#24282d',3,-22,5,3);r('#f8c75d',-4,-22,2,2);r('#f8c75d',4,-22,2,2);
   r(ink,9,-8,20,10);r('#51565a',10,-7,18,7);r('#8d8e80',11,-7,17,2);r(ink,26,-6,4,6);
   r('#cbb577',-12,6,24,4);r('#efcd81',-2,5,5,6);
  }else if(kind==='storm_widow'){
   r(ink,-12,-25,24,34);r('#303d53',-10,-23,20,29);r('#627c8b',-9,-19,6,24);r('#405266',1,-20,8,27);
   for(let i=0;i<5;i++)r(i%2?'#627c8b':'#303d53',-11+i*5,6,3,6+(i%2)*3);
   r(ink,-9,-32,18,16);r('#697c8d',-7,-30,14,12);r('#a9c4c3',-5,-27,11,7);
   r('#242a3a',-7,-22,14,8);r('#90ebea',-4,-24,2,2);r('#90ebea',3,-24,2,2);
   r(ink,-18,-31,36,4);r('#414354',-12,-39,23,9);r('#7d6683',-11,-32,22,2);r('#bedbcb',9,-36,3,5);
   r('#565064',14,-22,3,36);r('#b8c4aa',11,-24,9,3);r('#87d3d9',11,-30,9,6);r('#d5f4df',14,-29,3,4);
   r('#9e84aa',-10,-7,18,3);
  }else{
   r(ink,-18,-27,17,38);r('#49362f',-17,-26,15,35);r('#805b3d',-15,-24,10,31);r('#bd935d',-15,-22,10,2);r('#bd935d',-10,-24,2,29);
   r(ink,-10,-19,24,32);r('#403647',-8,-18,20,29);r('#68546a',-6,-16,6,25);r('#88797c',4,-15,5,21);
   r(ink,-7,-30,18,13);r('#afaa8b',-6,-28,16,11);r('#36313d',-4,-24,5,3);r('#36313d',5,-24,4,3);
   r('#c5a8e5',-3,-24,2,2);r('#c5a8e5',6,-24,2,2);r('#39303d',0,-18,7,2);
   r(ink,-13,-32,30,5);r('#3b303c',-8,-39,20,8);r('#84717b',-6,-37,14,2);r('#b99562',-8,-32,20,2);
   const lean=Math.round(Math.sin(t*2));r('#765840',15,-25,3,39);r('#b2b6a3',11+lean,-31,11,10);r('#e1d6ac',12+lean,-30,7,2);
  }
  g.restore();
  const width=78;pixel(g,'#181b23',x-width/2,y-84,width,5);pixel(g,'#d47d63',x-width/2+1,y-83,Math.max(1,(width-2)*Math.max(0,e.hp/e.maxHp)),3);
  return true;
 }
 return {profiles,order,limits,isNew,name,nextType,stats,configure,update,tickHazards,cancel,warnings,draw};
})();
