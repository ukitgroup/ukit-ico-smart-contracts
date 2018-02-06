#!/bin/bash

PWD=$(pwd)

COMBINED_FILES="UKTToken.combined.sol UKTTokenController.combined.sol"

yarn run soljitsu combine --src-dir="$PWD"/src --dest-dir="$PWD"/build/combined && \

for COMBINED_FILE in $COMBINED_FILES; do
	cp -f "$PWD/build/combined/$COMBINED_FILE" "$PWD/contracts/"
done && \

echo "Combined copying done!"
