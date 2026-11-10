param([ValidateSet('nopal','rosa')][string]$Character = 'nopal')
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$url = ([System.Uri](Join-Path $PSScriptRoot "$Character-preview.generated.html")).AbsoluteUri
$modes=if($Character -eq 'rosa'){@('frames','angles','fallback','gameplay')}else{@('frames','angles','fallback')}
foreach ($mode in $modes) {
 $query = if($mode -eq 'frames'){''}else{"?$mode=1"}
 $chromeArgs = @('--headless','--disable-gpu','--no-first-run','--allow-file-access-from-files',
   "--user-data-dir=$env:TEMP/cactus-nopal-capture",'--window-size=1280,980','--virtual-time-budget=5000',
   "--screenshot=$root/tools/$Character-$mode.png",'--dump-dom',"$url$query")
 $p=Start-Process -FilePath 'C:/Program Files/Google/Chrome/Application/chrome.exe' -ArgumentList $chromeArgs -WindowStyle Hidden -Wait -PassThru -RedirectStandardOutput "$PSScriptRoot/$Character-$mode.generated.html" -RedirectStandardError "$PSScriptRoot/$Character-$mode.generated.log"
 if($p.ExitCode -ne 0){throw "Chrome failed in $mode"}
 $dom=Get-Content -Raw "$PSScriptRoot/$Character-$mode.generated.html"
 if($dom -notmatch "data-$Character-check=`"pass`""){throw "Browser checks failed in $mode; inspect generated DOM/log"}
 Write-Output "PASS browser: $Character $mode"
}
