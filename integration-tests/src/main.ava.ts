import { Worker, NearAccount, Gas } from "near-workspaces";
import anyTest, { TestFn } from "ava";

const gas = Gas.parse("200 Tgas").toString();

const test = anyTest as TestFn<{
  worker: Worker;
  accounts: Record<string, NearAccount>;
}>;

test.beforeEach(async (t) => {
  // Init the worker and start a Sandbox server
  const worker = await Worker.init();

  // Deploy contract
  const root = worker.rootAccount;
  const contract = await root.createSubAccount("test-account");
  // Get wasm file path from package.json test script in folder above
  await contract.deploy("../contract/build/hello_near.wasm");
  await contract.call(contract, "init", { owner: contract.accountId });

  // Save state for test runs, it is unique for each test
  t.context.worker = worker;
  t.context.accounts = { root, contract };
});

test.afterEach(async (t) => {
  // Stop Sandbox server
  await t.context.worker.tearDown().catch((error) => {
    console.log("Failed to stop the Sandbox:", error);
  });
});

test("Contract#can be initialized with owner", async (t) => {
  const { contract } = t.context.accounts;

  const owner = await contract.view("get_owner");

  t.is(owner, contract.accountId);
});

test("Contract#is active when initialized", async (t) => {
  const { contract } = t.context.accounts;

  const isActive = await contract.view("get_active");

  t.true(isActive);
});

test("Contract#provides a value for what a player may win", async (t) => {
  const { contract } = t.context.accounts;

  const pot = await contract.view("get_pot");

  t.is(pot, "1 NEAR");
});

test("Contract#allows a player to play", async (t) => {
  const { root, contract } = t.context.accounts;

  await contract.call(contract, "configure_lottery", { chance: 1e-9 });
  try {
    await root.call(
      contract,
      "play",
      {},
      { gas: Gas.parse("300 Tgas").toString() }
    );
    t.pass();
  } catch {
    t.fail();
  }
});

test("Contract#provides access to most recent player", async (t) => {
  const { root, contract } = t.context.accounts;

  await contract.call(contract, "configure_lottery", { chance: 1e-9 });
  await root.call(
    contract,
    "play",
    {},
    { gas: Gas.parse("300 Tgas").toString() }
  );

  const lastToPlay = await contract.view("get_last_played");

  t.is(lastToPlay, root.accountId);
});

test("Contract#confirms whether a player has played", async (t) => {
  const { root, contract } = t.context.accounts;

  await root.call(
    contract,
    "play",
    {},
    { gas: Gas.parse("300 Tgas").toString() }
  );

  const hasPlayed = await contract.view("get_has_played", {
    player: root.accountId,
  });

  t.true(hasPlayed);
});

// TODO: add case when a player actually wins
test("Contract#reports the winner of the lottery", async (t) => {
  const { contract } = t.context.accounts;

  const winner = await contract.view("get_winner");

  t.is(winner, "");
});

test("Contract#adjusts the fee after 1 player", async (t) => {
  const { root, contract } = t.context.accounts;

  await root.call(
    contract,
    "play",
    {},
    { gas: Gas.parse("300 Tgas").toString() }
  );

  const fee = await contract.view("get_fee");

  t.is(fee, "1 NEAR");
});

test("Contract#allows ONLY the owner to change the terms of the lottery", async (t) => {
  const { root, contract } = t.context.accounts;

  try {
    await contract.call(contract, "configure_lottery", { chance: 1 });
    t.pass();
  } catch {
    t.fail();
  }

  try {
    await root.call(contract, "configure_lottery", { chance: 0.2 });
    t.fail();
  } catch {
    t.pass();
  }
});

test("Contract#allows ONLY the owner to reset the lottery", async (t) => {
  const { root, contract } = t.context.accounts;

  try {
    await contract.call(contract, "reset", {});
    t.pass();
  } catch {
    t.fail();
  }

  try {
    await root.call(contract, "reset", {});
    t.fail();
  } catch {
    t.pass();
  }
});

test("FeeStrategy#is instantiated with exponential stretegy by default", async (t) => {
  const { contract } = t.context.accounts;

  const strategy = await contract.view("get_fee_strategy");

  t.is(strategy, 3);
});

test("FeeStrategy#can explain itself", async (t) => {
  const { contract } = t.context.accounts;

  const explanation = await contract.view("explain_fees");

  t.is(explanation, "one of [ Free | Constant | Linear | Exponential ]");
});

test("FeeStrategy#can be configured with a different strategy", async (t) => {
  const { contract } = t.context.accounts;
  const strategies = [0, 1, 2];

  strategies.forEach(async (strategy) => {
    try {
      const result = await contract.call(contract, "configure_fee", {
        strategy,
      });
      t.true(result);
    } catch {
      t.fail();
    }
  });
});

test("Lottery can explain itself", async (t) => {
  const { contract } = t.context.accounts;
  const lotteryExplanation = await contract.view("explain_lottery", {});
  t.is(lotteryExplanation, "Players have a 20.0% chance of winning.");
});

test("Lottery#configure can be configured", async (t) => {
  const chances = [1, 0.5, 0.25, 0.01];
  const { contract } = t.context.accounts;

  // chances.forEach(async (chance) => {
  await contract.call(contract, "configure_lottery", { chance: chances[0] });
  const lotteryExplanation = await contract.view("explain_lottery", {});
  t.is(lotteryExplanation, `Players have a 100.0% chance of winning.`);
  // });
});

test("Lottery#configure will throw if invalid value for chance", async (t) => {
  const chances = [-1, 2];
  const { contract } = t.context.accounts;

  chances.forEach(async (chance) => {
    try {
      await contract.call(contract, "configure_lottery", { chance });
      t.fail();
    } catch {
      t.pass();
    }
  });
});

// TODO: Currently cannot optimize gas enough to make this work
test("Lottery#play wins if chance is 100%", async (t) => {
  const { contract } = t.context.accounts;
  await contract.call(contract, "configure_lottery", { chance: 1 });
  await contract.call(contract, "play", {}, { gas });
  const winner = await contract.view("get_winner", {});
  t.is(winner, contract.accountId, "Should have won");
});

test("Lottery#play loses if chance is 1 in 1 billion", async (t) => {
  const { contract } = t.context.accounts;
  await contract.call(contract, "configure_lottery", { chance: 0.000000001 });
  await contract.call(contract, "play", {}, { gas });
  const winner = await contract.view("get_winner", {});
  t.is(winner, "", "Should not have won");
});
