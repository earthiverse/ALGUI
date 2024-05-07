import { GData, GGeometry, MapName } from "alclient";
import { Assets } from "@pixi/assets";
import { Container, DisplayObject } from "@pixi/display";
import { Spritesheet } from "@pixi/spritesheet";
import { Sprite } from "@pixi/sprite";
import { TilingSprite } from "@pixi/sprite-tiling";
import { AnimatedSprite } from "@pixi/sprite-animated";
import { Texture } from "@pixi/core";

class Background extends TilingSprite {
  protected textures: Texture[];
  protected currentTexture = 0;
  static CHANGE_MS = 1000;

  public constructor(textures: Texture[], width: number, height: number) {
    super(textures[0], width, height);
    this.textures = textures;
    this.zIndex = Number.MIN_SAFE_INTEGER;
    if (textures.length > 1)
      setTimeout(() => this.changeTexture(), Background.CHANGE_MS);
  }

  protected changeTexture() {
    if (this.destroyed) return;

    // Change texture
    this.currentTexture = (this.currentTexture + 1) % this.textures.length;
    this.texture = this.textures[this.currentTexture];

    setTimeout(() => this.changeTexture(), Background.CHANGE_MS);
  }
}

export class MapContainer extends Container {
  private static g: GData;
  private static spritesheet: Spritesheet;
  private static promise: Promise<unknown>;

  private background: Container;
  private foreground: Container;

  private constructor(map: MapName) {
    super();
    this.sortableChildren = true;

    const geometry = MapContainer.g.geometry[map] as GGeometry;
    const width = geometry.max_x - geometry.min_x;
    const height = geometry.max_y - geometry.min_y;

    this.background = new Container();
    this.background.sortableChildren = false;
    this.foreground = new Container();
    this.foreground.sortableChildren = true;
    this.foreground.zIndex = Number.MAX_SAFE_INTEGER;

    // Background
    console.debug(`Rendering ${map} background...`);
    if (geometry.default) {
      const key = `${map}_${geometry.default}`;
      const textures = MapContainer.spritesheet.animations[key];
      const bg = new Background(textures, width, height);
      bg.x = geometry.min_x;
      bg.y = geometry.min_y;
      this.background.addChild(bg);
    }
    if (geometry.placements) {
      for (const [index, x1, y1, x2, y2] of geometry.placements) {
        const key = `${map}_${index}`;
        const textures = MapContainer.spritesheet.animations[key];
        const width = textures[0].width;
        const height = textures[0].height;
        for (let x = x1; x <= (x2 ?? x1); x += width) {
          for (let y = y1; y <= (y2 ?? y1); y += height) {
            const bg =
              textures.length > 1
                ? new AnimatedSprite(textures)
                : new Sprite(textures[0]);
            bg.x = x;
            bg.y = y;
            bg.cullable = true;
            this.background.addChild(bg);
          }
        }
      }
    }

    // Foreground
    console.debug(`Rendering ${map} foreground...`);
    if (geometry.groups) {
      for (const group of geometry.groups) {
        const groupContainer = new Container();
        let maxY = Number.MIN_SAFE_INTEGER;
        for (const [index, x1, y1, x2, y2] of group) {
          const key = `${map}_${index}`;
          const textures = MapContainer.spritesheet.animations[key];
          const width = textures[0].width;
          const height = textures[0].height;
          for (let x = x1; x <= (x2 ?? x1); x += width) {
            for (let y = y1; y <= (y2 ?? y1); y += height) {
              const fg =
                textures.length > 1
                  ? new AnimatedSprite(textures)
                  : new Sprite(textures[0]);
              fg.x = x;
              fg.y = y;
              groupContainer.addChild(fg);

              if (y + height > maxY) maxY = y + height;
            }
          }
          groupContainer.zIndex = maxY;
          groupContainer.cullable = true;
          this.foreground.addChild(groupContainer);
        }
      }
    }

    super.addChild(this.background);
    super.addChild(this.foreground);
  }

  public addChild<U extends DisplayObject[]>(...children: U): U[0] {
    return this.foreground.addChild(...children);
  }

  public static async createMap(map: MapName): Promise<MapContainer> {
    if (this.promise) await this.promise; // We are making the spritesheet
    if (!this.spritesheet) {
      this.promise = new Promise<void>(async (resolve) => {
        // TODO: How do these paths work!?
        const sheetJson = await fetch("src/assets/map.json");
        const sheetImage = await Assets.load("src/assets/map.png");
        const g = await fetch("src/assets/G.json");
        this.g = (await g.json()) as GData;

        this.spritesheet = new Spritesheet(sheetImage, await sheetJson.json());
        await this.spritesheet.parse();
        resolve();
      });
      await this.promise;
    }

    return new MapContainer(map);
  }
}
