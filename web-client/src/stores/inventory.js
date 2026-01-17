
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../supabase/client'
import { useCharacterStore } from './character'
import { getItemById } from '../data/items'
import { useDailyStore } from './daily'
import { DailyTaskType } from '../data/dailyTasks'

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

            if (error) {
                // 处理唯一键冲突（409 Conflict / 23505）
                // 这通常发生在本地库存未同步，或者并发添加同一物品时
                if (error.code === '23505' || error.status === 409) {
                    console.log(`[Inventory] 检测到物品 ${itemId} 已存在(Conflict)，转为更新逻辑`)

                    // 1. 获取已存在的物品数据
                    const { data: existingItem, error: fetchError } = await supabase
                        .from('inventory')
                        .select('*')
                        .eq('character_id', characterStore.character.id)
                        .eq('item_id', itemId)
                        .single()

                    if (!fetchError && existingItem) {
                        // 2. 更新数量
                        const newQuantity = existingItem.quantity + count
                        const { error: updateError } = await supabase
                            .from('inventory')
                            .update({ quantity: newQuantity })
                            .eq('id', existingItem.id)

                        if (!updateError) {
                            // 3. 同步到本地状态
                            const localItem = inventory.value.find(i => i.item_id === itemId)
                            if (localItem) {
                                localItem.quantity = newQuantity
                            } else {
                                // 如果本地完全没有（stale cache），从远程push
                                inventory.value.push({
                                    ...getItemById(itemId),
                                    ...existingItem,
                                    quantity: newQuantity
                                })
                            }
                            console.log(`[Inventory] 物品 ${itemId} 冲突自动修复完成，新数量: ${newQuantity}`)
                        } else {
                            console.error('[Inventory] 冲突修复失败(Update):', updateError)
                        }
                    } else {
                        console.error('[Inventory] 冲突修复失败(Fetch):', fetchError)
                    }
                } else {
                    console.error('Failed to add item:', error)
                }
            } else if (data) {
                inventory.value.push({
                    ...getItemById(itemId),
                    ...data
                })
            }
        }

        // 获取物品名称用于日志
        const itemConfig = getItemById(itemId)
        const itemName = itemConfig ? itemConfig.name : itemId
        // 注意：addLog 是 combatStore 的功能，这里不能直接调用，需要外部处理日志，或者 inventoryStore 自己不发日志
        // 但目前 inventoryStore 并没有发送 log，而是调用者发送的。
        // 之前的问题在于 combat.js 中调用 addItem 后，自己拼接日志时用了 id。
        // 这里不需要修改 addItem 的日志逻辑，因为 addItem 本身不发日志。

        // 更新每日采集任务进度
        const dailyStore = useDailyStore()
        await dailyStore.updateProgress(DailyTaskType.COLLECT_ITEMS, itemId, count)
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
            } else if (inventoryItem.effect.type === 'restore_mp') {
                const char = characterStore.character
                if (char.mp >= char.max_mp) {
                    alert('灵力值已满，无需使用。')
                    return
                }
                const newMp = Math.min(char.max_mp, char.mp + inventoryItem.effect.value)

                // Update Character DB
                await supabase
                    .from('characters')
                    .update({ mp: newMp })
                    .eq('id', char.id)

                char.mp = newMp
            } else if (inventoryItem.effect.type === 'teleport') {
                const char = characterStore.character
                const targetMap = inventoryItem.effect.value // 'town'

                // Update Character Location in DB
                await supabase
                    .from('characters')
                    .update({ current_map: targetMap })
                    .eq('id', char.id)

                char.current_map = targetMap

                // Use router to navigate if needed? 
                // Since this is just data update, the View should react if it watches characterStore, 
                // but usually MapView reads current_map on mount.
                // If we are in MapView, we should probably force reload or navigate.
                // But we can't access router easily here without importing it.
                // Let's assume the user will see the change or we can reload window.
                window.location.href = '/' // Simple way to force refresh to Home/Map
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

    /**
     * 更新物品数量
     */
    async function updateItemQuantity(inventoryItemId, newQuantity) {
        const item = inventory.value.find(i => i.id === inventoryItemId)
        if (!item) return

        if (newQuantity <= 0) {
            // 删除物品
            await supabase
                .from('inventory')
                .delete()
                .eq('id', inventoryItemId)

            inventory.value = inventory.value.filter(i => i.id !== inventoryItemId)
        } else {
            // 更新数量
            const { error } = await supabase
                .from('inventory')
                .update({ quantity: newQuantity })
                .eq('id', inventoryItemId)

            if (!error) {
                item.quantity = newQuantity
            }
        }
    }

    return {
        inventory,
        loading,
        fetchInventory,
        addItem,
        useItem,
        equipItem,
        unequipItem,
        updateItemQuantity
    }
})
