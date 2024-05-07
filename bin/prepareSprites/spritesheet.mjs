import crypto from "crypto";
import fs from "fs";
import sharp from "sharp";
import Spritesmith from "spritesmith";

export async function generateMonsterSpriteSheet(monsterNames) {
  // Create the hashmap
  const anchors = new Map();
  const duplicates = new Map();
  const hashes = new Map();
  const images = [];
  for (const monsterName of monsterNames) {
    const dir = `./fixed/${monsterName}`;

    for (const path of [
      `${dir}/1.png`,
      `${dir}/2.png`,
      `${dir}/3.png`,
      `${dir}/4.png`,
      `${dir}/5.png`,
      `${dir}/6.png`,
      `${dir}/7.png`,
      `${dir}/8.png`,
      `${dir}/9.png`,
      `${dir}/10.png`,
      `${dir}/11.png`,
      `${dir}/12.png`,
    ]) {
      const sha256 = crypto.createHash("sha256");
      const image = await sharp(path);
      const metadata = await image.metadata();
      const data = await image.toBuffer();

      // Get the hash
      sha256.update(data);
      const hash = sha256.digest("hex");

      // Find the anchor point based on the bottom row of pixels
      const bottom = await sharp(path)
        .extract({
          left: 0,
          top: metadata.height - 1,
          width: metadata.width,
          height: 1,
        })
        .raw()
        .toBuffer();
      let start;
      for (let i = 3; i < bottom.length; i += 4) {
        if (bottom[i] !== 0) {
          start = Math.floor(i / 4);
          break;
        }
      }
      let end;
      for (let i = start * 4 + 7; i < bottom.length; i += 4) {
        if (bottom[i] === 0) {
          end = Math.floor(i / 4);
          break;
        }
      }
      anchors.set(path, (start + (end - start) / 2) / metadata.width);

      if (hashes.has(hash)) {
        // Set it as a duplicate
        const duplicate = hashes.get(hash);
        console.debug(`${path} is the same as ${duplicate}`);
        duplicates.set(path, duplicate);
      } else {
        images.push(path);
        hashes.set(hash, path);
      }
    }
  }

  return new Promise((resolve) => {
    Spritesmith.run(
      {
        algorithm: "binary-tree",
        src: images,
      },
      (error, result) => {
        if (error) throw error;

        const output = `./monsters.png`;

        fs.writeFileSync(output, result.image);
        const coordinates = result.coordinates;

        // Add references
        for (const [duplicate, reference] of duplicates) {
          coordinates[duplicate] = coordinates[reference];
        }

        const spritesheet = {
          frames: {},
          meta: {
            format: "RGBA8888",
            image: "monsters.png",
            scale: 1,
            size: {
              w: result.properties.width,
              h: result.properties.height,
            },
          },
          animations: {},
        };

        // Add the frames to the spritesheet
        for (const key of Object.keys(coordinates).sort()) {
          const fixedKey = key
            .replace("./fixed/", "")
            .replace("/", "_")
            .replace(".png", "");

          spritesheet.frames[fixedKey] = {
            // TODO: Figure out anchor point based on the shadow
            anchor: {
              x: anchors.get(key),
              y: 1,
            },
            frame: {
              x: coordinates[key].x,
              y: coordinates[key].y,
              w: coordinates[key].width,
              h: coordinates[key].height,
            },
          };
        }

        // Add the animations to the spritesheet
        for (const monsterName of monsterNames) {
          spritesheet.animations[`${monsterName}_N`] = [
            `${monsterName}_10`,
            `${monsterName}_11`,
            `${monsterName}_12`,
            `${monsterName}_11`,
          ];
          spritesheet.animations[`${monsterName}_E`] = [
            `${monsterName}_7`,
            `${monsterName}_8`,
            `${monsterName}_9`,
            `${monsterName}_8`,
          ];
          spritesheet.animations[`${monsterName}_S`] = [
            `${monsterName}_1`,
            `${monsterName}_2`,
            `${monsterName}_3`,
            `${monsterName}_2`,
          ];
          spritesheet.animations[`${monsterName}_W`] = [
            `${monsterName}_4`,
            `${monsterName}_5`,
            `${monsterName}_6`,
            `${monsterName}_5`,
          ];
        }

        fs.writeFileSync("monsters.json", JSON.stringify(spritesheet, null, 2));

        console.debug("  Created spritesheet & json!");
        resolve();
      },
    );
  });
}

const FILE_REGEX =
  /(?<tileset>[a-z0-9_]+)_(?<x>\d+)_(?<y>\d+)_(?<width>\d+)_(?<height>\d+)\.png$/;

function mergeRectangles(rectangles) {
  const mergedRectangles = [];

  for (const rect of rectangles) {
    let merged = false;

    for (let i = 0; i < mergedRectangles.length; i++) {
      const mergedRect = mergedRectangles[i];

      const xOverlap =
        rect.x + rect.width >= mergedRect.x &&
        rect.x <= mergedRect.x + mergedRect.width;
      const yOverlap =
        rect.y + rect.height >= mergedRect.y &&
        rect.y <= mergedRect.y + mergedRect.height;

      if (xOverlap && yOverlap) {
        mergedRectangles[i] = {
          x: Math.min(rect.x, mergedRect.x),
          y: Math.min(rect.y, mergedRect.y),
          width:
            Math.max(rect.x + rect.width, mergedRect.x + mergedRect.width) -
            Math.min(rect.x, mergedRect.x),
          height:
            Math.max(rect.y + rect.height, mergedRect.y + mergedRect.height) -
            Math.min(rect.y, mergedRect.y),
        };
        merged = true;
        break;
      }
    }

    if (!merged) {
      mergedRectangles.push(rect);
    }
  }

  return mergedRectangles;
}

export async function generateTilesSpriteSheet(gGeometry, gTileset) {
  const allDimensions = [];
  const allMergedDimensions = [];
  const images = [];

  for (const tilesetName of Object.keys(gTileset).sort()) {
    const dir = `./fixed/${tilesetName}`;
    if (!fs.existsSync(dir)) {
      console.debug("Tileset", tilesetName, "isn't used for maps.");
      continue;
    }

    // Get a list of all the dimensions we need to add
    let dimensions = [];
    for (const file of fs.readdirSync(dir)) {
      const results = FILE_REGEX.exec(file);
      if (!results) continue; // Base file, or misc. file
      dimensions.push({
        tilesetName: tilesetName,
        x: Number.parseInt(results.groups.x),
        y: Number.parseInt(results.groups.y),
        width: Number.parseInt(results.groups.width),
        height: Number.parseInt(results.groups.height),
      });
    }

    dimensions.sort(function (a, b) {
      const xDif = a.x - b.x;
      if (xDif) return xDif;
      return a.y - b.y;
    });

    // Group the dimensions
    let lastMergedLen = 1;
    let mergedDimensions = [];
    do {
      lastMergedLen = mergedDimensions.length;
      mergedDimensions = mergeRectangles(dimensions);
    } while (lastMergedLen !== mergedDimensions.length);
    for (const mergedDimension of mergedDimensions)
      mergedDimension.tilesetName = tilesetName;

    // Create the grouped dimension images
    for (const mergedDimension of mergedDimensions) {
      const outputName =
        dir +
        `/${tilesetName}_${mergedDimension.x}_${mergedDimension.y}_${mergedDimension.width}_${mergedDimension.height}.png`;

      // Add the image to our list
      images.push(outputName);

      if (fs.existsSync(outputName)) continue; // Already have the image
      await sharp(dir + "/base.png")
        .extract({
          left: mergedDimension.x,
          top: mergedDimension.y,
          width: mergedDimension.width,
          height: mergedDimension.height,
        })
        .toFile(outputName);
    }

    // Push them all in to the larger arrays
    allDimensions.push(...dimensions);
    allMergedDimensions.push(...mergedDimensions);
  }

  return new Promise((resolve) => {
    Spritesmith.run(
      {
        algorithm: "binary-tree",
        src: images,
      },
      (error, result) => {
        if (error) throw error;

        const output = `./map.png`;

        fs.writeFileSync(output, result.image);
        const coordinates = result.coordinates;

        const spritesheet = {
          frames: {},
          meta: {
            format: "RGBA8888",
            image: "map.png",
            scale: 1,
            size: {
              w: result.properties.width,
              h: result.properties.height,
            },
          },
          animations: {},
        };

        // Add the dimensions to the spritesheet
        for (const key of Object.keys(coordinates).sort()) {
          const results = FILE_REGEX.exec(key);
          const tileset = results.groups.tileset;
          const x = Number.parseInt(results.groups.x);
          const y = Number.parseInt(results.groups.y);
          const width = Number.parseInt(results.groups.width);
          const height = Number.parseInt(results.groups.height);

          for (let i = 0; i < allDimensions.length; i++) {
            const dimension = allDimensions[i];
            if (dimension.tilesetName !== tileset) continue;
            if (dimension.x < x) continue;
            if (dimension.x > x + width) continue;
            if (dimension.y < y) continue;
            if (dimension.y > y + height) continue;

            // We found the image for this dimension
            spritesheet.frames[
              `${tileset}_${dimension.x}_${dimension.y}_${dimension.width}_${dimension.height}`
            ] = {
              frame: {
                x: coordinates[key].x + (dimension.x - x),
                y: coordinates[key].y + (dimension.y - y),
                w: dimension.width,
                h: dimension.height,
              },
            };

            // Remove the dimension now that we've found it
            allDimensions.splice(i, 1);
            i--;
          }
        }

        // Add the indexes as animations
        // TODO: Some of these are actually animated
        for (const mapName in gGeometry) {
          const mapGeometry = gGeometry[mapName];
          for (let tileNo = 0; tileNo < mapGeometry.tiles.length; tileNo++) {
            const tileData = mapGeometry.tiles[tileNo];
            const tilesheet = tileData[0];
            const tilesetData = gTileset[tilesheet];
            const x = tileData[1];
            const y = tileData[2];
            const width = tileData[3];
            const height = tileData[4] ?? width;
            if (tilesetData.frames) {
              const frames = [];
              for (let frameNo = 0; frameNo < tilesetData.frames; frameNo++) {
                const frameX = x + frameNo * tilesetData.frame_width;
                const frame = `${tilesheet}_${frameX}_${y}_${width}_${height}`;
                frames.push(frame);
              }
              for (
                let frameNo = tilesetData.frames - 2;
                frameNo > 0;
                frameNo--
              ) {
                const frameX = x + frameNo * tilesetData.frame_width;
                const frame = `${tilesheet}_${frameX}_${y}_${width}_${height}`;
                frames.push(frame);
              }
              spritesheet.animations[`${mapName}_${tileNo}`] = frames;
            } else {
              const frame = `${tilesheet}_${x}_${y}_${width}_${height}`;
              spritesheet.animations[`${mapName}_${tileNo}`] = [frame];
            }
          }
        }

        fs.writeFileSync("map.json", JSON.stringify(spritesheet, null, 2));

        console.debug("  Created spritesheet & json!");
        resolve();
      },
    );
  });
}
