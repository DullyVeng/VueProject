import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../supabase/client'
import { useCharacterStore } from './character'
import { getQuestById, QuestStatus, canAcceptQuest, isQuestComplete } from '../data/quests'

export const useQuestStore = defineStore('quest', () => {
    const characterStore = useCharacterStore()

    // 玩家任务列表（从数据库加载）
    const playerQuests = ref([])
    const loading = ref(false)

    // 已完成的任务ID列表
    const completedQuestIds = computed(() => {
        return playerQuests.value
            .filter(q => q.status === QuestStatus.FINISHED)
            .map(q => q.quest_id)
    })

    // 进行中的任务
    const activeQuests = computed(() => {
        return playerQuests.value.filter(q =>
            q.status === QuestStatus.ACTIVE || q.status === QuestStatus.COMPLETED
        )
    })

    // 可接取的任务（暂时返回空数组）
    const availableQuests = computed(() => {
        return []
    })

    // 历史任务
    const historyQuests = computed(() => {
        return playerQuests.value.filter(q => q.status === QuestStatus.FINISHED)
    })

    /**
     * 加载玩家任务
     */
    async function fetchQuests() {
        if (!characterStore.character) return

        const { data, error } = await supabase
            .from('player_quests')
            .select('*')
            .eq('character_id', characterStore.character.id)

        if (error) {
            console.error('[Quest] 加载任务失败:', error)
        } else {
            playerQuests.value = data || []
        }
    }

    /**
     * 接取任务
     */
    async function acceptQuest(questId) {
        if (!characterStore.character) return false

        const quest = getQuestById(questId)
        if (!quest) return false

        // 检查是否可接取
        const playerLevel = characterStore.character.level
        if (!canAcceptQuest(quest, playerLevel, completedQuestIds.value)) {
            return false
        }

        // 检查是否已接取
        const existing = playerQuests.value.find(q => q.quest_id === questId)
        if (existing) return false

        // 插入数据库
        const { data, error } = await supabase
            .from('player_quests')
            .insert({
                character_id: characterStore.character.id,
                quest_id: questId,
                status: QuestStatus.ACTIVE,
                objectives: quest.objectives
            })
            .select()
            .single()

        if (error) {
            console.error('[Quest] 接取任务失败:', error)
            return false
        }

        playerQuests.value.push(data)
        console.log('[Quest] 接取任务成功:', quest.name)
        return true
    }

    /**
     * 更新任务进度
     */
    async function updateQuestProgress(questId, objectiveIndex, newCurrent) {
        const playerQuest = playerQuests.value.find(q => q.quest_id === questId)
        if (!playerQuest) return

        const objectives = [...playerQuest.objectives]
        objectives[objectiveIndex].current = newCurrent

        // 检查是否完成
        const quest = getQuestById(questId)
        const allComplete = objectives.every(obj => obj.current >= obj.required)
        const newStatus = allComplete ? QuestStatus.COMPLETED : QuestStatus.ACTIVE

        // 更新数据库
        const { error } = await supabase
            .from('player_quests')
            .update({
                objectives,
                status: newStatus
            })
            .eq('id', playerQuest.id)

        if (!error) {
            playerQuest.objectives = objectives
            playerQuest.status = newStatus

            if (allComplete) {
                console.log('[Quest] 任务完成:', quest.name)
            }
        }
    }

    /**
     * 交付任务（领取奖励）
     */
    async function completeQuest(questId) {
        const playerQuest = playerQuests.value.find(q => q.quest_id === questId)
        if (!playerQuest || playerQuest.status !== QuestStatus.COMPLETED) {
            return false
        }

        const quest = getQuestById(questId)
        if (!quest) return false

        // 发放奖励
        const rewards = quest.rewards

        // 经验
        if (rewards.exp) {
            await characterStore.gainExp(rewards.exp)
            console.log('[Quest] 获得经验:', rewards.exp)
        }

        // 灵石
        if (rewards.silver) {
            await characterStore.gainSilver(rewards.silver)
        }

        // 物品
        if (rewards.items) {
            const { useInventoryStore } = await import('./inventory')
            const inventoryStore = useInventoryStore()

            for (const item of rewards.items) {
                await inventoryStore.addItem(item.id, item.quantity)
            }
        }

        // 更新任务状态
        const { error } = await supabase
            .from('player_quests')
            .update({ status: QuestStatus.FINISHED })
            .eq('id', playerQuest.id)

        if (!error) {
            playerQuest.status = QuestStatus.FINISHED
            console.log('[Quest] 任务交付成功:', quest.name)
            return true
        }

        return false
    }

    /**
     * 检查并更新任务进度（战斗后调用）
     */
    function checkKillQuests() {
        activeQuests.value.forEach(playerQuest => {
            const quest = getQuestById(playerQuest.quest_id)
            if (!quest) return

            quest.objectives.forEach((obj, index) => {
                if (obj.type === 'kill_monsters') {
                    const current = playerQuest.objectives[index].current
                    updateQuestProgress(playerQuest.quest_id, index, current + 1)
                }
            })
        })
    }

    /**
     * 检查采集任务
     */
    function checkCollectQuest(itemId) {
        activeQuests.value.forEach(playerQuest => {
            const quest = getQuestById(playerQuest.quest_id)
            if (!quest) return

            quest.objectives.forEach((obj, index) => {
                if (obj.type === 'collect_items' && obj.target === itemId) {
                    const current = playerQuest.objectives[index].current
                    updateQuestProgress(playerQuest.quest_id, index, current + 1)
                }
            })
        })
    }

    /**
     * 检查访问地点任务
     */
    function checkVisitQuest(locationId) {
        activeQuests.value.forEach(playerQuest => {
            const quest = getQuestById(playerQuest.quest_id)
            if (!quest) return

            quest.objectives.forEach((obj, index) => {
                if (obj.type === 'visit_location' && obj.target === locationId) {
                    updateQuestProgress(playerQuest.quest_id, index, 1)
                }
            })
        })
    }

    return {
        playerQuests,
        loading,
        completedQuestIds,
        activeQuests,
        availableQuests,
        historyQuests,
        fetchQuests,
        acceptQuest,
        updateQuestProgress,
        completeQuest,
        checkKillQuests,
        checkCollectQuest,
        checkVisitQuest
    }
})
