@echo off
setlocal EnableExtensions EnableDelayedExpansion
if not defined GITHUB_PERSONAL_ACCESS_TOKEN (
  if defined GH_PERSONAL_ACCESS_TOKEN set "GITHUB_PERSONAL_ACCESS_TOKEN=%GH_PERSONAL_ACCESS_TOKEN%"
)
if not defined GITHUB_PERSONAL_ACCESS_TOKEN (
  if defined GITHUB_PAT_TOKEN set "GITHUB_PERSONAL_ACCESS_TOKEN=%GITHUB_PAT_TOKEN%"
)
if not defined GITHUB_PERSONAL_ACCESS_TOKEN (
  rem Capture stdout in memory so interruption cannot leave a credential file.
  for /f "delims=" %%T in ('gh auth token 2^>nul') do set "GITHUB_PERSONAL_ACCESS_TOKEN=%%T"
)
if not defined GITHUB_PERSONAL_ACCESS_TOKEN (
  echo GITHUB_PERSONAL_ACCESS_TOKEN, GH_PERSONAL_ACCESS_TOKEN, or GITHUB_PAT_TOKEN is required, or sign in with gh auth login. 1>&2
  exit /b 1
)
docker run -i --rm -e GITHUB_PERSONAL_ACCESS_TOKEN ghcr.io/github/github-mcp-server
