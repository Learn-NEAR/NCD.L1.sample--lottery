#!/usr/bin/env bash
set -e

[ -z "$1" ] && echo "No fee strategy supplied. Append a 0, 1, 2 or 3" && exit 1
echo
echo 'About to call configure_fee() on the contract'
echo near call \$CONTRACT configure_fee --account_id \$CONTRACT \$1
echo
echo \$CONTRACT is $CONTRACT
echo \$1 is $1
echo
near call $CONTRACT configure_fee '{"strategy": '$1'}' --account_id $CONTRACT
