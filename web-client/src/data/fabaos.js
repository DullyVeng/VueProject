// 法宝静态配置数据
// 定义所有可用法宝的基础属性和特性

export const fabaos = [
    // ==================== 剑类法宝 ====================
    {
        id: 'fabao_sword_qinglian',
        name: '青莲剑',
        type: 'sword',
        realm: '灵器',
        rarity: 'common',

        baseStats: {
            hp: 100,
            attack: 20,
            defense: 5,
            mp: 100,
            max_mp: 100
        },

        summonCost: 3,
        shape: [[1, 1], [0, 1]],  // L形
        gridSize: { width: 2, height: 2 },

        spells: [
            {
                id: 'spell_sword_slash',
                name: '剑气斩',
                type: 'attack',
                targetType: 'enemy_single',
                baseDamage: 30,
                mpCost: 20,
                icon: '⚔️',
                description: '释放锋利的剑气攻击敌人'
            },
            {
                id: 'spell_triple_slash',
                name: '三连斩',
                type: 'attack',
                targetType: 'enemy_single',
                baseDamage: 15,
                mpCost: 15,
                icon: '⚡',
                description: '快速斩击，消耗更少MP'
            },
            {
                id: 'spell_sword_barrier',
                name: '剑罡护体',
                type: 'defend',
                targetType: 'self',
                baseDamage: 0,
                mpCost: 25,
                effects: {
                    defenseBonus: 30,
                    duration: 2
                },
                icon: '🛡️',
                description: '凝聚剑气形成护盾，提升防御力'
            }
        ],

        icon: '🗡️',
        description: '入门剑修法宝，形如青莲，剑气凌厉'
    },

    {
        id: 'fabao_sword_zixiao',
        name: '紫霄剑',
        type: 'sword',
        realm: '真器',
        rarity: 'rare',

        baseStats: {
            hp: 150,
            attack: 35,
            defense: 8,
            mp: 120,
            max_mp: 120
        },

        summonCost: 5,
        shape: [[1, 1, 1], [0, 1, 0]],  // T形
        gridSize: { width: 3, height: 2 },

        spells: [
            {
                id: 'spell_thunder_sword',
                name: '紫霄雷剑',
                type: 'attack',
                targetType: 'enemy_single',
                baseDamage: 50,
                mpCost: 30,
                icon: '⚡',
                description: '召唤雷霆之力，对敌人造成雷属性伤害'
            },
            {
                id: 'spell_chain_lightning',
                name: '连锁闪电',
                type: 'attack',
                targetType: 'enemy_all',
                baseDamage: 25,
                mpCost: 40,
                icon: '⛈️',
                description: '闪电链接所有敌人，造成范围伤害'
            }
        ],

        icon: '⚔️',
        description: '蕴含雷霆之力的灵剑，剑身紫光闪烁'
    },

    // ==================== 盾类法宝 ====================
    {
        id: 'fabao_shield_xuangui',
        name: '玄龟盾',
        type: 'shield',
        realm: '灵器',
        rarity: 'common',

        baseStats: {
            hp: 200,
            attack: 5,
            defense: 25,
            mp: 80,
            max_mp: 80
        },

        summonCost: 4,
        shape: [[1, 1], [1, 1]],  // 方形
        gridSize: { width: 2, height: 2 },

        spells: [
            {
                id: 'spell_shield_wall',
                name: '龟甲护盾',
                type: 'defend',
                targetType: 'self',
                baseDamage: 0,
                mpCost: 15,
                effects: {
                    defenseBonus: 50,
                    duration: 2
                },
                icon: '🛡️',
                description: '展开坚固防御，保护主人免受伤害'
            },
            {
                id: 'spell_shell_spike',
                name: '龟甲反刺',
                type: 'attack',
                targetType: 'enemy_single',
                baseDamage: 20,
                mpCost: 20,
                icon: '🔪',
                description: '以龟甲之力反击，对攻击者造成伤害'
            }
        ],

        icon: '🛡️',
        description: '形如玄龟的防御法宝，防御力极强'
    },

    {
        id: 'fabao_shield_jinzhong',
        name: '金钟罩',
        type: 'shield',
        realm: '真器',
        rarity: 'fine',

        baseStats: {
            hp: 250,
            attack: 10,
            defense: 30,
            mp: 100,
            max_mp: 100
        },

        summonCost: 5,
        shape: [[0, 1, 0], [1, 1, 1]],  // 倒T形
        gridSize: { width: 3, height: 2 },

        spells: [
            {
                id: 'spell_golden_bell',
                name: '金钟护体',
                type: 'defend',
                targetType: 'ally_all',
                baseDamage: 0,
                mpCost: 25,
                effects: {
                    defenseBonus: 40,
                    duration: 2
                },
                icon: '🔔',
                description: '形成金色护盾，为所有友方单位提供防护'
            },
            {
                id: 'spell_iron_wall',
                name: '铁壁金钟',
                type: 'defend',
                targetType: 'self',
                baseDamage: 0,
                mpCost: 20,
                effects: {
                    defenseBonus: 80,
                    duration: 2
                },
                icon: '⛩️',
                description: '强化自身防御，大幅提升防御力'
            },
            {
                id: 'spell_reflect_shield',
                name: '反弹护罩',
                type: 'defend',
                targetType: 'ally_single',
                baseDamage: 0,
                mpCost: 30,
                effects: {
                    defenseBonus: 50,
                    duration: 3
                },
                icon: '✨',
                description: '为友方单位提供护盾，可反弹部分伤害'
            }
        ],

        icon: '🔔',
        description: '佛门防御法宝，形成金色光罩护体'
    },

    // ==================== 火类法宝 ====================
    {
        id: 'fabao_fire_chiyan',
        name: '赤焰珠',
        type: 'fire',
        realm: '灵器',
        rarity: 'common',

        baseStats: {
            hp: 80,
            attack: 30,
            defense: 3,
            mp: 90,
            max_mp: 90
        },

        summonCost: 3,
        shape: [[1, 1, 1]],  // 直线形
        gridSize: { width: 3, height: 1 },

        spells: [
            {
                id: 'spell_fireball',
                name: '烈焰爆',
                type: 'attack',
                targetType: 'enemy_single',
                baseDamage: 45,
                mpCost: 25,
                icon: '🔥',
                description: '释放炽热火球，灼烧敌人'
            },
            {
                id: 'spell_flame_burst',
                name: '火焰新星',
                type: 'attack',
                targetType: 'enemy_all',
                baseDamage: 25,
                mpCost: 35,
                icon: '💥',
                description: '释放范围火焰，攻击所有敌人'
            },
            {
                id: 'spell_flame_strike',
                name: '炎击',
                type: 'attack',
                targetType: 'enemy_single',
                baseDamage: 30,
                mpCost: 15,
                icon: '🌡️',
                description: '快速火焰攻击，消耗较少'
            }
        ],

        icon: '🔴',
        description: '蕴含赤焰之力的火属性法宝'
    },

    // ==================== 水类法宝 ====================
    {
        id: 'fabao_water_bingbing',
        name: '寒冰镜',
        type: 'water',
        realm: '真器',
        rarity: 'rare',

        baseStats: {
            hp: 120,
            attack: 25,
            defense: 15,
            mp: 110,
            max_mp: 110
        },

        summonCost: 4,
        shape: [[1], [1], [1]],  // 竖直形
        gridSize: { width: 1, height: 3 },

        spells: [
            {
                id: 'spell_ice_shard',
                name: '寒冰碎',
                type: 'attack',
                targetType: 'enemy_single',
                baseDamage: 35,
                mpCost: 20,
                icon: '❄️',
                description: '发射寒冰碎片，冻伤敌人'
            },
            {
                id: 'spell_frozen_field',
                name: '冰封领域',
                type: 'attack',
                targetType: 'enemy_all',
                baseDamage: 20,
                mpCost: 30,
                icon: '🧊',
                description: '释放寒冰领域，对所有敌人造成伤害'
            },
            {
                id: 'spell_ice_heal',
                name: '寒冰治疗',
                type: 'heal',
                targetType: 'ally_single',
                baseDamage: 0,
                mpCost: 25,
                effects: {
                    heal: 50
                },
                icon: '💎',
                description: '以寒冰之力治疗伤势'
            }
        ],

        icon: '🔷',
        description: '冰属性法宝，可反射攻击并冰冻敌人'
    },

    // ==================== 辅助类法宝 ====================
    {
        id: 'fabao_support_lingdeng',
        name: '七星灯',
        type: 'support',
        realm: '法器',
        rarity: 'epic',

        baseStats: {
            hp: 100,
            attack: 10,
            defense: 10,
            mp: 150,
            max_mp: 150
        },

        summonCost: 6,
        shape: [[1, 1, 1], [1, 0, 1]],  // U形
        gridSize: { width: 3, height: 2 },

        spells: [
            {
                id: 'spell_healing_light',
                name: '治愈之光',
                type: 'heal',
                targetType: 'ally_single',
                baseDamage: 0,
                mpCost: 35,
                effects: {
                    heal: 50
                },
                icon: '✨',
                description: '释放治愈光芒，恢复友方生命值'
            },
            {
                id: 'spell_mass_heal',
                name: '群体治疗',
                type: 'heal',
                targetType: 'ally_all',
                baseDamage: 0,
                mpCost: 50,
                effects: {
                    heal: 30
                },
                icon: '🌟',
                description: '为所有友方恢复生命值'
            },
            {
                id: 'spell_blessing',
                name: '祝福之光',
                type: 'buff',
                targetType: 'ally_single',
                baseDamage: 0,
                mpCost: 40,
                effects: {
                    attackBonus: 20,
                    duration: 3
                },
                icon: '🔆',
                description: '提升友方攻击力'
            }
        ],

        icon: '🏮',
        description: '辅助型法宝，可治疗和增强友方'
    },

    // ==================== 高阶法宝示例 ====================
    {
        id: 'fabao_legendary_xuanyuan',
        name: '轩辕剑',
        type: 'sword',
        realm: '仙器',
        rarity: 'legendary',

        baseStats: {
            hp: 300,
            attack: 80,
            defense: 30,
            mp: 200,
            max_mp: 200
        },

        summonCost: 10,
        shape: [[0, 1, 0], [1, 1, 1], [0, 1, 0]],  // 十字大型
        gridSize: { width: 3, height: 3 },

        spells: [
            {
                id: 'spell_xuanyuan_slash',
                name: '轩辕天斩',
                type: 'attack',
                targetType: 'enemy_all',
                baseDamage: 50,
                mpCost: 60,
                icon: '⚔️',
                description: '传说之剑的必杀技，对所有敌人造成巨大伤害'
            },
            {
                id: 'spell_divine_strike',
                name: '神剑一击',
                type: 'attack',
                targetType: 'enemy_single',
                baseDamage: 100,
                mpCost: 50,
                icon: '🗡️',
                description: '集中全力的单体攻击，造成毁灭性伤害'
            },
            {
                id: 'spell_sword_rain',
                name: '剑雨天降',
                type: 'attack',
                targetType: 'enemy_all',
                baseDamage: 35,
                mpCost: 45,
                icon: '🌩️',
                description: '召唤无数剑影攻击敌人'
            }
        ],

        icon: '⚔️',
        description: '上古神剑，威力无穷，传说中的仙器'
    }
]

// 根据ID获取法宝
export const getFabaoById = (id) => fabaos.find(f => f.id === id)

// 根据类型获取法宝列表
export const getFabaosByType = (type) => fabaos.filter(f => f.type === type)

// 根据境界获取法宝列表
export const getFabaosByRealm = (realm) => fabaos.filter(f => f.realm === realm)

// 根据稀有度获取法宝列表
export const getFabaosByRarity = (rarity) => fabaos.filter(f => f.rarity === rarity)
