// Exercise the actual index.html and keyboard/render path, without a generated game.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..'),port=Number(process.argv[2]||9227);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,label,timeout=15000){
 const end=Date.now()+timeout;let last;
 do{
  try{last=await fn();if(last)return last}catch(error){if(!/navigated or closed|Execution context was destroyed|Cannot find context/i.test(error.message))throw error}
  await sleep(30);
 }while(Date.now()<end);
 throw Error('Timed out: '+label+' '+JSON.stringify(last));
}
async function connect(url){
 const socket=new WebSocket(url),pending=new Map();let next=0;
 await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true})});
 socket.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)}}});
 return {socket,send(method,params={}){return new Promise((resolve,reject)=>{const id=++next;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}))})}};
}

(async()=>{
 let browser,tab;
 try{
  const version=await until(async()=>{try{return await(await fetch('http://127.0.0.1:'+port+'/json/version')).json()}catch{return null}},'browser');
  browser=await connect(version.webSocketDebuggerUrl);
  const target=await browser.send('Target.createTarget',{url:'about:blank'});
  const page=(await(await fetch('http://127.0.0.1:'+port+'/json/list')).json()).find(p=>p.id===target.targetId);
  tab=await connect(page.webSocketDebuggerUrl);
  const errors=[];tab.socket.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.method==='Runtime.exceptionThrown'||m.method==='Network.loadingFailed'||m.method==='Runtime.consoleAPICalled'&&m.params.type==='error')errors.push(m)});
  await tab.send('Page.enable');await tab.send('Runtime.enable');await tab.send('Network.enable');
  async function ev(expression){const r=await tab.send('Runtime.evaluate',{expression,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value}
  async function press(key){await ev('for(const type of ["keydown","keyup"])window.dispatchEvent(new KeyboardEvent(type,{key:'+JSON.stringify(key)+'}))')}
  await tab.send('Page.navigate',{url:pathToFileURL(path.join(root,'index.html')).href});
  await until(()=>ev('typeof IrisSprite!=="undefined"&&IrisSprite.status().ready'),'Iris PNG');
  await ev('window.irisCheck={};const draw=IrisSprite.draw;IrisSprite.draw=function(ctx,p,x,y,t){const ok=draw(ctx,p,x,y,t);if(ok)window.irisCheck={...IrisSprite.pose(p,t),moving:!!p.visualMoving,time:t,attack:p.attack,character:p.characterId};return ok}');
  await press('Enter');await until(()=>ev('irisCheck.character==="iris"'),'selection portrait');
  const selection=await tab.send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(__dirname,'iris-selection.generated.png'),Buffer.from(selection.data,'base64'));
  await press('4');await press('Enter');
  const dirs=[['s'],['s','a'],['a'],['w','a'],['w'],['w','d'],['d'],['s','d']];
  for(let dir=0;dir<8;dir++){
   await ev('for(const key of '+JSON.stringify(dirs[dir])+')window.dispatchEvent(new KeyboardEvent("keydown",{key}))');
   const frames=new Set();await until(async()=>{const a=await ev('({...irisCheck})');if(a.moving&&a.direction===dir)frames.add(a.frame);return frames.size===4},'four walking frames '+dir);
   await ev('for(const key of '+JSON.stringify(dirs[dir])+')window.dispatchEvent(new KeyboardEvent("keyup",{key}))');
   await until(()=>ev('!irisCheck.moving&&irisCheck.direction==='+dir+'&&irisCheck.frame==='+dir*4),'idle '+dir);
   await sleep(140);assert.equal(await ev('irisCheck.frame'),dir*4);
  }
  await until(()=>ev('irisCheck.attack>0'),'real automatic lasso attack',20000);
  const shot=await tab.send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(__dirname,'iris-game.generated.png'),Buffer.from(shot.data,'base64'));
  await press('Escape');await sleep(80);const time=await ev('irisCheck.time');await sleep(150);assert.equal(await ev('irisCheck.time'),time);
  assert.deepEqual(errors,[]);console.log('PASS Chrome real entry: Iris PNG, selection, start, all 32 walking frames, eight stable idle directions, real automatic lasso attack, pause; no console/runtime/network errors.');
 }catch(e){console.error(e.stack);process.exitCode=1}
 finally{if(browser){await browser.send('Browser.close').catch(()=>{});browser.socket.close()}if(tab)tab.socket.close()}
})();
