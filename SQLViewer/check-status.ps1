# Check emulator process and ADB devices
$env:ANDROID_HOME = "C:\Users\Administrator\AppData\Local\Android\Sdk"
$env:PATH = "$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\emulator;$env:PATH"

Write-Host "Checking emulator process..." -ForegroundColor Cyan
$emulatorProcess = Get-Process -Name "emulator" -ErrorAction SilentlyContinue
if ($emulatorProcess) {
    Write-Host "Emulator process found (PID: $($emulatorProcess.Id))" -ForegroundColor Green
} else {
    Write-Host "No emulator process found" -ForegroundColor Red
}

Write-Host ""
Write-Host "Checking ADB devices..." -ForegroundColor Cyan
& adb devices
