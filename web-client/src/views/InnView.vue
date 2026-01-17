
<script setup>
import { useRouter } from 'vue-router'
import { useCharacterStore } from '../stores/character'
import { useShopStore } from '../stores/shop'

import { useFabaoStore } from '../stores/fabao'

const router = useRouter()
const characterStore = useCharacterStore()
const shopStore = useShopStore()
const fabaoStore = useFabaoStore()

const rest = async (type) => {
    // 1. Call Shop Store for Character Rest (Deducts silver, heals char)
    const success = await shopStore.restAtInn(type)
    
    if (success) {
        // 2. If successful, heal Fabaos
        const percentage = type === 'basic' ? 0.5 : 1.0
        await fabaoStore.restoreAllFabaos(percentage)
        
        // 3. Show success message (moved from store to here for better control)
        alert(type === 'basic' ? '休息了一晚，恢复了部分体力与法宝灵力。' : '在上房睡得很香，体力与法宝灵力完全恢复了！')
    }
}

const goHome = () => {
    router.push('/')
}
</script>

<template>
    <div class="inn-container">
        <div class="panel">
            <div class="header">
                <button class="btn-back" @click="goHome">🏠 返回首页</button>
                <h1>🛌 同福客栈</h1>
                <div class="silver">
                   💰 白银: {{ characterStore.character?.silver || 0 }}
                </div>
            </div>

            <div class="welcome">
                <p>客官，无论是打尖还是住店，咱家都是方圆百里最好的！</p>
            </div>

            <div class="options">
                <div class="card basic">
                    <h3>🍵 打尖休息</h3>
                    <p>在大堂稍作休息，喝口热茶。</p>
                    <div class="effect">恢复 50% 体力和内力</div>
                    <div class="price">花费: 10 两</div>
                    <button @click="rest('basic')">休息</button>
                </div>

                <div class="card premium">
                    <h3>🛏️ 上房住店</h3>
                    <p>在天字一号房舒舒服服睡一觉。</p>
                    <div class="effect">恢复 100% 体力和内力</div>
                    <div class="price">花费: 50 两</div>
                    <button @click="rest('premium')">入住</button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.inn-container {
    min-height: 100vh;
    display: flex;
    justify-content: center;
    background: #1a1f25;
    color: #fff;
    padding: 1rem;
}

.panel {
    width: 100%;
    max-width: 600px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 2rem;
    margin-top: 2rem;
}

.header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 2rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding-bottom: 1rem;
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

.welcome {
    text-align: center;
    color: #bbb;
    margin-bottom: 2rem;
    font-style: italic;
}

.options {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
}

.card {
    background: rgba(0, 0, 0, 0.3);
    padding: 1.5rem;
    border-radius: 12px;
    text-align: center;
    border: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

.card h3 {
    margin-bottom: 0.5rem;
    color: #fff;
}

.card p {
    font-size: 0.9rem;
    color: #aaa;
    margin-bottom: 1rem;
}

.effect {
    color: #2ecc71;
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
}

.price {
    color: #f1c40f;
    font-weight: bold;
    margin-bottom: 1rem;
}

.card button {
    width: 100%;
    padding: 0.8rem;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: bold;
    color: white;
}

.card.basic button {
    background: #3498db;
}

.card.premium button {
    background: #9b59b6;
}

.card button:hover {
    opacity: 0.9;
}
</style>
