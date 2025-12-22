
<script setup>
import { ref } from 'vue'
import { useUserStore } from '../stores/user'

const userStore = useUserStore()
const isLogin = ref(true)
const email = ref('')
const password = ref('')

const toggleMode = () => {
  isLogin.value = !isLogin.value
  userStore.error = null
}

const handleSubmit = async () => {
  if (isLogin.value) {
    await userStore.signIn(email.value, password.value)
  } else {
    const { error } = await userStore.signUp(email.value, password.value)
    if (!error) {
      alert('注册成功！请检查邮箱完成验证（如果是真实邮箱），或直接登录（如果是测试环境）。')
      isLogin.value = true
    }
  }
}
</script>

<template>
  <div class="auth-container">
    <div class="glass-panel">
      <h2 class="title">{{ isLogin ? '英雄归来' : '创建角色' }}</h2>
      <p class="subtitle">{{ isLogin ? '继续你的传奇旅程' : '开始一段新的冒险' }}</p>

      <form @submit.prevent="handleSubmit" class="auth-form">
        <div class="input-group">
          <label>Email</label>
          <input type="email" v-model="email" required placeholder="adventurer@example.com" />
        </div>
        
        <div class="input-group">
          <label>Password</label>
          <input type="password" v-model="password" required placeholder="••••••••" />
        </div>

        <div v-if="userStore.error" class="error-msg">
          {{ userStore.error }}
        </div>

        <button type="submit" class="btn-primary" :disabled="userStore.loading">
          {{ userStore.loading ? 'Processing...' : (isLogin ? '登录' : '注册') }}
        </button>
      </form>

      <div class="toggle-link">
        <p>
          {{ isLogin ? '还没有账号?' : '已经有账号了?' }}
          <a href="#" @click.prevent="toggleMode">{{ isLogin ? '立即注册' : '去登录' }}</a>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at center, #2b3a42 0%, #1a1f25 100%);
  color: #fff;
  font-family: 'Inter', sans-serif;
}

.glass-panel {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 3rem;
  border-radius: 16px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  transition: transform 0.3s ease;
}

.glass-panel:hover {
  transform: translateY(-2px);
  border-color: rgba(255, 255, 255, 0.2);
}

.title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  text-align: center;
  background: linear-gradient(45deg, #00d2ff, #3a7bd5);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 2rem;
  font-size: 0.9rem;
}

.input-group {
  margin-bottom: 1.5rem;
}

.input-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.8);
}

.input-group input {
  width: 100%;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #fff;
  outline: none;
  transition: all 0.3s;
}

.input-group input:focus {
  border-color: #3a7bd5;
  background: rgba(0, 0, 0, 0.3);
  box-shadow: 0 0 0 2px rgba(58, 123, 213, 0.2);
}

.btn-primary {
  width: 100%;
  padding: 0.85rem;
  border: none;
  border-radius: 8px;
  background: linear-gradient(45deg, #3a7bd5, #00d2ff);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.3s, transform 0.1s;
}

.btn-primary:hover {
  opacity: 0.9;
}

.btn-primary:active {
  transform: scale(0.98);
}

.btn-primary:disabled {
  background: #4a5568;
  cursor: not-allowed;
}

.error-msg {
  background: rgba(220, 38, 38, 0.1);
  color: #fca5a5;
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  font-size: 0.85rem;
  border: 1px solid rgba(220, 38, 38, 0.2);
}

.toggle-link {
  margin-top: 1.5rem;
  text-align: center;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
}

.toggle-link a {
  color: #00d2ff;
  text-decoration: none;
  margin-left: 0.5rem;
  transition: color 0.2s;
}

.toggle-link a:hover {
  color: #fff;
  text-decoration: underline;
}
</style>
