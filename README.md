# Lottery

This repository includes a complete project structure for AssemblyScript contracts targeting the NEAR platform.

The example here is playful.  It's a toy involving a lottery.

The goal of this repository is to make it as easy as possible to get started writing unit and simulation tests for AssemblyScript contracts built to work with NEAR Protocol.

## ⚠️ Warning

Any content produced by NEAR, or developer resources that NEAR provides, are for educational and inspiration purposes only.  NEAR does not encourage, induce or sanction the deployment of any such applications in violation of applicable laws or regulations.

## Usage


### Prerequisites:

- Current version of [Node.js](https://nodejs.org/) <= v16.17.0

### Getting started

1. clone this repo to a local folder
2. run `npm i`
3. run `npm test`

### Top-level `npm` commands

- run `npm test` to run all tests
- run `npm run build` to quickly verify build status

### Other documentation

- Lottery contract and test documentation
  - see `/contract/README.md` for Lottery interface

- Lottery contract simulation tests
  - see `/integration-tests` for simulation testing


## The file system

Please note that boilerplate project configuration files have been ommitted from the following lists for simplicity.

### Contracts and Unit Tests

```txt
contract
├── src                           <-- Lottery contract
│   ├── utils.ts                  <-- shared contract code
│   ├── fee-strategies.ts
│   ├── contract.ts
│   └── lottery.ts
└── README.md
```


### Simulation Tests

```txt
integration-tests                 <-- simulation tests
└── src
    ├── fee-strategies.ava.ts
    ├── lottery.ava.ts
    └── main.ava.ts
```
