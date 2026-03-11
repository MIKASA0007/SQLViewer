# Restart ADB and check devices
$env:ANDROID_HOME = "C:\Users\Administrator\AppData\Local\Android\Sdk"
$env:PATH = "$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\emulator;$env:PATH"

Write-Host "Restarting ADB server..." -ForegroundColor Yellow
& adb kill-server
Start-Sleep -Seconds 1
& adb start-server
Start-Sleep -Seconds 2

Write-Host "Checking connected devices..." -ForegroundColor Cyan
& adb devices
