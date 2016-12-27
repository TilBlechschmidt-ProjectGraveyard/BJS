#!/usr/bin/env bash
echo "Collecting files..."
FILES=$(find . -name '*.js' -print)
echo "Generating documentation..."
jsdoc ${FILES} -c ./jsdoc.json -d ../docs -t ./node_modules/docdash
echo -e "\e[0m\e[1mAdding files to git...\e[90m"
git add ../docs
echo "Done!"