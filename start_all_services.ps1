Write-Host "Starting all VitalScore Finance services..." -ForegroundColor Cyan

$rootPath = $PWD.Path

Write-Host "Starting Docker containers..." -ForegroundColor Yellow
docker-compose up -d

$services = @(
    @{ Name = "User Profile"; Path = "backend\services\user-profile"; Command = "npm run dev" },
    @{ Name = "Auth Service"; Path = "backend\services\auth-service"; Command = "npm run dev" },
    @{ Name = "Transaction Ingestion"; Path = "backend\services\transaction-ingestion"; Command = "npm run dev" },
    @{ Name = "Score Engine"; Path = "backend\services\score-engine"; Command = "npm run dev" },
    @{ Name = "Gamification"; Path = "backend\services\gamification-service"; Command = "npm run dev" },
    @{ Name = "AI Categorization"; Path = "backend\services\ai-categorization"; Command = "npm run dev" },
    @{ Name = "Blockchain (Python)"; Path = "backend\services\blockchain-service-python"; Command = "python app.py" },
    @{ Name = "Frontend"; Path = "frontend\web"; Command = "npm run dev" }
)

foreach ($service in $services) {
    Write-Host "Starting $($service.Name)..." -ForegroundColor Yellow
    $servicePath = Join-Path $rootPath $service.Path
    
    # We use Start-Process to launch a new PowerShell window in the correct directory
    $argList = "-NoExit -Command `" `$host.UI.RawUI.WindowTitle='$($service.Name)'; $($service.Command) `""
    Start-Process powershell -WorkingDirectory $servicePath -ArgumentList $argList
    
    Start-Sleep -Seconds 2
}

Write-Host "All services have been launched in separate terminal windows!" -ForegroundColor Green
Write-Host "You can view the frontend at http://localhost:5173" -ForegroundColor Cyan
