// Logic, real-game integration, and DOM structure checks. Browser layout is separate.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {boot}=require('./game_fixture.cjs');
const close=(a,b)=>assert(Math.abs(a-b)<1e-9,`${a} != ${b}`);
const plain=o=>JSON.parse(JSON.stringify(o));
let f=boot({isacSave:{bits:100000}}),I=f.I;
assert.equal(I.upgrades.length,6);
for(const u of I.upgrades){let previous=0;for(let level=0;level<5;level++){
 const cost=I.price(u.id);assert(cost>previous);previous=cost;const before=I.snapshot().bits;
 assert(I.purchase(u.id).ok);assert.equal(I.snapshot().bits,before-cost);assert.equal(I.snapshot().levels[u.id],level+1);
 }assert.equal(I.price(u.id),null);assert(!I.purchase(u.id).ok);assert.equal(I.snapshot().levels[u.id],5)}
assert(!I.purchase('unknown').ok);
const reloaded=boot({storage:f.storage});assert.deepEqual(plain(reloaded.I.snapshot()),plain(I.snapshot()));
assert.equal(JSON.parse(f.storage.get('cactus-save')).characterId,'nopal');
// Purchased bonuses apply once, then remain independent of run upgrades.
f.p.newGame();let g=f.p.game,p=g.player;
close(p.damage,1.15);close(p.speed,225.5);close(p.attackSpeed,1.1);close(p.magnet,150);
assert.equal(p.maxHp,125);assert.equal(p.hp,125);close(p.armor,.1);
const before=JSON.stringify(p);assert(!I.apply(g));assert.equal(JSON.stringify(p),before);
const powder=f.p.upgradePool.find(u=>u.damageUpgrade);assert(f.p.takeUpgrade(g,powder));close(p.damage,1.2);
const armor=f.p.upgradePool.find(u=>u.armorUpgrade);for(let i=0;i<10;i++)f.p.takeUpgrade(g,armor);close(p.armor,.35);
f.p.newGame('iris','nohit');g=f.p.game;p=g.player;
assert.equal(p.hp,1);assert.equal(p.maxHp,1);assert.equal(p.armor,0);assert.equal(p.regen,0);close(p.damage,1.15);
p.armor=1;p.regen=999;f.p.hurtPlayer(.001);assert(g.completed);assert.equal(p.hp,0);
// Invalid/corrupt saves cannot create negative money or out-of-range levels.
for(const saved of [{bits:-42,levels:{ram:100,turbo:-4,overclock:'5'}},{bits:1e30},null]){
 const a=boot({isacSave:saved||{}}).I.snapshot();assert(Number.isSafeInteger(a.bits)&&a.bits>=0);assert(Object.values(a.levels).every(n=>Number.isInteger(n)&&n>=0&&n<=5));
}
const corrupt=new Map([['cactus-isac-save','{broken']]);assert.equal(boot({storage:corrupt}).I.snapshot().bits,0);
f=boot();I=f.I;assert(!I.purchase('ram').ok);assert.equal(I.snapshot().bits,0);
const token={};assert(I.reward('enemy',token));assert(!I.reward('enemy',token));assert.equal(I.snapshot().bits,1);
assert(!I.reward('unknown',{}));assert(!I.reward('quiz',null));
const throwing={getItem(){return null},setItem(){throw Error('quota')}};
const box={localStorage:throwing};box.globalThis=box;vm.createContext(box);vm.runInContext(fs.readFileSync('js/isac_shop.js','utf8'),box);
assert(!box.IsacShop.reward('victory',{}));assert.equal(box.IsacShop.snapshot().bits,0);
const savedButFull={localStorage:{getItem:()=>JSON.stringify({bits:1000}),setItem(){throw Error('quota')}}};savedButFull.globalThis=savedButFull;vm.createContext(savedButFull);vm.runInContext(fs.readFileSync('js/isac_shop.js','utf8'),savedButFull);assert(!savedButFull.IsacShop.purchase('ram').ok);assert.equal(savedButFull.IsacShop.snapshot().bits,1000);assert.equal(savedButFull.IsacShop.snapshot().levels.ram,0);
// Actual enemy removal: no farming an already defeated object, bosses pay 50 total.
function fresh(){f.p.newGame();const g=f.p.game;g.spawn=1e6;g.nextBoss=Infinity;g.nextKnowledgeChest=Infinity;for(const w of Object.values(g.weapons))w.level=0;return g}
g=fresh();let start=I.snapshot().bits;let e=f.p.spawnEnemy('bandit');e.x=500;e.y=500;f.p.damageEnemy(e,1e6,false);f.p.update(.01);assert.equal(I.snapshot().bits,start+1);f.p.update(.01);assert.equal(I.snapshot().bits,start+1);
e=f.p.spawnEnemy('iron_colonel');e.x=500;e.y=500;f.p.damageEnemy(e,1e6,false);f.p.update(.01);assert.equal(I.snapshot().bits,start+51);
// Every existing question, its correct/incorrect branch, XP and one-time Bits.
const qbox={};qbox.window=qbox;vm.createContext(qbox);vm.runInContext(fs.readFileSync('js/network_questions.js','utf8'),qbox);
const bank=qbox.NETWORK_QUESTION_BANK;assert.equal(bank.length,60);const original=JSON.stringify(bank);
function open(question){g=fresh();g.knowledgeUsed=new Set();const c=f.K.create(0,0,1);g.chests=[c];f.p.interactWithKnowledgeChest();if(question)c.quiz.question=plain(question);return c.quiz}
for(const question of bank){
 let q=open(question);start=I.snapshot().bits;f.p.answerKnowledgeQuestion(q.question.correct);assert(q.correct);assert(q.rewardApplied);assert.equal(I.snapshot().bits,start+25);assert.equal(q.rewardXP,f.Ch.reward(1,'knowledge',question.reward.xp));
 f.p.answerKnowledgeQuestion(q.question.correct);f.p.awardKnowledgeReward(q);assert.equal(I.snapshot().bits,start+25);
 q=open(question);start=I.snapshot().bits;f.p.answerKnowledgeQuestion((q.question.correct+1)%4);assert(!q.correct);assert.equal(I.snapshot().bits,start);assert(!q.rewardApplied);
}
assert.equal(JSON.stringify(bank),original);
g=fresh();start=I.snapshot().bits;f.p.endGame(true);f.p.endGame(true);f.p.update(10);assert.equal(I.snapshot().bits,start+150);
g=fresh();start=I.snapshot().bits;f.p.endGame(false);assert.equal(I.snapshot().bits,start);
// Menu pointer/keyboard entry and escape return, plus frozen shop time.
f.p.setScreen('title');f.p.drawTitle();assert(f.text.includes('LOJA DO ISAC'));
f.p.handleClick({clientX:600,clientY:800*.80});assert.equal(f.p.screen,'shop');
start=g.time;f.p.update(100);assert.equal(g.time,start);
f.dispatch('keydown',{key:'Escape',preventDefault(){}});assert.equal(f.p.screen,'title');
f.dispatch('keydown',{key:'l',preventDefault(){}});assert.equal(f.p.screen,'shop');

// Minimal DOM tracks actual module output and button callbacks, not a screenshot.
class Node{
 constructor(tag){this.tagName=tag;this.children=[];this.style={};this.events={};this.attrs={};this.classList={add:n=>{this.className=(this.className||'')+' '+n}};this.hidden=false}
 set textContent(v){this.text=String(v);this.children=[]}get textContent(){return(this.text||'')+this.children.map(n=>n.textContent).join(' ')}
 appendChild(n){this.children.push(n);return n}replaceChildren(...nodes){this.text='';this.children=nodes}
 setAttribute(k,v){this.attrs[k]=v}addEventListener(k,fn){this.events[k]=fn}focus(){}
 querySelector(tag){return this.children.find(n=>n.tagName===tag)||this.children.map(n=>n.querySelector(tag)).find(Boolean)}
 all(tag){return this.children.flatMap(n=>[...(n.tagName===tag?[n]:[]),...n.all(tag)])}
 click(){if(!this.disabled)this.events.click?.()}
}
const shell=new Node('main'),dom={querySelector:()=>shell,createElement:tag=>new Node(tag)};
let requested=[],imageInstances=[];class FakeImage{constructor(){imageInstances.push(this)}set src(v){this._src=v;requested.push(v)}get src(){return this._src}}
const store=new Map([['cactus-isac-save',JSON.stringify({bits:500})]]),b={Image:FakeImage,document:dom,localStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)}};b.globalThis=b;vm.createContext(b);vm.runInContext(fs.readFileSync('js/isac_shop.js','utf8'),b);
assert.equal(requested.length,0,'missing Isac files must not generate image requests');
let back=0,answered=-1,closed=0;const ui=b.IsacShop.mount({back:()=>back++,answer:i=>answered=i,closeQuiz:()=>closed++});
ui.sync('shop');assert(!ui.root.hidden);assert(ui.root.textContent.includes('500 Bits'));assert(ui.root.textContent.includes(b.IsacShop.dialogue.shop));
const buttons=()=>ui.root.all('button'),click=text=>{const btn=buttons().find(n=>n.textContent.includes(text));assert(btn,text);btn.click()};
click('Comprar');assert.equal(b.IsacShop.snapshot().bits,500);click('Cancelar');assert.equal(b.IsacShop.snapshot().bits,500);
click('Comprar');click('Confirmar compra');assert.equal(b.IsacShop.snapshot().bits,350);assert(ui.root.textContent.includes(b.IsacShop.dialogue.bought));
click('VOLTAR');assert.equal(back,1);
let q={question:plain(bank[0]),answered:false,selected:-1};ui.sync('knowledge',{quiz:q},7);
const body=ui.root.children[0].children.find(n=>n.className==='isac-quiz-body');assert.equal(body.children[0].tagName,'aside');assert.equal(body.children[1].className,'isac-question');
assert.equal(buttons().filter(n=>n.textContent.startsWith('[')).length,4);click('[2]');assert.equal(answered,1);
q.answered=true;q.correct=false;q.selected=1;q.rewardText='Sem recompensa';ui.sync('knowledge',{quiz:q},7);assert(ui.root.textContent.includes(b.IsacShop.dialogue.wrong));assert(ui.root.textContent.includes(q.question.explanation));click('CONTINUAR');assert.equal(closed,1);
q={question:plain(bank[0]),answered:true,correct:true,selected:0,rewardText:'+7 XP · +25 Bits'};ui.sync('knowledge',{quiz:q},7);assert(ui.root.textContent.includes(b.IsacShop.dialogue.correct));
ui.sync('playing');assert(ui.root.hidden);
// Configured artwork loader contract: ready, expressions, errors; simulated only.
requested=[];b.ISAC_ART={portrait:'test-portrait.png',happy:'test-happy.png',surprised:'test-surprised.png'};vm.runInContext(fs.readFileSync('js/isac_shop.js','utf8'),b);
assert.equal(requested.length,3);assert(Object.values(b.IsacShop.artStatus()).every(v=>v.state==='loading'));
imageInstances.forEach(img=>{img.naturalWidth=48;img.naturalHeight=96;img.onload()});assert(Object.values(b.IsacShop.artStatus()).every(v=>v.state==='ready'&&v.width===48&&v.height===96));
const artUI=b.IsacShop.mount({back(){},answer(){},closeQuiz(){}});q={question:plain(bank[0]),answered:false};artUI.sync('knowledge',{quiz:q},7);assert.equal(artUI.root.all('img')[0].src,'test-portrait.png');
q.answered=true;q.correct=true;artUI.sync('knowledge',{quiz:q},7);assert.equal(artUI.root.all('img')[0].src,'test-happy.png');
q.correct=false;q={...q};artUI.sync('knowledge',{quiz:q},7);assert.equal(artUI.root.all('img')[0].src,'test-surprised.png');
imageInstances.at(-1).onerror();artUI.sync('knowledge',{quiz:q},7);assert.equal(b.IsacShop.artStatus().surprised.state,'error');assert.equal(artUI.root.all('img')[0].src,'test-portrait.png');
// CSS preserves a left portrait column and scrollable full-height panels on mobile.
const css=fs.readFileSync('isac.css','utf8');assert(css.includes('overflow:auto'));assert(css.includes('grid-template-columns:64px minmax(0,1fr)'));assert(css.includes('@media(max-width:600px)'));assert(css.includes('height:auto'));assert(css.includes('image-rendering:pixelated'));
const html=fs.readFileSync('index.html','utf8');assert(html.indexOf('js/isac_shop.js')<html.indexOf('js/main.js'));assert(html.includes('isac.css'));
console.log('PASS Isac: six capped purchases/prices, persistence/corrupt saves, bonuses once, 35% cap, fatal No Hit, enemy/boss/quiz/victory deduplication, all 60 question branches, navigation, DOM left portrait/confirmation/dialogue, absent-art requests and mobile CSS contracts. Browser rendering and approved art are not verified by this test.');
