# 筑基期功法系统 - 技术实现

---

## 文件变更清单

### 新增文件

| 文件路径 | 说明 |
|----------|------|
| `src/data/gongfas.js` | 功法静态配置 |
| `src/data/gongfaSchools.js` | 功法派系定义 |
| `src/data/gongfaBonds.js` | 功法羁绊配置 |
| `src/stores/gongfa.js` | 功法store |
| `src/utils/shihaiUtils.js` | 识海工具函数 |
| `src/views/ShihaiView.vue` | 识海主视图 |
| `src/components/GongfaCard.vue` | 功法卡片组件 |
| `src/components/GongfaDetail.vue` | 功法详情弹窗 |
| `src/components/BondPanel.vue` | 羁绊面板 |
| `src/supabase/gongfa_instances.sql` | 功法实例表SQL |
| `src/supabase/shihai_extension.sql` | 识海扩展SQL |

### 修改文件

| 文件路径 | 修改内容 |
|----------|----------|
| `src/stores/attribute.js` | 添加识海容量计算 |
| `src/router/index.js` | 添加识海路由 |
| `src/views/MainLayout.vue` | 添加导航入口 |
| `src/stores/combat.js` | 集成羁绊效果（后续阶段） |

---

## 数据库设计

### gongfa_instances 表

```sql
CREATE TABLE IF NOT EXISTS public.gongfa_instances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  character_id UUID REFERENCES public.characters NOT NULL,
  gongfa_id TEXT NOT NULL,
  
  -- 等级与经验
  level INT DEFAULT 1,
  exp INT DEFAULT 0,
  
  -- 识海状态
  is_in_shihai BOOLEAN DEFAULT FALSE,
  shihai_slot INT,  -- 识海格子位置
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### characters 表扩展

```sql
ALTER TABLE public.characters
ADD COLUMN IF NOT EXISTS shihai_capacity INT DEFAULT 10,
ADD COLUMN IF NOT EXISTS shihai_used INT DEFAULT 0;
```

---

## Store 设计

### gongfa.js 核心方法

```javascript
// 获取玩家功法列表
async function fetchGongfas()

// 添加功法到背包
async function addGongfa(gongfaId)

// 放置功法到识海
async function placeGongfaInShihai(gongfaId)

// 从识海移除功法
async function removeFromShihai(gongfaId)

// 计算当前羁绊效果
function calculateBonds()

// 计算功法属性加成
function calculateGongfaBonus()
```

### 羁绊计算逻辑

```javascript
function calculateBonds() {
  const shihaiGongfas = gongfas.value.filter(g => g.is_in_shihai)
  
  // 按派系统计
  const schoolCounts = {}
  shihaiGongfas.forEach(g => {
    const config = getGongfaById(g.gongfa_id)
    schoolCounts[config.school] = (schoolCounts[config.school] || 0) + 1
  })
  
  // 计算激活的羁绊
  const activeBonds = []
  Object.entries(schoolCounts).forEach(([school, count]) => {
    const bondConfig = GONGFA_BONDS[school]
    if (bondConfig) {
      bondConfig.tiers.forEach(tier => {
        if (count >= tier.count) {
          activeBonds.push({ school, tier: tier.count, effect: tier.effect })
        }
      })
    }
  })
  
  return activeBonds
}
```

---

## UI 交互设计

### 识海视图布局

```
┌─────────────────────────────────────┐
│  识海          容量: 12/20          │
├─────────────────────────────────────┤
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐    │
│ │御剑诀│ │万剑归│ │剑心通│ │ 空 │    │
│ │ ⚔️  │ │ ⚔️  │ │ ⚔️  │ │    │    │
│ └─────┘ └─────┘ └─────┘ └─────┘    │
│                                     │
├─────────────────────────────────────┤
│  当前羁绊                           │
│  🗡️ 剑心通明 (3/4)                  │
│     ✅ Lv2: 攻击速度+10%            │
│     ⬜ Lv4: 需要4本剑修功法          │
└─────────────────────────────────────┘
```

---

## 境界检查

```javascript
// 检查是否解锁识海
function isShihaiUnlocked(character) {
  const ZHUJI_LEVEL = 2  // 筑基期level
  const realmConfig = PLAYER_REALMS[character.realm]
  return realmConfig && realmConfig.level >= ZHUJI_LEVEL
}
```

---

## 后续扩展点

1. **功法进化**：功法升级到满级后可进化
2. **功法与法宝联动**：剑修功法增强剑类法宝
3. **双系功法**：化神期后可学习多派系功法
4. **功法获取**：BOSS掉落、任务奖励、商店购买
