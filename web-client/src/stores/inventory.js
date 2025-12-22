
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../supabase/client'
import { useCharacterStore } from './character'
import { getItemById } from '../data/items'

export const useInventoryStore = defineStore('inventory', () => {
    const inventory = ref([])
    const loading = ref(false)
    const characterStore = useCharacterStore()

    async function fetchInventory() {
        if (!characterStore.character) return

        loading.value = true
        const { data, error } = await supabase
            .from('inventory')
            .select('*')
            .eq('character_id', characterStore.character.id)
            .order('created_at', { ascending: true })

        if (error) {
            console.error('Error fetching inventory:', error)
        } else {
            // Merge with static data
            inventory.value = data.map(item => {
                const staticData = getItemById(item.item_id)
                return {
                    ...staticData, // Spread static first (contains generic info)
                    ...item // Spread DB item second (contains specific instance info like numeric ID, quantity, and MOST IMPORTANTLY the row UUID)
                }
            })
        }
        loading.value = false
    }

    async function addItem(itemId, count = 1) {
        if (!characterStore.character) return

        // Check if item exists
        const existing = inventory.value.find(i => i.item_id === itemId)

        if (existing) {
            // Update quantity
            const newQuantity = existing.quantity + count
            const { error } = await supabase
                .from('inventory')
                .update({ quantity: newQuantity })
                .eq('id', existing.id)

            if (!error) existing.quantity = newQuantity
        } else {
            // Insert new
            const { data, error } = await supabase
                .from('inventory')
                .insert({
                    character_id: characterStore.character.id,
                    item_id: itemId,
                    quantity: count
                })
                .select()
                .single()

            if (!error && data) {
                inventory.value.push({
                    ...getItemById(itemId),
                    ...data
                })
            }
        }
    }

    async function useItem(inventoryItem) {
        if (inventoryItem.quantity <= 0) return

        // Consume Logic
        if (inventoryItem.type === 'consumable') {
            // Apply Effect
            if (inventoryItem.effect.type === 'restore_hp') {
                const char = characterStore.character
                if (char.hp >= char.max_hp) {
                    alert('生命值已满，无需使用。')
                    return
                }
                const newHp = Math.min(char.max_hp, char.hp + inventoryItem.effect.value)

                // Update Character DB
                await supabase
                    .from('characters')
                    .update({ hp: newHp })
                    .eq('id', char.id)

                char.hp = newHp
            }

            // Decrease Quantity
            const newQuantity = inventoryItem.quantity - 1
            const { error } = await supabase
                .from('inventory')
                .update({ quantity: newQuantity })
                .eq('id', inventoryItem.id)

            if (!error) {
                inventoryItem.quantity = newQuantity
                if (newQuantity === 0) {
                    inventory.value = inventory.value.filter(i => i.quantity > 0)
                }
                alert(`使用了 ${inventoryItem.name}`)
            } else {
                console.error('Failed to use item:', error)
                alert('使用物品失败，请重试。')
            }
        }
    }

    async function equipItem(item) {
        if (!characterStore.character) return

        let itemToUnequip = null

        // Slot Logic
        if (item.slot === 'ring') {
            // Special handling for rings (max 2)
            const equippedRings = inventory.value.filter(i =>
                i.is_equipped && i.slot === 'ring'
            )

            if (equippedRings.length >= 2) {
                // If 2 are equipped, replace the first one (FIFO)
                // Or ideally, replace the one with lower stats? 
                // For simplicity: Replace the first one found in the array
                itemToUnequip = equippedRings[0]
            }
        } else {
            // Standard 1-slot logic
            itemToUnequip = inventory.value.find(i =>
                i.is_equipped && i.slot === item.slot && i.id !== item.id
            )
        }

        // 1. Unequip existing if needed
        if (itemToUnequip) {
            await unequipItem(itemToUnequip)
        }

        // 2. Mark as equipped in DB
        const { error } = await supabase
            .from('inventory')
            .update({ is_equipped: true })
            .eq('id', item.id)

        if (error) {
            console.error('Failed to equip:', error)
            return
        }

        // 3. Update Local State & Stats
        item.is_equipped = true
        updateCharacterStats()
        alert(`装备了 ${item.name}`)
    }

    async function unequipItem(item) {
        if (!characterStore.character) return

        // 1. Mark as unequipped in DB
        const { error } = await supabase
            .from('inventory')
            .update({ is_equipped: false })
            .eq('id', item.id)

        if (error) {
            console.error('Failed to unequip:', error)
            return
        }

        // 2. Update Local State & Stats
        item.is_equipped = false
        updateCharacterStats()
        alert(`卸下了 ${item.name}`)
    }

    // Helper: Recalculate stats based on level + equipment
    // Ideally this should be in CharacterStore, but Inventory owns equipment state right now.
    // For simplicity, we calculate offsets here and update CharacterStore
    async function updateCharacterStats() {
        const char = characterStore.character

        // Base Stats (Level 1)
        let baseAttack = 10 + (char.level - 1) * 2
        let baseDefense = 5 + (char.level - 1) * 1

        // Add Equipment Stats
        const equippedItems = inventory.value.filter(i => i.is_equipped)
        let bonusAttack = 0
        let bonusDefense = 0

        equippedItems.forEach(i => {
            if (i.stats) {
                bonusAttack += i.stats.attack || 0
                bonusDefense += i.stats.defense || 0
            }
        })

        const newAttack = baseAttack + bonusAttack
        const newDefense = baseDefense + bonusDefense

        // Update DB
        await supabase
            .from('characters')
            .update({
                attack: newAttack,
                defense: newDefense
            })
            .eq('id', char.id)

        // Update Local
        char.attack = newAttack
        char.defense = newDefense
    }

    return {
        inventory,
        loading,
        fetchInventory,
        addItem,
        useItem,
        equipItem,
        unequipItem
    }
})
