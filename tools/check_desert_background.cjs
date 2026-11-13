const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {decode}=require('./build_enemy_atlas.cjs'),{boot}=require('./game_fixture.cjs');
const source=fs.readFileSync('js/desert_background.js','utf8'),file='assets/maps/desert_night.png',png=decode(file),bytes=fs.readFileSync(file);
assert.equal(png.w,1672);assert.equal(png.h,941);
function fixture(){
 const images=[],draws=[],fills=[];let allocated=0,reads=0;
 function canvas(){allocated++;const c={width:0,height:0,pixels:null};let crop=null;
  const ops={measureText:s=>({width:String(s).length*6.8}),save(){},restore(){},fillRect(...r){fills.push(r)},clearRect(){},drawImage(...args){draws.push(args);crop=args},createImageData(w,h){return {data:new Uint8ClampedArray(w*h*4),width:w,height:h}},putImageData(p){c.pixels=new Uint32Array(p.data.buffer).slice()},getImageData(x,y,w,h){reads++;const data=new Uint8ClampedArray(w*h*4),sx=crop[1],sy=crop[2];for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++){const p=((sy+yy)*png.w+sx+xx)*4;for(let k=0;k<4;k++)data[(yy*w+xx)*4+k]=png.data[p+k]}return{data}}};
  c.ctx=new Proxy(ops,{get:(o,k)=>o[k]??(()=>({addColorStop(){}}))});c.getContext=()=>c.ctx;return c;
 }
 const main=canvas();class Image{constructor(){images.push(this)}set src(v){this.url=v}get src(){return this.url}load(){this.naturalWidth=png.w;this.naturalHeight=png.h;this.onload()}}
 const element=()=>({getContext:()=>main.ctx,getBoundingClientRect:()=>({width:1200,height:800,left:0,top:0}),querySelector:()=>element(),addEventListener(){},style:{}});
 const document={baseURI:'file:///game/js/main.js',currentScript:{src:'file:///game/js/desert_background.js'},querySelector:()=>element(),createElement:canvas};
 const box={Image,URL,document};vm.createContext(box);vm.runInContext(source,box);
 return{D:box.DesertBackground,images,draws,fills,canvas,document,Image,ctx:main.ctx,allocated:()=>allocated,reads:()=>reads};
}
const f=fixture(),D=f.D;assert.equal(f.images.length,1);assert.equal(D.status().state,'loading');
assert.equal(new URL(f.images[0].src).searchParams.get('v'),crypto.createHash('sha256').update(bytes).digest('hex'));
f.images[0].load();assert.equal(D.status().state,'ready');assert.equal(D.status().scale,1);assert.equal(f.reads(),8);
for(const c of D.status().crops){assert(c.x>=0&&c.y>=0&&c.x+c.w<=png.w&&c.y+c.h<=png.h)}
function warm(camera,w,h){for(let i=0;i<30;i++)D.draw(f.ctx,camera,w,h)}
const scenarios=[[1200,800,0,0],[360,640,-255,-257],[640,360,255,256],[1600,1000,-100000,100000],[320,568,1e6,-1e6]];
for(const [w,h,x,y] of scenarios){
 const camera={x,y},before=JSON.stringify(camera);warm(camera,w,h);assert.equal(JSON.stringify(camera),before);
 f.draws.length=f.fills.length=0;const alloc=f.allocated(),read=f.reads();D.draw(f.ctx,camera,w,h);
 assert.equal(f.allocated(),alloc,'warm view rebuilt textures');assert.equal(f.reads(),read,'pixel readback during rendering');assert.equal(f.ctx.imageSmoothingEnabled,false);
 assert(f.fills.some(r=>r.join(',')===`0,0,${w},${h}`),'no opaque underfill');
 const area=new Uint8Array(w*h);
 for(const a of f.draws){assert.equal(a.length,9);assert(a.slice(1).every(Number.isInteger));assert.equal(a[3],a[7]);assert.equal(a[4],a[8]);assert(a[1]>=0&&a[2]>=0&&a[1]+a[3]<=256&&a[2]+a[4]<=256);
  for(let yy=a[6];yy<a[6]+a[8];yy++)for(let xx=a[5];xx<a[5]+a[7];xx++)area[yy*w+xx]++;
  // Cached chunk pixels must equal the global sampler across all four edges.
  const view=D.visible(camera,w,h),cx=(a[5]-a[1]-view.ox)/256,cy=(a[6]-a[2]-view.oy)/256;
  for(const yy of [0,1,127,128,254,255])for(const xx of [0,1,127,128,254,255])assert.equal(a[0].pixels[yy*256+xx],D.sample(cx*256+xx,cy*256+yy));
 }
 assert(area.every(n=>n===1),'gap or overlapping chunk rectangles');assert(D.status().cached<=64);assert(D.status().cacheBytes<=16*1024*1024);
}
const fingerprint=()=>{warm({x:0,y:0},360,640);f.draws.length=0;D.draw(f.ctx,{x:0,y:0},360,640);return f.draws.map(a=>crypto.createHash('sha256').update(Buffer.from(a[0].pixels.buffer)).digest('hex')).join(':')};
const initial=fingerprint();for(let i=0;i<80;i++)D.draw(f.ctx,{x:i*800,y:i*400},360,640);assert(D.status().evicted>0);assert.equal(fingerprint(),initial,'returning after eviction changed terrain');
const allocation=f.allocated();for(let i=0;i<500;i++)D.draw(f.ctx,{x:0,y:0},360,640);assert.equal(f.allocated(),allocation);assert.equal(f.images.length,1);assert.equal(f.reads(),8);
// All emitted source colors are exact pixels, not blended/interpolated colors.
const colors=new Set();for(const r of D.status().crops)for(let y=r.y;y<r.y+r.h;y++)for(let x=r.x;x<r.x+r.w;x++){const p=(y*png.w+x)*4;colors.add(new Uint32Array(png.data.buffer,png.data.byteOffset+p,1)[0])}
for(let y=-1024;y<1024;y+=17)for(let x=-1024;x<1024;x+=19)assert(colors.has(D.sample(x,y)));
assert(new Set(Array.from({length:100},(_,i)=>D.sample(i*128,0))).size>10,'terrain repeating one tiny pattern');
assert([0,1].includes(D.sceneryAlpha(300,400)));assert.equal(D.sceneryAlpha(300,400),D.sceneryAlpha(300,400));
const failed=fixture();failed.images[0].onerror();failed.D.draw(failed.ctx,{x:0,y:0},360,640);assert.equal(failed.D.status().state,'error');assert(failed.fills.some(r=>r.join(',')==='0,0,360,640'));
const wrong=fixture();wrong.images[0].naturalWidth=1;wrong.images[0].onload();assert.equal(wrong.D.status().state,'error');
// Real simulation equivalence for loaded versus failed image, including RNG.
function game(ready){const f=fixture(),g=boot({globals:{URL,Image:f.Image,document:f.document}}),img=f.images.findLast(i=>i.src.includes('/maps/desert_night.png'));if(ready)img.load();else img.onerror();return g}
const a=game(true),b=game(false);for(const f of[a,b]){f.p.game.spawn=100;f.p.game.nextBoss=Infinity;f.p.game.nextKnowledgeChest=Infinity;f.p.keys.add('d')}
for(let i=0;i<300;i++){for(const f of[a,b]){f.p.update(1/60);const before=JSON.stringify(f.p.game);f.p.drawWorld();assert.equal(JSON.stringify(f.p.game),before)}assert.equal(JSON.stringify(a.p.game),JSON.stringify(b.p.game))}
assert(Math.abs(a.p.game.player.x-1025)<1e-6);for(const f of[a,b]){f.p.game.player.x=100000;f.p.update(1/60);assert(f.p.game.player.x>100000)}
console.log('PASS night terrain: real source/crop pixels, hash, one image, 1:1 integer crops, exact gap-free chunk coverage at five viewports, shared world-edge samples, deterministic eviction/rebuild, 16 MiB cache bound, zero warm allocations/readbacks, no new colors, sparse props, failure fallback and 300-frame real gameplay/RNG equivalence. Browser visual checks remain separate.');
