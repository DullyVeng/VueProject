import { DiggerMapGenerator } from '../utils/mapGenerator.js'

/**
 * 小地图探索系统数据配置
 * 包含可探索地图的网格数据、怪物配置等
 */

// 地形类型常量
export const TERRAIN_TYPES = {
    GROUND: 0,      // 可行走地面
    WALL: 1,        // 墙壁（不可通过）
    OBSTACLE: 2,    // 障碍物（树木、石头等）
    WATER: 3,       // 水域（不可通过）
    GRASS: 4,       // 草地（可行走，增加隐性遭遇率）
    EXIT: 9         // 出口（触发返回大地图）
}

// 地形显示配置
export const TERRAIN_STYLES = {
    [TERRAIN_TYPES.GROUND]: {
        color: '#3d5c3d',
        name: '地面'
    },
    [TERRAIN_TYPES.WALL]: {
        color: '#2a2a2a',
        name: '墙壁'
    },
    [TERRAIN_TYPES.OBSTACLE]: {
        color: '#1a3a1a',
        name: '障碍物'
    },
    [TERRAIN_TYPES.WATER]: {
        color: '#1a3a5c',
        name: '水域'
    },
    [TERRAIN_TYPES.GRASS]: {
        color: '#2d4a2d',
        name: '草地'
    },
    [TERRAIN_TYPES.EXIT]: {
        color: '#5c3d3d',
        name: '出口'
    }
}

// 初始化生成器
const generator = new DiggerMapGenerator()

// 辅助函数：为生成的地图放置显性怪物
const placeMonsters = (map, monstersConfig) => {
    const placedMonsters = []
    const usedPositions = new Set()

    // 简单的随机放置尝试
    const getRandomPos = () => {
        let attempts = 0
        while (attempts < 100) {
            const x = Math.floor(Math.random() * map.width)
            const y = Math.floor(Math.random() * map.height)
            const idx = y * map.width + x
            // 确保在地面或草地上，且不与出生点重叠
            if ((map.terrain[idx] === TERRAIN_TYPES.GROUND || map.terrain[idx] === TERRAIN_TYPES.GRASS) &&
                !(x === map.spawnPoint.x && y === map.spawnPoint.y) &&
                !usedPositions.has(idx)) {
                return { x, y, idx }
            }
            attempts++
        }
        return null
    }

    monstersConfig.forEach(m => {
        const pos = getRandomPos()
        if (pos) {
            placedMonsters.push({
                ...m,
                x: pos.x,
                y: pos.y
            })
            usedPositions.add(pos.idx)
        }
    })

    return placedMonsters
}

const generateMapData = (baseConfig, genOptions) => {
    const generated = generator.generateMap(baseConfig.width, baseConfig.height, genOptions)

    // 重新放置怪物
    const visibleMonsters = placeMonsters(generated, baseConfig.visibleMonsters)

    return {
        ...baseConfig,
        ...generated,
        visibleMonsters
    }
}

// 基础配置
const baseConfigs = {
    forest: {
        id: 'forest',
        name: '迷雾森林探索区',
        parentMapId: 'forest',
        width: 200,
        height: 150,
        tileSize: 32,
        encounterRate: 0.05,
        grassEncounterBonus: 0.10,
        visibleMonsters: [
            { id: 'slime_1', monsterId: 'slime', level: 1 },
            { id: 'slime_2', monsterId: 'slime', level: 2 },
            { id: 'wolf_1', monsterId: 'wolf', level: 3 }
        ],
        hiddenMonsters: [
            { monsterId: 'slime', weight: 50, levelRange: [1, 3] },
            { monsterId: 'wolf', weight: 30, levelRange: [2, 4] },
            { monsterId: 'boar', weight: 20, levelRange: [3, 5] }
        ]
    },
    mountain: {
        id: 'mountain',
        name: '青石山探索区',
        parentMapId: 'mountain',
        width: 200,
        height: 150,
        tileSize: 32,
        encounterRate: 0.05,
        grassEncounterBonus: 0.08,
        visibleMonsters: [
            { id: 'rock_golem_1', monsterId: 'slime', level: 4 },
            { id: 'mountain_wolf_1', monsterId: 'wolf', level: 5 }
        ],
        hiddenMonsters: [
            { monsterId: 'slime', weight: 30, levelRange: [3, 5] },
            { monsterId: 'wolf', weight: 40, levelRange: [4, 6] },
            { monsterId: 'boar', weight: 30, levelRange: [5, 7] }
        ]
    },
    cave: {
        id: 'cave',
        name: '幽暗洞穴探索区',
        parentMapId: 'cave',
        width: 200,
        height: 150,
        tileSize: 32,
        encounterRate: 0.05,
        grassEncounterBonus: 0,
        visibleMonsters: [
            { id: 'cave_bat_1', monsterId: 'slime', level: 6 },
            { id: 'cave_spider_1', monsterId: 'wolf', level: 7 },
            { id: 'shadow_beast_1', monsterId: 'boar', level: 8 }
        ],
        hiddenMonsters: [
            { monsterId: 'slime', weight: 25, levelRange: [5, 8] },
            { monsterId: 'wolf', weight: 35, levelRange: [6, 9] },
            { monsterId: 'boar', weight: 40, levelRange: [7, 10] }
        ]
    }
}

/**
 * 小地图配置
 * 每个大地图对应一个小地图探索区域
 */
export const explorationMaps = {
    forest: generateMapData(baseConfigs.forest, { roomCount: 15, roomSizeRange: [6, 15] }),
    mountain: generateMapData(baseConfigs.mountain, { roomCount: 12, roomSizeRange: [8, 18], minWalkableRatio: 0.35 }),
    cave: generateMapData(baseConfigs.cave, { roomCount: 20, roomSizeRange: [5, 12] })
}

/**
 * 获取小地图配置
 * @param {string} mapId - 大地图ID
 * @returns {Object|null} 小地图配置
 */
export const getExplorationMap = (mapId) => {
    return explorationMaps[mapId] || null
}

/**
 * 获取指定位置的地形
 * @param {Object} map - 小地图配置
 * @param {number} x - X坐标
 * @param {number} y - Y坐标
 * @returns {number} 地形类型
 */
export const getTerrainAt = (map, x, y) => {
    if (!map || x < 0 || x >= map.width || y < 0 || y >= map.height) {
        return TERRAIN_TYPES.WALL
    }

    // 兼容多种格式：
    // 1. Int8Array (1D)
    // 2. 普通数组 (1D) - 从 localStorage 加载
    // 3. 2D 数组 (如果还有遗留)
    if (map.terrain instanceof Int8Array) {
        return map.terrain[y * map.width + x]
    } else if (Array.isArray(map.terrain)) {
        // 检查是1D还是2D数组
        if (Array.isArray(map.terrain[0])) {
            // 2D 数组
            return map.terrain[y][x]
        } else {
            // 1D 数组（从 localStorage 加载的格式）
            return map.terrain[y * map.width + x]
        }
    }
    return TERRAIN_TYPES.WALL
}

/**
 * 检查坐标是否可行走
 * @param {Object} map - 小地图配置
 * @param {number} x - X坐标
 * @param {number} y - Y坐标
 * @returns {boolean} 是否可行走
 */
export const isWalkable = (map, x, y) => {
    // 使用 getTerrainAt 统一访问
    const terrain = getTerrainAt(map, x, y)

    // 地面、草地、出口可行走
    return terrain === TERRAIN_TYPES.GROUND ||
        terrain === TERRAIN_TYPES.GRASS ||
        terrain === TERRAIN_TYPES.EXIT
}

/**
 * 检查坐标是否为出口
 * @param {Object} map - 小地图配置
 * @param {number} x - X坐标
 * @param {number} y - Y坐标
 * @returns {boolean} 是否为出口
 */
export const isExit = (map, x, y) => {
    const terrain = getTerrainAt(map, x, y)
    return terrain === TERRAIN_TYPES.EXIT
}

/**
 * 计算当前位置的遭遇率
 * @param {Object} map - 小地图配置
 * @param {number} x - X坐标
 * @param {number} y - Y坐标
 * @returns {number} 遭遇率 (0-1)
 */
export const getEncounterRate = (map, x, y) => {
    let rate = map.encounterRate
    const terrain = getTerrainAt(map, x, y)

    // 草地增加遭遇率
    if (terrain === TERRAIN_TYPES.GRASS) {
        rate += map.grassEncounterBonus || 0
    }

    return Math.min(rate, 1) // 最大100%
}

/**
 * 随机选择隐性怪物
 * @param {Object} map - 小地图配置
 * @returns {Object} 选中的怪物配置
 */
export const selectHiddenMonster = (map) => {
    const monsters = map.hiddenMonsters
    const totalWeight = monsters.reduce((sum, m) => sum + m.weight, 0)
    let random = Math.random() * totalWeight

    for (const monster of monsters) {
        random -= monster.weight
        if (random <= 0) {
            // 随机等级
            const level = Math.floor(
                Math.random() * (monster.levelRange[1] - monster.levelRange[0] + 1)
            ) + monster.levelRange[0]

            return {
                monsterId: monster.monsterId,
                level
            }
        }
    }

    // 默认返回第一个
    return {
        monsterId: monsters[0].monsterId,
        level: monsters[0].levelRange[0]
    }
}
