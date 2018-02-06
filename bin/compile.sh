#!/bin/bash

./bin/combine.sh && \

PWD=$(pwd)

if [[ -z "${NETWORK}" ]]; then
	NETWORK_ARG="--network development"
else
	NETWORK_ARG="--network ${NETWORK}"
fi

yarn run truffle compile --all $NETWORK_ARG

rm "$PWD"/contracts/*.combined.sol 2>/dev/null
