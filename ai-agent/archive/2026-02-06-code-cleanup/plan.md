# 项目架构审查与代码优化 迭代计划

## 迭代目标
- 全面审查项目架构，清理无用代码和文件
- 优化不合理的代码结构
- 删除冗余文档和示例文件

## 迭代范围

### 包含
1. 删除无用文件（示例代码、测试页面、过时文档、Java空壳）
2. 清理路由中的测试路由
3. 清理根目录冗余文档
4. 优化 vite.config.js（添加路径别名）

### 不包含
- Store 拆分（combat.js/fabao.js 拆分为独立模块，工作量大，后续迭代）
- TypeScript 迁移
- 单元测试添加

## 阶段划分

### 阶段一：删除无用文件
- 删除 `stores/sect-foundation-examples.js`（无任何引用的示例代码）
- 删除 `stores/sect-sync-examples.js`（无任何引用的示例代码）
- 删除 `views/TestView.vue`（测试页面，不应存在于生产代码）
- 删除路由中的 `/test` 路由
- 删除 `agents-legacy.md.bak`（旧版 agents 备份）
- 删除 `agent长期记忆框架设计.md`（已整合到 agents.md）

### 阶段二：清理冗余文档
- 删除 `web-client/MAP_EXPANSION_SUMMARY.md`（开发总结，应在 archive 中）
- 删除 `web-client/REALM_LEVEL_UI_TODO.md`（TODO 已过时）
- 删除 `web-client/REQUIRED_ASSETS.md`（素材清单，可移到 doc/）
- 删除 `web-client/docs/nourish_system_fix.md`（修复说明，已过时）

### 阶段三：优化配置
- vite.config.js 添加 `@` 路径别名
- 清理 shop.js 中的注释掉的 import

## 风险点
- 删除文件前需确认无引用
- 路径别名修改不影响现有代码（现有代码使用相对路径，别名是增量改进）
