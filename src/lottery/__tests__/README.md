## Unit tests

Unit tests can be run from the top level folder using the following command:

```
yarn test:unit
```

### Tests for Contract in `index.unit.spec.ts`

```

```

### Tests for Lottery in `lottery.unit.spec.ts`

```

```

### Tests for FeeStrategy in `fee-strategies.unit.spec.ts`

```
[Describe]: FeeStrategy

 [Success]: ✔ is instantiated with exponential strategy by default
 [Success]: ✔ can be instantiated with a different strategy
 [Success]: ✔ can explain itself

[Describe]: FeeStrategy#calculate_fee

 [Success]: ✔ handles StrategyType.Free
 [Success]: ✔ handles StrategyType.Constant
 [Success]: ✔ handles StrategyType.Linear
 [Success]: ✔ handles StrategyType.Exponential

    [File]: src/lottery/__tests__/fee-strategies.unit.spec.ts
  [Groups]: 3 pass, 3 total
  [Result]: ✔ PASS
[Snapshot]: 0 total, 0 added, 0 removed, 0 different
 [Summary]: 7 pass,  0 fail, 7 total
    [Time]: 6.896ms
```
