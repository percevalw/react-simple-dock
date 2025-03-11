#!/bin/bash
set -e

echo "Cleaning previous builds..."
rm -rf dist

echo "Compiling typescript..."
# Run your TypeScript build (adjust if you use Babel)
tsc --build tsconfig.lib.json

echo "Copying assets..."
cp -r src/lib/*.css dist

echo "Updating package.json for distribution..."
node scripts/editPackageJson.js

echo "Copying README.md and LICENSE..."
cp README.md dist/README.md
cp LICENSE dist/LICENSE

echo "Build complete!"