# 修仙模拟器 - 快速开发指南

**更新时间**：2026-01-13  
**适用版本**：v0.3.0

---

## 🚀 快速开始

### 开发环境
```bash
cd e:\Project\JavaProject\web-client
npm run dev
```

### 数据库连接
- 项目ID：xufhdurllimdmymuplox
- 使用Supabase MCP工具执行SQL

---

## 📂 项目结构

### 核心目录
```
web-client/
├── src/
│   ├── data/           # 数据配置
│   │   ├── maps.js     # 地图配置
│   │   ├── npcs.js     # NPC配置
│   │   ├── quests.js   # 任务配置
│   │   ├── items.js    # 物品配置
│   │   ├── fabaos.js   # 法宝配置
│   │   └── mapPositions.js  # 地图坐标
│   ├── stores/         # 状态管理
│   │   ├── character.js     # 角色
│   │   ├── game.js          # 游戏状态
│   │   ├── quest.js         # 任务
│   │   ├── inventory.js     # 背包
│   │   ├── combat.js        # 战斗
│   │   └── fabao.js         # 法宝
│   ├── views/          # 页面
│   │   ├── MapView.vue      # 地图
│   │   ├── QuestView.vue    # 任务
│   │   ├── CombatView.vue   # 战斗
│   │   └── DantianView.vue  # 丹田
│   ├── components/     # 组件
│   │   ├── NpcDialog.vue        # NPC对话
│   │   ├── ShopDialog.vue       # 商店
│   │   └── QuestListDialog.vue  # 任务列表
│   └── supabase/       # 数据库脚本
```

---

## 🗄️ 数据库表

### 主要表结构

**characters** - 角色表
- 基础属性：name, gender, level, exp
- 战斗属性：hp, max_hp, mp, max_mp, attack, defense
- 修仙属性：realm, realm_level, spirit_power, divine_sense
- 资源：silver, current_action_points, max_action_points
- 状态：current_map_id

**inventory** - 背包表
- character_id, item_id, quantity, equipped

**fabao_instances** - 法宝实例表
- character_id, fabao_id, level, hp, max_hp, mp, max_mp
- nourish_level, enhance_level, is_nourishing

**player_quests** - 玩家任务表
- character_id, quest_id, status, objectives

---

## 🔧 常用开发任务

### 添加新地图
1. 编辑 `src/data/maps.js`
2. 添加地图配置
3. 在 `src/data/mapPositions.js` 添加坐标

### 添加新NPC
1. 编辑 `src/data/npcs.js`
2. 配置对话树
3. 如果是商人，配置shop
4. 如果发布任务，配置quests数组

### 添加新任务
1. 编辑 `src/data/quests.js`
2. 配置任务目标和奖励
3. 在NPC的quests数组中添加任务ID

### 添加新物品
1. 编辑 `src/data/items.js`
2. 配置物品属性
3. 如果是资源，在地图的resources中添加

---

## 🎯 核心功能使用

### 地图系统
```javascript
// 移动到新地图
gameStore.travelTo('forest')

// 检查访问任务
questStore.checkVisitQuest('mountain')
```

### 任务系统
```javascript
// 接取任务
await questStore.acceptQuest('quest_001')

// 更新进度
await questStore.updateQuestProgress('quest_001', 0, 5)

// 完成任务
await questStore.completeQuest('quest_001')
```

### 采集系统
```javascript
// 消耗行动点
await characterStore.consumeActionPoints(1)

// 添加物品到背包
await inventoryStore.addItem('lingcao', 1)

// 检查采集任务
questStore.checkCollectQuest('lingcao')
```

### NPC系统
```javascript
// 获取位置的NPC
const npcs = getNpcsByLocation('town')

// 购买物品
await characterStore.spendSilver(price)
await inventoryStore.addItem(itemId, quantity)

// 出售物品
await inventoryStore.updateItemQuantity(itemId, newQuantity)
await characterStore.gainSilver(price)
```

---

## 🐛 调试技巧

### 查看Store状态
```javascript
// 在浏览器控制台
const characterStore = useCharacterStore()
console.log(characterStore.character)

const questStore = useQuestStore()
console.log(questStore.activeQuests)
```

### 常见问题

**Q: 刷新后数据丢失？**
A: 检查是否正确保存到数据库，查看控制台错误

**Q: 任务进度不更新？**
A: 确保在相应操作后调用check函数

**Q: NPC对话不显示？**
A: 检查NPC的dialogues配置是否正确

---

## 📝 代码规范

### 命名规范
- 文件名：kebab-case（如：map-view.vue）
- 组件名：PascalCase（如：NpcDialog）
- 函数名：camelCase（如：handleGather）
- 常量：UPPER_SNAKE_CASE（如：QUEST_STATUS）

### 注释规范
```javascript
/**
 * 函数说明
 * @param {type} paramName - 参数说明
 * @returns {type} 返回值说明
 */
```

### Store规范
- 使用ref和computed
- 异步函数用async/await
- 错误处理用try-catch或检查error
- 添加console.log便于调试

---

## 🔄 Git工作流

### 提交规范
```bash
# 功能
git commit -m "feat: 添加任务系统"

# 修复
git commit -m "fix: 修复地图位置不保存的问题"

# 文档
git commit -m "docs: 更新开发文档"
```

---

## 📚 参考资源

### Vue 3
- 官方文档：https://vuejs.org/
- Composition API：https://vuejs.org/guide/extras/composition-api-faq.html

### Pinia
- 官方文档：https://pinia.vuejs.org/

### Supabase
- 官方文档：https://supabase.com/docs

---

**语言校验：全部中文 ✓**
