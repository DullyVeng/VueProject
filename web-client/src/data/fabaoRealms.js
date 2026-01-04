// 法宝境界配置
// 定义法宝境界系统的各项参数

export const FABAO_REALMS = {
    凡器: {
        name: '凡器',
        level: 1,
        canNourish: false,
        canEnhance: false,
        maxEnhanceLevel: 0,
        description: '可装备入丹田，基础生命与技能，无法温养进化',
        color: '#9E9E9E',
        unlockRequirement: null
    },

    灵器: {
        name: '灵器',
        level: 2,
        canNourish: true,
        canEnhance: true,
        maxEnhanceLevel: 2,
        description: '可温养，解锁基础温养属性加成',
        color: '#4CAF50',
        unlockRequirement: {
            playerRealm: 'lianqi',
            playerLevel: 1
        },
        nourishConfig: {
            baseEfficiency: 1.0,
            maxLevel: 10
        }
    },

    真器: {
        name: '真器',
        level: 3,
        canNourish: true,
        canEnhance: true,
        maxEnhanceLevel: 4,
        description: '解锁第二阶技能槽，温养效率提升',
        color: '#2196F3',
        unlockRequirement: {
            playerRealm: 'zhuji',
            playerLevel: 10
        },
        nourishConfig: {
            baseEfficiency: 1.2,
            maxLevel: 10
        },
        features: ['second_skill_slot']
    },

    法器: {
        name: '法器',
        level: 4,
        canNourish: true,
        canEnhance: true,
        maxEnhanceLevel: 6,
        description: '解锁器灵，解锁稀有度强化功能',
        color: '#9C27B0',
        unlockRequirement: {
            playerRealm: 'jindan',
            playerLevel: 20
        },
        nourishConfig: {
            baseEfficiency: 1.5,
            maxLevel: 10
        },
        features: ['weapon_spirit', 'rarity_enhance']
    },

    天器: {
        name: '天器',
        level: 5,
        canNourish: true,
        canEnhance: true,
        maxEnhanceLevel: 8,
        description: '解锁被动强化与形态变更',
        color: '#FF9800',
        unlockRequirement: {
            playerRealm: 'yuanying',
            playerLevel: 30
        },
        nourishConfig: {
            baseEfficiency: 2.0,
            maxLevel: 10
        },
        features: ['passive_skills', 'form_change']
    },

    圣器: {
        name: '圣器',
        level: 6,
        canNourish: true,
        canEnhance: true,
        maxEnhanceLevel: 10,
        description: '解锁专属大招或本命技',
        color: '#E91E63',
        unlockRequirement: {
            playerRealm: 'huashen',
            playerLevel: 40
        },
        nourishConfig: {
            baseEfficiency: 2.5,
            maxLevel: 10
        },
        features: ['ultimate_skill', 'bonded_technique']
    },

    仙器: {
        name: '仙器',
        level: 7,
        canNourish: true,
        canEnhance: true,
        maxEnhanceLevel: 12,
        description: '形态独特，属性大幅提升',
        color: '#FFD700',
        unlockRequirement: {
            playerRealm: 'lianxu',
            playerLevel: 50
        },
        nourishConfig: {
            baseEfficiency: 3.0,
            maxLevel: 10
        },
        features: ['unique_form', 'massive_stats']
    },

    极道帝兵: {
        name: '极道帝兵',
        level: 8,
        canNourish: true,
        canEnhance: true,
        maxEnhanceLevel: 15,
        description: '最终形态，单独设计最终效果',
        color: '#B71C1C',
        unlockRequirement: {
            playerRealm: 'dujie',
            playerLevel: 60
        },
        nourishConfig: {
            baseEfficiency: 5.0,
            maxLevel: 10
        },
        features: ['ultimate_form', 'unique_effects', 'world_power']
    }
}

// 根据名称获取境界配置
export const getRealmConfig = (realmName) => FABAO_REALMS[realmName]

// 获取境界列表（按等级排序）
export const getRealmsList = () =>
    Object.values(FABAO_REALMS).sort((a, b) => a.level - b.level)

// 检查境界是否可解锁
export const canUnlockRealm = (realmName, playerRealm, playerLevel) => {
    const realm = FABAO_REALMS[realmName]
    if (!realm || !realm.unlockRequirement) return true

    const { playerRealm: reqRealm, playerLevel: reqLevel } = realm.unlockRequirement
    return playerRealm === reqRealm && playerLevel >= reqLevel
}

// 获取下一境界
export const getNextRealm = (currentRealmName) => {
    const current = FABAO_REALMS[currentRealmName]
    if (!current) return null

    const nextLevel = current.level + 1
    return Object.values(FABAO_REALMS).find(r => r.level === nextLevel)
}
