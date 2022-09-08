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

var PromiseResult;

(function (PromiseResult) {
  PromiseResult[PromiseResult["NotReady"] = 0] = "NotReady";
  PromiseResult[PromiseResult["Successful"] = 1] = "Successful";
  PromiseResult[PromiseResult["Failed"] = 2] = "Failed";
})(PromiseResult || (PromiseResult = {}));

var PromiseError;

(function (PromiseError) {
  PromiseError[PromiseError["Failed"] = 0] = "Failed";
  PromiseError[PromiseError["NotReady"] = 1] = "NotReady";
})(PromiseError || (PromiseError = {}));

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

/*! scure-base - MIT License (c) 2022 Paul Miller (paulmillr.com) */
function assertNumber(n) {
  if (!Number.isSafeInteger(n)) throw new Error(`Wrong integer: ${n}`);
}

function chain(...args) {
  const wrap = (a, b) => c => a(b(c));

  const encode = Array.from(args).reverse().reduce((acc, i) => acc ? wrap(acc, i.encode) : i.encode, undefined);
  const decode = args.reduce((acc, i) => acc ? wrap(acc, i.decode) : i.decode, undefined);
  return {
    encode,
    decode
  };
}

function alphabet(alphabet) {
  return {
    encode: digits => {
      if (!Array.isArray(digits) || digits.length && typeof digits[0] !== 'number') throw new Error('alphabet.encode input should be an array of numbers');
      return digits.map(i => {
        assertNumber(i);
        if (i < 0 || i >= alphabet.length) throw new Error(`Digit index outside alphabet: ${i} (alphabet: ${alphabet.length})`);
        return alphabet[i];
      });
    },
    decode: input => {
      if (!Array.isArray(input) || input.length && typeof input[0] !== 'string') throw new Error('alphabet.decode input should be array of strings');
      return input.map(letter => {
        if (typeof letter !== 'string') throw new Error(`alphabet.decode: not string element=${letter}`);
        const index = alphabet.indexOf(letter);
        if (index === -1) throw new Error(`Unknown letter: "${letter}". Allowed: ${alphabet}`);
        return index;
      });
    }
  };
}

function join(separator = '') {
  if (typeof separator !== 'string') throw new Error('join separator should be string');
  return {
    encode: from => {
      if (!Array.isArray(from) || from.length && typeof from[0] !== 'string') throw new Error('join.encode input should be array of strings');

      for (let i of from) if (typeof i !== 'string') throw new Error(`join.encode: non-string input=${i}`);

      return from.join(separator);
    },
    decode: to => {
      if (typeof to !== 'string') throw new Error('join.decode input should be string');
      return to.split(separator);
    }
  };
}

function padding(bits, chr = '=') {
  assertNumber(bits);
  if (typeof chr !== 'string') throw new Error('padding chr should be string');
  return {
    encode(data) {
      if (!Array.isArray(data) || data.length && typeof data[0] !== 'string') throw new Error('padding.encode input should be array of strings');

      for (let i of data) if (typeof i !== 'string') throw new Error(`padding.encode: non-string input=${i}`);

      while (data.length * bits % 8) data.push(chr);

      return data;
    },

    decode(input) {
      if (!Array.isArray(input) || input.length && typeof input[0] !== 'string') throw new Error('padding.encode input should be array of strings');

      for (let i of input) if (typeof i !== 'string') throw new Error(`padding.decode: non-string input=${i}`);

      let end = input.length;
      if (end * bits % 8) throw new Error('Invalid padding: string should have whole number of bytes');

      for (; end > 0 && input[end - 1] === chr; end--) {
        if (!((end - 1) * bits % 8)) throw new Error('Invalid padding: string has too much padding');
      }

      return input.slice(0, end);
    }

  };
}

function normalize(fn) {
  if (typeof fn !== 'function') throw new Error('normalize fn should be function');
  return {
    encode: from => from,
    decode: to => fn(to)
  };
}

function convertRadix(data, from, to) {
  if (from < 2) throw new Error(`convertRadix: wrong from=${from}, base cannot be less than 2`);
  if (to < 2) throw new Error(`convertRadix: wrong to=${to}, base cannot be less than 2`);
  if (!Array.isArray(data)) throw new Error('convertRadix: data should be array');
  if (!data.length) return [];
  let pos = 0;
  const res = [];
  const digits = Array.from(data);
  digits.forEach(d => {
    assertNumber(d);
    if (d < 0 || d >= from) throw new Error(`Wrong integer: ${d}`);
  });

  while (true) {
    let carry = 0;
    let done = true;

    for (let i = pos; i < digits.length; i++) {
      const digit = digits[i];
      const digitBase = from * carry + digit;

      if (!Number.isSafeInteger(digitBase) || from * carry / from !== carry || digitBase - digit !== from * carry) {
        throw new Error('convertRadix: carry overflow');
      }

      carry = digitBase % to;
      digits[i] = Math.floor(digitBase / to);
      if (!Number.isSafeInteger(digits[i]) || digits[i] * to + carry !== digitBase) throw new Error('convertRadix: carry overflow');
      if (!done) continue;else if (!digits[i]) pos = i;else done = false;
    }

    res.push(carry);
    if (done) break;
  }

  for (let i = 0; i < data.length - 1 && data[i] === 0; i++) res.push(0);

  return res.reverse();
}

const gcd = (a, b) => !b ? a : gcd(b, a % b);

const radix2carry = (from, to) => from + (to - gcd(from, to));

function convertRadix2(data, from, to, padding) {
  if (!Array.isArray(data)) throw new Error('convertRadix2: data should be array');
  if (from <= 0 || from > 32) throw new Error(`convertRadix2: wrong from=${from}`);
  if (to <= 0 || to > 32) throw new Error(`convertRadix2: wrong to=${to}`);

  if (radix2carry(from, to) > 32) {
    throw new Error(`convertRadix2: carry overflow from=${from} to=${to} carryBits=${radix2carry(from, to)}`);
  }

  let carry = 0;
  let pos = 0;
  const mask = 2 ** to - 1;
  const res = [];

  for (const n of data) {
    assertNumber(n);
    if (n >= 2 ** from) throw new Error(`convertRadix2: invalid data word=${n} from=${from}`);
    carry = carry << from | n;
    if (pos + from > 32) throw new Error(`convertRadix2: carry overflow pos=${pos} from=${from}`);
    pos += from;

    for (; pos >= to; pos -= to) res.push((carry >> pos - to & mask) >>> 0);

    carry &= 2 ** pos - 1;
  }

  carry = carry << to - pos & mask;
  if (!padding && pos >= from) throw new Error('Excess padding');
  if (!padding && carry) throw new Error(`Non-zero padding: ${carry}`);
  if (padding && pos > 0) res.push(carry >>> 0);
  return res;
}

function radix(num) {
  assertNumber(num);
  return {
    encode: bytes => {
      if (!(bytes instanceof Uint8Array)) throw new Error('radix.encode input should be Uint8Array');
      return convertRadix(Array.from(bytes), 2 ** 8, num);
    },
    decode: digits => {
      if (!Array.isArray(digits) || digits.length && typeof digits[0] !== 'number') throw new Error('radix.decode input should be array of strings');
      return Uint8Array.from(convertRadix(digits, num, 2 ** 8));
    }
  };
}

function radix2(bits, revPadding = false) {
  assertNumber(bits);
  if (bits <= 0 || bits > 32) throw new Error('radix2: bits should be in (0..32]');
  if (radix2carry(8, bits) > 32 || radix2carry(bits, 8) > 32) throw new Error('radix2: carry overflow');
  return {
    encode: bytes => {
      if (!(bytes instanceof Uint8Array)) throw new Error('radix2.encode input should be Uint8Array');
      return convertRadix2(Array.from(bytes), 8, bits, !revPadding);
    },
    decode: digits => {
      if (!Array.isArray(digits) || digits.length && typeof digits[0] !== 'number') throw new Error('radix2.decode input should be array of strings');
      return Uint8Array.from(convertRadix2(digits, bits, 8, revPadding));
    }
  };
}

function unsafeWrapper(fn) {
  if (typeof fn !== 'function') throw new Error('unsafeWrapper fn should be function');
  return function (...args) {
    try {
      return fn.apply(null, args);
    } catch (e) {}
  };
}
const base16 = chain(radix2(4), alphabet('0123456789ABCDEF'), join(''));
const base32 = chain(radix2(5), alphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'), padding(5), join(''));
chain(radix2(5), alphabet('0123456789ABCDEFGHIJKLMNOPQRSTUV'), padding(5), join(''));
chain(radix2(5), alphabet('0123456789ABCDEFGHJKMNPQRSTVWXYZ'), join(''), normalize(s => s.toUpperCase().replace(/O/g, '0').replace(/[IL]/g, '1')));
const base64 = chain(radix2(6), alphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'), padding(6), join(''));
const base64url = chain(radix2(6), alphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'), padding(6), join(''));

const genBase58 = abc => chain(radix(58), alphabet(abc), join(''));

const base58 = genBase58('123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz');
genBase58('123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ');
genBase58('rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz');
const XMR_BLOCK_LEN = [0, 2, 3, 5, 6, 7, 9, 10, 11];
const base58xmr = {
  encode(data) {
    let res = '';

    for (let i = 0; i < data.length; i += 8) {
      const block = data.subarray(i, i + 8);
      res += base58.encode(block).padStart(XMR_BLOCK_LEN[block.length], '1');
    }

    return res;
  },

  decode(str) {
    let res = [];

    for (let i = 0; i < str.length; i += 11) {
      const slice = str.slice(i, i + 11);
      const blockLen = XMR_BLOCK_LEN.indexOf(slice.length);
      const block = base58.decode(slice);

      for (let j = 0; j < block.length - blockLen; j++) {
        if (block[j] !== 0) throw new Error('base58xmr: wrong padding');
      }

      res = res.concat(Array.from(block.slice(block.length - blockLen)));
    }

    return Uint8Array.from(res);
  }

};
const BECH_ALPHABET = chain(alphabet('qpzry9x8gf2tvdw0s3jn54khce6mua7l'), join(''));
const POLYMOD_GENERATORS = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];

function bech32Polymod(pre) {
  const b = pre >> 25;
  let chk = (pre & 0x1ffffff) << 5;

  for (let i = 0; i < POLYMOD_GENERATORS.length; i++) {
    if ((b >> i & 1) === 1) chk ^= POLYMOD_GENERATORS[i];
  }

  return chk;
}

function bechChecksum(prefix, words, encodingConst = 1) {
  const len = prefix.length;
  let chk = 1;

  for (let i = 0; i < len; i++) {
    const c = prefix.charCodeAt(i);
    if (c < 33 || c > 126) throw new Error(`Invalid prefix (${prefix})`);
    chk = bech32Polymod(chk) ^ c >> 5;
  }

  chk = bech32Polymod(chk);

  for (let i = 0; i < len; i++) chk = bech32Polymod(chk) ^ prefix.charCodeAt(i) & 0x1f;

  for (let v of words) chk = bech32Polymod(chk) ^ v;

  for (let i = 0; i < 6; i++) chk = bech32Polymod(chk);

  chk ^= encodingConst;
  return BECH_ALPHABET.encode(convertRadix2([chk % 2 ** 30], 30, 5, false));
}

function genBech32(encoding) {
  const ENCODING_CONST = encoding === 'bech32' ? 1 : 0x2bc830a3;

  const _words = radix2(5);

  const fromWords = _words.decode;
  const toWords = _words.encode;
  const fromWordsUnsafe = unsafeWrapper(fromWords);

  function encode(prefix, words, limit = 90) {
    if (typeof prefix !== 'string') throw new Error(`bech32.encode prefix should be string, not ${typeof prefix}`);
    if (!Array.isArray(words) || words.length && typeof words[0] !== 'number') throw new Error(`bech32.encode words should be array of numbers, not ${typeof words}`);
    const actualLength = prefix.length + 7 + words.length;
    if (limit !== false && actualLength > limit) throw new TypeError(`Length ${actualLength} exceeds limit ${limit}`);
    prefix = prefix.toLowerCase();
    return `${prefix}1${BECH_ALPHABET.encode(words)}${bechChecksum(prefix, words, ENCODING_CONST)}`;
  }

  function decode(str, limit = 90) {
    if (typeof str !== 'string') throw new Error(`bech32.decode input should be string, not ${typeof str}`);
    if (str.length < 8 || limit !== false && str.length > limit) throw new TypeError(`Wrong string length: ${str.length} (${str}). Expected (8..${limit})`);
    const lowered = str.toLowerCase();
    if (str !== lowered && str !== str.toUpperCase()) throw new Error(`String must be lowercase or uppercase`);
    str = lowered;
    const sepIndex = str.lastIndexOf('1');
    if (sepIndex === 0 || sepIndex === -1) throw new Error(`Letter "1" must be present between prefix and data only`);
    const prefix = str.slice(0, sepIndex);

    const _words = str.slice(sepIndex + 1);

    if (_words.length < 6) throw new Error('Data must be at least 6 characters long');
    const words = BECH_ALPHABET.decode(_words).slice(0, -6);
    const sum = bechChecksum(prefix, words, ENCODING_CONST);
    if (!_words.endsWith(sum)) throw new Error(`Invalid checksum in ${str}: expected "${sum}"`);
    return {
      prefix,
      words
    };
  }

  const decodeUnsafe = unsafeWrapper(decode);

  function decodeToBytes(str) {
    const {
      prefix,
      words
    } = decode(str, false);
    return {
      prefix,
      words,
      bytes: fromWords(words)
    };
  }

  return {
    encode,
    decode,
    decodeToBytes,
    decodeUnsafe,
    fromWords,
    fromWordsUnsafe,
    toWords
  };
}

genBech32('bech32');
genBech32('bech32m');
const utf8 = {
  encode: data => new TextDecoder().decode(data),
  decode: str => new TextEncoder().encode(str)
};
const hex = chain(radix2(4), alphabet('0123456789abcdef'), join(''), normalize(s => {
  if (typeof s !== 'string' || s.length % 2) throw new TypeError(`hex.decode: expected string, got ${typeof s} with length ${s.length}`);
  return s.toLowerCase();
}));
const CODERS = {
  utf8,
  hex,
  base16,
  base32,
  base64,
  base64url,
  base58,
  base58xmr
};
`Invalid encoding type. Available types: ${Object.keys(CODERS).join(', ')}`;

var CurveType;

(function (CurveType) {
  CurveType[CurveType["ED25519"] = 0] = "ED25519";
  CurveType[CurveType["SECP256K1"] = 1] = "SECP256K1";
})(CurveType || (CurveType = {}));

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
function promiseAnd(...promiseIndex) {
  return env.promise_and(...promiseIndex);
}
function promiseBatchCreate(accountId) {
  return env.promise_batch_create(accountId);
}
function promiseBatchThen(promiseIndex, accountId) {
  return env.promise_batch_then(promiseIndex, accountId);
}
function promiseBatchActionCreateAccount(promiseIndex) {
  env.promise_batch_action_create_account(promiseIndex);
}
function promiseBatchActionDeployContract(promiseIndex, code) {
  env.promise_batch_action_deploy_contract(promiseIndex, code);
}
function promiseBatchActionFunctionCall(promiseIndex, methodName, args, amount, gas) {
  env.promise_batch_action_function_call(promiseIndex, methodName, args, amount, gas);
}
function promiseBatchActionTransfer(promiseIndex, amount) {
  env.promise_batch_action_transfer(promiseIndex, amount);
}
function promiseBatchActionStake(promiseIndex, amount, publicKey) {
  env.promise_batch_action_stake(promiseIndex, amount, publicKey);
}
function promiseBatchActionAddKeyWithFullAccess(promiseIndex, publicKey, nonce) {
  env.promise_batch_action_add_key_with_full_access(promiseIndex, publicKey, nonce);
}
function promiseBatchActionAddKeyWithFunctionCall(promiseIndex, publicKey, nonce, allowance, receiverId, methodNames) {
  env.promise_batch_action_add_key_with_function_call(promiseIndex, publicKey, nonce, allowance, receiverId, methodNames);
}
function promiseBatchActionDeleteKey(promiseIndex, publicKey) {
  env.promise_batch_action_delete_key(promiseIndex, publicKey);
}
function promiseBatchActionDeleteAccount(promiseIndex, beneficiaryId) {
  env.promise_batch_action_delete_account(promiseIndex, beneficiaryId);
}
function promiseBatchActionFunctionCallWeight(promiseIndex, methodName, args, amount, gas, weight) {
  env.promise_batch_action_function_call_weight(promiseIndex, methodName, args, amount, gas, weight);
}
function promiseReturn(promiseIdx) {
  log('promiseReturn');
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

function initialize({}) {
  return function (target, key, descriptor) {};
}
function call({
  privateFunction = false,
  payableFunction = false
}) {
  return function (target, key, descriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args) {
      if (privateFunction && predecessorAccountId() !== currentAccountId()) {
        throw Error("Function is private");
      }

      if (!payableFunction && attachedDeposit() > BigInt(0)) {
        throw Error("Function is not payable");
      }

      return originalMethod.apply(this, args);
    };
  };
}
function view({}) {
  return function (target, key, descriptor) {};
}
function NearBindgen({
  requireInit = false
}) {
  return target => {
    return class extends target {
      static _create() {
        return new target();
      }

      static _getState() {
        const rawState = storageRead("STATE");
        return rawState ? this._deserialize(rawState) : null;
      }

      static _saveToStorage(obj) {
        storageWrite("STATE", this._serialize(obj));
      }

      static _getArgs() {
        return JSON.parse(input() || "{}");
      }

      static _serialize(value) {
        return JSON.stringify(value);
      }

      static _deserialize(value) {
        return JSON.parse(value);
      }

      static _reconstruct(classObject, plainObject) {
        for (const item in classObject) {
          if (classObject[item].constructor?.deserialize !== undefined) {
            classObject[item] = classObject[item].constructor.deserialize(plainObject[item]);
          } else {
            classObject[item] = plainObject[item];
          }
        }

        return classObject;
      }

      static _requireInit() {
        return requireInit;
      }

    };
  };
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
    if (this.current < this.vector.length) {
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

function serializeIndex(index) {
  let data = new Uint32Array([index]);
  let array = new Uint8Array(data.buffer);
  return u8ArrayToBytes(array);
}

function deserializeIndex(rawIndex) {
  let array = bytesToU8Array(rawIndex);
  let data = new Uint32Array(array.buffer);
  return data[0];
}

class UnorderedSet {
  constructor(prefix) {
    this.prefix = prefix;
    this.elementIndexPrefix = prefix + "i";
    let elementsPrefix = prefix + "e";
    this.elements = new Vector(elementsPrefix);
  }

  get length() {
    return this.elements.length;
  } // noop, called by deserialize


  set length(_l) {}

  isEmpty() {
    return this.elements.isEmpty();
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
      let nextIndex = this.length;
      let nextIndexRaw = serializeIndex(nextIndex);
      storageWrite(indexLookup, nextIndexRaw);
      this.elements.push(element);
      return true;
    }
  }

  remove(element) {
    let indexLookup = this.elementIndexPrefix + JSON.stringify(element);
    let indexRaw = storageRead(indexLookup);

    if (indexRaw) {
      if (this.length == 1) {
        // If there is only one element then swap remove simply removes it without
        // swapping with the last element.
        storageRemove(indexLookup);
      } else {
        // If there is more than one element then swap remove swaps it with the last
        // element.
        let lastElement = this.elements.get(this.length - 1);

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

      let index = deserializeIndex(indexRaw);
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

class PromiseAction {}
class CreateAccount extends PromiseAction {
  add(promise_index) {
    promiseBatchActionCreateAccount(promise_index);
  }

}
class DeployContract extends PromiseAction {
  constructor(code) {
    super();
    this.code = code;
  }

  add(promise_index) {
    promiseBatchActionDeployContract(promise_index, this.code);
  }

}
class FunctionCall extends PromiseAction {
  constructor(function_name, args, amount, gas) {
    super();
    this.function_name = function_name;
    this.args = args;
    this.amount = amount;
    this.gas = gas;
  }

  add(promise_index) {
    promiseBatchActionFunctionCall(promise_index, this.function_name, this.args, this.amount, this.gas);
  }

}
class FunctionCallWeight extends PromiseAction {
  constructor(function_name, args, amount, gas, weight) {
    super();
    this.function_name = function_name;
    this.args = args;
    this.amount = amount;
    this.gas = gas;
    this.weight = weight;
  }

  add(promise_index) {
    promiseBatchActionFunctionCallWeight(promise_index, this.function_name, this.args, this.amount, this.gas, this.weight);
  }

}
class Transfer extends PromiseAction {
  constructor(amount) {
    super();
    this.amount = amount;
  }

  add(promise_index) {
    promiseBatchActionTransfer(promise_index, this.amount);
  }

}
class Stake extends PromiseAction {
  constructor(amount, public_key) {
    super();
    this.amount = amount;
    this.public_key = public_key;
  }

  add(promise_index) {
    promiseBatchActionStake(promise_index, this.amount, this.public_key.data);
  }

}
class AddFullAccessKey extends PromiseAction {
  constructor(public_key, nonce) {
    super();
    this.public_key = public_key;
    this.nonce = nonce;
  }

  add(promise_index) {
    promiseBatchActionAddKeyWithFullAccess(promise_index, this.public_key.data, this.nonce);
  }

}
class AddAccessKey extends PromiseAction {
  constructor(public_key, allowance, receiver_id, function_names, nonce) {
    super();
    this.public_key = public_key;
    this.allowance = allowance;
    this.receiver_id = receiver_id;
    this.function_names = function_names;
    this.nonce = nonce;
  }

  add(promise_index) {
    promiseBatchActionAddKeyWithFunctionCall(promise_index, this.public_key.data, this.nonce, this.allowance, this.receiver_id, this.function_names);
  }

}
class DeleteKey extends PromiseAction {
  constructor(public_key) {
    super();
    this.public_key = public_key;
  }

  add(promise_index) {
    promiseBatchActionDeleteKey(promise_index, this.public_key.data);
  }

}
class DeleteAccount extends PromiseAction {
  constructor(beneficiary_id) {
    super();
    this.beneficiary_id = beneficiary_id;
  }

  add(promise_index) {
    promiseBatchActionDeleteAccount(promise_index, this.beneficiary_id);
  }

}

class PromiseSingle {
  constructor(account_id, actions, after, promise_index) {
    this.account_id = account_id;
    this.actions = actions;
    this.after = after;
    this.promise_index = promise_index;
  }

  constructRecursively() {
    if (this.promise_index !== null) {
      return this.promise_index;
    }

    let promise_index;

    if (this.after) {
      promise_index = promiseBatchThen(this.after.constructRecursively(), this.account_id);
    } else {
      promise_index = promiseBatchCreate(this.account_id);
    }

    for (let action of this.actions) {
      action.add(promise_index);
    }

    this.promise_index = promise_index;
    return promise_index;
  }

}

class PromiseJoint {
  constructor(promise_a, promise_b, promise_index) {
    this.promise_a = promise_a;
    this.promise_b = promise_b;
    this.promise_index = promise_index;
  }

  constructRecursively() {
    if (this.promise_index !== null) {
      return this.promise_index;
    }

    let res = promiseAnd(BigInt(this.promise_a.constructRecursively()), BigInt(this.promise_b.constructRecursively()));
    this.promise_index = res;
    return res;
  }

}
class NearPromise {
  constructor(subtype, should_return) {
    this.subtype = subtype;
    this.should_return = should_return;
  }

  static new(account_id) {
    let subtype = new PromiseSingle(account_id, [], null, null);
    let ret = new NearPromise(subtype, false);
    return ret;
  }

  add_action(action) {
    if (this.subtype instanceof PromiseJoint) {
      throw new Error("Cannot add action to a joint promise.");
    } else {
      this.subtype.actions.push(action);
    }

    return this;
  }

  createAccount() {
    return this.add_action(new CreateAccount());
  }

  deployContract(code) {
    return this.add_action(new DeployContract(code));
  }

  functionCall(function_name, args, amount, gas) {
    return this.add_action(new FunctionCall(function_name, args, amount, gas));
  }

  functionCallWeight(function_name, args, amount, gas, weight) {
    return this.add_action(new FunctionCallWeight(function_name, args, amount, gas, weight));
  }

  transfer(amount) {
    return this.add_action(new Transfer(amount));
  }

  stake(amount, public_key) {
    return this.add_action(new Stake(amount, public_key));
  }

  addFullAccessKey(public_key) {
    return this.addFullAccessKeyWithNonce(public_key, 0n);
  }

  addFullAccessKeyWithNonce(public_key, nonce) {
    return this.add_action(new AddFullAccessKey(public_key, nonce));
  }

  addAccessKey(public_key, allowance, receiver_id, method_names) {
    return this.addAccessKeyWithNonce(public_key, allowance, receiver_id, method_names, 0n);
  }

  addAccessKeyWithNonce(public_key, allowance, receiver_id, method_names, nonce) {
    return this.add_action(new AddAccessKey(public_key, allowance, receiver_id, method_names, nonce));
  }

  deleteKey(public_key) {
    return this.add_action(new DeleteKey(public_key));
  }

  deleteAccount(beneficiary_id) {
    return this.add_action(new DeleteAccount(beneficiary_id));
  }

  and(other) {
    let subtype = new PromiseJoint(this, other, null);
    let ret = new NearPromise(subtype, false);
    return ret;
  }

  then(other) {
    if (other.subtype instanceof PromiseSingle) {
      if (other.subtype.after !== null) {
        throw new Error("Cannot callback promise which is already scheduled after another");
      }

      other.subtype.after = this;
    } else {
      throw new Error("Cannot callback joint promise.");
    }

    return other;
  }

  asReturn() {
    this.should_return = true;
    return this;
  }

  constructRecursively() {
    let res = this.subtype.constructRecursively();

    if (this.should_return) {
      promiseReturn(res);
    }

    return res;
  } // Called by NearBindgen, when return object is a NearPromise instance.


  onReturn() {
    this.asReturn().constructRecursively();
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
        throw new Error("Unexpected StrategyType encountered");
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

var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _class, _class2;

BigInt.prototype["toJSON"] = function () {
  return this.toString();
}; // The @NearBindgen decorator allows this code to compile to Base64.


let Contract = (_dec = NearBindgen({
  requireInit: true
}), _dec2 = initialize({}), _dec3 = view({}), _dec4 = view({}), _dec5 = view({}), _dec6 = view({}), _dec7 = view({}), _dec8 = view({}), _dec9 = view({}), _dec10 = view({}), _dec11 = view({}), _dec12 = view({}), _dec13 = call({}), _dec14 = call({
  privateFunction: true
}), _dec15 = call({
  privateFunction: true
}), _dec16 = call({
  privateFunction: true
}), _dec17 = call({
  privateFunction: true
}), _dec(_class = (_class2 = class Contract {
  owner = "";
  winner = "";
  lastPlayed = "";
  active = true;
  pot = ONE_NEAR;
  lottery = new Lottery();
  feeStrategy = new FeeStrategy();
  players = new UnorderedSet("p");

  init({
    owner
  }) {
    this.owner = owner;
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
    const deposit = attachedDeposit();
    const played = this.players.contains(signer); // if you've played before then you have to pay extra

    if (played) {
      const fee = this.fee();
      assert(deposit >= fee, this.generateFeeMessage(fee));
      this.pot = BigInt(this.pot) + deposit;
    } else {
      // if it's your first time then you may win for the price of gas
      this.players.set(signer);
    }

    this.lastPlayed = signer;

    if (this.playLottery()) {
      this.winner = signer;
      log(`${this.winner} won ${this.get_pot()}!`);

      if (this.winner.length > 0) {
        this.payout();
      }
    } else {
      log(`${this.lastPlayed} did not win.  The pot is currently ${this.get_pot()}`);
    }
  }

  configure_lottery({
    chance
  }) {
    const lottery = Lottery.from(this.lottery);
    lottery.configure(chance);
    this.lottery = lottery;
    return true;
  }

  configure_fee({
    strategy
  }) {
    this.feeStrategy = new FeeStrategy(strategy);
    return true;
  }

  reset() {
    this.players.clear();
    this.winner = "";
    this.lastPlayed = "";
    this.pot = ONE_NEAR;
    this.active = true;
  } // this method is only here for the promise callback,
  // it should never be called directly


  on_payout_complete() {
    this.active = false;
    log("game over.");
  } // --------------------------------------------------------------------------
  // Private methods
  // --------------------------------------------------------------------------


  fee() {
    return FeeStrategy.from(this.feeStrategy).calculate(this.players.length, ONE_NEAR);
  }

  generateFeeMessage(fee) {
    return `There are ${this.players.length} players. Playing more than once now costs ${asNEAR(fee)} NEAR`;
  }

  playLottery() {
    return Lottery.from(this.lottery).play();
  }

  payout() {
    NearPromise.new(this.winner).transfer(this.pot) // transfer payout to winner
    .then( // receive confirmation of payout before setting game to inactive
    NearPromise.new(currentAccountId()).functionCall("on_payout_complete", bytes(JSON.stringify({})), 0n, XCC_GAS)).onReturn();
  }

}, (_applyDecoratedDescriptor(_class2.prototype, "init", [_dec2], Object.getOwnPropertyDescriptor(_class2.prototype, "init"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "get_owner", [_dec3], Object.getOwnPropertyDescriptor(_class2.prototype, "get_owner"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "get_winner", [_dec4], Object.getOwnPropertyDescriptor(_class2.prototype, "get_winner"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "get_pot", [_dec5], Object.getOwnPropertyDescriptor(_class2.prototype, "get_pot"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "get_fee", [_dec6], Object.getOwnPropertyDescriptor(_class2.prototype, "get_fee"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "get_fee_strategy", [_dec7], Object.getOwnPropertyDescriptor(_class2.prototype, "get_fee_strategy"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "get_has_played", [_dec8], Object.getOwnPropertyDescriptor(_class2.prototype, "get_has_played"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "get_last_played", [_dec9], Object.getOwnPropertyDescriptor(_class2.prototype, "get_last_played"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "get_active", [_dec10], Object.getOwnPropertyDescriptor(_class2.prototype, "get_active"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "explain_fees", [_dec11], Object.getOwnPropertyDescriptor(_class2.prototype, "explain_fees"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "explain_lottery", [_dec12], Object.getOwnPropertyDescriptor(_class2.prototype, "explain_lottery"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "play", [_dec13], Object.getOwnPropertyDescriptor(_class2.prototype, "play"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "configure_lottery", [_dec14], Object.getOwnPropertyDescriptor(_class2.prototype, "configure_lottery"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "configure_fee", [_dec15], Object.getOwnPropertyDescriptor(_class2.prototype, "configure_fee"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "reset", [_dec16], Object.getOwnPropertyDescriptor(_class2.prototype, "reset"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "on_payout_complete", [_dec17], Object.getOwnPropertyDescriptor(_class2.prototype, "on_payout_complete"), _class2.prototype)), _class2)) || _class);
function on_payout_complete() {
  let _state = Contract._getState();

  if (!_state && Contract._requireInit()) {
    throw new Error("Contract must be initialized");
  }

  let _contract = Contract._create();

  if (_state) {
    Contract._reconstruct(_contract, _state);
  }

  let _args = Contract._getArgs();

  let _result = _contract.on_payout_complete(_args);

  Contract._saveToStorage(_contract);

  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(Contract._serialize(_result));
}
function reset() {
  let _state = Contract._getState();

  if (!_state && Contract._requireInit()) {
    throw new Error("Contract must be initialized");
  }

  let _contract = Contract._create();

  if (_state) {
    Contract._reconstruct(_contract, _state);
  }

  let _args = Contract._getArgs();

  let _result = _contract.reset(_args);

  Contract._saveToStorage(_contract);

  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(Contract._serialize(_result));
}
function configure_fee() {
  let _state = Contract._getState();

  if (!_state && Contract._requireInit()) {
    throw new Error("Contract must be initialized");
  }

  let _contract = Contract._create();

  if (_state) {
    Contract._reconstruct(_contract, _state);
  }

  let _args = Contract._getArgs();

  let _result = _contract.configure_fee(_args);

  Contract._saveToStorage(_contract);

  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(Contract._serialize(_result));
}
function configure_lottery() {
  let _state = Contract._getState();

  if (!_state && Contract._requireInit()) {
    throw new Error("Contract must be initialized");
  }

  let _contract = Contract._create();

  if (_state) {
    Contract._reconstruct(_contract, _state);
  }

  let _args = Contract._getArgs();

  let _result = _contract.configure_lottery(_args);

  Contract._saveToStorage(_contract);

  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(Contract._serialize(_result));
}
function play() {
  let _state = Contract._getState();

  if (!_state && Contract._requireInit()) {
    throw new Error("Contract must be initialized");
  }

  let _contract = Contract._create();

  if (_state) {
    Contract._reconstruct(_contract, _state);
  }

  let _args = Contract._getArgs();

  let _result = _contract.play(_args);

  Contract._saveToStorage(_contract);

  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(Contract._serialize(_result));
}
function explain_lottery() {
  let _state = Contract._getState();

  if (!_state && Contract._requireInit()) {
    throw new Error("Contract must be initialized");
  }

  let _contract = Contract._create();

  if (_state) {
    Contract._reconstruct(_contract, _state);
  }

  let _args = Contract._getArgs();

  let _result = _contract.explain_lottery(_args);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(Contract._serialize(_result));
}
function explain_fees() {
  let _state = Contract._getState();

  if (!_state && Contract._requireInit()) {
    throw new Error("Contract must be initialized");
  }

  let _contract = Contract._create();

  if (_state) {
    Contract._reconstruct(_contract, _state);
  }

  let _args = Contract._getArgs();

  let _result = _contract.explain_fees(_args);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(Contract._serialize(_result));
}
function get_active() {
  let _state = Contract._getState();

  if (!_state && Contract._requireInit()) {
    throw new Error("Contract must be initialized");
  }

  let _contract = Contract._create();

  if (_state) {
    Contract._reconstruct(_contract, _state);
  }

  let _args = Contract._getArgs();

  let _result = _contract.get_active(_args);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(Contract._serialize(_result));
}
function get_last_played() {
  let _state = Contract._getState();

  if (!_state && Contract._requireInit()) {
    throw new Error("Contract must be initialized");
  }

  let _contract = Contract._create();

  if (_state) {
    Contract._reconstruct(_contract, _state);
  }

  let _args = Contract._getArgs();

  let _result = _contract.get_last_played(_args);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(Contract._serialize(_result));
}
function get_has_played() {
  let _state = Contract._getState();

  if (!_state && Contract._requireInit()) {
    throw new Error("Contract must be initialized");
  }

  let _contract = Contract._create();

  if (_state) {
    Contract._reconstruct(_contract, _state);
  }

  let _args = Contract._getArgs();

  let _result = _contract.get_has_played(_args);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(Contract._serialize(_result));
}
function get_fee_strategy() {
  let _state = Contract._getState();

  if (!_state && Contract._requireInit()) {
    throw new Error("Contract must be initialized");
  }

  let _contract = Contract._create();

  if (_state) {
    Contract._reconstruct(_contract, _state);
  }

  let _args = Contract._getArgs();

  let _result = _contract.get_fee_strategy(_args);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(Contract._serialize(_result));
}
function get_fee() {
  let _state = Contract._getState();

  if (!_state && Contract._requireInit()) {
    throw new Error("Contract must be initialized");
  }

  let _contract = Contract._create();

  if (_state) {
    Contract._reconstruct(_contract, _state);
  }

  let _args = Contract._getArgs();

  let _result = _contract.get_fee(_args);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(Contract._serialize(_result));
}
function get_pot() {
  let _state = Contract._getState();

  if (!_state && Contract._requireInit()) {
    throw new Error("Contract must be initialized");
  }

  let _contract = Contract._create();

  if (_state) {
    Contract._reconstruct(_contract, _state);
  }

  let _args = Contract._getArgs();

  let _result = _contract.get_pot(_args);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(Contract._serialize(_result));
}
function get_winner() {
  let _state = Contract._getState();

  if (!_state && Contract._requireInit()) {
    throw new Error("Contract must be initialized");
  }

  let _contract = Contract._create();

  if (_state) {
    Contract._reconstruct(_contract, _state);
  }

  let _args = Contract._getArgs();

  let _result = _contract.get_winner(_args);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(Contract._serialize(_result));
}
function get_owner() {
  let _state = Contract._getState();

  if (!_state && Contract._requireInit()) {
    throw new Error("Contract must be initialized");
  }

  let _contract = Contract._create();

  if (_state) {
    Contract._reconstruct(_contract, _state);
  }

  let _args = Contract._getArgs();

  let _result = _contract.get_owner(_args);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(Contract._serialize(_result));
}
function init() {
  let _state = Contract._getState();

  if (_state) throw new Error("Contract already initialized");

  let _contract = Contract._create();

  let _args = Contract._getArgs();

  let _result = _contract.init(_args);

  Contract._saveToStorage(_contract);

  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(Contract._serialize(_result));
}

export { Contract, configure_fee, configure_lottery, explain_fees, explain_lottery, get_active, get_fee, get_fee_strategy, get_has_played, get_last_played, get_owner, get_pot, get_winner, init, on_payout_complete, play, reset };
//# sourceMappingURL=hello_near.js.map
