#!/bin/bash

# Check if version argument is provided
if [ -n "$1" ]; then
    # Use provided version
    npx standard-version --release-as "$1"
else
    # Use automatic versioning
    npx standard-version
fi

# Push changes with tags
git push --follow-tags origin master
