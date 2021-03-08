import { u128, env, logging } from "near-sdk-as";

export enum StrategyType {
  Constant,
  Linear,
  Exponential,
}

export class Strategy {

  calculate_fee(strategy: StrategyType, scalar: u32, base: u128): u128 {
    let fee: u128 = u128.Zero;
    switch (strategy) {
      case StrategyType.Exponential:
        fee = this.exponential(scalar, base);
      case StrategyType.Linear:
        fee = this.linear(scalar, base);

      case StrategyType.Constant:
        fee = this.constant(scalar, base);
      default:
        logging.log("Unexpected StrategyType encountered");
        env.panic();
    }
    return fee;
  }

  private calculate_constant(scalar: u32, base: u128): u128 {
    return base;
  }

  private calculate_linear(scalar: u32, base: u128): u128 {
    return u128.mul(base, u128.from(scalar));
  }

  private calculate_exponential(scalar: u32, base: u128): u128 {
    const scalar_as_u128 = u128.from(scalar);
    return u128.mul(base, u128.mul(scalar_as_u128, scalar_as_u128));
  }
}
