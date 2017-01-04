#!/usr/bin/env bash
cd meteor
echo -e "\e[0m\e[1mResetting database ...\e[90m"
meteor reset
echo -e "\e[0m\e[1mInstalling packages ...\e[90m"
meteor npm install
echo -e "\e[0m\e[1mResetting database (npm) ...\e[90m"
npm install
echo -e "\e[0m\e[1mStarting meteor ...\e[90m"
meteor