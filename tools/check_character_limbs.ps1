$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
public static class LimbPixelAudit {
 public static long Same(Bitmap a, Bitmap b) {
  if(a.Size!=b.Size)throw new Exception("Changed source dimensions");
  long count=0;
  for(int y=0;y<a.Height;y++)for(int x=0;x<a.Width;x++){
   if(a.GetPixel(x,y).ToArgb()!=b.GetPixel(x,y).ToArgb())throw new Exception("Erased source pixel at "+x+","+y);
   count++;
  }
  return count;
 }
 public static void Region(Bitmap original, Bitmap body, Bitmap hands, int cx,int cy,int x0,int y0,int x1,int y1) {
  for(int y=y0;y<y1;y++)for(int x=x0;x<x1;x++){
   Color a=original.GetPixel(cx+x,cy+y),b=body.GetPixel(cx+x,cy+y),h=hands.GetPixel(cx+x,cy+y);
   Color c=b.A>16?b:h;
   if(a.A>16&&a.ToArgb()!=c.ToArgb())throw new Exception("Missing anatomy in atlas cell "+cx+","+cy+" at "+x+","+y);
  }
 }
 public static void Crop(Bitmap original,int left,int top,int right,int bottom,int x0,int y0,int x1,int y1) {
  for(int y=top;y<bottom;y++)for(int x=left;x<right;x++){
   if(original.GetPixel(x,y).A>16&&(x<x0||x>=x1||y<y0||y>=y1))throw new Exception("Source crop excludes opaque pixel at "+x+","+y);
  }
 }
}
'@
$root=Split-Path $PSScriptRoot -Parent
function Atlas($p,$v){$js="const fs=require('fs'),vm=require('vm');process.stdout.write(JSON.stringify(vm.runInNewContext(fs.readFileSync(process.argv[1],'utf8')+';'+process.argv[2])))";return ((& node -e $js (Join-Path $root $p) $v)|ConvertFrom-Json)}
foreach($id in @('nopal','iris')){
 $p=if($id -eq 'nopal'){'assets/characters/nopal/walk_atlas.js'}else{'assets/characters/iris/atlas.js'}
 $v=if($id -eq 'nopal'){'NopalWalkAtlas'}else{'IrisAtlas'}
 $m=Atlas $p $v
 $out=if($id -eq 'nopal'){'walk_weaponless.png'}else{'weaponless.png'}
 $original=[Drawing.Bitmap]::FromFile((Join-Path $root $m.source));$body=[Drawing.Bitmap]::FromFile((Join-Path $root "assets/characters/$id/$out"))
 try{
  $n=[LimbPixelAudit]::Same($original,$body)
  $rows=if($id -eq 'nopal'){@(0,230,443,661,883,1107,1329,1552,1774)}else{@(0,247,456,668,889,1106,1325,1552,1774)}
  for($i=0;$i -lt 32;$i++){
   $f=$m.frames[$i];$col=$i%4;$row=[int][Math]::Floor($i/4)
   [LimbPixelAudit]::Crop($original,[int][Math]::Floor($col*$original.Width/4),$rows[$row],[int][Math]::Floor(($col+1)*$original.Width/4),$rows[$row+1],$f.x,$f.y,($f.x+$f.w),($f.y+$f.h))
   if($f.anchor[1] -ne $f.y+$f.h){throw 'Foot anchor changed'}
  }
  Write-Output "PASS ${id}: $n original pixels preserved; 32 complete source crops and unchanged foot anchors."
 }finally{$original.Dispose();$body.Dispose()}
}
foreach($id in @('nopal','rosa')){
 $images=@('atlas','body','hands')|ForEach-Object {[Drawing.Bitmap]::FromFile((Join-Path $root "assets/characters/$id/$_.png"))}
 try{
  for($i=0;$i -lt 16;$i++){
   $x=($i%4)*96;$y=[int][Math]::Floor($i/4)*96
   [LimbPixelAudit]::Region($images[0],$images[1],$images[2],$x,$y,18,0,60,33)
   [LimbPixelAudit]::Region($images[0],$images[1],$images[2],$x,$y,25,64,51,96)
  }
  Write-Output "PASS ${id}: head, legs and soles intact in 16 layered poses; native hands restored separately."
 }finally{foreach($b in $images){$b.Dispose()}}
}
