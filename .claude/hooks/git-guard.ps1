# PreToolUse hook for the Bash tool. Reads the hook event JSON from stdin and
# enforces: Git Flow branch names, Conventional Commit messages, and no direct
# push to main/develop. Exit 2 blocks the tool call and shows stderr to Claude.
# Fails open (exit 0) if the input cannot be parsed.

$ErrorActionPreference = 'Stop'

function Block([string]$message) {
    [Console]::Error.WriteLine($message)
    exit 2
}

try {
    $hookInput = [Console]::In.ReadToEnd() | ConvertFrom-Json
    $command = [string]$hookInput.tool_input.command
    $cwd = [string]$hookInput.cwd
} catch {
    exit 0
}

if ([string]::IsNullOrWhiteSpace($command)) { exit 0 }

# --- 1. Branch naming (git checkout -b / git switch -c) ----------------------
$branchMatch = [regex]::Match($command, '\bgit\s+(?:checkout\s+-b|switch\s+-c)\s+(\S+)')
if ($branchMatch.Success) {
    $branch = $branchMatch.Groups[1].Value
    $allowed = '^(main|develop|(feature|feat|fix|hotfix|isolate|refactor|docs|test|chore|perf|ci)/.+)$'
    if ($branch -cnotmatch $allowed -and $branch -cnotmatch '^release/') {
        Block "Invalid branch name: $branch`nUse feature/<name>, feat/<name>, fix/<name>, hotfix/<name>, isolate/dec-NNN, or release/vMAJOR.MINOR.PATCH."
    }
    if ($branch -cmatch '^release/' -and $branch -cnotmatch '^release/v\d+\.\d+\.\d+(-.+)?$') {
        Block "Invalid release version: $branch`nUse release/vMAJOR.MINOR.PATCH[-prerelease]."
    }
}

# --- 2. Conventional Commits (git commit -m ...) -----------------------------
if ($command -match '\bgit\s+commit\b') {
    $msg = $null
    $heredoc = [regex]::Match($command, "<<-?\s*['""]?\w+['""]?\r?\n([^\r\n]+)")
    $inline = [regex]::Match($command, '(?:-m|--message)[\s=]+(?:"([^"]+)"|''([^'']+)'')')
    if ($heredoc.Success) {
        $msg = $heredoc.Groups[1].Value.Trim()
    } elseif ($inline.Success) {
        $msg = if ($inline.Groups[1].Success) { $inline.Groups[1].Value } else { $inline.Groups[2].Value }
    }
    if ($msg -and $msg -cnotmatch '^(feat|fix|docs|style|refactor|perf|test|chore|ci|build|revert)(\(.+\))?!?: \S') {
        Block "Invalid commit message: $msg`nUse Conventional Commits: type(scope): description`nTypes: feat fix docs style refactor perf test chore ci build revert"
    }
}

# --- 3. No direct push to main/develop ---------------------------------------
$pushMatch = [regex]::Match($command, '\bgit\s+push\b([^&|;\r\n]*)')
if ($pushMatch.Success) {
    $tokens = @($pushMatch.Groups[1].Value -split '\s+' | Where-Object { $_ -and $_ -notmatch '^-' })
    $targetsProtected = $false
    foreach ($t in $tokens) {
        if ($t -cmatch '(^|:|/)(main|develop)$') { $targetsProtected = $true }
    }
    # No explicit refspec (bare push or remote only): the current branch is the target.
    if ($tokens.Count -le 1) {
        $current = ''
        try {
            if ($cwd -and (Test-Path -LiteralPath $cwd)) { Push-Location -LiteralPath $cwd }
            $current = (& git branch --show-current 2>$null | Out-String).Trim()
        } catch { Write-Verbose "git-guard: branch lookup failed: $_" } finally { Pop-Location -ErrorAction SilentlyContinue }
        if ($current -ceq 'main' -or $current -ceq 'develop') { $targetsProtected = $true }
    }
    if ($targetsProtected) {
        Block "Direct push to main/develop is not allowed.`nPush a feature branch and open a PR: git push -u origin <branch>; gh pr create"
    }
}

exit 0
