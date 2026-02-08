import { DiggerMapGenerator } from '../utils/mapGenerator.js'
import { generateEliteMonster } from './eliteMonsters.js'
import { generateBoss } from './mapBosses.js'
import { getChestConfig, CHEST_TYPES } from './chests.js'

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

/**
 * 通用避障算法：在可行走区域放置物体
 * @param {Object} map - 地图数据
 * @param {number} count - 要放置的数量
 * @param {Set} usedPositions - 已使用位置集合
 * @param {Object} options - 额外选项 { minNeighbors: 0, minDistanceFrom: {x,y,dist} }
 * @returns {Array} 有效位置数组 [{x, y}]
 */
const placeOnValidGround = (map, count, usedPositions = new Set(), options = {}) => {
    const positions = []
    let attempts = 0
    const maxAttempts = 2000
    const { minNeighbors = 0, minDistanceFrom = null } = options

    while (positions.length < count && attempts < maxAttempts) {
        const x = Math.floor(Math.random() * map.width)
        const y = Math.floor(Math.random() * map.height)
        const idx = y * map.width + x

        // 1. 基础地形检查
        const terrain = map.terrain[idx]
        const isBaseValid = (terrain === TERRAIN_TYPES.GROUND || terrain === TERRAIN_TYPES.GRASS) &&
                           !(x === map.spawnPoint.x && y === map.spawnPoint.y) &&
                           !usedPositions.has(idx)

        if (isBaseValid) {
            let isValid = true

            // 2. 检查周围邻居（开阔度检查），防止生成在墙角
            if (minNeighbors > 0) {
                // Simpler check for Boss: neighbors must be walkable
                const neighbors = [
                    {dx:-1, dy:-1}, {dx:0, dy:-1}, {dx:1, dy:-1},
                    {dx:-1, dy:0},                  {dx:1, dy:0},
                    {dx:-1, dy:1},  {dx:0, dy:1},  {dx:1, dy:1}
                ]
                let walkableCount = 0
                neighbors.forEach(n => {
                    const nx = x + n.dx, ny = y + n.dy
                    if (nx >= 0 && nx < map.width && ny >= 0 && ny < map.height) {
                        const nt = map.terrain[ny * map.width + nx]
                        if (nt === TERRAIN_TYPES.GROUND || nt === TERRAIN_TYPES.GRASS) walkableCount++
                    }
                })
                if (walkableCount < minNeighbors) isValid = false
            }

            // 3. 距离检查
            if (isValid && minDistanceFrom) {
                const dist = Math.abs(x - minDistanceFrom.x) + Math.abs(y - minDistanceFrom.y)
                if (dist < minDistanceFrom.dist) isValid = false
            }

            if (isValid) {
                positions.push({ x, y })
                usedPositions.add(idx)
            }
        }
        attempts++
    }

    // 如果高要求失败，降级重试一次（保证一定能生成）
    if (positions.length < count && minNeighbors > 0) {
        return [...positions, ...placeOnValidGround(map, count - positions.length, usedPositions, { ...options, minNeighbors: 0 })]
    }

    return positions
}

// 辅助函数：为生成的地图放置精英怪
const placeEliteMonsters = (map, eliteConfigs) => {
    const usedPositions = new Set()
    const positions = placeOnValidGround(map, eliteConfigs.length, usedPositions)

    return eliteConfigs.map((config, index) => {
        if (positions[index]) {
            const elite = generateEliteMonster(config.baseMonsterId, config.level, config.prefix)
            return {
                ...elite,
                id: `elite_${index}`,
                x: positions[index].x,
                y: positions[index].y
            }
        }
        return null
    }).filter(m => m !== null)
}

// 辅助函数：放置 BOSS（单个）
const placeBoss = (map, mapId, usedPositions) => {
    const boss = generateBoss(mapId)
    if (!boss) return null

    // BOSS 要求最高：周围至少 8 个格子都是平地（绝对不靠墙），且距离出生点至少 30 格
    const positions = placeOnValidGround(map, 1, usedPositions, { 
        minNeighbors: 8, 
        minDistanceFrom: { x: map.spawnPoint.x, y: map.spawnPoint.y, dist: 30 }
    })
    
    if (positions.length > 0) {
        return {
            ...boss,
            x: positions[0].x,
            y: positions[0].y
        }
    }
    return null
}

// 辅助函数：放置宝箱
const placeChests = (map, mapId, usedPositions) => {
    const chestConfig = getChestConfig(mapId)
    if (!chestConfig) return []

    const chests = []
    const { distribution } = chestConfig

    // 按类型放置宝箱
    Object.entries(distribution).forEach(([type, count]) => {
        const positions = placeOnValidGround(map, count, usedPositions)
        positions.forEach((pos, index) => {
            chests.push({
                id: `${type}_chest_${index}`,
                type,
                typeData: CHEST_TYPES[type.toUpperCase()],
                x: pos.x,
                y: pos.y,
                opened: false
            })
        })
    })

    return chests
}

const generateMapData = (baseConfig, genOptions) => {
    const generated = generator.generateMap(baseConfig.width, baseConfig.height, genOptions)
    const usedPositions = new Set()

    // 放置精英怪（替代原有显性怪物）
    const visibleMonsters = placeEliteMonsters(generated, baseConfig.eliteMonsters)

    // 放置 BOSS
    const boss = placeBoss(generated, baseConfig.id, usedPositions)

    // 放置宝箱
    const chests = placeChests(generated, baseConfig.id, usedPositions)

    return {
        ...baseConfig,
        ...generated,
        visibleMonsters,
        boss,
        chests
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
        // 精英怪配置
        eliteMonsters: [
            { baseMonsterId: 'slime', level: 2, prefix: 'swift' },
            { baseMonsterId: 'slime', level: 3, prefix: 'venomous' },
            { baseMonsterId: 'wolf', level: 5, prefix: 'berserker' }
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
        // 精英怪配置
        eliteMonsters: [
            { baseMonsterId: 'wolf', level: 8, prefix: 'resilient' },
            { baseMonsterId: 'goblin', level: 10, prefix: 'berserker' }
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
        // 精英怪配置
        eliteMonsters: [
            { baseMonsterId: 'wolf', level: 12, prefix: 'arcane' },
            { baseMonsterId: 'goblin', level: 15, prefix: 'venomous' },
            { baseMonsterId: 'dark_cultist', level: 18, prefix: 'swift' }
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
