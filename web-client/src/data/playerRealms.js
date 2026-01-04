// 人物境界配置
// 定义修炼境界系统

export const PLAYER_REALMS = {
    lianqi: {
        name: '炼气',
        level: 1,
        maxLevel: 10,
        description: '修炼入门境界',
        unlocks: ['基础战斗系统'],
        attributePointsPerLevel: 3
    },

    zhuji: {
        name: '筑基',
        level: 2,
        maxLevel: 10,
        description: '筑基固本，开启识海',
        unlocks: ['识海系统', '功法系统'],
        attributePointsPerLevel: 4
    },

    jindan: {
        name: '金丹',
        level: 3,
        maxLevel: 10,
        description: '凝聚金丹，开启丹田',
        unlocks: ['丹田系统', '法宝系统'],
        attributePointsPerLevel: 5
    },

    yuanying: {
        name: '元婴',
        level: 4,
        maxLevel: 10,
        description: '元婴出窍，法宝温养',
        unlocks: ['法宝温养机制', '法宝强化'],
        attributePointsPerLevel: 6
    },

    huashen: {
        name: '化神',
        level: 5,
        maxLevel: 10,
        description: '神魂蜕变，功法进阶',
        unlocks: ['功法进化', '双系功法'],
        attributePointsPerLevel: 7
    },

    lianxu: {
        name: '炼虚',
        level: 6,
        maxLevel: 10,
        description: '炼虚合道，法宝进化',
        unlocks: ['法宝进化', '组合技'],
        attributePointsPerLevel: 8
    },

    heti: {
        name: '合体',
        level: 7,
        maxLevel: 10,
        description: '天人合一，系统联动',
        unlocks: ['功法法宝联动'],
        attributePointsPerLevel: 9
    },

    dacheng: {
        name: '大乘',
        level: 8,
        maxLevel: 10,
        description: '大道将成，阵法开启',
        unlocks: ['阵法系统', '三系联动'],
        attributePointsPerLevel: 10
    },

    dujie: {
        name: '渡劫',
        level: 9,
        maxLevel: 10,
        description: '历经天劫，突破极限',
        unlocks: ['天劫试炼', '特殊被动'],
        attributePointsPerLevel: 12
    },

    feixian: {
        name: '飞升',
        level: 10,
        maxLevel: 1,
        description: '羽化飞升，超凡入圣',
        unlocks: ['全系统融合', '本命法宝'],
        attributePointsPerLevel: 15
    }
}

// 根据拼音获取境界配置
export const getRealmConfig = (realmKey) => PLAYER_REALMS[realmKey]

// 根据拼音获取境界中文名
export const getRealmName = (realmKey) => {
    const realm = PLAYER_REALMS[realmKey]
    return realm ? realm.name : realmKey
}

// 获取境界列表（按等级排序）
export const getRealmsList = () =>
    Object.entries(PLAYER_REALMS).map(([key, value]) => ({
        key,
        ...value
    })).sort((a, b) => a.level - b.level)

// 获取下一境界
export const getNextRealm = (currentRealmKey) => {
    const current = PLAYER_REALMS[currentRealmKey]
    if (!current) return null

    const nextLevel = current.level + 1
    const nextEntry = Object.entries(PLAYER_REALMS).find(([_, realm]) => realm.level === nextLevel)
    return nextEntry ? { key: nextEntry[0], ...nextEntry[1] } : null
}

// 根据境界获取每级属性点
export const getAttributePointsPerLevel = (realmKey) => {
    const realm = PLAYER_REALMS[realmKey]
    return realm ? realm.attributePointsPerLevel : 3
}
