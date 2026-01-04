import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../supabase/client'
import { useCharacterStore } from './character'

export const useAttributeStore = defineStore('attribute', () => {
    const loading = ref(false)
    const error = ref(null)
    const characterStore = useCharacterStore()

    // ==================== 属性配置 ====================

    const ATTRIBUTE_CONFIG = {
        spiritPower: {
            name: '灵力',
            icon: '✨',
            costPerPoint: 1,
            effects: [
                '丹田容量: 每点+1格',
                '法宝行动点上限: 每5点+1',
                '行动点恢复速度: 每10点+10%',
                '法术威力: 每点+2%'
            ]
        },
        divineSense: {
            name: '神识',
            icon: '🧠',
            costPerPoint: 1,
            effects: [
                '识海容量: 每点+1格 (P1功能)',
                '功法数量上限: 每5点+1',
                '功法羁绊属性提升率: 每10点+5%'
            ]
        },
        bodyConstitution: {
            name: '体魄',
            icon: '💪',
            costPerPoint: 1,
            effects: [
                '角色生命值: 每点+10 HP',
                '角色防御力: 每点+1',
                '法宝耐久度: 每点+5%',
                '法宝生命值: 每2点+5'
            ]
        },
        comprehension: {
            name: '悟性',
            icon: '📖',
            costPerPoint: 2,  // 悟性更稀缺
            effects: [
                '功法升级速度: 每点-2%时间 (P1功能)',
                '功法羁绊属性提升率: 每点+1%',
                '特殊功法领悟几率: 每10点+5%'
            ]
        },
        fortune: {
            name: '气运',
            icon: '🍀',
            costPerPoint: 3,  // 气运最稀缺
            effects: [
                '法宝强化成功率: 每点+0.5%',
                '法宝进化几率: 每点+1% (P1功能)',
                '稀有法宝掉落: 每点+0.3%',
                '功法掉落品质: 每5点提升一档'
            ]
        }
    }

    // ==================== 计算属性 ====================

    // 当前属性值
    const attributes = computed(() => {
        if (!characterStore.character) {
            return {
                spiritPower: 10,
                divineSense: 10,
                bodyConstitution: 10,
                comprehension: 5,
                fortune: 5
            }
        }

        return {
            spiritPower: characterStore.character.spirit_power || 10,
            divineSense: characterStore.character.divine_sense || 10,
            bodyConstitution: characterStore.character.body_constitution || 10,
            comprehension: characterStore.character.comprehension || 5,
            fortune: characterStore.character.fortune || 5
        }
    })

    // 可用属性点
    const availablePoints = computed(() =>
        characterStore.character?.available_attribute_points || 0
    )

    // 衍生属性
    const derivedStats = computed(() => {
        const attrs = attributes.value

        return {
            // 丹田相关
            dantianCapacity: 25 + attrs.spiritPower,
            dantianWidth: characterStore.character?.dantian_width || 5,
            dantianHeight: characterStore.character?.dantian_height || 5,

            // 行动点相关
            maxActionPoints: 10 + Math.floor(attrs.spiritPower / 5),
            actionPointsRegen: Math.floor(3 + (characterStore.character?.level || 1) * 0.5 + attrs.spiritPower * 0.1),

            // 战斗属性加成
            bonusHP: attrs.bodyConstitution * 10,
            bonusDefense: attrs.bodyConstitution,
            spellPowerMultiplier: 1.0 + attrs.spiritPower * 0.02,
            fabaoDurabilityBonus: 1.0 + attrs.bodyConstitution * 0.05,

            // 功法相关 (P1功能预留)
            identSeaCapacity: 25 + attrs.divineSense,
            maxKungfuCount: 1 + Math.floor(attrs.divineSense / 5),
            kungfuSynergyBonus: 1.0 + (attrs.divineSense * 0.05 + attrs.comprehension * 0.01),

            // 特殊加成
            enhanceSuccessRateBonus: attrs.fortune * 0.005,
            rareFabaoDropBonus: attrs.fortune * 0.003
        }
    })

    // ==================== 核心方法 ====================

    /**
     * 分配属性点
     */
    async function allocatePoint(attributeName, amount = 1) {
        if (!characterStore.character) {
            return { success: false, reason: '角色未加载' }
        }

        const config = ATTRIBUTE_CONFIG[attributeName]
        if (!config) {
            return { success: false, reason: '属性名称无效' }
        }

        // 计算所需点数
        const requiredPoints = config.costPerPoint * amount

        if (availablePoints.value < requiredPoints) {
            return { success: false, reason: '可用属性点不足' }
        }

        loading.value = true
        error.value = null

        try {
            const currentValue = attributes.value[attributeName]
            const newValue = currentValue + amount
            const newAvailable = availablePoints.value - requiredPoints

            // 转换为数据库字段名
            const dbFieldName = camelToSnake(attributeName)

            const updateData = {
                [dbFieldName]: newValue,
                available_attribute_points: newAvailable
            }

            // 如果是灵力，还需要更新行动点上限
            if (attributeName === 'spiritPower') {
                const newMaxAP = 10 + Math.floor(newValue / 5)
                updateData.max_action_points = newMaxAP
            }

            const { error: err } = await supabase
                .from('characters')
                .update(updateData)
                .eq('id', characterStore.character.id)

            if (err) throw err

            // 更新本地状态
            Object.assign(characterStore.character, updateData)

            return { success: true }
        } catch (err) {
            console.error('分配属性点失败:', err)
            error.value = err.message
            return { success: false, reason: err.message }
        } finally {
            loading.value = false
        }
    }

    /**
     * 批量分配属性点
     */
    async function allocateMultiple(allocations) {
        if (!characterStore.character) {
            return { success: false, reason: '角色未加载' }
        }

        // 计算总消耗
        let totalCost = 0
        for (const [attrName, amount] of Object.entries(allocations)) {
            const config = ATTRIBUTE_CONFIG[attrName]
            if (!config) continue
            totalCost += config.costPerPoint * amount
        }

        if (availablePoints.value < totalCost) {
            return { success: false, reason: '可用属性点不足' }
        }

        loading.value = true
        error.value = null

        try {
            const updateData = {
                available_attribute_points: availablePoints.value - totalCost
            }

            // 构建更新数据
            for (const [attrName, amount] of Object.entries(allocations)) {
                if (amount <= 0) continue
                const currentValue = attributes.value[attrName]
                const newValue = currentValue + amount
                const dbFieldName = camelToSnake(attrName)
                updateData[dbFieldName] = newValue
            }

            // 更新行动点上限（如果灵力有变化）
            if (allocations.spiritPower) {
                const newSpiritPower = attributes.value.spiritPower + allocations.spiritPower
                updateData.max_action_points = 10 + Math.floor(newSpiritPower / 5)
            }

            const { error: err } = await supabase
                .from('characters')
                .update(updateData)
                .eq('id', characterStore.character.id)

            if (err) throw err

            // 更新本地状态
            Object.assign(characterStore.character, updateData)

            return { success: true }
        } catch (err) {
            console.error('批量分配属性点失败:', err)
            error.value = err.message
            return { success: false, reason: err.message }
        } finally {
            loading.value = false
        }
    }

    /**
     * 重置属性（消耗道具或灵石）
     */
    async function resetAttributes(useItem = false) {
        if (!characterStore.character) {
            return { success: false, reason: '角色未加载' }
        }

        const level = characterStore.character.level || 1
        const totalPoints = level * 3  // 每级3点

        // 如果不使用道具，需要消耗灵石
        let resetCost = 0
        if (!useItem) {
            resetCost = 1000 * level  // 每级1000灵石
            const currentSilver = characterStore.character.silver || 0

            if (currentSilver < resetCost) {
                return { success: false, reason: '灵石不足' }
            }
        }

        loading.value = true
        error.value = null

        try {
            const updateData = {
                spirit_power: 10,
                divine_sense: 10,
                body_constitution: 10,
                comprehension: 5,
                fortune: 5,
                available_attribute_points: totalPoints,
                max_action_points: 10 + Math.floor(10 / 5)  // 重置为初始灵力的行动点
            }

            if (!useItem) {
                updateData.silver = (characterStore.character.silver || 0) - resetCost
            }

            const { error: err } = await supabase
                .from('characters')
                .update(updateData)
                .eq('id', characterStore.character.id)

            if (err) throw err

            // 更新本地状态
            Object.assign(characterStore.character, updateData)

            return { success: true, cost: resetCost }
        } catch (err) {
            console.error('重置属性失败:', err)
            error.value = err.message
            return { success: false, reason: err.message }
        } finally {
            loading.value = false
        }
    }

    /**
     * 升级时自动分配属性点
     */
    async function addPointsOnLevelUp(newLevel) {
        if (!characterStore.character) return

        // 根据境界给予不同的属性点
        let pointsPerLevel = 3  // 炼气期每级3点

        const realm = characterStore.character.realm || 'lianqi'
        if (realm === 'zhuji') pointsPerLevel = 4  // 筑基期每级4点
        if (realm === 'jindan') pointsPerLevel = 5  // 金丹期每级5点

        try {
            const newPoints = (characterStore.character.available_attribute_points || 0) + pointsPerLevel

            const { error: err } = await supabase
                .from('characters')
                .update({ available_attribute_points: newPoints })
                .eq('id', characterStore.character.id)

            if (err) throw err

            characterStore.character.available_attribute_points = newPoints

            return pointsPerLevel
        } catch (err) {
            console.error('添加升级属性点失败:', err)
        }
    }

    // ==================== 辅助函数 ====================

    /**
     * 驼峰转下划线
     */
    function camelToSnake(str) {
        return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
    }

    /**
     * 获取属性配置
     */
    function getAttributeConfig(attributeName) {
        return ATTRIBUTE_CONFIG[attributeName]
    }

    /**
     * 计算属性消耗
     */
    function calculateCost(attributeName, amount) {
        const config = ATTRIBUTE_CONFIG[attributeName]
        return config ? config.costPerPoint * amount : 0
    }

    return {
        loading,
        error,
        attributes,
        availablePoints,
        derivedStats,
        ATTRIBUTE_CONFIG,
        allocatePoint,
        allocateMultiple,
        resetAttributes,
        addPointsOnLevelUp,
        getAttributeConfig,
        calculateCost
    }
})
