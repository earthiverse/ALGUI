/**
 * This function looks for the given skin name in the sprites and returns information about where we can find the sprite
 * @param {string} name
 */
export const findSkin = (G, name) => {
  for (const spriteName in G.sprites) {
    const gSprite = G.sprites[spriteName];
    for (let row = 0; row < gSprite.matrix.length; row++) {
      const matrix = gSprite.matrix[row];
      const column = matrix.indexOf(name);
      if (column !== -1)
        return {
          column: column,
          columns: gSprite.columns,
          file: gSprite.file,
          name: spriteName,
          row: row,
          rows: gSprite.rows,
        };
    }
  }
  throw `Couldn't find skin for ${name}`;
};

export const findTiles = (G, mapName) => {
  const tiles = new Map();

  for (const tile of G.geometry[mapName]?.tiles ?? []) {
    const tilesetName = tile[0];
    const x = tile[1];
    const y = tile[2];
    const width = tile[3];
    const height = tile[4] ?? width;

    const key = `${tilesetName}_${x}_${y}_${width}_${height}`;
    if (tiles.has(key)) continue;
    tiles.set(key, {
      tilesetName: tilesetName,
      file: G.tilesets[tilesetName].file,
      x: x,
      y: y,
      width: width,
      height: height,
    });
  }

  return tiles;
};
