
export const items = [
    {
        id: 'potion_hp_small',
        name: '小还丹',
        type: 'consumable',
        effect: {
            type: 'restore_hp',
            value: 20
        },
        description: '炼气期常用的疗伤丹药，恢复 20 点生命值。',
        price: 10,
        icon: '💊'
    },
    {
        id: 'potion_mp_small',
        name: '回气丹',
        type: 'consumable',
        effect: {
            type: 'restore_mp',
            value: 10
        },
        description: '凝聚灵气的丹药，恢复 10 点魔法值。',
        price: 15,
        icon: '🔮'
    },
    {
        id: 'sword_iron',
        name: '青铁剑',
        type: 'equipment',
        slot: 'weapon',
        stats: {
            attack: 5,
            defense: 0
        },
        description: '凡铁打造的剑器，略微锋利。',
        price: 50,
        icon: '🗡️'
    },
    {
        id: 'robe_cloth',
        name: '粗布道袍',
        type: 'equipment',
        slot: 'armor',
        stats: {
            attack: 0,
            defense: 2
        },
        description: '普通的道袍，稍微能挡点风沙。',
        price: 30,
        icon: '👕'
    },
    {
        id: 'hat_bamboo',
        name: '竹斗笠',
        type: 'equipment',
        slot: 'head',
        stats: {
            attack: 0,
            defense: 1
        },
        description: '行走江湖遮阳避雨的必备之物。',
        price: 15,
        icon: '🧢'
    },
    {
        id: 'necklace_jade',
        name: '平安扣',
        type: 'equipment',
        slot: 'necklace',
        stats: {
            attack: 0,
            defense: 1
        },
        description: '刻有平安咒的玉佩，聊胜于无。',
        price: 40,
        icon: '📿'
    },
    {
        id: 'shield_wood',
        name: '灵木盾',
        type: 'equipment',
        slot: 'offhand',
        stats: {
            attack: 0,
            defense: 5
        },
        description: '注入了微弱灵气的木盾。',
        price: 100,
        icon: '🛡️'
    },
    {
        id: 'ring_copper',
        name: '黄铜戒',
        type: 'equipment',
        slot: 'ring',
        stats: {
            attack: 1,
            defense: 0
        },
        description: '普通的铜戒指，稍微增加一点出手力度。',
        price: 25,
        icon: '💍'
    },
    {
        id: 'boots_cloth',
        name: '草鞋',
        type: 'equipment',
        slot: 'feet',
        stats: {
            attack: 0,
            defense: 1
        },
        description: '用灵草编织的草鞋，轻便舒适。',
        price: 20,
        icon: '🩴'
    },
    {
        id: 'boots_leather',
        name: '追风靴',
        type: 'equipment',
        slot: 'feet',
        stats: {
            attack: 1,
            defense: 2
        },
        description: '刻有疾风阵法的皮靴。',
        price: 80,
        icon: '👢'
    },
    {
        id: 'mirror_bagua',
        name: '八卦镜',
        type: 'equipment',
        slot: 'fabao',
        stats: {
            attack: 5,
            defense: 2
        },
        description: '道家法器，可攻可守。',
        price: 200,
        icon: '☯️'
    }
]

export const getItemById = (id) => items.find(i => i.id === id)
