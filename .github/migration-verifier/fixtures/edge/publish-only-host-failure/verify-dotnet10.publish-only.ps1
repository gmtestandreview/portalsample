dotnet --info
dotnet publish .\Portal.sln -c Release --nologo
Write-Host "Verify authentication end-to-end"
Write-Host "Verify static asset paths and publish output"
