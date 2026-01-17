<script setup>
import { ref, computed } from 'vue'
import { useCharacterStore } from '../stores/character'
import { useFabaoStore } from '../stores/fabao'
import { sectShopItems } from '../data/sectShop'
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

const shopItems = computed(() => {
  return sectShopItems.map(item => {
    const fabaoConfig = getFabaoById(item.fabaoId)
    return {
      ...item,
      config: fabaoConfig
    }
  })
})

const playerContribution = computed(() => characterStore.character?.contribution || 0)

// 兑换法宝
const exchangeFabao = async (item) => {
  if (playerContribution.value < item.price) {
    alert('宗门贡献不足！请完成任务获取贡献。')
    return
  }
  
  if (confirm(`确定消耗 ${item.price} 贡献兑换 [${item.config.name}] 吗？`)) {
    try {
        // 扣除贡献
        const costSuccess = await characterStore.spendContribution(item.price)
        if (!costSuccess) {
            alert('贡献不足或扣除失败！')
            return
        }
        
        // 添加法宝
        // 宗门兑换的法宝，品质至少是 fine (良品)
        const rarity = item.config.rarity === 'common' ? 'fine' : item.config.rarity
        
        await fabaoStore.addFabao(item.fabaoId, item.config.realm, rarity)
        
        alert(`兑换成功！获得 ${item.config.name}`)
    } catch (error) {
        console.error('兑换法宝失败:', error)
        alert('兑换失败，请重试')
    }
  }
}

const close = () => {
  emit('close')
}

// 稀有度颜色映射
const getRarityColor = (rarity) => {
  const colors = {
    common: '#bdc3c7',
    fine: '#2ecc71', // 绿色
    rare: '#3498db', // 蓝色
    epic: '#9b59b6', // 紫色
    legendary: '#f1c40f'
  }
  return colors[rarity] || '#bdc3c7'
}
</script>

<template>
  <div class="shop-overlay" @click.self="close">
    <div class="shop-dialog sect-theme">
      <div class="shop-header">
        <span class="shop-icon">{{ npc.avatar }}</span>
        <div>
          <h3>{{ npc.name }}的藏宝阁</h3>
          <p class="currency-display">🏛️ 宗门贡献：<span class="contribution-amount">{{ playerContribution }}</span></p>
        </div>
        <button class="btn-close-shop" @click="close">✕</button>
      </div>

      <div class="shop-content">
        <div class="items-list">
          <div 
            v-for="item in shopItems" 
            :key="item.fabaoId"
            class="shop-item-card"
            :style="{ borderColor: getRarityColor(item.config.rarity) }">
            
            <div class="item-header">
                <span class="item-icon">{{ item.config.icon }}</span>
                <div class="item-title">
                    <div class="name" :style="{ color: getRarityColor(item.config.rarity) }">
                        {{ item.config.name }}
                    </div>
                    <div class="type-badge">{{ item.config.realm }} · {{ item.config.type }}</div>
                </div>
            </div>

            <div class="item-body">
                <div class="stats-info">
                    <div class="stat-row">
                        <span>攻: {{ item.config.baseStats.attack }}</span>
                        <span>防: {{ item.config.baseStats.defense }}</span>
                    </div>
                    <div class="desc">{{ item.description || item.config.description }}</div>
                </div>
            </div>

            <div class="item-footer">
              <div class="price">
                <span>{{ item.price }}</span>
                <span class="currency-label">贡献</span>
              </div>
              <button 
                class="btn-exchange" 
                :disabled="playerContribution < item.price"
                @click="exchangeFabao(item)">
                兑换
              </button>
            </div>
          </div>
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
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  border: 2px solid #3498db;
  border-radius: 16px;
  width: 90%;
  max-width: 800px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  animation: slideIn 0.3s;
  box-shadow: 0 0 30px rgba(52, 152, 219, 0.2);
}

.shop-dialog.sect-theme {
    border-color: #f1c40f;
    background: linear-gradient(135deg, #2c2c2c 0%, #4a4a4a 100%);
}

.shop-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(241, 196, 15, 0.3);
  position: relative;
}

.shop-icon {
  font-size: 3rem;
}

.shop-header h3 {
  margin: 0 0 0.3rem 0;
  font-size: 1.5rem;
  color: #f1c40f;
}

.currency-display {
  margin: 0;
  font-size: 0.9rem;
  color: #bdc3c7;
}

.contribution-amount {
  color: #f1c40f;
  font-weight: bold;
  font-size: 1.1rem;
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

.shop-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  background: rgba(0, 0, 0, 0.2);
}

.items-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.shop-item-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1rem;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.shop-item-card:hover {
  background: rgba(255, 255, 255, 0.06);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.item-header {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding-bottom: 0.8rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.item-icon {
    font-size: 2rem;
}

.item-title .name {
    font-weight: bold;
    font-size: 1.1rem;
}

.type-badge {
    font-size: 0.8rem;
    color: #a0aec0;
    margin-top: 0.2rem;
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
    gap: 1rem;
}

.desc {
    margin-top: 0.5rem;
    font-size: 0.8rem;
    color: #ffd700; /* 金色字体描述 */
    font-style: italic;
    line-height: 1.4;
}

.item-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto; /* Push footer to bottom */
  padding-top: 0.8rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.price {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 1.2rem;
  color: #f1c40f;
  font-weight: bold;
}

.currency-label {
    font-size: 0.8rem;
    color: #bdc3c7;
    font-weight: normal;
}

.btn-exchange {
  padding: 0.6rem 1.2rem;
  background: linear-gradient(45deg, #f1c40f, #f39c12);
  border: none;
  border-radius: 6px;
  color: #2c3e50;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-exchange:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(241, 196, 15, 0.4);
}

.btn-exchange:disabled {
  background: rgba(255, 255, 255, 0.1);
  color: #666;
  cursor: not-allowed;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>
