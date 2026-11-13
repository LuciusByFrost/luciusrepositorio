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
  count+=e.extraProjectiles||0;
  const base=Math.atan2(target.y-e.y,target.x-e.x);
  for(let i=0;i<count;i++){
   if(game.hostile.length>=limits.hostile)break;
   const a=base+(count===1?0:(i/(count-1)-.5)*spread);
   api.shoot(e,Math.cos(a),Math.sin(a),speed,damage);
   const shot=game.hostile[game.hostile.length-1];if(shot)shot.color=color;
  }
 }
 function tickHazards(game,api){
  if(game.completed||!game.bossHazards?.length)return;
  for(const h of game.bossHazards){
   if(game.completed)return;
   if(h.done||h.owner.hp<=0||!game.enemies.includes(h.owner)||game.time-h.start<h.delay)continue;
   h.done=true;h.firedAt=game.time;
   const e=h.owner,enraged=e.hp<e.maxHp*.5;EnemySprites.cue(e,game.time,h.kind);
   if(h.kind==='cannon'||h.kind==='storm_fan'){
    fan(game,e,h,api,enraged?5:3,h.kind==='cannon'?.48:.95,h.kind==='cannon'?245:205,h.kind==='cannon'?'#efb16a':'#a8e7ee',h.kind==='cannon'?13:11);
    EnemySprites.fired(e,game.time,h.x-e.x,h.y-e.y);
   }
   else if(h.kind==='charge'){
    const dx=h.x-e.x,dy=h.y-e.y,n=Math.hypot(dx,dy)||1;
    e.dashX=dx/n;e.dashY=dy/n;e.dashUntil=game.time+.85;
   }else if(h.kind==='grave'){
    const minion=api.spawn(enraged?'armored':'gravedigger');
    if(minion){minion.x=h.x;minion.y=h.y}
   }else if(Math.hypot(game.player.x-h.x,game.player.y-h.y)<h.r+game.player.r)api.hurt((h.kind==='mortar'?14:12)*(e.levelDamageMultiplier||1));
  }
  game.bossHazards=game.bossHazards.filter(h=>h.owner.hp>0&&game.enemies.includes(h.owner)&&(!h.done||game.time-h.firedAt<.3));
 }
 function cancel(game,e){if(game.bossHazards)game.bossHazards=game.bossHazards.filter(h=>h.owner!==e)}
 function pixel(g,c,x,y,w=2,h=w){g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)))}
 function line(g,x1,y1,x2,y2,c,width=2){const n=Math.max(1,Math.ceil(Math.max(Math.abs(x2-x1),Math.abs(y2-y1))/3));
  for(let i=0;i<=n;i++)pixel(g,c,x1+(x2-x1)*i/n,y1+(y2-y1)*i/n,width);
 }
 // Derived from fan() and the existing charge speed/duration, not new combat
 // data. Target remains fixed, origin follows the owner exactly as at firing.
 function warningGeometry(h){
  const e=h.owner,angle=Math.atan2(h.y-e.y,h.x-e.x);
  if(h.kind==='charge')return {angle,length:185*.85,half:e.r+2};
  if(h.kind==='cannon'||h.kind==='storm_fan'){
   const count=(e.hp<e.maxHp*.5?5:3)+(e.extraProjectiles||0),spread=h.kind==='cannon'?.48:.95;
   return {length:(h.kind==='cannon'?245:205)*4,half:5,
    rays:Array.from({length:count},(_,i)=>angle+(i/(count-1)-.5)*spread)};
  }
  return {radius:h.r};
 }
 function warnings(g,game,sx,sy){
  if(!game.bossHazards?.length)return;g.save();g.imageSmoothingEnabled=false;
  for(const h of game.bossHazards){
   if(h.owner.hp<=0)continue;const age=game.time-h.start,u=Math.min(1,age/h.delay),x=sx(h.x),y=sy(h.y),lightning=h.kind==='lightning'||h.kind==='storm_fan';
   const color=lightning?'#86d8e9':h.kind==='grave'?'#b29ad0':h.kind==='charge'?'#df7d81':'#df9b60';
   if(h.kind==='cannon'||h.kind==='charge'||h.kind==='storm_fan'){
    if(h.done)continue;const x1=sx(h.owner.x),y1=sy(h.owner.y),geo=warningGeometry(h);
    g.globalAlpha=.45+u*.35;
    for(const a of geo.rays||[geo.angle]){
     const dx=Math.cos(a),dy=Math.sin(a),xx=x1+dx*geo.length,yy=y1+dy*geo.length;
     line(g,x1-dy*geo.half,y1+dx*geo.half,xx-dy*geo.half,yy+dx*geo.half,color,1);
     line(g,x1+dy*geo.half,y1-dx*geo.half,xx+dy*geo.half,yy-dx*geo.half,color,1);
     if(h.kind==='charge'){
      // End cap encloses the moving boss's collision circle, not the stale target.
      for(let i=0;i<16;i++){const v=a-Math.PI/2+i*Math.PI/15;pixel(g,color,xx+Math.cos(v)*geo.half,yy+Math.sin(v)*geo.half,2)}
     }
     const marker=Math.min(geo.length,70+u*55),mx=x1+dx*marker,my=y1+dy*marker;
     line(g,mx-dx*8-dy*5,my-dy*8+dx*5,mx,my,'#f7dca1',2);
     line(g,mx-dx*8+dy*5,my-dy*8-dx*5,mx,my,'#f7dca1',2);
    }
   }else{
    g.globalAlpha=h.done?Math.max(0,1-(game.time-h.firedAt)/.3):.5+u*.5;
    for(let i=0;i<32;i++){const a=i*TAU/32;pixel(g,color,x+Math.cos(a)*h.r,y+Math.sin(a)*h.r,3)}
    if(!h.done){
     if(h.kind==='grave'){
      pixel(g,color,x-5,y-10,10,16);pixel(g,'#211f2d',x-3,y-8,6,12);pixel(g,color,x-1,y-7,2,8);pixel(g,color,x-3,y-4,6,2);
     }else if(h.kind==='lightning'){
      line(g,x+4,y-10,x-3,y,'#b9eef0',2);line(g,x-3,y,x+4,y,'#b9eef0',2);line(g,x+4,y,x-2,y+10,'#b9eef0',2);
     }else{line(g,x-6,y,x+6,y,color,2);line(g,x,y-6,x,y+6,color,2)}
     for(let i=0;i<16;i++){const a=i*TAU/16;pixel(g,color,x+Math.cos(a)*h.r*(1-u),y+Math.sin(a)*h.r*(1-u),2)}
    }
    else if(lightning){line(g,x-7,y-70,x+5,y-30,'#e5fff6',4);line(g,x+5,y-30,x-4,y,'#e5fff6',4)}
    else for(let i=0;i<8;i++){const a=i*TAU/8,r=(game.time-h.firedAt)*100;pixel(g,color,x+Math.cos(a)*r,y+Math.sin(a)*r,4)}
   }
  }g.restore();
 }
 function draw(g,e,x,y,t=e.phase||0){return isNew(e.bossKind)?EnemySprites.draw(g,e,x,y,t):false}
 return {profiles,order,limits,isNew,name,nextType,stats,configure,update,tickHazards,cancel,warnings,warningGeometry,draw};
})();
