/* Hand-placed procedural pixels. Shared cache/compositor, individual geometry.
   64 x 64 layers retain the world origin at (32,40); boots end at y=22. */
const CactusHero = (() => {
 'use strict';
 const ink='#151d21',green='#405c3d',light='#7b8950',dark='#293e32',leather='#483229',gold='#bda66a';
 // Four deliberate skin tones plus a shared bone highlight. Near-identical
 // colors collapse into readable clusters rather than noisy simulated volume.
 const skinRamps={
  nopal:['#203a30','#3e6842','#6a924e','#a3bd70'],
  rosa:['#294637','#527d50','#80a362','#bad17f'],
  bento:['#41472d','#727848','#9c9e59','#c7ba77'],
  iris:['#203d43','#386d69','#619c8c','#a0cdb0']
 };
 const skinTone={
  '#293e32':0,'#344b34':0,'#405c3d':1,'#536b40':2,'#647849':2,
  '#7b8950':3,'#82905a':3,'#b5b780':3,'#b3b67b':3,'#d0c99a':3
 };
 const clothTone={
  '#444335':'#5e5340','#483e33':'#5e5340','#6c6045':'#776849',
  '#a58f62':'#8c7955','#9b865c':'#8c7955','#b09a6c':'#bda66a',
  '#c1ac77':'#bda66a','#c4ad76':'#bda66a'
 };
 const layers=new Map();
 function bake(name,paint){
  for(const hero of CharacterRoster.list){
  const c=document.createElement('canvas');c.width=64;c.height=64;
  const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.translate(32,40);
  const r=(color,x,y,w,h)=>{
   const tone=skinTone[color],material=clothTone[color]||color;
   g.fillStyle=tone===undefined?(hero.palette[material]||material):skinRamps[hero.id][tone];
   g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));
  };
  if(!paintCharacter(name,r,hero.id))paint(r,hero.id);
  layers.set(name+':'+hero.id,c);if(hero.id==='nopal')layers.set(name,c);
  // Prebake impact compression by omitting two rows, never resampling pixels.
  const compressed=document.createElement('canvas');compressed.width=compressed.height=64;
  const h=compressed.getContext('2d');h.imageSmoothingEnabled=false;
  h.drawImage(c,0,0,64,32,0,2,64,32);
  h.drawImage(c,0,33,64,7,0,34,64,7);
  h.drawImage(c,0,41,64,23,0,41,64,23);
  layers.set(name+'-impact:'+hero.id,compressed);if(hero.id==='nopal')layers.set(name+'-impact',compressed);
  }
 }
 // Geometry is authored in logical pixels, never stretched to change a build.
 // Common materials are palette-mapped by bake(); metal/copper stay consistent.
 const figures={
  nopal:{headX:-8,headY:-24,headW:18,jawY:-10,waist:8,legX:-10,legW:7,eyeY:-17},
  rosa:{headX:-9,headY:-24,headW:21,jawY:-10,waist:10,legX:-14,legW:9,eyeY:-17},
  bento:{headX:-12,headY:-21,headW:25,jawY:-8,waist:11,legX:-13,legW:10,eyeY:-15},
  iris:{headX:-6,headY:-26,headW:14,jawY:-12,waist:5,legX:-8,legW:6,eyeY:-20}
 };
 function paintFigure(name,r,id){
  const f=figures[id],b=id==='bento',s=id==='iris',rosa=id==='rosa';
  const {headX:x,headY:y,headW:w,jawY:j,waist:v}=f;
  if(name==='body'){
   // Head, neck and fitted torso are separate clusters: no full-height oval.
   r(ink,x+2,y,w-4,3);r(ink,x,y+2,w,j-y-2);
   r(ink,x+2,j-1,w-4,3);r(dark,x+1,y+3,w-2,j-y-3);
   r(green,x+2,y+2,w-5,j-y-3);r('#536b40',x+3,y+3,4,6);
   r(light,x+3,y+4,2,3);r(dark,x+w-4,y+4,2,j-y-4);
   r(green,-3,j+1,6,-5-j);r(light,-2,j+1,2,2);
   r(ink,-v-2,-5,v*2+4,7);r(ink,-v,1,v*2,8);
   r(leather,-v+1,-4,v*2-2,11);r('#80543a',-v+2,-3,3,7);
   r(ink,-v-1,6,v*2+2,4);r('#7c5339',-v,7,v*2,2);
   r(gold,-2,6,5,4);r('#e0cd98',-1,7,3,1);r(ink,0,8,2,1);
   // Small spines stay on the cheeks; clothing defines the torso silhouette.
   r(light,x+1,j-5,2,1);r(light,x+w-3,j-4,2,1);
   if(id==='nopal'){
    r(ink,-13,7,5,10);r(leather,-12,8,3,8);r('#a77a49',-12,9,3,2);r(gold,-11,13,1,1);
   }
  }else if(name==='boot'){
   // Visible trouser leg, knee, boot shaft and projecting toe. Shared soles
   // retain y=22, while stance width differs without changing collisions.
   const lx=f.legX,lw=f.legW,start=s?5:8;
   r(ink,lx,start,lw,12-start);r(s?'#374550':'#443b33',lx+1,start,lw-2,12-start);
   r('#7f6c50',lx+1,start+1,2,2);
   r(ink,lx-1,12,lw+1,8);r(leather,lx,13,lw-1,6);r('#80543a',lx+1,13,2,5);
   r(ink,lx-3,19,lw+4,3);r(b?'#6b716b':'#80543a',lx-2,19,lw+2,2);
   r(gold,lx,14,lw-2,1);r('#d3bd88',lx,15,2,2);
   if(b){r('#a4a18b',lx-2,19,lw+2,1);r(ink,lx+2,20,1,1);r(ink,lx+6,20,1,1)}
   if(s)r('#a5e5dd',lx-2,19,2,1);
   if(id==='nopal'){r(gold,lx-4,17,2,2);r('#e0cd98',lx-5,18,1,1)}
  }else if(name==='arm'){
   // Off hand has a visible cactus elbow, wrist and glove. The active arm is
   // attached separately to the equipped weapon by drawReach().
   const ax=b?-19:s?-12:rosa?-19:-17,ay=b?-6:s?-8:-7;
   r(ink,ax,ay,6,9);r(dark,ax+1,ay+1,4,7);r(green,ax+1,ay+1,3,6);
   r(light,ax+1,ay+2,2,2);r(ink,ax+2,ay+6,8,5);
   r(green,ax+3,ay+7,5,2);r(ink,ax+6,ay+3,5,6);
   r(b?'#a98150':leather,ax+7,ay+4,3,4);r(gold,ax+7,ay+4,2,1);
   r(light,ax-1,ay+3,2,1);
  }else if(name==='poncho'){
   if(id==='nopal'){
    // Diagonal, torn poncho exposes the fitted vest and the gun belt.
    r(ink,-13,-8,25,5);r(ink,-15,-5,13,6);r(ink,-13,0,10,5);r(ink,-10,4,7,5);
    r('#8c7955',-12,-7,22,3);r('#776849',-14,-4,11,5);r('#8c7955',-12,0,8,4);
    r('#776849',-9,4,5,3);r('#bda66a',-13,-2,10,1);r('#713e36',-12,-1,8,1);
    r('#bda66a',-11,2,6,1);r(ink,-10,6,2,3);r(ink,-6,5,1,2);
    r('#a77a49',3,-3,4,6);r(gold,4,-2,1,1);
   }else if(rosa){
    // Broad cropped jacket, exposed waist and very wide fighting stance.
    r(ink,-17,-8,33,6);r(ink,-13,-3,25,6);
    r('#8c7955',-16,-7,13,4);r('#776849',3,-7,12,4);
    r('#5e5340',-12,-3,23,4);r('#bda66a',-15,-6,7,1);
    r(leather,-8,-4,3,8);r(leather,7,-4,3,8);r('#bda66a',7,-2,2,1);
   }else if(b){
    // A short work apron and suspenders, rather than another cowboy poncho.
    r(ink,-14,-5,28,5);r('#8c7955',-13,-4,26,3);
    r(ink,-10,-1,20,9);r('#776849',-9,0,18,7);r('#8c7955',-8,0,7,6);
    r(leather,-9,-7,3,11);r(leather,7,-7,3,11);r(gold,-9,-1,3,2);r(gold,7,-1,3,2);
    r(ink,-4,1,9,5);r('#a27a4b',-3,2,7,3);r(gold,0,2,2,1);
   }else{
    // Narrow waist and two long, separated coat tails reveal the long legs.
    r(ink,-10,-8,20,5);r('#776849',-9,-7,8,3);r('#5e5340',2,-7,7,3);
    r(ink,-8,-3,5,11);r(ink,4,-3,5,10);r('#8c7955',-7,-3,3,9);r('#776849',5,-3,3,8);
    r(ink,-10,7,6,9);r('#776849',-9,7,4,7);r(ink,5,6,5,7);r('#5e5340',6,6,3,6);
    r('#a5e5dd',-8,8,1,4);r('#cb9860',5,-2,2,2);r('#a5e5dd',6,-2,1,1);
   }
  }else{
   const ey=f.eyeY,closed=name==='blink'||name==='hurt';
   // Compact eyes under a strong brow, a defined jaw and asymmetric mouth.
   r(green,x+2,ey-2,w-5,7);r(dark,x+w-5,ey-2,2,6);
   if(closed){r(ink,-5,ey+1,4,1);r(ink,3,ey+1,4,1)}
   else{
    r(ink,-6,ey-1,6,4);r(ink,2,ey-1,6,4);
    r('#e0d8a9',-5,ey,4,2);r('#e0d8a9',3,ey,4,2);
    r(ink,-3,ey,2,2);r(ink,5,ey,2,2);
    r(ink,-7,ey-3,3,1);r(ink,-4,ey-2,4,1);r(ink,2,ey-2,3,1);r(ink,5,ey-3,3,1);
   }
   const my=j-2;
   r(dark,-1,my-2,2,1);r(ink,-2,my,6,1);
   if(rosa){r('#e0d8a9',0,my-1,5,1);r(ink,4,my-2,2,1)}
   if(s){r(ink,3,my-1,3,1);r('#a5e5dd',x+w-3,my-1,1,2)}
   if(id==='nopal'){r('#bda66a',x+w-4,ey+2,1,3);r(ink,-4,my-1,2,1)}
   if(name==='attack'){
    if(id==='nopal'){
     // Deliberate squint and set jaw for the precise gunslinger.
     r(green,-5,ey,4,1);r(green,3,ey,4,1);r(ink,-6,ey-1,5,1);r(ink,2,ey-1,6,1);
     r(ink,-3,my,8,1);
    }else if(rosa){
     r(ink,-7,ey-1,5,1);r(ink,3,ey-1,6,1);
     r(ink,-2,my-2,9,4);r('#e0d8a9',-1,my-1,7,1);r(ink,2,my-1,1,1);
    }else if(b){
     r(ink,-3,my-1,9,3);r('#e0d8a9',-2,my-1,7,1);r(ink,4,my-2,2,1);
    }else{
     // A raised eyebrow and small knowing smile, with cyan reflected light.
     r(green,2,ey-2,5,1);r(ink,3,ey-3,5,1);r('#a5e5dd',4,ey+1,1,1);
     r(ink,1,my,5,1);r(ink,5,my-1,2,1);
    }
   }
   if(name==='hurt'){r(ink,0,my-1,3,3);r('#e0d8a9',1,my,1,1)}
  }
  return true;
 }
 function paintCharacter(name,r,id){
  if(['body','arm','boot','poncho','idle','walk','attack','hurt','blink'].includes(name))return paintFigure(name,r,id);
  if(id==='nopal'||name==='revolver'||name==='grip')return false;
  const b=id==='bento',s=id==='iris',w=b?14:s?8:13;
  if(name==='hat'){
   if(b){
    r(ink,-13,-31,26,11);r(ink,-9,-34,19,5);r('#5c4130',-12,-30,24,9);r('#725239',-8,-33,17,6);
    r('#876445',-7,-32,6,2);r('#302725',4,-31,6,8);
    r(ink,-22,-24,44,4);r('#725239',-21,-23,42,2);r('#a08055',-20,-23,13,1);
    r('#ad8a54',-11,-28,22,3);r('#e1c182',-2,-31,5,4);r('#6b5c40',-1,-30,3,2);
    r(ink,-16,-24,2,2);r(ink,15,-23,3,2);
   }else if(s){
    r(ink,-8,-38,14,5);r(ink,-11,-34,21,10);r('#3e2e29',-10,-33,19,9);
    r('#5c4130',-7,-37,12,7);r('#876445',-6,-36,3,2);r('#292b36',3,-34,5,8);
    r('#76527d',-10,-28,20,2);r('#ad80a0',-7,-28,9,1);
    r(ink,-20,-26,39,4);r(ink,17,-30,5,6);r('#725239',-19,-25,37,2);r('#876445',18,-29,3,3);
    r('#cb9860',7,-30,3,4);r('#a5efeb',8,-29,1,2);
   }else{
    r(ink,-14,-33,26,10);r(ink,-11,-37,17,7);r(ink,5,-35,6,4);
    r('#5c4130',-13,-32,24,8);r('#725239',-10,-36,15,7);r('#876445',-9,-35,6,2);
    r('#3e2e29',4,-33,6,8);r('#702c32',-13,-28,25,3);r('#c46a50',-11,-28,14,1);
    r(ink,-23,-27,46,5);r(ink,-26,-30,6,5);r('#725239',-22,-26,43,2);r('#876445',-25,-29,4,3);
    r('#c99668',-20,-26,10,1);r(gold,7,-28,3,3);
   }
  }else if(name==='scarf'){
   const y=b?-5:s?-9:-7;
   r('#48272d',-w+2,y,w*2-3,5);r('#a13e3c',-w+3,y,w*2-5,3);r('#c46a50',-w+4,y,6,1);
   r('#702c32',-3,y+3,7,4);r('#a13e3c',-2,y+3,4,2);
   r('#48272d',w-1,y+1,s?7:5,s?9:4);r('#a13e3c',w,y+1,s?5:4,s?7:2);r('#c46a50',w+1,y+1,2,1);
  }else if(name==='satchel'){
   if(b){
    r(ink,-23,0,14,16);r('#60432e',-22,1,12,13);r('#a27a4b',-21,2,10,4);r('#c3a26a',-18,5,4,4);r(leather,-17,6,2,2);
   }
  }else if(name==='signature'){
   if(b){
    for(let i=0;i<3;i++){r(ink,9+i*4,0,4,12);r('#ad493b',10+i*4,1,2,10);r('#df8355',10+i*4,1,1,6);r('#d0b37b',10+i*4,4,2,2);r('#bc9d68',10+i*4,-2,1,3)}
    // Large goggles sit on the face, with a bridge and asymmetrical reflections.
    r('#3a2c26',-13,-17,26,3);r(ink,-11,-18,10,8);r(ink,1,-18,10,8);
    r('#bf9658',-10,-17,8,6);r('#bf9658',2,-17,8,6);r('#253c3f',-9,-16,6,4);r('#253c3f',3,-16,6,4);
    r('#80a8a0',-8,-16,3,1);r('#80a8a0',4,-16,2,1);r('#e0cf96',-9,-15,1,2);r('#d7b97b',-1,-15,3,2);
   }else if(s){
    r(ink,-15,-1,7,13);r('#694e3c',-14,0,5,11);
    for(let i=0;i<4;i++){r('#c28a55',-15,1+i*2,7,1);r('#e2b57a',-14,1+i*2,2,1)}
    r('#a5e5dd',-13,1,2,8);r('#345e68',-13,4,2,2);
    r('#ab7b50',-9,6,4,2);r('#a5e5dd',-6,7,2,3);
    r('#cb9860',2,-1,4,3);r('#d9fff0',3,-1,1,1);
   }else{
    for(let i=0;i<6;i++){const x=-13+i*4,y=-5+i*2;r(ink,x-1,y-1,5,5);r('#ad8050',x,y,3,4);r('#ebcd8f',x,y,3,1);r('#754a37',x,y+3,3,1)}
    r(ink,-18,6,7,9);r(leather,-17,7,5,7);r('#c28d61',-16,8,3,1);
    r('#352831',10,-34,5,6);r('#ad5c58',9,-33,7,2);r('#e4c388',11,-35,2,6);
   }
  }else return false;
  return true;
 }
 for(const part of ['body','arm','boot','poncho'])bake(part,()=>{});
 bake('scarf',r=>{
  r('#48272d',-10,-7,20,5);r('#a13e3c',-9,-7,18,3);
  r('#c46a50',-7,-7,7,1);r('#702c32',-5,-3,10,3);r('#ae4e42',-3,-3,6,2);
  r('#48272d',10,-6,5,4);r('#a13e3c',11,-6,5,2);r('#c46a50',13,-6,2,1);
  r('#c1966b',-7,-5,1,1);r('#48272d',3,-6,2,1);
 });
 bake('hat',r=>{
  r(ink,-13,-34,25,11);r(ink,-11,-38,14,5);r(ink,3,-36,7,5);
  r('#3e2e29',-12,-33,23,9);r('#5c4130',-10,-37,12,6);r('#5c4130',2,-35,7,4);
  r('#725239',-9,-36,6,2);r('#49352b',1,-34,6,3);r('#2d2626',6,-32,4,6);
  r(ink,-2,-37,3,2);r('#a08055',-10,-35,1,3);
  r('#6d3d35',-11,-29,22,3);r('#a26c47',-9,-29,16,1);
  r(gold,6,-29,3,3);r('#e1c182',6,-29,2,1);
  r(ink,-21,-26,42,5);r(ink,-24,-28,7,3);r(ink,18,-29,6,4);
  r('#5c4130',-20,-25,39,2);r('#876445',-19,-25,12,1);
  r('#a08055',-23,-27,5,1);r('#725239',19,-28,4,2);
  r('#302725',-11,-22,25,2);r('#b1976c',-15,-24,2,1);r(ink,13,-24,2,2);
 });
 for(const expression of ['idle','walk','attack','hurt','blink'])bake(expression,()=>{});
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
 bake('signature',()=>{});
 bake('grip',(r,id)=>{
  r(ink,-3,-1,8,7);r(id==='bento'?'#886344':leather,-2,0,6,5);
  r(id==='bento'?'#c59b64':'#8a9a63',-1,0,4,2);r(gold,2,3,1,1);
 });
 bake('goggleBlink',(r,id)=>{
  if(id!=='bento')return;
  r('#253c3f',-9,-16,6,4);r('#253c3f',3,-16,6,4);
  r('#80a8a0',-9,-14,6,1);r('#80a8a0',3,-14,6,1);
 });
 bake('satchel',()=>{});
 bake('goggleAttack',(r,id)=>{
  if(id!=='bento')return;
  r('#253c3f',-9,-16,6,4);r('#253c3f',3,-16,6,4);
  r('#80a8a0',-6,-16,3,1);r('#80a8a0',6,-16,3,1);
  r('#e0cf96',-4,-15,1,2);r('#e0cf96',8,-15,1,2);
 });
 // Rotate a padded bitmap on a native-resolution surface, never vector
 // rectangles on the display context. Transparent padding keeps the rotated
 // image boundary away from the artwork. Both surfaces are reused every frame.
 const weaponSource=document.createElement('canvas'),weaponFrame=document.createElement('canvas');
 weaponSource.width=weaponSource.height=weaponFrame.width=weaponFrame.height=96;
 const sourceCtx=weaponSource.getContext('2d'),frameCtx=weaponFrame.getContext('2d');
 sourceCtx.imageSmoothingEnabled=frameCtx.imageSmoothingEnabled=false;
 function rasterWeapon(ctx,x,y,face,angle,anim,paint){
  sourceCtx.setTransform(1,0,0,1,0,0);sourceCtx.clearRect(0,0,96,96);
  sourceCtx.save();sourceCtx.translate(48,48);paint(sourceCtx);sourceCtx.restore();
  frameCtx.setTransform(1,0,0,1,0,0);frameCtx.clearRect(0,0,96,96);
  frameCtx.save();frameCtx.translate(48,48);frameCtx.scale(face,1);frameCtx.rotate(angle+anim.turn);
  // Snap the grip translation before rotation; final compositing is axis-aligned.
  frameCtx.translate(-Math.round(anim.kick),Math.round(anim.lift));
  frameCtx.drawImage(weaponSource,-48,-48);frameCtx.restore();
  ctx.imageSmoothingEnabled=false;ctx.drawImage(weaponFrame,Math.round(x)-48,Math.round(y)-48);
 }
 function drawGrip(ctx,id){ctx.imageSmoothingEnabled=false;ctx.drawImage(layers.get('grip:'+CharacterRoster.get(id).id),-32,-40)}
 function drawRevolver(ctx){ctx.imageSmoothingEnabled=false;ctx.drawImage(layers.get('revolver'),-32,-40)}
 const motion={
  nopal:{weight:1,breath:2.8,stride:2,lean:0,fire:-1,blink:4.7,offset:0},
  rosa:{weight:1.5,breath:3.2,stride:2,lean:2,fire:-2,blink:4.9,offset:.7},
  bento:{weight:2,breath:2.3,stride:1,lean:-1,fire:2,blink:4.3,offset:1.3},
  iris:{weight:.75,breath:3.8,stride:2,lean:0,fire:1,blink:5.1,offset:2}
 };
 function pose(p,t){
  const m=motion[CharacterRoster.get(p.characterId).id];
  const moving=!!p.visualMoving,phase=p.visualStride||0;
  const hurt=p.invuln>.84,recoil=Math.sin(Math.min(1,(p.attack||0)/.18)*Math.PI/2)*2;
  const squish=p.invuln>.94,blink=((t+m.offset)%m.blink)>m.blink-.14;
  return {moving,step:moving?Math.round(Math.sin(phase)*m.stride):0,
   bob:moving?-Math.round(Math.abs(Math.cos(phase))*m.weight):Math.round(Math.sin(t*m.breath+m.offset)*.65),
   sway:m.lean+(moving?Math.round(Math.sin(phase)*.65):0)+(hurt?0:Math.round(m.fire*recoil/2)),hurt,recoil,squish,
   hatKick:Math.min(2,Math.round(recoil*.65*m.weight)),handDrop:squish?1:0,
   flutter:Math.round(Math.sin(t*(m.breath+2)+(moving?phase:0)+m.offset)),
   expression:hurt?'hurt':p.attack>0?'attack':blink?'blink':moving?'walk':'idle'};
 }
 // One mount definition is shared by body reach and weapon placement. Gameplay
 // targeting and projectile origins stay in main.js and are never changed here.
 function mount(p,t,angle){
  const a=pose(p,t),face=p.facing<0?-1:1;
  return {x:Math.round(Math.cos(angle)*15+face*(a.sway-(a.hurt?1:0))),
   y:Math.round(-5+Math.sin(angle)*4+a.bob+a.handDrop)};
 }
 function drawReach(ctx,p,x,y,t,angle,anim,colorOverride){
  const a=pose(p,t),m=mount(p,t,angle),face=p.facing<0?-1:1;
  const local=Math.atan2(Math.sin(angle),Math.cos(angle)*face)+anim.turn;
  const hx=m.x+face*(-anim.kick*Math.cos(local)-anim.lift*Math.sin(local));
  const hy=m.y-anim.kick*Math.sin(local)+anim.lift*Math.cos(local)+2;
  const ax=face*(a.sway+9),ay=-7+a.bob;
  ctx.save();ctx.imageSmoothingEnabled=false;
  if(p.invuln>0&&Math.floor(p.invuln*14)%2)ctx.globalAlpha=.55;
  const color=colorOverride||skinRamps[CharacterRoster.get(p.characterId).id][1];
  // A bent elbow with square, one-pixel staircase edges instead of a straight
  // chain of overlapping stamps. Paint the complete outline before its fill.
  const ex=Math.round(ax+(hx-ax)*.45),ey=Math.round(Math.max(ay,hy)+3);
  for(let pass=0;pass<2;pass++)for(let limb=0;limb<2;limb++){
   const x1=limb?ex:ax,y1=limb?ey:ay,x2=limb?hx:ex,y2=limb?hy:ey;
   const n=Math.max(1,Math.ceil(Math.max(Math.abs(x2-x1),Math.abs(y2-y1))));
   ctx.fillStyle=pass?color:ink;
   for(let i=0;i<=n;i++){
    const px=Math.round(x+x1+(x2-x1)*i/n),py=Math.round(y+y1+(y2-y1)*i/n);
    ctx.fillRect(px-(pass?1:2),py-(pass?1:2),pass?3:5,pass?3:5);
   }
  }
  ctx.restore();
 }
 function draw(ctx,p,x,y,t){
  if(typeof NopalSprite!=='undefined'&&NopalSprite.draw(ctx,p,x,y,t))return;
  if(typeof RosaSprite!=='undefined'&&RosaSprite.draw(ctx,p,x,y,t))return;
  if(typeof IrisSprite!=='undefined'&&IrisSprite.draw(ctx,p,x,y,t))return;
  if(typeof BentoSprite!=='undefined'&&BentoSprite.draw(ctx,p,x,y,t))return;
  const a=pose(p,t),face=p.facing<0?-1:1,hero=CharacterRoster.get(p.characterId).id;
  ctx.save();ctx.imageSmoothingEnabled=false;ctx.translate(Math.round(x),Math.round(y));
  ctx.fillStyle='#10172099';ctx.fillRect(-14,17,28,5);ctx.fillRect(-18,18,36,3);
  if(p.invuln>0&&Math.floor(p.invuln*14)%2)ctx.globalAlpha=.55;
  ctx.scale(face,1);
  const layer=(name,dx=0,dy=0,mirror=false)=>{
   ctx.save();ctx.translate(Math.round(dx),Math.round(dy));if(mirror)ctx.scale(-1,1);
   ctx.drawImage(layers.get(name+(a.squish&&name!=='boot'?'-impact':'')+':'+hero),-32,-40);ctx.restore();
  };
  // Lift only the swinging foot; the planted sole retains its ground anchor.
  layer('boot',0,Math.min(0,a.step));layer('boot',1,Math.min(0,-a.step),true);
  ctx.translate(a.sway-(a.hurt?1:0),a.bob);
  layer('arm',0,-Math.round(a.step*.5));
  layer('body');layer('poncho',0,a.moving?a.step>0?1:0:0);
  layer(a.expression);layer('scarf',0,a.flutter>0?1:0);
  layer('hat',-a.hatKick,(!a.moving&&a.bob>0?-1:0)-a.hatKick);
  if(hero==='bento')layer('satchel',a.moving?-Math.round(a.step*.5):0,a.moving?Math.round(a.step*.5):0);
  layer('signature');
  if(hero==='bento'&&(a.expression==='blink'||a.hurt))layer('goggleBlink');
  if(hero==='bento'&&a.expression==='attack')layer('goggleAttack');
  if(hero==='iris'&&Math.floor(t*8)%7===0){ctx.fillStyle='#a5e5dd';ctx.fillRect(-17,0,2,1);ctx.fillRect(-16,-2,1,2)}
  // Short impact glints, independent of particles, collisions and invulnerability.
  if(a.hurt){ctx.fillStyle='#efd5a0';ctx.fillRect(-21,-18,3,1);ctx.fillRect(-19,-22,1,2)}
  ctx.restore();return a;
 }
 return {draw,pose,mount,drawReach,drawGrip,drawRevolver,rasterWeapon};
})();
