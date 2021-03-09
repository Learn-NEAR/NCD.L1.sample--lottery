import { logging, RNG } from "near-sdk-as";

@nearBindgen
export class Lottery {
  static min: u8 = 1;
  static max: u8 = 100;
  static chance: f32 = 0.20; // 20% chance of winning

  static explain(): string {
    return "# < " + (this.max * this.chance).toString() + " in range [" + this.min.toString() + ", " + this.max.toString() + "]";
  }

  static play(): bool {
    const rng = new RNG<u8>(this.min, this.max);
    const roll = rng.next();
    logging.log(this.explain())
    logging.log("roll: " + roll.toString());
    return roll <= (this.max * this.chance);
  }
}
