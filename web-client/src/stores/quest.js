
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../supabase/client'
import { useCharacterStore } from './character'
import { useInventoryStore } from './inventory'
import { quests, getQuestById } from '../data/quests'

export const useQuestStore = defineStore('quest', () => {
    const activeQuests = ref([]) // Active or Completed (but not finished)
    const historyQuests = ref([]) // Finished
    const availableQuests = ref([]) // Quests available to pick up
    const loading = ref(false)

    const characterStore = useCharacterStore()
    const inventoryStore = useInventoryStore()

    async function fetchQuests() {
        if (!characterStore.character) return

        loading.value = true
        const { data: userQuests, error } = await supabase
            .from('character_quests')
            .select('*')
            .eq('character_id', characterStore.character.id)

        if (error) {
            console.error('Error fetching quests:', error)
            loading.value = false
            return
        }

        // Separate into lists
        activeQuests.value = []
        historyQuests.value = []

        const userQuestIds = new Set()

        userQuests.forEach(uq => {
            userQuestIds.add(uq.quest_id)
            const staticData = getQuestById(uq.quest_id)
            if (!staticData) return // Skip if data missing

            const fullQuest = { ...staticData, ...uq }
            if (uq.status === 'finished') {
                historyQuests.value.push(fullQuest)
            } else {
                activeQuests.value.push(fullQuest)
            }
        })

        // Determine available quests (Not in userQuests)
        // In a real game we would check level requirements or pre-requisites
        availableQuests.value = quests.filter(q => !userQuestIds.has(q.id))

        loading.value = false
    }

    async function acceptQuest(questId) {
        if (!characterStore.character) return

        const { data, error } = await supabase
            .from('character_quests')
            .insert({
                character_id: characterStore.character.id,
                quest_id: questId,
                progress: 0,
                status: 'active'
            })
            .select()
            .single()

        if (error) {
            alert('接受任务失败')
            console.error(error)
        } else {
            const staticData = getQuestById(questId)
            activeQuests.value.push({ ...staticData, ...data })
            availableQuests.value = availableQuests.value.filter(q => q.id !== questId)
            alert(`接受了任务: ${staticData.title}`)
        }
    }

    async function updateProgress(monsterId) {
        // Find active quests that target this monster
        const targets = activeQuests.value.filter(q =>
            q.status === 'active' &&
            q.target.type === 'kill' &&
            q.target.monsterId === monsterId
        )

        if (targets.length === 0) return

        for (const quest of targets) {
            if (quest.progress < quest.target.count) {
                const newProgress = quest.progress + 1
                let newStatus = 'active'
                if (newProgress >= quest.target.count) {
                    newStatus = 'completed' // Ready for turn-in
                    alert(`任务完成: ${quest.title}! 请前往任务列表领取奖励。`)
                }

                // Optimistic update
                quest.progress = newProgress
                quest.status = newStatus

                // DB Update
                await supabase
                    .from('character_quests')
                    .update({
                        progress: newProgress,
                        status: newStatus,
                        updated_at: new Date()
                    })
                    .eq('id', quest.id) // quest.id is the Row UUID here because we merged it in fetchQuests/acceptQuest
            }
        }
    }

    async function claimReward(quest) {
        if (quest.status !== 'completed') return

        // 1. Give Exp
        const newExp = characterStore.character.exp + quest.reward.exp
        // Note: Level up logic is currently duplicated in CombatStore. 
        // Ideally should be a method in CharacterStore. For now just update EXP.
        await supabase.from('characters').update({ exp: newExp }).eq('id', characterStore.character.id)
        characterStore.character.exp = newExp

        // 2. Give Items
        for (const item of quest.reward.items) {
            await inventoryStore.addItem(item.id, item.count)
        }

        // 3. Mark Finished
        const { error } = await supabase
            .from('character_quests')
            .update({ status: 'finished', updated_at: new Date() })
            .eq('id', quest.id)

        if (!error) {
            quest.status = 'finished'
            // Move to history
            activeQuests.value = activeQuests.value.filter(q => q.id !== quest.id)
            historyQuests.value.push(quest)
            alert(`领取成功! 获得 ${quest.reward.exp} 经验和奖励物品。`)
        }
    }

    return {
        activeQuests,
        historyQuests,
        availableQuests,
        loading,
        fetchQuests,
        acceptQuest,
        updateProgress,
        claimReward
    }
})
