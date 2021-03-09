#!/usr/bin/env bash
set -e

echo
echo 'About to call reset() on the CONTRACT'
echo near call \$CONTRACT reset --account_id \$CONTRACT
echo
echo \$CONTRACT is $CONTRACT
echo
near call $CONTRACT reset --account_id $CONTRACT
