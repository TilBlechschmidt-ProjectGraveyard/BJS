#!/usr/bin/env bash
echo "Collecting files..."
FILES=$(find . -name '*.js' -print)
echo "Generating documentation..."
jsdoc ${FILES} -c ./jsdoc.json -d ../docs -t ./node_modules/docdash
echo "Done!"