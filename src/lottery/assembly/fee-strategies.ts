import { env, logging, u128 } from "near-sdk-as";

export const enum StrategyType {
  Free = 0,
  Constant,
  Linear,
  Exponential,
}

@nearBindgen
export class FeeStrategy {
  constructor(
    public strategy: StrategyType = StrategyType.Exponential
  ) {
    this.assert_valid_fee_strategy(strategy);
  }

  static explain(): string {
    return "one of [ Free | Constant | Linear | Exponential ]";
  }

  calculate_fee(scalar: u32, base: u128): u128 {
    let fee: u128 = u128.Zero;

    switch (this.strategy) {
      case StrategyType.Free:
        // fee is already zero
        break;
      case StrategyType.Constant:
        fee = this.calculate_constant(base);
        break;
      case StrategyType.Linear:
        fee = this.calculate_linear(scalar, base);
        break;
      case StrategyType.Exponential:
        fee = this.calculate_exponential(scalar, base);
        break;
      default:
        logging.log("Unexpected StrategyType encountered");
        env.panic();
    }
    return fee;
  }

  //---------------------------------------------------------------------------
  // FeeStrategy helper methods
  //---------------------------------------------------------------------------

  private calculate_constant(base: u128): u128 {
    return base;
  }

  private calculate_linear(scalar: number, base: u128): u128 {
    return u128.mul(base, u128.from(scalar));
  }

  private calculate_exponential(scalar: u32, base: u128): u128 {
    return u128.mul(base, u128.pow(u128.from(scalar), 2));
  }

  private assert_valid_fee_strategy(strategy: StrategyType): void {
    assert(this.isValidFeeStrategy(strategy), "Invalid FeeStrategy: " + strategy.toString());
  }

  private isValidFeeStrategy(s: i32): bool {
    switch (s) {
      case StrategyType.Free:
      case StrategyType.Constant:
      case StrategyType.Linear:
      case StrategyType.Exponential: return true;
      default: return false;
    }
  }
}
