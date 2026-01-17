# 快速参考手册

**更新时间**：2026-01-14 00:54

---

## 📂 项目结构

```
web-client/
├── src/
│   ├── data/              # 数据配置
│   │   ├── maps.js        # 地图配置（15个）
│   │   ├── npcs.js        # NPC配置（4个）
│   │   ├── quests.js      # 任务配置（4个）
│   │   ├── items.js       # 物品配置
│   │   ├── fabaos.js      # 法宝配置（8个）
│   │   ├── fabaoShop.js   # 法宝商店
│   │   ├── fabaoDrops.js  # 法宝掉落
│   │   ├── sectShop.js    # 宗门兑换
│   │   └── mapPositions.js # 地图坐标
│   ├── stores/            # Pinia状态管理
│   │   ├── character.js   # 角色（HP/MP/经验/灵石/行动点）
│   │   ├── game.js        # 游戏状态（地图位置）
│   │   ├── quest.js       # 任务
│   │   ├── inventory.js   # 背包
│   │   ├── combat.js      # 战斗
│   │   └── fabao.js       # 法宝
│   ├── views/             # 页面
│   │   ├── MapView.vue    # 地图
│   │   ├── QuestView.vue  # 任务日志
│   │   ├── CombatView.vue # 战斗
│   │   └── DantianView.vue # 丹田
│   └── components/        # 组件
│       ├── NpcDialog.vue       # NPC对话
│       ├── ShopDialog.vue      # 商店
│       ├── FabaoShopDialog.vue # 法宝商店
│       ├── SectShopDialog.vue  # 宗门兑换
│       └── QuestListDialog.vue # 任务列表
```

---

## 🔧 常用Store API

### Character Store
```javascript
import { useCharacterStore } from '@/stores/character'
const characterStore = useCharacterStore()

// 行动点
await characterStore.consumeActionPoints(1)
await characterStore.restoreActionPoints(5)

// 灵石
await characterStore.spendSilver(100)
await characterStore.gainSilver(50)

// 经验（已实现）
await characterStore.gainExp(50)

// 宗门贡献
await characterStore.gainContribution(100)
await characterStore.spendContribution(500)
```

### Game Store
```javascript
import { useGameStore } from '@/stores/game'
const gameStore = useGameStore()

// 移动地图（会自动触发 checkVisitQuest）
await gameStore.travelTo('forest')
```

### Quest Store
```javascript
import { useQuestStore } from '@/stores/quest'
const questStore = useQuestStore()

// 加载任务
await questStore.fetchQuests()

// 接取/完成任务
await questStore.acceptQuest('quest_001')
await questStore.completeQuest('quest_001')

// 自动追踪（已集成到游戏流程）
questStore.checkKillQuests()       // 战斗后自动调用
questStore.checkCollectQuest(itemId) // 采集后自动调用
questStore.checkVisitQuest(mapId)    // 移动后自动调用
```

### Inventory Store
```javascript
import { useInventoryStore } from '@/stores/inventory'
const inventoryStore = useInventoryStore()

await inventoryStore.addItem('potion_hp_small', 1)
await inventoryStore.useItem(itemId)
```

---

## 📝 数据配置示例

### 添加新任务
```javascript
// 文件：src/data/quests.js
{
    id: 'quest_new',
    name: '任务名称',
    type: 'main',  // main/side/daily
    description: '任务描述',
    giver: 'elder_li',
    
    requirements: {
        level: 1,
        completedQuests: ['quest_001']  // 前置任务
    },
    
    objectives: [
        {
            type: 'kill_monsters',  // kill_monsters/collect_items/visit_location
            target: 'any',
            current: 0,
            required: 3,
            description: '击败妖兽'
        }
    ],
    
    rewards: {
        exp: 50,
        silver: 20,
        items: [
            { id: 'potion_hp_small', quantity: 2 }
        ]
    },
    
    repeatable: false,  // 是否可重复（准备中）
    nextQuest: null
}
```

### 添加新NPC
```javascript
// 文件：src/data/npcs.js
{
    id: 'new_npc',
    name: 'NPC名称',
    type: 'merchant',
    avatar: '👨',
    location: 'town',
    description: 'NPC描述',
    
    dialogues: {
        greeting: {
            text: '对话内容',
            options: [
                { text: '📜 查看任务', action: 'view_quests' },
                { text: '💰 查看商品', action: 'open_shop' },
                { text: '告辞', action: 'close' }
            ]
        }
    },
    
    shop: {
        buyPriceMultiplier: 1.0,
        sellPriceMultiplier: 0.5,
        items: ['potion_hp_small']
    },
    
    quests: ['quest_001']  // NPC发布的任务
}
```

---

## 🐛 调试技巧

### 查看任务状态
```javascript
const questStore = useQuestStore()
console.log(questStore.activeQuests)
console.log(questStore.completedQuestIds)
```

### 常见问题

**Q: 任务进度不更新？**
- 确认调用了对应的check函数
- 战斗后：checkKillQuests()
- 采集后：checkCollectQuest(itemId)
- 移动后：checkVisitQuest(mapId)

**Q: 任务不显示在NPC那里？**
- 检查 npcs.js 中该NPC是否有 quests 字段
- 检查 quests.js 中任务的 giver 是否正确

---

**语言校验：全部中文 ✓**
