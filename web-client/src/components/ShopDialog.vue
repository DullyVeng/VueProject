<script setup>
import { ref, computed } from 'vue'
import { useCharacterStore } from '../stores/character'
import { useInventoryStore } from '../stores/inventory'
import { getItemById } from '../data/items'

const props = defineProps({
  npc: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close'])

const characterStore = useCharacterStore()
const inventoryStore = useInventoryStore()

const activeTab = ref('buy') // 'buy' or 'sell'

// 商店商品列表
const shopItems = computed(() => {
  if (!props.npc.shop) return []
  return props.npc.shop.items.map(itemId => {
    const item = getItemById(itemId)
    const price = Math.floor(item.price * props.npc.shop.buyPriceMultiplier)
    return { ...item, buyPrice: price }
  })
})

// 可出售的背包物品
const sellableItems = computed(() => {
  return inventoryStore.inventory.filter(item => 
    item.type === 'material' || item.type === 'consumable'
  ).map(item => {
    const sellPrice = Math.floor(item.price * props.npc.shop.sellPriceMultiplier)
    return { ...item, sellPrice }
  })
})

const playerSilver = computed(() => characterStore.character?.silver || 0)

// 购买物品
const buyItem = async (item) => {
  if (playerSilver.value < item.buyPrice) {
    alert('灵石不足！')
    return
  }
  
  // 扣除灵石
  const success = await characterStore.spendSilver(item.buyPrice)
  if (!success) {
    alert('购买失败！')
    return
  }
  
  // 添加到背包
  await inventoryStore.addItem(item.id, 1)
  
  alert(`购买成功！获得 ${item.name}`)
}

// 出售物品
const sellItem = async (item) => {
  if (item.quantity < 1) {
    alert('没有可出售的物品！')
    return
  }
  
  // 从背包移除
  const newQuantity = item.quantity - 1
  await inventoryStore.updateItemQuantity(item.id, newQuantity)
  
  // 增加灵石
  await characterStore.gainSilver(item.sellPrice)
  
  alert(`出售成功！获得 ${item.sellPrice} 灵石`)
}

const close = () => {
  emit('close')
}
</script>

<template>
  <div class="shop-overlay" @click.self="close">
    <div class="shop-dialog">
      <div class="shop-header">
        <span class="shop-icon">{{ npc.avatar }}</span>
        <div>
          <h3>{{ npc.name }}的商店</h3>
          <p class="silver-display">💰 你的灵石：<span class="silver-amount">{{ playerSilver }}</span></p>
        </div>
        <button class="btn-close-shop" @click="close">✕</button>
      </div>

      <div class="shop-tabs">
        <button 
          class="shop-tab" 
          :class="{ active: activeTab === 'buy' }"
          @click="activeTab = 'buy'">
          💰 购买
        </button>
        <button 
          class="shop-tab" 
          :class="{ active: activeTab === 'sell' }"
          @click="activeTab = 'sell'">
          💸 出售
        </button>
      </div>

      <div class="shop-content">
        <!-- 购买标签页 -->
        <div v-if="activeTab === 'buy'" class="items-list">
          <div 
            v-for="item in shopItems" 
            :key="item.id"
            class="shop-item">
            <span class="item-icon">{{ item.icon }}</span>
            <div class="item-info">
              <div class="item-name">{{ item.name }}</div>
              <div class="item-desc">{{ item.description }}</div>
            </div>
            <div class="item-price">
              <span class="price-label">{{ item.buyPrice }}</span>
              <span class="price-icon">💰</span>
            </div>
            <button 
              class="btn-buy" 
              :disabled="playerSilver < item.buyPrice"
              @click="buyItem(item)">
              购买
            </button>
          </div>
          <p v-if="shopItems.length === 0" class="empty-message">
            暂无商品
          </p>
        </div>

        <!-- 出售标签页 -->
        <div v-if="activeTab === 'sell'" class="items-list">
          <div 
            v-for="item in sellableItems" 
            :key="item.id"
            class="shop-item">
            <span class="item-icon">{{ item.icon }}</span>
            <div class="item-info">
              <div class="item-name">{{ item.name }} ×{{ item.quantity }}</div>
              <div class="item-desc">{{ item.description }}</div>
            </div>
            <div class="item-price">
              <span class="price-label">{{ item.sellPrice }}</span>
              <span class="price-icon">💰</span>
            </div>
            <button 
              class="btn-sell" 
              :disabled="item.quantity < 1"
              @click="sellItem(item)">
              出售
            </button>
          </div>
          <p v-if="sellableItems.length === 0" class="empty-message">
            没有可出售的物品
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.shop-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3500;
  animation: fadeIn 0.2s;
}

.shop-dialog {
  background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
  border: 2px solid rgba(243, 156, 18, 0.4);
  border-radius: 16px;
  width: 90%;
  max-width: 700px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  animation: slideIn 0.3s;
}

.shop-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(243, 156, 18, 0.3);
  position: relative;
}

.shop-icon {
  font-size: 3rem;
}

.shop-header h3 {
  margin: 0 0 0.3rem 0;
  font-size: 1.3rem;
  color: #f39c12;
}

.silver-display {
  margin: 0;
  font-size: 0.9rem;
  color: #a0aec0;
}

.silver-amount {
  color: #f39c12;
  font-weight: bold;
}

.btn-close-shop {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-close-shop:hover {
  background: rgba(231, 76, 60, 0.3);
  border-color: #e74c3c;
}

.shop-tabs {
  display: flex;
  gap: 0.5rem;
  padding: 1rem 1.5rem 0 1.5rem;
  background: rgba(0, 0, 0, 0.2);
}

.shop-tab {
  flex: 1;
  padding: 0.8rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px 8px 0 0;
  color: #a0aec0;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
}

.shop-tab:hover {
  background: rgba(255, 255, 255, 0.08);
}

.shop-tab.active {
  background: rgba(243, 156, 18, 0.2);
  border-color: #f39c12;
  color: #f39c12;
}

.shop-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  background: rgba(0, 0, 0, 0.2);
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.shop-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  transition: all 0.2s;
}

.shop-item:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(243, 156, 18, 0.3);
}

.item-icon {
  font-size: 2.5rem;
}

.item-info {
  flex: 1;
}

.item-name {
  font-size: 1.05rem;
  font-weight: bold;
  color: #fff;
  margin-bottom: 0.3rem;
}

.item-desc {
  font-size: 0.85rem;
  color: #a0aec0;
}

.item-price {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 1.1rem;
  color: #f39c12;
  font-weight: bold;
}

.price-icon {
  font-size: 1.2rem;
}

.btn-buy, .btn-sell {
  padding: 0.7rem 1.5rem;
  border-radius: 8px;
  font-weight: bold;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-buy {
  background: linear-gradient(45deg, #f39c12, #e67e22);
  color: #fff;
}

.btn-buy:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(243, 156, 18, 0.4);
}

.btn-buy:disabled {
  background: rgba(255, 255, 255, 0.1);
  color: #666;
  cursor: not-allowed;
}

.btn-sell {
  background: linear-gradient(45deg, #2ecc71, #27ae60);
  color: #fff;
}

.btn-sell:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(46, 204, 113, 0.4);
}

.btn-sell:disabled {
  background: rgba(255, 255, 255, 0.1);
  color: #666;
  cursor: not-allowed;
}

.empty-message {
  text-align: center;
  padding: 3rem;
  color: #718096;
  font-style: italic;
}
</style>
