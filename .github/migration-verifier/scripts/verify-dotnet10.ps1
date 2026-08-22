param(
    [string]$SolutionOrProject = "",
    [string]$Configuration = "Release",
    [switch]$SkipSsrCheck
)

$ErrorActionPreference = "Stop"

Write-Host "== .NET 10 host verification =="

if ([string]::IsNullOrWhiteSpace($SolutionOrProject)) {
    Write-Host "Pass the solution or project path from the real host repository."
    Write-Host "Example:"
    Write-Host "  .\\verify-dotnet10.ps1 -SolutionOrProject .\\src\\Portal.sln"
    exit 1
}

Write-Host "1. dotnet --info"
dotnet --info

Write-Host "2. dotnet restore"
dotnet restore $SolutionOrProject

Write-Host "3. dotnet build"
dotnet build $SolutionOrProject -c $Configuration --nologo

Write-Host "4. dotnet test"
dotnet test $SolutionOrProject -c $Configuration --no-build --nologo

Write-Host "5. dotnet publish"
dotnet publish $SolutionOrProject -c $Configuration --no-build --nologo

Write-Host "6. host verification reminders"
Write-Host "- Verify static asset paths and publish output"
Write-Host "- Verify authentication end-to-end"

if (-not $SkipSsrCheck) {
    Write-Host "- Verify SSR/prerender if the host uses it"
}

Write-Host "- Verify CI/CD pipeline with .NET 10 SDK"
