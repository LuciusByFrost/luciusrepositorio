$ErrorActionPreference='Stop'
$root=Split-Path $PSScriptRoot -Parent
$chromeArgs=@('--headless','--disable-gpu','--no-first-run','--no-default-browser-check',
 '--disable-background-timer-throttling','--disable-renderer-backgrounding',
 '--remote-debugging-port=9227',"--user-data-dir=$env:TEMP/cactus-entrypoint-verification",'about:blank')
$browser=Start-Process -FilePath 'C:/Program Files/Google/Chrome/Application/chrome.exe' -ArgumentList $chromeArgs -WindowStyle Hidden -PassThru -RedirectStandardOutput "$PSScriptRoot/entrypoints.generated.out" -RedirectStandardError "$PSScriptRoot/entrypoints.generated.log"
Push-Location $root
try {
 & node tools/check_game_entrypoints.cjs 9227
 if($LASTEXITCODE -ne 0){throw 'Real entry point checks failed'}
 & (Join-Path $PSScriptRoot 'make_bento_contact_sheet.ps1')
}
finally { Pop-Location }
