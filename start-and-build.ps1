# Start emulator and build app with Gradle 8.13
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-11.0.28.6-hotspot"
$env:ANDROID_HOME = "C:\Users\Administrator\AppData\Local\Android\Sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\emulator;$env:Path"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Start Emulator and Build App" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Start emulator
Write-Host "[1/3] Starting emulator..." -ForegroundColor Yellow
$emulatorProcess = Start-Process emulator -ArgumentList "-avd Medium_Phone_API_36.1" -PassThru
Write-Host "Emulator started (PID: $($emulatorProcess.Id))" -ForegroundColor Green
Write-Host "Waiting 60 seconds for emulator to boot..." -ForegroundColor Cyan

# Wait for emulator to be ready
$maxAttempts = 30
$attempts = 0
while ($attempts -lt $maxAttempts) {
    $devices = & adb devices
    if ($devices -match "emulator-.+device") {
        Write-Host "Emulator is ready!" -ForegroundColor Green
        break
    }
    $attempts++
    Start-Sleep -Seconds 2
    
    if ($attempts % 5 -eq 0) {
        Write-Host "Still waiting... ($attempts/$maxAttempts attempts)" -ForegroundColor Gray
    }
}

if ($attempts -ge $maxAttempts) {
    Write-Host "Error: Emulator not ready after 60 seconds" -ForegroundColor Red
    & adb devices
}

Write-Host ""

# Step 2: Verify Gradle 8.13 is configured
Write-Host "[2/3] Verifying Gradle configuration..." -ForegroundColor Yellow
$gradleConfig = Get-Content "D:\huilianyi\app\SQLViewer\android\gradle\wrapper\gradle-wrapper.properties"
if ($gradleConfig -match "gradle-8.13") {
    Write-Host "Gradle 8.13 configured" -ForegroundColor Green
} else {
    Write-Host "Warning: Gradle version may not be 8.13" -ForegroundColor Yellow
}

Write-Host ""

# Step 3: Build and install app
Write-Host "[3/3] Building and installing app..." -ForegroundColor Yellow
Write-Host "This may take 5-10 minutes..." -ForegroundColor Cyan
Write-Host ""

cd "D:\huilianyi\app\SQLViewer"
npm run android -- --port=8082
