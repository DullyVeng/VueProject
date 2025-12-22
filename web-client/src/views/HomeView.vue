
<script setup>
import { onMounted, computed } from 'vue'
import { useUserStore } from '../stores/user'
import { useCharacterStore } from '../stores/character'
import { useRouter } from 'vue-router'

const userStore = useUserStore()
const characterStore = useCharacterStore()
const router = useRouter()

const hpBarStyle = computed(() => {
    if (!characterStore.character) return {}
    const hp = Number(characterStore.character.hp) || 0
    const maxHp = Number(characterStore.character.max_hp) || 1
    const percent = Math.max(0, Math.min(100, (hp / maxHp) * 100))
    // Use Polygon for clearer left-to-right fill logic
    // (0 0) -> (percent 0) -> (percent 100) -> (0 100)
    const clipVal = `polygon(0 0, ${percent}% 0, ${percent}% 100%, 0 100%)`
    
    return {
        clipPath: clipVal,
        webkitClipPath: clipVal
    }
})

onMounted(async () => {
  await userStore.initialize()
  if (userStore.user && !characterStore.character) {
      await characterStore.fetchCharacter()
  }
})

const handleLogout = async () => {
  await userStore.signOut()
  router.push('/login')
}
</script>

<template>
  <div class="home-container">
    <div class="content-card">
      <h1>RPG World</h1>
      
      <div v-if="characterStore.character" class="character-card">
        <div class="char-header">
          <span class="level">Lv.{{ characterStore.character.level }}</span>
          <span class="name">{{ characterStore.character.name }}</span>
          <span class="gender">{{ characterStore.character.gender === 'male' ? '♂' : '♀' }}</span>
        </div>
        
        <div class="stats-grid">
          <div class="stat-item hp">
            <label>HP</label>
            <div class="hp-bar-wrapper">
               <!-- Dummy image to maintain aspect ratio -->
               <img src="/assets/game/images/ui/icon_hp_frame.png" class="hp-dummy" />

               <!-- Background (Empty) -->
               <img src="/assets/game/images/ui/icon_hp_bar_empty.png" class="hp-bg" />
               
               <!-- Fill (Clipped by inset) -->
               <img 
                 src="/assets/game/images/ui/icon_hp_bar.png" 
                 class="hp-fill" 
                 :style="hpBarStyle"
               />

               <!-- Frame (Overlay) -->
               <img 
                 :src="(characterStore.character.hp / characterStore.character.max_hp) < 0.3 
                        ? '/assets/game/images/ui/icon_hp_frame_low.png' 
                        : '/assets/game/images/ui/icon_hp_frame.png'" 
                 class="hp-frame" 
               />
               
               <span class="hp-text">{{ characterStore.character.hp }} / {{ characterStore.character.max_hp }}</span>
            </div>
          </div>
          
          <div class="stat-item mp">
            <label>MP</label>
            <div class="bar-container">
              <div class="bar" :style="{ width: (characterStore.character.mp / characterStore.character.max_mp * 100) + '%' }"></div>
              <span>{{ characterStore.character.mp }} / {{ characterStore.character.max_mp }}</span>
            </div>
          </div>

          <div class="stat-row">
            <div class="stat-box">
              <span class="label">ATK</span>
              <span class="value">{{ characterStore.character.attack }}</span>
            </div>
            <div class="stat-box">
              <span class="label">DEF</span>
              <span class="value">{{ characterStore.character.defense }}</span>
            </div>
            <div class="stat-box">
              <span class="label">EXP</span>
              <span class="value">{{ characterStore.character.exp }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="loading">
        Loading Character...
      </div>

      <div class="menu-actions">
        <button class="btn btn-menu" @click="router.push('/map')" title="地图">
           <img src="/assets/game/images/ui/icon_map.png" alt="地图" class="menu-icon" />
           <span class="label">地图</span>
        </button>
        <button class="btn btn-menu" @click="router.push('/inventory')" title="背包">
           <img src="/assets/game/images/ui/icon_bag.png" alt="背包" class="menu-icon" />
           <span class="label">背包</span>
        </button>
        <button class="btn btn-menu" @click="router.push('/quests')" title="任务">
           <img src="/assets/game/images/ui/icon_quest.png" alt="任务" class="menu-icon" />
           <span class="label">任务</span>
        </button>
        <button class="btn btn-menu" @click="router.push('/shop')" title="百草阁">
           <img src="/assets/game/images/ui/icon_pharmacy.png" alt="百草阁" class="menu-icon" />
           <span class="label">百草阁</span>
        </button>
        <button class="btn btn-menu" @click="router.push('/inn')" title="客栈">
           <img src="/assets/game/images/ui/icon_inn.png" alt="客栈" class="menu-icon" />
           <span class="label">客栈</span>
        </button>
        <button class="btn btn-menu" @click="router.push('/leaderboard')" title="天榜">
           <span class="icon">🏆</span>
           <span class="label">天榜</span>
        </button>
      </div>
      
      <div class="system-actions">
        <p class="currency" v-if="characterStore.character">
             💰 白银: <span class="silver-amount">{{ characterStore.character.silver || 0 }}</span> 两
        </p>
        <p class="user-email">Account: {{ userStore.user?.email }}</p>
        <button @click="handleLogout" class="btn-logout">退出登录</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1a1f25;
  color: #fff;
  font-family: 'Inter', sans-serif;
}

.content-card {
  width: 100%;
  max-width: 500px;
  background: rgba(30, 35, 40, 0.9);
  padding: 2rem;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
}

h1 {
  text-align: center;
  margin-bottom: 2rem;
  background: linear-gradient(45deg, #00d2ff, #3a7bd5);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.character-card {
  background: rgba(0, 0, 0, 0.3);
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  margin-bottom: 2rem;
}

.char-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  font-size: 1.2rem;
  font-weight: bold;
}

.level {
  background: #e67e22;
  padding: 0.1rem 0.5rem;
  border-radius: 4px;
  font-size: 0.9rem;
  color: white;
}

.stats-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.stat-item label {
  display: block;
  font-size: 0.8rem;
  margin-bottom: 0.2rem;
  color: #aaa;
}

/* Old bar styles for MP */
.bar-container {
  height: 20px;
  background: #333;
  border-radius: 10px;
  position: relative;
  overflow: hidden;
}

.bar {
  height: 100%;
  transition: width 0.3s;
}

.mp .bar { background: #3498db; }

.bar-container span {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.75rem;
  text-shadow: 1px 1px 2px black;
  z-index: 1;
}

/* Image HP Bar Styles */
.hp-bar-wrapper {
  position: relative;
  width: 100%;
  /* Height is now determined by the dummy image */
  display: flex;
  align-items: center;
  justify-content: center;
}

.hp-dummy {
  width: 100%;
  height: auto;
  visibility: hidden; /* Takes up space but not seen */
  display: block;
}

.hp-bg, .hp-frame {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: fill; /* Match the dummy's dimensions exactly */
  z-index: 1;
}

.hp-frame {
  z-index: 3;
}

.hp-fill {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: fill;
  z-index: 2;
  transition: clip-path 0.3s ease-out;
}

.hp-text {
  position: absolute;
  z-index: 4;
  font-size: 0.8rem;
  font-weight: bold;
  text-shadow: 1px 1px 2px black;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
}

.stat-box {
  background: rgba(255, 255, 255, 0.05);
  padding: 0.5rem 1rem;
  border-radius: 6px;
  text-align: center;
}

.stat-box .label {
  display: block;
  font-size: 0.7rem;
  color: #888;
}

.stat-box .value {
  font-weight: bold;
  color: #f1c40f;
}

.menu-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-bottom: 2rem;
}

.btn {
  border: none;
  padding: 10px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 600;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  aspect-ratio: 1;
}

.btn-menu {
  background: rgba(255, 255, 255, 0.05);
  color: #ddd;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-menu:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

.menu-icon {
    width: 48px;
    height: 48px;
    object-fit: contain;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
}

.btn-menu .icon {
    font-size: 2.5rem;
    line-height: 1;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
}

.btn-menu .label {
    font-size: 0.8rem;
    color: #ccc;
}

.system-actions {
  text-align: center;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 1rem;
}

.user-email {
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.btn-logout {
  background: transparent;
  color: #e74c3c;
  text-decoration: underline;
}

.btn-logout:hover {
  color: #ff6b6b;
}

.currency {
    color: #f1c40f;
    font-size: 1.1rem;
    margin-bottom: 0.5rem;
    font-weight: bold;
}
</style>
