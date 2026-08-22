"""
extract_topology.py — Dependency and topology map for ClientApp/src (TypeScript/React/NMI portal).

Produces:
  analysis/topology.json   — machine-readable graph datasets
  stdout                   — human summary (capped ~200 lines)

Usage:
  python analysis/extract_topology.py
  (run from workspace root)
"""

import os
import re
import json
from pathlib import Path
from collections import defaultdict

SRC = Path("ClientApp/src")

# ──────────────────────────────────────────────────
# 1. Collect files
# ──────────────────────────────────────────────────
IGNORED_DIRS = {"node_modules", "external", "parent"}
NON_CODE_IMPORT_EXTENSIONS = {
    ".scss", ".css", ".sass", ".less",
    ".json",
    ".svg", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico",
    ".woff", ".woff2", ".ttf", ".eot",
}

def is_source(p: Path) -> bool:
    parts = set(p.parts)
    if parts & IGNORED_DIRS:
        return False
    return p.suffix in {".ts", ".tsx"}

all_files = [p for p in SRC.rglob("*") if is_source(p)]

# normalise to repo-relative POSIX strings for consistent keys
def key(p: Path) -> str:
    return p.as_posix()

file_keys = {key(f) for f in all_files}

# ──────────────────────────────────────────────────
# 2. Domain classifier
# ──────────────────────────────────────────────────
def classify_domain(k: str) -> str:
    if "routes/dashboard" in k:               return "Dashboard"
    if "routes/account" in k:                 return "Account Management"
    if "routes/contact" in k:                 return "Account Management"
    if "routes/requestForQuote" in k:         return "Request for Quote"
    if "routes/acceptQuote" in k:             return "Accept Quote"
    if "routes/quotation" in k:               return "Quotation"
    if "routes/measurementReport" in k:       return "Measurement Reports"
    if "routes/preConditions" in k:           return "PreConditions"
    if "routes/sign-in" in k or "routes/sign-out" in k: return "Auth Routes"
    if "routes/help-guide" in k or "routes/services-we-offer" in k: return "Help & Services"
    if "routes/common" in k:                  return "Shared Route Helpers"
    if "components/forms" in k:               return "Wizard Framework"
    if "components/modals" in k:              return "Modals"
    if "components/Layout" in k or "components/Header" in k or "components/Footer" in k: return "UI Shell"
    if "components/" in k:                    return "UI Components"
    if "authentication/" in k:                return "Auth"
    if "api/" in k:                           return "API Client"
    if "validationSchemas/" in k:             return "Validation"
    if "storage/" in k:                       return "Storage"
    if "instrumentation/" in k:               return "Instrumentation"
    if "analytics/" in k:                     return "Analytics"
    if "App.tsx" in k or "index.tsx" in k:    return "Bootstrap"
    return "Other"

# ──────────────────────────────────────────────────
# 3. Parse imports per file
# ──────────────────────────────────────────────────
IMPORT_RE = re.compile(r"""(?:import|export)\s+(?:.*?\s+from\s+)?['"]([^'"]+)['"]""")

def is_non_code_relative_spec(spec: str) -> bool:
    """Return True when a relative import intentionally targets non-TS assets."""
    return Path(spec).suffix.lower() in NON_CODE_IMPORT_EXTENSIONS

def resolve_import(importer: Path, spec: str) -> str | None:
    """Resolve a relative import spec to a repo-relative key, or None if external."""
    if not spec.startswith("."):
        return None  # npm package
    base = importer.parent / spec
    # try extensions in order
    candidates = [base.with_suffix(".ts"), base.with_suffix(".tsx"),
                  base / "index.ts", base / "index.tsx", base]
    for c in candidates:
        k = key(c)
        if k in file_keys:
            return k
    return None

import_edges = []          # (from_key, to_key)
missing_imports = []       # (from_key, spec)
non_code_relative_imports = []  # (from_key, spec)

for f in all_files:
    text = f.read_text(encoding="utf-8", errors="ignore")
    for m in IMPORT_RE.finditer(text):
        spec = m.group(1)
        resolved = resolve_import(f, spec)
        if resolved:
            import_edges.append((key(f), resolved))
        elif spec.startswith("."):
            if is_non_code_relative_spec(spec):
                non_code_relative_imports.append((key(f), spec))
            else:
                missing_imports.append((key(f), spec))

# ──────────────────────────────────────────────────
# 4. API client usages (data dependency graph)
# ──────────────────────────────────────────────────
# 11 named client classes in web-api-client.ts
API_CLIENTS = {
    "DashboardClient":         "Dashboard API (instruments/quotes/drafts)",
    "AccountsClient":          "Accounts API (org registration)",
    "ContactClient":           "Contact API (contact create/update)",
    "RequestForQuoteClient":   "RFQ API (drafts/submit)",
    "ApplicationClient":       "Application API (form options/lookups)",
    "QuoteClient":             "Quote API (quote detail/PDF)",
    "AcceptQuoteClient":       "Accept Quote API (acceptance wizard)",
    "AuthorisedSignatoryClient": "Authorised Signatory API",
    "InstrumentClient":        "Instrument API",
    "NotificationClient":      "Notification API",
    "AccountLoginClient":      "Auth Login API (signIn/signOut)",
}

# methods that represent READ vs WRITE semantics
WRITE_METHODS = re.compile(
    r"\.(create|update|delete|submit|save|accept|decline|copy|add|set|put|post|patch)\w*\s*\("
, re.IGNORECASE)
READ_METHODS  = re.compile(
    r"\.(get|list|fetch|search|load|query|download|retrieve)\w*\s*\("
, re.IGNORECASE)

api_usages = []  # (file_key, client_name, api_label, rw)

for f in all_files:
    text = f.read_text(encoding="utf-8", errors="ignore")
    for client, label in API_CLIENTS.items():
        if client not in text:
            continue
        # find lines that instantiate or call the client
        for line in text.splitlines():
            if client not in line:
                continue
            rw = "read"
            if WRITE_METHODS.search(line):
                rw = "write"
            elif READ_METHODS.search(line):
                rw = "read"
            api_usages.append((key(f), client, label, rw))
            break  # one entry per file per client is enough for the graph

# ──────────────────────────────────────────────────
# 5. sessionStorage usages
# ──────────────────────────────────────────────────
SESSION_RE = re.compile(r"sessionStorage\.(getItem|setItem|removeItem)\(['\"](\w+)['\"]")
session_usages = []  # (file_key, op, key_name)

for f in all_files:
    text = f.read_text(encoding="utf-8", errors="ignore")
    for m in SESSION_RE.finditer(text):
        op = "read" if m.group(1) == "getItem" else "write"
        session_usages.append((key(f), op, m.group(2)))

# ──────────────────────────────────────────────────
# 6. Entry points — routes from App.tsx
# ──────────────────────────────────────────────────
APP_TSX = SRC / "App.tsx"
entry_points = []

if APP_TSX.exists():
    app_text = APP_TSX.read_text(encoding="utf-8", errors="ignore")
    # extract path="..." from JSX route definitions
    PATH_RE = re.compile(r'path=["\']([^"\']+)["\']')
    ELEMENT_RE = re.compile(r'element=\{.*?<([A-Z]\w+)')
    entry_points = [(m.group(1)) for m in PATH_RE.finditer(app_text)]

# index.tsx is the bootstrap entry
entry_files = {key(SRC / "index.tsx"), key(SRC / "App.tsx")}

# ──────────────────────────────────────────────────
# 7. Dead-end candidates
# ──────────────────────────────────────────────────
all_targets = {to for _, to in import_edges}
dead_candidates = []

for f in all_files:
    k = key(f)
    if k in entry_files:
        continue
    if k not in all_targets:
        # suppress if in analytics (could be side-effect imported)
        if "analytics" in k or "external" in k or "parent" in k:
            continue
        dead_candidates.append(k)

# ──────────────────────────────────────────────────
# 8. Build topology.json
# ──────────────────────────────────────────────────
# Aggregate: for the call graph, work at domain level to keep it tractable
domain_call_edges = defaultdict(set)  # (from_domain, to_domain)
for frm, to in import_edges:
    fd = classify_domain(frm)
    td = classify_domain(to)
    if fd != td:
        domain_call_edges[fd].add(td)

# API data lineage at domain level
domain_api_edges = defaultdict(lambda: defaultdict(set))  # domain -> client -> {read, write}
for fk, client, label, rw in api_usages:
    d = classify_domain(fk)
    domain_api_edges[d][client].add(rw)

# sessionStorage lineage
domain_session_edges = defaultdict(lambda: defaultdict(set))  # domain -> ss_key -> {read, write}
for fk, op, ss_key in session_usages:
    d = classify_domain(fk)
    domain_session_edges[d][ss_key].add(op)

topology = {
    "meta": {
        "source": "ClientApp/src",
        "total_files": len(all_files),
        "total_import_edges": len(import_edges),
        "missing_relative_imports": len(missing_imports) + len(non_code_relative_imports),
        "missing_relative_code_imports": len(missing_imports),
        "non_code_relative_imports": len(non_code_relative_imports),
        "api_usages": len(api_usages),
        "session_usages": len(session_usages),
        "dead_candidates": len(dead_candidates),
        "analysis_caveats": [
            "missing_relative_imports is a topology signal, not a defect count",
            "non_code_relative_imports are expected for style, asset, and JSON imports",
            "dead_candidates are graph heuristics and require manual verification"
        ],
    },
    "domain_call_edges": {k: sorted(v) for k, v in sorted(domain_call_edges.items())},
    "domain_api_edges": {
        d: {c: sorted(rws) for c, rws in clients.items()}
        for d, clients in sorted(domain_api_edges.items())
    },
    "domain_session_edges": {
        d: {k: sorted(ops) for k, ops in keys.items()}
        for d, keys in sorted(domain_session_edges.items())
    },
    "entry_routes": sorted(entry_points),
    "entry_files": sorted(entry_files),
    "dead_candidates": sorted(dead_candidates),
    "missing_relative_imports": missing_imports[:20],
    "non_code_relative_imports": non_code_relative_imports[:20],
}

out = Path("analysis/topology.json")
out.write_text(json.dumps(topology, indent=2), encoding="utf-8")

# ──────────────────────────────────────────────────
# 9. Human summary
# ──────────────────────────────────────────────────
print("=" * 60)
print("TOPOLOGY SUMMARY — ClientApp/src")
print("=" * 60)
print(f"Files analysed:          {len(all_files)}")
print(f"Import edges (resolved): {len(import_edges)}")
print(f"Missing relative imports:{len(missing_imports) + len(non_code_relative_imports)}")
print(f"  - code imports only:   {len(missing_imports)}")
print(f"  - non-code imports:    {len(non_code_relative_imports)}")
print(f"API client usages:       {len(api_usages)}")
print(f"sessionStorage usages:   {len(session_usages)}")
print(f"Dead-end candidates:     {len(dead_candidates)}")
print()

print("── DOMAIN CALL EDGES ──")
for src_d, targets in sorted(domain_call_edges.items()):
    print(f"  {src_d}")
    for t in sorted(targets):
        print(f"    → {t}")
print()

print("── API DATA LINEAGE (domain → API client, read/write) ──")
for d, clients in sorted(domain_api_edges.items()):
    for c, rws in sorted(clients.items()):
        print(f"  {d:35s} → {c:30s} [{','.join(sorted(rws))}]")
print()

print("── sessionStorage LINEAGE (domain → key, ops) ──")
for d, keys in sorted(domain_session_edges.items()):
    for k, ops in sorted(keys.items()):
        print(f"  {d:35s} → {k:30s} [{','.join(sorted(ops))}]")
print()

print("── ENTRY ROUTES (from App.tsx) ──")
for r in sorted(entry_points):
    print(f"  {r}")
print()

print("── DEAD-END CANDIDATES (no inbound imports) ──")
for d in sorted(dead_candidates):
    print(f"  {d}")
print()

print(f"topology.json written to: {out}")
