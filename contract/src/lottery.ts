import { assert, near } from "near-sdk-js";
import { random } from "./utils";

export class Lottery {
  static from(lottery: Lottery): Lottery {
    return new Lottery(lottery.chance);
  }

  constructor(private chance: number = 0.2) {}

  explain(): string {
    return `Players have a ${(this.chance * 100).toFixed(
      1
    )}% chance of winning.`;
  }

  play(): boolean {
    const height = Number(near.blockHeight());
    const roll = random(height);

    near.log("roll: " + roll.toString());

    return roll <= height * this.chance;
  }

  configure(chance: number): void {
    assert(
      chance >= 0.000000001 && chance <= 1,
      "Chance must be within range (0..1]"
    );

    this.chance = chance;
    near.log(this.explain());
  }
}
