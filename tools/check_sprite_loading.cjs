const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto'),path=require('node:path');
const pending=[],diagnostics=[];
class Image{constructor(){pending.push(this)}set src(v){this.url=v}get src(){return this.url}}
const context={URL,Image,console:{error:m=>diagnostics.push(m)},document:{currentScript:{src:'file:///game/js/nopal_sprite.js?v=stale-script'},baseURI:'file:///game/index.html'}};
vm.createContext(context);vm.runInContext(fs.readFileSync('js/hero_sprite.js','utf8'),context);
const loader=context.createAtlasHeroSprite({basePath:'../assets/characters/nopal/',images:{walk:{file:'walk_normalized.abcdef123456.png',size:[768,1024],sha256:'abcdef123456'},attack:{file:'attack_normalized.123456abcdef.png',size:[512,1024],sha256:'123456abcdef'}}},'nopal');
assert.equal(new URL(pending[0].src).searchParams.get('v'),'abcdef123456');
pending[1].onerror();assert.equal(loader.status().state,'error');
Object.assign(pending[0],{naturalWidth:768,naturalHeight:1024});pending[0].onload();
assert(!loader.isReady(),'successful sibling load must not hide a failed image');
assert(loader.status().errors.attack.includes(pending[1].src));assert(diagnostics[0].includes('nopal/attack'));
Object.assign(pending[1],{naturalWidth:1,naturalHeight:1});pending[1].onload();
assert(!loader.isReady());assert(diagnostics.at(-1).includes('esperadas 512x1024'));
let painted=0;
const ctx={save(){},restore(){},translate(){},strokeRect(){painted++},fillText(){painted++}};
context.drawUnavailableHero(ctx,{characterId:'nopal'},0,0,loader);assert.equal(painted,2);
// A valid retry repairs only its own error.
Object.assign(pending[1],{naturalWidth:512,naturalHeight:1024});pending[1].onload();assert(loader.isReady());
for(const entry of ['index.html','tools/hero-preview.html']){
 const html=fs.readFileSync(entry,'utf8');
 for(const [,relative,hash] of html.matchAll(/(?:src|href)="([^"?#]+\.(?:js|css))\?v=([a-f0-9]{12})"/g)){
  const content=fs.readFileSync(path.resolve(path.dirname(entry),relative));
  assert.equal(crypto.createHash('sha256').update(content).digest('hex').slice(0,12),hash,relative+' has stale HTML cache revision');
 }
 assert(!/\b(?:src|href)="[^"?]+\.(?:js|css)"/.test(html),'unversioned local dependency');
}
// With a browser Image API, a missing atlas must never draw legacy body canvases.
let oldBodyDraws=0;
const artCtx=new Proxy({drawImage(){oldBodyDraws++},fillText(){},strokeRect(){}},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
context.document.createElement=()=>({getContext:()=>artCtx});
vm.runInContext(fs.readFileSync('js/characters.js','utf8'),context);
vm.runInContext(fs.readFileSync('js/player_sprite.js','utf8'),context);
const before=oldBodyDraws;vm.runInContext("CactusHero.draw(globalThis.artCtx,{characterId:'nopal'},0,0,0)",Object.assign(context,{artCtx}));assert.equal(oldBodyDraws,before);
assert(diagnostics.at(-1).includes('Módulo de sprite ausente'));
console.log('PASS: content cache revisions, exact URLs/dimensions, persistent layer failures, clear diagnostics, recovery and no silent legacy-body fallback.');
