import AL from "alclient";
import fs from "fs";
import { findSkin } from "./al.mjs";
import { downloadSkin } from "./file.mjs";
import { getMonsterSprites } from "./image.mjs";
import { generateSpriteSheet as generateSpriteSheet } from "./spritesheet.mjs";

const G = await AL.Game.getGData(true, false);

for (const monsterName in G.monsters) {
  console.debug(`${monsterName}...`);
  const gMonster = G.monsters[monsterName];

  // Find the image with the skin
  console.debug(`  Finding skin...`);
  const skinData = findSkin(G, gMonster.skin);

  // Download the skin
  console.debug(`  Downloading skin...`);
  await downloadSkin(skinData);

  // Get the sprites
  console.debug(`  Extracting sprites...`);
  await getMonsterSprites(skinData, monsterName);
}

await generateSpriteSheet(Object.keys(G.monsters).sort());

// Copy to public folder
fs.copyFileSync("spritesheet.json", "../../src/assets/spritesheet.json");
fs.copyFileSync("spritesheet.png", "../../src/assets/spritesheet.png");
