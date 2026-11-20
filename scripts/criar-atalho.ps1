# Cria (ou atualiza) o atalho "IdleHub" na area de trabalho, com o icone do app.
# Uso: npm run atalho   (ou: powershell -ExecutionPolicy Bypass -File scripts\criar-atalho.ps1)
# Aponta para o Electron local desta pasta; nao precisa de npm nem de PATH para abrir depois.
$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$electron = Join-Path $repo 'node_modules\electron\dist\electron.exe'
$icon = Join-Path $repo 'build\icon.ico'
if (-not (Test-Path $electron)) { Write-Host 'Rode "npm install" nesta pasta primeiro.'; exit 1 }

$desktop = [Environment]::GetFolderPath('Desktop')
$lnk = Join-Path $desktop 'IdleHub.lnk'
$shell = New-Object -ComObject WScript.Shell
$s = $shell.CreateShortcut($lnk)
$s.TargetPath = $electron
$s.Arguments = '"' + $repo + '"'
$s.WorkingDirectory = $repo
$s.IconLocation = "$icon,0"
$s.Description = 'IdleHub: varias contas de jogos idle numa janela so'
$s.Save()
Write-Host "Atalho criado: $lnk"
