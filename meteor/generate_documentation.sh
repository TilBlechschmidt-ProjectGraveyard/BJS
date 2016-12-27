#!/usr/bin/env bash
echo -e "\e[0m\e[1mCollecting files...\e[90m"
FILES=$(find . -name '*.js' -print)
echo -e "\e[0m\e[1mGenerating documentation...\e[90m"
./node_modules/.bin/jsdoc ${FILES} -c ./jsdoc.json -d ../docs -t ./node_modules/docdash
#echo -e "\e[0m\e[1mCompressing documentation...\e[90m"
#tar -czvf ../documentation.tar.gz ../docs
echo -e "\e[0m\e[1mDone!"