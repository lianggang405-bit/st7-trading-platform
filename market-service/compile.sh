#!/bin/bash
cd /workspace/projects/market-service
rm -rf dist
npx tsc
node dist/index.js
