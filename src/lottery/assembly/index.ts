import { logging, Context, u128, ContractPromiseBatch, RNG, PersistentSet, ContractPromise } from "near-sdk-as";
import { ONE_NEAR, asNEAR, XCC_GAS, toYocto } from "../../utils";
import { Strategy, StrategyType, isValidStrategy } from "./fee-strategies";

type AccountId = string;

@nearBindgen
export class Contract {

  private owner: AccountId;
  private players: PersistentSet<AccountId> = new PersistentSet<AccountId>("p");
  private pot: u128 = ONE_NEAR;
  private active: bool = true;
  private winner: AccountId;
  private last_played: AccountId;
  private fee_strategy: StrategyType = StrategyType.Exponential;

  constructor(owner: AccountId) {
    this.owner = owner;
  };

  // --------------------------------------------------------------------------
  // Public VIEW methods
  // --------------------------------------------------------------------------

  get_owner(): AccountId {
    return this.owner;
  }

  get_winner(): AccountId {
    return this.winner;
  }

  get_pot(): string {
    return asNEAR(this.pot) + " NEAR";
  }

  get_fee_strategy(): StrategyType {
    return this.fee_strategy
  }

  get_has_played(player: AccountId): bool {
    return this.players.has(player);
  }

  get_last_played(): AccountId {
    return this.last_played;
  }

  get_active(): bool {
    return this.active;
  }

  // --------------------------------------------------------------------------
  // Public CHANGE methods
  // --------------------------------------------------------------------------

  /**
   * "Pay to play"
   *
   * First time is free to play and you may win!
   *
   * If you've already played once then any other play costs you a fee.
   * This fee is calculated as 1 NEAR X the square of the total number of unique players
   */
  @mutateState()
  play(): void {
    assert(this.active, this.winner + " won " + this.pot.toString() + ". Please reset the game.");
    const signer = Context.sender;

    // if you've played before then you have to pay extra
    if (this.players.has(signer)) {
      const fee = this.fee();
      assert(Context.attachedDeposit >= fee, this.generate_fee_message(fee));
      this.increase_pot();

      // if it's your first time then you may win for the price of gas
    } else {
      this.players.add(signer);
    }

    this.last_played = signer;

    if (this.won()) {
      this.winner = signer;
      this.payout();
    } else {
      this.loser();
    }
  }

  @mutateState()
  set_fee_strategy(strategy: StrategyType): bool {
    this.assert_self();
    assert(isValidStrategy(strategy), "Invalid StrategyType: " + strategy.toString());
    this.fee_strategy = strategy;
    return true;
  }

  @mutateState()
  reset(): void {
    this.assert_self();
    this.players.clear();
    this.winner = "";
    this.last_played = "";
    this.pot = ONE_NEAR;
    this.active = true;
  }

  // this method is only here for the promise callback,
  // it should never be called directly
  @mutateState()
  on_payout_complete(): void {
    this.assert_self();
    this.active = false;
    logging.log("game over.");
  }

  // --------------------------------------------------------------------------
  // Private methods
  // --------------------------------------------------------------------------

  private fee(): u128 {
    return Strategy.selector(this.fee_strategy, this.players.size, ONE_NEAR);
  }

  private increase_pot(): void {
    this.pot = u128.add(this.pot, Context.attachedDeposit);
  }

  private won(): bool {
    const rng = new RNG<u8>(1, 100);
    return rng.next() <= 20; // 1 in 5 chance
  }

  private loser(): void {
    logging.log(this.last_played + " did not win.  The pot is currently " + this.get_pot());
  }

  private payout(): void {
    logging.log(this.winner + " won " + this.get_pot() + "!");

    if (this.winner.length > 0) {
      const to_winner = ContractPromiseBatch.create(this.winner);
      const self = Context.contractName

      // transfer payout to winner
      to_winner.transfer(this.pot);

      // receive confirmation of payout before setting game to inactive
      to_winner.then(self).function_call("on_payout_complete", '{}', u128.Zero, XCC_GAS);
    }
  }

  private generate_fee_message(fee: u128): string {
    return ("There are " + this.players.size.toString()
      + " players. Playing more than once now costs " + asNEAR(fee)
      + " NEAR");
  }

  private assert_self(): void {
    const caller = Context.predecessor
    const self = Context.contractName
    assert(caller == self, "Only this contract may call itself");
  }
}
