#!/usr/bin/env bash
set -e

[ -z "$1" ] && echo "No lottery configuration supplied. Append any <f64> value between 0 and 1 for chance and <f32> value for xing" && exit 1
echo
echo 'About to call configure_lottery() on the contract'
echo near call \$CONTRACT configure_lottery --account_id \$CONTRACT \$1 \$2
echo
echo \$CONTRACT is $CONTRACT
echo \$1 is $1
echo \$2 is $2
echo
near call $CONTRACT configure_lottery '{"chance": "'$1'", "xing": "'$2'"}' --account_id $CONTRACT
