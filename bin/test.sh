#!/bin/bash

declare -A TESTS_RESULTS
TESTS_DIR="./test"
TESTS=$(ls "$TESTS_DIR")

list_descendants () {
	local children=$(ps -o pid= --ppid "$1")
	
	for pid in $children; do
		list_descendants "$pid"
	done
	
	echo "$children"
}

shutdown () {
	kill $(list_descendants $$) &> /dev/null
}

run_test () {
	./bin/ganache.sh &> /dev/null &
	
	yarn run --silent truffle test "$1" --network development 2> /dev/null
	TESTS_RESULTS[$1]=$?
	
	shutdown &> /dev/null
	trap 'shutdown' SIGINT SIGTERM EXIT
}

./bin/compile.sh
if [ $? -ne 0 ]; then exit 1; fi

if [[ -z "$1" ]]; then
	for TEST in $TESTS; do
		run_test "$TESTS_DIR/$TEST"
	done
else
	
	TEST_FILE="$TESTS_DIR/$1"
	
	if [ ! -f $TEST_FILE ]; then
		echo "Given test file $TEST_FILE was not found!"
		exit 1
	fi
	
	run_test $TEST_FILE
fi

EXIT_CODE=0

for T in "${!TESTS_RESULTS[@]}"; do
	if [ ${TESTS_RESULTS[$T]} -ne 0 ]; then
		EXIT_CODE=1
		echo "There is an error in the test file $T!"
	fi
done

if [ "$EXIT_CODE" -eq 1 ]; then
	echo ""
fi

exit $EXIT_CODE
