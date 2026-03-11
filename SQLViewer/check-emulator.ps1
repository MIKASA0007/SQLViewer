# Check emulator and restart if needed
$env:ANDROID_HOME = "C:\Users\Administrator\AppData\Local\Android\Sdk"
$env:PATH = "$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\emulator;$env:PATH"

Write-Host "Checking Android Emulator..." -ForegroundColor Cyan
$devices = & adb devices
Write-Host $devices

if ($devices -match "emulator-.+device") {
    Write-Host "Emulator is running" -ForegroundColor Green
    exit 0
} else {
    Write-Host "Emulator not connected, starting..." -ForegroundColor Yellow
    & emulator -avd Medium_Phone_API_36.1

    Write-Host "Waiting 10 seconds for emulator to boot..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10

    $devices = & adb devices
    Write-Host $devices

    if ($devices -match "emulator-.+device") {
        Write-Host "Emulator is now running" -ForegroundColor Green
        exit 0
    } else {
        Write-Host "Failed to start emulator" -ForegroundColor Red
        exit 1
    }
}
