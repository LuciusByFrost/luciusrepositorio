/* Shared local atlas renderer. Body and weapon are split offline: one gun,
   aimed at the real target. All clocks come from the simulation. */
function createAtlasHeroSprite(meta,characterId,starterWeapon,shotKey,angleKey,options){
 'use strict';
 options||={};
 let ready=false;
 let state=meta?'loading':'missing-metadata';
 const images={},surface=document.createElement('canvas');
 surface.width=surface.height=192;
 const raster=surface.getContext('2d');raster.imageSmoothingEnabled=false;
 const layers=Object.keys(meta?.images||{body:0,arms:0});
 const expected=name=>meta.images?.[name]?.size||meta.size;
 if(meta&&typeof Image==='function'){
  const base=new URL('../assets/characters/'+characterId+'/',document.currentScript?.src||document.baseURI);
  const revision=new URL(document.currentScript?.src||document.baseURI).search;
  for(const name of layers){
   const img=images[name]=new Image();
   img.onload=()=>{
    ready=layers.every(k=>images[k]?.complete&&images[k].naturalWidth===expected(k)[0]&&images[k].naturalHeight===expected(k)[1]);
    if(ready)state='ready';
    else if(img.naturalWidth!==expected(name)[0]||img.naturalHeight!==expected(name)[1]){state='error';console.warn('Sprite '+characterId+': dimensoes inesperadas em '+img.src)}
   };
   img.onerror=()=>{ready=false;state='error';console.warn('Sprite '+characterId+': falha ao carregar '+img.src)};
   img.src=new URL(name+'.png'+revision,base).href;
  }
 }
 function status(){return {characterId,state,ready,images:Object.entries(images).map(([layer,img])=>({layer,url:img.src,loaded:!!img.complete,width:img.naturalWidth||0,height:img.naturalHeight||0}))}}
 function active(p){return ready&&p.characterId===characterId}
 function pose(p,t){
  if(options.pose)return options.pose(p,t);
  const weapon=p.heldWeapon||p.startWeapon||starterWeapon;
  const age=t-(p[shotKey]??-Infinity),shooting=weapon===starterWeapon&&age>=0&&age<.32;
  const angle=shooting?p[angleKey]:(p.weaponAngle??(p.facing<0?Math.PI:0));
  const aimed=shooting||p.weaponPose>0,face=aimed&&Math.abs(Math.cos(angle))>.05?(Math.cos(angle)<0?-1:1):(p.facing<0?-1:1);
  const back=!!p.visualBack;
  let frame;
  // Brief aim, discharge, recoil, recovery; triggered only by the real weapon shot.
  if(shooting)frame=8+(age<.025?0:age<.095?1:age<.18?2:3);
  else if(p.visualMoving)frame=(back?12:4)+((Math.floor((p.visualStride||0)*2/Math.PI)%4+4)%4);
  else frame=back?12:Math.floor(t*4)%4;
  return {frame,face,angle,weapon,shooting,back:back&&!shooting};
 }
 function draw(ctx,p,x,y,t){
  if(!active(p))return false;
  if(options.draw)return options.draw(ctx,p,x,y,t,images,meta);
  const a=pose(p,t),f=meta.frames[a.frame],ox=meta.pivot[0],oy=meta.pivot[1]-meta.worldFeetY;
  ctx.save();ctx.imageSmoothingEnabled=false;ctx.translate(Math.round(x),Math.round(y));
  ctx.fillStyle='#10172099';ctx.fillRect(-14,17,28,5);ctx.fillRect(-18,18,36,3);
  if(p.invuln>0&&Math.floor(p.invuln*14)%2)ctx.globalAlpha=.55;
  ctx.scale(a.face,1);
  ctx.drawImage(images.body,f.x,f.y,f.w,f.h,-ox,-oy,f.w,f.h);
  if(a.weapon===starterWeapon){
   // Rotate once on a native pixel surface, then composite at integer coordinates.
   // The source recoil angle is retained; mirroring never changes aspect ratio.
   const local=Math.atan2(Math.sin(a.angle),Math.cos(a.angle)*a.face);
   raster.setTransform(1,0,0,1,0,0);raster.clearRect(0,0,192,192);
   raster.save();raster.translate(96,96);raster.rotate(local-f.barrelAngle);
   raster.drawImage(images.arms,f.x,f.y,f.w,f.h,-f.shoulder[0],-f.shoulder[1],f.w,f.h);raster.restore();
   ctx.drawImage(surface,f.shoulder[0]-ox-96,f.shoulder[1]-oy-96);
  }
  ctx.restore();return true;
 }
 return {active,pose,draw,status};
}
const NopalSprite=createAtlasHeroSprite(typeof NopalAtlas==='undefined'?null:NopalAtlas,'nopal','revolver','nopalShotAt','nopalShotAngle');
