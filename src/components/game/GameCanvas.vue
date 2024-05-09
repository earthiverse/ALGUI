<template>
  <canvas id="pixi"></canvas>
</template>

<script lang="ts">
import socketio from "socket.io-client";
import { changeMap, initialize } from "./Game.ts";

export default {
  methods: {
    async loadSocket() {
      const socket = socketio("wss://usd1.adventure.land:2096", {
        autoConnect: false,
        query: {},
        reconnection: true,
        transports: ["websocket"],
      });
      socket.connect();
    },
  },
  async mounted() {
    await initialize();
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
