#!/bin/bash
set -e

git checkout main
git pull origin main

VERSION=$(awk -F'"' '/"version": ".+"/{ print $4; exit; }' package.json)
echo $VERSION

git tag "v$VERSION"
git push --tags
