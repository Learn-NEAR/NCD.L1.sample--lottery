import { Lottery } from "../assembly/lottery";

let lottery: Lottery;
beforeEach(() => {
  lottery = new Lottery()
})

describe("Lottery", () => {
  it("can explain itself", () => {
    expect(lottery.explain()).toBe("Players have a 1 in 10 chance of winning. Xing is most favorable, increasing your chance to win after each play by 10.0%")
  })
})

describe("Lottery#play", () => {
  // TODO: how do we actually test this?
  it("plays like a lottery", () => {
    // 100% chance of winning
    lottery.configure(1, 1)
    expect(lottery.play()).toBe(true)

    // 0% chance of winning (1 in 10 billion ... but the limit is 1 in 1 billion bc u32)
    lottery.configure(0.000000001, 1)
    expect(lottery.play()).toBe(false)
  })
})

describe("Lottery#configure", () => {
  it("can be reconfigured", () => {
    lottery.configure(1, 1)
    expect(lottery.explain()).toBe("Players have a 1 in 2 (or better!) chance of winning. Xing is most favorable, increasing your chance to win after each play by 0.0%")

    lottery.configure(0.5, 1)
    expect(lottery.explain()).toBe("Players have a 1 in 2 chance of winning. Xing is most favorable, increasing your chance to win after each play by 0.0%")

    lottery.configure(0.25, 1)
    expect(lottery.explain()).toBe("Players have a 1 in 4 chance of winning. Xing is most favorable, increasing your chance to win after each play by 0.0%")

    lottery.configure(0.01, 1)
    expect(lottery.explain()).toBe("Players have a 1 in 100 chance of winning. Xing is most favorable, increasing your chance to win after each play by 0.0%")

    lottery.configure(0.000000001, 1)
    expect(lottery.explain()).toBe("Players have a 1 in 999999999 chance of winning. Xing is most favorable, increasing your chance to win after each play by 0.0%")
  })

  it("throws with invalid values for chance", () => {
    expect(() => {
      lottery.configure(-1, 1) // chance < 0
      lottery.configure(2, 1)  // chance > 1
    }).toThrow("Chance must be within range (0..1]")
  })
})
