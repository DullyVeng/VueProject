# 迭代工作流详细说明

> 本文档按需加载，不自动读取

---

## 一、迭代文件夹结构详解

### 标准结构
```
ai-agent/current/feature-name/
├── plan.md              # 迭代计划
├── task.md              # 任务清单（最重要）
├── requirements.md      # 需求文档
├── implementation.md    # 技术实现
└── notes.md             # 实现笔记（可选）
```

### 各文件职责

#### plan.md - 迭代计划
**用途**：宏观规划，定义目标和范围

**必须包含**：
- 迭代目标（要达成什么）
- 迭代范围（包含/不包含的功能）
- 阶段划分（分几步完成）
- 技术栈
- 风险点

**参考模板**：`ai-agent/templates/iteration-plan-template.md`

---

#### task.md - 任务清单
**用途**：跟踪进度，恢复上下文

**必须包含**：
- ⏭️ **下一步行动**（最重要！新会话从这里开始）
- 待完成任务列表
- 进行中任务（附进度说明）
- 已完成任务（附完成时间）
- 遇到的问题和解决方案

**参考模板**：`ai-agent/templates/iteration-task-template.md`

**下一步行动示例**：
```markdown
## ⏭️ 下一步行动

**当前应该做**：实现法宝羁绊系统的数据库表设计
**上下文**：法宝基础功能已完成，需要添加羁绊效果触发机制
```

---

#### requirements.md - 需求文档
**用途**：明确功能需求和验收标准

**必须包含**：
- 功能概述
- 用户故事
- 功能详细说明
- UI/UX 要求
- 验收标准

---

#### implementation.md - 技术实现
**用途**：记录技术方案和实现细节

**必须包含**：
- 技术方案（架构设计）
- 数据库设计（新增表/修改表）
- API 设计
- 文件变更清单（新增/修改文件）
- 已完成功能（附实现说明）
- 待实现功能（附计划）

---

## 二、详细使用流程

### 阶段一：开始新迭代

#### 1. 创建迭代文件夹
```bash
mkdir ai-agent/current/feature-name
```

**命名规范**：
- 全小写
- 用连字符分隔
- 简洁描述功能
- 示例：`fabao-synergy-system`

#### 2. 创建四个核心文档

**使用模板快速创建**：
```bash
# 复制模板
cp ai-agent/templates/iteration-plan-template.md current/feature-name/plan.md
cp ai-agent/templates/iteration-task-template.md current/feature-name/task.md
```

**手动创建**：
- `plan.md` - 填写目标、范围、阶段
- `task.md` - 列出初始任务清单
- `requirements.md` - 详细描述需求
- `implementation.md` - 规划技术方案

#### 3. 填写初始内容

**plan.md 填写要点**：
- 明确迭代目标（一句话总结）
- 划分阶段（建议 2-4 个阶段）
- 识别风险点

**task.md 填写要点**：
- 将功能拆分为可完成的小任务
- 每个任务尽量控制在 1-2 小时
- 标记优先级

---

### 阶段二：迭代过程中

#### 每完成一个功能时

**必须执行的更新**：

1. **更新 task.md**：
   ```markdown
   ## 已完成
   - [x] 实现 fabao_synergy 表 - 完成时间：2026-01-13
   ```

2. **更新 implementation.md**：
   ```markdown
   ## 已完成功能
   - [x] 数据库表设计 - 创建了 fabao_synergy 表，包含触发条件和效果字段
   ```

3. **更新"下一步行动"**：
   ```markdown
   ## ⏭️ 下一步行动
   **当前应该做**：实现羁绊效果的触发逻辑
   **上下文**：数据库表已创建，需要在 fabao store 中添加检测方法
   ```

#### 每次会话结束前

**强制检查清单**：
- [ ] task.md 的任务状态是否更新？
- [ ] "下一步行动"是否明确？
- [ ] "遇到的问题"是否记录？
- [ ] implementation.md 是否记录了文件变更？

**会话结束提示**：
```
已更新进度到 task.md
下次会话请查看"下一步行动"继续工作
```

#### 新会话开始时

**标准恢复流程**：

1. **读取 task.md**：
   ```
   @ai-agent/current/feature-name/task.md
   ```

2. **定位"下一步行动"**：
   ```markdown
   当前应该做：实现羁绊效果的触发逻辑
   ```

3. **查看进行中任务**：
   ```markdown
   ## 进行中
   - [/] 羁绊系统开发 - 已完成数据库设计，需实现触发逻辑
   ```

4. **检查遇到的问题**：
   ```markdown
   ## 遇到的问题
   - 羁绊效果如何与战斗系统集成？ - 已解决：在战斗开始时检测
   ```

5. **开始工作**（无需询问背景）

---

### 阶段三：迭代完成后

#### 1. 完成检查

**确认清单**：
- [ ] 所有任务都标记为"已完成"？
- [ ] 功能已测试通过？
- [ ] 代码无语法错误？
- [ ] 文档已更新？

#### 2. 归档操作

**执行步骤**：

```bash
# 1. 移动文件夹
mv ai-agent/current/feature-name ai-agent/archive/2026-01-13-feature-name

# 2. 进入归档文件夹
cd ai-agent/archive/2026-01-13-feature-name

# 3. 创建归档 README.md
# （使用下面的模板）
```

**归档 README.md 模板**：
```markdown
# [功能名称] - 迭代归档

**迭代时间**：YYYY-MM-DD ~ YYYY-MM-DD  
**状态**：✅ 已完成

## 迭代目标
[从 plan.md 复制]

## 完成功能
- ✅ 功能1
- ✅ 功能2

## 技术亮点
- 亮点1
- 亮点2

## 遇到的问题和解决方案
| 问题 | 解决方案 |
|------|----------|
| ... | ... |

## 相关文档
- [详细计划](./plan.md)
- [任务清单](./task.md)
- [技术实现](./implementation.md)
```

#### 3. 清理临时文件

**删除位置**：
- `web-client/` 中的临时总结文档
- 项目根目录中的临时文件

**保留位置**：
- `web-client/src/` 中的代码示例文件（如 `*-examples.js`）

---

## 三、长期记忆恢复机制

### 场景：上下文达到极限

#### 触发条件（任一满足）
- 上下文使用 > 70%
- 对话轮次 > 20 轮
- Claude 感觉"记不清前面代码细节"

#### 恢复流程

**步骤 1：停止当前会话**
```
⚠️ 上下文接近上限，我将保存进度并建议开启新会话
```

**步骤 2：更新 task.md**
- 将当前进度写入"进行中"
- 更新"下一步行动"
- 记录"遇到的问题"

**步骤 3：提示用户**
```
✅ 已更新进度到 ai-agent/current/feature-name/task.md
📝 下一步行动已明确
🔄 请开启新会话并说"继续"即可
```

**步骤 4：新会话恢复**
```
用户：继续
Claude：
1. 读取 task.md
2. 查看"下一步行动"
3. 直接开始工作（无需询问背景）
```

### 恢复示例

**task.md 内容**：
```markdown
## ⏭️ 下一步行动
**当前应该做**：完成羁绊效果的前端UI显示
**上下文**：
- 后端逻辑已完成（fabaoStore.checkSynergy()）
- 需要在战斗界面显示激活的羁绊效果
- UI设计：在左下角显示羁绊图标和加成数值
```

**Claude 恢复后的行为**：
```
✅ 我理解了，现在要做：
1. 修改 CombatView.vue
2. 添加羁绊效果显示区域
3. 调用 fabaoStore.checkSynergy() 获取数据
4. 显示激活的羁绊图标和加成

不需要您再说明背景，我直接开始实现。
```

---

## 四、最佳实践

### 1. 及时更新原则
**为什么重要**：
- 防止遗忘
- 新会话能快速恢复
- 多人协作时清晰可追溯

**如何做到**：
- 完成一个小功能 → 立即更新 task.md
- 写完关键代码 → 立即更新 implementation.md
- 会话结束前 → 必须更新"下一步行动"

### 2. 下一步行动明确化
**❌ 不明确**：
```markdown
下一步：继续开发羁绊系统
```

**✅ 明确**：
```markdown
下一步：实现羁绊效果的前端UI显示
上下文：后端逻辑已完成，需要在 CombatView.vue 左下角显示羁绊图标
```

### 3. 问题记录完整性
**记录格式**：
```markdown
## 遇到的问题
| 问题 | 出现时间 | 解决方案 | 状态 |
|------|----------|----------|------|
| 羁绊效果如何触发 | 2026-01-13 | 在战斗开始时检测 | ✅ 已解决 |
| UI性能问题 | 2026-01-14 | 使用computed缓存 | ✅ 已解决 |
```

### 4. 保持文档精炼
**原则**：
- 避免冗长描述
- 使用列表和表格
- 关键信息加粗或标记
- 及时删除过时内容

### 5. 使用模板
**好处**：
- 节省时间
- 统一格式
- 不遗漏关键信息

**可用模板**：
- `ai-agent/templates/iteration-plan-template.md`
- `ai-agent/templates/iteration-task-template.md`
- `ai-agent/templates/task-template.md`

---

## 五、常见问题

### Q1：什么时候需要创建迭代文件夹？
**A**：满足以下任一条件：
- 预计需要 3 次以上会话
- 功能复杂，需要分阶段实现
- 需要多人协作
- 用户明确说"开始新功能迭代"

### Q2：task.md 和 implementation.md 的区别？
**A**：
- `task.md`：**做什么**（任务清单，进度跟踪）
- `implementation.md`：**怎么做**（技术方案，代码细节）

### Q3：如果忘记更新"下一步行动"怎么办？
**A**：新会话时：
1. 读取 task.md 查看"进行中"任务
2. 读取 implementation.md 查看"待实现功能"
3. 询问用户："上次进行到哪里了？"

### Q4：一个迭代应该多大？
**A**：建议：
- **时间**：1-2 周
- **任务数**：10-30 个小任务
- **会话数**：5-15 次会话

太大 → 拆分为多个迭代  
太小 → 不需要创建迭代文件夹

### Q5：迭代中途需求变更怎么办？
**A**：
1. 更新 `requirements.md`（记录变更原因）
2. 更新 `plan.md`（调整阶段划分）
3. 更新 `task.md`（添加/删除任务）
4. 在 `notes.md` 记录决策过程

---

## 六、快速命令参考

### 创建迭代
```bash
# 创建文件夹
mkdir -p ai-agent/current/feature-name

# 复制模板
cd ai-agent/current/feature-name
cp ../../templates/iteration-plan-template.md plan.md
cp ../../templates/iteration-task-template.md task.md
touch requirements.md implementation.md notes.md
```

### 归档迭代
```bash
# 移动到归档
mv ai-agent/current/feature-name ai-agent/archive/$(date +%Y-%m-%d)-feature-name

# 创建归档 README
cd ai-agent/archive/$(date +%Y-%m-%d)-feature-name
touch README.md
```

### 查看当前迭代
```bash
# 列出所有迭代
ls -la ai-agent/current/

# 查看任务状态
cat ai-agent/current/feature-name/task.md
```

---

**最后更新**：2026-01-13
