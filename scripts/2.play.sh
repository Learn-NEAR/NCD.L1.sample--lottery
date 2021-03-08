echo
echo 'About to call play() on the contract'
echo near call \$CONTRACT play --account_id \$PLAYER --amount \$1
echo
echo \$CONTRACT is $CONTRACT
echo \$PLAYER is $PLAYER
echo \$1 is [ $1 NEAR ] '(the optionally attached amount)'
echo
near call $CONTRACT play --account_id $PLAYER --amount $1
