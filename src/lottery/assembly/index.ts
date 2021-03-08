import { logging, Context, u128, ContractPromiseBatch, RNG } from "near-sdk-as";
import { ONE_NEAR, asNEAR, XCC_GAS } from "../../utils";
import { FeeStrategy, StrategyType } from "./fee-strategies";

type AccountId = string;

@nearBindgen
export class Contract {

  private owner: AccountId;
  private players: Set<AccountId> = new Set();
  private pot: u128 = ONE_NEAR;
  private active: bool = true;
  private winner: AccountId;
  private last_played: AccountId;
  private fee_strategy: FeeStrategy = <FeeStrategy>{strategy: StrategyType.Constant};

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

  get_fee_strategy(): FeeStrategy {
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
    const sender = Context.sender;

    // if you've played before then you have to pay extra
    if (this.players.has(sender)) {
      const fee = this.fee();
      assert(Context.attachedDeposit >= fee, this.generate_fee_message(fee));
      this.increase_pot();

      // if it's your first time then you may win for the price of gas
    } else {
      this.players.add(sender);
    }

    this.last_played = sender;

    if (this.won()) {
      this.winner = sender;
      this.payout();
    } else {
      this.loser();
    }
  }

  @mutateState()
  set_fee_strategy(strategy: StrategyType): bool {
    this.assert_self();

    this.fee_strategy = <FeeStrategy>{strategy};
    return true;
  }

  @mutateState()
  on_payout_complete(): void {
    this.assert_self();
    this.active = false;
    logging.log("game over.");
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

  // --------------------------------------------------------------------------
  // Private methods
  // --------------------------------------------------------------------------

  private fee(): u128 {
    return this.fee_strategy.calculate_fee(this.players.size, ONE_NEAR);
  }

  private increase_pot(): void {
    this.pot = u128.add(this.pot, Context.attachedDeposit);
  }

  private won(): bool {
    const rng = new RNG<u8>(1, 100);
    return rng.next() <= 20; // 1 in 5 chance
  }

  private loser(): void {
    logging.log(this.last_played + " did not win.  The pot is currently " + this.pot.toString());
  }

  private payout(): void {
    logging.log(this.winner + " won " + this.pot.toString() + "!");

    if (this.winner.length > 0) {
      // transfer payout to winner
      const promise = ContractPromiseBatch.create(this.winner).transfer(this.pot);
      // set game to inactive
      promise.then(Context.contractName).function_call("on_payout_complete", '{}', u128.Zero, XCC_GAS);
    }
  }

  private generate_fee_message(fee: u128): string {
    return ("There are " + this.players.size.toString()
      + " players. Playing more than once now costs " + asNEAR(fee)
      + " NEAR");
  }

  private assert_self(): void {
    assert(Context.predecessor == Context.contractName, "Only this contract may call itself");
  }
}
