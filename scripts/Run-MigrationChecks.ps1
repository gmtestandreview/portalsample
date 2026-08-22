$ErrorActionPreference = "Continue"

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$reportRoot = "reports/migration-checks/$timestamp"
New-Item -ItemType Directory -Force -Path $reportRoot | Out-Null

$checks = @(
  "type-check",
  "lint",
  "test:unit",
  "test:unit:coverage",
  "test:storybook",
  "test:quality:regression",
  "test:e2e",
  "build",
  "build-storybook",
  "migration-check"
)

$issuePattern = "(?i)\b(error|failed|failure|failures|exception|cannot|unable|not found|timeout|timed out|blocked|coverage|diagnostic|warning|warn|violation|expected|received|stack trace|npm ERR!)\b"

function ConvertTo-HtmlEncoded {
  param([AllowNull()][string]$Value)

  if ($null -eq $Value) {
    return ""
  }

  return [System.Net.WebUtility]::HtmlEncode($Value)
}

$results = @()

foreach ($check in $checks) {
  Write-Host "`nRunning npm run $check ..." -ForegroundColor Cyan

  $safeName = $check -replace "[:\\\/]", "-"
  $logPath = Join-Path $reportRoot "$safeName.log"

  $output = & npm run $check 2>&1 | ForEach-Object { $_.ToString() }
  $exitCode = $LASTEXITCODE

  $output | Set-Content -Path $logPath -Encoding UTF8

  $issueLines = $output |
    Where-Object { $_ -match $issuePattern } |
    Select-Object -First 160

  $results += [pscustomobject]@{
    Name = $check
    Command = "npm run $check"
    ExitCode = $exitCode
    Passed = $exitCode -eq 0
    LogPath = $logPath
    IssueLines = $issueLines
  }

  if ($exitCode -eq 0) {
    Write-Host "PASS: npm run $check" -ForegroundColor Green
  }
  else {
    Write-Host "FAIL: npm run $check exited with code $exitCode" -ForegroundColor Red
  }
}

$reportPath = Join-Path $reportRoot "issues-report.html"

$failed = $results | Where-Object { -not $_.Passed }
$warningsOnly = $results | Where-Object { $_.Passed -and $_.IssueLines.Count -gt 0 }

$summaryRows = foreach ($result in $results) {
  $statusClass = if ($result.Passed) { "pass" } else { "fail" }
  $statusText = if ($result.Passed) { "PASS" } else { "FAIL" }
  $issueCount = $result.IssueLines.Count
  $encodedCommand = ConvertTo-HtmlEncoded $result.Command
  $encodedLogPath = ConvertTo-HtmlEncoded $result.LogPath

  @"
<tr>
  <td><code>$encodedCommand</code></td>
  <td class="$statusClass">$statusText</td>
  <td>$($result.ExitCode)</td>
  <td>$issueCount</td>
  <td><code>$encodedLogPath</code></td>
</tr>
"@
}

$issueSections = @()

if ($failed.Count -eq 0 -and $warningsOnly.Count -eq 0) {
  $issueSections += @"
<section class="card success">
  <h2>No issues detected</h2>
  <p>All commands completed successfully and no issue-like output matched the report filter.</p>
</section>
"@
}
else {
  if ($failed.Count -gt 0) {
    $issueSections += "<section class='card'><h2>Failed Commands</h2>"

    foreach ($result in $failed) {
      $encodedCommand = ConvertTo-HtmlEncoded $result.Command
      $encodedLogPath = ConvertTo-HtmlEncoded $result.LogPath

      $issueText = if ($result.IssueLines.Count -gt 0) {
        ConvertTo-HtmlEncoded ($result.IssueLines -join "`n")
      }
      else {
        "Command failed, but no issue lines matched the filter. Check the full log."
      }

      $issueSections += @"
<article class="issue fail-border">
  <h3><code>$encodedCommand</code></h3>
  <p><strong>Exit code:</strong> $($result.ExitCode)</p>
  <p><strong>Full log:</strong> <code>$encodedLogPath</code></p>
  <pre><code>$issueText</code></pre>
</article>
"@
    }

    $issueSections += "</section>"
  }

  if ($warningsOnly.Count -gt 0) {
    $issueSections += "<section class='card'><h2>Passed Commands With Warning / Issue-Like Output</h2>"

    foreach ($result in $warningsOnly) {
      $encodedCommand = ConvertTo-HtmlEncoded $result.Command
      $encodedLogPath = ConvertTo-HtmlEncoded $result.LogPath
      $issueText = ConvertTo-HtmlEncoded ($result.IssueLines -join "`n")

      $issueSections += @"
<article class="issue warn-border">
  <h3><code>$encodedCommand</code></h3>
  <p><strong>Exit code:</strong> $($result.ExitCode)</p>
  <p><strong>Full log:</strong> <code>$encodedLogPath</code></p>
  <pre><code>$issueText</code></pre>
</article>
"@
    }

    $issueSections += "</section>"
  }
}

$overallStatus = if ($failed.Count -gt 0) { "FAILED" } else { "PASSED" }
$overallClass = if ($failed.Count -gt 0) { "fail" } else { "pass" }

$html = @"
<!doctype html>
<html lang="en-AU">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Migration Check Issues Report</title>
  <style>
    :root {
      --bg: #f6f8fb;
      --page: #ffffff;
      --ink: #172033;
      --muted: #5f6b7a;
      --border: #d7dee8;
      --pass: #0f7b3f;
      --pass-bg: #eefaf2;
      --fail: #b32123;
      --fail-bg: #fff1f2;
      --warn: #9a5b00;
      --warn-bg: #fff8dc;
      --code-bg: #111827;
      --code-ink: #e5e7eb;
      --blue: #123f65;
    }

    body {
      margin: 0;
      background: var(--bg);
      color: var(--ink);
      font-family: "Segoe UI", Arial, sans-serif;
      line-height: 1.55;
    }

    main {
      max-width: 1200px;
      margin: 24px auto;
      padding: 0 20px 40px;
    }

    header {
      background: var(--page);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 24px;
      margin-bottom: 20px;
    }

    h1, h2, h3 {
      color: var(--blue);
      margin-top: 0;
    }

    .meta {
      color: var(--muted);
      margin: 4px 0;
    }

    .status {
      display: inline-block;
      margin-top: 12px;
      padding: 6px 12px;
      border-radius: 999px;
      font-weight: 700;
    }

    .status.pass {
      color: var(--pass);
      background: var(--pass-bg);
    }

    .status.fail {
      color: var(--fail);
      background: var(--fail-bg);
    }

    .card {
      background: var(--page);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 20px;
      margin-bottom: 20px;
    }

    .success {
      border-left: 6px solid var(--pass);
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.94rem;
    }

    th, td {
      border: 1px solid var(--border);
      padding: 10px 12px;
      text-align: left;
      vertical-align: top;
    }

    th {
      background: #eef3f8;
    }

    .pass {
      color: var(--pass);
      font-weight: 700;
    }

    .fail {
      color: var(--fail);
      font-weight: 700;
    }

    .issue {
      margin-top: 16px;
      padding: 16px;
      border-radius: 10px;
      background: #ffffff;
    }

    .fail-border {
      border-left: 6px solid var(--fail);
      background: var(--fail-bg);
    }

    .warn-border {
      border-left: 6px solid var(--warn);
      background: var(--warn-bg);
    }

    code {
      font-family: Consolas, "Cascadia Code", monospace;
      font-size: 0.92em;
    }

    pre {
      background: var(--code-bg);
      color: var(--code-ink);
      padding: 14px;
      border-radius: 10px;
      overflow-x: auto;
      white-space: pre-wrap;
    }

    @media print {
      body {
        background: #fff;
      }

      header, .card {
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <main>
    <header>
      <h1>Migration Check Issues Report</h1>
      <p class="meta"><strong>Generated:</strong> $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")</p>
      <p class="meta"><strong>Project:</strong> $(ConvertTo-HtmlEncoded (Get-Location).Path)</p>
      <p class="meta"><strong>Report folder:</strong> $(ConvertTo-HtmlEncoded $reportRoot)</p>
      <span class="status $overallClass">$overallStatus</span>
    </header>

    <section class="card">
      <h2>Summary</h2>
      <table>
        <thead>
          <tr>
            <th>Command</th>
            <th>Status</th>
            <th>Exit code</th>
            <th>Matched issue lines</th>
            <th>Full log</th>
          </tr>
        </thead>
        <tbody>
          $($summaryRows -join "`n")
        </tbody>
      </table>
    </section>

    $($issueSections -join "`n")
  </main>
</body>
</html>
"@

$html | Set-Content -Path $reportPath -Encoding UTF8

Write-Host "`nDone." -ForegroundColor Cyan
Write-Host "HTML issue report: $reportPath" -ForegroundColor Yellow
Write-Host "Full logs:         $reportRoot" -ForegroundColor Yellow

if ($failed.Count -gt 0) {
  exit 1
}

exit 0