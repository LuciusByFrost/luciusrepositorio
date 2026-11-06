/* Weapon animation only. Uses simulation time and deterministic math, never
   Math.random, damage, collision changes or persistent per-frame allocations. */
const WeaponVisuals=(()=>{
 'use strict';
 const TAU=Math.PI*2,clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
 function pixel(g,c,x,y,w=2,h=w){g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),w,h)}
 function ring(g,x,y,r,c,phase=0,flat=1,count=32){
  for(let i=0;i<count;i++){const a=i*TAU/count+phase;pixel(g,c,x+Math.cos(a)*r,y+Math.sin(a)*r*flat,2)}
 }
 function emit(game,id,x,y,angle=0,radius=0,kind=''){
  if(!['revolver','shotgun','rain','solar','blast','hit'].includes(id))return;
  const fx=game.weaponFx||=[];fx.push({id,x,y,angle,radius,kind,start:game.time});
  if(fx.length>96)fx.splice(0,fx.length-96);
 }
 function pose(id,p,t){
  const pulse=Math.sin(clamp((p.attack||0)/.18)*Math.PI/2),elapsed=.72-(p.weaponPose||0);
  const power={revolver:2,shotgun:5,rain:3,dynamite:0,thorns:0,lasso:1,meteor:0,solar:4}[id]??2;
  return {kick:Math.round(power*pulse),turn:id==='dynamite'?-pulse*.45:id==='meteor'?Math.sin(t*5)*.08:-(id==='shotgun'?.12:.035)*pulse,
   lift:id==='meteor'?Math.round(Math.sin(t*5)):id==='dynamite'?-Math.round(pulse*4):0,
   pump:id==='shotgun'&&elapsed>.12&&elapsed<.42?-Math.round(Math.sin((elapsed-.12)/.3*Math.PI)*5):0,pulse};
 }
 function heldDetail(g,id,p,t){
  const a=pose(id,p,t),phase=t*14;
  if(id==='revolver'){
   pixel(g,'#adb598',1-a.pulse*2,-7-a.pulse,2,2);
   pixel(g,'#d6c08a',3+Math.round(a.pulse*3),-3,1,2);
  }else if(id==='shotgun'){
   pixel(g,'#241f23',6+a.pump,2,8,4);pixel(g,'#936840',7+a.pump,2,6,2);
   pixel(g,'#cfaa70',8+a.pump,2,1,2);pixel(g,'#cfaa70',11+a.pump,2,1,2);
  }else if(id==='dynamite'){
   for(let i=0;i<3;i++){const a=phase+i*TAU/3;pixel(g,i?'#f7ba60':'#fff2a1',16+Math.cos(a)*(2+i),-11+Math.sin(a)*3,2)}
  }else if(id==='thorns'){
   ring(g,8,0,8+a.pulse*3,'#a6d985',phase*.2,.65,12);
  }else if(id==='rain'){
   pixel(g,'#d8b165',7+Math.floor(t*20)%3*3,-8,2,2);
  }else if(id==='meteor'){
   for(let i=0;i<3;i++){const a=phase*.3+i*TAU/3;pixel(g,'#ffd975',8+Math.cos(a)*11,Math.sin(a)*7,2)}
  }else if(id==='solar'){
   const hot=(Math.sin(phase)+1)*.5;
   pixel(g,hot>.5?'#fff6bd':'#e9bb50',10,-3,13,2);
   for(let i=0;i<3;i++)pixel(g,'#ffe69b',4+i*4,-7-Math.round(a.pulse*3),2,1);
  }
 }
 function muzzle(g,id,p,t){
  const firing=p.muzzleFlash>0,age=.72-(p.weaponPose||0);
  if(firing&&['revolver','shotgun','rain'].includes(id)){
   const n=Math.floor(t*60)%2,wide=id==='shotgun'?14:id==='rain'?10:7;
   pixel(g,'#dd793d',24,-6,wide,7);pixel(g,'#ffd774',25,-5,wide-2,5);
   pixel(g,'#fff5cd',25,-3,wide-3,2);pixel(g,'#ffe28e',29+n*3,-8,3,2);
   if(id==='shotgun')pixel(g,'#f8bb5a',30,1,6,2);
  }
  if(['revolver','shotgun','rain'].includes(id)&&age>.07&&age<.28){
   g.save();g.globalAlpha=(.28-age)*2;
   for(let i=0;i<3;i++)pixel(g,'#b6ada0',25+i*4,-5-age*(16+i*9),3+i,2+i);
   g.restore();
  }
  if(id==='solar'&&p.attack>0){ring(g,27,-1,4+Math.sin(t*50)*2,'#fff0a4',t*7,1,12)}
 }
 function projectile(g,s,t,sx,sy){
  const id=s.visualWeapon||(s.bomb?'dynamite':'revolver'),age=Math.max(0,t-(s.visualBorn??t));
  const x=sx(s.x),y=sy(s.y),angle=Math.atan2(s.vy,s.vx);
  g.save();g.imageSmoothingEnabled=false;
  if(s.bomb){
   const progress=clamp(1-s.life/.85),lift=Math.sin(progress*Math.PI)*28;
   g.save();g.globalAlpha=.35;pixel(g,'#111922',x-5,y+3,10,3);g.restore();
   g.translate(x,y-Math.round(lift));g.rotate(progress*TAU*1.5);
   pixel(g,'#251f23',-6,-6,12,12);pixel(g,'#ad4336',-5,-5,4,10);pixel(g,'#d06543',0,-5,4,10);
   pixel(g,'#d7bd80',-5,-2,9,2);pixel(g,'#d7bd80',-5,3,9,1);
   pixel(g,'#9a784e',1,-8,2,3);pixel(g,'#fff0a0',2,-10,2,2);
   pixel(g,'#f7a448',4+Math.sin(t*30)*2,-10,2,2);
  }else{
   g.translate(x,y);g.rotate(angle);
   const solar=id==='solar',shotgun=id==='shotgun',trail=solar?42:shotgun?9:id==='rain'?20:15;
   g.save();g.globalAlpha=.3;
   pixel(g,solar?'#e88d3c':s.color,-trail,-(solar?4:1),trail,solar?8:2);g.restore();
   if(solar){
    pixel(g,'#a86135',-18,-5,32,10);pixel(g,'#ffd05a',-17,-3,32,6);pixel(g,'#fff4be',-13,-1,28,2);
    pixel(g,'#fff9db',12,-2,5,4);pixel(g,'#f8c553',-26,-6+Math.sin(age*40)*2,5,2);
   }else{
    pixel(g,'#42322c',-5,-2,11,4);pixel(g,s.color,-4,-1,10,2);pixel(g,'#fff2bf',2,-1,4,2);
    if(id==='rain')pixel(g,'#ffd56e',-12,Math.sin(t*22+age*7)*2,3,1);
   }
  }
  g.restore();
 }
 function meteor(g,h,sx,sy){
  const x=sx(h.x),y=sy(h.y),u=clamp(h.t/h.delay);
  g.save();
  if(!h.done){
   g.globalAlpha=.5+.3*u;ring(g,x,y,h.r,'#d68d4b',0,1,40);
   ring(g,x,y,h.r*(1-u*.65),'#f9ca67',h.t*2,1,24);
   pixel(g,'#eec380',x-5,y,12,2);pixel(g,'#eec380',x,y-5,2,12);
   const fall=clamp((u-.2)/.8),mx=x+(1-fall)*55,my=y-(1-fall)*210;
   g.globalAlpha=1;
   for(let i=4;i>0;i--)pixel(g,i%2?'#ad5035':'#e9893d',mx+i*7-5,my-i*18-5,10-i,14);
   pixel(g,'#582f2b',mx-8,my-8,16,16);pixel(g,'#efae47',mx-6,my-7,12,13);pixel(g,'#ffe49a',mx-4,my-5,6,7);
  }else{
   const age=h.t-h.delay;g.globalAlpha=clamp(1-age/.25);
   ring(g,x,y,h.r*clamp(age/.2),'#ffdc7b',0,1,40);
   for(let i=0;i<8;i++){const a=i*TAU/8,r=age*190;pixel(g,'#fcb64c',x+Math.cos(a)*r,y+Math.sin(a)*r,4)}
  }
  g.restore();
 }
 function orbits(g,game,sx,sy){
  const w=game.weapons.thorns;if(!w?.level)return;
  const r=w.range+(w.evolved?18:0);
  g.save();
  for(let i=0;i<w.qty;i++){
   const a=w.angle+i*TAU/w.qty,x=sx(game.player.x+Math.cos(a)*r),y=sy(game.player.y+Math.sin(a)*r);
   for(let j=1;j<=3;j++){g.globalAlpha=.35/j;pixel(g,'#97d478',sx(game.player.x+Math.cos(a-j*.1)*r)-2,sy(game.player.y+Math.sin(a-j*.1)*r)-2,4)}
   g.globalAlpha=1;g.save();g.translate(x,y);g.rotate(game.time*5+i);
   pixel(g,'#1b302d',-6,-6,12,12);pixel(g,'#5f9651',-4,-5,8,10);pixel(g,'#a8c776',-3,-4,3,6);
   for(let j=0;j<4;j++){g.save();g.rotate(j*TAU/4);pixel(g,'#dce4a4',-1,-10,2,5);g.restore()}
   g.restore();
  }
  g.restore();
 }
 function effects(g,game,sx,sy){
  g.save();
  for(const f of game.weaponFx||[]){
   const age=game.time-f.start;if(age<0||age>=.6)continue;
   const x=sx(f.x),y=sy(f.y);g.globalAlpha=clamp(1-age/.6);
   if(f.id==='hit'){
    if(age>.18)continue;
    g.globalAlpha=1-age/.18;
    const color=f.kind==='thorns'?'#c2e99b':f.kind==='solar'?'#fff3ad':'#fbd594';
    for(let i=0;i<5;i++){
     const a=f.angle+i*TAU/5,r=3+age*65;
     pixel(g,color,x+Math.cos(a)*r,y+Math.sin(a)*r,2);
    }
    pixel(g,'#fff0ca',x-1,y-1,3);
   }else if(f.id==='blast'){
    const r=f.radius*clamp(age/.24);
    ring(g,x,y,r,'#ffbe62',0,1,48);ring(g,x,y,r*.8,'#c96b3e',age,1,32);
    for(let i=0;i<10;i++){
     const a=i*TAU/10,spread=f.radius*.55*clamp(age/.2),size=Math.max(2,Math.round(14*(1-age/.6)));
     pixel(g,age<.12?'#ffe69a':age<.28?'#df7e3f':'#68504a',x+Math.cos(a)*spread-size/2,y+Math.sin(a)*spread*.8-age*18-size/2,size);
    }
   }else if(f.id==='rain'||f.id==='solar'){
    ring(g,x,y,8+age*(f.id==='rain'?100:60),f.id==='rain'?'#ddb768':'#ffdf7e',age,1,24);
   }else{
    // A spent casing follows a fixed arc; it cannot consume combat randomness.
    const side=Math.cos(f.angle)>=0?-1:1;
    const cx=x+side*age*52,cy=y-age*65+age*age*170;
    g.save();g.translate(Math.round(cx),Math.round(cy));g.rotate(age*17);
    pixel(g,f.id==='shotgun'?'#a64c3e':'#c69b51',-2,-1,5,3);pixel(g,'#e8c981',-2,-1,1,3);g.restore();
   }
  }
  g.restore();
 }
 return {emit,pose,heldDetail,muzzle,projectile,meteor,orbits,effects};
})();
