
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
    },

    // ========== 资源类物品 ==========
    // 草药
    {
        id: 'lingcao',
        name: '灵草',
        type: 'material',
        category: 'herb',
        description: '普通的灵草，可用于炼丹。',
        price: 5,
        icon: '🌿'
    },
    {
        id: 'qingling',
        name: '青灵草',
        type: 'material',
        category: 'herb',
        description: '带有微弱灵气的青色草药，炼丹良材。',
        price: 15,
        icon: '🍀'
    },
    {
        id: 'frost_lotus',
        name: '寒冰莲',
        type: 'material',
        category: 'herb',
        description: '生长在极寒之地的莲花，蕴含冰属性灵气。',
        price: 80,
        icon: '❄️'
    },

    // 矿石
    {
        id: 'iron_ore',
        name: '铁矿石',
        type: 'material',
        category: 'ore',
        description: '普通的铁矿石，可用于炼器。',
        price: 3,
        icon: '⛰️'
    },
    {
        id: 'silver_ore',
        name: '银矿石',
        type: 'material',
        category: 'ore',
        description: '品质较好的银矿，炼器佳品。',
        price: 12,
        icon: '💎'
    },
    {
        id: 'flame_essence',
        name: '火焰精华',
        type: 'material',
        category: 'ore',
        description: '蕴含火属性灵力的矿石，极为珍贵。',
        price: 100,
        icon: '🔥'
    },

    // 水晶
    {
        id: 'dark_crystal',
        name: '暗影水晶',
        type: 'material',
        category: 'crystal',
        description: '洞穴深处形成的黑色水晶，吸收阴暗之气。',
        price: 25,
        icon: '🔮'
    },

    // 妖兽材料
    {
        id: 'beast_core',
        name: '妖兽内丹',
        type: 'material',
        category: 'material',
        description: '妖兽体内凝聚的内丹，蕴含强大能量。',
        price: 150,
        icon: '⚡'
    },
    {
        id: 'spirit_fur',
        name: '灵兽皮毛',
        type: 'material',
        category: 'material',
        description: '灵兽的皮毛，柔软且坚韧。',
        price: 35,
        icon: '🦊'
    },

    // ========== 宗门建设材料 ==========
    {
        id: 'wood',
        name: '木材',
        type: 'sect_material',
        category: 'building',
        description: '用于宗门建筑的基础木材。',
        price: 2,
        icon: '🪵'
    },
    {
        id: 'stone',
        name: '石料',
        type: 'sect_material',
        category: 'building',
        description: '用于宗门建筑的基础石料。',
        price: 2,
        icon: '🪨'
    },
    {
        id: 'jade',
        name: '玉璧',
        type: 'sect_material',
        category: 'building',
        description: '珍贵的玉石材料，用于高级建筑。',
        price: 100,
        icon: '💠'
    },
    {
        id: 'formationFlag',
        name: '阵旗',
        type: 'sect_material',
        category: 'building',
        description: '布置阵法的核心材料。',
        price: 50,
        icon: '🚩'
    },
    {
        id: 'iron',
        name: '铁矿',
        type: 'sect_material',
        category: 'building',
        description: '用于宗门建筑的基础铁矿。',
        price: 3,
        icon: '⛏️'
    },
    {
        id: 'spiritStone',
        name: '灵石',
        type: 'currency',
        category: 'currency',
        description: '修仙界通用货币，用于各种消耗。',
        price: 1,
        icon: '💎'
    },

    // ========== 建筑图纸 ==========
    {
        id: 'blueprint_zhenfatang',
        name: '阵法堂图纸',
        type: 'blueprint',
        category: 'sect',
        buildingId: 'zhenFaTang',
        description: '使用后解锁阵法堂建造。',
        price: 500,
        icon: '📜'
    },
    {
        id: 'blueprint_cangbaoge',
        name: '藏宝阁图纸',
        type: 'blueprint',
        category: 'sect',
        buildingId: 'cangBaoGe',
        description: '使用后解锁藏宝阁建造。',
        price: 500,
        icon: '📜'
    },
    {
        id: 'blueprint_chuansongzhen',
        name: '传送阵图纸',
        type: 'blueprint',
        category: 'sect',
        buildingId: 'chuanSongZhen',
        description: '使用后解锁传送阵建造。',
        price: 800,
        icon: '📜'
    },
    {
        id: 'blueprint_mijingrukou',
        name: '秘境入口图纸',
        type: 'blueprint',
        category: 'sect',
        buildingId: 'miJingRuKou',
        description: '使用后解锁秘境入口建造。',
        price: 1000,
        icon: '📜'
    },
    {
        id: 'blueprint_julingzhen',
        name: '聚灵阵图纸',
        type: 'blueprint',
        category: 'sect',
        buildingId: 'juLingZhen',
        description: '使用后解锁聚灵阵建造。',
        price: 800,
        icon: '📜'
    },
    {
        id: 'blueprint_hushandazhen',
        name: '护山大阵图纸',
        type: 'blueprint',
        category: 'sect',
        buildingId: 'huShanDaZhen',
        description: '使用后解锁护山大阵建造。',
        price: 1500,
        icon: '📜'
    }
]

export const getItemById = (id) => items.find(i => i.id === id)

// 获取所有宗门建设材料
export const getSectMaterials = () => items.filter(i => i.type === 'sect_material')

// 获取所有建筑图纸
export const getBlueprints = () => items.filter(i => i.type === 'blueprint')
