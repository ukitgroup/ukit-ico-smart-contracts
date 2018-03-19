#!/bin/bash

# 0xb3daeae895300b4a3f60522592744b09c7a81958 - Owner address
# 0xec5a57b3a7fd75cf019e85865dec140bcaf21b74 - Team address
# 0x638764a6cb1ad8c07835e96705ce2d4a62241741 - Reserve address
# 0x8745c03893f3ce6b742af904286e54f0ee41879d - Advisors address
# 0x622c0fa2beeead0b3f6f79b710c8769ba730a697 - ICOS address
# 0x0977c3475cce052ad6254bfbca563cf505030e50 - New owner address
# 0x5d4000cc8deec99849a3dd01b7ca90c6ca4b014b - Investor 1
# 0x33d4fc6473bf88e656d9861f01783177c2b063d3 - Investor 2
# 0x818f60957e4eb1a7d621662342f50816fbe29d87 - Investor 3
# 0x6d45e68067ccad0c373ebc268d254aae5fac6169 - Investor 4

JSON_BIN="./node_modules/.bin/json"
CONSTANTS=$(<"utils/constants.json")
ACCOUNTS=$(echo $CONSTANTS | $JSON_BIN -ka)

ACCOUNTS_ARG=""

for ACC in $ACCOUNTS; do
	KEY=$(echo $CONSTANTS | $JSON_BIN $ACC.key)
	ADDRESS=$(echo $CONSTANTS | $JSON_BIN $ACC.address)
	ACCOUNTS_ARG=$ACCOUNTS_ARG"--account=$KEY,1000000000000000000000 --unlock $ADDRESS "
done

if [[ -z "${PORT}" ]]; then
	PORT_ARG="--port 8545"
else
	PORT_ARG="--port ${PORT}"
fi

yarn run ganache-cli  \
	--hostname 0.0.0.0 \
	--networkId 5777 \
	$PORT_ARG \
	$ACCOUNTS_ARG
