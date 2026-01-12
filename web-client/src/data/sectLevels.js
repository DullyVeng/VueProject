// 宗门等级配置
// 定义宗门发展等级系统

export const SECT_LEVELS = {
    chuangcao: {
        id: 'chuangcao',
        name: '草创',
        level: 1,
        plotCount: 2,
        description: '宗门初创，百废待兴',
        requirements: {
            materials: null, // 初始等级，无需求
            disciples: 0,
            realmRequirements: null
        },
        unlocks: ['炼丹房', '藏经阁']
    },

    xiaomen: {
        id: 'xiaomen',
        name: '小门',
        level: 2,
        plotCount: 3,
        description: '小有规模，初具气象',
        requirements: {
            materials: {
                wood: 100,
                stone: 50
            },
            disciples: 0,
            realmRequirements: null
        },
        unlocks: ['炼器房']
    },

    zhongmen: {
        id: 'zhongmen',
        name: '中门',
        level: 3,
        plotCount: 4,
        description: '声名鹊起，门徒渐多',
        requirements: {
            materials: {
                wood: 300,
                stone: 200,
                iron: 50
            },
            disciples: 0,
            realmRequirements: null
        },
        unlocks: ['灵田', '兽栏']
    },

    damen: {
        id: 'damen',
        name: '大门',
        level: 4,
        plotCount: 5,
        description: '势力庞大，人才济济',
        requirements: {
            materials: {
                wood: 500,
                stone: 400,
                iron: 100,
                jade: 10
            },
            disciples: 5,
            realmRequirements: null
        },
        unlocks: ['演武场']
    },

    mingmen: {
        id: 'mingmen',
        name: '名门',
        level: 5,
        plotCount: 7,
        description: '名扬四海，高手如云',
        requirements: {
            materials: {
                wood: 800,
                stone: 600,
                iron: 200,
                jade: 30
            },
            disciples: 10,
            realmRequirements: {
                zhuji: 3 // 筑基期弟子≥3人
            }
        },
        unlocks: ['驿站']
    },

    dapai: {
        id: 'dapai',
        name: '大派',
        level: 6,
        plotCount: 9,
        description: '雄霸一方，威慑八荒',
        requirements: {
            materials: {
                wood: 1500,
                stone: 1000,
                iron: 400,
                jade: 80
            },
            disciples: 20,
            realmRequirements: {
                jindan: 2 // 金丹期弟子≥2人
            }
        },
        unlocks: []
    },

    shengdi: {
        id: 'shengdi',
        name: '圣地',
        level: 7,
        plotCount: 12,
        description: '圣地传承，万世流芳',
        requirements: {
            materials: {
                wood: 3000,
                stone: 2000,
                iron: 800,
                jade: 200,
                spiritStone: 1000
            },
            disciples: 50,
            realmRequirements: {
                yuanying: 1 // 元婴期弟子≥1人
            }
        },
        unlocks: []
    }
}

// 根据ID获取宗门等级配置
export const getSectLevelConfig = (levelId) => SECT_LEVELS[levelId]

// 根据等级数字获取宗门等级配置
export const getSectLevelByNumber = (levelNumber) => {
    return Object.values(SECT_LEVELS).find(level => level.level === levelNumber)
}

// 获取宗门等级列表（按等级排序）
export const getSectLevelsList = () =>
    Object.entries(SECT_LEVELS).map(([key, value]) => ({
        key,
        ...value
    })).sort((a, b) => a.level - b.level)

// 获取下一等级
export const getNextSectLevel = (currentLevelId) => {
    const current = SECT_LEVELS[currentLevelId]
    if (!current) return null

    const nextLevelNumber = current.level + 1
    return getSectLevelByNumber(nextLevelNumber)
}

// 材料名称中文映射
const MATERIAL_NAMES = {
    wood: '木材',
    stone: '石料',
    iron: '铁矿',
    jade: '玉璧',
    formationFlag: '阵旗',
    spiritStone: '灵石'
}

// 境界名称中文映射
const REALM_NAMES = {
    lianqi: '炼气',
    zhuji: '筑基',
    jindan: '金丹',
    yuanying: '元婴',
    huashen: '化神',
    lianxu: '炼虚',
    heti: '合体',
    dacheng: '大乘',
    dujie: '渡劫',
    feixian: '飞升'
}

// 检查是否满足升级条件
export const checkUpgradeRequirements = (nextLevel, materials, disciples, discipleRealms) => {
    if (!nextLevel) return { canUpgrade: false, missing: ['已达最高等级'] }

    const missing = []
    const req = nextLevel.requirements

    // 检查材料
    if (req.materials) {
        for (const [material, amount] of Object.entries(req.materials)) {
            if (!materials[material] || materials[material] < amount) {
                const name = MATERIAL_NAMES[material] || material
                missing.push(`${name}: ${materials[material] || 0}/${amount}`)
            }
        }
    }

    // 检查弟子人数
    if (req.disciples > 0 && disciples < req.disciples) {
        missing.push(`弟子人数: ${disciples}/${req.disciples}`)
    }

    // 检查境界要求
    if (req.realmRequirements) {
        for (const [realm, count] of Object.entries(req.realmRequirements)) {
            const currentCount = discipleRealms[realm] || 0
            if (currentCount < count) {
                const name = REALM_NAMES[realm] || realm
                missing.push(`${name}期弟子: ${currentCount}/${count}`)
            }
        }
    }

    return {
        canUpgrade: missing.length === 0,
        missing
    }
}
