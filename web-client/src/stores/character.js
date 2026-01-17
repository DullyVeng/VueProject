
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../supabase/client'
import { useUserStore } from './user'
import { useRouter } from 'vue-router'
import { getRealmRequirement, canAdvanceRealm as canAdvanceRealmUtil, getNextRealm } from '../data/realmRequirements'
import { PLAYER_REALMS } from '../data/playerRealms'

export const useCharacterStore = defineStore('character', () => {
    const character = ref(null)
    const loading = ref(false)
    const error = ref(null)
    const userStore = useUserStore()
    const router = useRouter()

    async function fetchCharacter() {
        if (!userStore.user) return null

        loading.value = true
        const { data, error: err } = await supabase
            .from('characters')
            .select('*')
            .eq('user_id', userStore.user.id)
            .single()

        if (err && err.code !== 'PGRST116') { // PGRST116 is "Row not found"
            console.error('Error fetching character:', err)
            error.value = err.message
        }

        character.value = data
        loading.value = false
        return data
    }

    async function createCharacter(name, gender) {
        if (!userStore.user) return

        loading.value = true
        error.value = null

        const newChar = {
            user_id: userStore.user.id,
            name,
            gender,
            // Default stats are handled by DB defaults, but we can be explicit if needed
        }

        const { data, error: err } = await supabase
            .from('characters')
            .insert(newChar)
            .select()
            .single()

        if (err) {
            error.value = err.message
        } else {
            character.value = data
            router.push('/')
        }

        loading.value = false
        return { data, error: err }
    }

    /**
     * 消耗行动点
     */
    async function consumeActionPoints(amount = 1) {
        if (!character.value) return false

        const current = character.value.current_action_points || 0
        if (current < amount) {
            return false
        }

        const newAP = current - amount

        const { error } = await supabase
            .from('characters')
            .update({ current_action_points: newAP })
            .eq('id', character.value.id)

        if (!error) {
            character.value.current_action_points = newAP
            return true
        }

        return false
    }

    /**
     * 恢复行动点
     */
    async function restoreActionPoints(amount) {
        if (!character.value) return

        const max = character.value.max_action_points || 10
        const current = character.value.current_action_points || 0
        const newAP = Math.min(max, current + amount)

        await supabase
            .from('characters')
            .update({ current_action_points: newAP })
            .eq('id', character.value.id)

        character.value.current_action_points = newAP
    }

    /**
     * 消费灵石
     */
    async function spendSilver(amount) {
        if (!character.value) return false

        const current = character.value.silver || 0
        if (current < amount) {
            return false
        }

        const newSilver = current - amount

        const { error } = await supabase
            .from('characters')
            .update({ silver: newSilver })
            .eq('id', character.value.id)

        if (!error) {
            character.value.silver = newSilver
            return true
        }

        return false
    }

    /**
     * 获得灵石
     */
    async function gainSilver(amount) {
        if (!character.value) return

        const current = character.value.silver || 0
        const newSilver = current + amount

        await supabase
            .from('characters')
            .update({ silver: newSilver })
            .eq('id', character.value.id)

        character.value.silver = newSilver
    }

    /**
     * 更新当前位置（用于位置持久化）
     */
    async function updateCurrentLocation(mapId) {
        if (!character.value) return

        const { error } = await supabase
            .from('characters')
            .update({ current_map: mapId })
            .eq('id', character.value.id)

        if (!error) {
            character.value.current_map = mapId
            console.log(`[CharacterStore] 更新位置: ${mapId}`)
        } else {
            console.error('[CharacterStore] 更新位置失败:', error)
        }
    }

    /**
     * 消耗宗门贡献
     */
    async function spendContribution(amount) {
        if (!character.value) return false

        const current = character.value.contribution || 0
        if (current < amount) {
            return false
        }

        const newContribution = current - amount

        const { error } = await supabase
            .from('characters')
            .update({ contribution: newContribution })
            .eq('id', character.value.id)

        if (!error) {
            character.value.contribution = newContribution
            return true
        }

        return false
    }

    /**
     * 获得宗门贡献
     */
    async function gainContribution(amount) {
        if (!character.value) return

        const current = character.value.contribution || 0
        const newContribution = current + amount

        await supabase
            .from('characters')
            .update({ contribution: newContribution })
            .eq('id', character.value.id)

        character.value.contribution = newContribution
    }

    /**
     * 获得经验
     * 新机制：
     * - 经验公式：50 * level（线性增长）
     * - 经验槽满后无法继续获得经验，需要手动突破境界层数
     * - 溢出经验舍弃
     */
    async function gainExp(amount) {
        if (!character.value) return

        const currentExp = character.value.exp || 0
        const currentLevel = character.value.level || 1
        const newExp = currentExp + amount

        // 升级公式：50 * level
        const expNeeded = currentLevel * 50

        if (newExp >= expNeeded) {
            const newLevel = currentLevel + 1
            const remainingExp = newExp - expNeeded

            // 检查是否可以升级（境界层数是否达到上限）
            const currentRealmLevel = character.value.realm_level || 1
            const expectedRealmLevel = Math.floor(newLevel / 10) // 新等级对应的境界层数

            // 如果新等级需要更高的境界层数，但玩家还没突破，则阻止升级
            if (expectedRealmLevel > currentRealmLevel) {
                // 经验槽已满，无法继续升级
                console.warn(`[Character] 经验槽已满！需要突破至${character.value.realm}${currentRealmLevel + 1}层才能继续升级`)

                // 保持经验为满值
                await supabase
                    .from('characters')
                    .update({ exp: expNeeded })
                    .eq('id', character.value.id)

                character.value.exp = expNeeded
                return
            }

            // 可以升级
            const attributePoints = (character.value.available_attribute_points || 0) + 5

            await supabase
                .from('characters')
                .update({
                    level: newLevel,
                    exp: remainingExp,
                    available_attribute_points: attributePoints
                })
                .eq('id', character.value.id)

            character.value.level = newLevel
            character.value.exp = remainingExp
            character.value.available_attribute_points = attributePoints

            console.log(`[Character] 升级！当前等级：${newLevel}`)
        } else {
            await supabase
                .from('characters')
                .update({ exp: newExp })
                .eq('id', character.value.id)

            character.value.exp = newExp
        }
    }

    /**
     * 突破境界层数
     * 从炼气1层突破到炼气2层等
     * @returns {object} { success: boolean, message: string }
     */
    async function advanceRealmLevel() {
        if (!character.value) return { success: false, message: '角色数据未加载' }

        const currentRealmLevel = character.value.realm_level || 1
        const currentRealm = character.value.realm || 'lianqi'
        const realmConfig = PLAYER_REALMS[currentRealm]
        const currentLevel = character.value.level || 1
        const currentExp = character.value.exp || 0
        const expNeeded = currentLevel * 50

        // 检查是否已达最高层
        if (currentRealmLevel >= (realmConfig?.maxLevel || 9)) {
            return { success: false, message: `已达${realmConfig.name}期最高层，需要突破境界` }
        }

        // 计算所需灵石（每层递增：层数 * 100）
        const silverCost = (currentRealmLevel + 1) * 100
        const currentSilver = character.value.silver || 0

        // 检查灵石
        if (currentSilver < silverCost) {
            return { success: false, message: `灵石不足，需要${silverCost}灵石` }
        }

        // 检查等级条件
        const requiredLevel = (currentRealmLevel + 1) * 10

        // 特殊情况：如果玩家等级已经超过所需等级，则不需要满经验槽
        const needFullExp = currentLevel < requiredLevel

        if (currentLevel < requiredLevel) {
            return { success: false, message: `等级不足，需要${requiredLevel}级` }
        }

        // 如果等级刚好达到要求，需要经验槽满
        if (needFullExp && currentExp < expNeeded) {
            return { success: false, message: '经验槽未满，无法突破' }
        }

        try {
            // 扣除灵石
            const silverSuccess = await spendSilver(silverCost)
            if (!silverSuccess) {
                return { success: false, message: '扣除灵石失败' }
            }

            // 突破：等级+1，境界层数+1，经验清空
            const newLevel = currentLevel + 1
            const newRealmLevel = currentRealmLevel + 1

            await supabase
                .from('characters')
                .update({
                    level: newLevel,
                    realm_level: newRealmLevel,
                    exp: 0  // 清空经验槽
                })
                .eq('id', character.value.id)

            character.value.level = newLevel
            character.value.realm_level = newRealmLevel
            character.value.exp = 0

            console.log(`[Character] 🎉 突破成功！${realmConfig.name} ${newRealmLevel}层，等级${newLevel}`)

            return {
                success: true,
                message: `突破成功！${realmConfig.name}${newRealmLevel}层`,
                newLevel,
                newRealmLevel
            }

        } catch (error) {
            console.error('[Character] 境界层数突破异常:', error)
            return { success: false, message: '突破失败，请重试' }
        }
    }

    /**
     * 检查是否可以突破境界
     * @param {string} targetRealm - 目标境界key
     * @param {array} completedQuestIds - 已完成的任务ID列表
     * @returns {object} { canAdvance: boolean, reasons: string[] }
     */
    function canAdvanceRealm(targetRealm, completedQuestIds = []) {
        if (!character.value) {
            return { canAdvance: false, reasons: ['角色数据未加载'] }
        }
        return canAdvanceRealmUtil(character.value, targetRealm, completedQuestIds)
    }

    /**
     * 突破境界
     * @param {string} targetRealm - 目标境界key
     * @param {array} completedQuestIds - 已完成的任务ID列表
     * @returns {object} { success: boolean, message: string }
     */
    async function advanceRealm(targetRealm, completedQuestIds = []) {
        if (!character.value) {
            return { success: false, message: '角色数据未加载' }
        }

        // 检查是否可以突破
        const checkResult = canAdvanceRealmUtil(character.value, targetRealm, completedQuestIds)
        if (!checkResult.canAdvance) {
            return {
                success: false,
                message: '突破条件不足',
                reasons: checkResult.reasons
            }
        }

        const requirement = getRealmRequirement(targetRealm)
        if (!requirement) {
            return { success: false, message: '未知的目标境界' }
        }

        try {
            // 扣除灵石
            const silverSuccess = await spendSilver(requirement.silverCost)
            if (!silverSuccess) {
                return { success: false, message: '灵石不足' }
            }

            // 更新境界
            const { error } = await supabase
                .from('characters')
                .update({
                    realm: targetRealm,
                    realm_level: 1  // 新境界从1级开始
                })
                .eq('id', character.value.id)

            if (error) {
                console.error('[Character] 境界突破失败:', error)
                // 失败时返还灵石
                await gainSilver(requirement.silverCost)
                return { success: false, message: '境界突破失败，请重试' }
            }

            // 更新本地数据
            character.value.realm = targetRealm
            character.value.realm_level = 1

            const realmName = PLAYER_REALMS[targetRealm]?.name || targetRealm
            console.log(`[Character] 恭喜突破至 ${realmName} 期！`)

            return {
                success: true,
                message: `恭喜突破至 ${realmName} 期！`,
                unlocks: requirement.unlocks
            }

        } catch (error) {
            console.error('[Character] 境界突破异常:', error)
            return { success: false, message: '境界突破异常，请重试' }
        }
    }

    /**
     * 获取当前境界信息
     * @returns {object}
     */
    function getRealmInfo() {
        if (!character.value) return null

        const currentRealm = character.value.realm || 'lianqi'
        const realmConfig = PLAYER_REALMS[currentRealm]
        const nextRealmKey = getNextRealm(currentRealm)
        const nextRealmConfig = nextRealmKey ? PLAYER_REALMS[nextRealmKey] : null
        const advanceRequirement = nextRealmKey ? getRealmRequirement(nextRealmKey) : null

        return {
            current: {
                key: currentRealm,
                name: realmConfig?.name || currentRealm,
                level: character.value.realm_level || 1,
                maxLevel: realmConfig?.maxLevel || 10,
                description: realmConfig?.description || '',
                unlocks: realmConfig?.unlocks || []
            },
            next: nextRealmConfig ? {
                key: nextRealmKey,
                name: nextRealmConfig.name,
                description: nextRealmConfig.description,
                unlocks: nextRealmConfig.unlocks,
                requirement: advanceRequirement
            } : null
        }
    }

    return {
        character,
        loading,
        error,
        fetchCharacter,
        createCharacter,
        consumeActionPoints,
        restoreActionPoints,
        spendSilver,
        gainSilver,
        gainExp,
        advanceRealmLevel,  // 境界层数突破
        advanceRealm,       // 境界突破
        canAdvanceRealm,
        getRealmInfo,
        spendContribution,
        gainContribution,
        updateCurrentLocation
    }
})
