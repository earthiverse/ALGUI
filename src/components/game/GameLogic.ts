import type {
  ClientToServerEvents,
  MapName,
  ServerToClientEvents,
} from "alclient";
import socketio, { type Socket } from "socket.io-client";
import { VIEWPORT, changeMap } from "./GameVisuals";
import { MonsterSprite } from "./MonsterSprite";
import type { MapContainer } from "./MapContainer";

let MAP: MapContainer;
let LAST_MAP: MapName;
const MONSTERS = new Map<string, MonsterSprite>();

export async function initializeSocket() {
  const socket: Socket<ServerToClientEvents, ClientToServerEvents> = socketio(
    "wss://usd1.adventure.land:2096",
    {
      autoConnect: false,
      query: {},
      reconnection: true,
      transports: ["websocket"],
    },
  );

  socket.on("death", async (data) => {
    const monsterSprite = MONSTERS.get(data.id);
    if (!monsterSprite) return; // Already gone
    console.debug(`Animating death of ${data.id}`);
    monsterSprite.animateDeath();
  });

  socket.on("entities", async (data) => {
    if (!MAP) return;

    if (data.type === "all") {
      MONSTERS.clear();
      for (const monster of data.monsters) {
        const monsterSprite = await MonsterSprite.createMonster(monster.type);
        monsterSprite.x = monster.x;
        monsterSprite.y = monster.y;
        MAP.addChild(monsterSprite);
        MONSTERS.set(monster.id, monsterSprite);
      }
    } else {
      for (const monster of data.monsters) {
        const monsterSprite = MONSTERS.get(monster.id);
        if (!monsterSprite) {
          const monsterSprite = await MonsterSprite.createMonster(monster.type);
          monsterSprite.x = monster.x;
          monsterSprite.y = monster.y;
          MAP.addChild(monsterSprite);
          MONSTERS.set(monster.id, monsterSprite);
        }
      }
    }
  });

  socket.on("new_map", async (data) => {
    MAP = await changeMap(data.name);
    VIEWPORT.snap(data.x, data.y, {
      removeOnComplete: true,
      time: data.name === LAST_MAP ? 1000 : 0,
    });

    console.debug(`Rendering ${data.entities.monsters.length} monsters...`);
    MONSTERS.clear();
    for (const monster of data.entities.monsters) {
      const monsterSprite = await MonsterSprite.createMonster(monster.type);
      monsterSprite.x = monster.x;
      monsterSprite.y = monster.y;
      MAP.addChild(monsterSprite);
      MONSTERS.set(monster.id, monsterSprite);
    }

    LAST_MAP = data.name;
  });

  socket.on("welcome", async (data) => {
    socket.emit("loaded", {
      height: 1080,
      width: 1920,
      success: 1,
      scale: 2,
    });
    MAP = await changeMap(data.map);
    VIEWPORT.snap(data.x, data.y, {
      removeOnComplete: true,
      time: data.map === LAST_MAP ? 1000 : 0,
    });
    LAST_MAP = data.map;
  });

  socket.open();
}
