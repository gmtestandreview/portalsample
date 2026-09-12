@echo off
setlocal
set "REPO_ROOT=%~dp0.."
set "PATH=%REPO_ROOT%\node_modules\.bin;%PATH%"
cd /d "%REPO_ROOT%"
call "%REPO_ROOT%\node_modules\.bin\lsmcp.cmd" --config ".lsmcp\config.json"
