// 法宝稀有度配置
// 定义法宝稀有度系统的各项参数和倍率

export const FABAO_RARITY = {
    common: {
        name: '普通',
        level: 1,
        hpMultiplier: 1.00,
        skillPowerMultiplier: 1.00,
        nourishEfficiencyMultiplier: 1.00,
        color: '#9E9E9E',
        textColor: '#FFFFFF',
        glowColor: 'rgba(158, 158, 158, 0.3)',
        gridOptimization: null,
        description: '最基础的法宝品质'
    },

    fine: {
        name: '精良',
        level: 2,
        hpMultiplier: 1.10,
        skillPowerMultiplier: 1.05,
        nourishEfficiencyMultiplier: 1.05,
        color: '#4CAF50',
        textColor: '#FFFFFF',
        glowColor: 'rgba(76, 175, 80, 0.4)',
        gridOptimization: null,
        description: '经过精心锻造的法宝'
    },

    rare: {
        name: '稀有',
        level: 3,
        hpMultiplier: 1.25,
        skillPowerMultiplier: 1.10,
        nourishEfficiencyMultiplier: 1.10,
        color: '#2196F3',
        textColor: '#FFFFFF',
        glowColor: 'rgba(33, 150, 243, 0.5)',
        gridOptimization: 'small',  // 微减体积概率
        gridOptimizationChance: 0.1,  // 10%概率
        description: '难得一见的优质法宝'
    },

    epic: {
        name: '史诗',
        level: 4,
        hpMultiplier: 1.45,
        skillPowerMultiplier: 1.20,
        nourishEfficiencyMultiplier: 1.20,
        color: '#9C27B0',
        textColor: '#FFFFFF',
        glowColor: 'rgba(156, 39, 176, 0.6)',
        gridOptimization: 'medium',  // 小概率触发体积优化(-1格)
        gridOptimizationChance: 0.2,  // 20%概率
        description: '传说级别的强大法宝'
    },

    legendary: {
        name: '传说',
        level: 5,
        hpMultiplier: 1.70,
        skillPowerMultiplier: 1.35,
        nourishEfficiencyMultiplier: 1.30,
        color: '#FF9800',
        textColor: '#000000',
        glowColor: 'rgba(255, 152, 0, 0.7)',
        gridOptimization: 'high',  // 固定体积优化概率
        gridOptimizationChance: 0.35,  // 35%概率
        evolveBonus: true,  // 更高进化权重
        evolveBonusMultiplier: 1.5,
        description: '威名远扬的绝世法宝'
    },

    mythic: {
        name: '神器',
        level: 6,
        hpMultiplier: 2.00,
        skillPowerMultiplier: 1.50,
        nourishEfficiencyMultiplier: 1.50,
        color: '#F44336',
        textColor: '#FFFFFF',
        glowColor: 'rgba(244, 67, 54, 0.8)',
        gridOptimization: 'guaranteed',  // 必定优化
        gridOptimizationChance: 0.5,  // 50%概率
        evolveBonus: true,
        evolveBonusMultiplier: 2.0,
        uniqueEffects: true,  // 独特效果
        description: '神话中才存在的至宝'
    }
}

// 根据稀有度名称获取配置
export const getRarityConfig = (rarityName) => FABAO_RARITY[rarityName]

// 获取稀有度列表（按等级排序）
export const getRaritiesList = () =>
    Object.values(FABAO_RARITY).sort((a, b) => a.level - b.level)

// 计算稀有度加成后的属性
export const calculateRarityStats = (baseStats, rarityName) => {
    const rarity = FABAO_RARITY[rarityName]
    if (!rarity) return baseStats

    return {
        hp: Math.floor(baseStats.hp * rarity.hpMultiplier),
        attack: Math.floor(baseStats.attack * rarity.skillPowerMultiplier),
        defense: Math.floor(baseStats.defense * rarity.skillPowerMultiplier)
    }
}

// 计算温养效率
export const calculateNourishEfficiency = (baseEfficiency, rarityName) => {
    const rarity = FABAO_RARITY[rarityName]
    if (!rarity) return baseEfficiency

    return baseEfficiency * rarity.nourishEfficiencyMultiplier
}

// 检查是否触发体积优化
export const shouldOptimizeGrid = (rarityName) => {
    const rarity = FABAO_RARITY[rarityName]
    if (!rarity || !rarity.gridOptimization) return false

    if (rarity.gridOptimization === 'guaranteed') return true

    return Math.random() < (rarity.gridOptimizationChance || 0)
}

// 获取稀有度颜色
export const getRarityColor = (rarityName) => {
    const rarity = FABAO_RARITY[rarityName]
    return rarity ? rarity.color : '#9E9E9E'
}

// 获取稀有度发光效果
export const getRarityGlow = (rarityName) => {
    const rarity = FABAO_RARITY[rarityName]
    return rarity ? rarity.glowColor : 'rgba(158, 158, 158, 0.3)'
}
