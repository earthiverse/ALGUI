<template>
  <canvas id="pixi"></canvas>
</template>

<script lang="ts">
import { changeMap, initializeApplication } from "./GameVisuals.ts";
import { initializeSocket } from "./GameLogic.ts";

export default {
  async mounted() {
    await initializeApplication();
    await initializeSocket();
    await changeMap("main");
  },
};
</script>

<style scoped>
#pixi {
  min-width: 100vw;
  min-height: 100vh;
}
</style>
