# Setup Environment Variables and Run Android
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-11.0.28.6-hotspot"
$env:ANDROID_HOME = "C:\Users\Administrator\AppData\Local\Android\Sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\emulator;$env:Path"

Write-Host "Java:" -ForegroundColor Cyan
& java -version
Write-Host ""

Write-Host "ADB:" -ForegroundColor Cyan
& adb version
Write-Host ""

Write-Host "Running npm run android with port 8082..." -ForegroundColor Yellow
cd "D:\huilianyi\app\SQLViewer"
npm run android -- --port=8082
