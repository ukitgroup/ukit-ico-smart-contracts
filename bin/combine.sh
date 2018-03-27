#!/bin/bash

PWD=$(pwd)

EXT=".sol"
COMBINED_EXT=".combined$EXT"
FILES="UKTToken UKTTokenController UKTTokenVotingFactory UKTTokenVoting"

yarn run soljitsu combine --src-dir="$PWD"/src --dest-dir="$PWD"/build/combined && \

for FILE in $FILES; do
	cp -f "$PWD/build/combined/$FILE$EXT" "$PWD/contracts/$FILE$COMBINED_EXT"
done && \

echo "Combined copying done!"
