# Wait for emulator and build app
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-11.0.28.6-hotspot"
$env:ANDROID_HOME = "C:\Users\Administrator\AppData\Local\Android\Sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\emulator;$env:Path"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Build and Deploy App (Gradle 8.13)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Wait for emulator to be ready
Write-Host "[1/2] Waiting for emulator to be ready..." -ForegroundColor Yellow
$maxAttempts = 30
$attempts = 0

while ($attempts -lt $maxAttempts) {
    $devices = & adb devices
    if ($devices -match "emulator-.+device") {
        Write-Host "Emulator is ready!" -ForegroundColor Green
        break
    }
    
    $attempts++
    $percent = [math]::Round(($attempts / $maxAttempts) * 100)
    Write-Host "Waiting... ($attempts/$maxAttempts, $percent%) - Emulator booting" -ForegroundColor Gray
    Start-Sleep -Seconds 2
}

if ($attempts -ge $maxAttempts) {
    Write-Host "Error: Emulator not ready after 60 seconds" -ForegroundColor Red
    Write-Host "Please check if emulator is running properly" -ForegroundColor Red
    & adb devices
    exit 1
}
Write-Host ""

# Step 2: Build and install app
Write-Host "[2/2] Building and installing app..." -ForegroundColor Yellow
Write-Host "Using Gradle 8.13 (upgraded from 8.5)" -ForegroundColor Cyan
Write-Host "This may take 5-10 minutes on first build..." -ForegroundColor Cyan
Write-Host ""

cd "D:\huilianyi\app\SQLViewer"
npm run android -- --port=8082
