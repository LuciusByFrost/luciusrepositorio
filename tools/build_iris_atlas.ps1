$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$root=Split-Path $PSScriptRoot -Parent
$source=Join-Path $root 'assets/characters/iris/iris_spritesheet.png'
$bmp=[System.Drawing.Bitmap]::FromFile($source)
try {
 $frames=@();$transparent=0;$partial=0
 # Inspected gaps between authored rows: the first row extends past H/8.
 $rowEdges=@(0,247,456,668,889,1106,1325,1552,1774)
 for($row=0;$row -lt 8;$row++){for($col=0;$col -lt 4;$col++){
  $left=[int][Math]::Floor($col*$bmp.Width/4);$right=[int][Math]::Floor(($col+1)*$bmp.Width/4)
  $top=$rowEdges[$row];$bottom=$rowEdges[$row+1]
  $x0=$right;$x1=$left;$y0=$bottom;$y1=$top
  for($y=$top;$y -lt $bottom;$y++){for($x=$left;$x -lt $right;$x++){
   $a=$bmp.GetPixel($x,$y).A
   if($a -eq 0){$transparent++}elseif($a -lt 255){$partial++}
   if($a -gt 16){$x0=[Math]::Min($x0,$x);$x1=[Math]::Max($x1,$x);$y0=[Math]::Min($y0,$y);$y1=[Math]::Max($y1,$y)}
  }}
  # The lowest opaque band contains the boots, excluding the hat, tail and whip.
  $feet=@()
  for($y=$y1-5;$y -le $y1;$y++){for($x=$x0;$x -le $x1;$x++){if($bmp.GetPixel($x,$y).A -gt 128){$feet+=$x}}}
  $anchorX=[int][Math]::Round(($feet | Measure-Object -Average).Average)
  $frames+=@{x=$x0;y=$y0;w=$x1-$x0+1;h=$y1-$y0+1;anchor=@($anchorX,($y1+1))}
 }}
 $meta=[ordered]@{images=@{iris_spritesheet=@{size=@($bmp.Width,$bmp.Height)}};source='assets/characters/iris/iris_spritesheet.png';sourceSHA256=(Get-FileHash $source -Algorithm SHA256).Hash;scale=0.30;worldFeetY=22;transparentPixels=$transparent;partialAlphaPixels=$partial;frames=$frames}
 $json=$meta | ConvertTo-Json -Depth 8
 [System.IO.File]::WriteAllText((Join-Path $root 'assets/characters/iris/atlas.js'),"/* Measured by tools/build_iris_atlas.ps1; original PNG preserved. */`nconst IrisAtlas = $json;`n")
 Write-Output "Iris: $($bmp.Width)x$($bmp.Height), alpha0=$transparent partial=$partial; 32 measured crops/foot anchors."
} finally {$bmp.Dispose()}
