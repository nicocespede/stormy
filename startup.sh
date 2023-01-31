#! /bin/bash
#git config --global user.name "usename"
#git config --global user.password "access token"
#git clone https://github.com/awesumperson/bot
#cd bot
git fetch
git pull
npm install --save --production --omit=dev
node index.js