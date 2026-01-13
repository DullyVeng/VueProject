// 宗门开启功能使用示例

import { useSectStore } from '@/stores/sect'
import { useCharacterStore } from '@/stores/character'

// ========== 示例1：检查宗门状态 ==========
async function checkSectStatus() {
    const sectStore = useSectStore()
    const characterStore = useCharacterStore()

    // 尝试加载宗门数据
    const result = await sectStore.loadFromDatabase(characterStore.character.id)

    if (!result.success) {
        console.log('没有宗门数据，需要开启宗门')
        return { needFound: true }
    }

    if (!result.founded) {
        console.log('宗门未开启')
        return { needFound: true }
    }

    console.log('宗门已开启:', sectStore.sectName)
    return { needFound: false }
}

// ========== 示例2：验证宗门名称 ==========
function validateName(name) {
    const sectStore = useSectStore()

    // 格式验证
    const validation = sectStore.validateSectName(name)

    if (!validation.valid) {
        console.error('名称格式错误:', validation.error)
        return false
    }

    console.log('名称格式正确')
    return true
}

// ========== 示例3：检查名称唯一性 ==========
async function checkNameAvailable(name) {
    const sectStore = useSectStore()

    const result = await sectStore.checkSectNameAvailability(name)

    if (!result.available) {
        console.error('名称不可用:', result.error)
        return false
    }

    console.log('名称可用')
    return true
}

// ========== 示例4：开启宗门（完整流程） ==========
async function foundNewSect(sectName) {
    const sectStore = useSectStore()
    const characterStore = useCharacterStore()

    // 1. 验证名称格式
    if (!validateName(sectName)) {
        return { success: false, message: '名称格式不正确' }
    }

    // 2. 检查名称唯一性
    const available = await checkNameAvailable(sectName)
    if (!available) {
        return { success: false, message: '名称已被使用' }
    }

    // 3. 检查灵石
    const currentSilver = characterStore.character.silver || 0
    if (currentSilver < sectStore.SECT_FOUNDATION_COST.silver) {
        return {
            success: false,
            message: `灵石不足（需要${sectStore.SECT_FOUNDATION_COST.silver}，当前${currentSilver}）`
        }
    }

    // 4. 开启宗门
    const result = await sectStore.foundSect(
        characterStore.character.id,
        sectName,
        characterStore
    )

    if (result.success) {
        console.log('宗门开启成功:', result.message)
        // 可以跳转到宗门管理页面
    } else {
        console.error('开启失败:', result.message)
    }

    return result
}

// ========== 示例5：在Vue组件中使用 ==========
/*
<template>
  <div class="sect-foundation">
    <!-- 未开启宗门时显示 -->
    <div v-if="!sectStore.isFounded" class="foundation-dialog">
      <h2>开启宗门</h2>
      
      <div class="cost-info">
        <p>开启宗门需要消耗：</p>
        <p class="cost">{{ sectStore.SECT_FOUNDATION_COST.silver }} 灵石</p>
        <p class="current">当前灵石：{{ characterStore.character?.silver || 0 }}</p>
      </div>
      
      <div class="name-input">
        <label>宗门名称：</label>
        <input 
          v-model="sectName" 
          placeholder="请输入宗门名称（2-8字符）"
          @input="onNameInput"
        />
        <p v-if="nameError" class="error">{{ nameError }}</p>
      </div>
      
      <button 
        @click="onFoundSect" 
        :disabled="!canFound || founding"
      >
        {{ founding ? '开启中...' : '开启宗门' }}
      </button>
    </div>
    
    <!-- 已开启宗门时显示 -->
    <div v-else class="sect-management">
      <h2>{{ sectStore.sectName }}</h2>
      <!-- 宗门管理界面 -->
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useSectStore } from '@/stores/sect'
import { useCharacterStore } from '@/stores/character'

const sectStore = useSectStore()
const characterStore = useCharacterStore()

const sectName = ref('')
const nameError = ref('')
const founding = ref(false)

const canFound = computed(() => {
  if (!sectName.value) return false
  if (nameError.value) return false
  
  const currentSilver = characterStore.character?.silver || 0
  return currentSilver >= sectStore.SECT_FOUNDATION_COST.silver
})

// 名称输入时验证
function onNameInput() {
  const validation = sectStore.validateSectName(sectName.value)
  nameError.value = validation.valid ? '' : validation.error
}

// 开启宗门
async function onFoundSect() {
  if (!canFound.value) return
  
  founding.value = true
  
  try {
    const result = await sectStore.foundSect(
      characterStore.character.id,
      sectName.value,
      characterStore
    )
    
    if (result.success) {
      alert(result.message)
      // 成功后可以刷新页面或跳转
    } else {
      alert(result.message)
    }
  } catch (error) {
    alert('开启宗门失败：' + error.message)
  } finally {
    founding.value = false
  }
}

// 加载宗门状态
onMounted(async () => {
  if (characterStore.character) {
    await sectStore.loadFromDatabase(characterStore.character.id)
  }
})
</script>

<style scoped>
.foundation-dialog {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
  border: 2px solid #gold;
  border-radius: 10px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
}

.cost-info {
  margin: 20px 0;
  padding: 15px;
  background: rgba(255, 215, 0, 0.1);
  border-radius: 5px;
}

.cost {
  font-size: 24px;
  color: #ffd700;
  font-weight: bold;
}

.current {
  color: #888;
}

.name-input {
  margin: 20px 0;
}

.name-input input {
  width: 100%;
  padding: 10px;
  font-size: 16px;
  border: 2px solid #444;
  border-radius: 5px;
  background: #2a2a3e;
  color: #fff;
}

.error {
  color: #ff4444;
  margin-top: 5px;
}

button {
  width: 100%;
  padding: 15px;
  font-size: 18px;
  font-weight: bold;
  color: #fff;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s;
}

button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
*/

// ========== 示例6：错误处理 ==========
async function foundSectWithErrorHandling(sectName) {
    const sectStore = useSectStore()
    const characterStore = useCharacterStore()

    try {
        // 1. 前置检查
        if (!characterStore.character) {
            throw new Error('请先登录')
        }

        // 2. 验证名称
        const validation = sectStore.validateSectName(sectName)
        if (!validation.valid) {
            throw new Error(validation.error)
        }

        // 3. 检查唯一性
        const availability = await sectStore.checkSectNameAvailability(sectName)
        if (!availability.available) {
            throw new Error(availability.error)
        }

        // 4. 开启宗门
        const result = await sectStore.foundSect(
            characterStore.character.id,
            sectName,
            characterStore
        )

        if (!result.success) {
            throw new Error(result.message)
        }

        return { success: true, message: result.message }
    } catch (error) {
        console.error('开启宗门失败:', error)
        return { success: false, message: error.message }
    }
}

// ========== 示例7：实时名称验证 ==========
async function realtimeNameValidation(name) {
    const sectStore = useSectStore()

    // 1. 格式验证（即时）
    const formatCheck = sectStore.validateSectName(name)
    if (!formatCheck.valid) {
        return { valid: false, error: formatCheck.error, type: 'format' }
    }

    // 2. 唯一性验证（异步）
    const uniqueCheck = await sectStore.checkSectNameAvailability(name)
    if (!uniqueCheck.available) {
        return { valid: false, error: uniqueCheck.error, type: 'duplicate' }
    }

    return { valid: true }
}

export {
    checkSectStatus,
    validateName,
    checkNameAvailable,
    foundNewSect,
    foundSectWithErrorHandling,
    realtimeNameValidation
}
