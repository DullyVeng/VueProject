/**
 * 宝箱系统配置
 * 地图中可拾取的宝箱及其奖励
 */

/**
 * 宝箱类型定义
 */
export const CHEST_TYPES = {
    WOODEN: {
        id: 'wooden',
        name: '木制宝箱',
        icon: '📦',
        rarity: 'common',
        description: '普通的木制宝箱'
    },
    IRON: {
        id: 'iron',
        name: '铁制宝箱',
        icon: '🧰',
        rarity: 'rare',
        description: '坚固的铁制宝箱'
    },
    GOLDEN: {
        id: 'golden',
        name: '黄金宝箱',
        icon: '💎',
        rarity: 'legendary',
        description: '闪耀的黄金宝箱，蕴含珍稀宝物'
    }
}

/**
 * 宝箱奖励池配置
 * 每种宝箱有不同的奖励概率表
 */
export const CHEST_LOOT_TABLES = {
    wooden: [
        // 必掉灵石
        { id: 'spiritStone', chance: 1.0, amount: [5, 15] },
        // 常见材料
        { id: 'wood', chance: 0.8, amount: [3, 8] },
        { id: 'stone', chance: 0.6, amount: [2, 5] },
        { id: 'lingcao', chance: 0.7, amount: [2, 6] },
        // 低概率装备
        { id: 'potion_hp_small', chance: 0.4, amount: [1, 3] }
    ],
    iron: [
        // 较多灵石
        { id: 'spiritStone', chance: 1.0, amount: [20, 50] },
        // 高级材料
        { id: 'iron', chance: 0.9, amount: [5, 12] },
        { id: 'qingling', chance: 0.7, amount: [3, 8] },
        { id: 'silver_ore', chance: 0.6, amount: [2, 5] },
        // 药品
        { id: 'potion_hp_small', chance: 0.8, amount: [2, 5] },
        { id: 'potion_mp_small', chance: 0.6, amount: [1, 3] },
        // 低概率稀有材料
        { id: 'dark_crystal', chance: 0.3, amount: [1, 2] }
    ],
    golden: [
        // 大量灵石
        { id: 'spiritStone', chance: 1.0, amount: [50, 120] },
        // 稀有材料
        { id: 'jade', chance: 0.8, amount: [2, 5] },
        { id: 'formationFlag', chance: 0.7, amount: [1, 3] },
        { id: 'flame_essence', chance: 0.6, amount: [1, 3] },
        { id: 'frost_lotus', chance: 0.6, amount: [2, 4] },
        { id: 'beast_core', chance: 0.5, amount: [1, 2] },
        // 药品
        { id: 'potion_hp_small', chance: 1.0, amount: [5, 10] },
        { id: 'potion_mp_small', chance: 0.9, amount: [3, 8] },
        // 建筑图纸（低概率）
        { id: 'blueprint_zhenfatang', chance: 0.1, amount: [1, 1] },
        { id: 'blueprint_cangbaoge', chance: 0.08, amount: [1, 1] },
        // 封印法宝（低概率）
        { type: 'sealed_fabao', chance: 0.15, rarity: 'rare' }
    ]
}

/**
 * 地图宝箱配置
 * 每个地图的宝箱数量和类型分布
 */
export const MAP_CHEST_CONFIGS = {
    forest: {
        mapId: 'forest',
        totalChests: 8,
        distribution: {
            wooden: 5,  // 5个木箱
            iron: 2,    // 2个铁箱
            golden: 1   // 1个金箱
        }
    },
    mountain: {
        mapId: 'mountain',
        totalChests: 10,
        distribution: {
            wooden: 5,
            iron: 3,
            golden: 2
        }
    },
    cave: {
        mapId: 'cave',
        totalChests: 12,
        distribution: {
            wooden: 6,
            iron: 4,
            golden: 2
        }
    }
}

/**
 * 生成宝箱奖励
 * @param {string} chestType - 宝箱类型
 * @returns {Array} 奖励物品列表
 */
export const generateChestLoot = (chestType) => {
    const lootTable = CHEST_LOOT_TABLES[chestType]

    if (!lootTable) {
        console.error(`未找到宝箱类型 ${chestType} 的奖励表`)
        return []
    }

    const loot = []

    for (const entry of lootTable) {
        // 概率判定
        if (Math.random() <= entry.chance) {
            const amount = Array.isArray(entry.amount)
                ? Math.floor(Math.random() * (entry.amount[1] - entry.amount[0] + 1)) + entry.amount[0]
                : entry.amount

            loot.push({
                id: entry.id,
                type: entry.type,
                rarity: entry.rarity,
                amount
            })
        }
    }

    return loot
}

/**
 * 根据地图ID获取宝箱配置
 * @param {string} mapId - 地图ID
 * @returns {Object|null} 宝箱配置
 */
export const getChestConfig = (mapId) => {
    return MAP_CHEST_CONFIGS[mapId] || null
}

/**
 * 获取宝箱类型配置
 * @param {string} typeId - 宝箱类型ID
 * @returns {Object|null} 宝箱类型
 */
export const getChestType = (typeId) => {
    return CHEST_TYPES[typeId.toUpperCase()] || null
}
