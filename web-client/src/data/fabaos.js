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
            defense: 5
        },

        summonCost: 3,
        shape: [[1, 1], [0, 1]],  // L形
        gridSize: { width: 2, height: 2 },

        spell: {
            id: 'spell_sword_slash',
            name: '剑气斩',
            baseDamage: 30,
            icon: '⚔️',
            description: '释放锋利的剑气攻击敌人'
        },

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
            defense: 8
        },

        summonCost: 5,
        shape: [[1, 1, 1], [0, 1, 0]],  // T形
        gridSize: { width: 3, height: 2 },

        spell: {
            id: 'spell_thunder_sword',
            name: '紫霄雷剑',
            baseDamage: 50,
            icon: '⚡',
            description: '召唤雷霆之力，对敌人造成雷属性伤害'
        },

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
            defense: 25
        },

        summonCost: 4,
        shape: [[1, 1], [1, 1]],  // 方形
        gridSize: { width: 2, height: 2 },

        spell: {
            id: 'spell_shield_wall',
            name: '龟甲护盾',
            baseDamage: 0,
            effect: 'defend',
            defenseBonus: 50,
            icon: '🛡️',
            description: '展开坚固防御，保护主人免受伤害'
        },

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
            defense: 30
        },

        summonCost: 5,
        shape: [[0, 1, 0], [1, 1, 1]],  // 倒T形
        gridSize: { width: 3, height: 2 },

        spell: {
            id: 'spell_golden_bell',
            name: '金钟护体',
            baseDamage: 0,
            effect: 'defend_all',
            defenseBonus: 40,
            icon: '🔔',
            description: '形成金色护盾，为所有友方单位提供防护'
        },

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
            defense: 3
        },

        summonCost: 3,
        shape: [[1, 1, 1]],  // 直线形
        gridSize: { width: 3, height: 1 },

        spell: {
            id: 'spell_fireball',
            name: '烈焰爆',
            baseDamage: 45,
            element: 'fire',
            icon: '🔥',
            description: '释放炽热火球，灼烧敌人'
        },

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
            defense: 15
        },

        summonCost: 4,
        shape: [[1, 0], [1, 1], [1, 0]],  // 十字形
        gridSize: { width: 2, height: 3 },

        spell: {
            id: 'spell_ice_mirror',
            name: '冰镜反射',
            baseDamage: 35,
            element: 'water',
            effect: 'slow',
            icon: '❄️',
            description: '以寒冰之力攻击，并降低敌人速度'
        },

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
            defense: 10
        },

        summonCost: 6,
        shape: [[1, 1, 1], [1, 0, 1]],  // U形
        gridSize: { width: 3, height: 2 },

        spell: {
            id: 'spell_healing_light',
            name: '治愈之光',
            baseDamage: 0,
            effect: 'heal',
            healAmount: 50,
            icon: '✨',
            description: '释放治愈光芒，恢复友方生命值'
        },

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
            defense: 30
        },

        summonCost: 10,
        shape: [[0, 1, 0], [1, 1, 1], [0, 1, 0]],  // 十字大型
        gridSize: { width: 3, height: 3 },

        spell: {
            id: 'spell_xuanyuan_slash',
            name: '轩辕天斩',
            baseDamage: 120,
            icon: '⚡',
            description: '上古神剑的终极技能，天地为之变色'
        },

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
