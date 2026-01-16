/**
 * 地图系统数据配置
 * 包含所有可探索地图的详细信息
 */

// 区域定义
export const areas = {
    mortal: {
        id: 'mortal_world',
        name: '凡间世界',
        description: '修仙者起步的凡人世界',
        unlockLevel: 0
    },
    sect: {
        id: 'sect_area',
        name: '宗门区域',
        description: '修仙宗门的各个区域',
        unlockLevel: 10
    },
    secret: {
        id: 'secret_realm',
        name: '秘境',
        description: '充满机遇和危险的秘境',
        unlockLevel: 20
    }
}

// 地图配置
export const maps = [
    // ==================== 凡间世界 ====================
    {
        id: 'town',
        name: '起始镇',
        area: 'mortal_world',
        type: 'safe',
        level: [1, 99],
        description: '一个宁静的小镇，冒险者们聚集的地方。这里很安全，可以休整补给。',
        connections: ['forest', 'market'],

        features: ['npc', 'shop', 'quest', 'rest'],
        npcs: ['merchant_zhang', 'elder_li', 'quest_master'],

        unlockRequirement: {
            level: 0,
            questId: null,
            itemId: null
        },

        visual: {
            icon: '🏘️',
            color: '#2ecc71'
        }
    },

    {
        id: 'forest',
        name: '迷雾森林',
        area: 'mortal_world',
        type: 'wild',
        level: [1, 5],
        description: '充满了迷雾的森林，据说深处有危险的生物出没。适合初学者历练。',
        connections: ['town', 'mountain', 'cave'],

        features: ['combat', 'resource', 'event'],
        resources: [
            { type: 'herb', id: 'lingcao', name: '灵草', rarity: 'common', dropRate: 0.6 },
            { type: 'herb', id: 'qingling', name: '青灵草', rarity: 'uncommon', dropRate: 0.3 },
            { type: 'sect_material', id: 'wood', name: '木材', rarity: 'common', dropRate: 0.5 }
        ],
        events: [
            { id: 'treasure_chest', chance: 0.1 },
            { id: 'herb_patch', chance: 0.2 }
        ],

        unlockRequirement: {
            level: 1
        },

        visual: {
            icon: '🌲',
            color: '#27ae60'
        }
    },

    {
        id: 'mountain',
        name: '青石山',
        area: 'mortal_world',
        type: 'wild',
        level: [3, 7],
        description: '险峻的青石山脉，山中多矿石和灵兽。山顶据说有古老的剑冢。',
        connections: ['forest', 'ruins'],

        features: ['combat', 'resource'],
        resources: [
            { type: 'ore', id: 'iron_ore', name: '铁矿石', rarity: 'common', dropRate: 0.5 },
            { type: 'ore', id: 'silver_ore', name: '银矿石', rarity: 'uncommon', dropRate: 0.3 },
            { type: 'sect_material', id: 'stone', name: '石料', rarity: 'common', dropRate: 0.5 },
            { type: 'sect_material', id: 'iron', name: '铁矿', rarity: 'common', dropRate: 0.4 }
        ],

        unlockRequirement: {
            level: 3
        },

        visual: {
            icon: '⛰️',
            color: '#95a5a6'
        }
    },

    {
        id: 'cave',
        name: '幽暗洞穴',
        area: 'mortal_world',
        type: 'wild',
        level: [5, 10],
        description: '深不见底的洞穴，常常能听到怪物的嘶吼声。洞穴深处可能通往秘境。',
        connections: ['forest', 'secret_entrance'],

        features: ['combat', 'resource', 'event'],
        resources: [
            { type: 'crystal', id: 'dark_crystal', name: '暗影水晶', rarity: 'uncommon', dropRate: 0.4 },
            { type: 'sect_material', id: 'jade', name: '玉璧', rarity: 'rare', dropRate: 0.15 }
        ],
        events: [
            { id: 'ambush', chance: 0.15 },
            { id: 'treasure_chest', chance: 0.08 }
        ],

        unlockRequirement: {
            level: 5
        },

        visual: {
            icon: '🕳️',
            color: '#34495e'
        }
    },

    {
        id: 'ruins',
        name: '古剑冢',
        area: 'mortal_world',
        type: 'dungeon',
        level: [8, 12],
        description: '上古剑修的埋骨之地，剑意弥漫。据说能在此领悟剑道真谛。',
        connections: ['mountain'],

        features: ['combat', 'npc', 'quest'],
        npcs: ['sword_spirit'],
        events: [
            { id: 'sword_enlightenment', chance: 0.05 },
            { id: 'ancient_treasure', chance: 0.1 }
        ],

        unlockRequirement: {
            level: 8
        },

        visual: {
            icon: '⚔️',
            color: '#c0392b'
        }
    },

    {
        id: 'valley',
        name: '妖兽谷',
        area: 'mortal_world',
        type: 'wild',
        level: [10, 15],
        description: '强大妖兽聚居的山谷，充满危险但也蕴藏着丰富的资源。',
        connections: ['forest', 'sect_gate'],

        features: ['combat', 'resource'],
        resources: [
            { type: 'material', id: 'beast_core', name: '妖兽内丹', rarity: 'rare', dropRate: 0.2 },
            { type: 'material', id: 'spirit_fur', name: '灵兽皮毛', rarity: 'uncommon', dropRate: 0.4 }
        ],

        unlockRequirement: {
            level: 10
        },

        visual: {
            icon: '🐉',
            color: '#8e44ad'
        }
    },

    // ==================== 宗门区域 ====================
    {
        id: 'sect_gate',
        name: '宗门山门',
        area: 'sect_area',
        type: 'safe',
        level: [10, 99],
        description: '青云宗的山门入口，守卫森严。只有通过考核的弟子才能进入。',
        connections: ['valley', 'outer_plaza'],

        features: ['npc', 'quest'],
        npcs: ['gatekeeper', 'senior_brother'],

        unlockRequirement: {
            level: 10,
            questId: 'join_sect'
        },

        visual: {
            icon: '⛩️',
            color: '#3498db'
        }
    },

    {
        id: 'outer_plaza',
        name: '外门广场',
        area: 'sect_area',
        type: 'safe',
        level: [10, 99],
        description: '外门弟子聚集修炼的地方，可以接取宗门任务，与其他弟子切磋。',
        connections: ['sect_gate', 'library', 'forge', 'trial_tower'],

        features: ['npc', 'quest', 'shop', 'rest'],
        npcs: ['task_elder', 'equipment_master', 'disciples'],

        unlockRequirement: {
            level: 10
        },

        visual: {
            icon: '🏛️',
            color: '#3498db'
        }
    },

    {
        id: 'library',
        name: '藏经阁',
        area: 'sect_area',
        type: 'safe',
        level: [10, 99],
        description: '宗门收藏功法典籍的地方，可以学习新的技能和法术。',
        connections: ['outer_plaza'],

        features: ['npc', 'shop'],
        npcs: ['librarian'],

        unlockRequirement: {
            level: 12
        },

        visual: {
            icon: '📚',
            color: '#f39c12'
        }
    },

    {
        id: 'forge',
        name: '炼器房',
        area: 'sect_area',
        type: 'safe',
        level: [10, 99],
        description: '炼制和强化法宝装备的地方，可以进行强化、修理等操作。',
        connections: ['outer_plaza'],

        features: ['npc', 'shop'],
        npcs: ['forge_master'],

        unlockRequirement: {
            level: 10
        },

        visual: {
            icon: '🔨',
            color: '#e67e22'
        }
    },

    {
        id: 'trial_tower',
        name: '试炼塔',
        area: 'sect_area',
        type: 'dungeon',
        level: [15, 30],
        description: '宗门弟子试炼的地方，共有九层，每层难度递增。通过试炼可获得丰厚奖励。',
        connections: ['outer_plaza'],

        features: ['combat', 'event'],
        events: [
            { id: 'tower_reward', chance: 1.0 }
        ],

        unlockRequirement: {
            level: 15
        },

        visual: {
            icon: '🗼',
            color: '#9b59b6'
        }
    },

    // ==================== 秘境 ====================
    {
        id: 'secret_entrance',
        name: '秘境入口',
        area: 'secret_realm',
        type: 'safe',
        level: [20, 99],
        description: '连接凡间与秘境的神秘入口，需要特殊的令牌才能开启。',
        connections: ['cave', 'frost_realm', 'flame_mountain'],

        features: ['npc'],
        npcs: ['realm_guardian'],

        unlockRequirement: {
            level: 20,
            itemId: 'secret_realm_token'
        },

        visual: {
            icon: '🌀',
            color: '#1abc9c'
        }
    },

    {
        id: 'frost_realm',
        name: '天霜秘境',
        area: 'secret_realm',
        type: 'dungeon',
        level: [20, 30],
        description: '冰雪覆盖的秘境，寒气逼人。传说中的冰系法宝就藏在此处。',
        connections: ['secret_entrance'],

        features: ['combat', 'resource', 'event'],
        resources: [
            { type: 'herb', id: 'frost_lotus', name: '寒冰莲', rarity: 'rare', dropRate: 0.3 },
            { type: 'sect_material', id: 'spiritStone', name: '灵石矿', rarity: 'uncommon', dropRate: 0.3 }
        ],
        events: [
            { id: 'ice_treasure', chance: 0.15 }
        ],

        unlockRequirement: {
            level: 20
        },

        visual: {
            icon: '❄️',
            color: '#3498db'
        }
    },

    {
        id: 'flame_mountain',
        name: '火焰山',
        area: 'secret_realm',
        type: 'dungeon',
        level: [25, 35],
        description: '终年燃烧的火山，火焰妖兽横行。火系修炼者的圣地。',
        connections: ['secret_entrance', 'dragon_pool'],

        features: ['combat', 'resource'],
        resources: [
            { type: 'ore', id: 'flame_essence', name: '火焰精华', rarity: 'rare', dropRate: 0.25 }
        ],

        unlockRequirement: {
            level: 25
        },

        visual: {
            icon: '🔥',
            color: '#e74c3c'
        }
    },

    {
        id: 'dragon_pool',
        name: '蛟龙潭',
        area: 'secret_realm',
        type: 'dungeon',
        level: [30, 40],
        description: '传说中真龙栖息的深潭，潭底藏有龙族宝藏。极度危险！',
        connections: ['flame_mountain'],

        features: ['combat', 'event'],
        events: [
            { id: 'dragon_encounter', chance: 0.1 },
            { id: 'dragon_treasure', chance: 0.2 }
        ],

        unlockRequirement: {
            level: 30
        },

        visual: {
            icon: '🐲',
            color: '#8e44ad'
        }
    },

    // ==================== 特殊区域 ====================
    {
        id: 'market',
        name: '修仙坊市',
        area: 'mortal_world',
        type: 'safe',
        level: [1, 99],
        description: '修仙者交易物品的市场，可以买卖装备、丹药、材料等。',
        connections: ['town'],

        features: ['shop', 'npc'],
        npcs: ['merchant_guild', 'auction_master', 'traders'],

        unlockRequirement: {
            level: 5
        },

        visual: {
            icon: '🏪',
            color: '#f39c12'
        }
    },

    // ==================== 高阶修炼区（30-50级）====================
    {
        id: 'demon_forest',
        name: '暗魔林',
        area: 'mortal_world',
        type: 'wild',
        level: [30, 40],
        description: '邪气深重的魔林，暗影生物横行。据说有魔修在此修炼禁术。',
        connections: ['valley', 'demon_ruins'],

        features: ['combat', 'resource'],
        resources: [
            { type: 'material', id: 'dark_essence', name: '暗影精华', rarity: 'rare', dropRate: 0.25 }
        ],

        unlockRequirement: {
            level: 30
        },

        visual: {
            icon: '🌑',
            color: '#1a1a1a'
        }
    },

    {
        id: 'demon_ruins',
        name: '魔窟废墟',
        area: 'secret_realm',
        type: 'dungeon',
        level: [35, 45],
        description: '上古魔修遗迹，充满危险的禁制和强大的魔物。深处藏有魔宝。',
        connections: ['demon_forest'],

        features: ['combat', 'event'],
        events: [
            { id: 'forbidden_treasure', chance: 0.12 },
            { id: 'magic_trap', chance: 0.2 }
        ],

        unlockRequirement: {
            level: 35
        },

        visual: {
            icon: '🏚️',
            color: '#8e44ad'
        }
    },

    {
        id: 'thunder_peak',
        name: '雷鸣峰',
        area: 'sect_area',
        type: 'wild',
        level: [40, 50],
        description: '终年雷霆不绝的高峰，雷系修炼者的圣地。雷霆金鹰常在此出没。',
        connections: ['trial_tower', 'cloud_sea'],

        features: ['combat', 'resource'],
        resources: [
            { type: 'crystal', id: 'thunder_crystal', name: '雷晶', rarity: 'rare', dropRate: 0.3 }
        ],

        unlockRequirement: {
            level: 40
        },

        visual: {
            icon: '⚡',
            color: '#f1c40f'
        }
    },

    // ==================== 天界区域（50-70级）====================
    {
        id: 'cloud_sea',
        name: '云海',
        area: 'sect_area',
        type: 'safe',
        level: [50, 99],
        description: '飘渺的云海之上，传说中仙人居住的地方。需要达到金丹期才能稳定飞行至此。',
        connections: ['thunder_peak', 'celestial_palace', 'forbidden_land'],

        features: ['npc', 'quest'],
        npcs: ['cloud_monk', 'immortal_guide'],

        unlockRequirement: {
            level: 50
        },

        visual: {
            icon: '☁️',
            color: '#ecf0f1'
        }
    },

    {
        id: 'celestial_palace',
        name: '天宫',
        area: 'secret_realm',
        type: 'dungeon',
        level: [55, 65],
        description: '天界守卫镇守的宫殿，传说藏有仙宝。只有最强的修士才敢挑战。',
        connections: ['cloud_sea'],

        features: ['combat', 'event'],
        events: [
            { id: 'celestial_blessing', chance: 0.08 },
            { id: 'immortal_treasure', chance: 0.15 }
        ],

        unlockRequirement: {
            level: 55
        },

        visual: {
            icon: '🏯',
            color: '#e8b923'
        }
    },

    {
        id: 'ancient_battlefield',
        name: '上古战场',
        area: 'secret_realm',
        type: 'wild',
        level: [60, 70],
        description: '上古大战的遗迹，怨气凝结成强大的灵体。危机四伏但机遇无限。',
        connections: ['cloud_sea', 'void_rift'],

        features: ['combat', 'resource', 'event'],
        resources: [
            { type: 'material', id: 'ancient_bone', name: '上古遗骸', rarity: 'epic', dropRate: 0.15 }
        ],
        events: [
            { id: 'war_spirit', chance: 0.18 }
        ],

        unlockRequirement: {
            level: 60
        },

        visual: {
            icon: '⚔️',
            color: '#c0392b'
        }
    },

    // ==================== 虚空禁地（70-90级）====================
    {
        id: 'void_rift',
        name: '虚空裂隙',
        area: 'secret_realm',
        type: 'dungeon',
        level: [70, 80],
        description: '连接不同位面的虚空裂缝，虚空生物横行。极度危险！',
        connections: ['ancient_battlefield', 'chaos_void'],

        features: ['combat', 'event'],
        events: [
            { id: 'void_storm', chance: 0.25 },
            { id: 'dimension_treasure', chance: 0.1 }
        ],

        unlockRequirement: {
            level: 70
        },

        visual: {
            icon: '🌀',
            color: '#9b59b6'
        }
    },

    {
        id: 'forbidden_land',
        name: '生命禁区',
        area: 'secret_realm',
        type: 'wild',
        level: [75, 85],
        description: '修仙界最危险的区域之一，连元婴期修士都可能陨落。藏有惊世宝物。',
        connections: ['cloud_sea', 'chaos_void'],

        features: ['combat', 'resource'],
        resources: [
            { type: 'herb', id: 'phoenix_grass', name: '不死草', rarity: 'legendary', dropRate: 0.08 }
        ],

        unlockRequirement: {
            level: 75
        },

        visual: {
            icon: '☠️',
            color: '#e74c3c'
        }
    },

    {
        id: 'chaos_void',
        name: '混沌虚空',
        area: 'secret_realm',
        type: 'dungeon',
        level: [80, 90],
        description: '世界边缘的混沌之地，时空紊乱。只有渡劫期修士才敢进入。',
        connections: ['void_rift', 'forbidden_land'],

        features: ['combat', 'event'],
        events: [
            { id: 'chaos_phenomenon', chance: 0.3 },
            { id: 'ultimate_treasure', chance: 0.05 }
        ],

        unlockRequirement: {
            level: 80
        },

        visual: {
            icon: '🌌',
            color: '#34495e'
        }
    }
]

// 工具函数
export const getMapById = (id) => maps.find(m => m.id === id)

export const getMapsByArea = (areaId) => maps.filter(m => m.area === areaId)

export const getUnlockedMaps = (playerLevel, completedQuests = [], inventory = []) => {
    return maps.filter(map => {
        const req = map.unlockRequirement || {}

        // 等级检查
        if (req.level && playerLevel < req.level) return false

        // 任务检查
        if (req.questId && !completedQuests.includes(req.questId)) return false

        // 道具检查
        if (req.itemId && !inventory.some(item => item.id === req.itemId)) return false

        return true
    })
}

export const getConnectedMaps = (currentMapId) => {
    const currentMap = getMapById(currentMapId)
    if (!currentMap) return []

    return currentMap.connections.map(id => getMapById(id)).filter(Boolean)
}
