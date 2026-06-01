#!/bin/bash
set -e
cd "$(dirname "$0")"

export GIT_AUTHOR_NAME="ElGundamPa"
export GIT_AUTHOR_EMAIL="maicolvilla311@gmail.com"
export GIT_COMMITTER_NAME="ElGundamPa"
export GIT_COMMITTER_EMAIL="maicolvilla311@gmail.com"

git remote set-url origin https://github.com/ElGundamPa/12.12.git
git add -A
git status

if git diff --cached --quiet; then
  echo "No staged changes; pushing existing commits..."
else
  git commit -m "$(cat <<'EOF'
Rebrand to Bop dashboard and sync project to 12.12 repo.

EOF
)"
fi

git push -u origin main
