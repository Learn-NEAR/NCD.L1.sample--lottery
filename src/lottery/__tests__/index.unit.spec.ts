import { VMContext } from "near-sdk-as";

import { Contract } from "../assembly/index";
import { StrategyType } from "../assembly/fee-strategies";
import { ONE_NEAR } from "../../utils";

const contract = "lottery"
const owner = "alice"
const player1 = "bob"
const player2 = "carol"

let lottery: Contract

beforeEach(() => {
  VMContext.setCurrent_account_id(contract)
  VMContext.setAccount_balance(ONE_NEAR) // resolves HostError(BalanceExceeded)
  lottery = new Contract(owner)
})

// --------------------------------------------
// --------------------------------------------
// VIEW method tests
// --------------------------------------------
// --------------------------------------------

// --------------------------------------------
// Contract Metadata
// --------------------------------------------
describe("Contract", () => {

  it("can be initialized with owner", () => {
    // who owns this lottery? -> AccountId
    expect(lottery.get_owner()).toBe(owner)
  });

  it("is active when initialized", () => {
    // is the lottery still active? -> bool
    expect(lottery.get_active()).toBe(true)
  })
})

// --------------------------------------------
// Lottery Details
// --------------------------------------------
describe("Contract interface for Lottery", () => {

  it("provides an explanation of the lottery", () => {
    // explain terms of the lottery -> string
    expect(lottery.explain_lottery()).toBe("Players have a 1 in 10 chance of winning. Xing is most favorable, increasing your chance to win after each play by 10.0%")
  });

  it("provides a value for what a player may win", () => {
    // what is the pot currently? -> string
    expect(lottery.get_pot()).toBe("1 NEAR")
  });

  it("allows a player to play", () => {
    // play the lottery
    expect(() => {
      lottery.play()
    }).not.toThrow()
  });

  it("provides access to most recent player", () => {
    // who played last? -> AccountId
    expect(lottery.get_last_played()).toBeNull()

    VMContext.setSigner_account_id(player1)
    lottery.play()

    expect(lottery.get_last_played()).toBe(player1)
  });

  it("confirms whether a player has played", () => {
    // has player played already? -> bool
    expect(lottery.get_has_played(player1)).toBe(false)

    VMContext.setSigner_account_id(player1)
    lottery.play()

    expect(lottery.get_has_played(player1)).toBe(true)
  });

  it("reports the winner of the lottery", () => {
    // who, if anyone, won? -> AccountId
    expect(lottery.get_winner()).toBeNull()

    // setup lottery to guarantee a win
    VMContext.setPredecessor_account_id(contract) // resolves Error: "Only this contract may call itself"
    lottery.configure_lottery('1', '1') // 100% chance of winning

    VMContext.setSigner_account_id(player1)
    lottery.play()

    expect(lottery.get_winner()).toBe(player1)
  });
})

// --------------------------------------------
// Lottery Fees
// --------------------------------------------
describe("Contract interface for Lottery Fees", () => {

  it("reports the current fee to play the lottery", () => {
    // what is the fee for the lottery? -> string
    expect(lottery.get_fee()).toBe("0 NEAR")
  });

  it("reports the fee strategy", () => {
    // what is the fee strategy for the lottery? -> StrategyType
    expect(lottery.get_fee_strategy()).toBe(StrategyType.Exponential)
  })

  it("explains possible fee strategies", () => {
    // explain fees for the lottery -> string
    expect(lottery.explain_fees()).toBe("one of [ Free | Constant | Linear | Exponential ]")
  })

  it("adjusts the fee after 1 player", () => {
    VMContext.setSigner_account_id(player1)
    lottery.play()

    // assuming anything except FeeStrategy.Free
    expect(lottery.get_fee()).toBe("1 NEAR")
  })
})


// --------------------------------------------
// --------------------------------------------
// CHANGE method tests
// --------------------------------------------
// --------------------------------------------

// --------------------------------------------
// Lottery Management
// --------------------------------------------
describe("Contract interface for Lottery Management", () => {

  it("allows ONLY the owner to change the terms of the lottery", () => {
    // configure the terms of the lottery
    expect(lottery.explain_lottery()).toBe("Players have a 1 in 10 chance of winning. Xing is most favorable, increasing your chance to win after each play by 10.0%")

    VMContext.setPredecessor_account_id(contract) // resolves Error: "Only this contract may call itself"

    lottery.configure_lottery('1', '1')
    expect(lottery.explain_lottery()).toBe("Players have a 1 in 2 (or better!) chance of winning. Xing is most favorable, increasing your chance to win after each play by 0.0%")
  });

  it("adjusts the fee based on FeeStrategy", () => {
    VMContext.setSigner_account_id(player1)
    lottery.play()
    VMContext.setSigner_account_id(player2)
    lottery.play()

    VMContext.setPredecessor_account_id(contract) // resolves Error: "Only this contract may call itself"

    // configure the fee strategy
    lottery.configure_fee(StrategyType.Free)
    expect(lottery.get_fee()).toBe("0 NEAR")

    lottery.configure_fee(StrategyType.Constant)
    expect(lottery.get_fee()).toBe("1 NEAR")

    lottery.configure_fee(StrategyType.Linear)
    expect(lottery.get_fee()).toBe("2 NEAR")

    lottery.configure_fee(StrategyType.Exponential) // default
    expect(lottery.get_fee()).toBe("4 NEAR")
  });

  it("allows ONLY the owner to reset the lottery", () => {
    // reset the lottery
    expect(() => {
      lottery.reset()
    }).toThrow()

    expect(() => {
      VMContext.setPredecessor_account_id(contract) // resolves Error: "Only this contract may call itself"
      lottery.reset()
    }).not.toThrow()

  });

})

// --------------------------------------------
// Cross-contract calls
// --------------------------------------------
// CANNOT BE TESTED using unit tests because it's a callback (after payout is complete)
// MUST USE SIMULATION tests to verify this works as expected
// on_payout_complete(): void {
// --------------------------------------------
