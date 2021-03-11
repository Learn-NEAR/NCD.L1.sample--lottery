import { logging, RNG } from "near-sdk-as";

@nearBindgen
export class Lottery {
  private chance: f64 = 0.20

  explain(): string {
    return "Players have a " + (this.chance * 100).toString() + "% chance of winning.";
  }

  play(): bool {
    const rng = new RNG<u32>(1, u32.MAX_VALUE);
    const roll = rng.next();
    logging.log("roll: " + roll.toString());
    return roll <= <u32>(<f64>u32.MAX_VALUE * this.chance);
  }

  configure(chance: f64): void {
    assert(chance >= 0.000000001 && chance <= 1, "Chance must be within range (0..1]");
    this.chance = chance;
    logging.log(this.explain());
  }
}
