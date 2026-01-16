# 每日任务系统开发计划

**创建时间**：2026-01-15  
**更新时间**：2026-01-16  
**预计周期**：1天  
**优先级**：⭐⭐⭐⭐⭐ 最高优先级

---

## 🎯 系统目标

### 核心目标
给玩家**持续游玩的动力**，通过每日可刷新的任务让玩家：
1. 有明确的每日游戏目标
2. 获得稳定的资源产出
3. 引导探索不同的游戏内容

### 设计原则
1. **简单易懂**：任务类型清晰，完成条件明确
2. **奖励动态**：根据玩家等级动态计算，保持激励性
3. **随机多样**：每日任务随机生成，增加新鲜感
4. **进度可见**：实时显示完成进度

---

## 📋 功能清单

### 核心功能
1. **每日任务随机生成**
   - 根据玩家等级筛选任务池
   - 击杀目标随机选择（怪物类型、数量随机化）
   - 每日抽取4个任务

2. **任务类型**（已调整）
   - ✅ 击败 X 只指定类型怪物（随机怪物类型+随机数量）
   - ✅ 完成 X 场战斗（胜利）
   - ✅ 法宝强化 X 次
   - ❌ ~~法宝温养 X 次~~（移除：温养是持续行为）
   - ✅ 击败地图BOSS

3. **每日刷新机制**
   - 每日 0 点自动重置
   - 未完成任务清空
   - 重新随机生成

4. **动态奖励系统**（新设计）
   - 经验奖励 = 基于玩家等级动态计算
   - 灵石奖励 = 基于玩家等级动态计算
   - 全部完成额外奖励

5. **UI界面**
   - 每日任务面板组件
   - 任务进度实时显示
   - 奖励领取交互
   - 刷新倒计时显示

---

## 📊 奖励计算设计（新增）

### 升级经验公式
当前系统：升级所需经验 = `等级 × 50`
- 10级升级需要 500 经验
- 30级升级需要 1500 经验
- 50级升级需要 2500 经验

### 每日任务奖励设计原则
**目标**：完成全部每日任务 ≈ 1/3 升级经验

| 玩家等级 | 升级所需 | 单任务经验 | 全完成奖励 | 总计 |
|----------|----------|------------|------------|------|
| 10级 | 500 | 30~40 | 50 | ~170 (34%) |
| 30级 | 1500 | 90~120 | 150 | ~510 (34%) |
| 50级 | 2500 | 150~200 | 250 | ~850 (34%) |

### 奖励计算公式

```javascript
// 单任务经验奖励
function getTaskExpReward(playerLevel, taskDifficulty = 1) {
  const baseExp = Math.floor(playerLevel * 4 * taskDifficulty)
  const variance = Math.floor(baseExp * 0.2) // ±20%随机浮动
  return baseExp + Math.floor(Math.random() * variance * 2) - variance
}

// 单任务灵石奖励  
function getTaskSilverReward(playerLevel, taskDifficulty = 1) {
  const baseSilver = Math.floor(playerLevel * 2 * taskDifficulty)
  const variance = Math.floor(baseSilver * 0.2)
  return baseSilver + Math.floor(Math.random() * variance * 2) - variance
}

// 全完成奖励
function getAllCompleteBonus(playerLevel) {
  return {
    exp: Math.floor(playerLevel * 5),
    silver: Math.floor(playerLevel * 3)
  }
}
```

### 任务难度系数
| 任务类型 | 难度系数 | 说明 |
|----------|----------|------|
| 击杀普通怪物 | 1.0 | 基础任务 |
| 完成战斗 | 0.8 | 较简单 |
| 法宝强化 | 1.0 | 需要资源 |
| 击败BOSS | 1.5 | 高难度高回报 |

---

## 🎲 随机任务生成（新增）

### 击杀任务随机化

```javascript
// 根据玩家等级获取可用怪物类型
function getAvailableMonsterTypes(playerLevel) {
  return monsters.filter(m => m.level <= playerLevel + 10 && m.level >= Math.max(1, playerLevel - 20))
}

// 随机生成击杀任务
function generateKillTask(playerLevel) {
  const availableMonsters = getAvailableMonsterTypes(playerLevel)
  const randomMonster = availableMonsters[Math.floor(Math.random() * availableMonsters.length)]
  
  // 数量根据等级浮动：基础5 + 等级/10，±30%随机
  const baseCount = 5 + Math.floor(playerLevel / 10)
  const variance = Math.floor(baseCount * 0.3)
  const count = baseCount + Math.floor(Math.random() * variance * 2) - variance

  return {
    id: `daily_kill_${randomMonster.id}_${Date.now()}`,
    name: `猎杀${randomMonster.name}`,
    description: `击败${count}只${randomMonster.name}`,
    type: 'kill_monsters',
    target: randomMonster.id,  // 指定怪物类型
    required: count
  }
}
```

### 任务池模板

```javascript
const dailyTaskTemplates = [
  // 击杀类（随机生成）
  { type: 'kill_random', weight: 40 },  // 40%权重
  
  // 战斗类
  { 
    type: 'complete_battles', 
    weight: 25,
    generator: (level) => ({
      name: '日常历练',
      description: `完成${3 + Math.floor(level/20)}场战斗胜利`,
      required: 3 + Math.floor(level/20)
    })
  },
  
  // 强化类
  {
    type: 'enhance_fabao',
    weight: 20,
    generator: (level) => ({
      name: '法宝精进',
      description: `强化法宝${2 + Math.floor(level/25)}次`,
      required: 2 + Math.floor(level/25)
    })
  },
  
  // BOSS类（仅20级以上）
  {
    type: 'kill_boss',
    weight: 15,
    minLevel: 20,
    generator: () => ({
      name: 'BOSS挑战',
      description: '击败1只地图BOSS',
      required: 1
    })
  }
]
```

---

## 🏗️ 技术方案

### 新增文件

```
web-client/src/
├── data/
│   └── dailyTasks.js          # 每日任务配置和生成器
├── stores/
│   └── daily.js               # 每日任务 store
├── components/
│   └── DailyTaskPanel.vue     # 每日任务面板
└── supabase/
    └── create_daily_tasks.sql # 数据库表
```

### 数据库设计

```sql
-- 玩家每日任务表
CREATE TABLE daily_task_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    task_date DATE NOT NULL DEFAULT CURRENT_DATE,
    tasks JSONB NOT NULL DEFAULT '[]',
    all_completed_claimed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(character_id, task_date)
);

-- 注释
COMMENT ON TABLE daily_task_progress IS '玩家每日任务进度表';
COMMENT ON COLUMN daily_task_progress.tasks IS '今日任务列表：[{id, type, target, current, required, claimed, rewards}]';
COMMENT ON COLUMN daily_task_progress.all_completed_claimed IS '全部完成额外奖励是否已领取';
```

---

## 📐 任务类型详细设计

### 1. kill_monsters（击杀怪物）- 已更新
- **target**: 具体怪物ID（随机生成）或 'boss'
- **required**: 动态计算（5-15只，根据等级）
- **触发时机**: 战斗胜利后
- **示例**: 击败8只史莱姆、击败6只森林狼、击败1只BOSS

### 2. complete_battles（完成战斗）
- **target**: 'win'
- **required**: 3-8场（根据等级）
- **触发时机**: 战斗胜利后
- **示例**: 完成5场战斗胜利

### 3. enhance_fabao（法宝强化）
- **target**: 'any'
- **required**: 2-5次（根据等级）
- **触发时机**: 强化操作后（成功或失败都计数）
- **示例**: 强化法宝3次

---

## 📋 任务系统分类说明（用户需求#4）

### 类型区分
| 类型 | 标识 | 说明 |
|------|------|------|
| 每日任务 | `daily` | 本次迭代实现，每日刷新 |
| 剧情任务 | `main` | 已有系统，推动剧情 |
| 支线任务 | `side` | 已有系统，额外内容 |
| 境界任务 | `realm` | 已有系统，突破引导 |

### 数据存储分离
- **每日任务**：`daily_task_progress` 表（新建）
- **剧情/支线/境界任务**：`player_quests` 表（现有）

### UI展示分离
- 每日任务：独立面板 `DailyTaskPanel.vue`
- 其他任务：现有 `QuestView.vue` 保持不变

---

## 🎨 UI 设计

### 面板位置
- 主界面右侧可折叠面板
- 或作为快捷入口在导航栏

### 面板内容
```
┌─────────────────────────────────┐
│ 📋 每日任务      刷新: 02:30:00 │
├─────────────────────────────────┤
│ ✅ 击败8只史莱姆   [8/8] [领取] │
│ 🔄 完成5场战斗     [2/5]        │
│ 🔄 强化法宝3次     [1/3]        │
│ 🔄 击败1只BOSS     [0/1]        │
├─────────────────────────────────┤
│ 🎁 全部完成奖励    [未完成]     │
│    +150 EXP +90 灵石           │
└─────────────────────────────────┘
```

---

## ⚡ 集成点

需要在以下位置添加任务进度更新调用：

1. **战斗结束** (`stores/combat.js`)
   - 更新 kill_monsters 任务（检查怪物类型匹配）
   - 更新 complete_battles 任务

2. **法宝强化** (`stores/fabao.js`)
   - 更新 enhance_fabao 任务

---

## 📅 开发阶段

### 阶段1：基础架构（2-3小时）
- [ ] 创建数据库表
- [ ] 创建 dailyTasks.js（任务模板 + 生成器 + 奖励计算）
- [ ] 创建 daily.js store 基础结构

### 阶段2：核心逻辑（2-3小时）
- [ ] 实现随机任务生成
- [ ] 实现动态奖励计算
- [ ] 实现进度更新（含怪物类型匹配）
- [ ] 实现奖励领取

### 阶段3：UI界面（2小时）
- [ ] 创建 DailyTaskPanel.vue 组件
- [ ] 样式美化
- [ ] 主界面集成

### 阶段4：系统集成（1小时）
- [ ] 战斗系统集成（含怪物类型识别）
- [ ] 法宝强化集成

### 阶段5：测试完善（1小时）
- [ ] 功能测试
- [ ] Bug修复
- [ ] 文档更新

---

## 🔮 后续扩展

1. **周常任务**：可复用架构
2. **成就系统**：可复用进度追踪
3. **活动任务**：可复用任务机制

---

## ✅ 验收标准

1. 每日任务随机生成，怪物类型和数量有变化
2. 奖励根据玩家等级动态计算
3. 任务进度实时更新
4. 奖励正确发放
5. 与现有剧情任务系统独立
6. UI美观流畅
7. 0点自动刷新

---

**下一步**：确认计划后开始阶段1开发
