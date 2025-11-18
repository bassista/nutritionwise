git checkout experimental
git pull
git checkout develop
git pull
git reset --hard origin/experimental
git push
git tag v$1
git push origin --tags