/* Eight authored walking directions; attacks remain in the combat/effects system. */
const IrisSprite=(()=>{
 'use strict';
 const meta=typeof IrisAtlas==='undefined'?null:IrisAtlas;
 function pose(p,t){
  const direction=Number.isInteger(p.visualDirection)?p.visualDirection:0;
  const col=p.visualMoving?Math.floor((p.irisWalkTime||0)*8)%4:0;
  return {direction,frame:direction*4+col};
 }
 function draw(ctx,p,x,y,t,images,data){
  const f=data.frames[pose(p,t).frame],s=data.scale;
  ctx.save();ctx.imageSmoothingEnabled=false;ctx.translate(Math.round(x),Math.round(y));
  ctx.fillStyle='#10172099';ctx.fillRect(-14,17,28,5);ctx.fillRect(-18,18,36,3);
  if(p.invuln>0&&Math.floor(p.invuln*14)%2)ctx.globalAlpha=.55;
  const image=typeof WeaponSprites!=='undefined'&&WeaponSprites.ready()?WeaponSprites.body('iris'):images.iris_spritesheet;
  ctx.drawImage(image,f.x,f.y,f.w,f.h,
   -Math.round((f.anchor[0]-f.x)*s),data.worldFeetY-Math.round(f.h*s),Math.round(f.w*s),Math.round(f.h*s));
  ctx.restore();return true;
 }
 return createAtlasHeroSprite(meta,'iris','lasso',null,null,{pose,draw});
})();
