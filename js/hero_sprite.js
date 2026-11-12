/* Full-frame heroes: feet and body scale are baked offline. Combat owns clocks;
   the renderer never changes entities or emits projectiles. */
function createAtlasHeroSprite(meta,characterId,starterWeapon,shotKey,angleKey,options){
 'use strict';
 options||={};
 const images={};let state=meta?'loading':'missing-metadata',ready=false;
 const layers=Object.keys(meta?.images||{});
 if(meta&&typeof Image==='function'){
  const base=new URL(meta.basePath||('../assets/characters/'+characterId+'/'),document.currentScript?.src||document.baseURI);
  const revision=new URL(document.currentScript?.src||document.baseURI).search;
  for(const name of layers){
   const img=images[name]=new Image(),size=meta.images[name].size||meta.size;
   img.onload=()=>{
    if(img.naturalWidth!==size[0]||img.naturalHeight!==size[1]){state='error';ready=false;console.warn('Sprite '+characterId+': dimensões inesperadas em '+img.src);return}
    ready=layers.every(k=>images[k]?.complete&&images[k].naturalWidth===meta.images[k].size[0]&&images[k].naturalHeight===meta.images[k].size[1]);
    if(ready)state='ready';
   };
   img.onerror=()=>{ready=false;state='error';console.warn('Sprite '+characterId+': falha ao carregar '+img.src)};
   img.src=new URL((meta.images[name].file||name+'.png')+revision,base).href;
  }
 }
 const active=p=>ready&&p.characterId===characterId;
 const pose=(p,t)=>options.pose?options.pose(p,t):{};
 const draw=(ctx,p,x,y,t)=>active(p)&&!!options.draw?.(ctx,p,x,y,t,images,meta);
 const status=()=>({characterId,state,ready,images:Object.entries(images).map(([layer,img])=>({layer,url:img.src,loaded:!!img.complete,width:img.naturalWidth||0,height:img.naturalHeight||0}))});
 return {active,pose,draw,status,isReady:()=>ready,image:name=>images[name]};
}
function createDirectionalHeroSprite(meta,id){
 const direction=(dx,dy)=>dx||dy?(Math.round(Math.atan2(-dx,dy)/(Math.PI/4))+8)%8:null;
 function pose(p,t){
  const age=t-(p.heroAttackAt??-Infinity),shooting=age>=0&&age<meta.attack.columns/meta.attack.fps;
  const dir=shooting?(direction(Math.cos(p.heroAttackAngle||0),Math.sin(p.heroAttackAngle||0))??0):(p.visualDirection??0);
  const sheet=shooting?'attack':'walk',data=meta[sheet];
  const col=shooting?Math.min(data.columns-1,Math.floor(age*data.fps)):p.visualMoving?Math.floor((p.visualWalkTime||0)*data.fps)%data.columns:data.idleColumns[dir];
  return {sheet,direction:dir,sourceRow:data.rowMap[dir],frame:data.rowMap[dir]*data.columns+col,column:col,face:1,shooting,throwing:shooting&&id==='bento',weapon:p.heldWeapon||meta.starterWeapon};
 }
 function draw(ctx,p,x,y,t,images,data){
  const a=pose(p,t),f=data[a.sheet].frames[a.frame];
  ctx.save();ctx.imageSmoothingEnabled=false;ctx.translate(Math.round(x),Math.round(y));
  ctx.fillStyle='#10172099';ctx.fillRect(-14,17,28,5);ctx.fillRect(-18,18,36,3);
  if(p.invuln>0&&Math.floor(p.invuln*14)%2)ctx.globalAlpha=.55;
  ctx.drawImage(images[a.sheet],f.x,f.y,f.w,f.h,-data.pivot[0],data.worldFeetY-data.pivot[1],f.w,f.h);
  ctx.restore();return true;
 }
 return {...createAtlasHeroSprite(meta,id,meta.starterWeapon,null,null,{pose,draw}),direction,embeddedWeapon:meta.starterWeapon};
}
function fullHeroSprite(p){
 const sprite={nopal:typeof NopalSprite==='undefined'?null:NopalSprite,rosa:typeof RosaSprite==='undefined'?null:RosaSprite,bento:typeof BentoSprite==='undefined'?null:BentoSprite,iris:typeof IrisSprite==='undefined'?null:IrisSprite}[p.characterId];
 return sprite?.active(p)?sprite:null;
}
