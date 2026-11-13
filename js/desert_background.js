/* Infinite native-pixel night terrain. No simulation state or RNG is used. */
(() => {
 'use strict';
 const width=1672,height=941,CHUNK=256,CELL=128,PAD=32,PATCH=192,BLOCK=4,LIMIT=64,SEED=0x16ca7c05;
 const sha256='347cf8b1eee571cce9421141b3e45bd302d7c84ae594262b476666f4da49caa0';
 // Inspected ground-only crops: no corner cacti/large props in the texture bank.
 const crops=[[256,128],[512,128],[768,128],[1024,64],[256,352],[640,352],[896,448],[1152,320]];
 const cache=new Map();let bank=null,image=null,state='unavailable',url='',built=0,evicted=0;
 const fallback=['#74414a','#71404b','#77444e','#6f3f49','#79464f'];
 function hash(x,y,salt=SEED){let n=Math.imul(x|0,0x1f123bb5)^Math.imul(y|0,0x5f356495)^salt;n=Math.imul(n^(n>>>16),0x45d9f3b);n=Math.imul(n^(n>>>16),0x45d9f3b);return(n^(n>>>16))>>>0}
 function selection(wx,wy){
  let tx=Math.floor(wx/CELL),ty=Math.floor(wy/CELL);const lx=wx-tx*CELL+2,ly=wy-ty*CELL+2;
  const bx=Math.floor(wx/BLOCK),by=Math.floor(wy/BLOCK),rx=hash(bx,by)/4294967296,ry=hash(bx,by,SEED^0x764a)/4294967296;
  // Opaque 4px selections join overlapping samples, never RGB interpolation.
  // All decisions use world coordinates, including both sides of chunk edges.
  if(lx<PAD&&rx<(PAD-lx)/(PAD*2))tx--;else if(lx>=CELL-PAD&&rx<(lx-(CELL-PAD))/(PAD*2))tx++;
  if(ly<PAD&&ry<(PAD-ly)/(PAD*2))ty--;else if(ly>=CELL-PAD&&ry<(ly-(CELL-PAD))/(PAD*2))ty++;
  return {patch:hash(tx,ty)%crops.length,sx:wx-tx*CELL+PAD,sy:wy-ty*CELL+PAD};
 }
 function sample(x,y){
  const wx=Math.floor(x/BLOCK)*BLOCK,wy=Math.floor(y/BLOCK)*BLOCK,s=selection(wx,wy);
  return bank?bank[s.patch][(s.sy+y-wy)*PATCH+s.sx+x-wx]:null;
 }
 function build(cx,cy){
  if(!bank)return null;
  const canvas=document.createElement('canvas');canvas.width=canvas.height=CHUNK;
  const g=canvas.getContext('2d');if(!g)return null;g.imageSmoothingEnabled=false;
  if(bank){
   const pixels=g.createImageData(CHUNK,CHUNK),out=new Uint32Array(pixels.data.buffer);
   for(let y=0;y<CHUNK;y+=BLOCK)for(let x=0;x<CHUNK;x+=BLOCK){
    const s=selection(cx*CHUNK+x,cy*CHUNK+y),input=bank[s.patch];
    for(let dy=0;dy<BLOCK;dy++){const src=(s.sy+dy)*PATCH+s.sx,dst=(y+dy)*CHUNK+x;for(let dx=0;dx<BLOCK;dx++)out[dst+dx]=input[src+dx]}
   }
   g.putImageData(pixels,0,0);
  }
  const key=cx+','+cy;cache.set(key,canvas);built++;
  if(cache.size>LIMIT){const oldest=cache.keys().next().value,retired=cache.get(oldest);cache.delete(oldest);retired.width=retired.height=0;evicted++}
  return canvas;
 }
 function touch(key){const c=cache.get(key);if(c){cache.delete(key);cache.set(key,c)}return c}
 function prewarm(){
  if(typeof requestIdleCallback!=='function')return;
  const pending=[];for(let y=-2;y<2;y++)for(let x=-3;x<3;x++)pending.push([x,y]);
  function step(){if(!bank)return;for(let n=0;n<2&&pending.length;n++){const [x,y]=pending.shift();if(!cache.has(x+','+y))build(x,y)}if(pending.length)requestIdleCallback(step,{timeout:100})}
  requestIdleCallback(step,{timeout:100});
 }
 if(typeof Image==='function'){
  image=new Image();state='loading';
  image.onload=()=>{
   if(image.naturalWidth!==width||image.naturalHeight!==height){state='error';return}
   try{
    const scratch=document.createElement('canvas');scratch.width=scratch.height=PATCH;
    const g=scratch.getContext('2d',{willReadFrequently:true});g.imageSmoothingEnabled=false;
    const decoded=crops.map(([x,y])=>{g.clearRect(0,0,PATCH,PATCH);g.drawImage(image,x,y,PATCH,PATCH,0,0,PATCH,PATCH);const data=g.getImageData(0,0,PATCH,PATCH).data;if(data.length!==PATCH*PATCH*4)throw Error('Terrain pixel decode failed');return new Uint32Array(data.slice().buffer)});
    bank=decoded;state='ready';for(const c of cache.values())c.width=c.height=0;cache.clear();scratch.width=scratch.height=0;prewarm();
   }catch{state='error';bank=null}
  };
  image.onerror=()=>{state='error';bank=null};
  url=new URL('../assets/maps/desert_night.png?v='+sha256,document.currentScript?.src||document.baseURI).href;image.src=url;
 }
 function visible(camera,w,h){
  const ox=Math.round(w/2-camera.x),oy=Math.round(h/2-camera.y);
  return {ox,oy,minX:Math.floor(-ox/CHUNK),minY:Math.floor(-oy/CHUNK),maxX:Math.floor((w-1-ox)/CHUNK),maxY:Math.floor((h-1-oy)/CHUNK)};
 }
 function draw(ctx,camera,w,h){
  w=Math.max(1,Math.ceil(w));h=Math.max(1,Math.ceil(h));const view=visible(camera,w,h),missing=[];
  ctx.save();ctx.imageSmoothingEnabled=false;ctx.globalAlpha=1;ctx.fillStyle=fallback[0];ctx.fillRect(0,0,w,h);
  if(!bank){
   // The failure/loading path needs neither pixel reads nor texture allocations.
   for(let y=Math.floor(-view.oy/64)*64;y<h-view.oy;y+=64)for(let x=Math.floor(-view.ox/64)*64;x<w-view.ox;x+=64){const n=hash(x/64,y/64);if(n%4===0){ctx.fillStyle=fallback[n%fallback.length];ctx.fillRect(x+view.ox+12,y+view.oy+20,12,4)}}
   ctx.restore();return;
  }
  function blit(c,x,y){const dx=x*CHUNK+view.ox,dy=y*CHUNK+view.oy,sx=Math.max(0,-dx),sy=Math.max(0,-dy),sw=Math.min(CHUNK-sx,w-Math.max(0,dx)),sh=Math.min(CHUNK-sy,h-Math.max(0,dy));ctx.drawImage(c,sx,sy,sw,sh,dx+sx,dy+sy,sw,sh)}
  for(let y=view.minY;y<=view.maxY;y++)for(let x=view.minX;x<=view.maxX;x++){
   const c=touch(x+','+y);if(c)blit(c,x,y);else missing.push({x,y,d:(x*CHUNK+128-camera.x)**2+(y*CHUNK+128-camera.y)**2});
  }
  // Bound cold-travel work. Opaque night sand covers pending texture chunks.
  if(missing.length){missing.sort((a,b)=>a.d-b.d);for(let n=0;n<Math.min(2,missing.length);n++){const {x,y}=missing[n],c=build(x,y);if(c)blit(c,x,y)}}
  ctx.restore();
 }
 // Existing small night props at one quarter of their former density. This
 // changes neither collision geometry nor the simulation's chest spawn checks.
 function sceneryAlpha(x,y){return hash(Math.floor(x/64),Math.floor(y/64),SEED^0xdec0)%4===0?1:0}
 globalThis.DesertBackground={draw,visible,sample,sceneryAlpha,status:()=>({state,url,sha256,width:state==='ready'?width:0,height:state==='ready'?height:0,scale:1,chunkSize:CHUNK,cacheLimit:LIMIT,cached:cache.size,cacheBytes:cache.size*CHUNK*CHUNK*4,bankBytes:bank?bank.length*PATCH*PATCH*4:0,built,evicted,seed:SEED,crops:crops.map(([x,y])=>({x,y,w:PATCH,h:PATCH}))})};
})();
