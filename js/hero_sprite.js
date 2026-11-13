/* Full-frame heroes: feet and body scale are baked offline. Combat owns clocks;
   the renderer never changes entities or emits projectiles. */
function createAtlasHeroSprite(meta,characterId,starterWeapon,shotKey,angleKey,options){
 'use strict';
 options||={};
 const images={},loaded=new Set(),errors=new Map();let state=meta?'loading':'missing-metadata',ready=false;
 const layers=Object.keys(meta?.images||{});
 function fail(layer,message){
  ready=false;state='error';loaded.delete(layer);errors.set(layer,message);
  console.error('[Cactus Survivors] Sprite '+characterId+'/'+layer+': '+message+'; confira o atlas e execute tools/build_hero_atlases.ps1.');
 }
 if(!meta||!layers.length)fail('metadata','metadados ausentes ou sem imagens');
 if(meta&&typeof Image==='function'){
  const base=new URL(meta.basePath||('../assets/characters/'+characterId+'/'),document.currentScript?.src||document.baseURI);
  const revision=new URL(document.currentScript?.src||document.baseURI).search;
  for(const name of layers){
   const img=images[name]=new Image(),size=meta.images[name].size||meta.size;
   img.onload=()=>{
    if(img.naturalWidth!==size[0]||img.naturalHeight!==size[1]){fail(name,'dimensões '+img.naturalWidth+'x'+img.naturalHeight+', esperadas '+size.join('x')+' em '+img.src);return}
    errors.delete(name);loaded.add(name);
    ready=!errors.size&&layers.every(k=>loaded.has(k));
    if(ready)state='ready';
   };
   img.onerror=()=>fail(name,'falha ao carregar '+img.src);
   const url=new URL((meta.images[name].file||name+'.png')+revision,base);
   if(meta.images[name].sha256)url.searchParams.set('v',meta.images[name].sha256);
   img.src=url.href;
  }
 }
 const active=p=>ready&&p.characterId===characterId;
 const pose=(p,t)=>options.pose?options.pose(p,t):{};
 const draw=(ctx,p,x,y,t)=>active(p)&&!!options.draw?.(ctx,p,x,y,t,images,meta);
 const status=()=>({characterId,state,ready,errors:Object.fromEntries(errors),images:Object.entries(images).map(([layer,img])=>({layer,url:img.src,loaded:loaded.has(layer),width:img.naturalWidth||0,height:img.naturalHeight||0,source:meta[layer]?.source,sourceSHA256:meta[layer]?.sourceSHA256,sha256:meta.images[layer].sha256}))});
 return {active,pose,draw,status,isReady:()=>ready,image:name=>images[name]};
}
// A loading/broken PNG must never impersonate the retired procedural character.
function drawUnavailableHero(ctx,p,x,y,sprite){
 const failed=!sprite||sprite.status().state==='error';
 ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.fillStyle=failed?'#b7463c':'#b9985a';
 ctx.strokeStyle=ctx.fillStyle;ctx.strokeRect(-12,-25,24,42);ctx.font='bold 16px monospace';ctx.textAlign='center';ctx.fillText(failed?'!':'…',0,-2);ctx.restore();
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
