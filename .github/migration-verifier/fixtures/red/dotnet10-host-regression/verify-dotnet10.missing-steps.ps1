dotnet --info
dotnet build .\Portal.sln -c Release --nologo
dotnet publish .\Portal.sln -c Release --no-build --nologo
Write-Host "Verify static asset paths and publish output"
