# Check Android Emulator Status and Deploy App
$env:ANDROID_HOME = "C:\Users\Administrator\AppData\Local\Android\Sdk"
$env:PATH = "$env:ANDROID_HOME\platform-tools;$env:PATH"
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-11.0.28.6-hotspot"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Android Deployment Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check emulator status
Write-Host "[1] Checking emulator status..." -ForegroundColor Yellow
$devices = & adb devices
Write-Host $devices
Write-Host ""

if ($devices -match "emulator-.+device") {
    Write-Host "OK Emulator is running" -ForegroundColor Green

    # Check if in correct directory
    Write-Host "[2] Switching to project directory..." -ForegroundColor Yellow
    cd "D:\huilianyi\app\SQLViewer"
    Write-Host "Current directory: $(Get-Location)" -ForegroundColor Cyan
    Write-Host ""

    # Deploy app
    Write-Host "[3] Starting deployment to emulator..." -ForegroundColor Yellow
    Write-Host "This may take a few minutes (first build is slower)..." -ForegroundColor Cyan
    Write-Host ""

    npm run android -- --port=8082

} else {
    Write-Host "X Emulator not running" -ForegroundColor Red
    Write-Host ""
    Write-Host "Start emulator first:" -ForegroundColor Cyan
    Write-Host "powershell -ExecutionPolicy Bypass -File D:\huilianyi\app\deploy-emulator.bat" -ForegroundColor White
}
