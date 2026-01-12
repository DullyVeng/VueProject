# AI 工作准则

1. 所有AI在进行项目工作时，都使用中文进行沟通和汇报。
2. 所有AI在进行项目工作时，Thinking时，必须按照agent.md文档说明的准则进行思考，思考过程也用中文输出出来。
3. 所有AI在进行项目工作编写Plan时，务必要使用中文编写和汇报。
4. 编写数据库SQL时，字段的comment务必要写明字段的用途，表的comment务必要写明表的用途，并且务必用中文。
5. 每次完成代码编写或修改后，务必进行语法自检（最好查看运行中的终端报错），如有错误必须在通知用户前自行修复，确保代码无语法错误。
6. 该项目为修仙类型RPG游戏，设计背景和名字时，务必要符合修仙类型RPG游戏的设定。
7. Geberate Plan时，务必要使用中文编写和汇报。  
8. Geberate commit message时，务必要使用中文编写和汇报。
9. 涉及到Supabase的数据库操作时，务必要使用Supabase MCP进行操作。
10. 涉及到数据的验证时，可以调用supabase MCP进行数据验证。
11. 调用supabase MCP时，不需要查询项目信息，直接调用该项目的supabase ID为：xufhdurllimdmymuplox。
12. 创建新的字段或者新的表时，SQL里的comment务必要写明字段的用途，表的用途，并且务必用中文。

## 游戏素材目录规范 (web-client/public/assets/game)

为了保持项目整洁，所有游戏相关静态素材必须严格存放于 `web-client/public/assets/game/` 目录下的指定子文件夹中：

- **`/images/items`**: 存放所有物品图标（如：药水、装备、法宝）。
- **`/images/characters`**: 存放角色、怪物、NPC 的立绘或模型图。
- **`/images/ui`**: 存放界面相关的图标、背景图、边框纹理等。
- **`/audio/bgm`**: 存放背景音乐文件。
- **`/audio/sfx`**: 存放音效文件（如：攻击声、点击声）。
- **`/data`**: 存放静态数据文件（如需）。

请所有 AI 助手在生成或引用素材时，务必遵循此目录结构。引用路径示例：`/assets/game/images/items/sword.png`。

## Supabase MCP 使用指南

本项目已集成 Supabase MCP 服务器，提供完整的 Supabase 项目管理、数据库操作和 Edge Functions 部署能力。

### 1. 项目管理

#### 1.1 查看和选择项目
```
# 列出所有项目
mcp_supabase-mcp-server_list_projects

# 查看项目详情
mcp_supabase-mcp-server_get_project(id: "项目ID")

# 获取项目 API URL
mcp_supabase-mcp-server_get_project_url(project_id: "项目ID")

# 获取项目 API 密钥
mcp_supabase-mcp-server_get_publishable_keys(project_id: "项目ID")
```

#### 1.2 组织管理
```
# 列出所有组织
mcp_supabase-mcp-server_list_organizations

# 查看组织详情（包含订阅计划）
mcp_supabase-mcp-server_get_organization(id: "组织ID")
```

### 2. 数据库操作

#### 2.1 查看数据库结构
```
# 列出所有表（默认 public schema）
mcp_supabase-mcp-server_list_tables(project_id: "项目ID", schemas: ["public"])

# 列出所有扩展
mcp_supabase-mcp-server_list_extensions(project_id: "项目ID")

# 列出所有迁移
mcp_supabase-mcp-server_list_migrations(project_id: "项目ID")
```

#### 2.2 执行 SQL 操作
```
# 执行查询（DML 操作）
mcp_supabase-mcp-server_execute_sql(
  project_id: "项目ID",
  query: "SELECT * FROM users WHERE id = 1"
)

# 应用数据库迁移（DDL 操作）
mcp_supabase-mcp-server_apply_migration(
  project_id: "项目ID",
  name: "add_users_table",
  query: "CREATE TABLE users (id SERIAL PRIMARY KEY, name TEXT);"
)
```

**重要提示**：
- 使用 `execute_sql` 进行数据查询和修改（DML）
- 使用 `apply_migration` 进行结构变更（DDL），如创建表、修改字段等
- 迁移名称必须使用 snake_case 格式
- 不要在迁移中硬编码生成的 ID

#### 2.3 生成 TypeScript 类型
```
mcp_supabase-mcp-server_generate_typescript_types(project_id: "项目ID")
```

### 3. Edge Functions 管理

#### 3.1 列出和查看 Functions
```
# 列出所有 Edge Functions
mcp_supabase-mcp-server_list_edge_functions(project_id: "项目ID")

# 查看 Function 代码
mcp_supabase-mcp-server_get_edge_function(
  project_id: "项目ID",
  function_slug: "函数名称"
)
```

#### 3.2 部署 Edge Function
```
mcp_supabase-mcp-server_deploy_edge_function(
  project_id: "项目ID",
  name: "hello",
  files: [
    {
      name: "index.ts",
      content: "Deno.serve((req) => new Response('Hello!'))"
    }
  ],
  verify_jwt: true  # 默认启用 JWT 验证，确保安全访问
)
```

**JWT 验证说明**：
- **默认启用**：建议始终保持 `verify_jwt: true` 以确保授权访问
- **仅在以下情况禁用**：
  - 该函数之前已禁用 JWT 验证
  - 函数内部实现了自定义认证（如 API 密钥、webhook）
  - 用户明确要求禁用

### 4. 开发分支管理

#### 4.1 分支操作
```
# 列出所有开发分支
mcp_supabase-mcp-server_list_branches(project_id: "项目ID")

# 创建开发分支（需要先确认费用）
# 步骤 1: 获取费用
mcp_supabase-mcp-server_get_cost(
  type: "branch",
  organization_id: "组织ID"
)

# 步骤 2: 确认费用
mcp_supabase-mcp-server_confirm_cost(
  type: "branch",
  recurrence: "hourly",
  amount: 费用金额
)

# 步骤 3: 创建分支
mcp_supabase-mcp-server_create_branch(
  project_id: "项目ID",
  name: "develop",
  confirm_cost_id: "确认ID"
)
```

#### 4.2 分支同步
```
# 合并分支到生产环境
mcp_supabase-mcp-server_merge_branch(branch_id: "分支ID")

# 将生产环境迁移同步到分支
mcp_supabase-mcp-server_rebase_branch(branch_id: "分支ID")

# 重置分支到特定迁移版本
mcp_supabase-mcp-server_reset_branch(
  branch_id: "分支ID",
  migration_version: "版本号"  # 可选
)

# 删除分支
mcp_supabase-mcp-server_delete_branch(branch_id: "分支ID")
```

### 5. 监控和诊断

#### 5.1 查看日志
```
mcp_supabase-mcp-server_get_logs(
  project_id: "项目ID",
  service: "postgres"  # 可选: api, postgres, edge-function, auth, storage, realtime
)
```
返回最近 24 小时内的日志。

#### 5.2 安全和性能建议
```
# 获取安全建议（如缺失的 RLS 策略）
mcp_supabase-mcp-server_get_advisors(
  project_id: "项目ID",
  type: "security"
)

# 获取性能优化建议
mcp_supabase-mcp-server_get_advisors(
  project_id: "项目ID",
  type: "performance"
)
```

**建议**：在进行 DDL 变更后定期运行此工具，以检查安全漏洞和性能问题。

### 6. 文档搜索

```
mcp_supabase-mcp-server_search_docs(
  graphql_query: "{
    searchDocs(query: \"Row Level Security\", limit: 5) {
      nodes {
        title
        href
        content
      }
    }
  }"
)
```

即使你认为已经知道答案，也应优先调用此工具，因为文档会持续更新。

### 7. 项目暂停和恢复

```
# 暂停项目
mcp_supabase-mcp-server_pause_project(project_id: "项目ID")

# 恢复项目
mcp_supabase-mcp-server_restore_project(project_id: "项目ID")
```

### 最佳实践

1. **数据库变更**：始终使用 `apply_migration` 进行 DDL 操作，保持迁移历史可追溯
2. **安全检查**：定期运行 `get_advisors` 检查安全和性能问题
3. **开发流程**：使用开发分支进行测试，验证通过后再合并到生产环境
4. **JWT 验证**：除非有特殊需求，始终为 Edge Functions 启用 JWT 验证
5. **成本控制**：创建项目或分支前先通过 `get_cost` 确认费用

语言校验：全部中文 √
