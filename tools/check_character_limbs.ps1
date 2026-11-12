$ErrorActionPreference='Stop'
Push-Location (Split-Path $PSScriptRoot -Parent)
try { & node tools/check_hero_sprites.cjs; if($LASTEXITCODE -ne 0){throw 'Hero validation failed'} } finally { Pop-Location }
