# Lottery

This repository includes a complete project structure for AssemblyScript contracts targeting the NEAR platform.

The example here is playful.  It's a toy involving a lottery.

The goal of this repository is to make it as easy as possible to get started writing unit and simulation tests for AssemblyScript contracts built to work with NEAR Protocol.


## Usage

### Getting started

1. clone this repo to a local folder
2. run `yarn`
3. run `yarn test`

### Top-level `yarn` commands

- run `yarn test` to run all tests
  - (!) be sure to run `yarn build:release` at least once before:
    - run `yarn test:unit` to run only unit tests
    - run `yarn test:simulate` to run only simulation tests
- run `yarn build` to quickly verify build status
- run `yarn clean` to clean up build folder

### Other documentation

- **Lottery** contract and test documentation
  - see `/src/lottery/README` for Lottery interface
  - see `/src/lottery/__tests__/README` for Lottery unit testing details

- simulation tests
  - see `/simulation/README` for simulation testing


## The file system

Please note that boilerplate project configuration files have been ommitted from the following lists for simplicity.

### Contracts and Unit Tests

```txt
src
├── lottery                       <-- Lottery contract
│   ├── README.md
│   ├── __tests__
│   │   ├── README.md
│   │   ├── fee-strategies.unit.spec.ts
│   │   └── index.unit.spec.ts
│   └── assembly
│       ├── index.ts
│       └── models.ts
└── utils.ts                      <-- shared contract code
```

### Simulation Tests

```txt
simulation                        <-- simulation tests
├── Cargo.toml
├── README.md
└── src
    ├── lib.rs
    └── lottery.rs
```
