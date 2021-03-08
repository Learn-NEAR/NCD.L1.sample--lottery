import { u128 } from "near-sdk-as";

export enum StrategyType {
  Constant,
  Linear,
  Exponential,
}

export class Strategy {

  static selector(strategy: StrategyType, scalar: u32, base: u128): u128 {
    switch (strategy) {
      case StrategyType.Exponential:
        return this.exponential(scalar, base);

      case StrategyType.Linear:
        return this.linear(scalar, base);

      case StrategyType.Constant:
        return this.constant(scalar, base);

      default:
        assert(false, "Must provide a valid fee strategy");
        return u128.Zero;
    }
  }

  static constant(scalar: u32, base: u128): u128 {
    return base;
  }

  static linear(scalar: u32, base: u128): u128 {
    return u128.mul(base, u128.from(scalar));
  }

  static exponential(scalar: u32, base: u128): u128 {
    const scalar_as_u128 = u128.from(scalar);
    return u128.mul(base, u128.mul(scalar_as_u128, scalar_as_u128));
  }
}
