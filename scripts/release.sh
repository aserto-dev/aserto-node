#!/bin/bash
set -e

echo "fetch latest changes"
git checkout main
git fetch origin --tags
git pull origin main

# bump the patch number in the version
echo "bumping version..."
VERSION=$(npm version patch --no-git-tag-version)
echo $VERSION

echo "commit and push changes"
git commit -am "bumped version to $VERSION"
git push -u origin main

echo "tag and push $VERSION"
git tag "$VERSION"
git push --tags
