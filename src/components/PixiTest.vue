<template>
  <canvas id="pixi"></canvas>
</template>

<script lang="ts">
import { Application } from "@pixi/app";
import { Assets } from "@pixi/assets";
import { Spritesheet } from "@pixi/spritesheet";
import { AnimatedSprite } from "@pixi/sprite-animated";

export default {
  methods: {
    async drawPixi() {
      var canvas = document.getElementById("pixi") as HTMLCanvasElement;

      const app = new Application({
        resizeTo: canvas,
        antialias: true,
        view: canvas,
      });

      const sheetJson = await fetch("./src/assets/monsters.json");
      const sheetImage = await Assets.load("./src/assets/monsters.png");

      console.debug("Sheet image");
      console.debug(sheetImage);

      console.debug("Sheet json");
      console.debug(sheetJson);

      const spritesheet = new Spritesheet(sheetImage, await sheetJson.json());

      const fun = await spritesheet.parse();

      console.debug("fun");
      console.debug(fun);

      console.debug("spritesheet");
      console.debug(spritesheet);

      let y = 0;
      for (const monster of [
        "slenderman",
        "chestm",
        "dragold",
        "squig",
        "rat",
        "mole",
        "goo"
      ]) {
        let x = 50;
        let sprite: AnimatedSprite;
        for (const position of ["N", "E", "S", "W"]) {
          sprite = new AnimatedSprite(
            spritesheet.animations[`${monster}_${position}`]
          );
          if (position == "N") {
            y += sprite.height + 25;
            console.log(monster, "height is", sprite.height);
          }
          sprite.scale.set(1.5);
          sprite.position.set(x, y);
          sprite.updateAnchor = true;
          sprite.animationSpeed = 0.1;
          sprite.play();
          app.stage.addChild(sprite);
          x += sprite.width + 25;
        }
      }
    }
  },

  mounted() {
    this.drawPixi();
  },
};
</script>

<style scoped>
#pixi {
  min-width: 100%;
  min-height: 100%;
}
</style>
