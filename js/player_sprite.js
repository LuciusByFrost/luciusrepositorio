/* Procedural pixel layers. All coordinates are logical pixels, anchored at the
   unchanged player world origin. Replace bake() layers with PNG crops later. */
const CactusHero = (() => {
 'use strict';
 const ink='#151d21',green='#405c3d',light='#7b8950',dark='#293e32',leather='#483229',gold='#bda66a';
 const layers=new Map();
 function bake(name,paint){
  for(const hero of CharacterRoster.list){
  const c=document.createElement('canvas');c.width=64;c.height=64;
  const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.translate(32,40);
  const r=(color,x,y,w,h)=>{g.fillStyle=hero.palette[color]||color;g.fillRect(x,y,w,h)};
  paint(r,hero.id);layers.set(name+':'+hero.id,c);if(hero.id==='nopal')layers.set(name,c);
  // Prebake impact compression by omitting two rows, never resampling pixels.
  const compressed=document.createElement('canvas');compressed.width=compressed.height=64;
  const h=compressed.getContext('2d');h.imageSmoothingEnabled=false;
  h.drawImage(c,0,0,64,32,0,2,64,32);
  h.drawImage(c,0,33,64,7,0,34,64,7);
  h.drawImage(c,0,41,64,23,0,41,64,23);
  layers.set(name+'-impact:'+hero.id,compressed);if(hero.id==='nopal')layers.set(name+'-impact',compressed);
  }
 }
 bake('body',r=>{
  // Stepped shoulders and rounded flank give the cactus an organic silhouette.
  r(ink,-8,-24,17,3);r(ink,-11,-22,22,7);r(ink,-13,-16,26,22);r(ink,-11,5,23,10);
  r(dark,-10,-21,20,34);r(dark,-12,-14,24,18);
  r(green,-8,-22,15,34);r(green,-10,-16,19,21);
  r('#536b40',-7,-20,5,28);r(light,-6,-18,2,8);
  r('#344b34',3,-19,3,28);r('#647849',-5,2,2,8);
  r('#82905a',-9,-9,2,4);r('#536b40',8,-13,2,12);
  for(const [x,y] of [[-8,-18],[5,-20],[-7,-5],[6,3],[-3,8]]){
   r('#b3b67b',x,y,1,3);r('#d0c99a',x-1,y+1,3,1);
  }
  r(ink,-11,8,23,5);r(leather,-10,9,21,3);
  r('#84603e',-9,9,7,1);r(gold,-1,8,5,5);r('#d7d2a3',0,9,3,1);r(leather,0,10,2,2);
  r('#aa8350',-7,11,1,1);r('#aa8350',7,10,1,1);
  // Empty holster: the equipped weapon is drawn once by the game renderer.
  r(ink,-14,7,5,10);r(leather,-13,8,4,8);r('#8c603f',-13,8,3,2);r(gold,-12,12,1,1);
 });
 bake('arm',r=>{
  r(ink,-18,-13,6,4);r(ink,-20,-10,8,10);r(ink,-17,-1,6,4);
  r(dark,-18,-11,5,11);r(green,-18,-10,4,8);r(light,-18,-9,2,4);
  r(green,-16,-1,4,3);r('#b5b780',-19,-8,1,3);r('#b5b780',-15,-1,1,3);
 });
 bake('boot',r=>{
  r(ink,-10,12,8,9);r(leather,-9,12,6,7);r('#80543a',-8,13,3,5);
  r(ink,-11,18,10,4);r('#694832',-10,18,8,2);r('#aa8252',-10,18,3,1);
  r('#b8a174',-10,15,6,1);r(ink,-11,21,10,1);
 });
 bake('poncho',r=>{
  r(ink,-12,-6,24,7);r(ink,-15,-3,9,8);r(ink,-13,4,5,3);r(ink,-7,1,5,5);
  r(ink,5,-3,9,6);r(ink,7,2,5,3);r('#5e5340',-11,-5,22,6);
  r('#8c7955',-12,-3,8,6);r('#a58f62',-10,-3,4,2);
  r('#776849',-13,1,6,4);r('#444335',4,-3,8,4);
  r('#b09a6c',-12,2,8,1);r('#483e33',-10,3,2,3);r('#b09a6c',-5,3,2,2);
  r('#6c6045',7,0,5,3);r('#9b865c',8,1,3,1);
  r('#713e36',-12,0,8,1);r('#713e36',7,-1,4,1);
 });
 bake('scarf',r=>{
  r('#48272d',-10,-7,20,5);r('#a13e3c',-9,-7,18,3);
  r('#c46a50',-7,-7,7,1);r('#702c32',-5,-3,10,3);r('#ae4e42',-3,-3,6,2);
  r('#48272d',10,-6,5,4);r('#a13e3c',11,-6,5,2);r('#c46a50',13,-6,2,1);
  r('#c1966b',-7,-5,1,1);r('#48272d',3,-6,2,1);
 });
 bake('hat',r=>{
  r(ink,-12,-34,24,11);r(ink,-9,-38,17,5);r(ink,8,-36,3,3);
  r('#3e2e29',-11,-33,22,9);r('#5c4130',-8,-37,15,6);
  r('#725239',-7,-36,6,2);r('#49352b',1,-36,6,5);r('#2d2626',6,-33,4,7);
  r('#6d3d35',-11,-29,22,3);r('#a26c47',-9,-29,16,1);
  r(gold,6,-29,3,3);r('#e1c182',6,-29,2,1);
  r(ink,-21,-26,42,5);r(ink,-24,-28,7,3);r(ink,18,-29,6,4);
  r('#5c4130',-20,-25,39,2);r('#876445',-19,-25,12,1);
  r('#a08055',-23,-27,5,1);r('#725239',19,-28,4,2);
  r('#302725',-11,-22,25,2);r('#b1976c',-15,-24,2,1);r(ink,13,-24,2,2);
 });
 for(const expression of ['idle','walk','attack','hurt','blink'])bake(expression,r=>{
  r('#344b34',-9,-20,19,9);
  const hurt=expression==='hurt',combat=expression==='attack',h=2;
  if(hurt||expression==='blink'){r(ink,-6,-15,4,1);r(ink,3,-15,4,1);if(hurt)r('#b3b186',-1,-10,2,2)}
  else{
   r('#c5c397',-7,-16,5,h);r('#c5c397',2,-16,5,h);
   r(ink,-4,-16,2,h);r(ink,5,-16,2,h);
   r(ink,-8,-19,4,1);r(ink,-5,-18,3,1);r(ink,2,-18,3,1);r(ink,5,-19,3,1);
   r('#82905a',-1,-11,2,1);r(ink,-2,-9,6,1);if(combat)r(ink,0,-10,4,1);
  }
  r('#ba8b62',8,-15,1,5);r('#d2ae7c',7,-14,3,1);r('#d2ae7c',7,-12,3,1);
 });
 // Six-shooter: blued steel, fluted cylinder, brass fittings and walnut grip.
 // Same barrel endpoint as the original weapon, so the muzzle flash stays aligned.
 bake('revolver',r=>{
  r(ink,0,-5,11,8);r(ink,9,-6,15,7);r(ink,20,-7,2,2);
  r('#3d4648',10,-5,13,4);r('#77817b',11,-5,11,1);
  r('#252e32',11,-2,12,2);r('#a1a58b',21,-4,2,1);r(ink,23,-4,1,4);
  r('#4f5958',1,-5,9,7);r('#8e9686',2,-5,7,1);
  r('#303b3e',2,-3,2,4);r('#303b3e',6,-3,2,4);r('#6d7770',3,-3,1,3);r('#6d7770',7,-3,1,3);
  r('#b6a06a',1,1,10,2);r('#d1bd83',2,1,7,1);r('#3d4648',0,-7,3,3);r('#88907c',0,-7,2,1);
  // Hollow trigger guard and a stepped, rearward-sloping leather grip.
  r('#b6a06a',9,3,5,1);r('#b6a06a',13,3,1,4);r('#b6a06a',9,7,5,1);r('#525b54',10,3,1,3);
  r(ink,3,3,6,4);r(ink,2,6,6,5);r(ink,1,10,7,2);
  r('#63422e',4,3,4,4);r('#63422e',3,6,4,5);r('#996840',4,4,2,3);
  r('#825534',3,8,3,2);r('#c1ac75',5,5,1,1);r('#303b3e',2,10,5,1);
 });
 bake('signature',(r,id)=>{
  if(id==='rosa'){
   for(let i=0;i<5;i++){r('#3c2c2b',-10+i*4,-2+i*2,4,4);r('#c9aa70',-9+i*4,-2+i*2,2,3)}
   r('#352831',11,-35,5,6);r('#ad5c58',10,-34,7,2);r('#d99071',12,-36,2,6);r('#e4c388',12,-34,2,2);
  }else if(id==='bento'){
   r('#261f25',-18,4,8,10);r('#795331',-17,5,6,8);r('#c6a46c',-17,6,6,2);
   for(let i=0;i<4;i++)r('#a77c4f',6-i*3,-2+i*3,3,3);
   r('#ad8a54',-8,-32,16,5);r('#242d33',-7,-31,6,3);r('#242d33',2,-31,5,3);r('#83a4a0',-6,-31,2,1);r('#83a4a0',3,-31,2,1);
  }else if(id==='iris'){
   r('#29343f',-14,1,3,9);r('#5e8f91',-13,2,2,7);r('#abc8ba',-13,8,2,1);
   r('#b8ac76',-3,0,7,1);r('#b8ac76',-4,1,1,4);r('#b8ac76',3,1,1,4);r('#b8ac76',-3,4,7,1);r('#a5e5dd',-1,1,2,3);
   r('#abc1bd',8,-32,4,4);r('#6c9ca8',9,-31,2,2);
  }
 });
 function drawRevolver(ctx){ctx.drawImage(layers.get('revolver'),-32,-40)}
 function pose(p,t){
  const moving=!!p.visualMoving,phase=p.visualStride||0;
  const hurt=p.invuln>.84,recoil=Math.sin(Math.min(1,(p.attack||0)/.18)*Math.PI/2)*2;
  const squish=p.invuln>.94,blink=(t%4.7)>4.56;
  return {moving,step:moving?Math.round(Math.sin(phase)*2):0,
   bob:moving?-Math.round(Math.abs(Math.cos(phase))):Math.round(Math.sin(t*2.8)*.65),
   sway:moving?Math.round(Math.sin(phase)*.65):0,hurt,recoil,squish,
   hatKick:Math.round(recoil*.65),handDrop:squish?1:0,
   flutter:Math.round(Math.sin(t*5+(moving?phase:0))),
   expression:hurt?'hurt':p.attack>0?'attack':blink?'blink':moving?'walk':'idle'};
 }
 function draw(ctx,p,x,y,t){
  const a=pose(p,t),face=p.facing<0?-1:1,hero=CharacterRoster.get(p.characterId).id;
  ctx.save();ctx.imageSmoothingEnabled=false;ctx.translate(Math.round(x),Math.round(y));
  ctx.fillStyle='#10172099';ctx.fillRect(-14,17,28,5);ctx.fillRect(-18,18,36,3);
  if(p.invuln>0&&Math.floor(p.invuln*14)%2)ctx.globalAlpha=.55;
  ctx.scale(face,1);
  const layer=(name,dx=0,dy=0,mirror=false)=>{
   ctx.save();ctx.translate(Math.round(dx),Math.round(dy));if(mirror)ctx.scale(-1,1);
   ctx.drawImage(layers.get(name+(a.squish&&name!=='boot'?'-impact':'')+':'+hero),-32,-40);ctx.restore();
  };
  layer('boot',0,a.step);layer('boot',1,-a.step,true);
  ctx.translate(a.sway-(a.hurt?1:0),a.bob);
  layer('arm',0,-a.step);layer('arm',-Math.round(a.recoil),a.step,true);
  layer('body');layer('poncho',0,a.moving?a.step>0?1:0:0);
  layer(a.expression);layer('scarf',0,a.flutter>0?1:0);
  layer('hat',-a.hatKick,(!a.moving&&a.bob>0?-1:0)-a.hatKick);
  layer('signature');
  // Short impact glints, independent of particles, collisions and invulnerability.
  if(a.hurt){ctx.fillStyle='#efd5a0';ctx.fillRect(-21,-18,3,1);ctx.fillRect(-19,-22,1,2)}
  ctx.restore();return a;
 }
 return {draw,pose,drawRevolver};
})();
