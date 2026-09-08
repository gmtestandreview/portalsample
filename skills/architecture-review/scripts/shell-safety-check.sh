#!/usr/bin/env bash
# Optional defense-in-depth helper for architecture-review / architecture-design.
# This is NOT a sandbox and must not be treated as the sole security control.
# Usage: ./shell-safety-check.sh "<command>"
# Exit 0 = no obvious blocked pattern (runtime permissions still apply)
# Exit 1 = matches a restricted pattern
# Exit 2 = misuse (no command supplied)

set -u

cmd="${1:-}"

if [[ -z "$cmd" ]]; then
  echo "DENY: no command provided"
  exit 2
fi

lower="$(printf '%s' "$cmd" | tr '[:upper:]' '[:lower:]')"

# Obvious destructive / state-changing patterns.
deny_patterns=(
  " rm "
  "^rm "
  " rm$"
  "sudo "
  "chmod "
  "chown "
  "mv "
  "cp "
  "dd "
  "mkfs"
  "shutdown"
  "reboot"
  "systemctl "
  "service "
  "docker run"
  "docker compose up"
  "kubectl apply"
  "kubectl delete"
  "terraform apply"
  "terraform destroy"
  "ansible-playbook"
  "curl "
  "wget "
  "ssh "
  "scp "
  "rsync "
  "npm install"
  "pnpm install"
  "yarn add"
  "pip install"
  "pip3 install"
  "apt "
  "apt-get "
  "brew install"
  "git push"
  "git reset --hard"
  "git clean"
  "drop database"
  "drop table"
  "truncate table"
  "delete from"
  "update "
  "insert into"
  "alter table"
)

padded=" $lower "

for pattern in "${deny_patterns[@]}"; do
  if [[ "$padded" =~ $pattern ]]; then
    echo "DENY: command matches restricted pattern: $pattern"
    exit 1
  fi
done

# Redirection and command substitution can create side effects or bypass simple checks.
if [[ "$cmd" == *">"* || "$cmd" == *'`'* || "$cmd" == *'$('* ]]; then
  echo "DENY: redirection or command substitution requires explicit review"
  exit 1
fi

echo "REVIEW: no obvious blocked pattern found. Runtime permissions are still required."
exit 0
