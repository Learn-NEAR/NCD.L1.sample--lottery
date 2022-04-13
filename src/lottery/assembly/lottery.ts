import { logging, RNG } from "near-sdk-as";

@nearBindgen
export class Lottery {

  constructor(
    private chance: f64 = 0.10,
    private xing: f32 = 1.1
  ) { }

  explain(): string {
    let text = "Players have a 1 in " + this.stringify_chances() + " chance of winning. ";

    text += this.xing >= 1 ? "Xing is most favorable, increasing your chance to win" : "不幸的我, your chance to win drops";
    text += " after each play " + this.stringify_xing();

    return text
  }

  play(): bool {
    const rng = new RNG<u32>(1, u32.MAX_VALUE);
    const roll = rng.next();
    return roll <= <u32>(<f64>u32.MAX_VALUE * this.chance);
  }

  configure(chance: f64, xing: f32): void {
    assert(chance >= 0.000000001 && chance <= 1, "Chance must be within range (0..1]");
    assert(xing != 4, "The number 4 is most unlucky! Choose another.");
    assert(!!this.effect(chance, xing), "The values of [chance] and [xing] would result in an impossible lottery")
    this.chance = chance;
    this.xing = xing;
    logging.log(this.explain());
  }

  xingyun(): void {
    // too small a number will result in an impossible lottery
    // using u32, 0.000000001 represents a minimum viable chance of 1 in 1 billion to win
    const effect = this.effect(this.chance, this.xing)
    if (!!effect) {
      this.chance = effect
    }
  }

  private effect(chance: f64, xing: f32): f64 {
    if (chance * xing >= 0.000000001 && chance * xing <= 1) {
      return chance * xing
    } else {
      return 0
    }
  }

  private stringify_chances(): string {
    if (this.chance > 0.5) {
      return "2 (or better!)"
    } else {
      return (<u32>(floor(1 / this.chance))).toString()
    }
  }

  private stringify_xing(): string {
    return "by " + floor(((this.xing * 100) - 100)).toString() + "%"
  }
}
