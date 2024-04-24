import AL from "alclient";
import fs from "fs";
import { findSkin, findTiles } from "./al.mjs";
import { downloadImage } from "./file.mjs";
import { getTilesetTiles, getMonsterSprites } from "./image.mjs";
import {
  generateMonsterSpriteSheet,
  generateTilesSpriteSheet,
} from "./spritesheet.mjs";

const G = await AL.Game.getGData(true, false);

// Generate monster sprite sheet
for (const monsterName in G.monsters) {
  console.debug(`${monsterName}...`);
  const gMonster = G.monsters[monsterName];

  // Find the image with the skin
  console.debug(`  Finding skin...`);
  const skinData = findSkin(G, gMonster.skin);

  // Download the skin
  console.debug(`  Downloading skin...`);
  await downloadImage(skinData);

  // Get the sprites
  console.debug(`  Extracting sprites...`);
  await getMonsterSprites(skinData, monsterName);
}
await generateMonsterSpriteSheet(Object.keys(G.monsters).sort());

// Copy to public folder
fs.copyFileSync("monsters.json", "../../src/assets/monsters.json");
fs.copyFileSync("monsters.png", "../../src/assets/monsters.png");
fs.unlinkSync("monsters.json");
fs.unlinkSync("monsters.png");

// Generate map sprite sheet
for (const mapName in G.maps) {
  console.debug(`${mapName}...`);

  console.debug(`  Finding tiles`);
  const tileData = findTiles(G, mapName);

  console.debug(`  Downloading tiles...`);
  for (const [, tileDatum] of tileData) {
    await downloadImage(tileDatum);
  }

  console.debug(`  Extracting tiles...`);
  for (const [key, tileDatum] of tileData) {
    await getTilesetTiles(tileDatum, key);
  }
}
await generateTilesSpriteSheet(Object.keys(G.tilesets).sort());

// Copy to public folder
fs.copyFileSync("map.json", "../../src/assets/map.json");
fs.copyFileSync("map.png", "../../src/assets/map.png");
fs.unlinkSync("map.json");
fs.unlinkSync("map.png");
