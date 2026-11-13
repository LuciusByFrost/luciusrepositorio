// Offline atlas compilation. No dependencies or runtime pixel scans; preserves originals.
const fs=require('node:fs'),zlib=require('node:zlib'),crypto=require('node:crypto');
const mapping={bandit:'coyote_marauder',runner:'vulture_scout',gunslinger:'dust_bandit',brute:'scorpion_brute',gravedigger:'cactus_spitter',armored:'armadillo_bomber',boss:'bone_rifleman',iron_colonel:'iron_bull',storm_widow:'scorpion_queen'};
function decode(file){
 const b=fs.readFileSync(file),w=b.readUInt32BE(16),h=b.readUInt32BE(20);if(b[24]!==8||b[25]!==6||b[28])throw Error('Expected noninterlaced RGBA8 '+file);
 const chunks=[];for(let p=8;p<b.length;){const n=b.readUInt32BE(p);if(b.toString('ascii',p+4,p+8)==='IDAT')chunks.push(b.subarray(p+8,p+8+n));p+=n+12}
 const raw=zlib.inflateSync(Buffer.concat(chunks)),data=Buffer.alloc(w*h*4),stride=w*4;
 for(let y=0;y<h;y++){const filter=raw[y*(stride+1)];for(let x=0;x<stride;x++){
  const a=x>=4?data[y*stride+x-4]:0,c=y?data[(y-1)*stride+x]:0,d=y&&x>=4?data[(y-1)*stride+x-4]:0;
  const p=a+c-d,pa=Math.abs(p-a),pb=Math.abs(p-c),pc=Math.abs(p-d),predict=[0,a,c,Math.floor((a+c)/2),pa<=pb&&pa<=pc?a:pb<=pc?c:d][filter];
  if(predict===undefined)throw Error('PNG filter');data[y*stride+x]=(raw[y*(stride+1)+1+x]+predict)&255;
 }}return {w,h,data};
}
function encode(w,h,data){
 function chunk(type,bytes){const t=Buffer.from(type),out=Buffer.alloc(bytes.length+12);out.writeUInt32BE(bytes.length);t.copy(out,4);bytes.copy(out,8);let crc=0xffffffff;
  for(const n of Buffer.concat([t,bytes])){crc^=n;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0)}out.writeUInt32BE((crc^0xffffffff)>>>0,out.length-4);return out}
 const head=Buffer.alloc(13);head.writeUInt32BE(w);head.writeUInt32BE(h,4);head[8]=8;head[9]=6;
 const raw=Buffer.alloc((w*4+1)*h);for(let y=0;y<h;y++)data.copy(raw,y*(w*4+1)+1,y*w*4,(y+1)*w*4);
 return Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),chunk('IHDR',head),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);
}
function build(){
 const manifest=JSON.parse(fs.readFileSync('manifest.json')),meta={},report={};
 for(const [id,asset] of Object.entries(mapping)){
  const entry=manifest.characters.find(e=>e.id===asset),folder=entry.sheet.slice(0,entry.sheet.lastIndexOf('/')),atlas=JSON.parse(fs.readFileSync(folder+'/atlas.json'));
  const source=decode(folder+'/'+atlas.spritesheet.path),fw=atlas.frame_width,fh=atlas.frame_height;
  if(source.w!==fw*atlas.spritesheet.columns||source.h!==fh*atlas.spritesheet.rows)throw Error('Atlas size '+id);
  const size=192,pivot=[96,144],height={brute:62,armored:58,boss:94,iron_colonel:100,storm_widow:100}[id]||54,frames=[],out=Buffer.alloc(size*8*size*8*4);let artifacts=0,edges=0;
  for(let row=0;row<atlas.direction_order.length;row++)for(let col=0;col<atlas.spritesheet.columns;col++){
   const pixels=Buffer.alloc(fw*fh*4),seen=new Uint8Array(fw*fh),parts=[];
   for(let y=0;y<fh;y++)for(let x=0;x<fw;x++){
    const a=((row*fh+y)*source.w+col*fw+x)*4,p=(y*fw+x)*4;source.data.copy(pixels,p,a,a+4);
    const r=pixels[p],g=pixels[p+1],b=pixels[p+2];
    // Generated sheets contain pure primary-color guide lines and low-alpha fringes.
    if(pixels[p+3]<96||(r>210&&g<45&&b<45)||(r>210&&g>210&&b<35)||(g>210&&r<45&&b<45)){if(pixels[p+3])artifacts++;pixels[p+3]=0}
   }
   for(let p=0;p<seen.length;p++)if(!seen[p]&&pixels[p*4+3]){
    const q=[p];seen[p]=1;for(let i=0;i<q.length;i++){const n=q[i],x=n%fw,y=Math.floor(n/fw);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy,j=yy*fw+xx;if(xx>=0&&xx<fw&&yy>=0&&yy<fh&&!seen[j]&&pixels[j*4+3]){seen[j]=1;q.push(j)}}}parts.push(q);
   }
   parts.sort((a,b)=>b.length-a.length);if(!parts[0]||parts[0].length<300)throw Error('Empty frame '+id+'/'+row+'/'+col);
   const body=parts[0],xs=body.map(p=>p%fw),ys=body.map(p=>Math.floor(p/fw)),left=Math.min(...xs),right=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys);
   const kept=new Set(body);for(const part of parts.slice(1))if(part.length>=8&&part.some(p=>{const x=p%fw,y=Math.floor(p/fw);return x>=left-8&&x<=right+8&&y>=top-8&&y<=bottom+8}))for(const p of part)kept.add(p);
   // Dark structural pixels exclude muzzle flashes, smoke and poison clouds.
   const rows=[];for(let y=top;y<=bottom;y++){const rowXs=[];for(let x=left;x<=right;x++){const p=(y*fw+x)*4;if(kept.has(y*fw+x)&&Math.max(pixels[p],pixels[p+1],pixels[p+2])<155)rowXs.push(x)}if(rowXs.length>=10)rows.push({y,x:(rowXs[0]+rowXs.at(-1))/2})}
   if(!rows.length)throw Error('Missing body landmarks '+id);
   const bodyTop=rows[0].y,feet=rows.at(-1).y+1,centers=rows.filter(r=>r.y>bodyTop+(feet-bodyTop)*.25&&r.y<bodyTop+(feet-bodyTop)*.65).map(r=>r.x).sort((a,b)=>a-b),anchor=centers[Math.floor(centers.length/2)],scale=height/(feet-bodyTop);
   const f={row,column:col,sourceRect:[col*fw,row*fh,fw,fh],sourceAnchor:[anchor,feet],bodyTop,bodyHeight:feet-bodyTop,scale,x:col*size,y:row*size,w:size,h:size,anchor:pivot};frames.push(f);
   let clipped=0,minX=size,minY=size,maxX=0,maxY=0;for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const sx=Math.floor((x-pivot[0])/scale+anchor),sy=Math.floor((y-pivot[1])/scale+feet);if(sx<0||sx>=fw||sy<0||sy>=fh||!kept.has(sy*fw+sx))continue;
    const p=(sy*fw+sx)*4,d=((row*size+y)*(size*8)+col*size+x)*4;pixels.copy(out,d,p,p+4);minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);if(x<2||x>=size-2||y<2||y>=size-2)clipped++;
   }if(clipped)throw Error('Normalized frame clips '+id+'/'+row+'/'+col);
   f.crop=[minX,minY,maxX-minX+1,maxY-minY+1];
   if(body.some(p=>p%fw===0||p%fw===fw-1||p<fw||p>=fw*(fh-1)))edges++;
  }
  const bytes=encode(size*8,size*8,out),hash=crypto.createHash('sha256').update(bytes).digest('hex');fs.writeFileSync(folder+'/normalized.png',bytes);
  meta[id]={asset,file:folder+'/normalized.png',sha256:hash,size:[size*8,size*8],frameSize:size,columns:atlas.spritesheet.columns,pivot,worldHeight:height,directions:atlas.direction_order,walk:{columns:atlas.spritesheet.walk_columns,fps:atlas.walk.fps,loop:atlas.walk.loop},attack:{columns:atlas.spritesheet.attack_columns,fps:atlas.attack.fps,loop:atlas.attack.loop},frames};
  report[id]={asset,removedArtifactPixels:artifacts,sourceFramesTouchingEdge:edges,bodyHeightRange:[Math.min(...frames.map(f=>f.bodyHeight)),Math.max(...frames.map(f=>f.bodyHeight))]};
 }
 fs.writeFileSync('assets/enemy_atlas.js','/* Generated from manifest.json and per-design atlas.json by tools/build_enemy_atlas.cjs. */\nconst EnemyAtlas = '+JSON.stringify(meta)+';\n');
 fs.writeFileSync('tools/enemy-measurements.generated.json',JSON.stringify(report,null,2));console.log(report);
}
if(require.main===module)build();module.exports={decode,encode,mapping};

