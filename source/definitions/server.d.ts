import { BankInfo, CXData, MapName, ProjectileName, StatusInfo } from "alclient"

export type UICharacterData = {
    ctype: string
    cx?: CXData
    hp: number
    id: string
    going_x: number
    going_y: number
    level: number
    max_hp: number
    max_mp: number
    moving: boolean
    mp: number
    s: StatusInfo
    skin: string
    speed: number
    target?: string
    x: number
    y: number
}

export type UIMonsterData = {
    aa?: number
    hp: number
    id: string
    going_x: number
    going_y: number
    max_hp: number
    moving: boolean
    s: StatusInfo
    size?: number
    skin: string
    speed: number
    target?: string
    x: number
    y: number
}

export type UIProjectileData = {
    going_x: number
    going_y: number
    pid: string
    projectile: ProjectileName
    x: number
    y: number
}

export type UIRayData = {
    going_x: number
    going_y: number
    pid: string
    ray: ProjectileName
    x: number
    y: number
}

/** Signal to change the map, and center it at the coordinates provided */
export type MapData = {
    map: MapName
    x: number
    y: number
}

export type UIData = {
    mapData: MapData
    monsters: Map<string, UIMonsterData>
    players: Map<string, UICharacterData>
    bank?: BankInfo
}

export type ServerToClientEvents = {
    "bank": (bankInfo: BankInfo) => void
    "character": (characterData: UICharacterData) => void
    "map": (mapData: MapData) => void
    "monster": (MonsterData: UIMonsterData) => void
    "newTab": (tabName: string) => void
    "projectile": (projectileData: UIProjectileData) => void
    "ray": (rayData: UIRayData) => void
    "remove": (entityID: string) => void
    "removeAll": () => void
    "removeTab": (tabName: string) => void
}

export type ClientToServerEvents = {
    "switchTab": (tabName: string) => void
}