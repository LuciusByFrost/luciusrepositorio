// Inspection only; loaded by the generated preview, never by the game.
(async()=>{
 const h=window.nopalPreview,g=document.querySelector('canvas').getContext('2d');
 const fallback=new URLSearchParams(location.search).has('fallback');
 for(let i=0;i<120&&!NopalSprite.active({characterId:'nopal'})&&!fallback;i++)await new Promise(r=>setTimeout(r,16));
 try{
  if(!fallback&&!NopalSprite.active({characterId:'nopal'}))throw Error('PNG did not load');
  h.newGame();const enemy=h.spawnEnemy('brute');Object.assign(enemy,{x:100,y:0,hp:10000,maxHp:10000,speed:0});
  h.fireWeapon(h.game.weapons.revolver);const fired={...h.game.player};
  const base={...fired,nopalShotAt:undefined,weaponPose:0,weaponAngle:0,attack:0,muzzleFlash:0,invuln:0};
  let animating=false,clock=0;
  const angles=new URLSearchParams(location.search).has('angles');
  const cases=[];
  if(angles){
   for(const [label,angle] of [['right',0],['down',Math.PI/2],['left',Math.PI],['up',-Math.PI/2]])cases.push([label,{...fired,nopalShotAngle:angle},.04]);
   for(const [label,angle] of [['NE',-.7],['NW',-2.4],['SE',.7],['SW',2.4]])cases.push([label,{...fired,nopalShotAngle:angle},.12]);
   for(const weapon of ['shotgun','dynamite','lasso','solar'])cases.push([weapon,{...base,heldWeapon:weapon,weaponPose:.5,weaponAngle:-.5},1]);
   for(const hero of CharacterRoster.list)cases.push([hero.name,{...base,characterId:hero.id,startWeapon:hero.weapon,heldWeapon:hero.weapon},1]);
  }else{
   for(let col=0;col<4;col++)cases.push(['Repouso '+col,base,col*.25]);
   for(let col=0;col<4;col++)cases.push(['Frente '+col,{...base,visualMoving:true,visualStride:col*Math.PI/2},1]);
   for(const [col,t] of [0,.04,.12,.24].entries())cases.push([['Mira','Disparo real','Recuo','Recuperação'][col],fired,t]);
   for(let col=0;col<4;col++)cases.push(['Costas '+col,{...base,visualMoving:true,visualBack:true,visualStride:col*Math.PI/2},1]);
  }
  function paint(){
   g.setTransform(1,0,0,1,0,0);g.fillStyle='#34363a';g.fillRect(0,0,1280,980);g.textAlign='left';g.font='18px monospace';g.fillStyle='#efd5a0';
   g.fillText('NOPAL / PNG local / tamanho real + 3x / '+(fallback?'FALLBACK':'atlas normalizado'),24,30);
   g.font='13px monospace';g.fillText('Espaço: animar/pausar | ?angles=1: mira, armas e elenco | ?fallback=1: falha de PNG',24,54);
   cases.forEach(([label,p,t],i)=>{
    const x=20+(i%4)*315,y=85+Math.floor(i/4)*210;
    g.fillStyle=i%2?'#40464a':'#44484b';g.fillRect(x,y,301,198);
    g.fillStyle='#efd5a0';g.fillText(label,x+12,y+22);
    for(const [zoom,px,py] of [[1,x+55,y+130],[3,x+192,y+128]]){
     g.save();g.translate(px,py);g.scale(zoom,zoom);g.fillStyle='#70816a';g.fillRect(-32,22,85,1);
     const a=animating?clock:t;
     h.drawPlayer({...p,x:-640,y:-490,visualTime:a,visualStride:(p.visualStride||0)+(animating?clock*10:0),nopalShotAt:p.nopalShotAt==null?undefined:animating?Math.floor(clock/.8)*.8:0});
     g.restore();
    }
   });
  }
  paint();window.addEventListener('resize',paint);window.addEventListener('keydown',e=>{if(e.code==='Space'){e.preventDefault();animating=!animating}});
  if(g.canvas.width!==1280||g.canvas.height!==980)throw Error('Preview canvas has wrong dimensions');
  let last=performance.now();function frame(now){if(animating){clock+=(now-last)/1000;paint()}last=now;requestAnimationFrame(frame)}requestAnimationFrame(frame);
  // Exercise rendering of a stationary paused clock at two wall-clock moments.
  h.game.time=.04;h.setScreen('pause');const pose=JSON.stringify(NopalSprite.pose(fired,h.game.time));h.update(1);
  if(JSON.stringify(NopalSprite.pose(fired,h.game.time))!==pose)throw Error('pause changed pose');
  if(!fallback){
   const atlas=new Image();atlas.src='assets/characters/nopal/atlas.png';await atlas.decode();
   const c=document.createElement('canvas');c.width=c.height=384;const a=c.getContext('2d');a.drawImage(atlas,0,0);
   const data=a.getImageData(0,0,384,384).data;
   for(let i=0;i<16;i++){
    let bottom=-1,top=96,left=96,right=-1;
    for(let y=0;y<96;y++)for(let x=0;x<96;x++)if(data[((Math.floor(i/4)*96+y)*384+i%4*96+x)*4+3]>16){bottom=Math.max(bottom,y);top=Math.min(top,y);left=Math.min(left,x);right=Math.max(right,x)}
    if(bottom!==71||left<2||right>93||top<2)throw Error('bad crop/foot anchor in frame '+i+': '+[left,top,right,bottom]);
   }
  }
  document.body.dataset.nopalCheck='pass';
 }catch(e){document.body.dataset.nopalCheck='fail';document.body.insertAdjacentHTML('beforeend','<pre>'+e.stack+'</pre>')}
})();
