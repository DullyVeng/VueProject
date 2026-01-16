// 境界突破条件配置
// 定义从一个境界突破到下一个境界的条件

import { PLAYER_REALMS } from './playerRealms'

/**
 * 境界突破条件配置
 */
export const REALM_REQUIREMENTS = {
    // 炼气 → 筑基
    zhuji: {
        fromRealm: 'lianqi',
        fromRealmLevel: 9,      // 炼气期需要满级（9层）
        requiredLevel: 100,      // 角色等级要求100级
        silverCost: 1000,        // 消耗1000灵石
        requiredQuest: 'quest_realm_zhuji',  // 需要完成筑基任务
        unlocks: ['识海系统', '功法系统'],
        description: '筑基固本，开启识海，踏入修仙正途'
    },

    // 筑基 → 金丹
    jindan: {
        fromRealm: 'zhuji',
        fromRealmLevel: 9,
        requiredLevel: 180,      // 90 + 90
        silverCost: 5000,
        requiredQuest: 'quest_realm_jindan',
        unlocks: ['丹田系统', '法宝系统'],
        description: '凝聚金丹，开启丹田，法宝初成'
    },

    // 金丹 → 元婴
    yuanying: {
        fromRealm: 'jindan',
        fromRealmLevel: 9,
        requiredLevel: 270,      // 180 + 90
        silverCost: 10000,
        requiredQuest: 'quest_realm_yuanying',
        unlocks: ['法宝温养机制'],
        description: '元婴出窍，法宝温养，实力大增'
    },

    // 元婴 → 化神
    huashen: {
        fromRealm: 'yuanying',
        fromRealmLevel: 9,
        requiredLevel: 360,      // 270 + 90
        silverCost: 20000,
        requiredQuest: null,  // 暂无任务要求
        unlocks: ['功法进化', '双系功法'],
        description: '神魂蜕变，功法进阶，迈入大能之列'
    }
}

/**
 * 获取境界突破条件
 * @param {string} targetRealm - 目标境界key
 * @returns {object|null}
 */
export const getRealmRequirement = (targetRealm) => {
    return REALM_REQUIREMENTS[targetRealm] || null
}

/**
 * 检查是否满足境界突破条件
 * @param {object} character - 角色数据
 * @param {string} targetRealm - 目标境界key
 * @param {array} completedQuestIds - 已完成的任务ID列表
 * @returns {object} { canAdvance: boolean, reasons: string[] }
 */
export const canAdvanceRealm = (character, targetRealm, completedQuestIds = []) => {
    const requirement = getRealmRequirement(targetRealm)

    if (!requirement) {
        return {
            canAdvance: false,
            reasons: ['未知的目标境界']
        }
    }

    const reasons = []

    // 检查当前境界
    if (character.realm !== requirement.fromRealm) {
        const currentRealmName = PLAYER_REALMS[character.realm]?.name || character.realm
        const requiredRealmName = PLAYER_REALMS[requirement.fromRealm]?.name || requirement.fromRealm
        reasons.push(`当前境界不符（需要：${requiredRealmName}，当前：${currentRealmName}）`)
    }

    // 检查境界等级
    if (character.realm_level < requirement.fromRealmLevel) {
        reasons.push(`境界等级不足（需要：${requirement.fromRealmLevel}级，当前：${character.realm_level}级）`)
    }

    // 检查角色等级
    if (character.level < requirement.requiredLevel) {
        reasons.push(`角色等级不足（需要：${requirement.requiredLevel}级，当前：${character.level}级）`)
    }

    // 检查灵石
    if (character.silver < requirement.silverCost) {
        reasons.push(`灵石不足（需要：${requirement.silverCost}，当前：${character.silver}）`)
    }

    // 检查前置任务
    if (requirement.requiredQuest) {
        if (!completedQuestIds.includes(requirement.requiredQuest)) {
            reasons.push(`需要完成任务：${requirement.requiredQuest}`)
        }
    }

    return {
        canAdvance: reasons.length === 0,
        reasons
    }
}

/**
 * 获取下一个可突破的境界
 * @param {string} currentRealm - 当前境界key
 * @returns {string|null}
 */
export const getNextRealm = (currentRealm) => {
    const currentConfig = PLAYER_REALMS[currentRealm]
    if (!currentConfig) return null

    const nextLevel = currentConfig.level + 1
    const nextEntry = Object.entries(PLAYER_REALMS).find(([_, realm]) => realm.level === nextLevel)

    return nextEntry ? nextEntry[0] : null
}
