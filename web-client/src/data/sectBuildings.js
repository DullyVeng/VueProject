// 宗门建筑配置
// 定义宗门内可建造的建筑

// 常规建筑 - 达到等级后可直接建造
export const REGULAR_BUILDINGS = {
    lianDanFang: {
        id: 'lianDanFang',
        name: '炼丹房',
        icon: '🏺',
        type: 'production',
        plotType: 'lingMai',
        unlockLevel: 1,
        description: '炼制各类丹药',
        buildCost: {
            wood: 50,
            stone: 30
        },
        buildTime: 300, // 建造时间（秒）
        maintenanceCost: { // 每日维护消耗
            spiritStone: 5
        },
        maxLevel: 5,
        production: {
            type: 'pill',
            items: ['potion_hp_small', 'potion_mp_small'],
            baseInterval: 3600, // 秒
            baseAmount: 1
        },
        upgradeEffects: {
            intervalReduction: 0.2, // 每级减少20%时间
            amountIncrease: 1 // 每级增加1个产出
        }
    },

    cangJingGe: {
        id: 'cangJingGe',
        name: '藏经阁',
        icon: '📚',
        type: 'function',
        plotType: 'plain',
        unlockLevel: 1,
        description: '存放功法典籍',
        buildCost: {
            wood: 40,
            stone: 20
        },
        buildTime: 240,
        maintenanceCost: {
            spiritStone: 3
        },
        maxLevel: 5,
        effects: {
            gongfaCapacity: 5,
            upgradeBonus: 0.1
        },
        upgradeEffects: {
            capacityIncrease: 2,
            bonusIncrease: 0.05
        }
    },

    lianQiFang: {
        id: 'lianQiFang',
        name: '炼器房',
        icon: '⚒️',
        type: 'production',
        plotType: 'lingMai',
        unlockLevel: 2,
        description: '打造和修复法宝',
        buildCost: {
            iron: 80,
            stone: 50
        },
        buildTime: 600,
        maintenanceCost: {
            spiritStone: 8,
            iron: 2
        },
        maxLevel: 5,
        production: {
            type: 'fabao',
            items: ['fabao_repair_kit', 'fabao_material'],
            baseInterval: 7200,
            baseAmount: 1
        },
        upgradeEffects: {
            intervalReduction: 0.15,
            amountIncrease: 1
        }
    },

    lingTian: {
        id: 'lingTian',
        name: '灵田',
        icon: '🌾',
        type: 'production',
        plotType: 'water',
        unlockLevel: 3,
        description: '种植灵草药材',
        buildCost: {
            wood: 30,
            spiritStone: 20
        },
        buildTime: 480,
        maintenanceCost: {
            spiritStone: 10
        },
        maxLevel: 5,
        production: {
            type: 'herb',
            items: ['lingcao', 'qingling'],
            baseInterval: 14400,
            baseAmount: 3
        },
        upgradeEffects: {
            intervalReduction: 0.2,
            amountIncrease: 2
        }
    },

    shouLan: {
        id: 'shouLan',
        name: '兽栏',
        icon: '🐉',
        type: 'production',
        plotType: 'mountain',
        unlockLevel: 3,
        description: '饲养灵兽',
        buildCost: {
            wood: 60,
            iron: 20
        },
        buildTime: 720,
        maintenanceCost: {
            spiritStone: 15,
            wood: 5
        },
        maxLevel: 5,
        production: {
            type: 'beast_material',
            items: ['spirit_fur', 'beast_core'],
            baseInterval: 28800,
            baseAmount: 1
        },
        upgradeEffects: {
            intervalReduction: 0.15,
            amountIncrease: 1
        }
    },

    yanWuChang: {
        id: 'yanWuChang',
        name: '演武场',
        icon: '⚔️',
        type: 'function',
        plotType: 'plain',
        unlockLevel: 4,
        description: '弟子训练场所',
        buildCost: {
            stone: 80,
            iron: 30
        },
        buildTime: 900,
        maintenanceCost: {
            spiritStone: 12,
            stone: 3
        },
        maxLevel: 5,
        effects: {
            combatBonus: 0.05,
            breakthroughBonus: 0.1
        },
        upgradeEffects: {
            combatBonusIncrease: 0.03,
            breakthroughBonusIncrease: 0.05
        }
    },

    yiZhan: {
        id: 'yiZhan',
        name: '驿站',
        icon: '🏠',
        type: 'production',
        plotType: 'entrance',
        unlockLevel: 5,
        description: '持续获取建设材料',
        buildCost: {
            wood: 100,
            spiritStone: 50
        },
        buildTime: 1200,
        maintenanceCost: {
            spiritStone: 20
        },
        maxLevel: 5,
        production: {
            type: 'material',
            items: ['wood', 'stone', 'iron'],
            baseInterval: 14400,
            baseAmount: 5
        },
        upgradeEffects: {
            intervalReduction: 0.25,
            amountIncrease: 3,
            rareMaterialChance: 0.1
        }
    }
}

// 特殊建筑 - 需要图纸解锁
export const SPECIAL_BUILDINGS = {
    zhenFaTang: {
        id: 'zhenFaTang',
        name: '阵法堂',
        icon: '☯️',
        type: 'function',
        plotType: 'plain',
        blueprintId: 'blueprint_zhenfatang',
        description: '研究和布置阵法',
        buildCost: {
            jade: 10,
            spiritStone: 100
        },
        buildTime: 1800,
        maintenanceCost: {
            spiritStone: 25,
            jade: 1
        },
        maxLevel: 5,
        effects: {
            unlockFormation: true,
            formationPower: 1.0
        },
        upgradeEffects: {
            formationPowerIncrease: 0.2
        }
    },

    cangBaoGe: {
        id: 'cangBaoGe',
        name: '藏宝阁',
        icon: '🏛️',
        type: 'function',
        plotType: 'plain',
        blueprintId: 'blueprint_cangbaoge',
        description: '存放珍稀物品',
        buildCost: {
            jade: 15,
            spiritStone: 80
        },
        buildTime: 1500,
        maintenanceCost: {
            spiritStone: 15
        },
        maxLevel: 5,
        effects: {
            storageCapacity: 50
        },
        upgradeEffects: {
            capacityIncrease: 30
        }
    },

    chuanSongZhen: {
        id: 'chuanSongZhen',
        name: '传送阵',
        icon: '🌀',
        type: 'function',
        plotType: 'entrance',
        blueprintId: 'blueprint_chuansongzhen',
        description: '快速传送至已探索地图',
        buildCost: {
            spiritStone: 200,
            formationFlag: 5
        },
        buildTime: 2400,
        maintenanceCost: {
            spiritStone: 30,
            formationFlag: 1
        },
        maxLevel: 3,
        effects: {
            unlockTeleport: true,
            teleportCooldown: 3600
        },
        upgradeEffects: {
            cooldownReduction: 600
        }
    },

    miJingRuKou: {
        id: 'miJingRuKou',
        name: '秘境入口',
        icon: '🌌',
        type: 'function',
        plotType: 'entrance',
        blueprintId: 'blueprint_mijingrukou',
        description: '开启秘境探索',
        buildCost: {
            jade: 20,
            spiritStone: 300
        },
        buildTime: 3600,
        maintenanceCost: {
            spiritStone: 50,
            jade: 2
        },
        maxLevel: 3,
        effects: {
            unlockSecretRealm: true,
            secretRealmTier: 1
        },
        upgradeEffects: {
            tierIncrease: 1
        }
    },

    juLingZhen: {
        id: 'juLingZhen',
        name: '聚灵阵',
        icon: '✨',
        type: 'function',
        plotType: 'lingMai',
        blueprintId: 'blueprint_julingzhen',
        description: '加速全宗门修炼',
        buildCost: {
            jade: 25,
            spiritStone: 200
        },
        buildTime: 2700,
        maintenanceCost: {
            spiritStone: 40
        },
        maxLevel: 5,
        effects: {
            cultivationBonus: 0.1
        },
        upgradeEffects: {
            bonusIncrease: 0.05
        }
    },

    huShanDaZhen: {
        id: 'huShanDaZhen',
        name: '护山大阵',
        icon: '🛡️',
        type: 'function',
        plotType: 'any',
        blueprintId: 'blueprint_hushandazhen',
        description: '宗门防护大阵',
        buildCost: {
            formationFlag: 20,
            spiritStone: 500
        },
        buildTime: 7200,
        maintenanceCost: {
            spiritStone: 100,
            formationFlag: 2
        },
        maxLevel: 5,
        effects: {
            defenseBonus: 0.2,
            protectionAura: true
        },
        upgradeEffects: {
            defenseBonusIncrease: 0.1
        }
    }
}

// 建筑图纸配置
export const BUILDING_BLUEPRINTS = {
    blueprint_zhenfatang: {
        id: 'blueprint_zhenfatang',
        name: '阵法堂图纸',
        icon: '📜',
        buildingId: 'zhenFaTang',
        description: '使用后解锁阵法堂建造',
        obtainFrom: ['BOSS掉落', '任务奖励']
    },
    blueprint_cangbaoge: {
        id: 'blueprint_cangbaoge',
        name: '藏宝阁图纸',
        icon: '📜',
        buildingId: 'cangBaoGe',
        description: '使用后解锁藏宝阁建造',
        obtainFrom: ['成就奖励']
    },
    blueprint_chuansongzhen: {
        id: 'blueprint_chuansongzhen',
        name: '传送阵图纸',
        icon: '📜',
        buildingId: 'chuanSongZhen',
        description: '使用后解锁传送阵建造',
        obtainFrom: ['地图BOSS掉落']
    },
    blueprint_mijingrukou: {
        id: 'blueprint_mijingrukou',
        name: '秘境入口图纸',
        icon: '📜',
        buildingId: 'miJingRuKou',
        description: '使用后解锁秘境入口建造',
        obtainFrom: ['世界BOSS掉落']
    },
    blueprint_julingzhen: {
        id: 'blueprint_julingzhen',
        name: '聚灵阵图纸',
        icon: '📜',
        buildingId: 'juLingZhen',
        description: '使用后解锁聚灵阵建造',
        obtainFrom: ['稀有事件']
    },
    blueprint_hushandazhen: {
        id: 'blueprint_hushandazhen',
        name: '护山大阵图纸',
        icon: '📜',
        buildingId: 'huShanDaZhen',
        description: '使用后解锁护山大阵建造',
        obtainFrom: ['主线任务']
    }
}

// 获取所有建筑
export const getAllBuildings = () => ({
    ...REGULAR_BUILDINGS,
    ...SPECIAL_BUILDINGS
})

// 根据ID获取建筑配置
export const getBuildingConfig = (buildingId) => {
    return REGULAR_BUILDINGS[buildingId] || SPECIAL_BUILDINGS[buildingId]
}

// 获取常规建筑列表
export const getRegularBuildingsList = () => Object.values(REGULAR_BUILDINGS)

// 获取特殊建筑列表
export const getSpecialBuildingsList = () => Object.values(SPECIAL_BUILDINGS)

// 获取图纸配置
export const getBlueprintConfig = (blueprintId) => BUILDING_BLUEPRINTS[blueprintId]

// 检查是否可以建造建筑
export const canBuild = (buildingId, sectLevel, unlockedBlueprints = []) => {
    const building = getBuildingConfig(buildingId)
    if (!building) return { canBuild: false, reason: '建筑不存在' }

    // 常规建筑检查等级
    if (REGULAR_BUILDINGS[buildingId]) {
        if (sectLevel < building.unlockLevel) {
            return { canBuild: false, reason: `需要宗门等级${building.unlockLevel}` }
        }
        return { canBuild: true }
    }

    // 特殊建筑检查图纸
    if (SPECIAL_BUILDINGS[buildingId]) {
        if (!unlockedBlueprints.includes(building.blueprintId)) {
            return { canBuild: false, reason: '需要先解锁对应图纸' }
        }
        return { canBuild: true }
    }

    return { canBuild: false, reason: '未知建筑类型' }
}

// 计算建筑升级费用
export const getUpgradeCost = (buildingId, currentLevel) => {
    const building = getBuildingConfig(buildingId)
    if (!building) return null

    const multiplier = Math.pow(1.5, currentLevel) // 每级费用增加50%
    const cost = {}
    for (const [material, amount] of Object.entries(building.buildCost)) {
        cost[material] = Math.floor(amount * multiplier)
    }
    return cost
}
