import { logging, Context, u128, ContractPromiseBatch, PersistentSet } from "near-sdk-as";

import { AccountId, ONE_NEAR, asNEAR, XCC_GAS } from "../../utils";

import { FeeStrategy, StrategyType } from "./fee-strategies";
import { Lottery } from "./lottery";


@nearBindgen
export class Contract {

  private owner: AccountId;
  private winner: AccountId;
  private last_played: AccountId;
  private active: bool = true;
  private pot: u128 = ONE_NEAR;
  private fee_strategy: FeeStrategy = new FeeStrategy();
  private lottery: Lottery = new Lottery();
  private players: PersistentSet<AccountId> = new PersistentSet<AccountId>("p");

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

  get_fee(): string {
    return asNEAR(this.fee()) + " NEAR";
  }

  get_fee_strategy(): StrategyType {
    return this.fee_strategy.strategy
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

  explain_fees(): string {
    return FeeStrategy.explain()
  }

  explain_lottery(): string {
    return this.lottery.explain()
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
      this.lose();
    }
  }

  @mutateState()
  configure_lottery(chance: string): bool {
    this.assert_self();
    this.lottery.configure(<f32>parseFloat(chance));
    return true;
  }

  @mutateState()
  configure_fee(strategy: StrategyType): bool {
    this.assert_self();
    this.fee_strategy = new FeeStrategy(strategy);
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
    return this.fee_strategy.calculate_fee(this.players.size, ONE_NEAR);
  }

  private increase_pot(): void {
    this.pot = u128.add(this.pot, Context.attachedDeposit);
  }

  private won(): bool {
    return this.lottery.play()
  }

  private lose(): void {
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
      to_winner.then(self).function_call("on_payout_complete", "{}", u128.Zero, XCC_GAS);
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
