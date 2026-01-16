/**
 * 每日任务配置
 * v1.2 - 经验翻倍 + 采集任务
 */
import { monsters } from './monsters'
import { items } from './items'

// 任务类型枚举
export const DailyTaskType = {
    KILL_MONSTERS: 'kill_monsters',      // 击杀怪物
    COMPLETE_BATTLES: 'complete_battles', // 完成战斗
    ENHANCE_FABAO: 'enhance_fabao',       // 强化法宝
    COLLECT_ITEMS: 'collect_items',       // 采集材料
    KILL_BOSS: 'kill_boss'                // 击败BOSS
}

// 采集物品池分级
const collectableItems = {
    low: [
        { id: 'lingcao', name: '灵草', price: 5 },
        { id: 'iron_ore', name: '铁矿石', price: 3 }
    ],
    mid: [
        { id: 'qingling', name: '青灵草', price: 15 },
        { id: 'silver_ore', name: '银矿石', price: 12 },
        { id: 'dark_crystal', name: '暗影水晶', price: 25 }
    ],
    high: [
        { id: 'frost_lotus', name: '寒冰莲', price: 80 },
        { id: 'flame_essence', name: '火焰精华', price: 100 },
        { id: 'beast_core', name: '妖兽内丹', price: 150 }
    ]
}

// 任务模板配置
export const taskTemplates = [
    {
        type: DailyTaskType.KILL_MONSTERS,
        weight: 35,  // 权重35%
        minLevel: 1
    },
    {
        type: DailyTaskType.COMPLETE_BATTLES,
        weight: 25,
        minLevel: 1
    },
    {
        type: DailyTaskType.ENHANCE_FABAO,
        weight: 15,
        minLevel: 5
    },
    {
        type: DailyTaskType.COLLECT_ITEMS,
        weight: 15,
        minLevel: 1
    },
    {
        type: DailyTaskType.KILL_BOSS,
        weight: 10,
        minLevel: 20
    }
]

// ============= 奖励计算（v1.2 翻倍） =============

/**
 * 计算单任务经验奖励
 * 公式：等级 × 8 × 难度系数，±20%随机浮动（已翻倍）
 */
export function calculateExpReward(playerLevel, difficulty = 1.0) {
    const baseExp = Math.floor(playerLevel * 8 * difficulty)  // v1.2: ×4 → ×8
    const variance = Math.floor(baseExp * 0.2)
    return baseExp + Math.floor(Math.random() * variance * 2) - variance
}

/**
 * 计算单任务灵石奖励
 * 公式：等级 × 4 × 难度系数，±20%随机浮动（已翻倍）
 */
export function calculateSilverReward(playerLevel, difficulty = 1.0) {
    const baseSilver = Math.floor(playerLevel * 4 * difficulty)  // v1.2: ×2 → ×4
    const variance = Math.floor(baseSilver * 0.2)
    return baseSilver + Math.floor(Math.random() * variance * 2) - variance
}

/**
 * 计算全完成奖励（已翻倍）
 */
export function calculateAllCompleteBonus(playerLevel) {
    return {
        exp: Math.floor(playerLevel * 10),    // v1.2: ×5 → ×10
        silver: Math.floor(playerLevel * 6)    // v1.2: ×3 → ×6
    }
}

// 难度系数映射
const difficultyMap = {
    [DailyTaskType.KILL_MONSTERS]: 1.0,
    [DailyTaskType.COMPLETE_BATTLES]: 0.8,
    [DailyTaskType.ENHANCE_FABAO]: 1.0,
    [DailyTaskType.COLLECT_ITEMS]: 1.0,  // 基础，会根据物品等级调整
    [DailyTaskType.KILL_BOSS]: 1.5
}

// ============= 任务生成 =============

/**
 * 获取可用怪物列表（基于玩家等级）
 */
function getAvailableMonsters(playerLevel) {
    const minLevel = Math.max(1, playerLevel - 20)
    const maxLevel = playerLevel + 10
    return monsters.filter(m => m.level >= minLevel && m.level <= maxLevel)
}

/**
 * 生成击杀任务
 */
function generateKillTask(playerLevel) {
    const availableMonsters = getAvailableMonsters(playerLevel)
    if (availableMonsters.length === 0) {
        return generateGenericKillTask(playerLevel)
    }

    const monster = availableMonsters[Math.floor(Math.random() * availableMonsters.length)]

    // 数量：基础5 + 等级/10，±30%随机
    const baseCount = 5 + Math.floor(playerLevel / 10)
    const variance = Math.floor(baseCount * 0.3)
    const count = Math.max(3, baseCount + Math.floor(Math.random() * variance * 2) - variance)

    const difficulty = difficultyMap[DailyTaskType.KILL_MONSTERS]

    return {
        id: `daily_kill_${monster.id}_${Date.now()}`,
        name: `猎杀${monster.name}`,
        description: `击败${count}只${monster.name}`,
        type: DailyTaskType.KILL_MONSTERS,
        target: monster.id,
        current: 0,
        required: count,
        claimed: false,
        rewards: {
            exp: calculateExpReward(playerLevel, difficulty),
            silver: calculateSilverReward(playerLevel, difficulty)
        }
    }
}

/**
 * 生成通用击杀任务（无指定怪物）
 */
function generateGenericKillTask(playerLevel) {
    const baseCount = 8 + Math.floor(playerLevel / 8)
    const variance = Math.floor(baseCount * 0.3)
    const count = Math.max(5, baseCount + Math.floor(Math.random() * variance * 2) - variance)

    const difficulty = difficultyMap[DailyTaskType.KILL_MONSTERS]

    return {
        id: `daily_kill_any_${Date.now()}`,
        name: '日常历练',
        description: `击败${count}只妖兽`,
        type: DailyTaskType.KILL_MONSTERS,
        target: 'any',
        current: 0,
        required: count,
        claimed: false,
        rewards: {
            exp: calculateExpReward(playerLevel, difficulty),
            silver: calculateSilverReward(playerLevel, difficulty)
        }
    }
}

/**
 * 生成战斗任务
 */
function generateBattleTask(playerLevel) {
    const baseCount = 3 + Math.floor(playerLevel / 20)
    const count = Math.min(8, baseCount)

    const difficulty = difficultyMap[DailyTaskType.COMPLETE_BATTLES]

    return {
        id: `daily_battle_${Date.now()}`,
        name: '战场老兵',
        description: `完成${count}场战斗胜利`,
        type: DailyTaskType.COMPLETE_BATTLES,
        target: 'win',
        current: 0,
        required: count,
        claimed: false,
        rewards: {
            exp: calculateExpReward(playerLevel, difficulty),
            silver: calculateSilverReward(playerLevel, difficulty)
        }
    }
}

/**
 * 生成强化任务
 */
function generateEnhanceTask(playerLevel) {
    const baseCount = 2 + Math.floor(playerLevel / 25)
    const count = Math.min(5, baseCount)

    const difficulty = difficultyMap[DailyTaskType.ENHANCE_FABAO]

    return {
        id: `daily_enhance_${Date.now()}`,
        name: '法宝精进',
        description: `强化法宝${count}次`,
        type: DailyTaskType.ENHANCE_FABAO,
        target: 'any',
        current: 0,
        required: count,
        claimed: false,
        rewards: {
            exp: calculateExpReward(playerLevel, difficulty),
            silver: calculateSilverReward(playerLevel, difficulty)
        }
    }
}

/**
 * 生成采集任务（v1.2新增）
 */
function generateCollectTask(playerLevel) {
    // 根据等级确定可采集的物品等级
    let tier = 'low'
    if (playerLevel >= 30) {
        tier = Math.random() < 0.5 ? 'mid' : 'low'
    }
    if (playerLevel >= 50) {
        tier = Math.random() < 0.3 ? 'high' : (Math.random() < 0.5 ? 'mid' : 'low')
    }

    // 从对应等级随机选物品
    const tierItems = collectableItems[tier]
    const item = tierItems[Math.floor(Math.random() * tierItems.length)]

    // 数量根据物品等级反比：高级少，低级多
    const baseCount = tier === 'high' ? 3 : tier === 'mid' ? 6 : 10
    const variance = Math.floor(baseCount * 0.3)
    const count = Math.max(2, baseCount + Math.floor(Math.random() * variance * 2) - variance)

    // 难度系数根据物品等级：高级物品难度高，奖励丰厚
    const tierDifficulty = tier === 'high' ? 1.5 : tier === 'mid' ? 1.1 : 0.9

    return {
        id: `daily_collect_${item.id}_${Date.now()}`,
        name: `采集${item.name}`,
        description: `采集${count}个${item.name}`,
        type: DailyTaskType.COLLECT_ITEMS,
        target: item.id,
        current: 0,
        required: count,
        claimed: false,
        rewards: {
            exp: calculateExpReward(playerLevel, tierDifficulty),
            silver: calculateSilverReward(playerLevel, tierDifficulty)
        }
    }
}

/**
 * 生成BOSS任务
 */
function generateBossTask(playerLevel) {
    const difficulty = difficultyMap[DailyTaskType.KILL_BOSS]

    return {
        id: `daily_boss_${Date.now()}`,
        name: 'BOSS挑战',
        description: '击败1只地图BOSS',
        type: DailyTaskType.KILL_BOSS,
        target: 'boss',
        current: 0,
        required: 1,
        claimed: false,
        rewards: {
            exp: calculateExpReward(playerLevel, difficulty),
            silver: calculateSilverReward(playerLevel, difficulty)
        }
    }
}

// 任务生成器映射
const taskGenerators = {
    [DailyTaskType.KILL_MONSTERS]: generateKillTask,
    [DailyTaskType.COMPLETE_BATTLES]: generateBattleTask,
    [DailyTaskType.ENHANCE_FABAO]: generateEnhanceTask,
    [DailyTaskType.COLLECT_ITEMS]: generateCollectTask,
    [DailyTaskType.KILL_BOSS]: generateBossTask
}

/**
 * 生成今日全部任务
 * @param {number} playerLevel 玩家等级
 * @param {number} taskCount 任务数量，默认4
 */
export function generateDailyTasks(playerLevel, taskCount = 4) {
    // 筛选符合等级的任务模板
    const availableTemplates = taskTemplates.filter(t => playerLevel >= t.minLevel)

    // 按权重随机选择
    const selectedTypes = []
    const usedTypes = new Set()

    while (selectedTypes.length < taskCount && selectedTypes.length < availableTemplates.length) {
        const template = weightedRandomSelect(availableTemplates.filter(t => !usedTypes.has(t.type)))
        if (template) {
            selectedTypes.push(template.type)
            usedTypes.add(template.type)
        }
    }

    // 如果还不够，允许重复击杀任务和采集任务
    while (selectedTypes.length < taskCount) {
        if (Math.random() < 0.6) {
            selectedTypes.push(DailyTaskType.KILL_MONSTERS)
        } else {
            selectedTypes.push(DailyTaskType.COLLECT_ITEMS)
        }
    }

    // 生成任务
    return selectedTypes.map(type => {
        const generator = taskGenerators[type]
        return generator(playerLevel)
    })
}

/**
 * 按权重随机选择
 */
function weightedRandomSelect(templates) {
    if (templates.length === 0) return null

    const totalWeight = templates.reduce((sum, t) => sum + t.weight, 0)
    let random = Math.random() * totalWeight

    for (const template of templates) {
        random -= template.weight
        if (random <= 0) return template
    }

    return templates[templates.length - 1]
}
