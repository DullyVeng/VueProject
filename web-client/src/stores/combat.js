
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getRandomMonster } from '../data/monsters'
import { useCharacterStore } from './character'
import { useInventoryStore } from './inventory'
import { useQuestStore } from './quest'
import { useRouter } from 'vue-router'
import { supabase } from '../supabase/client'

export const useCombatStore = defineStore('combat', () => {
    const characterStore = useCharacterStore()
    const inventoryStore = useInventoryStore()
    const questStore = useQuestStore()
    const router = useRouter()

    const isInCombat = ref(false)
    const monster = ref(null)
    const logs = ref([])
    const turn = ref(1)
    const isPlayerTurn = ref(true)

    function addLog(message) {
        logs.value.push(`[回合 ${turn.value}] ${message}`)
    }

    function startCombat(levelRange) {
        const enemy = getRandomMonster(levelRange)
        // Clone monster to avoid mutating static data
        monster.value = { ...enemy }
        isInCombat.value = true
        turn.value = 1
        isPlayerTurn.value = true
        logs.value = []
        addLog(`遭遇了 ${monster.value.name} (Lv.${monster.value.level})!`)
    }

    async function playerAttack() {
        if (!isPlayerTurn.value || !monster.value) return

        const damage = Math.max(1, characterStore.character.attack - monster.value.defense)
        monster.value.hp -= damage
        addLog(`你攻击了 ${monster.value.name}, 造成了 ${damage} 点伤害!`)

        if (monster.value.hp <= 0) {
            monster.value.hp = 0
            await endCombat(true)
        } else {
            isPlayerTurn.value = false
            setTimeout(monsterTurn, 1000) // Monster acts after delay
        }
    }

    async function monsterTurn() {
        if (!isInCombat.value) return

        const damage = Math.max(1, monster.value.attack - characterStore.character.defense)
        characterStore.character.hp -= damage
        addLog(`${monster.value.name} 攻击了你, 造成了 ${damage} 点伤害!`)

        if (characterStore.character.hp <= 0) {
            characterStore.character.hp = 0
            await endCombat(false)
        } else {
            turn.value++
            isPlayerTurn.value = true
        }
    }

    async function escape() {
        addLog('你尝试逃跑...')
        if (Math.random() > 0.5) {
            addLog('逃跑成功!')
            isInCombat.value = false
            router.push('/map')
        } else {
            addLog('逃跑失败!')
            isPlayerTurn.value = false
            setTimeout(monsterTurn, 1000)
        }
    }

    async function endCombat(isWin) {
        isInCombat.value = false
        if (isWin) {
            addLog(`战斗胜利! 获得 ${monster.value.expReward} 点经验值。`)

            // Item Drop Logic (50% chance)
            if (Math.random() > 0.5) {
                const dropItemId = Math.random() > 0.5 ? 'potion_hp_small' : 'potion_mp_small'
                await inventoryStore.addItem(dropItemId, 1)
                addLog(`怪物掉落了物品!`)
            }

            // Update Quest Progress
            questStore.updateProgress(monster.value.id)

            // Update character logic (EXP + Silver)
            const silverReward = monster.value.silverReward || 0
            const newExp = characterStore.character.exp + monster.value.expReward
            const newSilver = (characterStore.character.silver || 0) + silverReward

            // Simple Level Up Logic (Threshold = 100 * level)
            let newLevel = characterStore.character.level
            const reqExp = newLevel * 100

            let updateData = {
                exp: newExp,
                silver: newSilver
            }

            if (newExp >= reqExp) {
                newLevel++
                updateData.level = newLevel
                updateData.max_hp = characterStore.character.max_hp + 10
                updateData.max_mp = characterStore.character.max_mp + 5
                updateData.attack = characterStore.character.attack + 2
                updateData.defense = characterStore.character.defense + 1
                updateData.hp = updateData.max_hp // Full heal on level up
                addLog(`升级了! 等级提升为 ${newLevel}!`)
            }

            await supabase
                .from('characters')
                .update(updateData)
                .eq('id', characterStore.character.id)

            // Sync local
            Object.assign(characterStore.character, updateData)

            addLog(`获得了 ${silverReward} 两白银。`)
            alert(`战斗胜利！获得 ${silverReward} 白银。`)
            router.push('/map')
        } else {
            addLog('你被打败了...')
            alert('胜败乃兵家常事... (HP已恢复)')
            // Revive penalty? For now just heal
            characterStore.character.hp = 1
            await supabase.from('characters').update({ hp: 1 }).eq('id', characterStore.character.id)
            router.push('/map')
        }
    }

    return {
        isInCombat,
        monster,
        logs,
        isPlayerTurn,
        startCombat,
        playerAttack,
        escape
    }
})
