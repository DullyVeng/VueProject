
export const monsters = [
    {
        id: 'slime',
        name: '史莱姆',
        type: 'beast',  // 妖兽类
        level: 1,
        hp: 30,
        max_hp: 30,
        attack: 5,
        defense: 0,
        expReward: 10,
        silverReward: 5,
        model: '🟢',
        attackPreference: {
            fabao: 0.7,  // 70%攻击法宝
            player: 0.3  // 30%攻击玩家
        },
        drops: [
            { id: 'wood', chance: 0.3, amount: [1, 2] },
            { id: 'spiritStone', chance: 0.5, amount: [1, 3] }
        ]
    },
    {
        id: 'goblin',
        name: '哥布林',
        type: 'human',  // 人类
        level: 3,
        hp: 60,
        max_hp: 60,
        attack: 12,
        defense: 2,
        expReward: 25,
        silverReward: 12,
        model: '👹',
        attackPreference: {
            fabao: 0.3,  // 30%攻击法宝
            player: 0.7  // 70%攻击玩家（智能，优先攻击本体）
        },
        drops: [
            { id: 'iron', chance: 0.25, amount: [1, 2] },
            { id: 'spiritStone', chance: 0.6, amount: [2, 5] }
        ]
    },
    {
        id: 'wolf',
        name: '森林狼',
        type: 'beast',
        level: 5,
        hp: 100,
        max_hp: 100,
        attack: 18,
        defense: 5,
        expReward: 50,
        silverReward: 20,
        model: '🐺',
        attackPreference: {
            fabao: 0.7,
            player: 0.3
        },
        drops: [
            { id: 'wood', chance: 0.4, amount: [1, 3] },
            { id: 'spiritStone', chance: 0.5, amount: [2, 4] }
        ]
    },
    {
        id: 'dark_cultist',
        name: '暗黑教徒',
        type: 'demon',  // 魔修类
        level: 7,
        hp: 150,
        max_hp: 150,
        attack: 25,
        defense: 8,
        expReward: 80,
        silverReward: 35,
        model: '🧙',
        attackPreference: {
            fabao: 0.5,  // 各50%
            player: 0.5
        },
        drops: [
            { id: 'formationFlag', chance: 0.15, amount: [1, 1] },
            { id: 'spiritStone', chance: 0.7, amount: [3, 6] }
        ]
    },
    {
        id: 'zombie',
        name: '行尸',
        type: 'undead',  // 不死类
        level: 6,
        hp: 200,
        max_hp: 200,
        attack: 15,
        defense: 10,
        expReward: 60,
        silverReward: 25,
        model: '🧟',
        attackPreference: {
            fabao: 0.4,
            player: 0.6  // 偏好攻击本体
        },
        drops: [
            { id: 'stone', chance: 0.35, amount: [1, 2] },
            { id: 'spiritStone', chance: 0.5, amount: [1, 4] }
        ]
    },
    {
        id: 'fire_spirit',
        name: '火灵',
        type: 'beast',
        level: 8,
        hp: 120,
        max_hp: 120,
        attack: 30,
        defense: 5,
        expReward: 100,
        silverReward: 45,
        model: '🔥',
        attackPreference: {
            fabao: 0.8,  // 强烈倾向攻击法宝
            player: 0.2
        },
        element: 'fire'  // 元素属性
    },

    // ==================== 30级以上怪物 ====================
    {
        id: 'stone_golem',
        name: '岩石傀儡',
        type: 'golem',
        level: 12,
        hp: 280,
        max_hp: 280,
        attack: 35,
        defense: 15,
        expReward: 150,
        silverReward: 60,
        model: '🗿',
        attackPreference: {
            fabao: 0.5,
            player: 0.5
        },
        element: 'earth'
    },
    {
        id: 'shadow_assassin',
        name: '暗影刺客',
        type: 'demon',
        level: 15,
        hp: 220,
        max_hp: 220,
        attack: 50,
        defense: 10,
        expReward: 200,
        silverReward: 80,
        model: '👤',
        attackPreference: {
            fabao: 0.2,
            player: 0.8  // 优先攻击玩家
        }
    },
    {
        id: 'ice_beast',
        name: '冰霜巨兽',
        type: 'beast',
        level: 20,
        hp: 400,
        max_hp: 400,
        attack: 60,
        defense: 20,
        expReward: 300,
        silverReward: 120,
        model: '🦍',
        attackPreference: {
            fabao: 0.7,
            player: 0.3
        },
        element: 'ice'
    },
    {
        id: 'flame_dragon',
        name: '火焰蛟龙',
        type: 'dragon',
        level: 25,
        hp: 500,
        max_hp: 500,
        attack: 75,
        defense: 25,
        expReward: 400,
        silverReward: 160,
        model: '🐲',
        attackPreference: {
            fabao: 0.6,
            player: 0.4
        },
        element: 'fire'
    },
    {
        id: 'thunder_eagle',
        name: '雷霆金鹰',
        type: 'beast',
        level: 30,
        hp: 450,
        max_hp: 450,
        attack: 90,
        defense: 18,
        expReward: 500,
        silverReward: 200,
        model: '🦅',
        attackPreference: {
            fabao: 0.8,
            player: 0.2
        },
        element: 'thunder'
    },
    {
        id: 'void_demon',
        name: '虚空魔',
        type: 'demon',
        level: 35,
        hp: 600,
        max_hp: 600,
        attack: 105,
        defense: 30,
        expReward: 650,
        silverReward: 250,
        model: '👹',
        attackPreference: {
            fabao: 0.4,
            player: 0.6
        },
        element: 'dark'
    },
    {
        id: 'blood_knight',
        name: '血骑士',
        type: 'undead',
        level: 40,
        hp: 700,
        max_hp: 700,
        attack: 120,
        defense: 35,
        expReward: 800,
        silverReward: 300,
        model: '⚔️',
        attackPreference: {
            fabao: 0.3,
            player: 0.7
        }
    },
    {
        id: 'celestial_guardian',
        name: '天界守卫',
        type: 'celestial',
        level: 45,
        hp: 800,
        max_hp: 800,
        attack: 140,
        defense: 40,
        expReward: 1000,
        silverReward: 380,
        model: '👼',
        attackPreference: {
            fabao: 0.5,
            player: 0.5
        },
        element: 'light'
    },
    {
        id: 'ancient_treant',
        name: '远古树人',
        type: 'beast',
        level: 50,
        hp: 1000,
        max_hp: 1000,
        attack: 150,
        defense: 50,
        expReward: 1200,
        silverReward: 450,
        model: '🌳',
        attackPreference: {
            fabao: 0.6,
            player: 0.4
        },
        element: 'earth'
    },
    {
        id: 'frost_wyrm',
        name: '极冰飞龙',
        type: 'dragon',
        level: 55,
        hp: 1100,
        max_hp: 1100,
        attack: 170,
        defense: 55,
        expReward: 1500,
        silverReward: 550,
        model: '🐉',
        attackPreference: {
            fabao: 0.7,
            player: 0.3
        },
        element: 'ice'
    },
    {
        id: 'infernal_lord',
        name: '炼狱领主',
        type: 'demon',
        level: 60,
        hp: 1300,
        max_hp: 1300,
        attack: 190,
        defense: 60,
        expReward: 1800,
        silverReward: 650,
        model: '😈',
        attackPreference: {
            fabao: 0.4,
            player: 0.6
        },
        element: 'fire'
    },
    {
        id: 'storm_titan',
        name: '风暴泰坦',
        type: 'golem',
        level: 65,
        hp: 1500,
        max_hp: 1500,
        attack: 210,
        defense: 70,
        expReward: 2200,
        silverReward: 750,
        model: '⚡',
        attackPreference: {
            fabao: 0.5,
            player: 0.5
        },
        element: 'thunder'
    },
    {
        id: 'shadow_emperor',
        name: '暗影帝王',
        type: 'demon',
        level: 70,
        hp: 1600,
        max_hp: 1600,
        attack: 230,
        defense: 75,
        expReward: 2600,
        silverReward: 850,
        model: '👑',
        attackPreference: {
            fabao: 0.3,
            player: 0.7
        },
        element: 'dark'
    },
    {
        id: 'phoenix',
        name: '涅槃凤凰',
        type: 'beast',
        level: 75,
        hp: 1400,
        max_hp: 1400,
        attack: 260,
        defense: 65,
        expReward: 3000,
        silverReward: 950,
        model: '🔥',
        attackPreference: {
            fabao: 0.8,
            player: 0.2
        },
        element: 'fire'
    },
    {
        id: 'void_dragon',
        name: '虚空龙王',
        type: 'dragon',
        level: 80,
        hp: 1800,
        max_hp: 1800,
        attack: 280,
        defense: 80,
        expReward: 3500,
        silverReward: 1100,
        model: '🐲',
        attackPreference: {
            fabao: 0.6,
            player: 0.4
        },
        element: 'dark'
    },
    {
        id: 'holy_seraph',
        name: '圣光炽天使',
        type: 'celestial',
        level: 85,
        hp: 2000,
        max_hp: 2000,
        attack: 310,
        defense: 90,
        expReward: 4000,
        silverReward: 1250,
        model: '😇',
        attackPreference: {
            fabao: 0.5,
            player: 0.5
        },
        element: 'light'
    },
    {
        id: 'chaos_beast',
        name: '混沌巨兽',
        type: 'beast',
        level: 90,
        hp: 2500,
        max_hp: 2500,
        attack: 350,
        defense: 100,
        expReward: 5000,
        silverReward: 1500,
        model: '💀',
        attackPreference: {
            fabao: 0.7,
            player: 0.3
        }
    }
]

export const getRandomMonster = (levelRange) => {
    const [min, max] = levelRange
    const available = monsters.filter(m => m.level >= min && m.level <= max)
    if (available.length === 0) return monsters[0] // Fallback
    return available[Math.floor(Math.random() * available.length)]
}

export const getMonsterById = (id) => monsters.find(m => m.id === id)
