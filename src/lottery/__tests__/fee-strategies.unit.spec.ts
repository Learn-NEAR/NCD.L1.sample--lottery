import { u128 } from "near-sdk-core";
import { FeeStrategy, StrategyType } from "../assembly/fee-strategies";

describe("FeeStrategy", () => {
  it("is instantiated with exponential strategy by default", () => {
    const strategy = new FeeStrategy()
    expect(strategy.strategy).toBe(StrategyType.Exponential)
  });

  it("can be instantiated with a different strategy", () => {
    const strategy = new FeeStrategy(StrategyType.Free)
    expect(strategy.strategy).toBe(StrategyType.Free)
  })

  it("can explain itself", () => {
    expect(FeeStrategy.explain()).toBe("one of [ Free | Constant | Linear | Exponential ]")
  })
})

describe("FeeStrategy#calculate_fee", () => {
  it("handles StrategyType.Free", () => {
    const strategy = new FeeStrategy(StrategyType.Free)
    const fee = strategy.calculate_fee(2, u128.from(1))
    expect(fee).toBe(u128.Zero)
  })

  it("handles StrategyType.Constant", () => {
    const strategy = new FeeStrategy(StrategyType.Constant)
    const fee = strategy.calculate_fee(2, u128.from(1))
    expect(fee).toBe(u128.from(1))
  })

  it("handles StrategyType.Linear", () => {
    const strategy = new FeeStrategy(StrategyType.Linear)
    const fee = strategy.calculate_fee(2, u128.from(1))
    expect(fee).toBe(u128.from(2))
  })

  it("handles StrategyType.Exponential", () => {
    const strategy = new FeeStrategy(StrategyType.Exponential)
    const fee = strategy.calculate_fee(2, u128.from(1))
    expect(fee).toBe(u128.from(4))
  })
})
