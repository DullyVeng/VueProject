
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../supabase/client'
import { useCharacterStore } from './character'
import { useInventoryStore } from './inventory'

export const useShopStore = defineStore('shop', () => {
    const characterStore = useCharacterStore()
    const inventoryStore = useInventoryStore()
    const loading = ref(false)

    async function buyItem(item, quantity = 1) {
        if (!characterStore.character) return

        const totalCost = item.price * quantity
        if (characterStore.character.silver < totalCost) {
            alert('白银不足！')
            return
        }

        loading.value = true

        // 1. Deduct Silver
        const newSilver = characterStore.character.silver - totalCost
        const { error: silverError } = await supabase
            .from('characters')
            .update({ silver: newSilver })
            .eq('id', characterStore.character.id)

        if (silverError) {
            console.error('Purchase failed (silver):', silverError)
            loading.value = false
            return
        }

        // 2. Add Item
        await inventoryStore.addItem(item.id, quantity)

        // Update Local State
        characterStore.character.silver = newSilver
        alert(`购买成功！花费了 ${totalCost} 两白银。`)

        loading.value = false
    }

    async function restAtInn(type) {
        if (!characterStore.character) return

        const costs = {
            'basic': 10,
            'premium': 50
        }

        const cost = costs[type]
        if (characterStore.character.silver < cost) {
            alert('客官，您的银子不够啊！')
            return
        }

        loading.value = true

        // 1. Deduct Silver & Heal Character
        const newSilver = characterStore.character.silver - cost
        let updateData = { silver: newSilver }

        if (type === 'basic') {
            // Heal 50%
            updateData.hp = Math.min(characterStore.character.max_hp, characterStore.character.hp + Math.floor(characterStore.character.max_hp * 0.5))
            updateData.mp = Math.min(characterStore.character.max_mp, characterStore.character.mp + Math.floor(characterStore.character.max_mp * 0.5))
        } else {
            // Full Heal
            updateData.hp = characterStore.character.max_hp
            updateData.mp = characterStore.character.max_mp
        }

        const { error } = await supabase
            .from('characters')
            .update(updateData)
            .eq('id', characterStore.character.id)

        if (error) {
            console.error('Rest failed:', error)
            alert('住宿失败，请稍后再试。')
            loading.value = false
            return false // Return false on error
        } else {
            // Sync Local
            Object.assign(characterStore.character, updateData)
            // No alert here, let main view handle it
            loading.value = false
            return true
        }
    }

    return {
        loading,
        buyItem,
        restAtInn
    }
})
