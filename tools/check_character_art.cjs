const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
// Inspect the actual baked rectangles, independent of colors or screenshots.
const canvases=[];
const box={document:{createElement(){
 const c={rects:[],paint:[]},stack=[];let tx=0,ty=0;
 const g={translate(x,y){tx+=x;ty+=y},setTransform(a,b,d,e,x,y){tx=x;ty=y},clearRect(){},scale(){},rotate(){},
  save(){stack.push([tx,ty])},restore(){[tx,ty]=stack.pop()},
  fillRect(x,y,w,h){
   assert([x,y,w,h,tx,ty].every(Number.isInteger),'fractional source pixel');
   assert(x+tx>=0&&y+ty>=0&&x+tx+w<=c.width&&y+ty+h<=c.height,'cropped cached layer');
   c.rects.push([x+tx,y+ty,w,h]);
   c.paint.push([g.fillStyle,x+tx,y+ty,w,h]);
  },drawImage(source){assert(source,'missing cached layer');assert.equal(g.imageSmoothingEnabled,false)},imageSmoothingEnabled:false};
 c.getContext=()=>g;canvases.push(c);return c;
}}};
vm.createContext(box);for(const file of ['characters','player_sprite'])vm.runInContext(fs.readFileSync('js/'+file+'.js','utf8'),box);
const hero=vm.runInContext('CactusHero',box),roster=vm.runInContext('CharacterRoster.list',box);
const ctx={save(){},restore(){},translate(x,y){assert([x,y].every(Number.isInteger))},scale(x,y){assert([x,y].every(v=>v===1||v===-1))},
 fillRect(x,y,w,h){assert([x,y,w,h].every(Number.isInteger),'fractional display pixel')},
 drawImage(source,x,y){assert(source,'missing cached pose');assert([x,y].every(Number.isInteger));assert.equal(ctx.imageSmoothingEnabled,false)}};
const count=canvases.length;
for(const c of roster)for(const facing of [-1,1])for(const visualMoving of [false,true])for(const attack of [0,.09])for(const invuln of [0,.9,1])for(const t of [0,1,2.93,3.03,4.13,4.63]){
 const p={characterId:c.id,facing,visualMoving,visualStride:Math.PI/2,attack,invuln};
 hero.draw(ctx,p,0,0,t);hero.drawGrip(ctx,c.id);
 for(const angle of [0,Math.PI/2,Math.PI,-Math.PI/2]){
  const anim={turn:-.1,kick:4,lift:2},m=hero.mount(p,t,angle);assert(Number.isInteger(m.x)&&Number.isInteger(m.y));hero.drawReach(ctx,p,0,0,t,angle,anim);
  hero.rasterWeapon(ctx,0,0,facing,angle+.37,anim,g=>{g.fillStyle='#151d21';g.fillRect(-4,-5,32,12)});
 }
}
assert.equal(canvases.length,count,'per-frame canvas allocation');
// bake() creates normal/impact pairs in roster order: compare alpha silhouettes.
function mask(c){const a=new Uint8Array(4096);for(const [x,y,w,h] of c.rects)for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)a[j*64+i]=1;return Array.from(a).join('')}
for(const layerIndex of [0,3,5])assert.equal(new Set(roster.map((_,i)=>mask(canvases[layerIndex*8+i*2]))).size,4,'body, poncho and hat must each have unique geometry');
function rowWidth(c,y){const row=mask(c).slice((y+40)*64,(y+41)*64);return row.lastIndexOf('1')-row.indexOf('1')+1}
for(let i=0;i<roster.length;i++){
 assert(rowWidth(canvases[i*2],-14)>rowWidth(canvases[i*2],5),roster[i].id+': head must be wider than the fitted waist');
 const leg=mask(canvases[2*8+i*2]);
 assert(leg.slice(50*64+29,50*64+35).includes('0'),roster[i].id+': trouser legs must leave a visible gap');
 const expression=part=>JSON.stringify(canvases[part*8+i*2].paint);
 assert.notEqual(expression(6),expression(8),roster[i].id+': attack needs a distinct facial expression');
 assert.notEqual(expression(9),expression(10),roster[i].id+': hurt must differ from blinking');
}
// Drive the real weapon/damage events rather than only constructing sample poses.
const {boot}=require('./game_fixture.cjs'),fixture=boot();
for(const c of roster){
 fixture.p.newGame(c.id);const game=fixture.p.game;
 const target=fixture.p.spawnEnemy('brute');Object.assign(target,{x:60,y:0,hp:1000,maxHp:1000});
 fixture.p.fireWeapon(game.weapons[c.weapon]);
 assert.equal(game.player.heldWeapon,c.weapon);
 assert.equal(hero.pose(game.player,game.time).expression,'attack');
 fixture.p.hurtPlayer(5);
 assert.equal(hero.pose(game.player,game.time).expression,'hurt');
}
console.log('PASS: four unique body/poncho/hat silhouettes; all baked pixels in bounds; 576 poses, both facings, cardinal reaches, cached grips and zero frame allocations.');
console.log('PASS: integer source/display pixels; no fractional display scales; native weapon raster surfaces reused with smoothing disabled.');
console.log('PASS: articulated figures have narrower waists than heads and separated trouser legs.');
console.log('PASS: four distinct attack faces; hurt differs from blink; real starter attacks and damage drive the correct animation state.');
