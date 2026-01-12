// 宗门地块配置
// 定义宗门内可用于建造的地块

export const PLOT_TYPES = {
    plain: {
        id: 'plain',
        name: '平地',
        icon: '🏔️',
        description: '平坦开阔，适合建造各类建筑',
        allowedBuildings: ['cangJingGe', 'yanWuChang', 'zhenFaTang', 'cangBaoGe']
    },
    lingMai: {
        id: 'lingMai',
        name: '灵脉',
        icon: '💎',
        description: '灵气充沛，适合炼丹炼器',
        allowedBuildings: ['lianDanFang', 'lianQiFang', 'juLingZhen']
    },
    water: {
        id: 'water',
        name: '水源',
        icon: '💧',
        description: '水源丰沛，适合种植',
        allowedBuildings: ['lingTian', 'yaoTian']
    },
    mountain: {
        id: 'mountain',
        name: '山坳',
        icon: '⛰️',
        description: '山势险峻，适合饲养灵兽',
        allowedBuildings: ['shouLan', 'dongFu']
    },
    entrance: {
        id: 'entrance',
        name: '入口',
        icon: '🚪',
        description: '宗门门户，适合建造传送设施',
        allowedBuildings: ['yiZhan', 'chuanSongZhen', 'miJingRuKou', 'shanMen']
    }
}

// 宗门地块布局配置
// 每个宗门等级对应的地块列表
export const SECT_PLOTS = {
    // 等级1：草创 - 2个地块
    1: [
        { id: 'plot_1_1', type: 'lingMai', position: { x: 0, y: 0 }, unlocked: true },
        { id: 'plot_1_2', type: 'plain', position: { x: 1, y: 0 }, unlocked: true }
    ],
    // 等级2：小门 - 新增1个地块
    2: [
        { id: 'plot_2_1', type: 'lingMai', position: { x: 2, y: 0 }, unlocked: true }
    ],
    // 等级3：中门 - 新增1个地块
    3: [
        { id: 'plot_3_1', type: 'water', position: { x: 0, y: 1 }, unlocked: true }
    ],
    // 等级4：大门 - 新增1个地块
    4: [
        { id: 'plot_4_1', type: 'plain', position: { x: 1, y: 1 }, unlocked: true }
    ],
    // 等级5：名门 - 新增2个地块
    5: [
        { id: 'plot_5_1', type: 'mountain', position: { x: 2, y: 1 }, unlocked: true },
        { id: 'plot_5_2', type: 'entrance', position: { x: 0, y: 2 }, unlocked: true }
    ],
    // 等级6：大派 - 新增2个地块
    6: [
        { id: 'plot_6_1', type: 'plain', position: { x: 1, y: 2 }, unlocked: true },
        { id: 'plot_6_2', type: 'entrance', position: { x: 2, y: 2 }, unlocked: true }
    ],
    // 等级7：圣地 - 新增3个地块
    7: [
        { id: 'plot_7_1', type: 'lingMai', position: { x: 3, y: 0 }, unlocked: true },
        { id: 'plot_7_2', type: 'water', position: { x: 3, y: 1 }, unlocked: true },
        { id: 'plot_7_3', type: 'mountain', position: { x: 3, y: 2 }, unlocked: true }
    ]
}

// 获取地块类型配置
export const getPlotTypeConfig = (typeId) => PLOT_TYPES[typeId]

// 获取指定等级及以下所有可用地块
export const getAvailablePlots = (sectLevel) => {
    const plots = []
    for (let level = 1; level <= sectLevel; level++) {
        if (SECT_PLOTS[level]) {
            plots.push(...SECT_PLOTS[level])
        }
    }
    return plots
}

// 检查建筑是否可以建造在指定地块类型
export const canBuildOnPlot = (buildingId, plotTypeId) => {
    const plotType = PLOT_TYPES[plotTypeId]
    if (!plotType) return false
    return plotType.allowedBuildings.includes(buildingId)
}

// 获取所有地块类型列表
export const getPlotTypesList = () => Object.values(PLOT_TYPES)
