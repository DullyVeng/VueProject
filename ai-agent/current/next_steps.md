# 修仙模拟器 - 下次开发计划

**创建时间**：2026-01-13  
**优先级**：P0 > P1 > P2

---

## 🎯 立即需要完成（P0）

### 1. 完善任务自动追踪
**问题**：任务进度不会自动更新

**需要做的**：
1. 在 `src/stores/combat.js` 的 `endCombat` 函数中添加：
   ```javascript
   // 战斗胜利后
   const questStore = useQuestStore()
   questStore.checkKillQuests()
   ```

2. 在 `src/views/MapView.vue` 的 `handleGather` 函数中添加：
   ```javascript
   // 采集成功后
   gathered.forEach(item => {
       questStore.checkCollectQuest(item.id)
   })
   ```

3. 在 `src/stores/game.js` 的 `travelTo` 函数中添加：
   ```javascript
   // 移动后
   const questStore = useQuestStore()
   questStore.checkVisitQuest(mapId)
   ```

**预计时间**：30分钟

---

### 2. 实现经验系统
**问题**：任务奖励的经验无法发放

**需要做的**：
1. 在 `src/stores/character.js` 添加经验管理：
   ```javascript
   async function gainExp(amount) {
       if (!character.value) return
       
       const newExp = character.value.exp + amount
       const expNeeded = character.value.level * 100 // 简化公式
       
       if (newExp >= expNeeded) {
           // 升级逻辑
           await levelUp()
       }
       
       await supabase
           .from('characters')
           .update({ exp: newExp })
           .eq('id', character.value.id)
       
       character.value.exp = newExp
   }
   ```

2. 在 `src/stores/quest.js` 的 `completeQuest` 中调用：
   ```javascript
   if (rewards.exp) {
       await characterStore.gainExp(rewards.exp)
   }
   ```

**预计时间**：1小时

---

## 🔨 短期优化（P1）

### 1. 任务UI改进
- 在MapView中显示当前任务进度
- 任务完成时显示通知
- 添加任务追踪器组件

**预计时间**：2小时

---

### 2. 资源采集优化
- 添加采集动画
- 显示资源稀有度
- 采集冷却时间

**预计时间**：1.5小时

---

### 3. NPC系统扩展
- 添加更多NPC
- NPC好感度系统
- 特殊对话条件

**预计时间**：3小时

---

## 🚀 新功能开发（P2）

### 1. 随机事件系统
**设计思路**：
- 在地图探索时随机触发
- 事件类型：战斗、奖励、选择
- 事件结果影响游戏进程

**文件**：
- `src/data/events.js` - 事件配置
- `src/components/EventDialog.vue` - 事件UI
- `src/stores/event.js` - 事件状态管理

**预计时间**：4小时

---

### 2. 探索度系统
**设计思路**：
- 记录每个地图的探索进度
- 探索度影响奖励
- 100%探索解锁成就

**数据库**：
```sql
CREATE TABLE map_progress (
    id UUID PRIMARY KEY,
    character_id UUID REFERENCES characters(id),
    map_id VARCHAR(50),
    exploration_rate INTEGER DEFAULT 0,
    visits INTEGER DEFAULT 0
);
```

**预计时间**：3小时

---

### 3. 成就系统
**设计思路**：
- 完成特定条件获得成就
- 成就奖励（称号、物品）
- 成就展示页面

**预计时间**：5小时

---

## 🐛 已知Bug

### 1. 采集结果弹窗关闭后背景可点击
**优先级**：P1  
**解决方案**：添加pointer-events: none

### 2. 地图节点在某些分辨率下重叠
**优先级**：P2  
**解决方案**：调整mapPositions.js的坐标

---

## 💡 优化建议

### 性能优化
1. 地图节点使用虚拟滚动
2. 任务列表分页加载
3. 图片懒加载

### 用户体验
1. 添加加载动画
2. 操作反馈音效
3. 新手引导

### 代码质量
1. 添加单元测试
2. 完善错误处理
3. 代码注释补充

---

## 📅 开发时间表建议

### 第一周
- [ ] 完成任务自动追踪（P0）
- [ ] 实现经验系统（P0）
- [ ] 任务UI改进（P1）

### 第二周
- [ ] 资源采集优化（P1）
- [ ] NPC系统扩展（P1）
- [ ] 随机事件系统（P2）

### 第三周
- [ ] 探索度系统（P2）
- [ ] 成就系统（P2）
- [ ] Bug修复和优化

---

## 🔍 技术债务

1. **Quest Store的availableQuests**
   - 当前返回空数组
   - 需要实现真正的可接取任务逻辑

2. **地图解锁条件**
   - 当前只检查等级
   - 需要实现任务和物品条件

3. **错误处理**
   - 部分异步操作缺少错误处理
   - 需要统一错误提示机制

---

**语言校验：全部中文 ✓**
