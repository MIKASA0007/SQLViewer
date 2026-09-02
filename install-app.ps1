# Wait for emulator and install app
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-11.0.28.6-hotspot"
$env:ANDROID_HOME = "C:\Users\Administrator\AppData\Local\Android\Sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\emulator;$env:Path"

Write-Host "Checking emulator status..." -ForegroundColor Cyan
$deviceConnected = $false
$attempts = 0
$maxAttempts = 60

while (-not $deviceConnected -and $attempts -lt $maxAttempts) {
    $devices = & adb devices
    if ($devices -match "emulator-.+device") {
        $deviceConnected = $true
        Write-Host "✓ Emulator is ready!" -ForegroundColor Green
        break
    }
    $attempts++
    Write-Host "Waiting for emulator... ($attempts/$maxAttempts)" -ForegroundColor Yellow
    Start-Sleep -Seconds 2
}

if ($deviceConnected) {
    Write-Host "`nStarting React Native app..." -ForegroundColor Cyan
    cd "D:\huilianyi\app\SQLViewer"
    npm run android -- --port=8082
} else {
    Write-Host "Error: Emulator did not start in time" -ForegroundColor Red
    Write-Host "Please check if emulator is running manually" -ForegroundColor Red
}
