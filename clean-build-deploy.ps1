# Clean build and deploy with extended timeout
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-11.0.28.6-hotspot"
$env:ANDROID_HOME = "C:\Users\Administrator\AppData\Local\Android\Sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\emulator;$env:Path"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Clean Build and Deploy" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Clean previous build
Write-Host "[1/3] Cleaning previous build..." -ForegroundColor Yellow
cd "D:\huilianyi\app\SQLViewer\android"
& "./gradlew.bat" clean

if ($LASTEXITCODE -eq 0) {
    Write-Host "Build cache cleaned successfully" -ForegroundColor Green
} else {
    Write-Host "Warning: Clean command failed, continuing..." -ForegroundColor Yellow
}
Write-Host ""

# Step 2: Check emulator
Write-Host "[2/3] Checking emulator status..." -ForegroundColor Yellow
cd "D:\huilianyi\app\SQLViewer"
$devices = & adb devices
Write-Host $devices

if ($devices -match "emulator-.+device") {
    Write-Host "Emulator is running" -ForegroundColor Green
} else {
    Write-Host "Error: Emulator not connected" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 3: Build and install
Write-Host "[3/3] Building and installing app..." -ForegroundColor Yellow
Write-Host "This may take 5-10 minutes on first build..." -ForegroundColor Cyan
Write-Host ""

npm run android -- --port=8082
