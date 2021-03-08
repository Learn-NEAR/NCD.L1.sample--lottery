import { u128 } from "near-sdk-as";

export class Strategy {

  static selector(strategy: StrategyType, scalar: u32, base: u128): u128 {
    switch (strategy) {
      case StrategyType.Free:
        return u128.Zero;

      case StrategyType.Constant:
        return base;

      case StrategyType.Linear:
        return u128.mul(base, u128.from(scalar));

      case StrategyType.Exponential:
        const scalar_as_u128 = u128.from(scalar);
        return u128.mul(base, u128.mul(scalar_as_u128, scalar_as_u128));

      default:
        assert(false, "Must provide a valid fee strategy");
        return u128.Zero;
    }
  }
}

export const enum StrategyType {
  Free = 0,
  Constant,
  Linear,
  Exponential,
}

// TODO: this is clunky. isn't there some better way to do this?
export function isValidStrategy(s: i32): bool {
  switch (s) {
    case StrategyType.Free:
    case StrategyType.Constant:
    case StrategyType.Linear:
    case StrategyType.Exponential: return true;
    default: return false;
  }
}
