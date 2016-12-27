#!/usr/bin/env bash
FILES=$(find . -name '*.js' -print)
./node_modules/.bin/jsdoc ${FILES} -c ./jsdoc.json -d ../doc -t ./node_modules/docdash