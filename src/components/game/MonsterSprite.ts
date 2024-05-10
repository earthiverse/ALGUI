import type { MonsterName } from "alclient";
import { AnimatedSprite, Assets, Spritesheet, Ticker } from "pixi.js";

// TODO: Direction should be based off the direction it's heading

const DEATH_FADEOUT_MS = 500;
const DEATH_END_ROTATION = Math.PI / 4;

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

  public animateDeath() {
    this.pivot.set(0.5, 0.5);

    const onTick = () => {
      if (this.destroyed) {
        Ticker.shared.remove(onTick);
        return;
      }

      this.alpha -= Ticker.shared.elapsedMS / DEATH_FADEOUT_MS;
      const deathProgress = 1 - this.alpha;
      this.rotation = deathProgress * DEATH_END_ROTATION;
      // this.scale = 1 - deathProgress;

      if (this.alpha < 0) {
        Ticker.shared.remove(onTick);
        this.destroy();
      }
    };

    Ticker.shared.add(onTick);
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
