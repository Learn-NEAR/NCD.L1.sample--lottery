import { logging, RNG } from "near-sdk-as";

@nearBindgen
export class Lottery {
  private chance: f32 = 0.20

  explain(): string {
    return "Players have a " + (this.chance * 100).toString() + "% chance of winning.";
  }

  play(): bool {
    const rng = new RNG<u16>(1, u16.MAX_VALUE);
    const roll = rng.next();
    logging.log("roll: " + roll.toString());
    return roll <= <u16>(<f32>u16.MAX_VALUE * this.chance);
  }

  configure(chance: f32): void {
    assert(chance > 0 && chance <= 1, "Chance must be within range (0..1]");
    this.chance = chance;
    logging.log(this.explain());
  }
}
