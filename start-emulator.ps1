# List and Start Android Emulator
$env:ANDROID_HOME = "C:\Users\Administrator\AppData\Local\Android\Sdk"
$env:PATH = "$env:ANDROID_HOME\emulator;$env:PATH"

Write-Host "Available Android Virtual Devices:" -ForegroundColor Cyan
& emulator -list-avds
Write-Host ""

Write-Host "Starting emulator: Medium_Phone_API_36.1" -Foregroundcolor Yellow
Start-Process emulator -ArgumentList "@Medium_Phone_API_36.1" -NoNewWindow

Write-Host "Emulator is starting... Please wait for it to fully load" -ForegroundColor Green
Write-Host "Then run: powershell -ExecutionPolicy Bypass -File run-android.ps1" -ForegroundColor Cyan
