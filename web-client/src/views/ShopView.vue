
<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCharacterStore } from '../stores/character'
import { useShopStore } from '../stores/shop'
import { items } from '../data/items'

const router = useRouter()
const characterStore = useCharacterStore()
const shopStore = useShopStore()

const buy = (item) => {
    if (confirm(`确定要花费 ${item.price} 两白银购买 ${item.name} 吗？`)) {
        shopStore.buyItem(item, 1)
    }
}

const goHome = () => {
    router.push('/')
}
</script>

<template>
    <div class="shop-container">
        <div class="panel">
            <div class="header">
                <button class="btn-back" @click="goHome">🏠 返回首页</button>
                <h1>🇨🇳 百草阁</h1>
                <div class="silver">
                   💰 白银: {{ characterStore.character?.silver || 0 }}
                </div>
            </div>

            <div class="grid">
                <div v-for="item in items" :key="item.id" class="item-card">
                    <div class="icon">{{ item.icon }}</div>
                    <div class="details">
                        <h3>{{ item.name }}</h3>
                        <p class="desc">{{ item.description }}</p>
                        <p class="price">价格: {{ item.price }} 两</p>
                    </div>
                    <button class="btn-buy" @click="buy(item)">购买</button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.shop-container {
    height: 100vh;
    height: 100dvh;
    overflow-y: auto;
    display: flex;
    justify-content: center;
    background: #1a1f25;
    color: #fff;
    padding: 1rem;
    -webkit-overflow-scrolling: touch;
}

@media (max-width: 600px) {
  .shop-container {
    padding-bottom: 120px;
  }
}

.panel {
    width: 100%;
    max-width: 600px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 2rem;
    margin-top: 2rem;
    height: fit-content;
}

.header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 2rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding-bottom: 1rem;
    flex-wrap: wrap;
    gap: 1rem;
}

@media (max-width: 600px) {
  .panel {
    padding: 1rem;
    margin-top: 1rem;
  }
  .header h1 {
    font-size: 1.2rem;
    width: 100%;
    order: -1;
    text-align: center;
    margin: 0;
  }
  .item-card {
    padding: 0.75rem;
  }
}

.btn-back {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    color: #ddd;
    cursor: pointer;
}

.silver {
    font-size: 1.2rem;
    color: #f1c40f;
    font-weight: bold;
}

.grid {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.item-card {
    display: flex;
    align-items: center;
    background: rgba(0, 0, 0, 0.3);
    padding: 1rem;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.05);
}

.icon {
    font-size: 2rem;
    margin-right: 1rem;
}

.details {
    flex: 1;
}

.details h3 {
    margin: 0 0 0.3rem 0;
    color: #e67e22;
}

.desc {
    font-size: 0.8rem;
    color: #aaa;
    margin-bottom: 0.3rem;
}

.price {
    color: #f1c40f;
    font-weight: bold;
}

.btn-buy {
    padding: 0.5rem 1rem;
    background: #e74c3c;
    border: none;
    border-radius: 6px;
    color: white;
    cursor: pointer;
    font-weight: bold;
}

.btn-buy:hover {
    background: #c0392b;
}
</style>
