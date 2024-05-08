import type { MonsterName } from "alclient";
import { Assets } from "@pixi/assets";
import { AnimatedSprite } from "@pixi/sprite-animated";
import { Spritesheet } from "@pixi/spritesheet";

// TODO: Direction should be based off the direction it's heading

export class MonsterSprite extends AnimatedSprite {
  public static spritesheet: Spritesheet;
  public static promise: Promise<unknown>;

  private constructor(name: MonsterName, direction: "N" | "E" | "S" | "W") {
    super(MonsterSprite.spritesheet.animations[`${name}_${direction}`]);

    this.cullable = true;

    // Start animation
    this.animationSpeed = 1 / 10;
    this.play();
  }

  public static async createMonster(
    name: MonsterName,
    direction: "N" | "E" | "S" | "W" = "S",
  ): Promise<MonsterSprite> {
    if (this.promise) await this.promise; // We are making the spritesheet
    if (!this.spritesheet) {
      this.promise = new Promise<void>(async (resolve) => {
        // TODO: How do these paths work!?
        const sheetJson = await fetch("src/assets/monsters.json");
        const sheetImage = await Assets.load("src/assets/monsters.png");

        this.spritesheet = new Spritesheet(sheetImage, await sheetJson.json());
        await this.spritesheet.parse();
        resolve();
      });
      await this.promise;
    }
    return new MonsterSprite(name, direction);
  }
}
