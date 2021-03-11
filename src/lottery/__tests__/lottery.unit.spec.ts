import { Lottery } from "../assembly/lottery";

let lottery: Lottery;
beforeEach(() => {
  lottery = new Lottery()
})

describe("Lottery", () => {
  it("can explain itself", () => {
    expect(lottery.explain()).toBe("Players have a 20.0% chance of winning.")
  })
})

describe("Lottery#play", () => {
  // TODO: how do we actually test this?
  it("plays like a lottery", () => {
    // 100% chance of winning
    lottery.configure(1)
    expect(lottery.play()).toBe(true)

    // 0% chance of winning (1 in 10 billion ... but the limit is 1 in 1 billion bc u32)
    lottery.configure(0.000000001)
    expect(lottery.play()).toBe(false)
  })
})

describe("Lottery#configure", () => {
  it("can be reconfigured", () => {
    lottery.configure(1)
    expect(lottery.explain()).toBe("Players have a 100.0% chance of winning.")

    lottery.configure(0.5)
    expect(lottery.explain()).toBe("Players have a 50.0% chance of winning.")

    lottery.configure(0.25)
    expect(lottery.explain()).toBe("Players have a 25.0% chance of winning.")

    lottery.configure(0.01)
    expect(lottery.explain()).toBe("Players have a 1.0% chance of winning.")

    // TODO: format this level of message more clearly
    lottery.configure(0.000000001)
    expect(lottery.explain()).toBe("Players have a 1.0000000000000001e-7% chance of winning.")
  })

  it("throws with invalid values for chance", () => {
    expect(() => {
      lottery.configure(-1) // chance < 0
      lottery.configure(2)  // chance > 1
    }).toThrow("Chance must be within range (0..1]")
  })
})
