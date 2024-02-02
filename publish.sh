#!/usr/bin/env bash

# Clean
echo "Step #Clean"
rm -rfv ./dist

# Build
echo "Step #Build"
npx tsc

# Copy
echo "Step #Copy"
cp -v ./package.json ./dist

# Publish
echo "Step #Publish"
cd ./dist || {
  echo "Error: ./dist not found"
  exit 1
}

npm publish

# Cleanup
echo "Step #Cleanup"
echo "Done"
exit 0