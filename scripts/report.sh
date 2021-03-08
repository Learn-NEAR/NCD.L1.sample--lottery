# exit on first error
set -e

[ -z "$CONTRACT" ] && echo "Missing \$CONTRACT environment variable" && exit 1
[ -z "$OWNER" ] && echo "Missing \$OWNER environment variable" && exit 1
[ -z "$PLAYER" ] && echo "Missing \$PLAYER environment variable" && exit 1

echo "These are the environment variables being used:"
echo
echo "CONTRACT is [ $CONTRACT ]"
echo "OWNER is [ $OWNER ]"
echo "PLAYER is [ $PLAYER ]"
echo
echo

# who owns this lottery? -> AccountId
echo "near view \$CONTRACT get_owner '{}'"
near view $CONTRACT get_owner '{}'
echo
echo

# is the lottery still active? -> bool
echo "near view \$CONTRACT get_active '{}'"
near view $CONTRACT get_active '{}'
echo
echo

# what is the pot currently? -> string
echo "near view \$CONTRACT get_pot '{}'"
near view $CONTRACT get_pot '{}'
echo
echo

# who, if anyone, won? -> AccountId
# (this will be empty unless get_active returns false)
echo "near view \$CONTRACT get_winner '{}'"
near view $CONTRACT get_winner '{}'
echo
echo

# what is the fee strategy for the lottery? -> StrategyType
echo "near view \$CONTRACT get_fee_strategy '{}'"
near view $CONTRACT get_fee_strategy '{}'
echo
echo

# has PLAYER played already? -> bool
echo "near view \$CONTRACT get_has_played '{\"player\":\"'\$PLAYER'\"}'"
near view $CONTRACT get_has_played '{"player":"'$PLAYER'"}'
echo

# who played last? -> AccountId
echo "near view \$CONTRACT get_last_played '{}'"
near view $CONTRACT get_last_played '{}'
echo
echo
