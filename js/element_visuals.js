/* Pixel overlays and build cards. Pure rendering: no combat randomness/state. */
const ElementVisuals=(()=>{
 'use strict';const TAU=Math.PI*2;
 function pixel(g,c,x,y,w=2,h=w){g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),w,h)}
 function ring(g,x,y,r,c,phase=0,count=24){for(let i=0;i<count;i++){
  const a=TAU*i/count+phase;pixel(g,c,x+Math.cos(a)*r,y+Math.sin(a)*r,2);
 }}
 function line(g,x1,y1,x2,y2,c,width=2,jitter=0,phase=0){
  const dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy)||1,n=Math.min(90,Math.max(1,Math.ceil(len/3)));
  for(let i=0;i<=n;i++){const u=i/n,off=Math.sin(i*2.3+phase)*Math.sin(u*Math.PI)*jitter;
   pixel(g,c,x1+dx*u-dy/len*off,y1+dy*u+dx/len*off,width);
  }
 }
 function world(g,game,sx,sy){
  if(!game.elements?.active)return;const t=game.time;
  g.save();g.imageSmoothingEnabled=false;
  for(const e of game.enemies){const s=e.elementState;if(!s||e.hp<=0)continue;
   const x=sx(e.x),y=sy(e.y),frozen=ElementSystem.frozen(game,e);
   if(s.burn?.until>t){for(let i=0;i<3;i++){
    const phase=(t*4+i*.31)%1,xx=x-7+i*6+Math.sin(i+t*10)*2,yy=y+6-phase*18;
    pixel(g,'#c65239',xx-1,yy,4,5);pixel(g,'#ffc477',xx,yy,2,3);
   }}
   if(s.poison?.until>t){
    g.save();g.globalAlpha=.7;pixel(g,'#63894d',x-8,y+8,17,3);g.restore();
    for(let i=0;i<2;i++){const phase=(t*1.6+i*.5)%1;pixel(g,'#b3d67a',x+Math.sin(t*2+i*3)*9,y-phase*20,3,3)}
   }
   if(s.ice.chillUntil>t){
    const color=frozen?'#d1f7f3':'#76acbc';
    for(let i=0;i<(frozen?6:3);i++){const a=i*TAU/(frozen?6:3);pixel(g,color,x+Math.cos(a)*(e.r*.75),y+Math.sin(a)*e.r*.7,2,5)}
    if(frozen){line(g,x-10,y+8,x+9,y+8,'#94cfdf',2);pixel(g,'#e2f7ed',x-3,y-15,2,5)}
   }
   if(ElementSystem.multiplier(game,e)>1){ring(g,x,y,e.r+6,'#c3a3ee',t*.6,12);pixel(g,'#e0e5f6',x-3,y-e.r-13,6,2)}
  }
  for(const f of game.elements.fx){
   const age=t-f.start;if(age<0||age>.6)continue;const x=sx(f.x),y=sy(f.y),u=age/.6;
   g.globalAlpha=1-u;
   if(f.type==='electric'||f.type==='shard'){
    const x2=sx(f.x2),y2=sy(f.y2),c=f.type==='shard'?'#afc8f5':'#f3d278';
    line(g,x,y,x2,y2,c,3,f.type==='shard'?0:4,Math.floor(t*24));
    line(g,x,y,x2,y2,'#f0fff7',1,f.type==='shard'?0:4,Math.floor(t*24));
   }else if(f.type==='infernal'){
    ring(g,x,y,f.r*Math.min(1,age/.15),'#ef8a4b',age);
    ring(g,x,y,f.r*.7*Math.min(1,age/.15),'#f1d778',-age,16);
    for(let i=0;i<5;i++){const a=i*TAU/5;line(g,x,y,x+Math.cos(a)*f.r*u,y+Math.sin(a)*f.r*u,'#ffe798',2,4,t*20)}
   }else if(f.type==='combustion'){
    ring(g,x,y,f.r*Math.min(1,age/.2),'#aece71',age,20);
    for(let i=0;i<8;i++){const a=i*TAU/8,r=f.r*u;pixel(g,i%2?'#ed8b4f':'#a4c96c',x+Math.cos(a)*r,y+Math.sin(a)*r,4,5)}
   }else if(f.type==='shards'||f.type==='freeze'){
    for(let i=0;i<6;i++){const a=i*TAU/6,r=f.r+u*14;line(g,x+Math.cos(a)*r,y+Math.sin(a)*r,x+Math.cos(a)*(r+6),y+Math.sin(a)*(r+6),'#bbe9ef',2)}
   }else if(f.type==='plague'){
    ring(g,x,y,f.r+u*8,'#bb9ce2',t,16);ring(g,x,y,f.r*.7,'#b6d38d',-t,12);
   }else if(f.type==='spread'){
    ring(g,x,y,f.r*u,'#9ec46c',t,16);
   }else{
    const colors={fire:'#f1a568',ice:'#b2e0ec',poison:'#b0cc79'};
    pixel(g,colors[f.type]||'#e9d18b',x+Math.sin(t*9+f.x)*7,y-8-u*16,3,3);
   }
  }
  g.restore();
 }
 const glyphs={
  fire:['00100','01100','11101','11111','01110'],ice:['10101','01110','11111','01110','10101'],
  electric:['00111','01110','11100','00110','01100'],poison:['01110','10101','11111','01110','10101']
 };
 function icon(g,id,x,y,color,scale=3){const glyph=glyphs[id];if(!glyph)return;
  glyph.forEach((row,yy)=>[...row].forEach((v,xx)=>{if(v==='1')pixel(g,color,x+xx*scale,y+yy*scale,scale,scale)}));
 }
 function hud(g,game,W){
  const s=game.elements;if(!s?.active)return;
  const ids=Object.keys(ElementSystem.elements),compact=W<850,width=compact?120:232,left=compact?W-132:W/2-width/2,top=compact?103:57;
  g.save();pixel(g,'#1e2127dc',left,top,width,compact?72:42);g.font='11px Georgia';g.textAlign='left';
  ids.forEach((id,i)=>{const info=ElementSystem.elements[id],x=left+6+(compact?i%2*width/2:i*width/4),y=top+7+(compact?Math.floor(i/2)*18:0);
   const rank=[1,2,3].filter(n=>s.owned[id+'_'+n]).length;
   icon(g,id,x,y,rank?info.color:'#58605a',2);g.fillStyle=rank?'#ede1bc':'#758078';g.fillText(String(rank),x+14,y+10);
  });
  g.fillStyle='#cdb18c';g.font='10px Georgia';
  const names=ElementSystem.definitions.filter(d=>d.synergy&&s.owned[d.id]);
  const row=top+(compact?61:34);
  g.fillText((compact?'SIN. ':'SINERGIAS: ')+names.length,left+7,row);
  names.forEach((d,i)=>{
   const x=left+(compact?42:88)+i*(compact?18:32);
   icon(g,d.element,x,row-7,ElementSystem.elements[d.element].color,1);
   icon(g,d.partner,x+7,row-7,ElementSystem.elements[d.partner].color,1);
  });g.restore();
 }
 function wrapped(g,text,x,y,width,lineH,maxLines){
  const words=text.split(' '),lines=[];let current='';
  for(const word of words){const candidate=current?current+' '+word:word;
   if(current&&g.measureText(candidate).width>width){lines.push(current);current=word}else current=candidate;
  }
  if(current)lines.push(current);
  lines.slice(0,maxLines).forEach((line,i)=>g.fillText(i===maxLines-1&&lines.length>maxLines?line+'…':line,x,y+i*lineH));
  return Math.min(lines.length,maxLines)*lineH;
 }
 function card(g,rect,c,hover,index){
  const {x,y,w,h}=rect,info=ElementSystem.elements[c.element],partner=ElementSystem.elements[c.partner];
  const rarityColors={Comum:'#b9a17c',Incomum:'#75bf7a',Rara:'#5aafe0',Épica:'#bd7bea',Lendária:'#e5aa44'};
  const color=info?.color||rarityColors[c.rarity]||'#c8ae79',small=w<150,center=x+w/2;
  g.save();g.beginPath();g.rect(x,y,w,h);g.clip();
  pixel(g,hover?'#3c342b':'#242a2d',x,y,w,h);
  pixel(g,c.synergy?'#d9b96e':color,x,y,w,3);pixel(g,color,x,y,2,h);
  pixel(g,partner?.color||color,x+w-2,y,2,h);pixel(g,c.synergy?'#d9b96e':color,x,y+h-3,w,3);
  if(c.synergy){pixel(g,'#65503e',x+5,y+5,w-10,2);pixel(g,'#65503e',x+5,y+h-7,w-10,2)}
  g.textAlign='center';g.fillStyle=color;g.font=`bold ${small?9:11}px Georgia`;
  g.fillText((c.synergy?'SINERGIA · ':'')+c.rarity.toUpperCase(),center,y+22);
  const glyphSize=small?3:4,iconY=y+34;
  if(info){icon(g,c.element,center-(partner?24:10),iconY,color,glyphSize);if(partner)icon(g,c.partner,center+5,iconY,partner.color,glyphSize)}
  else {g.font=`bold ${small?24:32}px Georgia`;g.fillText(c.icon||'✦',center,iconY+21)}
  g.fillStyle='#bba98e';g.font=`${small?9:11}px Georgia`;
  wrapped(g,info?(info.name+(partner?' + '+partner.name:'')):'Equipamento do Oeste',center,y+73,w-14,12,2);
  const compact=h<290,titleFont=small?12:16,lineH=small?15:19;
  g.fillStyle='#f3e5bf';g.font=`bold ${titleFont}px Georgia`;
  const titleY=y+(compact?93:102),titleHeight=wrapped(g,c.name,center,titleY,w-20,lineH,3);
  g.fillStyle='#d6ccba';g.font=`${small?10:13}px Georgia`;
  const descY=titleY+titleHeight+12,reqTop=y+h-(c.elementalId?(small?95:77):42);
  const descLine=small?13:16,maxLines=Math.max(2,Math.floor((reqTop-descY-7)/descLine));
  wrapped(g,c.desc,center,descY,w-20,descLine,maxLines);
  if(c.elementalId){
   pixel(g,'#1c2226',x+6,reqTop,w-12,h-(reqTop-y)-29);
   g.fillStyle='#c9b482';g.font=`bold ${small?9:10}px Georgia`;g.fillText('PRÉ-REQUISITOS',center,reqTop+13);
   const req=c.requires.length?c.requires.map(id=>ElementSystem.byId[id].name).join(' + '):'Sem melhoria anterior';
   g.font=`${small?9:11}px Georgia`;wrapped(g,req+' · nível '+c.minLevel,center,reqTop+27,w-18,small?11:13,small?5:3);
  }
  g.fillStyle=hover?'#fff0b8':'#d7b77d';g.font=`bold ${small?10:12}px Georgia`;g.fillText(`[${index+1}] ESCOLHER`,center,y+h-13);g.restore();
 }
 return {world,hud,card,icon};
})();
