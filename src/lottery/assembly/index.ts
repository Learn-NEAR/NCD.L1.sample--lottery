import { logging, PersistentSet, Context, env, u128, ContractPromiseBatch } from "near-sdk-as";
import { ONE_NEAR, asNEAR } from "../../utils";

type AccountId = string;

@nearBindgen
export class Contract {

  private players: PersistentSet<AccountId> = new PersistentSet("p");
  private _owner: AccountId
  private _winner: AccountId
  private _pot: u128
  private last_played: AccountId = "NULL";
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

  pot(): u128 {
    return this._pot;
  }

  hasPlayed(player: AccountId): bool {
    return this.players.has(player);
  }

  lastPlayed(): AccountId {
    return this.last_played || "";
  }

  reset(): void {
    this.players.clear()
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
    const sender = Context.sender

    if (!this.players.has(sender)) {
      this.players.add(sender);
      if (this.won()) {
        this._winner = sender
        this.payout()
      }
    } else {
      const fee = this.fee()
      assert(Context.attachedDeposit >= fee, this.generate_fee_message(fee));

      this.increasePot()

      if (this.won()) {
        this._winner = sender
        this.payout()
      }
    }
    this.last_played = sender;
  }

  // --------------------------------------------------------------------------
  // Private methods
  // --------------------------------------------------------------------------

  private fee(): u128 {
    const num_players = u128.from(this.players.size);
    return u128.mul(ONE_NEAR, u128.mul(num_players, num_players));
  }

  private increasePot(): void {
    this._pot = u128.add(this._pot, Context.attachedDeposit);
  }

  private won(): bool {
    const result: u8 = 0;
    env.random_seed(0)
    env.read_register(0, result)
    logging.log(result);
    return true;
  }

  private payout(): void {
    if (this._winner.length > 0) {
      ContractPromiseBatch.create(this._winner).transfer(this._pot);
    }
  }

  private generate_fee_message(fee: u128): string {
    return ("There are " + this.players.size.toString()
      + " players. Playing more than once now costs " + asNEAR(fee)
      + " NEAR")
  }
}
