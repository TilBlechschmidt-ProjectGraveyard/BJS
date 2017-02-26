#!/usr/bin/env bash
TMP_DIR=$(mktemp -d)
TARGET="${TMP_DIR}/BJS"
ORIGIN=${PWD}

USER_DOC_ID="1rs-JHlzbmmHCCYEuimnUzQ_-FFuJJH0THVy8FcDSrtc"
ARCHS=( "os.windows.x86_32" "os.osx.x86_64" "os.linux.x86_64" "os.linux.x86_32" )

function meteorBuild {
    meteor build ${TARGET}/$1 --architecture $1 --server-only
}

function decompress {
    tar xzf meteor.tar.gz
    mv bundle/* ./
    rm -f bundle/.node_version.txt
    rm -r bundle/
    rm meteor.tar.gz
}

# Setup
echo -e "\e[0m\e[1mCreating directories ...\e[90m"
mkdir -p ${TMP_DIR}/BJS
mkdir -p ${TARGET}/docs/user
mkdir -p ${TARGET}/docs/developer

cd meteor

# API docs
echo -e "\e[0m\e[1mBuilding developer documentation ...\e[90m"
./generate_documentation.sh > /dev/null

echo -e "\e[0m\e[1mCopying developer documentation ...\e[90m"
cp -r ../docs/* ${TARGET}/docs/developer

# User docs
echo -e "\e[0m\e[1mDownloading user documentation ...\e[90m"
curl "https://docs.google.com/document/export?format=pdf&id=${USER_DOC_ID}" > ${TARGET}/docs/user/BJS.pdf

# Meteor build
for arch in "${ARCHS[@]}"; do
    echo -e "\e[0m\e[1mBuilding ${arch} ...\e[90m"
    meteorBuild ${arch}
done

# Decompression
echo -e "\e[0m\e[1mDecompressing bundles ...\e[90m"
for arch in "${ARCHS[@]}"; do
    cd ${TARGET}/${arch} && decompress
done

# Copy over run scripts
for arch in "${ARCHS[@]}"; do
    cp ${ORIGIN}/runScripts/* ${TARGET}/${arch}/
done

# Compress files
echo -e "\e[0m\e[1mCreating archive ...\e[90m"
cd ${TMP_DIR}
zip -r ${ORIGIN}/BJS.zip ./BJS -q -9 -o

cd ${ORIGIN}

echo -e "\e[0m\e[1mDone!"
