## Setting up your terminal

The scripts in this folder support a simple demonstration of the contract.
Although this contract supports an unlimited number of player, this demostration uses only 2 players.

It uses the following setup:

```txt
┌───────────────────────────────────────┬───────────────────────────────────────┐
│                                       │                                       │
│                                       │                                       │
│                                       │                                       │
│                                       │                   B                   │
│                                       │                                       │
│                                       │                                       │
│                                       │                                       │
│                  A                    ├───────────────────┬───────────────────┤
│                                       │                   │                   │
│                                       │                   │         D         │
│                                       │                   │                   │
│                                       │         C         ├───────────────────┤
│                                       │                   │                   │
│                                       │                   │         E         │
│                                       │                   │                   │
└───────────────────────────────────────┴───────────────────┴───────────────────┘
```

### Terminal **A**

*This window is used to compile, deploy and control the contract*
- Environment
  ```sh
  export CONTRACT=        # depends on deployment
  export OWNER=           # any account you control
  export PLAYER=          # any account you control

  # for example
  # export CONTRACT=dev-1615190770786-2702449
  # export OWNER=sherif.testnet
  # export PLAYER=ajax.testnet
  ```

- Commands
  ```sh
  1.init.sh               # cleanup, compile and deploy contract
  2.play.sh               # play the game, optionally takes a number as payment
  3.reset.sh              # reset the game when it's finished (ie. "active" is false)

  report.sh               # run a report of the game state
  x-configure-fee.sh      # change the fee strategy to any one of many supported strategies
  x-configure-lottery.sh  # change the terms of the lottery by adjusting chance in the range (0..1]
  ```

### Terminal **B**

*This window is used to render the contract account storage*
- Environment
  ```sh
  export CONTRACT=        # depends on deployment

  # for example
  # export CONTRACT=dev-1615190770786-2702449
  ```

- Commands
  ```sh
  # monitor contract storage using near-account-utils
  # https://github.com/near-examples/near-account-utils
  watch -d -n 1 yarn storage $CONTRACT
  ```

### Terminal **C**

 *This window is used to render contract account state and keys*
- Environment
  ```sh
  export CONTRACT=        # depends on deployment

  # for example
  # export CONTRACT=dev-1615190770786-2702449
  ```

- Commands
  ```sh
  # monitor contract account state (for balance changes) and keys (for nonce changes)
  watch -d -n 1 "near state $CONTRACT && echo && near keys $CONTRACT"
  ```

### Terminal **D**

*This window is used to render the account state of player 1*
- Environment
  ```sh
  export PLAYER=          # any account you control

  # for example (player 1)
  # export PLAYER=ajax.testnet
  ```

- Commands
  ```sh
  # monitor player 1 account state (for balance changes)
  watch -d -n 1 near state $PLAYER
  ```

### Terminal **E**

*This window is used to render the account state of player 2*
- Environment
  ```sh
  export PLAYER=          # any account you control

  # for example (player 2)
  # export PLAYER=bran.testnet
  ```

- Commands
  ```sh
  # monitor player 2 account state (for balance changes)
  watch -d -n 1 near state $PLAYER
  ```

---

## OS Support

### Linux

- The `watch` command is supported natively on Linux
- To learn more about any of these shell commands take a look at [explainshell.com](https://explainshell.com)

### MacOS

- Consider `brew info visionmedia-watch` (or `brew install watch`)

### Windows

- Consider this article: [What is the Windows analog of the Linux watch command?](https://superuser.com/questions/191063/what-is-the-windows-analog-of-the-linux-watch-command#191068)
