
export const quests = [
    {
        id: 'quest_newbie_slime',
        title: '初出茅庐',
        description: '附近的史莱姆泛滥成灾，村长委托你去清理它们。',
        target: {
            type: 'kill',
            monsterId: 'slime',
            count: 3
        },
        reward: {
            exp: 50,
            items: [
                { id: 'potion_hp_small', count: 1 }
            ]
        }
    },
    {
        id: 'quest_wolf_hunt',
        title: '森林猎狼',
        description: '森林深处的狼群威胁到了村民的安全。',
        target: {
            type: 'kill',
            monsterId: 'wolf',
            count: 1
        },
        reward: {
            exp: 100,
            items: [
                { id: 'potion_mp_small', count: 2 }
            ]
        }
    }
]

export const getQuestById = (id) => quests.find(q => q.id === id)
