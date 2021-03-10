#!/usr/bin/env bash
set -e

[ -z "$1" ] && echo "No lottery configuration supplied. Append any <f32> value between 0 and 1" && exit 1
echo
echo 'About to call configure_lottery() on the contract'
echo near call \$CONTRACT configure_lottery --account_id \$CONTRACT \$1
echo
echo \$CONTRACT is $CONTRACT
echo \$1 is $1
echo
near call $CONTRACT configure_lottery '{"chance": "'$1'"}' --account_id $CONTRACT
