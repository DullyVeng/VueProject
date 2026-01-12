
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../supabase/client'
import { useUserStore } from './user'
import { useRouter } from 'vue-router'

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

    return {
        character,
        loading,
        error,
        fetchCharacter,
        createCharacter,
        consumeActionPoints,
        restoreActionPoints,
        spendSilver,
        gainSilver
    }
})
