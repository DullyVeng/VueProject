# 项目架构审查与代码优化

**完成时间**：2026-02-06

## 迭代目标
全面审查项目架构，清理无用代码、冗余文档和不合理的配置。

## 完成内容

### 删除的文件（9个）
- `src/stores/sect-foundation-examples.js` — 无引用的示例代码
- `src/stores/sect-sync-examples.js` — 无引用的示例代码
- `src/views/TestView.vue` — 测试页面
- `agents-legacy.md.bak` — 旧版 agents 备份
- `agent长期记忆框架设计.md` — 已整合到 agents.md
- `web-client/MAP_EXPANSION_SUMMARY.md` — 开发总结文档
- `web-client/REALM_LEVEL_UI_TODO.md` — 过时 TODO
- `web-client/REQUIRED_ASSETS.md` — 过时素材清单
- `web-client/docs/nourish_system_fix.md` — 过时修复说明

### 修改的文件（3个）
- `router/index.js` — 移除 `/test` 路由
- `vite.config.js` — 添加 `@` 路径别名
- `stores/shop.js` — 清理未使用的 import

## 后续建议
- combat.js（1126行）和 fabao.js（1067行）可考虑拆分
- Java 空壳后端（app/）可考虑删除
- ranking.js 中境界计算逻辑与 playerRealms.js 重复
