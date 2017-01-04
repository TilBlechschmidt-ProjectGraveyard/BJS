#!/usr/bin/env bash
echo -e "\e[0m\e[1mCollecting files...\e[90m"
FILES=$(find . -name '*.js' -print)
echo -e "\e[0m\e[1mGenerating documentation...\e[90m"
JSDOC="./node_modules/.bin/jsdoc"
if [[ ! -x ${JSDOC} ]]; then
    JSDOC="jsdoc"
fi
${JSDOC} ${FILES} ../README.md -c ./jsdoc.json -d ../docs -t ./node_modules/docdash
echo -e "\e[0m\e[1mAdding files to git...\e[90m"
git add ../docs 2>> /dev/null
echo -e "\e[0m\e[1mDone!"