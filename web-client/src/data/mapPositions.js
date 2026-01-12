/**
 * 地图可视化坐标配置
 * 定义每个地图在画布上的位置（基于600x400画布）
 */

export const mapPositions = {
    // ===== 凡间世界 =====
    'town': { x: 300, y: 200 },
    'forest': { x: 200, y: 150 },
    'mountain': { x: 250, y: 90 },
    'cave': { x: 150, y: 220 },
    'ruins': { x: 320, y: 70 },
    'valley': { x: 120, y: 290 },
    'market': { x: 380, y: 180 },

    // ===== 宗门区域 =====
    'sect_gate': { x: 480, y: 150 },
    'outer_plaza': { x: 500, y: 90 },
    'library': { x: 550, y: 120 },
    'forge': { x: 450, y: 110 },
    'trial_tower': { x: 520, y: 50 },

    // ===== 秘境 =====
    'secret_entrance': { x: 100, y: 330 },
    'frost_realm': { x: 40, y: 370 },
    'flame_mountain': { x: 140, y: 380 },
    'dragon_pool': { x: 180, y: 350 }
}

// 修改maps.js中的visual，添加position引用
export const updateMapVisuals = (maps) => {
    return maps.map(map => ({
        ...map,
        visual: {
            ...map.visual,
            position: mapPositions[map.id] || { x: 300, y: 200 }
        }
    }))
}
