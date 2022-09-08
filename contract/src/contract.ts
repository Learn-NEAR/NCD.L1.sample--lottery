import {
  NearBindgen,
  near,
  call,
  view,
  UnorderedSet,
  bytes,
  assert,
  initialize,
  NearPromise,
} from "near-sdk-js";
import { FeeStrategy, StrategyType } from "./fee-strategies";
import { Lottery } from "./lottery";
import { asNEAR, ONE_NEAR, XCC_GAS } from "./utils";

BigInt.prototype["toJSON"] = function () {
  return this.toString();
};

// The @NearBindgen decorator allows this code to compile to Base64.
@NearBindgen({ requireInit: true })
export class Contract {
  private owner: string = "";
  private winner: string = "";
  private lastPlayed: string = "";
  private active: boolean = true;
  private pot: bigint = ONE_NEAR;
  private lottery: Lottery = new Lottery();
  private feeStrategy: FeeStrategy = new FeeStrategy();
  private players: UnorderedSet = new UnorderedSet("p");

  @initialize({})
  init({ owner }: { owner: string }) {
    this.owner = owner;
  }

  @view({})
  get_owner(): string {
    return this.owner;
  }

  @view({})
  get_winner(): string {
    return this.winner;
  }

  @view({})
  get_pot(): string {
    return `${asNEAR(this.pot)} NEAR`;
  }

  @view({})
  get_fee(): string {
    return asNEAR(this.fee()) + " NEAR";
  }

  @view({})
  get_fee_strategy(): StrategyType {
    return FeeStrategy.from(this.feeStrategy).strategyType;
  }

  @view({})
  get_has_played({ player }: { player: string }): boolean {
    return this.players.contains(player);
  }

  @view({})
  get_last_played(): string {
    return this.lastPlayed;
  }

  @view({})
  get_active(): boolean {
    return this.active;
  }

  @view({})
  explain_fees(): string {
    return FeeStrategy.from(this.feeStrategy).explain();
  }

  @view({})
  explain_lottery(): string {
    return Lottery.from(this.lottery).explain();
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
  @call({})
  play(): void {
    assert(
      this.active,
      `${this.winner} won ${this.pot}. Please reset the game.`
    );
    const signer = near.signerAccountId();
    const deposit = near.attachedDeposit();
    const played = this.players.contains(signer);

    // if you've played before then you have to pay extra
    if (played) {
      const fee = this.fee();
      assert(deposit >= fee, this.generateFeeMessage(fee));
      this.pot = BigInt(this.pot) + deposit;
    } else {
      // if it's your first time then you may win for the price of gas
      this.players.set(signer);
    }

    this.lastPlayed = signer;

    if (this.playLottery()) {
      this.winner = signer;
      near.log(`${this.winner} won ${this.get_pot()}!`);

      if (this.winner.length > 0) {
        this.payout();
      }
    } else {
      near.log(
        `${
          this.lastPlayed
        } did not win.  The pot is currently ${this.get_pot()}`
      );
    }
  }

  @call({ privateFunction: true })
  configure_lottery({ chance }: { chance: number }): boolean {
    const lottery = Lottery.from(this.lottery);
    lottery.configure(chance);

    this.lottery = lottery;
    return true;
  }

  @call({ privateFunction: true })
  configure_fee({ strategy }: { strategy: StrategyType }): boolean {
    this.feeStrategy = new FeeStrategy(strategy);
    return true;
  }

  @call({ privateFunction: true })
  reset(): void {
    this.players.clear();
    this.winner = "";
    this.lastPlayed = "";
    this.pot = ONE_NEAR;
    this.active = true;
  }

  // this method is only here for the promise callback,
  // it should never be called directly
  @call({ privateFunction: true })
  on_payout_complete(): void {
    this.active = false;
    near.log("game over.");
  }

  // --------------------------------------------------------------------------
  // Private methods
  // --------------------------------------------------------------------------

  private fee(): bigint {
    return FeeStrategy.from(this.feeStrategy).calculate(
      this.players.length,
      ONE_NEAR
    );
  }

  private generateFeeMessage(fee: bigint): string {
    return `There are ${
      this.players.length
    } players. Playing more than once now costs ${asNEAR(fee)} NEAR`;
  }

  private playLottery(): boolean {
    return Lottery.from(this.lottery).play();
  }

  private payout(): void {
    NearPromise.new(this.winner)
      .transfer(this.pot) // transfer payout to winner
      .then(
        // receive confirmation of payout before setting game to inactive
        NearPromise.new(near.currentAccountId()).functionCall(
          "on_payout_complete",
          bytes(JSON.stringify({})),
          0n,
          XCC_GAS
        )
      )
      .onReturn();
  }
}
