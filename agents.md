# AI Agent 核心约束

> 自动加载 | 不可违背 | 所有规则优先级最高

---

## §1 硬性约束（绝对遵守）

### 语言与题材
- **中文强制**：所有沟通、Plan、文档、SQL 注释必须中文
- **题材锁定**：修仙类 RPG，名称和设计必须符合修仙设定

### 代码质量
- **语法零容忍**：代码提交前必须自检，发现错误必须自行修复后再汇报
- **数据库注释强制**：所有字段/表的 comment 必须中文说明用途

### 工具强约束
- **Supabase MCP**：数据库操作必须使用 MCP 工具
- **项目 ID 固定**：`xufhdurllimdmymuplox`，无需查询

---

## §2 角色定义（一句话职责）

| 角色 | 职责 | 禁止行为 |
|------|------|----------|
| **code-explorer** | 定位代码/函数/文件路径 | 不写实现代码 |
| **code-architect** | 输出架构设计和风险分析 | 不写实现代码 |
| **code-reviewer** | 关注可维护性和潜在 bug | 不重写代码 |

---

## §3 上下文冲突与优先级

### 优先级规则（从高到低）
1. **当前任务**（用户本次请求）
2. **agents.md**（本文档，硬性约束）
3. **task.md 中的"下一步行动"**（迭代上下文）
4. **implementation.md**（技术细节）
5. **历史对话**（可丢弃）

### 上下文接近上限时
**必须执行**：
1. 立即检查 `ai-agent/current/` 是否存在迭代文件夹
2. 读取 `task.md` → "下一步行动"
3. 丢弃历史对话，仅保留：
   - 本文档（agents.md）
   - task.md / implementation.md
   - 当前任务相关代码
4. **禁止**：试图总结历史对话或要求用户重新说明

---

## §4 迭代记忆机制（核心触发规则）

### 创建约束
- ❌ **禁止在未确认的情况下自动创建迭代文件夹**
- ✅ 仅在以下情况创建 `ai-agent/current/feature-name/`：
  - 用户明确说"开始新功能迭代"
  - 预计需要多次会话完成
  - 你判断任务复杂度需要分阶段且已向用户确认

### 核心文件（必须创建）
```
current/feature-name/
├── task.md              ← 最重要：包含"下一步行动"
├── plan.md              ← 目标、范围、阶段
├── implementation.md    ← 技术实现、文件变更
└── requirements.md      ← 需求详情
```

### 强制更新规则
- **每完成一个功能**：更新 task.md 状态 + implementation.md
- **每次会话结束前**：更新 task.md 的"下一步行动"
- **新会话开始**：读取 task.md → "下一步行动" → 继续工作

---

## §5 归档规则（完成后必做）

### 触发条件
- 用户说"完成迭代"或"继续下一个功能"
- 所有任务已完成

### 归档步骤
1. 移动 `current/feature-name/` → `archive/YYYY-MM-DD-feature-name/`
2. 在归档文件夹创建 README.md（总结本次迭代）
3. 删除项目根目录/src 中的临时总结文档
4. 清空 `current/` 目录
5. 必须同步更新以下 3 个文件（即使内容很短）：
  - ai-agent/current/next_steps.md
  - ai-agent/current/quick_reference.md
  - ai-agent/current/README.md

### 归档位置约束
- ❌ 禁止：将总结放在 `web-client/` 或项目根目录
- ✅ 强制：统一归档到 `ai-agent/archive/`

---

## §6 扩展文档索引（按需加载，不自动读取）

### 加载约束
- ❌ **禁止一次性加载多个扩展文档**
- ✅ 仅在明确需要时，加载单个文档

### 可用文档列表
- 迭代流程详细说明：`ai-agent/workflows/iteration-workflow.md`
- 游戏素材规范：`ai-agent/guidelines/asset-structure.md`
- Supabase MCP 详细指南：`ai-agent/guides/supabase-mcp.md`
- 迭代模板：`ai-agent/templates/iteration-*.md`
- 功能设计：`web-client/核心玩法设计文档.md`

---

## §7 项目常量（快速参考）

| 项目 | 值 |
|------|-----|
| Supabase Project ID | `xufhdurllimdmymuplox` |
| 开发服务器 | `npm run dev` (web-client 目录) |
| 归档路径 | `ai-agent/archive/YYYY-MM-DD-feature-name/` |
| 迭代路径 | `ai-agent/current/feature-name/` |

---

**当前版本**：2026-01-13 | **Token 预估**：~1000
