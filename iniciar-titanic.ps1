param([switch]$SemAbrirNavegador)

$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$url = 'http://127.0.0.1:3011/'
$python = Join-Path $PSScriptRoot '.titanic-runtime\Scripts\python.exe'

function Test-TitanicLocal {
    try {
        $health = Invoke-RestMethod -UseBasicParsing -Uri ($url + 'api/health') -TimeoutSec 3
        return $health.status -eq 'UP'
    } catch {
        return $false
    }
}

try {
    if (Test-TitanicLocal) {
        Write-Host "A apresentacao ja esta aberta em $url" -ForegroundColor Green
    } else {
        if (-not (Test-Path -LiteralPath $python)) {
            if (-not (Get-Command py -ErrorAction SilentlyContinue)) {
                throw 'Python nao encontrado. Instale Python 3.11 ou superior e execute este arquivo novamente.'
            }
            Write-Host 'Preparando ambiente Python local...'
            $ErrorActionPreference = 'Continue'
            & py -3.11 --version *> $null
            $python311Available = $LASTEXITCODE -eq 0
            $ErrorActionPreference = 'Stop'
            if (-not $python311Available) {
                throw 'Python 3.11 nao encontrado. Instale-o para executar a apresentacao localmente.'
            }
            & py -3.11 -m venv .titanic-runtime
            if ($LASTEXITCODE -ne 0) { throw 'Nao foi possivel criar o ambiente Python local.' }
        }

        $ErrorActionPreference = 'Continue'
        & $python -c "import fastapi, pandas, uvicorn" *> $null
        $dependenciesReady = $LASTEXITCODE -eq 0
        $ErrorActionPreference = 'Stop'
        if (-not $dependenciesReady) {
            Write-Host 'Instalando dependencias da primeira execucao...'
            & $python -m pip install --disable-pip-version-check -r app/api/requirements.txt
            if ($LASTEXITCODE -ne 0) { throw 'Falha ao instalar as dependencias Python.' }
        }

        Write-Host 'Iniciando apresentacao local com Python...'
        Start-Process -FilePath $python -ArgumentList @('-m', 'uvicorn', 'app.main:app', '--app-dir', 'app/api', '--host', '127.0.0.1', '--port', '3011') -WindowStyle Hidden

        $deadline = (Get-Date).AddSeconds(45)
        do {
            Start-Sleep -Milliseconds 800
            $ready = Test-TitanicLocal
        } until ($ready -or (Get-Date) -ge $deadline)
        if (-not $ready) { throw 'A apresentacao nao iniciou. Confira se a porta 3011 esta livre e tente novamente.' }
        Write-Host "Pronto! Apresentacao local: $url" -ForegroundColor Green
    }

    Write-Host 'Nao usa Docker, banco de dados ou Node.js para executar.'
    Write-Host 'Na primeira vez e preciso internet somente para instalar as bibliotecas Python.'
    if (-not $SemAbrirNavegador) { Start-Process $url }
    exit 0
} catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
