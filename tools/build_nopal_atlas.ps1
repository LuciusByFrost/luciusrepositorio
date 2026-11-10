# Rebuild only derived assets; never modify the AI source PNG.
param([string]$Source = '', [ValidateSet('nopal','rosa')][string]$Character = 'nopal')
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$root = Split-Path $PSScriptRoot -Parent
if (!$Source) { $Source=if($Character -eq 'rosa'){'assets/characters/rosa/spritesheet.png'}else{'assets/characters/nopal/Nopal, pistoleiro cacto em pixel art.png'} }
$sourcePath = Join-Path $root $Source
if (!(Test-Path -LiteralPath $sourcePath)) { throw "Missing original: $sourcePath" }
$originalHash = (Get-FileHash -LiteralPath $sourcePath -Algorithm SHA256).Hash
$src = [System.Drawing.Bitmap]::FromFile($sourcePath)
if ($src.Width -ne 1261 -or $src.Height -ne 1247) { $src.Dispose(); throw 'Source dimensions changed; re-inspect crops and anchors.' }
# Individually inspected crops, torso/feet anchors and arm separation boundaries.
# x,y,w,h, anchorX, soleY(exclusive), shoulderX, shoulderY, armLeft, armTop, armBottom
$cuts = @(
 @(80,15,180,279,166,284,201,158,198,145,215),
 @(396,14,173,280,478,285,515,157,511,145,215),
 @(697,14,187,281,790,289,826,157,822,145,215),
 @(1014,14,180,280,1104,287,1140,158,1137,145,218),
 @(70,329,193,275,166,597,203,476,200,460,530),
 @(397,327,168,267,478,586,514,474,511,459,526),
 @(702,329,180,275,790,596,825,475,822,458,528),
 @(1020,329,173,266,1104,587,1141,474,1138,458,528),
 @(50,635,228,278,128,907,165,752,165,711,780),
 @(362,635,265,268,441,894,479,752,479,711,780),
 @(675,635,220,275,755,901,793,752,793,711,780),
 @(991,637,226,272,1070,901,1108,752,1108,710,780),
 @(63,943,196,283,163,1219,206,1081,204,1068,1134),
 @(381,940,189,269,478,1201,521,1078,518,1062,1133),
 @(698,940,185,279,793,1211,837,1077,834,1060,1133),
 @(1013,939,185,282,1106,1214,1148,1078,1145,1064,1136)
)
if($Character -eq 'rosa') {
 # Individually inspected Rosa crops: preserve the tail and both shotgun barrels.
 # Weapon pivots are at the holding hand rather than the Nopal shoulder.
 $cuts=@(
  @(46,20,204,281,145,295,145,184), @(364,20,204,281,463,295,463,184),
  @(686,20,197,281,779,295,779,184), @(1003,20,197,281,1097,295,1097,184),
  @(47,337,209,274,145,604,145,495), @(377,337,192,274,463,604,463,495),
  @(675,338,210,273,779,604,779,495), @(1006,338,196,273,1097,604,1097,495),
  @(15,642,260,277,124,911,149,745), @(346,642,271,265,442,900,467,745),
  @(652,642,251,278,759,912,784,745), @(964,643,260,275,1074,910,1099,745),
  @(48,942,207,284,150,1218,194,1092), @(373,942,196,274,467,1208,511,1092),
  @(691,939,192,289,783,1220,827,1092), @(1000,941,193,283,1100,1216,1144,1092)
 )
}
$cell=96; $pivotX=40; $pivotY=72; $scale=0.225; $alphaCutoff=16
$atlas=[System.Drawing.Bitmap]::new(384,384,[System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$body=[System.Drawing.Bitmap]::new(384,384,[System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$arms=[System.Drawing.Bitmap]::new(384,384,[System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$frames=@()
try {
 for ($i=0;$i -lt 16;$i++) {
  $c=$cuts[$i];$cx=($i%4)*$cell;$cy=[Math]::Floor($i/4)*$cell
  $weaponPath=$null;$polygon=@()
  if($Character -eq 'rosa') {
   if($i -lt 8){
    $dx=$c[6]-145;$dy=$c[7]-184
    $points=@(@(139,171),@(183,171),@(260,205),@(260,251),@(169,218),@(139,197))
   }elseif($i -lt 12){
    $dx=$c[6]-149;$dy=0
    # Extended gun/forehand; upper polygon includes the recoil barrel and flash.
    $points=@(@(144,731),@(178,721),@(178,675),@(300,675),@(300,772),@(180,772),@(172,755),@(144,755))
   }else{
    $dx=$c[6]-194;$dy=0
    $points=@(@(187,1080),@(247,1054),@(255,1065),@(255,1087),@(211,1111),@(199,1121),@(187,1114))
   }
   $polygon=@($points|ForEach-Object { ,@((($_[0])+$dx),(($_[1])+$dy)) })
   $weaponPath=[System.Drawing.Drawing2D.GraphicsPath]::new()
   $weaponPath.AddPolygon([System.Drawing.PointF[]]@($polygon|ForEach-Object {[System.Drawing.PointF]::new($_[0],$_[1])}))
  }
  $shoulderX=[int][Math]::Round($pivotX+($c[6]-$c[4])*$scale)
  $shoulderY=[int][Math]::Round($pivotY+($c[7]-$c[5])*$scale)
  for($y=0;$y -lt $cell;$y++){for($x=0;$x -lt $cell;$x++){
   $sx=[int][Math]::Floor($c[4]+($x-$pivotX+0.5)/$scale)
   # Last destination row samples the sole itself, retaining a shared baseline.
   $sy=[int][Math]::Floor($c[5]+($y-$pivotY+1)/$scale-1)
   if($sx -lt $c[0] -or $sx -ge $c[0]+$c[2] -or $sy -lt $c[1] -or $sy -ge $c[1]+$c[3]){continue}
   $p=$src.GetPixel($sx,$sy)
   # Alpha only: black outlines, hat, leather and gun are never chroma-keyed.
   if($p.A -le $alphaCutoff){continue}
   $atlas.SetPixel($cx+$x,$cy+$y,$p)
   $isWeapon=if($weaponPath){$weaponPath.IsVisible([single]$sx,[single]$sy)}else{
    $upperGun=($i -eq 9 -and $sx -ge 540 -and $sy -ge 680 -and $sy -lt 711) -or ($i -eq 10 -and $sx -ge 827 -and $sy -ge 680 -and $sy -lt 711)
    $upperGun -or ($sx -ge $c[8] -and $sy -ge $c[9] -and $sy -lt $c[10])
   }
   if($isWeapon){$arms.SetPixel($cx+$x,$cy+$y,$p)}
   else{$body.SetPixel($cx+$x,$cy+$y,$p)}
  }}
  # Thin AI-generated soles can fall between samples. Align the visible sole
  # after resampling, translating the whole frame and weapon pivot together.
  $visibleBottom=-1
  for($y=0;$y -lt $cell;$y++){for($x=0;$x -lt $cell;$x++){if($atlas.GetPixel($cx+$x,$cy+$y).A -gt $alphaCutoff){$visibleBottom=$y}}}
  if($visibleBottom -lt 0){throw "Empty frame $i"}
  $offsetY=$pivotY-1-$visibleBottom
  if($offsetY -gt 0){
   foreach($layer in @($atlas,$body,$arms)){
    for($y=$cell-1;$y -ge 0;$y--){for($x=0;$x -lt $cell;$x++){
     $color=if($y -ge $offsetY){$layer.GetPixel($cx+$x,$cy+$y-$offsetY)}else{[System.Drawing.Color]::Transparent}
     $layer.SetPixel($cx+$x,$cy+$y,$color)
    }}
   }
   $shoulderY+=$offsetY
  }
  $frame=@{x=$cx;y=$cy;w=$cell;h=$cell;crop=@($c[0..3]);sourceAnchor=@($c[4..5]);normalizedOffsetY=$offsetY;shoulder=@($shoulderX,$shoulderY);barrelAngle= $(if($i -lt 8){if($Character -eq 'rosa'){0.5}else{0.65}}elseif($i -ge 12){if($Character -eq 'rosa'){-0.36}else{-0.22}}else{0})}
  if($weaponPath){$frame.weaponPolygon=$polygon;$weaponPath.Dispose()}else{$frame.armMask=@($c[8..10])}
  $frames+=$frame
 }
 $out=Join-Path $root "assets/characters/$Character"
 $atlas.Save((Join-Path $out 'atlas.png'),[System.Drawing.Imaging.ImageFormat]::Png)
 $body.Save((Join-Path $out 'body.png'),[System.Drawing.Imaging.ImageFormat]::Png)
 $arms.Save((Join-Path $out 'arms.png'),[System.Drawing.Imaging.ImageFormat]::Png)
 $meta=@{source=$Source;sourceSHA256=$originalHash;sourceSize=@(1261,1247);size=@(384,384);cell=$cell;pivot=@($pivotX,$pivotY);worldFeetY=22;scale=$scale;alphaCutoff=$alphaCutoff;frames=$frames}
 $json=$meta|ConvertTo-Json -Depth 6
 $atlasName=if($Character -eq 'rosa'){'RosaAtlas'}else{'NopalAtlas'}
 [System.IO.File]::WriteAllText((Join-Path $out 'atlas.js'),"/* Generated by tools/build_nopal_atlas.ps1; local classic script, no fetch. */`nconst $atlasName = $json;`n",[System.Text.UTF8Encoding]::new($false))
} finally { $src.Dispose();$atlas.Dispose();$body.Dispose();$arms.Dispose() }
if ((Get-FileHash -LiteralPath $sourcePath -Algorithm SHA256).Hash -ne $originalHash) { throw 'Original changed unexpectedly' }
Write-Output "Built ${Character}: 16 frames, shared scale $scale, foot pivot ($pivotX,$pivotY); source SHA256 $originalHash"
