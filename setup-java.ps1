# Configure Environment Variables for React Native Android
# Java already found at: C:\Program Files\Eclipse Adoptium\jdk-11.0.28.6-hotspot

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Configuring Java Environment Variables" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Set JAVA_HOME
$javaPath = "C:\Program Files\Eclipse Adoptium\jdk-11.0.28.6-hotspot"
Write-Host "[1/3] Setting JAVA_HOME to: $javaPath" -ForegroundColor Yellow
[System.Environment]::SetEnvironmentVariable('JAVA_HOME', $javaPath, 'Machine')

# Add Java to PATH
$javaBin = "$javaPath\bin"
$currentPath = [System.Environment]::GetEnvironmentVariable('Path', 'Machine')

if ($currentPath -notlike "*$javaBin*") {
    Write-Host "[2/3] Adding Java to PATH..." -ForegroundColor Yellow
    [System.Environment]::SetEnvironmentVariable('Path', $currentPath + ";$javaBin", 'Machine')
} else {
    Write-Host "[2/3] Java already in PATH" -ForegroundColor Green
}

# Set for current session
$env:JAVA_HOME = $javaPath
$env:Path = $javaBin + ";" + $env:Path

Write-Host "[3/3] Verifying Java installation..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

# Test Java
try {
    $javaVersion = & java -version 2>&1 | Select-String "version"
    Write-Host "Java configured successfully!" -ForegroundColor Green
    Write-Host "Java version: $javaVersion" -ForegroundColor Green
} catch {
    Write-Host "Error: Java not found. Please restart your terminal." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Green
Write-Host "Environment variables configured!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANT: Close this terminal and open a new one" -ForegroundColor Yellow
Write-Host "to apply the new environment variables." -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Close terminal and reopen" -ForegroundColor Cyan
Write-Host "2. cd D:\huilianyi\app\SQLViewer" -ForegroundColor Cyan
Write-Host "3. npm run android" -ForegroundColor Cyan
