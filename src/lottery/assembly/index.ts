import { logging, PersistentSet, Context, u128, ContractPromiseBatch, RNG } from "near-sdk-as";
import { ONE_NEAR, asNEAR, XCC_GAS } from "../../utils";
import { Strategy, StrategyType } from "./fee-strategies";

type AccountId = string;

@nearBindgen
export class Contract {

  private _owner: AccountId
  private players: PersistentSet<AccountId> = new PersistentSet("p");
  private _pot: u128 = ONE_NEAR
  private _active: bool = true
  private _winner: AccountId = ""
  private last_played: AccountId = "";
  private fee_strategy: StrategyType = StrategyType.exponential

  constructor(owner: AccountId) {
    this._owner = owner;
  };

  // --------------------------------------------------------------------------
  // Public VIEW methods
  // --------------------------------------------------------------------------

  owner(): AccountId {
    return this._owner;
  }

  winner(): AccountId {
    return this._winner;
  }

  pot(): string {
    return asNEAR(this._pot) + " NEAR";
  }

  feeStrategy(): StrategyType {
    return this.fee_strategy
  }

  hasPlayed(player: AccountId): bool {
    return this.players.has(player);
  }

  lastPlayed(): AccountId {
    return this.last_played;
  }

  active(): bool {
    return this._active
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
    assert(this._active, this._winner + " won " + this.pot() + ". Please reset the game.")
    const sender = Context.sender

    // if you've played before then you have to pay extra
    if (this.players.has(sender)) {
      const fee = this.fee()
      assert(Context.attachedDeposit >= fee, this.generate_fee_message(fee));
      this.increasePot()

      // if it's your first time then you may win for the price of gas
    } else {
      this.players.add(sender);
    }

    this.last_played = sender;

    if (this.won()) {
      this._winner = sender
      this.payout()
    } else {
      this.loser()
    }
  }

  @mutateState()
  setFeeStrategy(strategy: StrategyType): bool {
    assert(Context.predecessor == Context.contractName, "Only this contract may call itself")
    this.fee_strategy = strategy
    return true
  }

  @mutateState()
  on_payout_complete(): void {
    assert(Context.predecessor == Context.contractName, "Only this contract may call itself")
    this._active = false
    logging.log("game over.")
  }

  @mutateState()
  reset(): void {
    assert(Context.predecessor == Context.contractName, "Only this contract may call itself")
    this.players.clear()
    this._winner = ""
    this.last_played = ""
    this._pot = ONE_NEAR
    this._active = true
  }

  // --------------------------------------------------------------------------
  // Private methods
  // --------------------------------------------------------------------------

  private fee(): u128 {
    return Strategy.selector(this.fee_strategy, this.players.size, ONE_NEAR)
  }

  private increasePot(): void {
    this._pot = u128.add(this._pot, Context.attachedDeposit);
  }

  private won(): bool {
    const rng = new RNG<u8>(1, 100)
    return rng.next() <= 20; // 1 in 5 chance
  }

  private loser(): void {
    logging.log(this.last_played + " did not win.  The pot is currently " + this.pot())
  }

  private payout(): void {
    logging.log(this._winner + " won " + this.pot() + "!");

    if (this._winner.length > 0) {
      // transfer payout to winner
      const promise = ContractPromiseBatch.create(this._winner).transfer(this._pot);
      // set game to inactive
      promise.then(Context.contractName).function_call("on_payout_complete", '{}', u128.Zero, XCC_GAS)
    }
  }

  private generate_fee_message(fee: u128): string {
    return ("There are " + this.players.size.toString()
      + " players. Playing more than once now costs " + asNEAR(fee)
      + " NEAR")
  }
}
