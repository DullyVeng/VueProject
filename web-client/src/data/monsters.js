
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
        element: 'fire',  // 元素属性
        drops: [
            { id: 'jade', chance: 0.1, amount: [1, 1] },
            { id: 'spiritStone', chance: 0.8, amount: [4, 8] }
        ]
    }
]

export const getRandomMonster = (levelRange) => {
    const [min, max] = levelRange
    const available = monsters.filter(m => m.level >= min && m.level <= max)
    if (available.length === 0) return monsters[0] // Fallback
    return available[Math.floor(Math.random() * available.length)]
}

export const getMonsterById = (id) => monsters.find(m => m.id === id)
