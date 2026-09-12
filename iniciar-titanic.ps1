param([switch]$SemAbrirNavegador)
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
try {
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { throw 'Docker Desktop nao encontrado. Instale e prepare o projeto com internet antes da apresentacao.' }
    Write-Host 'Verificando Docker Desktop...'
    $ErrorActionPreference = 'Continue'
    docker info *> $null
    $ErrorActionPreference = 'Stop'
    if ($LASTEXITCODE -ne 0) {
        $dockerDesktop = Join-Path $env:ProgramFiles 'Docker\Docker\Docker Desktop.exe'
        if (-not (Test-Path -LiteralPath $dockerDesktop)) { throw 'Abra o Docker Desktop e tente novamente.' }
        Start-Process -FilePath $dockerDesktop -WindowStyle Hidden
        $deadline = (Get-Date).AddMinutes(3)
        do {
            Start-Sleep -Seconds 3
            $ErrorActionPreference = 'Continue'
            docker info *> $null
            $ErrorActionPreference = 'Stop'
            $dockerReady = $LASTEXITCODE -eq 0
        } until ($dockerReady -or (Get-Date) -ge $deadline)
        if (-not $dockerReady) { throw 'O Docker nao ficou pronto em 3 minutos. Confira o Docker Desktop e tente novamente.' }
    }
    Write-Host 'Iniciando Titanic com imagens locais, sem downloads...'
    $ErrorActionPreference = 'Continue'
    docker compose up -d --no-build --pull never --wait --wait-timeout 180
    $ErrorActionPreference = 'Stop'
    if ($LASTEXITCODE -ne 0) { throw 'Falha ao iniciar. Se faltarem imagens, execute com internet: docker compose build api web. Depois tente novamente.' }
    $url = 'http://127.0.0.1:3011/'
    $page = Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 15
    $data = Invoke-RestMethod -Uri ($url + 'api/presentation') -TimeoutSec 30
    if ($page.StatusCode -ne 200 -or -not $data) { throw 'O site ou os dados locais nao responderam corretamente.' }
    Write-Host "Pronto! Apresentacao local: $url" -ForegroundColor Green
    Write-Host 'Pode usar sem internet neste computador. Links externos e QR do site publico precisam de conexao.'
    if (-not $SemAbrirNavegador) { Start-Process $url }
    exit 0
} catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
