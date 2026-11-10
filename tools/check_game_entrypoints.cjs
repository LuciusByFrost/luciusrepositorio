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
const instrument=`(()=>{
 window.spriteCheck={nopal:{frames:{},draws:0},rosa:{frames:{},draws:0},bento:{frames:{},draws:0}};
 for(const [id,S,key] of [['nopal',NopalSprite,'nopalShotAt'],['rosa',RosaSprite,'rosaShotAt'],['bento',BentoSprite,'bentoThrowAt']]){
  const draw=S.draw;
  S.draw=function(ctx,p,x,y,t){
   const ok=draw(ctx,p,x,y,t);
   if(ok){const a=S.pose(p,t),r=spriteCheck[id];r.draws++;r.frames[a.frame]=true;r.frame=a.frame;r.sheet=a.sheet;r.time=t;r.moving=!!p.visualMoving;r.direction=p.visualDirection;
    if(p.visualMoving){r.walked=true;if(p.visualBack)r.back=true;else r.front=true}
    r.preparing=!!a.preparing;
    if(p[key]!=null){r.shot=p[key];r.firing=!!(a.shooting||a.throwing);if(r.firing&&a.frame===9)r.flash=true}
   }
   return ok;
  };
 }
})()`;
(async()=>{
 let browser,tab,server;
 try{
  const version=await until(async()=>{try{return await(await fetch('http://127.0.0.1:'+port+'/json/version')).json()}catch{return null}},'Chrome debugging endpoint');
  browser=await connect(version.webSocketDebuggerUrl);
  const target=await browser.send('Target.createTarget',{url:'about:blank'});
  const page=await until(async()=>{const list=await(await fetch('http://127.0.0.1:'+port+'/json/list')).json();return list.find(p=>p.id===target.targetId)},'new browser tab');
  tab=await connect(page.webSocketDebuggerUrl);await tab.send('Page.enable');await tab.send('Runtime.enable');
  await tab.send('Emulation.setDeviceMetricsOverride',{width:1280,height:800,deviceScaleFactor:1,mobile:false});
  async function evaluate(expression){const r=await tab.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value}
  async function key(key,code,type='keyDown'){await tab.send('Input.dispatchKeyEvent',{type,key,code})}
  async function press(value,code=value){await key(value,code);await key(value,code,'keyUp')}
  async function capture(name,clip){const r=await tab.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,...(clip?{clip}:{})});fs.writeFileSync(path.join(__dirname,name+'.png'),Buffer.from(r.data,'base64'))}
  const statusExpression=`(()=>{try{return {url:location.href,nopal:NopalSprite.status(),rosa:RosaSprite.status(),bento:BentoSprite.status()}}catch{return null}})()`;
  async function load(url,canonical){
   await tab.send('Page.navigate',{url:'about:blank'});
   await until(()=>evaluate('location.href==="about:blank"'),'fresh navigation context');
   await tab.send('Page.navigate',{url});
   await until(async()=>{const s=await evaluate(statusExpression);return s&&s.url===canonical&&s.nopal.ready&&s.rosa.ready&&s.bento.ready?s:null},'all PNG renderers at '+url);
   const s=await evaluate(statusExpression);
   for(const hero of ['nopal','rosa','bento'])for(const image of s[hero].images){assert.equal(image.width,384);assert.equal(image.height,hero==='bento'&&image.layer==='walk'?768:384);assert(image.url.includes('/assets/characters/'+hero+'/'))}
   await evaluate(instrument);return s;
  }
  const canonical=pathToFileURL(path.join(root,'index.html')).href;
  const nested=pathToFileURL(path.join(root,'luciusrepositorio/index.html')).href;
  for(const [entry,url] of [['root',canonical],['nested',nested]]){
   for(const [hero,numeric] of [['nopal','1'],['rosa','2'],['bento','3']]){
    const s=await load(url,canonical);await press('Enter');
    await until(()=>evaluate('spriteCheck.nopal.draws>0&&spriteCheck.rosa.draws>0&&spriteCheck.bento.draws>0'),'PNG sprites drawn in selection');
    if(hero==='nopal')await capture('sprites-'+entry+'-selection');
    await press(numeric,'Digit'+numeric);await press('Enter');
    if(hero==='bento'){
     const directions=[['s'],['s','a'],['a'],['w','a'],['w'],['w','d'],['d'],['s','d']];
     const clip={x:588,y:338,width:104,height:110,scale:1};
     for(const [dir,keys] of directions.entries()){
      for(const k of keys)await key(k,'Key'+k.toUpperCase());
      await until(()=>evaluate('spriteCheck.bento.direction==='+dir+'&&spriteCheck.bento.moving&&spriteCheck.bento.sheet==="walk"'),'Bento authored walking '+dir);
      if(entry==='root')await capture('bento-walk-'+dir,clip);
      // Release diagonal controls within one game frame. Sequential CDP
      // round trips can otherwise generate a real extra cardinal step.
      await evaluate(`for(const k of ${JSON.stringify(keys)})window.dispatchEvent(new KeyboardEvent('keyup',{key:k,code:'Key'+k.toUpperCase()}))`);
      for(const k of keys)await key(k,'Key'+k.toUpperCase(),'keyUp');
      await until(()=>evaluate('spriteCheck.bento.direction==='+dir+'&&!spriteCheck.bento.moving&&spriteCheck.bento.sheet==="walk"'),'Bento stopped '+dir);
      let stable=false;
      await until(async()=>{
       const before=await evaluate('({...spriteCheck.bento})');await sleep(100);
       const after=await evaluate('({...spriteCheck.bento})');
       stable=before.sheet==='walk'&&after.sheet==='walk'&&after.direction===dir&&!after.moving&&before.frame===after.frame;
       return stable;
      },'Bento stopped frame remains fixed '+dir);
      assert(stable);if(entry==='root')await capture('bento-idle-'+dir,clip);
     }
     if(entry==='root'){
      await until(()=>evaluate('spriteCheck.bento.preparing'),'Bento actual cooldown preparation');await capture('bento-action-0',clip);
      for(const [i,frame] of [[1,9],[2,10],[3,11]]){
       await until(()=>evaluate('spriteCheck.bento.firing&&spriteCheck.bento.frame==='+frame),'Bento actual throw frame '+frame);
       await capture('bento-action-'+i,clip);
      }
      await capture('sprites-root-bento-attack');
     }
     await press('Escape');const time=await evaluate('spriteCheck.bento.time');await sleep(120);assert.equal(await evaluate('spriteCheck.bento.time'),time);
     console.log('PASS real entry: '+entry+' / Bento: eight walking directions, eight fixed idle poses, real dynamite preparation/release/recovery, pause; '+s.url);continue;
    }
    await key('d','KeyD');await sleep(350);await key('d','KeyD','keyUp');
    await key('w','KeyW');await sleep(350);await key('w','KeyW','keyUp');
    await until(()=>evaluate('spriteCheck.'+hero+'.walked&&spriteCheck.'+hero+'.back'),'real walking '+hero);
    await capture('sprites-'+entry+'-'+hero+'-walk');
    await until(()=>evaluate('spriteCheck.'+hero+'.flash'),'real weapon shot '+hero,22000);
    await capture('sprites-'+entry+'-'+hero+'-attack');await press('Escape');
    const paused=await evaluate('spriteCheck.'+hero+'.time');await sleep(120);
    assert.equal(await evaluate('spriteCheck.'+hero+'.time'),paused,'paused animation advanced');
    console.log('PASS real entry: '+entry+' / '+hero+' / selection, movement, back, actual shot, pause; '+s.url);
   }
  }
  // Also verify relative assets and the redirect under a server rooted at the project.
  server=http.createServer((req,res)=>{
   const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
   if(path.relative(root,file).startsWith('..')||pathname.includes('/.git')){res.writeHead(403).end();return}
   fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return}res.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html','.css':'text/css','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(data)});
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  for(const entry of ['/index.html','/luciusrepositorio/index.html']){
   await load(base+entry,base+'/index.html');await press('Enter');await until(()=>evaluate('spriteCheck.nopal.draws>0&&spriteCheck.rosa.draws>0&&spriteCheck.bento.draws>0'),'HTTP selection');
   console.log('PASS HTTP entry: '+entry+' / local PNGs and all three selection sprites');
  }
 }catch(error){console.error(error.stack);process.exitCode=1}
 finally{if(server)server.close();if(browser){await browser.send('Browser.close').catch(()=>{});browser.socket.close()}if(tab)tab.socket.close()}
})();
