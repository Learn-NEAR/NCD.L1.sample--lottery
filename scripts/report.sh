# exit on first error
set -e

#  owner(): AccountId
near view $CONTRACT owner '{}'

# winner(): AccountId
near view $CONTRACT winner '{}'

# pot(): string
near view $CONTRACT pot '{}'

# feeStrategy(): StrategyType
near view $CONTRACT feeStrategy '{}'

# hasPlayed(player: AccountId): bool
near view $CONTRACT hasPlayed '{"player": "'$PLAYER'"}'

# lastPlayed(): AccountId {
near view $CONTRACT lastPlayed '{}'
