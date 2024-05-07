<template>
  <canvas id="pixi"></canvas>
</template>

<script lang="ts">
import { MonsterName } from "alclient";
import { Application } from "@pixi/app";
import { AnimatedSprite } from "@pixi/sprite-animated";

import { MapContainer } from "./MapContainer.ts";
import { MonsterSprite } from "./MonsterSprite.ts";

export default {
  methods: {
    async drawPixi() {
      var canvas = document.getElementById("pixi") as HTMLCanvasElement;

      const app = new Application({
        resizeTo: canvas,
        antialias: false,
        view: canvas,
      });
      app.stage.sortableChildren = true;

      const map = await MapContainer.createMap("main");
      app.stage.addChild(map);

      setInterval(async () => {
        const y = Math.random() * window.innerHeight;
        const x = Math.random() * window.innerWidth;

        const monster = await MonsterSprite.createMonster("goo");
        monster.position.set(x, y);
        app.stage.addChild(monster);
      }, 10);

      let y = 0;
      for (const monster of [
        "slenderman",
        "chestm",
        "dragold",
        "squig",
        "rat",
        "mole",
        "goo",
      ] as MonsterName[]) {
        let x = 50;
        let sprite: AnimatedSprite;
        for (const position of ["N", "E", "S", "W"]) {
          sprite = await MonsterSprite.createMonster(
            monster,
            position as "N" | "E" | "S" | "W",
          );
          if (position == "N") {
            y += sprite.height + 25;
            console.log(monster, "height is", sprite.height);
          }
          sprite.scale.set(1.5);
          sprite.position.set(x, y);
          sprite.updateAnchor = true;
          app.stage.addChild(sprite);
          x += sprite.width + 25;
        }
      }
    },
  },

  mounted() {
    this.drawPixi();
  },
};
</script>

<style scoped>
#pixi {
  min-width: 100vw;
  min-height: 100vh;
}
</style>
