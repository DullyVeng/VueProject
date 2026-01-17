/**
 * NPC数据配置
 */

export const npcs = [
    // 起始镇 - 张掌柜（商人）
    {
        id: 'merchant_zhang',
        name: '张掌柜',
        type: 'merchant',
        avatar: '👨‍💼',
        location: 'town',
        description: '经营杂货铺多年的老掌柜，什么都卖。',

        dialogues: {
            greeting: {
                text: '欢迎光临！这位道友需要点什么？',
                options: [
                    { text: '📜 查看任务', action: 'view_quests' },
                    { text: '💰 查看商品', action: 'open_shop' },
                    { text: '💬 打听消息', next: 'info' },
                    { text: '👋 告辞', action: 'close' }
                ]
            },
            info: {
                text: '最近森林里妖兽活动频繁，道友若要历练，需多加小心啊。',
                options: [
                    { text: '多谢提醒', next: 'greeting' },
                    { text: '告辞', action: 'close' }
                ]
            }
        },

        shop: {
            buyPriceMultiplier: 1.0,
            sellPriceMultiplier: 0.5,
            items: [
                'potion_hp_small',
                'potion_mp_small',
                'sword_iron',
                'robe_cloth',
                'hat_bamboo',
                'teleport_stone'
            ]
        },

        quests: ['quest_002']  // 采集灵草任务
    },

    // 起始镇 - 李长老（信息NPC）
    {
        id: 'elder_li',
        name: '李长老',
        type: 'info',
        avatar: '👴',
        location: 'town',
        description: '镇上德高望重的长老，知晓许多修仙界的秘闻。',

        dialogues: {
            greeting: {
                text: '年轻人，修仙之路漫漫，切勿急功近利。',
                options: [
                    { text: '📜 查看任务', action: 'view_quests' },
                    { text: '请教修炼之道', next: 'cultivation' },
                    { text: '询问周边情况', next: 'map_info' },
                    { text: '告辞', action: 'close' }
                ]
            },
            cultivation: {
                text: '修炼需循序渐进。多历练，多感悟，境界自然水到渠成。',
                options: [
                    { text: '受教了', next: 'greeting' },
                    { text: '告辞', action: 'close' }
                ]
            },
            map_info: {
                text: '北面的迷雾森林适合初学者历练，东边的青石山则稍有难度。量力而行为好。',
                options: [
                    { text: '多谢指点', next: 'greeting' },
                    { text: '告辞', action: 'close' }
                ]
            }
        },

        quests: ['quest_001', 'quest_003']
    },

    // 起始镇 - 任务发布者
    {
        id: 'quest_master',
        name: '王执事',
        type: 'quest_giver',
        avatar: '📜',
        location: 'town',
        description: '负责发布各种委托任务的执事。',

        dialogues: {
            greeting: {
                text: '道友可是来接任务的？',
                options: [
                    { text: '📜 查看任务', action: 'view_quests' },
                    { text: '告辞', action: 'close' }
                ]
            }
        },

        quests: []
    },

    // 修仙坊市 - 炼丹师
    {
        id: 'alchemist_chen',
        name: '陈炼丹师',
        type: 'merchant',
        avatar: '🧙',
        location: 'market',
        description: '擅长炼制各种丹药的炼丹师。',

        dialogues: {
            greeting: {
                text: '需要丹药吗？我这里的丹药品质上乘。',
                options: [
                    { text: '📜 查看任务', action: 'view_quests' },
                    { text: '💰 查看丹药', action: 'open_shop' },
                    { text: '告辞', action: 'close' }
                ]
            }
        },

        shop: {
            buyPriceMultiplier: 1.2,
            sellPriceMultiplier: 0.6,
            items: [
                'potion_hp_small',
                'potion_mp_small'
            ]
        },

        quests: ['quest_side_001']  // 收集妖兽内丹任务
    },

    // 修仙坊市 - 法宝商人
    {
        id: 'fabao_merchant',
        name: '法宝商人',
        type: 'fabao_shop',
        avatar: '🔮',
        location: 'market',
        description: '专门收购和出售各类法宝的神秘商人。',

        dialogues: {
            greeting: {
                text: '道友可是为了寻觅趁手的法宝而来？我这里的货色绝对包你满意。',
                options: [
                    { text: '🔮 查看法宝', action: 'open_fabao_shop' },
                    { text: '告辞', action: 'close' }
                ]
            }
        },

        fabaoShop: true
    },

    // 宗门 - 宗门执事
    {
        id: 'sect_executor',
        name: '宗门执事',
        type: 'sect_shop',
        avatar: '📜',
        location: 'outer_plaza',
        description: '负责宗门贡献兑换和日常事务的执事。',

        dialogues: {
            greeting: {
                text: '为宗门做出贡献的弟子，理应得到奖赏。',
                options: [
                    { text: '🏛️ 贡献兑换', action: 'open_sect_shop' },
                    { text: '告辞', action: 'close' }
                ]
            }
        },

        sectShop: true
    }
]

// 根据ID获取NPC
export const getNpcById = (id) => npcs.find(n => n.id === id)

// 根据位置获取NPC列表
export const getNpcsByLocation = (locationId) => npcs.filter(n => n.location === locationId)
