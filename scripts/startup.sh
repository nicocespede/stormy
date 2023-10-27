#! /bin/bash
git fetch
git pull
npm install --save --omit=dev
node index.js