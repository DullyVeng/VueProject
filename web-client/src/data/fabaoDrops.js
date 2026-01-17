/**
 * 法宝掉落配置数据
 * 定义不同等级怪物的法宝掉落池和概率
 */

export const fabaoDropPools = {
    // 低级掉落池（1-20级）
    low: {
        minLevel: 1,
        maxLevel: 20,
        fabaos: ['fabao_sword_qinglian', 'fabao_shield_xuangui', 'fabao_fire_chiyan'],
        baseDropRate: 0.03,  // 3% 基础掉落率
        rarityWeights: {
            common: 80,
            fine: 18,
            rare: 2,
            epic: 0,
            legendary: 0
        }
    },

    // 中级掉落池（21-50级）
    mid: {
        minLevel: 21,
        maxLevel: 50,
        fabaos: ['fabao_sword_zixiao', 'fabao_shield_jinzhong', 'fabao_water_bingbing'],
        baseDropRate: 0.05,  // 5% 基础掉落率
        rarityWeights: {
            common: 60,
            fine: 30,
            rare: 10,
            epic: 0,
            legendary: 0
        }
    },

    // 高级掉落池（51-90级）
    high: {
        minLevel: 51,
        maxLevel: 99,
        fabaos: ['fabao_support_lingdeng', 'fabao_sword_zixiao', 'fabao_shield_jinzhong'],
        baseDropRate: 0.06,  // 6% 基础掉落率
        rarityWeights: {
            common: 40,
            fine: 40,
            rare: 18,
            epic: 2,
            legendary: 0
        }
    }
}

// 根据怪物等级获取对应的掉落池
export const getDropPoolByLevel = (level) => {
    if (level <= 20) return fabaoDropPools.low
    if (level <= 50) return fabaoDropPools.mid
    return fabaoDropPools.high
}
