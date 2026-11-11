/* Directional bitmaps share the local atlas loader. All state is visual and
   outside gameplay entities; drawing is deterministic and never emits attacks. */
const WeaponSprites=(()=>{
 'use strict';
 const meta=typeof WeaponAtlas==='undefined'?null:WeaponAtlas;
 const loader=createAtlasHeroSprite(meta,'weapons','',null,null);
 // One source reference for all eight views of a weapon. Source resolution
 // cancels out; only worldSize determines the physical size in the game.
 const referenceSpans=Object.fromEntries(Object.entries(meta?.weapons||{}).map(([id,data])=>[id,Math.max(...data.frames.map(f=>Math.max(f.w,f.h)))]));
 const sectors=new WeakMap(),step=Math.PI/4,TAU=Math.PI*2;
 const ready=()=>loader.isReady();
 const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
 function direction(angle,previous){
  if(!Number.isFinite(angle))angle=0;
  // Six degrees of hysteresis around each 22.5-degree boundary.
  if(Number.isInteger(previous)&&Math.abs(wrap(angle-previous*step))<=step/2+Math.PI/30)return previous;
  return (Math.round(angle/step)%8+8)%8;
 }
 function aim(p,id,angle,t){
  let cache=sectors.get(p);if(!cache){cache={};sectors.set(p,cache)}
  const old=cache[id];
  const dir=direction(angle,old&&t>=old.t?old.dir:undefined);
  if(old){old.dir=dir;old.t=t}else cache[id]={dir,t};return dir;
 }
 function draw(ctx,id,x,y,angle=0,options={}){
  if(!ready()||!meta.weapons[id])return false;
  const dir=options.direction??direction(angle),data=meta.weapons[id],f=data.frames[dir];
  const g=geometry(id,dir),{scale,w,h,pivotX,pivotY}=g;
  const left=Math.round(x)-pivotX,top=Math.round(y)-pivotY;
  ctx.save();ctx.imageSmoothingEnabled=false;
  ctx.drawImage(loader.image('weapons_8directions'),f.x,f.y,f.w,f.h,left,top,w,h);
  ctx.restore();return {direction:dir,frame:f,scale,w,h,muzzle:f.muzzle?{x:left+Math.round(f.muzzle[0]*w/f.w),y:top+Math.round(f.muzzle[1]*h/f.h)}:null};
 }
 function geometry(id,dir){
  const data=meta.weapons[id],f=data.frames[dir],scale=data.worldSize/referenceSpans[id];
  const w=Math.max(1,Math.round(f.w*scale)),h=Math.max(1,Math.round(f.h*scale));
  return {scale,w,h,pivotX:Math.round(f.pivot[0]*w/f.w),pivotY:Math.round(f.pivot[1]*h/f.h)};
 }
 function heldState(p,t){
  let id=p.heldWeapon||p.startWeapon||'revolver',angle=p.weaponAngle??(p.facing<0?Math.PI:0);
  if(p.characterId==='nopal'&&t-(p.nopalShotAt??-Infinity)>=0&&t-p.nopalShotAt<.32){id='revolver';angle=p.nopalShotAngle??angle}
  else if(id==='shotgun'&&p.characterId==='rosa'&&t-(p.rosaShotAt??-Infinity)>=0&&t-p.rosaShotAt<.32)angle=p.rosaShotAngle??angle;
  const dir=aim(p,id,angle,t);
  return {id,angle,direction:dir,behind:dir>=5&&dir<=7};
 }
 function held(ctx,p,x,y,t){
  if(!ready())return false;
  const a=heldState(p,t);
  // These three abilities live in the world: no second handheld bomb/cactus/meteor.
  if(['dynamite','thorns','meteor'].includes(a.id))return true;
  const pose=WeaponVisuals.pose(a.id,p,t),native=nativeHand(p,t);
  // Full flattened poses already hold their authored starter weapon. Preserve
  // the attached fingers/limbs instead of trying to erase them by color.
  if(native?.embeddedWeapon===a.id)return true;
  const offHand=!!native?.embeddedWeapon;
  const m=offHand?{x:-native.x,y:native.y}:native||CactusHero.mount(p,t,a.angle);
  const dx=Math.cos(a.direction*step),dy=Math.sin(a.direction*step);
  const kick=pose.kick+(a.id==='shotgun'?Math.abs(pose.pump)*.25:0);
  const cast=a.id==='lasso'?pose.pulse*4:0;
  const hx=x+m.x+dx*(cast-kick),hy=y+m.y+dy*(cast-kick);
  // PNG heroes keep their authored limbs; only the procedural fallback needs a
  // replacement reach. The rear pass is already before the body in drawPlayer.
  if(!native)CactusHero.drawReach(ctx,p,x,y,t,a.angle,pose,{nopal:'#687a45',rosa:'#9e764d',bento:'#9b7048',iris:'#70513c'}[p.characterId]);
  ctx.save();ctx.imageSmoothingEnabled=false;
  if(p.invuln>0&&Math.floor(p.invuln*14)%2)ctx.globalAlpha=.55;
  const r=draw(ctx,a.id,hx,hy,a.angle,{direction:a.direction});
  const f=r.frame;
  if(f.muzzle){
   const mx=r.muzzle.x,my=r.muzzle.y;
   // One flash at the measured muzzle; legacy muzzle/arm layers are suppressed.
   if(p.muzzleFlash>0&&['revolver','shotgun','rain'].includes(a.id)){
    ctx.fillStyle='#ffc76d';ctx.fillRect(mx-3,my-3,6,6);ctx.fillStyle='#fff0ca';ctx.fillRect(mx-1,my-1,3,3);
   }
   if(a.id==='solar'&&p.attack>0){ctx.strokeStyle='#ffeab1';ctx.beginPath();ctx.arc(mx,my,3+pose.pulse*3,0,TAU);ctx.stroke()}
  }
  if(a.id==='lasso'&&p.attack>0){
   ctx.fillStyle='#b8f8ed';for(let i=0;i<3;i++){const phase=t*24+i*2;ctx.fillRect(Math.round(hx+dx*12+Math.sin(phase)*5),Math.round(hy+dy*12+Math.cos(phase)*4),2,2)}
  }
  ctx.restore();return true;
 }
 function nativeHand(p,t){
  if(!ready()||!meta.characters)return null;
  const id=p.characterId,chars=meta.characters;
  if(id==='nopal'&&typeof NopalSprite!=='undefined'&&NopalSprite.active(p)){
   const pose=NopalSprite.pose(p,t);
   if(pose.sheet==='walk')return {...walkingHand(NopalWalkAtlas,chars.nopal.frames[pose.frame].hand,pose.frame),embeddedWeapon:chars.nopal.embeddedWeapon};
   const f=NopalAtlas.frames[pose.frame],h=chars.nopal.actions[pose.frame].hand;
   return {x:(h[0]-NopalAtlas.pivot[0])*pose.face,y:h[1]-NopalAtlas.pivot[1]+NopalAtlas.worldFeetY};
  }
  if(id==='rosa'&&typeof RosaSprite!=='undefined'&&RosaSprite.active(p)){
   const pose=RosaSprite.pose(p,t),h=chars.rosa.actions[pose.frame].hand;
   return {x:(h[0]-RosaAtlas.pivot[0])*pose.face,y:h[1]-RosaAtlas.pivot[1]+RosaAtlas.worldFeetY};
  }
  if(id==='iris'&&typeof IrisSprite!=='undefined'&&IrisSprite.active(p)){
   const pose=IrisSprite.pose(p,t);return {...walkingHand(IrisAtlas,chars.iris.frames[pose.frame].hand,pose.frame),embeddedWeapon:chars.iris.embeddedWeapon};
  }
  return null;
 }
 function walkingHand(data,hand,index){
  const f=data.frames[index],s=data.scale;
  return {x:Math.round(hand[0]*s)-Math.round((f.anchor[0]-f.x)*s),y:data.worldFeetY-Math.round(f.h*s)+Math.round(hand[1]*s)};
 }
 return {ready,status:loader.status,direction,geometry,heldState,held,draw,nativeHand,armLayer:id=>loader.image(id+'_hands'),body:id=>loader.image(id==='iris'?'iris_body':'nopal_walk_body')};
})();
