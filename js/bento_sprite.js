/* Shared loader/compositor infrastructure; authored eight-way walking has no
   mirroring. Direction is movement state, independent of the dynamite target. */
const BentoSprite=(()=>{
 'use strict';
 const meta=typeof BentoAtlas==='undefined'?null:BentoAtlas;
 function direction(dx,dy){
  if(!dx&&!dy)return null;
  return (Math.round(Math.atan2(-dx,dy)/(Math.PI/4))+8)%8;
 }
 function pose(p,t){
  const weapon=p.heldWeapon||p.startWeapon||'dynamite',age=t-(p.bentoThrowAt??-Infinity);
  const throwing=weapon==='dynamite'&&age>=0&&age<.34;
  const preparing=weapon==='dynamite'&&!throwing&&!!p.bentoWindup;
  const angle=p.bentoThrowAngle??(p.facing<0?Math.PI:0);
  const facing=p.facing<0?-1:1,face=Math.abs(Math.cos(angle))>.05?(Math.cos(angle)<0?-1:1):facing;
  const dir=Number.isInteger(p.visualDirection)?p.visualDirection:7;
  if(throwing||preparing)return {sheet:'actions',frame:preparing?8:age<.10?9:age<.21?10:11,direction:dir,face,angle,throwing,preparing,weapon};
  if(!Number.isInteger(p.visualDirection)&&weapon==='dynamite')return {sheet:'actions',frame:Math.floor(t*4)%4,direction:7,face:facing,angle,throwing:false,preparing:false,weapon};
  const col=p.visualMoving?((Math.floor((p.visualStride||0)*2/Math.PI)%4+4)%4):(meta?.idleColumns?.[dir]??0);
  return {sheet:'walk',frame:dir*4+col,direction:dir,face:1,angle,throwing:false,preparing:false,weapon};
 }
 function draw(ctx,p,x,y,t,images,data){
  const a=pose(p,t),f=data[a.sheet].frames[a.frame];
  ctx.save();ctx.imageSmoothingEnabled=false;ctx.translate(Math.round(x),Math.round(y));
  ctx.fillStyle='#10172099';ctx.fillRect(-14,17,28,5);ctx.fillRect(-18,18,36,3);
  if(p.invuln>0&&Math.floor(p.invuln*14)%2)ctx.globalAlpha=.55;
  ctx.scale(a.face,1);
  ctx.drawImage(images[a.sheet],f.x,f.y,f.w,f.h,-data.pivot[0],data.worldFeetY-data.pivot[1],f.w,f.h);
  ctx.restore();return true;
 }
 return {...createAtlasHeroSprite(meta,'bento','dynamite','bentoThrowAt','bentoThrowAngle',{pose,draw}),direction};
})();
