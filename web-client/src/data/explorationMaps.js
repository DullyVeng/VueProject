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

/**
 * 小地图配置
 * 每个大地图对应一个小地图探索区域
 */
export const explorationMaps = {
    // 迷雾森林探索地图
    forest: {
        id: 'forest',
        name: '迷雾森林探索区',
        parentMapId: 'forest',        // 关联大地图ID
        width: 200,                   // 地图宽度（格数）
        height: 150,                  // 地图高度（格数）
        tileSize: 32,                 // 每格像素大小
        encounterRate: 0.15,          // 基础隐性遭遇率 (15%)
        grassEncounterBonus: 0.10,    // 草地额外遭遇率加成

        // 地形数据 (二维数组，使用 TERRAIN_TYPES 常量)
        // 0=地面, 1=墙壁, 2=障碍物, 4=草地, 9=出口
        terrain: [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [9, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 4, 4, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 4, 4, 0, 0, 1],
            [1, 0, 4, 4, 4, 4, 0, 0, 2, 0, 0, 0, 0, 0, 4, 4, 4, 4, 0, 1],
            [1, 0, 0, 4, 4, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 4, 4, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1],
            [1, 0, 0, 4, 4, 0, 0, 2, 0, 0, 0, 0, 0, 4, 4, 4, 0, 0, 0, 1],
            [1, 0, 4, 4, 4, 4, 0, 0, 0, 0, 0, 0, 4, 4, 4, 4, 4, 0, 0, 1],
            [1, 0, 0, 4, 4, 0, 0, 0, 0, 2, 0, 0, 0, 4, 4, 4, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 9],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
        ],

        // 玩家出生点
        spawnPoint: { x: 100, y: 75 },  // 地图中心

        // 显性怪物（地图上可见的怪物）
        visibleMonsters: [
            { id: 'slime_1', monsterId: 'slime', x: 50, y: 30, level: 1 },
            { id: 'slime_2', monsterId: 'slime', x: 150, y: 100, level: 2 },
            { id: 'wolf_1', monsterId: 'wolf', x: 80, y: 120, level: 3 }
        ],

        // 隐性怪物池（随机遭遇时从中选择）
        hiddenMonsters: [
            { monsterId: 'slime', weight: 50, levelRange: [1, 3] },
            { monsterId: 'wolf', weight: 30, levelRange: [2, 4] },
            { monsterId: 'boar', weight: 20, levelRange: [3, 5] }
        ]
    },

    // 青石山探索地图
    mountain: {
        id: 'mountain',
        name: '青石山探索区',
        parentMapId: 'mountain',
        width: 200,
        height: 150,
        tileSize: 32,
        encounterRate: 0.18,
        grassEncounterBonus: 0.08,

        terrain: [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [9, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
            [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 9],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
        ],

        spawnPoint: { x: 100, y: 75 },

        visibleMonsters: [
            { id: 'rock_golem_1', monsterId: 'slime', x: 60, y: 50, level: 4 },
            { id: 'mountain_wolf_1', monsterId: 'wolf', x: 140, y: 90, level: 5 }
        ],

        hiddenMonsters: [
            { monsterId: 'slime', weight: 30, levelRange: [3, 5] },
            { monsterId: 'wolf', weight: 40, levelRange: [4, 6] },
            { monsterId: 'boar', weight: 30, levelRange: [5, 7] }
        ]
    },

    // 幽暗洞穴探索地图
    cave: {
        id: 'cave',
        name: '幽暗洞穴探索区',
        parentMapId: 'cave',
        width: 200,
        height: 150,
        tileSize: 32,
        encounterRate: 0.22,          // 洞穴遭遇率更高
        grassEncounterBonus: 0,

        terrain: [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [9, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1],
            [1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
            [1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 1],
            [1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1],
            [1, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 1],
            [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 9],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
        ],

        spawnPoint: { x: 100, y: 75 },

        visibleMonsters: [
            { id: 'cave_bat_1', monsterId: 'slime', x: 50, y: 30, level: 6 },
            { id: 'cave_spider_1', monsterId: 'wolf', x: 150, y: 80, level: 7 },
            { id: 'shadow_beast_1', monsterId: 'boar', x: 80, y: 110, level: 8 }
        ],

        hiddenMonsters: [
            { monsterId: 'slime', weight: 25, levelRange: [5, 8] },
            { monsterId: 'wolf', weight: 35, levelRange: [6, 9] },
            { monsterId: 'boar', weight: 40, levelRange: [7, 10] }
        ]
    }
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
 * 检查坐标是否可行走
 * @param {Object} map - 小地图配置
 * @param {number} x - X坐标
 * @param {number} y - Y坐标
 * @returns {boolean} 是否可行走
 */
export const isWalkable = (map, x, y) => {
    // 边界检查
    if (x < 0 || x >= map.width || y < 0 || y >= map.height) {
        return false
    }

    const terrain = map.terrain[y][x]
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
    if (x < 0 || x >= map.width || y < 0 || y >= map.height) {
        return false
    }
    return map.terrain[y][x] === TERRAIN_TYPES.EXIT
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

    // 草地增加遭遇率
    if (map.terrain[y]?.[x] === TERRAIN_TYPES.GRASS) {
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
