// 宗门贡献兑换商店配置
export const sectShopItems = [
    // 中级法宝 - 需要较多贡献
    {
        fabaoId: 'fabao_sword_zixiao',
        price: 1000,
        stock: -1,
        description: '宗门真传弟子方可兑换的上品飞剑。'
    },
    {
        fabaoId: 'fabao_shield_jinzhong',
        price: 1200,
        stock: -1,
        description: '防御惊人的金钟法宝，保命必备。'
    },
    {
        fabaoId: 'fabao_water_bingbing',
        price: 1000,
        stock: -1,
        description: '蕴含极寒之力的冰系法宝。'
    },
    // 高级辅助法宝
    {
        fabaoId: 'fabao_support_lingdeng',
        price: 3000,
        stock: 1, // 限购1个
        description: '传说中的灵灯，可照破迷障，恢复灵力。'
    }
]
