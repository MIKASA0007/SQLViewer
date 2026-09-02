# SQLViewer Debug APK Build Script
# Run in PowerShell: .\build-debug-apk.ps1

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SQLViewer Debug APK Builder" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check directory
if (-not (Test-Path "package.json")) {
    Write-Error "Error: Please run this script from project root"
    exit 1
}

Write-Host "OK - Directory check passed" -ForegroundColor Green

# Step 1: Check dependencies
Write-Host ""
Write-Host "Step 1/5: Checking Node dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "  Running npm install..." -ForegroundColor Cyan
    npm install
} else {
    Write-Host "  OK - Dependencies installed" -ForegroundColor Green
}

# Step 2: Check Android environment
Write-Host ""
Write-Host "Step 2/5: Checking Android environment..." -ForegroundColor Yellow
$androidHome = $env:ANDROID_HOME
if (-not $androidHome) {
    Write-Warning "Warning: ANDROID_HOME not set"
} else {
    Write-Host "  OK - ANDROID_HOME: $androidHome" -ForegroundColor Green
}

# Step 3: Clean previous build
Write-Host ""
Write-Host "Step 3/5: Cleaning previous build..." -ForegroundColor Yellow
cd android
Write-Host "  Running: gradlew clean" -ForegroundColor Cyan
.\gradlew clean --quiet
if ($LASTEXITCODE -ne 0) {
    Write-Error "Clean failed"
    exit 1
}
Write-Host "  OK - Clean complete" -ForegroundColor Green

# Step 4: Build Debug APK
Write-Host ""
Write-Host "Step 4/5: Building Debug APK..." -ForegroundColor Yellow
Write-Host "  This may take 10-15 minutes, please wait..." -ForegroundColor Yellow
Write-Host "  Running: gradlew assembleDebug" -ForegroundColor Cyan
Write-Host ""

$startTime = Get-Date
.\gradlew assembleDebug
$buildTime = (Get-Date) - $startTime

if ($LASTEXITCODE -ne 0) {
    Write-Error "Build failed"
    exit 1
}

Write-Host ""
Write-Host "  OK - Build complete (time: $($buildTime.ToString('mm\:ss')))" -ForegroundColor Green

# Step 5: Verify and copy APK
Write-Host ""
Write-Host "Step 5/5: Verifying APK..." -ForegroundColor Yellow

$apkPath = "app\build\outputs\apk\debug\app-debug.apk"
if (Test-Path $apkPath) {
    $apkSize = (Get-Item $apkPath).Length / 1MB
    Write-Host "  OK - APK generated" -ForegroundColor Green
    Write-Host "  Location: android\$apkPath" -ForegroundColor Cyan
    Write-Host "  Size: $([math]::Round($apkSize, 2)) MB" -ForegroundColor Cyan
    
    $outputPath = "..\SQLViewer-debug.apk"
    Copy-Item $apkPath $outputPath -Force
    Write-Host "  Copied to: SQLViewer-debug.apk" -ForegroundColor Green
} else {
    Write-Error "Error: APK not found"
    exit 1
}

cd ..

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Build successful!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Install to device:" -ForegroundColor Yellow
Write-Host "  adb install SQLViewer-debug.apk" -ForegroundColor Cyan
Write-Host ""