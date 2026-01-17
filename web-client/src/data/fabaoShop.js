/**
 * 法宝商店配置数据
 * 定义可在商店购买的法宝列表
 */

export const fabaoShopItems = [
    // 基础灵器 - 剑
    {
        fabaoId: 'fabao_sword_qinglian',
        price: 500,
        stock: -1, // -1 表示无限库存
        currency: 'silver'
    },
    // 基础灵器 - 盾
    {
        fabaoId: 'fabao_shield_xuangui',
        price: 600,
        stock: -1,
        currency: 'silver'
    },
    // 基础灵器 - 火
    {
        fabaoId: 'fabao_fire_chiyan',
        price: 500,
        stock: -1,
        currency: 'silver'
    }
]
