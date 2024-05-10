import type { GData, GGeometry, MapName } from "alclient";
import {
  AnimatedSprite,
  Assets,
  Container,
  RenderTexture,
  Sprite,
  Spritesheet,
  TilingSprite,
  type ContainerChild,
} from "pixi.js";
import { APP } from "./GameVisuals";

export class MapContainer extends Container {
  private static g: GData;
  private static spritesheet: Spritesheet;
  private static promise: Promise<unknown>;
  private static backgroundCache: Map<MapName, AnimatedSprite>;

  private background: AnimatedSprite;
  private foreground: Container;
  public geometry: GGeometry;

  private constructor(map: MapName) {
    super();
    this.sortableChildren = true;

    this.geometry = MapContainer.g.geometry[map] as GGeometry;
    const width = this.geometry.max_x - this.geometry.min_x;
    const height = this.geometry.max_y - this.geometry.min_y;

    const app = APP;
    const renderer = app.renderer;

    if (!MapContainer.backgroundCache.has(map)) {
      //// Background
      console.debug(`Rendering ${map} background...`);

      // Create the background layers for animation
      const backgroundLayers = [];
      for (let i = 0; i < 3; i++) {
        backgroundLayers.push(
          RenderTexture.create({ width: width, height: height }),
        );
      }

      // Render the default background
      if (this.geometry.default) {
        const key = `${map}_${this.geometry.default}`;
        const textures = MapContainer.spritesheet.animations[key];
        if (textures.length === 1) textures.push(textures[0], textures[0]);

        for (let i = 0; i < textures.length; i++) {
          const texture = textures[i];
          const tile = new TilingSprite({
            texture: texture,
            width: width,
            height: height,
          });
          renderer.render({
            clear: false,
            container: tile,
            target: backgroundLayers[i],
          });
          tile.destroy();
        }
      }

      // Render the placements
      if (this.geometry.placements) {
        for (const [index, x1, y1, x2, y2] of this.geometry.placements) {
          const key = `${map}_${index}`;
          const textures = MapContainer.spritesheet.animations[key];
          if (textures.length === 1) textures.push(textures[0], textures[0]);
          const textureWidth = textures[0].width;
          const textureHeight = textures[0].height;

          const fromX = x1 - this.geometry.min_x;
          const fromY = y1 - this.geometry.min_y;
          const toX = x2 === undefined ? fromX : fromX + (x2 - x1);
          const toY = y2 === undefined ? fromY : fromY + (y2 - y1);

          for (let i = 0; i < textures.length; i++) {
            const texture = textures[i];
            const tile = Sprite.from(texture);
            for (let x = fromX; x <= toX; x += textureWidth) {
              for (let y = fromY; y <= toY; y += textureHeight) {
                tile.x = x;
                tile.y = y;
                renderer.render({
                  clear: false,
                  container: tile,
                  target: backgroundLayers[i],
                });
              }
            }
            tile.destroy();
          }
        }
      }

      // Combine the background layers into a large animated sprite
      backgroundLayers.push(backgroundLayers[1]); // Make the animation loop nice
      this.background = new AnimatedSprite(backgroundLayers);
      MapContainer.backgroundCache.set(map, this.background);
    } else {
      this.background = MapContainer.backgroundCache.get(map) as AnimatedSprite;
    }
    this.background.x = this.geometry.min_x;
    this.background.y = this.geometry.min_y;
    this.background.animationSpeed = 1 / 30;
    this.background.play();

    //// Foreground
    console.debug(`Rendering ${map} foreground...`);

    this.foreground = new Container();
    this.foreground.sortableChildren = true;
    this.foreground.zIndex = Number.MAX_SAFE_INTEGER;

    // Render the groups
    if (this.geometry.groups) {
      for (const group of this.geometry.groups) {
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

  public addChild<U extends ContainerChild[]>(...children: U): U[0] {
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

        this.backgroundCache = new Map();
        this.spritesheet = new Spritesheet(sheetImage, await sheetJson.json());
        await this.spritesheet.parse();
        resolve();
      });
      await this.promise;
    }

    return new MapContainer(map);
  }
}
