#!/bin/bash

# Script performs tagging and releasing to gh-pages

# setup git
echo "configure git"
git config --global push.default simple
git config --global user.email "travis@travis-ci.org"
git config --global user.name "Travis CI"
git config credential.helper "store --file=.git/credentials"
echo "https://${GITHUB_API_KEY}:@github.com" > .git/credentials

message=$(git log -1 --pretty=%B)
echo "Last message: $message"

if [[ $message =~ "[major]" ]]; then
  version="major"
fi

if [[ $message =~ "[minor]" ]]; then
  version="minor"
fi

if [[ $message =~ "[patch]" ]]; then
  version="patch"
fi

if [[ $version ]]; then
  echo "Versioning $version"
  npm version $version -m "v%s"
  echo "Flagging to deploy to npm"
  mkdir -p tmp/flags
  touch tmp/flags/npm
fi

if [[ $message =~ "[gh-pages]" ]]; then
  echo "Flagging to deploy to gh-pages"
  mkdir -p tmp/flags
  touch tmp/flags/gh-pages
fi