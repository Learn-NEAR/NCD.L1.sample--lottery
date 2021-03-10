import { logging, RNG } from "near-sdk-as";

@nearBindgen
export class Lottery {
  private min: u32 = 1;
  private max: u32 = 100;
  private chance: f32 = 0.20

  explain(): string {
    return "Players have a " + (this.chance * 100).toString() + "% chance of winning.";
  }

  play(): bool {
    const rng = new RNG<u32>(this.min, this.max);
    const roll: f32 = <f32>rng.next();
    logging.log("roll: " + roll.toString());
    return roll <= (<f32>this.max * this.chance);
  }

  configure(chance: f32, min: u32, max: u32): void {
    assert(chance > 0 && chance <= 1, "Chance must be within range (0..1]");
    assert(min > u32.MIN_VALUE, "Minimum value must be greater than " + u32.MIN_VALUE.toString());
    assert(max < u32.MAX_VALUE, "Maximum value must be less than " + u32.MAX_VALUE.toString());
    this.chance = chance;
    this.min = min;
    this.max = max;
    logging.log(this.explain());
  }
}
