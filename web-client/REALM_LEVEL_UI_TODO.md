### CharacterPanel境界层数突破功能待添加

**需要添加到script setup中：**

```javascript
// 是否可以突破境界层数
const canAdvanceRealmLevel = computed(() => {
  const char = characterStore.character
  if (!char) return false
  
  const currentRealmLevel = char.realm_level || 1
  const realmConfig = PLAYER_REALMS[char.realm]
  
  // 已达最高层，不能再突破层数
  if (currentRealmLevel >= (realmConfig?.maxLevel || 9)) return false
  
  const requiredLevel = (currentRealmLevel + 1) * 10
  const currentLevel = char.level || 1
  const currentExp = char.exp || 0
  const expNeeded = currentLevel * 50
  const silverCost = (currentRealmLevel + 1) * 100
  
  // 等级不足
  if (currentLevel < requiredLevel) return false
  
  // 灵石不足
  if (char.silver < silverCost) return false
  
  // 如果等级超过所需等级，直接可以突破（兼容高等级玩家）
  if (currentLevel > requiredLevel) return true
  
  // 如果等级刚好，需要经验槽满
  return currentExp >= expNeeded
})

// 境界层数突破
async function handleRealmLevelAdvance() {
  const result = await characterStore.advanceRealmLevel()
  
  if (result.success) {
    alert(`🎉 ${result.message}`)
  } else {
    alert(`❌ ${result.message}`)
  }
}
```

**需要添加到template中（在经验值进度条后）：**

```vue
<!-- 境界层数突破按钮 -->
<div class="realm-level-advance" v-if="characterStore.character && canAdvanceRealmLevel">
  <button class="btn-realm-advance" @click="handleRealmLevelAdvance">
    突破至{{ PLAYER_REALMS[characterStore.character.realm]?.name }}{{ (characterStore.character.realm_level || 1) + 1 }}层
  </button>
  <div class="advance-cost">
    消耗：{{ ((characterStore.character.realm_level || 1) + 1) * 100 }} 灵石
  </div>
</div>
```
