export const maps = [
    {
        id: 'town',
        name: '起始镇',
        description: '一个宁静的小镇，冒险者们聚集的地方。这里很安全。',
        type: 'safe',
        connections: ['forest']
    },
    {
        id: 'forest',
        name: '迷雾森林',
        description: '充满了迷雾的森林，据说深处有危险的生物出没。(建议等级: Lv.1-5)',
        type: 'wild',
        levelRange: [1, 5],
        connections: ['town', 'cave']
    },
    {
        id: 'cave',
        name: '幽暗洞穴',
        description: '深不见底的洞穴，常常能听到怪物的嘶吼声。(建议等级: Lv.5-10)',
        type: 'wild',
        levelRange: [5, 10],
        connections: ['forest']
    }
]

export const getMapById = (id) => maps.find(m => m.id === id)
