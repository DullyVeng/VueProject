/**
 * 地图 BOSS 系统配置
 * 每个小地图对应一个固定 BOSS
 */
import { getMonsterById } from './monsters.js'

/**
 * BOSS 基础配置
 * 每个地图一个 BOSS，24小时刷新机制
 */
export const MAP_BOSSES = {
    forest: {
        id: 'forest_king',
        mapId: 'forest',
        name: '迷雾森林王',
        baseMonsterId: 'wolf', // 基于森林狼
        level: 10,
        description: '盘踞迷雾森林深处的妖兽之王，统御着整片森林的妖兽',
        model: '🐺👑',
        // BOSS 属性倍率
        multipliers: {
            hp: 5.0,
            attack: 3.0,
            defense: 2.5
        },
        // 特殊掉落
        drops: [
            { id: 'spiritStone', chance: 1.0, amount: [50, 100] }, // 必掉大量灵石
            { id: 'beast_core', chance: 0.8, amount: [1, 2] },     // 妖兽内丹
            { id: 'wood', chance: 0.9, amount: [10, 20] },
            // 稀有掉落（暂时注释，等待实现）
            // { type: 'sealed_fabao', chance: 0.3, rarity: 'rare' }, // 30% 封印法宝
            { id: 'blueprint_zhenfatang', chance: 0.15, amount: [1, 1] } // 15% 建筑图纸
        ],
        respawnHours: 24
    },
    mountain: {
        id: 'mountain_lord',
        mapId: 'mountain',
        name: '青石山主',
        baseMonsterId: 'stone_golem',
        level: 20,
        description: '青石山脉的守护者，传说由山脉灵气凝聚而成',
        model: '🗿👑',
        multipliers: {
            hp: 5.0,
            attack: 3.0,
            defense: 3.0 // 山主防御更高
        },
        drops: [
            { id: 'spiritStone', chance: 1.0, amount: [100, 200] },
            { id: 'stone', chance: 1.0, amount: [15, 30] },
            { id: 'iron', chance: 0.9, amount: [10, 20] },
            { id: 'jade', chance: 0.6, amount: [1, 3] },
            // { type: 'sealed_fabao', chance: 0.35, rarity: 'epic' },
            { id: 'blueprint_cangbaoge', chance: 0.15, amount: [1, 1] }
        ],
        respawnHours: 24
    },
    cave: {
        id: 'cave_demon',
        mapId: 'cave',
        name: '幽暗洞穴魔君',
        baseMonsterId: 'void_demon',
        level: 30,
        description: '洞穴深处的魔道强者，吞噬无数修士的恐怖存在',
        model: '👹👑',
        multipliers: {
            hp: 5.0,
            attack: 3.5, // 魔君攻击最高
            defense: 2.5
        },
        drops: [
            { id: 'spiritStone', chance: 1.0, amount: [150, 300] },
            { id: 'dark_crystal', chance: 1.0, amount: [5, 10] },
            { id: 'formationFlag', chance: 0.7, amount: [2, 5] },
            // { type: 'sealed_fabao', chance: 0.4, rarity: 'legendary' },
            { id: 'blueprint_julingzhen', chance: 0.2, amount: [1, 1] },
            { id: 'blueprint_hushandazhen', chance: 0.1, amount: [1, 1] }
        ],
        respawnHours: 24
    }
}

/**
 * 生成 BOSS 实例
 * @param {string} mapId - 地图ID
 * @returns {Object|null} BOSS 实例数据
 */
export const generateBoss = (mapId) => {
    const bossConfig = MAP_BOSSES[mapId]

    if (!bossConfig) {
        console.error(`未找到地图 ${mapId} 的 BOSS 配置`)
        return null
    }

    const baseMonster = getMonsterById(bossConfig.baseMonsterId)

    if (!baseMonster) {
        console.error(`BOSS ${bossConfig.id} 的基础怪物 ${bossConfig.baseMonsterId} 不存在`)
        return null
    }

    // 计算 BOSS 属性
    const hp = Math.floor(baseMonster.hp * bossConfig.multipliers.hp)
    const attack = Math.floor(baseMonster.attack * bossConfig.multipliers.attack)
    const defense = Math.floor((baseMonster.defense || 0) * bossConfig.multipliers.defense)

    // 经验和灵石奖励（基础 x10）
    const expReward = Math.floor(baseMonster.expReward * 10)
    const silverReward = Math.floor(baseMonster.silverReward * 10)

    const bossData = {
        id: bossConfig.id,
        name: bossConfig.name,
        model: bossConfig.model,
        description: bossConfig.description,
        isBoss: true,
        level: bossConfig.level,
        // 直接在顶层定义属性，不要嵌套
        hp,
        max_hp: hp,
        attack,
        defense,
        expReward,
        silverReward,
        type: baseMonster.type,
        attackPreference: baseMonster.attackPreference || { fabao: 0.5, player: 0.5 },
        drops: bossConfig.drops
    }

    console.log('[BOSS生成] 最终数据:', bossData)
    return bossData
}

/**
 * 根据地图ID获取 BOSS 配置
 * @param {string} mapId - 地图ID
 * @returns {Object|null} BOSS 配置
 */
export const getBossConfig = (mapId) => {
    return MAP_BOSSES[mapId] || null
}

/**
 * 获取所有 BOSS 列表
 * @returns {Array} BOSS 配置数组
 */
export const getAllBosses = () => {
    return Object.values(MAP_BOSSES)
}
