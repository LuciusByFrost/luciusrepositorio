/* Professor Isac: local progression and responsive UI. No network dependencies. */
(() => {
 'use strict';
 const KEY='cactus-isac-save',MAX=Number.MAX_SAFE_INTEGER;
 const upgrades=[
  {id:'overclock',name:'Overclock',effect:'+3% de dano',base:150},
  {id:'turbo',name:'Processador Turbo',effect:'+2% de movimento',base:150},
  {id:'ram',name:'Memória RAM',effect:'+5 de vida máxima',base:150},
  {id:'firewall',name:'Firewall',effect:'+2 pontos percentuais de defesa',base:200},
  {id:'network',name:'Rede Otimizada',effect:'+2% de velocidade de ataque',base:200},
  {id:'collector',name:'Coletor de Dados',effect:'+5% de alcance de coleta',base:125}
 ];
 const dialogue={opening:'Vamos ver se você entende de informática, parceiro!',correct:'Mandou bem, cowboy! Conhecimento é poder!',wrong:'Quase, parceiro! Mas olha só a explicação.',shop:'Chegue mais, forasteiro! Tenho uns upgrades de primeira!',bought:'Boa escolha! Agora você tá mais preparado pro deserto.',poor:'Tá faltando uns Bits aí, parceiro. Volta depois!',max:'Esse equipamento já tá no máximo, cowboy!'};
 const integer=(n,max=MAX)=>typeof n==='number'&&Number.isFinite(n)?Math.min(max,Math.max(0,Math.floor(n))):0;
 function normalize(value){return {version:1,bits:integer(value?.bits),levels:Object.fromEntries(upgrades.map(u=>[u.id,integer(value?.levels?.[u.id],5)]))}}
 let state;try{state=normalize(JSON.parse(localStorage.getItem(KEY)||'{}'))}catch{state=normalize({})}
 const awarded=new WeakMap(),applied=new WeakSet();
 const snapshot=()=>({...state,levels:{...state.levels}});
 function commit(next){try{localStorage.setItem(KEY,JSON.stringify(next));state=next;return true}catch{return false}}
 function price(id){const u=upgrades.find(u=>u.id===id);return u&&state.levels[id]<5?Math.ceil(u.base*1.8**state.levels[id]):null}
 function purchase(id){
  const cost=price(id);if(!upgrades.some(u=>u.id===id))return{ok:false,message:'Equipamento desconhecido.'};
  if(cost===null)return{ok:false,message:dialogue.max};
  if(state.bits<cost)return{ok:false,message:dialogue.poor};
  const next=snapshot();next.bits-=cost;next.levels[id]++;
  return commit(next)?{ok:true,message:dialogue.bought}:{ok:false,message:'Não foi possível salvar. A compra não foi realizada.'};
 }
 const rewards=Object.freeze({enemy:1,boss:50,quiz:25,victory:150});
 function reward(kind,token){
  if(!Object.hasOwn(rewards,kind)||!token||typeof token!=='object')return false;
  const seen=awarded.get(token);if(seen?.has(kind))return false;
  const next=snapshot();next.bits=Math.min(MAX,next.bits+rewards[kind]);
  if(!commit(next))return false;
  const kinds=seen||new Set();kinds.add(kind);awarded.set(token,kinds);return true;
 }
 function apply(g){
  if(!g?.player||applied.has(g))return false;
  const p=g.player,l=state.levels;
  p.damage*=1+.03*l.overclock;p.speed*=1+.02*l.turbo;p.attackSpeed*=1+.02*l.network;p.magnet*=1+.05*l.collector;
  if(g.difficulty==='nohit'){p.hp=p.maxHp=1;p.armor=0;p.regen=0}
  else{p.hp+=5*l.ram;p.maxHp+=5*l.ram;p.armor=Math.min(.35,Math.max(0,p.armor)+.02*l.firewall)}
  applied.add(g);return true;
 }
 // Art is opt-in: populate ISAC_ART only after inspecting/extracting the approved
 // source. Missing assets cause no requests and no substitute cowboy artwork.
 const art=globalThis.ISAC_ART||{},images={};
 if(typeof Image==='function')for(const [name,path] of Object.entries(art)){
  if(!['idle','talk','sell','portrait','happy','surprised','shop'].includes(name))continue;
  const image=new Image();images[name]={image,state:'loading',path};
  image.onload=()=>{images[name].state=image.naturalWidth>0&&image.naturalHeight>0?'ready':'error'};
  image.onerror=()=>{images[name].state='error'};image.src=path;
 }
 function artStatus(){return Object.fromEntries(Object.entries(images).map(([k,v])=>[k,{state:v.state,path:v.path,width:v.image.naturalWidth||0,height:v.image.naturalHeight||0}]))}
 function mount(actions){
  const shell=document.querySelector('#shell');if(!shell?.appendChild)return null;
  const root=document.createElement('section');root.id='isac-panel';root.hidden=true;root.setAttribute('aria-label','Professor Isac');root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');shell.appendChild(root);
  let current='',quizRef=null,quizAnswered=false,pending=null,message=dialogue.shop,lastArt='';
  function el(tag,text,className){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(className)n.className=className;return n}
  function button(text,fn){const b=el('button',text);b.type='button';b.addEventListener('click',fn);return b}
  function portrait(kind){
   const aside=el('aside',undefined,'isac-portrait');
   // The approved portrait is preferred; expressions only replace it when ready.
   const sprite=images[kind]?.state==='ready'?images[kind]:kind==='shop'&&images.sell?.state==='ready'?images.sell:images.portrait?.state==='ready'?images.portrait:null;
   if(sprite){const img=el('img');img.src=sprite.image.src;img.alt='Professor Isac — O Cowboy do Conhecimento';img.width=sprite.image.naturalWidth;img.height=sprite.image.naturalHeight;aside.appendChild(img)}
   else aside.appendChild(el('span','Professor Isac'));
   aside.appendChild(el('small','O Cowboy do Conhecimento'));return aside;
  }
  function frame(title){root.replaceChildren();const box=el('div',undefined,'isac-wood');root.appendChild(box);box.appendChild(el('h1',title));return box}
  function renderShop(){
   const box=frame('LOJA DO ISAC'),header=el('div',undefined,'isac-shop-header');header.appendChild(portrait('shop'));const intro=el('div');intro.appendChild(el('h2','Professor Isac'));intro.appendChild(el('p',`${state.bits.toLocaleString('pt-BR')} Bits disponíveis`,'isac-balance'));header.appendChild(intro);box.appendChild(header);
   const say=el('p',message,'isac-dialogue');say.setAttribute('role','status');box.appendChild(say);
   const grid=el('div',undefined,'isac-upgrades');
   for(const u of upgrades){const card=el('article',undefined,'isac-upgrade'),level=state.levels[u.id],cost=price(u.id);card.appendChild(el('h2',u.name));card.appendChild(el('p',`${u.effect} por nível · Nível ${level}/5`));
    card.appendChild(button(cost===null?'Nível máximo':`Comprar · ${cost} Bits`,()=>{if(cost===null){message=dialogue.max;renderShop();return}if(state.bits<cost){message=dialogue.poor;renderShop();return}pending=u.id;renderShop()}));
    if(pending===u.id){const confirmation=el('div',undefined,'isac-confirm');confirmation.setAttribute('role','group');confirmation.appendChild(el('p',`Confirmar ${u.name} por ${cost} Bits?`));confirmation.appendChild(button('Confirmar compra',()=>{message=purchase(u.id).message;pending=null;renderShop()}));confirmation.appendChild(button('Cancelar',()=>{pending=null;renderShop()}));card.appendChild(confirmation)}
    grid.appendChild(card);
   }
   box.appendChild(grid);box.appendChild(el('p','Ganhe Bits: inimigo 1 · chefe 50 · resposta correta 25 · vitória 150. Os bônus de vida e defesa não se aplicam no No Hit.','isac-help'));box.appendChild(button('VOLTAR',actions.back));
  }
  function renderQuiz(state,preview){
   const q=state.quiz,box=frame('DESAFIO DO PROFESSOR ISAC'),body=el('div',undefined,'isac-quiz-body');body.appendChild(portrait(!q.answered?'portrait':q.correct?'happy':'surprised'));
   const content=el('div',undefined,'isac-question');content.appendChild(el('p',`${q.question.category} · ${q.question.difficulty}`,'isac-category'));content.appendChild(el('h2',q.question.question));
   content.appendChild(el('p',q.answered?q.rewardText:`Resposta correta: ${preview} XP e 25 Bits.`,'isac-reward'));
   const answers=el('div',undefined,'isac-answers');q.question.options.forEach((answer,i)=>{const b=button(`[${i+1}] ${answer}`,()=>actions.answer(i));b.disabled=q.answered;if(q.answered&&i===q.question.correct)b.classList.add('isac-correct');else if(q.answered&&i===q.selected)b.classList.add('isac-wrong');answers.appendChild(b)});content.appendChild(answers);
   if(q.answered){content.appendChild(el('p',q.question.explanation,'isac-explanation'));content.appendChild(button('CONTINUAR',actions.closeQuiz))}
   else content.appendChild(button('VOLTAR À PARTIDA',actions.closeQuiz));
   body.appendChild(content);box.appendChild(body);const line=el('p',!q.answered?dialogue.opening:q.correct?dialogue.correct:dialogue.wrong,'isac-dialogue');line.setAttribute('role','status');box.appendChild(line);
  }
  return {root,sync(screen,state,preview){
   const visible=screen==='shop'||screen==='knowledge';root.hidden=!visible;
   if(!visible){current='';quizRef=null;return}
   const signature=Object.values(images).map(v=>v.state).join(','),artChanged=signature!==lastArt;lastArt=signature;
   if(screen==='shop'&&current!==screen){pending=null;message=dialogue.shop;renderShop()}else if(screen==='shop'&&artChanged)renderShop();
   if(screen==='knowledge'&&state&&(current!==screen||quizRef!==state.quiz||quizAnswered!==state.quiz.answered||artChanged)){renderQuiz(state,preview);quizRef=state.quiz;quizAnswered=state.quiz.answered}
   if(current!==screen){root.scrollTop=0;root.querySelector('button')?.focus({preventScroll:true})}
   current=screen;
  }};
 }
 globalThis.IsacShop={upgrades:upgrades.map(u=>Object.freeze({...u,max:5})),dialogue,rewards,snapshot,price,purchase,reward,apply,mount,artStatus};
})();
