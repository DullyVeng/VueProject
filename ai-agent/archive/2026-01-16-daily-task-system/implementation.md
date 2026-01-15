# 每日任务系统 - 技术实现文档

**版本**：1.1  
**更新时间**：2026-01-16

---

## 🔄 更新记录

### v1.1 (2026-01-16)
- ❌ 移除温养任务类型（温养是持续行为，没有次数概念）
- ✅ 击杀任务随机化（怪物类型+数量动态生成）
- ✅ 奖励动态计算（基于玩家等级）
- ✅ 明确每日任务与剧情任务的分离

---

## 🏗️ 系统架构

```
┌─────────────────────────────────────────────────────────┐
│                      UI Layer                           │
│  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │ DailyTaskPanel  │  │ HomeView (集成入口)          │  │
│  └────────┬────────┘  └─────────────────────────────┘  │
├───────────┴─────────────────────────────────────────────┤
│                     Store Layer                          │
│  ┌─────────────────────────────────────────────────────┐│
│  │                   daily.js                          ││
│  │  - todayTasks: []     任务列表                      ││
│  │  - loadTodayTasks()   加载/初始化                   ││
│  │  - updateProgress()   更新进度                      ││
│  │  - claimReward()      领取奖励                      ││
│  └─────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────┤
│                    Config Layer                          │
│  ┌─────────────────────────────────────────────────────┐│
│  │                 dailyTasks.js                        ││
│  │  - taskTemplates[]    任务模板                      ││
│  │  - generateDailyTasks() 随机生成任务                ││
│  │  - calculateRewards()   动态奖励计算                ││
│  └─────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────┤
│                   Database Layer                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │              daily_task_progress                     ││
│  │  - character_id       玩家ID                        ││
│  │  - task_date          任务日期                      ││
│  │  - tasks              任务列表(JSONB)               ││
│  │  - all_completed_claimed  全完成奖励状态            ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

---

## 📁 文件结构

```
web-client/src/
├── data/
│   ├── quests.js              # [保留] 剧情任务配置
│   └── dailyTasks.js          # [新增] 每日任务配置
├── stores/
│   ├── quest.js               # [保留] 剧情任务store
│   └── daily.js               # [新增] 每日任务store
├── components/
│   └── DailyTaskPanel.vue     # [新增] 任务面板组件
├── views/
│   ├── QuestView.vue          # [保留] 剧情任务界面
│   └── HomeView.vue           # [修改] 集成入口
├── stores/
│   ├── combat.js              # [修改] 战斗完成回调
│   └── fabao.js               # [修改] 强化回调
└── supabase/
    └── create_daily_tasks.sql # [新增] 数据库迁移
```

---

## 🗄️ 数据库设计

### 表结构

```sql
CREATE TABLE public.daily_task_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
    task_date DATE NOT NULL DEFAULT CURRENT_DATE,
    tasks JSONB NOT NULL DEFAULT '[]',
    all_completed_claimed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(character_id, task_date)
);

-- 索引
CREATE INDEX idx_daily_task_character ON public.daily_task_progress(character_id);
CREATE INDEX idx_daily_task_date ON public.daily_task_progress(task_date);

-- 启用RLS
ALTER TABLE public.daily_task_progress ENABLE ROW LEVEL SECURITY;

-- RLS策略
CREATE POLICY "用户只能访问自己角色的每日任务" ON public.daily_task_progress
    FOR ALL USING (
        character_id IN (
            SELECT id FROM public.characters WHERE user_id = auth.uid()
        )
    );

-- 注释
COMMENT ON TABLE public.daily_task_progress IS '玩家每日任务进度表';
COMMENT ON COLUMN public.daily_task_progress.character_id IS '角色ID';
COMMENT ON COLUMN public.daily_task_progress.task_date IS '任务日期';
COMMENT ON COLUMN public.daily_task_progress.tasks IS '任务列表：[{id, name, type, target, current, required, claimed, rewards}]';
COMMENT ON COLUMN public.daily_task_progress.all_completed_claimed IS '全部完成额外奖励是否已领取';
```

### JSONB 结构示例

```json
{
  "tasks": [
    {
      "id": "daily_kill_slime_1705344000",
      "name": "猎杀史莱姆",
      "description": "击败8只史莱姆",
      "type": "kill_monsters",
      "target": "slime",
      "current": 3,
      "required": 8,
      "claimed": false,
      "rewards": { "exp": 120, "silver": 60 }
    }
  ]
}
```

---

## 💾 配置文件设计

### dailyTasks.js

```javascript
/**
 * 每日任务配置
 * 更新：v1.1 - 移除温养任务，增加随机化
 */
import { monsters } from './monsters'

// 任务类型枚举
export const DailyTaskType = {
  KILL_MONSTERS: 'kill_monsters',      // 击杀怪物
  COMPLETE_BATTLES: 'complete_battles', // 完成战斗
  ENHANCE_FABAO: 'enhance_fabao',       // 强化法宝
  KILL_BOSS: 'kill_boss'                // 击败BOSS
}

// 任务模板配置
export const taskTemplates = [
  {
    type: DailyTaskType.KILL_MONSTERS,
    weight: 40,  // 权重40%
    minLevel: 1
  },
  {
    type: DailyTaskType.COMPLETE_BATTLES,
    weight: 30,
    minLevel: 1
  },
  {
    type: DailyTaskType.ENHANCE_FABAO,
    weight: 20,
    minLevel: 5
  },
  {
    type: DailyTaskType.KILL_BOSS,
    weight: 10,
    minLevel: 20
  }
]

// ============= 奖励计算 =============

/**
 * 计算单任务经验奖励
 * 公式：等级 × 4 × 难度系数，±20%随机浮动
 */
export function calculateExpReward(playerLevel, difficulty = 1.0) {
  const baseExp = Math.floor(playerLevel * 4 * difficulty)
  const variance = Math.floor(baseExp * 0.2)
  return baseExp + Math.floor(Math.random() * variance * 2) - variance
}

/**
 * 计算单任务灵石奖励
 * 公式：等级 × 2 × 难度系数，±20%随机浮动
 */
export function calculateSilverReward(playerLevel, difficulty = 1.0) {
  const baseSilver = Math.floor(playerLevel * 2 * difficulty)
  const variance = Math.floor(baseSilver * 0.2)
  return baseSilver + Math.floor(Math.random() * variance * 2) - variance
}

/**
 * 计算全完成奖励
 */
export function calculateAllCompleteBonus(playerLevel) {
  return {
    exp: Math.floor(playerLevel * 5),
    silver: Math.floor(playerLevel * 3)
  }
}

// 难度系数映射
const difficultyMap = {
  [DailyTaskType.KILL_MONSTERS]: 1.0,
  [DailyTaskType.COMPLETE_BATTLES]: 0.8,
  [DailyTaskType.ENHANCE_FABAO]: 1.0,
  [DailyTaskType.KILL_BOSS]: 1.5
}

// ============= 任务生成 =============

/**
 * 获取可用怪物列表（基于玩家等级）
 */
function getAvailableMonsters(playerLevel) {
  const minLevel = Math.max(1, playerLevel - 20)
  const maxLevel = playerLevel + 10
  return monsters.filter(m => m.level >= minLevel && m.level <= maxLevel && !m.isBoss)
}

/**
 * 生成击杀任务
 */
function generateKillTask(playerLevel) {
  const availableMonsters = getAvailableMonsters(playerLevel)
  if (availableMonsters.length === 0) {
    // 降级处理：使用任意怪物
    return generateGenericKillTask(playerLevel)
  }
  
  const monster = availableMonsters[Math.floor(Math.random() * availableMonsters.length)]
  
  // 数量：基础5 + 等级/10，±30%随机
  const baseCount = 5 + Math.floor(playerLevel / 10)
  const variance = Math.floor(baseCount * 0.3)
  const count = Math.max(3, baseCount + Math.floor(Math.random() * variance * 2) - variance)
  
  const difficulty = difficultyMap[DailyTaskType.KILL_MONSTERS]
  
  return {
    id: `daily_kill_${monster.id}_${Date.now()}`,
    name: `猎杀${monster.name}`,
    description: `击败${count}只${monster.name}`,
    type: DailyTaskType.KILL_MONSTERS,
    target: monster.id,
    current: 0,
    required: count,
    claimed: false,
    rewards: {
      exp: calculateExpReward(playerLevel, difficulty),
      silver: calculateSilverReward(playerLevel, difficulty)
    }
  }
}

/**
 * 生成通用击杀任务（无指定怪物）
 */
function generateGenericKillTask(playerLevel) {
  const baseCount = 8 + Math.floor(playerLevel / 8)
  const variance = Math.floor(baseCount * 0.3)
  const count = Math.max(5, baseCount + Math.floor(Math.random() * variance * 2) - variance)
  
  const difficulty = difficultyMap[DailyTaskType.KILL_MONSTERS]
  
  return {
    id: `daily_kill_any_${Date.now()}`,
    name: '日常历练',
    description: `击败${count}只妖兽`,
    type: DailyTaskType.KILL_MONSTERS,
    target: 'any',
    current: 0,
    required: count,
    claimed: false,
    rewards: {
      exp: calculateExpReward(playerLevel, difficulty),
      silver: calculateSilverReward(playerLevel, difficulty)
    }
  }
}

/**
 * 生成战斗任务
 */
function generateBattleTask(playerLevel) {
  const baseCount = 3 + Math.floor(playerLevel / 20)
  const count = Math.min(8, baseCount)
  
  const difficulty = difficultyMap[DailyTaskType.COMPLETE_BATTLES]
  
  return {
    id: `daily_battle_${Date.now()}`,
    name: '战场老兵',
    description: `完成${count}场战斗胜利`,
    type: DailyTaskType.COMPLETE_BATTLES,
    target: 'win',
    current: 0,
    required: count,
    claimed: false,
    rewards: {
      exp: calculateExpReward(playerLevel, difficulty),
      silver: calculateSilverReward(playerLevel, difficulty)
    }
  }
}

/**
 * 生成强化任务
 */
function generateEnhanceTask(playerLevel) {
  const baseCount = 2 + Math.floor(playerLevel / 25)
  const count = Math.min(5, baseCount)
  
  const difficulty = difficultyMap[DailyTaskType.ENHANCE_FABAO]
  
  return {
    id: `daily_enhance_${Date.now()}`,
    name: '法宝精进',
    description: `强化法宝${count}次`,
    type: DailyTaskType.ENHANCE_FABAO,
    target: 'any',
    current: 0,
    required: count,
    claimed: false,
    rewards: {
      exp: calculateExpReward(playerLevel, difficulty),
      silver: calculateSilverReward(playerLevel, difficulty)
    }
  }
}

/**
 * 生成BOSS任务
 */
function generateBossTask(playerLevel) {
  const difficulty = difficultyMap[DailyTaskType.KILL_BOSS]
  
  return {
    id: `daily_boss_${Date.now()}`,
    name: 'BOSS挑战',
    description: '击败1只地图BOSS',
    type: DailyTaskType.KILL_BOSS,
    target: 'boss',
    current: 0,
    required: 1,
    claimed: false,
    rewards: {
      exp: calculateExpReward(playerLevel, difficulty),
      silver: calculateSilverReward(playerLevel, difficulty)
    }
  }
}

// 任务生成器映射
const taskGenerators = {
  [DailyTaskType.KILL_MONSTERS]: generateKillTask,
  [DailyTaskType.COMPLETE_BATTLES]: generateBattleTask,
  [DailyTaskType.ENHANCE_FABAO]: generateEnhanceTask,
  [DailyTaskType.KILL_BOSS]: generateBossTask
}

/**
 * 生成今日全部任务
 * @param {number} playerLevel 玩家等级
 * @param {number} taskCount 任务数量，默认4
 */
export function generateDailyTasks(playerLevel, taskCount = 4) {
  // 筛选符合等级的任务模板
  const availableTemplates = taskTemplates.filter(t => playerLevel >= t.minLevel)
  
  // 按权重随机选择
  const selectedTypes = []
  const usedTypes = new Set()
  
  while (selectedTypes.length < taskCount && selectedTypes.length < availableTemplates.length) {
    const template = weightedRandomSelect(availableTemplates.filter(t => !usedTypes.has(t.type)))
    if (template) {
      selectedTypes.push(template.type)
      usedTypes.add(template.type)
    }
  }
  
  // 如果还不够，允许重复击杀任务
  while (selectedTypes.length < taskCount) {
    selectedTypes.push(DailyTaskType.KILL_MONSTERS)
  }
  
  // 生成任务
  return selectedTypes.map(type => {
    const generator = taskGenerators[type]
    return generator(playerLevel)
  })
}

/**
 * 按权重随机选择
 */
function weightedRandomSelect(templates) {
  if (templates.length === 0) return null
  
  const totalWeight = templates.reduce((sum, t) => sum + t.weight, 0)
  let random = Math.random() * totalWeight
  
  for (const template of templates) {
    random -= template.weight
    if (random <= 0) return template
  }
  
  return templates[templates.length - 1]
}
```

---

## 🏪 Store 设计

### daily.js

```javascript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../supabase/client'
import { useCharacterStore } from './character'
import { 
  generateDailyTasks, 
  calculateAllCompleteBonus,
  DailyTaskType 
} from '../data/dailyTasks'

export const useDailyStore = defineStore('daily', () => {
  const characterStore = useCharacterStore()
  
  // 状态
  const todayTasks = ref([])
  const allCompletedClaimed = ref(false)
  const loading = ref(false)
  const taskDate = ref(null)
  
  // 计算属性
  const allCompleted = computed(() => {
    return todayTasks.value.length > 0 && 
           todayTasks.value.every(t => t.current >= t.required)
  })
  
  const allClaimedBonus = computed(() => {
    const level = characterStore.character?.level || 1
    return calculateAllCompleteBonus(level)
  })
  
  const completedCount = computed(() => 
    todayTasks.value.filter(t => t.current >= t.required).length
  )
  
  // 获取今日日期字符串（考虑时区）
  function getTodayString() {
    const now = new Date()
    return now.toISOString().split('T')[0]
  }
  
  // 加载今日任务
  async function loadTodayTasks() {
    const charId = characterStore.character?.id
    if (!charId) return
    
    loading.value = true
    const today = getTodayString()
    
    try {
      const { data, error } = await supabase
        .from('daily_task_progress')
        .select('*')
        .eq('character_id', charId)
        .eq('task_date', today)
        .single()
      
      if (error && error.code !== 'PGRST116') {
        throw error
      }
      
      if (data) {
        todayTasks.value = data.tasks || []
        allCompletedClaimed.value = data.all_completed_claimed || false
        taskDate.value = data.task_date
      } else {
        await initializeTodayTasks()
      }
    } catch (err) {
      console.error('加载每日任务失败:', err)
    } finally {
      loading.value = false
    }
  }
  
  // 初始化今日任务
  async function initializeTodayTasks() {
    const charId = characterStore.character?.id
    const level = characterStore.character?.level || 1
    if (!charId) return
    
    const today = getTodayString()
    const tasks = generateDailyTasks(level)
    
    try {
      const { data, error } = await supabase
        .from('daily_task_progress')
        .insert({
          character_id: charId,
          task_date: today,
          tasks: tasks,
          all_completed_claimed: false
        })
        .select()
        .single()
      
      if (error) throw error
      
      todayTasks.value = data.tasks
      allCompletedClaimed.value = false
      taskDate.value = today
      
      console.log('[Daily] 生成今日任务:', tasks.map(t => t.name))
    } catch (err) {
      console.error('初始化每日任务失败:', err)
    }
  }
  
  /**
   * 更新任务进度
   * @param {string} taskType - 任务类型
   * @param {string} target - 目标（怪物ID、'any'、'boss'、'win'）
   * @param {number} amount - 增加数量
   */
  async function updateProgress(taskType, target = 'any', amount = 1) {
    let hasUpdate = false
    
    for (const task of todayTasks.value) {
      // 已领取或已完成的任务不再更新
      if (task.claimed || task.current >= task.required) continue
      
      // 检查任务类型匹配
      if (task.type !== taskType) continue
      
      // 检查目标匹配
      let isMatch = false
      
      if (task.target === 'any') {
        // 任意目标都匹配
        isMatch = true
      } else if (task.target === target) {
        // 精确匹配
        isMatch = true
      } else if (taskType === DailyTaskType.KILL_MONSTERS && task.target === 'boss' && target === 'boss') {
        // BOSS任务匹配
        isMatch = true
      }
      
      if (isMatch) {
        task.current = Math.min(task.current + amount, task.required)
        hasUpdate = true
        console.log(`[Daily] 任务进度更新: ${task.name} ${task.current}/${task.required}`)
      }
    }
    
    if (hasUpdate) {
      await saveTasks()
    }
  }
  
  // 保存任务到数据库
  async function saveTasks() {
    const charId = characterStore.character?.id
    if (!charId || !taskDate.value) return
    
    try {
      await supabase
        .from('daily_task_progress')
        .update({
          tasks: todayTasks.value,
          updated_at: new Date().toISOString()
        })
        .eq('character_id', charId)
        .eq('task_date', taskDate.value)
    } catch (err) {
      console.error('保存每日任务失败:', err)
    }
  }
  
  // 领取单个任务奖励
  async function claimReward(taskId) {
    const task = todayTasks.value.find(t => t.id === taskId)
    if (!task) return { success: false, message: '任务不存在' }
    if (task.current < task.required) return { success: false, message: '任务未完成' }
    if (task.claimed) return { success: false, message: '奖励已领取' }
    
    // 标记已领取
    task.claimed = true
    
    // 发放奖励
    if (task.rewards.exp) {
      await characterStore.gainExp(task.rewards.exp)
    }
    if (task.rewards.silver) {
      await characterStore.gainSilver(task.rewards.silver)
    }
    
    // 保存
    await saveTasks()
    
    console.log(`[Daily] 领取奖励: ${task.name} +${task.rewards.exp}EXP +${task.rewards.silver}灵石`)
    
    return { 
      success: true, 
      rewards: task.rewards,
      message: `获得 ${task.rewards.exp} 经验、${task.rewards.silver} 灵石`
    }
  }
  
  // 领取全完成奖励
  async function claimAllCompleteBonus() {
    if (!allCompleted.value) return { success: false, message: '任务未全部完成' }
    if (allCompletedClaimed.value) return { success: false, message: '奖励已领取' }
    
    // 检查所有任务是否都已领取
    const allClaimed = todayTasks.value.every(t => t.claimed)
    if (!allClaimed) return { success: false, message: '请先领取各任务奖励' }
    
    const bonus = allClaimedBonus.value
    
    // 发放奖励
    if (bonus.exp) {
      await characterStore.gainExp(bonus.exp)
    }
    if (bonus.silver) {
      await characterStore.gainSilver(bonus.silver)
    }
    
    // 标记已领取
    allCompletedClaimed.value = true
    
    // 保存到数据库
    const charId = characterStore.character?.id
    if (charId && taskDate.value) {
      await supabase
        .from('daily_task_progress')
        .update({
          all_completed_claimed: true,
          updated_at: new Date().toISOString()
        })
        .eq('character_id', charId)
        .eq('task_date', taskDate.value)
    }
    
    console.log(`[Daily] 领取全完成奖励: +${bonus.exp}EXP +${bonus.silver}灵石`)
    
    return { 
      success: true, 
      rewards: bonus,
      message: `获得 ${bonus.exp} 经验、${bonus.silver} 灵石`
    }
  }
  
  // 检查是否需要刷新（跨天检测）
  function checkAndRefresh() {
    const today = getTodayString()
    if (taskDate.value !== today) {
      console.log('[Daily] 检测到跨天，刷新任务...')
      loadTodayTasks()
    }
  }
  
  return {
    todayTasks,
    allCompletedClaimed,
    loading,
    allCompleted,
    allClaimedBonus,
    completedCount,
    loadTodayTasks,
    updateProgress,
    claimReward,
    claimAllCompleteBonus,
    checkAndRefresh
  }
})
```

---

## 🔌 系统集成点

### combat.js 修改

```javascript
import { useDailyStore } from './daily'
import { DailyTaskType } from '../data/dailyTasks'

// 在战斗胜利结算中添加：
async function handleVictory(enemy) {
  const dailyStore = useDailyStore()
  
  // 更新战斗胜利任务
  await dailyStore.updateProgress(DailyTaskType.COMPLETE_BATTLES, 'win', 1)
  
  // 更新击杀任务
  // 判断是否是BOSS
  const isBoss = enemy.isBoss || false
  
  if (isBoss) {
    // BOSS击杀
    await dailyStore.updateProgress(DailyTaskType.KILL_BOSS, 'boss', 1)
  }
  
  // 具体怪物击杀（用怪物ID）
  await dailyStore.updateProgress(DailyTaskType.KILL_MONSTERS, enemy.id, 1)
}
```

### fabao.js 修改

```javascript
import { useDailyStore } from './daily'
import { DailyTaskType } from '../data/dailyTasks'

// 在强化操作后添加：
async function enhance(fabaoId) {
  // ... 现有强化逻辑
  
  // 不论成功失败都计数
  const dailyStore = useDailyStore()
  await dailyStore.updateProgress(DailyTaskType.ENHANCE_FABAO, 'any', 1)
}
```

---

## ✅ 变更记录

| 日期 | 变更内容 | 影响文件 |
|------|----------|----------|
| 2026-01-15 | 初始设计 | - |
| 2026-01-16 | 移除温养任务、增加随机化、动态奖励 | dailyTasks.js, daily.js |

---

## 🐛 已知问题

（开发过程中记录）

---

## 📝 开发笔记

（开发过程中的决策记录）
