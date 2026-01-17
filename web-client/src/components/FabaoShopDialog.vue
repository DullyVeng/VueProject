<script setup>
import { ref, computed } from 'vue'
import { useCharacterStore } from '../stores/character'
import { useFabaoStore } from '../stores/fabao'
import { fabaoShopItems } from '../data/fabaoShop'
import { getFabaoById } from '../data/fabaos'

const props = defineProps({
  npc: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close'])

const characterStore = useCharacterStore()
const fabaoStore = useFabaoStore()

const mode = ref('buy') // 'buy' or 'sell'

// 获取当前商店的法宝列表
const shopItems = computed(() => {
  return fabaoShopItems.map(item => {
    const fabaoConfig = getFabaoById(item.fabaoId)
    return {
      ...item,
      config: fabaoConfig
    }
  })
})

// 玩家可出售的法宝
const internalSellableFabaos = computed(() => {
  return fabaoStore.fabaos.filter(f => !f.isInDantian)
})

const playerSilver = computed(() => characterStore.character?.silver || 0)

// 购买法宝
const buyFabao = async (item) => {
  if (playerSilver.value < item.price) {
    alert('灵石不足！')
    return
  }
  
  try {
    // 扣除灵石
    const costSuccess = await characterStore.spendSilver(item.price)
    if (!costSuccess) {
      alert('灵石不足或扣除失败！')
      return
    }
    
    // 添加法宝
    await fabaoStore.addFabao(item.fabaoId, item.config.realm, item.config.rarity)
    
    alert(`购买成功！获得 ${item.config.name}`)
  } catch (error) {
    console.error('购买法宝失败:', error)
    alert('购买失败，请重试')
  }
}

// 出售法宝
const sellFabaoAction = async (fabao) => {
  const price = fabaoStore.calculateSellPrice(fabao)
  if (!confirm(`确定要以 ${price} 灵石的价格出售 [${fabao.name}] 吗？`)) {
    return
  }

  const result = await fabaoStore.sellFabao(fabao.id)
  if (result.success) {
    alert(`出售成功！获得 ${result.price} 灵石`)
  } else {
    alert(`出售失败：${result.reason}`)
  }
}

const close = () => {
  emit('close')
}

// 稀有度颜色映射
const getRarityColor = (rarity) => {
  const colors = {
    common: '#bdc3c7',
    fine: '#2ecc71',
    rare: '#3498db',
    epic: '#9b59b6',
    legendary: '#f1c40f'
  }
  return colors[rarity] || '#bdc3c7'
}

// 获取格子样式
const getGridStyle = (isActive, rarity) => {
    if (!isActive) return { background: 'rgba(255, 255, 255, 0.1)' }
    return {
        background: getRarityColor(rarity),
        boxShadow: `0 0 5px ${getRarityColor(rarity)}`
    }
}
</script>

<template>
  <div class="shop-overlay" @click.self="close">
    <div class="shop-dialog">
      <div class="shop-header">
        <span class="shop-icon">{{ npc.avatar }}</span>
        <div class="header-info">
          <h3>{{ npc.name }}的法宝阁</h3>
          <p class="silver-display">💰 你的灵石：<span class="silver-amount">{{ playerSilver }}</span></p>
        </div>
        
        <div class="shop-tabs">
          <button 
            :class="['tab-btn', { active: mode === 'buy' }]" 
            @click="mode = 'buy'">
            🛍️ 购买
          </button>
          <button 
            :class="['tab-btn', { active: mode === 'sell' }]" 
            @click="mode = 'sell'">
            💰 出售
          </button>
        </div>
        
        <button class="btn-close-shop" @click="close">✕</button>
      </div>

      <div class="shop-content">
        <!-- 购买模式 -->
        <div v-if="mode === 'buy'" class="fabaos-list">
          <div 
            v-for="item in shopItems" 
            :key="item.fabaoId"
            class="fabao-card"
            :style="{ borderColor: getRarityColor(item.config.rarity) }">
            
            <div class="fabao-header">
                <span class="fabao-icon">{{ item.config.icon }}</span>
                <div class="fabao-title">
                    <div class="name" :style="{ color: getRarityColor(item.config.rarity) }">
                        {{ item.config.name }}
                    </div>
                    <div class="type-badge">{{ item.config.realm }} · {{ item.config.type }}</div>
                </div>
            </div>

            <div class="fabao-body">
                <div class="shape-preview">
                    <div 
                        v-for="(row, rIndex) in item.config.shape" 
                        :key="rIndex" 
                        class="shape-row">
                        <div 
                            v-for="(cell, cIndex) in row" 
                            :key="cIndex" 
                            class="shape-cell"
                            :style="getGridStyle(cell === 1, item.config.rarity)"
                        ></div>
                    </div>
                </div>

                <div class="stats-info">
                    <div class="stat-row">
                        <span>生命: {{ item.config.baseStats.hp }}</span>
                        <span>攻击: {{ item.config.baseStats.attack }}</span>
                    </div>
                    <div class="stat-row">
                        <span>防御: {{ item.config.baseStats.defense }}</span>
                        <span>灵力: {{ item.config.baseStats.mp }}</span>
                    </div>
                    <div class="desc">{{ item.config.description }}</div>
                </div>
            </div>

            <div class="fabao-footer">
              <div class="price">
                <span>{{ item.price }}</span>
                <span class="price-icon">💰</span>
              </div>
              <button 
                class="btn-buy" 
                :disabled="playerSilver < item.price"
                @click="buyFabao(item)">
                购买
              </button>
            </div>
          </div>
          <p v-if="shopItems.length === 0" class="empty-message">暂无法宝出售</p>
        </div>

        <!-- 出售模式 -->
        <div v-else class="fabaos-list">
          <div 
            v-for="fabao in internalSellableFabaos" 
            :key="fabao.id"
            class="fabao-card sell-card"
            :style="{ borderColor: getRarityColor(fabao.rarity) }">
            
            <div class="fabao-header">
                <span class="fabao-icon">{{ fabao.icon }}</span>
                <div class="fabao-title">
                    <div class="name" :style="{ color: getRarityColor(fabao.rarity) }">
                        {{ fabao.name }}
                    </div>
                    <div class="type-badge">
                      {{ fabao.realm }} · {{ fabao.type }}
                      <span v-if="fabao.enhance_level > 0" class="enhance-badge"> +{{ fabao.enhance_level }}</span>
                    </div>
                </div>
            </div>

            <div class="fabao-body">
                <div class="shape-preview">
                    <div 
                        v-for="(row, rIndex) in (fabao.current_shape || fabao.shape)" 
                        :key="rIndex" 
                        class="shape-row">
                        <div 
                            v-for="(cell, cIndex) in row" 
                            :key="cIndex" 
                            class="shape-cell"
                            :style="getGridStyle(cell === 1, fabao.rarity)"
                        ></div>
                    </div>
                </div>

                <div class="stats-info">
                    <div class="stat-row">
                        <span>生命: {{ fabao.max_hp }}</span>
                        <span>攻击: {{ fabao.attack }}</span>
                    </div>
                    <div class="stat-row">
                        <span>防御: {{ fabao.defense }}</span>
                        <span>灵力: {{ fabao.max_mp }}</span>
                    </div>
                </div>
            </div>

            <div class="fabao-footer">
              <div class="price">
                <span>{{ fabaoStore.calculateSellPrice(fabao) }}</span>
                <span class="price-icon">💰</span>
              </div>
              <button 
                class="btn-sell" 
                @click="sellFabaoAction(fabao)">
                出售
              </button>
            </div>
          </div>
          <p v-if="internalSellableFabaos.length === 0" class="empty-message">
            背包里没有可出售的法宝（丹田中的法宝无法出售）
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
  border: 2px solid rgba(155, 89, 182, 0.4);
  border-radius: 16px;
  width: 90%;
  max-width: 800px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  animation: slideIn 0.3s;
  box-shadow: 0 0 30px rgba(155, 89, 182, 0.2);
}

.shop-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(155, 89, 182, 0.3);
  position: relative;
}

.shop-icon {
  font-size: 3rem;
}

.shop-header h3 {
  margin: 0;
  font-size: 1.5rem;
  color: #cbbde2;
}

.header-info {
  flex: 1;
}

.shop-tabs {
  display: flex;
  background: rgba(0, 0, 0, 0.4);
  padding: 4px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin: 0 1.5rem;
}

.tab-btn {
  padding: 0.6rem 1.2rem;
  border: none;
  background: transparent;
  color: #a0aec0;
  cursor: pointer;
  border-radius: 6px;
  font-weight: bold;
  transition: all 0.2s;
}

.tab-btn.active {
  background: #3182ce;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.tab-btn:hover:not(.active) {
  background: rgba(255, 255, 255, 0.05);
  color: #cbd5e0;
}

.silver-display {
  margin: 0.2rem 0 0 0;
  font-size: 0.9rem;
  color: #a0aec0;
}

.silver-amount {
  color: #f39c12;
  font-weight: bold;
}

.btn-close-shop {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-close-shop:hover {
  background: rgba(231, 76, 60, 0.3);
  border-color: #e74c3c;
}

/* 之前缺失的样式 */
.btn-sell {
  padding: 0.6rem 1.2rem;
  background: linear-gradient(45deg, #27ae60, #2ecc71);
  border: none;
  border-radius: 6px;
  color: white;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-sell:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(46, 204, 113, 0.4);
}

.enhance-badge {
  background: rgba(243, 156, 18, 0.2);
  color: #f39c12;
  padding: 1px 4px;
  border-radius: 4px;
  font-size: 0.75rem;
  margin-left: 4px;
}

.sell-card {
  border-style: dashed;
}

.shop-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  background: rgba(0, 0, 0, 0.2);
}

.fabaos-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.fabao-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1rem;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}


.fabao-card:hover {
  background: rgba(255, 255, 255, 0.06);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.fabao-header {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding-bottom: 0.8rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.fabao-icon {
    font-size: 2rem;
}

.fabao-title .name {
    font-weight: bold;
    font-size: 1.1rem;
}

.type-badge {
    font-size: 0.8rem;
    color: #a0aec0;
    margin-top: 0.2rem;
}

.fabao-body {
    flex: 1;
    display: flex;
    gap: 1rem;
}

.shape-preview {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 0.5rem;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    align-self: flex-start;
}

.shape-row {
    display: flex;
    gap: 2px;
}

.shape-cell {
    width: 20px;
    height: 20px;
    border-radius: 2px;
}

.stats-info {
    flex: 1;
    font-size: 0.85rem;
    color: #cbd5e0;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
}

.stat-row {
    display: flex;
    justify-content: space-between;
}

.desc {
    margin-top: 0.5rem;
    font-size: 0.8rem;
    color: #718096;
    font-style: italic;
    line-height: 1.4;
}

.fabao-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.5rem;
  padding-top: 0.8rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.price {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 1.2rem;
  color: #f39c12;
  font-weight: bold;
}

.btn-buy {
  padding: 0.6rem 1.2rem;
  background: linear-gradient(45deg, #9b59b6, #8e44ad);
  border: none;
  border-radius: 6px;
  color: white;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-buy:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(155, 89, 182, 0.4);
}

.btn-buy:disabled {
  background: rgba(255, 255, 255, 0.1);
  color: #666;
  cursor: not-allowed;
}

.empty-message {
  text-align: center;
  padding: 3rem;
  color: #718096;
  font-style: italic;
  grid-column: 1 / -1;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { transform: translateY(20px); ubacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>
