import { near } from "near-sdk-js";

export const ONE_NEAR: bigint = BigInt(10e24);
export const TGAS: bigint = BigInt(10e14);
export const XCC_GAS: bigint = BigInt(5) * TGAS;

export function asNEAR(value: bigint): string {
  return `${BigInt(Number(value)) / ONE_NEAR}`;
}

export function random(bound: number): number {
  const sum = Array.from(near.randomSeed()).reduce(
    (sum, current) => sum + current.charCodeAt(0),
    0
  );

  return sum % bound;
}
