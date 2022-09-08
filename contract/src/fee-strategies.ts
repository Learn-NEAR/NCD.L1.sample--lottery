import { assert } from "near-sdk-js";

export const enum StrategyType {
  Free,
  Constant,
  Linear,
  Exponential,
}

export class FeeStrategy {
  static from(feeStrategy: FeeStrategy) {
    return new FeeStrategy(feeStrategy.strategy);
  }

  constructor(private strategy: StrategyType = StrategyType.Exponential) {
    assertValidFeeStrategy(strategy);
  }

  get strategyType() {
    return this.strategy;
  }

  explain(): string {
    return "one of [ Free | Constant | Linear | Exponential ]";
  }

  // TODO: handle possible overflow for each strategy
  calculate(scalar: number, base: bigint): bigint {
    let fee = BigInt(0);

    switch (this.strategy) {
      case StrategyType.Free:
        // fee is already zero
        break;
      case StrategyType.Constant:
        fee = this.calculateConstant(base);
        break;
      case StrategyType.Linear:
        fee = this.calculateLinear(scalar, base);
        break;
      case StrategyType.Exponential:
        fee = this.calculateExponential(scalar, base);
        break;
      default:
        throw new Error("Unexpected StrategyType encountered");
    }

    return fee;
  }

  //---------------------------------------------------------------------------
  // FeeStrategy helper methods
  //---------------------------------------------------------------------------

  calculateConstant(base: bigint): bigint {
    return base;
  }

  calculateLinear(scalar: number, base: bigint): bigint {
    return BigInt(scalar) * base;
  }

  calculateExponential(scalar: number, base: bigint): bigint {
    return base * BigInt(scalar ** 2);
  }
}

export function isValidFeeStrategy(s: number): boolean {
  switch (s) {
    case StrategyType.Free:
    case StrategyType.Constant:
    case StrategyType.Linear:
    case StrategyType.Exponential:
      return true;
    default:
      return false;
  }
}

export function assertValidFeeStrategy(strategy: StrategyType): void {
  assert(
    isValidFeeStrategy(strategy),
    "Invalid FeeStrategy: " + strategy.toString()
  );
}
