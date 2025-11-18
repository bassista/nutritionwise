#!/bin/bash
set -euo pipefail

# Controllo argomenti
if [ $# -ne 1 ]; then
  echo "Uso: $0 <versione>"
  exit 1
fi

VERSION=$1

# Verifica che il remote usi SSH
REMOTE_URL=$(git remote get-url origin)
if [[ "$REMOTE_URL" != git@* ]]; then
  echo "⚠️ Il remote non è SSH. Imposta con:"
  echo "git remote set-url origin git@github.com:utente/repo.git"
  exit 1
fi

git stash push -- next.config.ts package-lock.json

# Aggiorna experimental
echo "➡️ Checkout su experimental e pull"
git checkout experimental
git pull origin experimental

# Aggiorna develop
echo "➡️ Checkout su develop e pull"
git checkout develop
git pull origin develop

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "develop" ]; then
  echo "Non sei su develop!"
  exit 1
fi

# Reset su experimental
echo "➡️ Reset hard su origin/develop"
git reset --hard origin/experimental

# Push e tag
echo "➡️ Push su origin/develop"
git push origin develop

echo "➡️ Creazione tag v${VERSION}"
git tag "v${VERSION}"
git push origin --tags

echo "✅ Tag v${VERSION} creato e pushato con successo!"

git stash pop