import { Worker, NearAccount } from "near-workspaces";
import anyTest, { TestFn } from "ava";

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
