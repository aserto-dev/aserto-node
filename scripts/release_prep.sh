#!/bin/bash
set -e

git checkout main
git pull origin main

# bump the patch number in the version
VERSION=$(npm version patch --no-git-tag-version)
echo $VERSION

git checkout -b "release_prep/$VERSION"
git commit -am "bumped version to $VERSION"
git push -u origin "release_prep/$VERSION"

if command -v gh &> /dev/null
then
   gh pr create --title "bumped version to $VERSION" --body "bumped version to $VERSION"
else
  echo "gh not installed, please create the PR manually"
fi
