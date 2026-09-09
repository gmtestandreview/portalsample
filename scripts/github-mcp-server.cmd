@echo off
setlocal EnableExtensions EnableDelayedExpansion
if not defined GITHUB_PERSONAL_ACCESS_TOKEN (
  if defined GH_PERSONAL_ACCESS_TOKEN set "GITHUB_PERSONAL_ACCESS_TOKEN=%GH_PERSONAL_ACCESS_TOKEN%"
)
if not defined GITHUB_PERSONAL_ACCESS_TOKEN (
  if defined GITHUB_PAT_TOKEN set "GITHUB_PERSONAL_ACCESS_TOKEN=%GITHUB_PAT_TOKEN%"
)
if not defined GITHUB_PERSONAL_ACCESS_TOKEN (
  set "GITHUB_MCP_TOKEN_FILE=%TEMP%\github-mcp-token.txt"
  gh auth token > "!GITHUB_MCP_TOKEN_FILE!" 2>nul
  if exist "!GITHUB_MCP_TOKEN_FILE!" (
    set /p GITHUB_PERSONAL_ACCESS_TOKEN=<"!GITHUB_MCP_TOKEN_FILE!"
    del "!GITHUB_MCP_TOKEN_FILE!" >nul 2>nul
  )
)
if not defined GITHUB_PERSONAL_ACCESS_TOKEN (
  echo GITHUB_PERSONAL_ACCESS_TOKEN, GH_PERSONAL_ACCESS_TOKEN, or GITHUB_PAT_TOKEN is required, or sign in with gh auth login. 1>&2
  exit /b 1
)
docker run -i --rm -e GITHUB_PERSONAL_ACCESS_TOKEN ghcr.io/github/github-mcp-server
