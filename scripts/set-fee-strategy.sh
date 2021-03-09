#!/usr/bin/env bash
set -e

[ -z "$1" ] && echo "No fee strategy supplied. Append a 0, 1, 2 or 3" && exit 1
echo
echo 'About to call set_fee_strategy() on the contract'
echo near call \$CONTRACT set_fee_strategy --account_id \$CONTRACT \$1
echo
echo \$CONTRACT is $CONTRACT
echo \$1 is $1
echo
near call $CONTRACT set_fee_strategy '{"strategy": '$1'}' --account_id $CONTRACT
