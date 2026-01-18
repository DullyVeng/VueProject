/**
 * 精英怪系统配置
 * 用于生成带有特殊词条的强化怪物
 */
import { getMonsterById } from './monsters.js'

/**
 * 精英怪前缀词条
 * 每个词条提供不同的属性加成
 */
export const ELITE_PREFIXES = {
    berserker: {
        id: 'berserker',
        name: '狂暴的',
        modifiers: {
            attack: 1.8,    // 攻击力 +80%
            defense: 0.9,   // 防御力 -10%
            hp: 1.2         // 生命值 +20%
        },
        description: '狂暴状态，攻击力大幅提升但防御下降'
    },
    resilient: {
        id: 'resilient',
        name: '坚韧的',
        modifiers: {
            hp: 2.5,        // 生命值 +150%
            defense: 1.5,   // 防御力 +50%
            attack: 0.8     // 攻击力 -20%
        },
        description: '拥有超强耐久度，难以击败'
    },
    swift: {
        id: 'swift',
        name: '迅捷的',
        modifiers: {
            attack: 1.4,    // 攻击力 +40%
            hp: 1.3,        // 生命值 +30%
            defense: 1.0    // 防御力不变
        },
        description: '速度极快，攻击密集'
    },
    venomous: {
        id: 'venomous',
        name: '毒性的',
        modifiers: {
            attack: 1.6,    // 攻击力 +60%
            hp: 1.4,        // 生命值 +40%
            defense: 1.1    // 防御力 +10%
        },
        description: '每次攻击附带剧毒伤害',
        specialEffect: 'poison'
    },
    arcane: {
        id: 'arcane',
        name: '奥术的',
        modifiers: {
            attack: 1.5,    // 攻击力 +50%
            hp: 1.6,        // 生命值 +60%
            defense: 1.3    // 防御力 +30%
        },
        description: '被奥术能量强化'
    }
}

/**
 * 生成精英怪物
 * @param {string} baseMonsterId - 基础怪物ID
 * @param {number} level - 等级
 * @param {string} prefixId - 前缀ID（可选，不传则随机）
 * @returns {Object} 精英怪物数据
 */
export const generateEliteMonster = (baseMonsterId, level, prefixId = null) => {
    const baseMonster = getMonsterById(baseMonsterId)

    if (!baseMonster) {
        console.error(`未找到基础怪物: ${baseMonsterId}`)
        return null
    }

    // 随机选择前缀（如果未指定）
    const prefix = prefixId
        ? ELITE_PREFIXES[prefixId]
        : getRandomPrefix()

    if (!prefix) {
        console.error(`未找到前缀: ${prefixId}`)
        return null
    }

    // 基础属性倍率（精英怪基础加成）
    const baseMultipliers = {
        hp: 2.0,
        attack: 1.5,
        defense: 1.3
    }

    // 合并前缀词条倍率
    const finalHp = Math.floor(baseMonster.hp * baseMultipliers.hp * prefix.modifiers.hp)
    const finalAttack = Math.floor(baseMonster.attack * baseMultipliers.attack * prefix.modifiers.attack)
    const finalDefense = Math.floor((baseMonster.defense || 0) * baseMultipliers.defense * prefix.modifiers.defense)

    // 奖励倍率（用户要求：5倍）
    const rewardMultiplier = 5
    const finalExpReward = Math.floor(baseMonster.expReward * rewardMultiplier)
    const finalSilverReward = Math.floor(baseMonster.silverReward * rewardMultiplier)

    return {
        ...baseMonster,
        id: `elite_${baseMonsterId}_${prefix.id}`,
        name: `${prefix.name}${baseMonster.name}`,
        isElite: true,
        prefix: prefix.id,
        prefixData: prefix,
        level,
        hp: finalHp,
        max_hp: finalHp,
        attack: finalAttack,
        defense: finalDefense,
        expReward: finalExpReward,
        silverReward: finalSilverReward,
        // 保留基础怪物的掉落，但数量可能更多
        drops: baseMonster.drops ? baseMonster.drops.map(drop => ({
            ...drop,
            chance: Math.min(drop.chance * 1.5, 0.95), // 掉落概率提升50%，最高95%
            amount: drop.amount.map(a => Math.floor(a * 1.5)) // 掉落数量提升50%
        })) : []
    }
}

/**
 * 随机选择一个前缀
 * @returns {Object} 前缀对象
 */
const getRandomPrefix = () => {
    const prefixes = Object.values(ELITE_PREFIXES)
    return prefixes[Math.floor(Math.random() * prefixes.length)]
}

/**
 * 获取所有前缀列表
 * @returns {Array} 前缀数组
 */
export const getAllPrefixes = () => {
    return Object.values(ELITE_PREFIXES)
}

/**
 * 根据ID获取前缀
 * @param {string} prefixId - 前缀ID
 * @returns {Object|null} 前缀对象
 */
export const getPrefixById = (prefixId) => {
    return ELITE_PREFIXES[prefixId] || null
}
