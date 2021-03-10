// --------------------------------------------
// --------------------------------------------
// VIEW Methods
// --------------------------------------------
// --------------------------------------------


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

// what is the fee for the lottery? -> string
// get_fee(): string

// what is the fee strategy for the lottery? -> StrategyType
// get_fee_strategy(): StrategyType

// explain fees for the lottery -> string
// explain_fees(): string


// --------------------------------------------
// --------------------------------------------
// CHANGE Methods
// --------------------------------------------
// --------------------------------------------

// play the lottery
// play(): void

// configure the terms of the lottery
// configure_lottery(chance: string, min: u32 = 1, max: u32 = 100): bool

// configure the fee strategy
// configure_fee(strategy: StrategyType): bool

// reset the lottery
// reset(): void

// CANNOT BE TESTED using unit tests because it's a callback (after payout is complete)
// MUST USE SIMULATION tests to verify this works as expected
// on_payout_complete(): void {
