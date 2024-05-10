import { Application } from "pixi.js";
import { Viewport } from "pixi-viewport";
import type { MapName } from "alclient";
import { MapContainer } from "./MapContainer";

export let APP: Application;
export let VIEWPORT: Viewport;
export let MAP: MapContainer;

export async function initializeApplication(): Promise<Application> {
  if (APP) return APP;

  // Create the PixiJS Application
  const canvas = document.getElementById("pixi") as HTMLCanvasElement;
  APP = new Application();
  await APP.init({
    resizeTo: canvas,
    antialias: false,
    view: canvas,
  });

  VIEWPORT = new Viewport({
    events: APP.renderer.events,
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
  });
  VIEWPORT.setZoom(1.5);
  VIEWPORT.drag().pinch().wheel();
  APP.stage.addChild(VIEWPORT);

  return APP;
}

//   async drawPixi() {
//     var canvas = document.getElementById("pixi") as HTMLCanvasElement;

//     const app = new Application({
//       resizeTo: canvas,
//       antialias: false,
//       view: canvas,
//     });
//     app.stage.sortableChildren = true;

//     const map = await MapContainer.createMap("main");
//     app.stage.addChild(map);

//     setInterval(async () => {
//       const y = Math.random() * window.innerHeight;
//       const x = Math.random() * window.innerWidth;

//       const monster = await MonsterSprite.createMonster("goo");
//       monster.position.set(x, y);
//       monster.zIndex = y;
//       map.addChild(monster);
//     }, 10);

//     let y = 0;
//     for (const monster of [
//       "slenderman",
//       "chestm",
//       "dragold",
//       "squig",
//       "rat",
//       "mole",
//       "goo",
//     ] as MonsterName[]) {
//       let x = 50;
//       let sprite: AnimatedSprite;
//       for (const position of ["N", "E", "S", "W"]) {
//         sprite = await MonsterSprite.createMonster(
//           monster,
//           position as "N" | "E" | "S" | "W",
//         );
//         if (position == "N") {
//           y += sprite.height + 25;
//           console.log(monster, "height is", sprite.height);
//         }
//         sprite.scale.set(1.5);
//         sprite.position.set(x, y);
//         sprite.updateAnchor = true;
//         sprite.zIndex = y;
//         map.addChild(sprite);
//         x += sprite.width + 25;
//       }
//     }
//   },

export async function changeMap(map: MapName): Promise<MapContainer> {
  if (!APP) throw new Error("Run initialize() first");

  // Create the new map
  const newMap = await MapContainer.createMap(map);

  // Remove the previous map
  if (MAP) MAP.destroy();

  // Assign the new map
  MAP = newMap;
  VIEWPORT.addChild(MAP);

  VIEWPORT.worldHeight = MAP.height;
  VIEWPORT.worldWidth = MAP.width;

  console.log("map");
  console.log(MAP.x, MAP.width);

  // VIEWPORT.clamp({
  //   left: MAP.geometry.min_x,
  //   right: MAP.geometry.max_x,
  //   top: MAP.geometry.min_y,
  //   bottom: MAP.geometry.max_y,
  // }).clampZoom({
  //   maxHeight: MAP.height,
  //   maxWidth: MAP.width,
  // });

  return MAP;
}
