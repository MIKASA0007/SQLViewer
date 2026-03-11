# Build app with Java 17 and Gradle 8.13
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.18.8-hotspot"
$env:ANDROID_HOME = "C:\Users\Administrator\AppData\Local\Android\Sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\emulator;$env:Path"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Build App with Java 17" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verify Java version
Write-Host "[1/3] Verifying Java version..." -ForegroundColor Yellow
& java -version
Write-Host ""

# Check emulator status
Write-Host "[2/3] Checking emulator status..." -ForegroundColor Yellow
$devices = & adb devices
Write-Host $devices

if ($devices -match "emulator-.+device") {
    Write-Host "Emulator is running" -ForegroundColor Green
} else {
    Write-Host "Starting emulator..." -ForegroundColor Cyan
    Start-Process emulator -ArgumentList "-avd Medium_Phone_API_36.1" -PassThru | Out-Null
    Start-Sleep -Seconds 40
    $devices = & adb devices
    Write-Host $devices
}

Write-Host ""

# Build and install app
Write-Host "[3/3] Building and installing app with Java 17..." -ForegroundColor Yellow
Write-Host "Gradle 8.13 + Java 17" -ForegroundColor Cyan
Write-Host "This may take 5-10 minutes..." -ForegroundColor Cyan
Write-Host ""

cd "D:\huilianyi\app\SQLViewer"
npm run android -- --port=8082
