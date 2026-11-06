/* Elemental builds. Secondary damage never re-enters onHit; all clocks use
   game.time, all spread/chain/reaction loops have hard limits. No dependencies. */
const ElementSystem=(()=>{
 'use strict';
 const elements={
  fire:{name:'Fogo',icon:'♨',color:'#ed8650'},ice:{name:'Gelo',icon:'❄',color:'#93d6e6'},
  electric:{name:'Eletricidade',icon:'ϟ',color:'#f4d573'},poison:{name:'Veneno',icon:'☣',color:'#a4c96c'}
 };
 const definitions=[
  ['fire_1','Pólvora Ardente','fire',2,[],'38% de chance base de queimar por 3,5 s. Até 3 acúmulos; 6 dano/s por acúmulo.'],
  ['fire_2','Brasa Persistente','fire',4,['fire_1'],'Queimaduras duram 5 s, causam 8 dano/s e acumulam até 5 vezes.'],
  ['fire_3','Forja do Deserto','fire',7,['fire_2'],'Fogo aplica com 50% de chance base e causa 10 dano/s por acúmulo.'],
  ['ice_1','Chumbo Frio','ice',2,[],'32% de chance base de gelar por 2 s: -25% velocidade. Quatro aplicações congelam por 0,5 s.'],
  ['ice_2','Geada Profunda','ice',4,['ice_1'],'Três aplicações congelam por 1 s. Lentidão aumenta para 40%. Chefes resistem.'],
  ['ice_3','Inverno do Oeste','ice',7,['ice_2'],'Gelo aplica com 44% de chance base e dura 3 s. Congelamento dura 1,3 s.'],
  ['electric_1','Faísca de Cobre','electric',2,[],'24% de chance base de descarregar 8 de dano e saltar para até 2 inimigos a 150 px.'],
  ['electric_2','Condutor de Cobre','electric',4,['electric_1'],'Descargas causam 12 de dano e saltam para até 3 inimigos a 180 px.'],
  ['electric_3','Dínamo do Oeste','electric',7,['electric_2'],'Eletricidade aplica com 34% de chance base; descargas causam 16 de dano.'],
  ['poison_1','Bala de Cascavel','poison',2,[],'38% de chance base de envenenar por 5 s. Até 4 acúmulos; 4 dano/s por acúmulo.'],
  ['poison_2','Colônia Fúngica','poison',4,['poison_1'],'Veneno acumula até 6 vezes. Mortes contaminam até 3 vizinhos a 95 px; até 2 gerações.'],
  ['poison_3','Sangue de Cascavel','poison',7,['poison_2'],'Veneno aplica com 50% de chance base, dura 7 s e causa 6 dano/s por acúmulo.'],
  ['infernal','Tempestade Infernal','fire',6,['fire_2','electric_2'],'Raios em alvos queimando têm 35% de chance de explodir: 18 dano em 72 px. Intervalo de 1,5 s.','electric'],
  ['combustion','Combustão Tóxica','fire',6,['fire_2','poison_2'],'Fogo + veneno: 40% de chance de explodir: 14 dano em 90 px, espalhando os dois efeitos. Intervalo de 2,4 s.','poison'],
  ['shards','Estilhaços Condutores','ice',6,['ice_2','electric_2'],'Raios em alvos congelados soltam até 4 fragmentos: 14 dano em vizinhos a 155 px. Intervalo de 1,1 s.','electric'],
  ['plague','Praga Cristalizada','ice',6,['ice_2','poison_2'],'Alvos congelados e envenenados recebem fragilidade: +30% de todo dano enquanto os dois efeitos durarem.','poison']
 ].map(([id,name,element,minLevel,requires,desc,partner])=>({id,name,element,minLevel,requires,desc,partner,
  synergy:!!partner,rarity:partner?'Épica':id.endsWith('_1')?'Incomum':id.endsWith('_2')?'Rara':'Épica'}));
 const byId=Object.fromEntries(definitions.map(d=>[d.id,d]));
 const limits={effects:96,numbers:240,reactions:12,targets:6,spreadDepth:2,tick:.5,procInterval:.28};
 function create(){return {owned:{},active:0,seed:0x43544353,fx:[],budget:limits.reactions}}
 function has(g,id){return !!g.elements?.owned[id]}
 function canSelect(g,id){const d=byId[id];return !!d&&!has(g,id)&&g.level>=d.minLevel&&d.requires.every(r=>has(g,r))}
 function select(g,id){if(!canSelect(g,id))return false;g.elements.owned[id]=true;g.elements.active++;return true}
 function cards(g){return definitions.filter(d=>canSelect(g,d.id)).map(d=>({...d,elementalId:d.id,
  icon:d.synergy?'✧':elements[d.element].icon,color:elements[d.element].color,
  weight:d.synergy?40:d.id.endsWith('_1')?32:d.id.endsWith('_2')?36:24,apply:game=>select(game,d.id)}))}
 function random(g){const s=g.elements;s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;return s.seed/4294967296}
 function state(e){return e.elementState||=( {gates:{},reactions:{},ice:{hits:0,chillUntil:0,frozenUntil:0,nextFreeze:0}} )}
 function alive(e){return e.hp>0}
 function active(status,t){return status&&status.until>t&&status.stacks>0}
 function deathStatus(g,e,key){const s=e.elementState;return active(s?.[key],g.time)?s[key]:!alive(e)?s?.[key+'AtDeath']:null}
 function frozen(g,e){return (e.elementState?.ice.frozenUntil||0)>g.time}
 function multiplier(g,e){const s=e.elementState;return s&&has(g,'plague')&&frozen(g,e)&&active(s.poison,g.time)?1.3:1}
 function speed(g,e){const s=e.elementState;if(!s)return 1;if(frozen(g,e))return 0;
  return s.ice.chillUntil>g.time?1-(e.boss?.15:has(g,'ice_2')?.4:.25):1}
 function fx(g,type,e,other=null,r=0){const list=g.elements.fx;
  list.push({type,x:e.x,y:e.y,x2:other?.x,y2:other?.y,r,start:g.time});
  if(list.length>limits.effects)list.splice(0,list.length-limits.effects);
 }
 function apply(g,e,element,generation=0){
  if(!alive(e)||!has(g,element+'_1'))return false;
  const s=state(e),t=g.time;
  if(element==='fire'||element==='poison'){
   const fire=element==='fire',key=fire?'burn':'poison',old=s[key],ongoing=active(old,t);
   const cap=fire?(has(g,'fire_2')?5:3):(has(g,'poison_2')?6:4);
   const duration=fire?(has(g,'fire_2')?5:3.5):(has(g,'poison_3')?7:5);
   s[key]={stacks:Math.min(cap,(ongoing?old.stacks:0)+1),until:t+duration,
    next:ongoing?old.next:t+limits.tick,generation:ongoing?Math.min(old.generation,generation):generation};
   fx(g,element,e);
  }else if(element==='ice'){
   const ice=s.ice;if(ice.chillUntil<=t)ice.hits=0;
   ice.chillUntil=t+(has(g,'ice_3')?3:2);
   if(t>=ice.nextFreeze){ice.hits++;
    if(ice.hits>=(has(g,'ice_2')?3:4)){
     const duration=e.boss?.25:has(g,'ice_3')?1.3:has(g,'ice_2')?1:.5;
     ice.frozenUntil=t+duration;ice.nextFreeze=t+(e.boss?4:2)+duration;ice.hits=0;
     fx(g,'freeze',e,null,e.r+6);
    }
   }
   fx(g,'ice',e);
  }
  if(multiplier(g,e)>1&&(s.plagueVfxUntil||0)<=t){s.plagueVfxUntil=t+.6;fx(g,'plague',e,null,e.r+9)}
  return true;
 }
 function neighbors(g,e,r,max,visit){let count=0;for(const other of g.enemies){
  if(other===e||!alive(other)||Math.hypot(other.x-e.x,other.y-e.y)>r+other.r)continue;
  visit(other);if(++count>=max)break;
 }}
 function spend(g,e,key,cd){const s=state(e),t=g.time;
  if(g.elements.budget<=0||(s.reactions[key]||0)>t)return false;
  s.reactions[key]=t+cd;g.elements.budget--;return true;
 }
 function secondary(g,e,amount,damage){if(alive(e))damage(e,amount*g.player.damage,false,'element')}
 function lightningReactions(g,e,damage){
  const s=e.elementState;if(!s)return;
  if(has(g,'infernal')&&active(s.burn,g.time)&&(s.reactions.infernal||0)<=g.time&&g.elements.budget>0&&random(g)<.35&&spend(g,e,'infernal',1.5)){
   fx(g,'infernal',e,null,72);secondary(g,e,18,damage);neighbors(g,e,72,limits.targets,o=>secondary(g,o,18,damage));
  }
  if(has(g,'shards')&&frozen(g,e)&&spend(g,e,'shards',1.1)){
   fx(g,'shards',e,null,e.r+12);neighbors(g,e,155,4,o=>{fx(g,'shard',e,o);secondary(g,o,14,damage)});
  }
 }
 function discharge(g,e,damage){
  if(!spend(g,e,'electric',.45))return;
  const hit=new Set([e]),base=has(g,'electric_3')?16:has(g,'electric_2')?12:8;
  let from=e;fx(g,'electric',g.player,e);lightningReactions(g,e,damage);secondary(g,e,base,damage);
  for(let i=0;i<(has(g,'electric_2')?3:2);i++){
   let next=null,best=has(g,'electric_2')?180:150;
   for(const o of g.enemies){if(!alive(o)||hit.has(o))continue;const d=Math.hypot(o.x-from.x,o.y-from.y);if(d<best){best=d;next=o}}
   if(!next)break;hit.add(next);fx(g,'electric',from,next);lightningReactions(g,next,damage);secondary(g,next,base,damage);from=next;
  }
 }
 function combustion(g,e,damage){
  const s=e.elementState,poison=deathStatus(g,e,'poison');
  if(!has(g,'combustion')||!s||!poison||!deathStatus(g,e,'burn')||poison.generation>=limits.spreadDepth)return;
  if((s.reactions.combustion||0)>g.time||g.elements.budget<=0||random(g)>=.4||!spend(g,e,'combustion',2.4))return;
  fx(g,'combustion',e,null,90);secondary(g,e,14,damage);
  neighbors(g,e,90,limits.targets,o=>{secondary(g,o,14,damage);apply(g,o,'fire');apply(g,o,'poison',poison.generation+1)});
 }
 function onHit(g,e,source,damage){
  if(!g.elements?.active||!g.weapons[source])return;
  // Native lasso discharges may trigger selected lightning synergies, too.
  if(source==='lasso')lightningReactions(g,e,damage);
  if(!alive(e))return;
  const s=state(e),t=g.time;if((s.gates[source]||0)>t)return;s.gates[source]=t+limits.procInterval;
  const w=g.weapons[source],multi=['shotgun','rain','thorns','lasso','meteor'].includes(source)?1/Math.sqrt(Math.max(1,w.qty)):1;
  const area=['dynamite','meteor','thorns','solar'].includes(source)?.8:1;
  if(has(g,'fire_1')&&random(g)<(has(g,'fire_3')?.5:.38)*multi*area)apply(g,e,'fire');
  if(has(g,'ice_1')&&random(g)<(has(g,'ice_3')?.44:.32)*multi*area)apply(g,e,'ice');
  if(has(g,'poison_1')&&random(g)<(has(g,'poison_3')?.5:.38)*multi*area)apply(g,e,'poison');
  combustion(g,e,damage);
  if(has(g,'electric_1')&&random(g)<(has(g,'electric_3')?.34:.24)*multi*area)discharge(g,e,damage);
 }
 function tick(g,dt,damage){
  if(!g.elements?.active)return;
  const t=g.time;g.elements.budget=limits.reactions;g.elements.fx=g.elements.fx.filter(f=>t-f.start<.6);
  for(const e of g.enemies){const s=e.elementState;if(!s||!alive(e))continue;
   for(const key of ['burn','poison']){
    if(!alive(e))break;
    const d=s[key];if(!d)continue;
    // Integrate fixed ticks through expiration, independent of frame length.
    let ticks=0;while(d.next<=Math.min(t,d.until)&&ticks<4){
     const per=key==='burn'?(has(g,'fire_3')?5:has(g,'fire_2')?4:3):(has(g,'poison_3')?3:2);
     secondary(g,e,per*d.stacks,damage);d.next+=limits.tick;ticks++;
     if(!alive(e)){s[key+'AtDeath']={...d};break;}
    }
    if(d.until<=t)s[key]=null;
   }
  }
 }
 function resolveDeaths(g,damage){
  if(!g.elements?.active)return;
  // At most three generations; snapshot cleanup in main.js runs afterwards,
  // so enemies killed by a reaction still award XP, loot and boss rewards once.
  for(let round=0;round<=limits.spreadDepth;round++){
   let found=false;
   for(const e of g.enemies){const s=e.elementState;if(alive(e)||!s||s.deathHandled)continue;
    s.deathHandled=true;found=true;combustion(g,e,damage);
    const poison=deathStatus(g,e,'poison');
    if(has(g,'poison_2')&&poison&&poison.generation<limits.spreadDepth&&spend(g,e,'spread',1)){
     const generation=poison.generation+1;fx(g,'spread',e,null,95);
     neighbors(g,e,95,3,o=>apply(g,o,'poison',generation));
    }
   }
   if(!found)break;
  }
 }
 return {elements,definitions,byId,limits,create,has,canSelect,select,cards,apply,onHit,tick,resolveDeaths,
  frozen,speed,multiplier,discharge,lightningReactions};
})();
