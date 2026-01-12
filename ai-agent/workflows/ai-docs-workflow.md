# AI-docs 工作流逻辑

1. **需求拆分**  
 - 人类或 AI 拆分任务  
 - 记录到 `ai-agent/current/feature-xxx/task-list.md`

2. **任务执行**
 - 每个 Task 由主实现会话执行
 - 需要 code-explorer 查找逻辑
 - 需要 code-architect 做方案确认（如遇设计疑问）

3. **上下文管理（新增重点）**
   - **任何会话上下文满或会话中断前**：
     - 先将当前进度和结果写入文档，例如：
       - `progress.md`
       - `review.md`
     - 确保信息完整，不丢失
   - 之后可开启新会话继续任务

4. **进度更新**
 - 当前 Task 完成或会话上下文满时
 - 写入 `ai-agent/current/feature-xxx/progress.md`
 - 可开启新会话继续任务

5. **代码审查**
 - 每个 Task 完成后：
   - code-reviewer 进行 CR
   - 如遇复杂问题，调用 codex-cli / gemini-cli
 - 汇总结果写入 `ai-agent/current/feature-xxx/review.md`

6. **需求归档**
 - 所有任务完成后，将当前目录移动到：
   `ai-agent/archive/feature-xxx/`
 - 保留 task-list、progress、review、requirement 文档
