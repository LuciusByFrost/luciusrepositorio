param([ValidateSet('walk','attack')][string[]]$States=@('walk','attack'))
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -TypeDefinition @'
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;
public class HeroComponent {
 public int x,y,w,h,area;
 public List<int> pixels=new List<int>();
}
public class HeroPixels {
 public static List<HeroComponent> Components(Bitmap b) {
  int w=b.Width,h=b.Height;
  var data=b.LockBits(new Rectangle(0,0,w,h),ImageLockMode.ReadOnly,PixelFormat.Format32bppArgb);
  byte[] bytes=new byte[data.Stride*h]; Marshal.Copy(data.Scan0,bytes,0,bytes.Length);b.UnlockBits(data);
  bool[] seen=new bool[w*h];var result=new List<HeroComponent>();var queue=new Queue<int>();
  for(int y=0;y<h;y++)for(int x=0;x<w;x++) {
   int p=y*w+x;if(seen[p]||bytes[y*data.Stride+x*4+3]<16)continue;
   var c=new HeroComponent{x=x,y=y};int right=x,bottom=y;seen[p]=true;queue.Enqueue(p);
   while(queue.Count>0){int n=queue.Dequeue(),nx=n%w,ny=n/w;c.pixels.Add(n);
    c.x=Math.Min(c.x,nx);c.y=Math.Min(c.y,ny);right=Math.Max(right,nx);bottom=Math.Max(bottom,ny);
    for(int dy=-1;dy<=1;dy++)for(int dx=-1;dx<=1;dx++){
     int xx=nx+dx,yy=ny+dy;if(xx<0||xx>=w||yy<0||yy>=h)continue;int next=yy*w+xx;
     if(!seen[next]&&bytes[yy*data.Stride+xx*4+3]>=16){seen[next]=true;queue.Enqueue(next);}
    }
   }
   c.w=right-c.x+1;c.h=bottom-c.y+1;c.area=c.pixels.Count;result.Add(c);
  }return result;
 }
}
'@ -ReferencedAssemblies System.Drawing
$root=Split-Path $PSScriptRoot -Parent
$report=[ordered]@{}
$reportPath=Join-Path $PSScriptRoot 'hero-measurements.generated.json'
if(Test-Path -LiteralPath $reportPath){
 $previous=Get-Content -LiteralPath $reportPath -Raw | ConvertFrom-Json
 foreach($property in $previous.PSObject.Properties){$report[$property.Name]=$property.Value}
}
foreach($id in @('nopal','rosa','bento','iris')){foreach($state in $States){
 $file=Join-Path $root "assets/characters/$id/${id}_${state}.png"
 $b=[Drawing.Bitmap]::FromFile($file)
 try{
  $components=[HeroPixels]::Components($b)
  $large=@($components | Where-Object area -gt 1000 | Sort-Object y,x)
  $cols=if($state -eq 'walk'){6}else{4}
  if($large.Count -ne 8*$cols){throw "Expected $($cols*8) isolated bodies in $file; inspect source again"}
  $frames=@()
  for($row=0;$row -lt 8;$row++){$frames+=@($large[($row*$cols)..($row*$cols+$cols-1)] | Sort-Object x)}
  $report["${id}_${state}"]=@{size=@($b.Width,$b.Height);frames=@($frames | Select-Object x,y,w,h,area);small=@($components | Where-Object area -le 1000 | Select-Object x,y,w,h,area)}
  "${id}_${state}: $($b.Width)x$($b.Height); $($large.Count) bodies, $($components.Count-$large.Count) detached components"
 }finally{$b.Dispose()}
}}
$report | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 (Join-Path $PSScriptRoot 'hero-measurements.generated.json')


