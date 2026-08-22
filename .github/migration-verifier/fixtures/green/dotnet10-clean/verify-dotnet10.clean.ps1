dotnet --info
dotnet restore .\Portal.sln
dotnet build .\Portal.sln -c Release --nologo
dotnet test .\Portal.sln -c Release --no-build --nologo
dotnet publish .\Portal.sln -c Release --no-build --nologo
Write-Host "Verify static asset paths and publish output"
Write-Host "Verify authentication end-to-end"
Write-Host "Verify SSR/prerender if the host uses it"
Write-Host "Verify CI/CD pipeline with .NET 10 SDK"
