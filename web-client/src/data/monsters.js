
export const monsters = [
    {
        id: 'slime',
        name: '史莱姆',
        level: 1,
        hp: 30,
        max_hp: 30,
        attack: 5,
        defense: 0,
        expReward: 10,
        silverReward: 5,
        model: '🟢'
    },
    {
        id: 'goblin',
        name: '哥布林',
        level: 3,
        hp: 60,
        max_hp: 60,
        attack: 12,
        defense: 2,
        expReward: 25,
        silverReward: 12,
        model: '👹'
    },
    {
        id: 'wolf',
        name: '森林狼',
        level: 5,
        hp: 100,
        max_hp: 100,
        attack: 18,
        defense: 5,
        expReward: 50,
        silverReward: 20,
        model: '🐺'
    }
]

export const getRandomMonster = (levelRange) => {
    const [min, max] = levelRange
    const available = monsters.filter(m => m.level >= min && m.level <= max)
    if (available.length === 0) return monsters[0] // Fallback
    return available[Math.floor(Math.random() * available.length)]
}
