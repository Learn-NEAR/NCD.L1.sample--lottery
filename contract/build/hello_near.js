function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) {
  var desc = {};
  Object.keys(descriptor).forEach(function (key) {
    desc[key] = descriptor[key];
  });
  desc.enumerable = !!desc.enumerable;
  desc.configurable = !!desc.configurable;

  if ('value' in desc || desc.initializer) {
    desc.writable = true;
  }

  desc = decorators.slice().reverse().reduce(function (desc, decorator) {
    return decorator(target, property, desc) || desc;
  }, desc);

  if (context && desc.initializer !== void 0) {
    desc.value = desc.initializer ? desc.initializer.call(context) : void 0;
    desc.initializer = undefined;
  }

  if (desc.initializer === void 0) {
    Object.defineProperty(target, property, desc);
    desc = null;
  }

  return desc;
}

function call(target, key, descriptor) {}
function view(target, key, descriptor) {}
function NearBindgen(target) {
  return class extends target {
    static _init() {
      // @ts-ignore
      let args = target.deserializeArgs();
      let ret = new target(args); // @ts-ignore

      ret.init(); // @ts-ignore

      ret.serialize();
      return ret;
    }

    static _get() {
      let ret = Object.create(target.prototype);
      return ret;
    }

  };
}

const U64_MAX = 2n ** 64n - 1n;
const EVICTED_REGISTER = U64_MAX - 1n;
function log(...params) {
  env.log(`${params.map(x => x === undefined ? 'undefined' : x) // Stringify undefined
  .map(x => typeof x === 'object' ? JSON.stringify(x) : x) // Convert Objects to strings
  .join(' ')}` // Convert to string
  );
}
function signerAccountId() {
  env.signer_account_id(0);
  return env.read_register(0);
}
function predecessorAccountId() {
  env.predecessor_account_id(0);
  return env.read_register(0);
}
function blockIndex() {
  return env.block_index();
}
function blockHeight() {
  return blockIndex();
}
function attachedDeposit() {
  return env.attached_deposit();
}
function randomSeed() {
  env.random_seed(0);
  return env.read_register(0);
}
function panic(msg) {
  if (msg !== undefined) {
    env.panic(msg);
  } else {
    env.panic();
  }
}
function storageRead(key) {
  let ret = env.storage_read(key, 0);

  if (ret === 1n) {
    return env.read_register(0);
  } else {
    return null;
  }
}
function storageHasKey(key) {
  let ret = env.storage_has_key(key);

  if (ret === 1n) {
    return true;
  } else {
    return false;
  }
}
function storageGetEvicted() {
  return env.read_register(EVICTED_REGISTER);
}

function currentAccountId() {
  env.current_account_id(0);
  return env.read_register(0);
}
function input() {
  env.input(0);
  return env.read_register(0);
}
function promiseThen(promiseIndex, accountId, methodName, args, amount, gas) {
  return env.promise_then(promiseIndex, accountId, methodName, args, amount, gas);
}
function promiseBatchCreate(accountId) {
  return env.promise_batch_create(accountId);
}
function promiseBatchActionTransfer(promiseIndex, amount) {
  env.promise_batch_action_transfer(promiseIndex, amount);
}
var PromiseResult;

(function (PromiseResult) {
  PromiseResult[PromiseResult["NotReady"] = 0] = "NotReady";
  PromiseResult[PromiseResult["Successful"] = 1] = "Successful";
  PromiseResult[PromiseResult["Failed"] = 2] = "Failed";
})(PromiseResult || (PromiseResult = {}));
function promiseReturn(promiseIdx) {
  env.promise_return(promiseIdx);
}
function storageWrite(key, value) {
  let exist = env.storage_write(key, value, EVICTED_REGISTER);

  if (exist === 1n) {
    return true;
  }

  return false;
}
function storageRemove(key) {
  let exist = env.storage_remove(key, EVICTED_REGISTER);

  if (exist === 1n) {
    return true;
  }

  return false;
}

class NearContract {
  deserialize() {
    const rawState = storageRead("STATE");

    if (rawState) {
      const state = JSON.parse(rawState); // reconstruction of the contract class object from plain object

      let c = this.default();
      Object.assign(this, state);

      for (const item in c) {
        if (c[item].constructor?.deserialize !== undefined) {
          this[item] = c[item].constructor.deserialize(this[item]);
        }
      }
    } else {
      throw new Error("Contract state is empty");
    }
  }

  serialize() {
    storageWrite("STATE", JSON.stringify(this));
  }

  static deserializeArgs() {
    let args = input();
    return JSON.parse(args || "{}");
  }

  static serializeReturn(ret) {
    return JSON.stringify(ret);
  }

  init() {}

}

function u8ArrayToBytes(array) {
  let ret = "";

  for (let e of array) {
    ret += String.fromCharCode(e);
  }

  return ret;
} // TODO this function is a bit broken and the type can't be string
// TODO for more info: https://github.com/near/near-sdk-js/issues/78

function bytesToU8Array(bytes) {
  let ret = new Uint8Array(bytes.length);

  for (let i = 0; i < bytes.length; i++) {
    ret[i] = bytes.charCodeAt(i);
  }

  return ret;
}
function bytes(strOrU8Array) {
  if (typeof strOrU8Array == "string") {
    return checkStringIsBytes(strOrU8Array);
  } else if (strOrU8Array instanceof Uint8Array) {
    return u8ArrayToBytes(strOrU8Array);
  }

  throw new Error("bytes: expected string or Uint8Array");
}

function checkStringIsBytes(str) {
  for (let i = 0; i < str.length; i++) {
    if (str.charCodeAt(i) > 255) {
      throw new Error(`string ${str} at index ${i}: ${str[i]} is not a valid byte`);
    }
  }

  return str;
}

function assert(b, str) {
  if (b) {
    return;
  } else {
    throw Error("assertion failed: " + str);
  }
}

const ERR_INDEX_OUT_OF_BOUNDS = "Index out of bounds";
const ERR_INCONSISTENT_STATE$1 = "The collection is an inconsistent state. Did previous smart contract execution terminate unexpectedly?";

function indexToKey(prefix, index) {
  let data = new Uint32Array([index]);
  let array = new Uint8Array(data.buffer);
  let key = u8ArrayToBytes(array);
  return prefix + key;
} /// An iterable implementation of vector that stores its content on the trie.
/// Uses the following map: index -> element


class Vector {
  constructor(prefix) {
    this.length = 0;
    this.prefix = prefix;
  }

  len() {
    return this.length;
  }

  isEmpty() {
    return this.length == 0;
  }

  get(index) {
    if (index >= this.length) {
      return null;
    }

    let storageKey = indexToKey(this.prefix, index);
    return JSON.parse(storageRead(storageKey));
  } /// Removes an element from the vector and returns it in serialized form.
  /// The removed element is replaced by the last element of the vector.
  /// Does not preserve ordering, but is `O(1)`.


  swapRemove(index) {
    if (index >= this.length) {
      throw new Error(ERR_INDEX_OUT_OF_BOUNDS);
    } else if (index + 1 == this.length) {
      return this.pop();
    } else {
      let key = indexToKey(this.prefix, index);
      let last = this.pop();

      if (storageWrite(key, JSON.stringify(last))) {
        return JSON.parse(storageGetEvicted());
      } else {
        throw new Error(ERR_INCONSISTENT_STATE$1);
      }
    }
  }

  push(element) {
    let key = indexToKey(this.prefix, this.length);
    this.length += 1;
    storageWrite(key, JSON.stringify(element));
  }

  pop() {
    if (this.isEmpty()) {
      return null;
    } else {
      let lastIndex = this.length - 1;
      let lastKey = indexToKey(this.prefix, lastIndex);
      this.length -= 1;

      if (storageRemove(lastKey)) {
        return JSON.parse(storageGetEvicted());
      } else {
        throw new Error(ERR_INCONSISTENT_STATE$1);
      }
    }
  }

  replace(index, element) {
    if (index >= this.length) {
      throw new Error(ERR_INDEX_OUT_OF_BOUNDS);
    } else {
      let key = indexToKey(this.prefix, index);

      if (storageWrite(key, JSON.stringify(element))) {
        return JSON.parse(storageGetEvicted());
      } else {
        throw new Error(ERR_INCONSISTENT_STATE$1);
      }
    }
  }

  extend(elements) {
    for (let element of elements) {
      this.push(element);
    }
  }

  [Symbol.iterator]() {
    return new VectorIterator(this);
  }

  clear() {
    for (let i = 0; i < this.length; i++) {
      let key = indexToKey(this.prefix, i);
      storageRemove(key);
    }

    this.length = 0;
  }

  toArray() {
    let ret = [];

    for (let v of this) {
      ret.push(v);
    }

    return ret;
  }

  serialize() {
    return JSON.stringify(this);
  } // converting plain object to class object


  static deserialize(data) {
    let vector = new Vector(data.prefix);
    vector.length = data.length;
    return vector;
  }

}
class VectorIterator {
  constructor(vector) {
    this.current = 0;
    this.vector = vector;
  }

  next() {
    if (this.current < this.vector.len()) {
      let value = this.vector.get(this.current);
      this.current += 1;
      return {
        value,
        done: false
      };
    }

    return {
      value: null,
      done: true
    };
  }

}

const ERR_INCONSISTENT_STATE = "The collection is an inconsistent state. Did previous smart contract execution terminate unexpectedly?";
class UnorderedSet {
  constructor(prefix) {
    this.length = 0;
    this.prefix = prefix;
    this.elementIndexPrefix = prefix + "i";
    let elementsPrefix = prefix + "e";
    this.elements = new Vector(elementsPrefix);
  }

  len() {
    return this.elements.len();
  }

  isEmpty() {
    return this.elements.isEmpty();
  }

  serializeIndex(index) {
    let data = new Uint32Array([index]);
    let array = new Uint8Array(data.buffer);
    return u8ArrayToBytes(array);
  }

  deserializeIndex(rawIndex) {
    let array = bytesToU8Array(rawIndex);
    let data = new Uint32Array(array.buffer);
    return data[0];
  }

  contains(element) {
    let indexLookup = this.elementIndexPrefix + JSON.stringify(element);
    return storageHasKey(indexLookup);
  }

  set(element) {
    let indexLookup = this.elementIndexPrefix + JSON.stringify(element);

    if (storageRead(indexLookup)) {
      return false;
    } else {
      let nextIndex = this.len();
      let nextIndexRaw = this.serializeIndex(nextIndex);
      storageWrite(indexLookup, nextIndexRaw);
      this.elements.push(element);
      return true;
    }
  }

  remove(element) {
    let indexLookup = this.elementIndexPrefix + JSON.stringify(element);
    let indexRaw = storageRead(indexLookup);

    if (indexRaw) {
      if (this.len() == 1) {
        // If there is only one element then swap remove simply removes it without
        // swapping with the last element.
        storageRemove(indexLookup);
      } else {
        // If there is more than one element then swap remove swaps it with the last
        // element.
        let lastElement = this.elements.get(this.len() - 1);

        if (!lastElement) {
          throw new Error(ERR_INCONSISTENT_STATE);
        }

        storageRemove(indexLookup); // If the removed element was the last element from keys, then we don't need to
        // reinsert the lookup back.

        if (lastElement != element) {
          let lastLookupElement = this.elementIndexPrefix + JSON.stringify(lastElement);
          storageWrite(lastLookupElement, indexRaw);
        }
      }

      let index = this.deserializeIndex(indexRaw);
      this.elements.swapRemove(index);
      return true;
    }

    return false;
  }

  clear() {
    for (let element of this.elements) {
      let indexLookup = this.elementIndexPrefix + JSON.stringify(element);
      storageRemove(indexLookup);
    }

    this.elements.clear();
  }

  toArray() {
    let ret = [];

    for (let v of this) {
      ret.push(v);
    }

    return ret;
  }

  [Symbol.iterator]() {
    return this.elements[Symbol.iterator]();
  }

  extend(elements) {
    for (let element of elements) {
      this.set(element);
    }
  }

  serialize() {
    return JSON.stringify(this);
  } // converting plain object to class object


  static deserialize(data) {
    let set = new UnorderedSet(data.prefix); // reconstruct UnorderedSet

    set.length = data.length; // reconstruct Vector

    let elementsPrefix = data.prefix + "e";
    set.elements = new Vector(elementsPrefix);
    set.elements.length = data.elements.length;
    return set;
  }

}

let StrategyType;

(function (StrategyType) {
  StrategyType[StrategyType["Free"] = 0] = "Free";
  StrategyType[StrategyType["Constant"] = 1] = "Constant";
  StrategyType[StrategyType["Linear"] = 2] = "Linear";
  StrategyType[StrategyType["Exponential"] = 3] = "Exponential";
})(StrategyType || (StrategyType = {}));

class FeeStrategy {
  static from(feeStrategy) {
    return new FeeStrategy(feeStrategy.strategy);
  }

  constructor(strategy = StrategyType.Exponential) {
    this.strategy = strategy;
    assertValidFeeStrategy(strategy);
  }

  get strategyType() {
    return this.strategy;
  }

  explain() {
    return "one of [ Free | Constant | Linear | Exponential ]";
  } // TODO: handle possible overflow for each strategy


  calculate(scalar, base) {
    let fee = BigInt(0);

    switch (this.strategy) {
      case StrategyType.Free:
        // fee is already zero
        break;

      case StrategyType.Constant:
        fee = this.calculateConstant(base);
        break;

      case StrategyType.Linear:
        fee = this.calculateLinear(scalar, base);
        break;

      case StrategyType.Exponential:
        fee = this.calculateExponential(scalar, base);
        break;

      default:
        log("Unexpected StrategyType encountered");
        panic();
    }

    return fee;
  } //---------------------------------------------------------------------------
  // FeeStrategy helper methods
  //---------------------------------------------------------------------------


  calculateConstant(base) {
    return base;
  }

  calculateLinear(scalar, base) {
    return BigInt(scalar) * base;
  }

  calculateExponential(scalar, base) {
    return base * BigInt(scalar ** 2);
  }

}
function isValidFeeStrategy(s) {
  switch (s) {
    case StrategyType.Free:
    case StrategyType.Constant:
    case StrategyType.Linear:
    case StrategyType.Exponential:
      return true;

    default:
      return false;
  }
}
function assertValidFeeStrategy(strategy) {
  assert(isValidFeeStrategy(strategy), "Invalid FeeStrategy: " + strategy.toString());
}

const ONE_NEAR = BigInt(10e24);
const TGAS = BigInt(10e14);
const XCC_GAS = BigInt(5) * TGAS;
function asNEAR(value) {
  return `${BigInt(Number(value)) / ONE_NEAR}`;
}
function random(bound) {
  const sum = Array.from(randomSeed()).reduce((sum, current) => sum + current.charCodeAt(0), 0);
  return sum % bound;
}

class Lottery {
  static from(lottery) {
    return new Lottery(lottery.chance);
  }

  constructor(chance = 0.2) {
    this.chance = chance;
  }

  explain() {
    return `Players have a ${(this.chance * 100).toFixed(1)}% chance of winning.`;
  }

  play() {
    const height = Number(blockHeight());
    const roll = random(height);
    log("roll: " + roll.toString());
    return roll <= height * this.chance;
  }

  configure(chance) {
    assert(chance >= 0.000000001 && chance <= 1, "Chance must be within range (0..1]");
    this.chance = chance;
    log(this.explain());
  }

}

var _class, _class2;

BigInt.prototype["toJSON"] = function () {
  return this.toString();
}; // The @NearBindgen decorator allows this code to compile to Base64.


let Contract = NearBindgen(_class = (_class2 = class Contract extends NearContract {
  active = true;
  pot = ONE_NEAR;
  lottery = new Lottery();
  feeStrategy = new FeeStrategy();
  players = new UnorderedSet("players");

  constructor({
    owner
  }) {
    super();
    this.owner = owner;
  }

  default() {
    return new Contract({
      owner: ""
    });
  }

  get_owner() {
    return this.owner;
  }

  get_winner() {
    return this.winner;
  }

  get_pot() {
    return `${asNEAR(this.pot)} NEAR`;
  }

  get_fee() {
    return asNEAR(this.fee()) + " NEAR";
  }

  get_fee_strategy() {
    return FeeStrategy.from(this.feeStrategy).strategyType;
  }

  get_has_played({
    player
  }) {
    return this.players.contains(player);
  }

  get_last_played() {
    return this.lastPlayed;
  }

  get_active() {
    return this.active;
  }

  explain_fees() {
    return FeeStrategy.from(this.feeStrategy).explain();
  }

  explain_lottery() {
    return Lottery.from(this.lottery).explain();
  } // --------------------------------------------------------------------------
  // Public CHANGE methods
  // --------------------------------------------------------------------------

  /**
   * "Pay to play"
   *
   * First time is free to play and you may win!
   *
   * If you've already played once then any other play costs you a fee.
   * This fee is calculated as 1 NEAR X the square of the total number of unique players
   */


  play() {
    assert(this.active, `${this.winner} won ${this.pot}. Please reset the game.`);
    const signer = signerAccountId();
    const deposit = BigInt(Number(attachedDeposit())); // if you've played before then you have to pay extra

    if (this.players.contains(signer)) {
      const fee = this.fee();
      assert(deposit >= fee, this.generateFeeMessage(fee));
      this.increasePot(); // if it's your first time then you may win for the price of gas
    } else {
      this.players.set(signer);
    }

    this.lastPlayed = signer;

    if (Lottery.from(this.lottery).play()) {
      this.winner = signer;
      log(`${this.winner} won ${this.get_pot()}!`);

      if (this.winner.length > 0) {
        const promise = promiseBatchCreate(this.winner); // transfer payout to winner

        promiseBatchActionTransfer(promise, this.pot); // receive confirmation of payout before setting game to inactive

        const then = promiseThen(promise, currentAccountId(), "on_payout_complete", bytes(JSON.stringify({})), 0, XCC_GAS);
        promiseReturn(then);
      }
    } else {
      log(`${this.lastPlayed} did not win.  The pot is currently ${this.get_pot()}`);
    }
  }

  configure_lottery({
    chance
  }) {
    this.assertSelf();
    const lottery = Lottery.from(this.lottery);
    lottery.configure(chance);
    this.lottery = lottery;
    return true;
  }

  configure_fee({
    strategy
  }) {
    this.assertSelf();
    this.feeStrategy = new FeeStrategy(strategy);
    return true;
  }

  reset() {
    this.assertSelf();
    this.players.clear();
    this.winner = "";
    this.lastPlayed = "";
    this.pot = ONE_NEAR;
    this.active = true;
  } // this method is only here for the promise callback,
  // it should never be called directly


  on_payout_complete() {
    this.assertSelf();
    this.active = false;
    log("game over.");
  }

  randomStr() {
    return randomSeed();
  } // --------------------------------------------------------------------------
  // Private methods
  // --------------------------------------------------------------------------


  fee() {
    return FeeStrategy.from(this.feeStrategy).calculate(this.players.len(), ONE_NEAR);
  }

  increasePot() {
    this.pot = BigInt(this.pot) + BigInt(Number(attachedDeposit()));
  }

  generateFeeMessage(fee) {
    return `There are ${this.players.len()} players. Playing more than once now costs ${asNEAR(fee)} NEAR`;
  }

  assertSelf() {
    assert(predecessorAccountId() === currentAccountId(), "Only this contract may call this method");
  }

}, (_applyDecoratedDescriptor(_class2.prototype, "get_owner", [view], Object.getOwnPropertyDescriptor(_class2.prototype, "get_owner"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "get_winner", [view], Object.getOwnPropertyDescriptor(_class2.prototype, "get_winner"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "get_pot", [view], Object.getOwnPropertyDescriptor(_class2.prototype, "get_pot"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "get_fee", [view], Object.getOwnPropertyDescriptor(_class2.prototype, "get_fee"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "get_fee_strategy", [view], Object.getOwnPropertyDescriptor(_class2.prototype, "get_fee_strategy"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "get_has_played", [view], Object.getOwnPropertyDescriptor(_class2.prototype, "get_has_played"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "get_last_played", [view], Object.getOwnPropertyDescriptor(_class2.prototype, "get_last_played"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "get_active", [view], Object.getOwnPropertyDescriptor(_class2.prototype, "get_active"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "explain_fees", [view], Object.getOwnPropertyDescriptor(_class2.prototype, "explain_fees"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "explain_lottery", [view], Object.getOwnPropertyDescriptor(_class2.prototype, "explain_lottery"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "play", [call], Object.getOwnPropertyDescriptor(_class2.prototype, "play"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "configure_lottery", [call], Object.getOwnPropertyDescriptor(_class2.prototype, "configure_lottery"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "configure_fee", [call], Object.getOwnPropertyDescriptor(_class2.prototype, "configure_fee"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "reset", [call], Object.getOwnPropertyDescriptor(_class2.prototype, "reset"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "on_payout_complete", [call], Object.getOwnPropertyDescriptor(_class2.prototype, "on_payout_complete"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "randomStr", [view], Object.getOwnPropertyDescriptor(_class2.prototype, "randomStr"), _class2.prototype)), _class2)) || _class;
function init() {
  Contract._init();
}
function randomStr() {
  let _contract = Contract._get();

  _contract.deserialize();

  let args = _contract.constructor.deserializeArgs();

  let ret = _contract.randomStr(args);
  if (ret !== undefined) env.value_return(_contract.constructor.serializeReturn(ret));
}
function on_payout_complete() {
  let _contract = Contract._get();

  _contract.deserialize();

  let args = _contract.constructor.deserializeArgs();

  let ret = _contract.on_payout_complete(args);

  _contract.serialize();

  if (ret !== undefined) env.value_return(_contract.constructor.serializeReturn(ret));
}
function reset() {
  let _contract = Contract._get();

  _contract.deserialize();

  let args = _contract.constructor.deserializeArgs();

  let ret = _contract.reset(args);

  _contract.serialize();

  if (ret !== undefined) env.value_return(_contract.constructor.serializeReturn(ret));
}
function configure_fee() {
  let _contract = Contract._get();

  _contract.deserialize();

  let args = _contract.constructor.deserializeArgs();

  let ret = _contract.configure_fee(args);

  _contract.serialize();

  if (ret !== undefined) env.value_return(_contract.constructor.serializeReturn(ret));
}
function configure_lottery() {
  let _contract = Contract._get();

  _contract.deserialize();

  let args = _contract.constructor.deserializeArgs();

  let ret = _contract.configure_lottery(args);

  _contract.serialize();

  if (ret !== undefined) env.value_return(_contract.constructor.serializeReturn(ret));
}
function play() {
  let _contract = Contract._get();

  _contract.deserialize();

  let args = _contract.constructor.deserializeArgs();

  let ret = _contract.play(args);

  _contract.serialize();

  if (ret !== undefined) env.value_return(_contract.constructor.serializeReturn(ret));
}
function explain_lottery() {
  let _contract = Contract._get();

  _contract.deserialize();

  let args = _contract.constructor.deserializeArgs();

  let ret = _contract.explain_lottery(args);
  if (ret !== undefined) env.value_return(_contract.constructor.serializeReturn(ret));
}
function explain_fees() {
  let _contract = Contract._get();

  _contract.deserialize();

  let args = _contract.constructor.deserializeArgs();

  let ret = _contract.explain_fees(args);
  if (ret !== undefined) env.value_return(_contract.constructor.serializeReturn(ret));
}
function get_active() {
  let _contract = Contract._get();

  _contract.deserialize();

  let args = _contract.constructor.deserializeArgs();

  let ret = _contract.get_active(args);
  if (ret !== undefined) env.value_return(_contract.constructor.serializeReturn(ret));
}
function get_last_played() {
  let _contract = Contract._get();

  _contract.deserialize();

  let args = _contract.constructor.deserializeArgs();

  let ret = _contract.get_last_played(args);
  if (ret !== undefined) env.value_return(_contract.constructor.serializeReturn(ret));
}
function get_has_played() {
  let _contract = Contract._get();

  _contract.deserialize();

  let args = _contract.constructor.deserializeArgs();

  let ret = _contract.get_has_played(args);
  if (ret !== undefined) env.value_return(_contract.constructor.serializeReturn(ret));
}
function get_fee_strategy() {
  let _contract = Contract._get();

  _contract.deserialize();

  let args = _contract.constructor.deserializeArgs();

  let ret = _contract.get_fee_strategy(args);
  if (ret !== undefined) env.value_return(_contract.constructor.serializeReturn(ret));
}
function get_fee() {
  let _contract = Contract._get();

  _contract.deserialize();

  let args = _contract.constructor.deserializeArgs();

  let ret = _contract.get_fee(args);
  if (ret !== undefined) env.value_return(_contract.constructor.serializeReturn(ret));
}
function get_pot() {
  let _contract = Contract._get();

  _contract.deserialize();

  let args = _contract.constructor.deserializeArgs();

  let ret = _contract.get_pot(args);
  if (ret !== undefined) env.value_return(_contract.constructor.serializeReturn(ret));
}
function get_winner() {
  let _contract = Contract._get();

  _contract.deserialize();

  let args = _contract.constructor.deserializeArgs();

  let ret = _contract.get_winner(args);
  if (ret !== undefined) env.value_return(_contract.constructor.serializeReturn(ret));
}
function get_owner() {
  let _contract = Contract._get();

  _contract.deserialize();

  let args = _contract.constructor.deserializeArgs();

  let ret = _contract.get_owner(args);
  if (ret !== undefined) env.value_return(_contract.constructor.serializeReturn(ret));
}

export { Contract, configure_fee, configure_lottery, explain_fees, explain_lottery, get_active, get_fee, get_fee_strategy, get_has_played, get_last_played, get_owner, get_pot, get_winner, init, on_payout_complete, play, randomStr, reset };
//# sourceMappingURL=hello_near.js.map
