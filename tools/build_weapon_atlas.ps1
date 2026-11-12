$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$root=Split-Path $PSScriptRoot -Parent
$source=Join-Path $root 'assets/weapons/weapons_8directions.png'
$bmp=[System.Drawing.Bitmap]::FromFile($source)
try {
 if($bmp.Width -ne 1254 -or $bmp.Height -ne 1254){throw 'Re-inspect changed weapon source dimensions'}
 $ids=@('revolver','shotgun','dynamite','thorns','lasso','rain','meteor','solar')
 $cols=@(0,180,330,475,620,785,940,1090,1254);$rows=@(0,178,320,478,614,777,905,1060,1254)
 $anchors=@(
 @(@(53,123),@(219,89),@(404,67),@(581,94),@(734,123),@(873,120),@(1017,133),@(1155,124)),
 @(@(43,264),@(218,233),@(405,213),@(581,232),@(752,260),@(884,278),@(1016,285),@(1143,282)),
 @(@(84,400),@(240,400),@(405,392),@(558,398),@(705,400),@(865,407),@(1019,415),@(1168,407)),
 @(),
 @(@(45,695),@(215,674),@(397,650),@(567,667),@(748,698),@(822,669),@(1015,743),@(1144,729)),
 @(@(48,858),@(221,825),@(405,813),@(583,830),@(738,863),@(880,876),@(1014,878),@(1140,873)),
 @(@(122,990),@(270,998),@(401,1013),@(540,1010),@(668,989),@(873,1004),@(1014,960),@(1189,968)),
 @(@(49,1169),@(221,1124),@(398,1103),@(583,1120),@(735,1170),@(877,1174),@(1019,1182),@(1141,1181))
 )
 $muzzles=@{
 revolver=@(@(157,84),@(302,128),@(405,154),@(510,128),@(637,85),@(815,61),@(1016,40),@(1220,60))
 shotgun=@(@(153,240),@(295,276),@(404,287),@(510,278),@(647,241),@(822,215),@(1016,206),@(1211,214))
 rain=@(@(139,837),@(287,864),@(405,875),@(514,873),@(655,832),@(823,810),@(1016,810),@(1207,817))
 solar=@(@(151,1135),@(298,1171),@(399,1198),@(502,1170),@(640,1137),@(815,1110),@(1019,1093),@(1210,1113))
 }
 # Maximum visual span in game units, independent of PNG resolution. Each
 # weapon shares a single source reference across all eight directions.
 $sizes=@(16,23,16,18,24,21,28,26);$weapons=[ordered]@{};$zero=0;$partial=0
 for($row=0;$row -lt 8;$row++){
  $frames=@()
  for($col=0;$col -lt 8;$col++){
   $x0=$cols[$col+1];$x1=$cols[$col];$y0=$rows[$row+1];$y1=$rows[$row]
   for($y=$rows[$row];$y -lt $rows[$row+1];$y++){for($x=$cols[$col];$x -lt $cols[$col+1];$x++){
    $a=$bmp.GetPixel($x,$y).A
    if($a -eq 0){$zero++}elseif($a -lt 255){$partial++}
    if($a -gt 16){$x0=[Math]::Min($x0,$x);$x1=[Math]::Max($x1,$x);$y0=[Math]::Min($y0,$y);$y1=[Math]::Max($y1,$y)}
   }}
   $anchor=if($row -eq 3){@([int](($x0+$x1)/2),[int](($y0+$y1)/2))}else{$anchors[$row][$col]}
   $f=[ordered]@{x=$x0;y=$y0;w=$x1-$x0+1;h=$y1-$y0+1;pivot=@(($anchor[0]-$x0),($anchor[1]-$y0))}
   if($muzzles.ContainsKey($ids[$row])){$m=$muzzles[$ids[$row]][$col];$f.muzzle=@(($m[0]-$x0),($m[1]-$y0))}
   $frames+=$f
  }
  $weapons[$ids[$row]]=@{worldSize=$sizes[$row];frames=$frames}
 }
 $meta=[ordered]@{basePath='../assets/weapons/';images=[ordered]@{weapons_8directions=@{size=@(1254,1254)}};source='assets/weapons/weapons_8directions.png';sourceSHA256=(Get-FileHash $source).Hash;transparentPixels=$zero;partialAlphaPixels=$partial;weapons=$weapons}
 [IO.File]::WriteAllText((Join-Path $root 'assets/weapons/atlas.js'),"/* Measured by tools/build_weapon_atlas.ps1; originals preserved. */`nconst WeaponAtlas = " + ($meta|ConvertTo-Json -Depth 12) + ";`n")
 Write-Output "Weapons $($bmp.Width)x$($bmp.Height): alpha0=$zero partial=$partial; 64 crops with pivots."
}finally{$bmp.Dispose()}
