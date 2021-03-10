// --------------------------------------------
// Contract Metadata
// --------------------------------------------

// who owns this lottery? -> AccountId
// get_owner(): AccountId

// is the lottery still active? -> bool
// get_active(): bool


// --------------------------------------------
// Lottery Details
// --------------------------------------------

// explain terms of the lottery -> string
// explain_lottery(): string

// what is the pot currently? -> string
// get_pot(): string

// who played last? -> AccountId
// get_last_played(): AccountId

// has PLAYER played already? -> bool
// get_has_played(player: AccountId): bool

// who, if anyone, won? -> AccountId
// (this will be empty unless get_active returns false)
// get_winner(): AccountId


// --------------------------------------------
// Lottery Fees
// --------------------------------------------

// explain fees for the lottery -> string
// explain_fees(): string

// what is the fee strategy for the lottery? -> StrategyType
// get_fee(): FeeStrategy
