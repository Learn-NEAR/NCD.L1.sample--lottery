import { Worker, NearAccount, Gas, NEAR } from "near-workspaces";
import anyTest, { TestFn } from "ava";

const test = anyTest as TestFn<{
  worker: Worker;
  accounts: Record<string, NearAccount>;
}>;

const GAS = Gas.parse("300 Tgas").toString();

test.beforeEach(async (t) => {
  // Init the worker and start a Sandbox server
  const worker = await Worker.init();

  // Deploy contract
  const root = worker.rootAccount;
  const contract = await root.createSubAccount("test-account", {
    initialBalance: NEAR.parse("100 N").toString(),
  });
  // Get wasm file path from package.json test script in folder above
  await contract.deploy(process.argv[2]);
  // JavaScript contracts require calling 'init' function upon deployment
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
  await contract.call(contract, "play", {}, { gas: GAS });
  const winner = await contract.view("get_winner", {});
  t.is(winner, contract, "Should have won");
});

test("Lottery#play loses if chance is 1 in 1 billion", async (t) => {
  const { contract } = t.context.accounts;
  await contract.call(contract, "configure_lottery", { chance: 0.000000001 });
  await contract.call(contract, "play", {}, { gas: GAS });
  const winner = await contract.view("get_winner", {});
  t.is(winner, "", "Should not have won");
});
