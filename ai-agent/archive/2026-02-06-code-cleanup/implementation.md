# 项目架构审查与代码优化 技术实现

## 删除的文件（12项）

### 无用代码文件
| 文件 | 原因 |
|------|------|
| `src/stores/sect-foundation-examples.js` | 示例代码，无任何引用 |
| `src/stores/sect-sync-examples.js` | 示例代码，无任何引用 |
| `src/views/TestView.vue` | 测试页面，不应存在于生产代码 |

### 冗余文档
| 文件 | 原因 |
|------|------|
| `agents-legacy.md.bak` | 旧版 agents.md 备份，已被新版替代 |
| `agent长期记忆框架设计.md` | 已整合到 agents.md |
| `web-client/MAP_EXPANSION_SUMMARY.md` | 开发总结，应在 archive 中 |
| `web-client/REALM_LEVEL_UI_TODO.md` | 已过时的 TODO |
| `web-client/REQUIRED_ASSETS.md` | 过时的素材清单 |
| `web-client/docs/nourish_system_fix.md` | 过时的修复说明 |

## 修改的文件（3项）

### 1. `web-client/src/router/index.js`
- 删除 `/test` 路由（对应已删除的 TestView.vue）

### 2. `web-client/vite.config.js`
- 添加 `@` 路径别名，指向 `./src` 目录
- 方便后续使用 `@/stores/xxx` 替代 `../stores/xxx`

### 3. `web-client/src/stores/shop.js`
- 删除注释掉的 `useFabaoStore` import
- 删除未使用的 `getItemById` import
- 删除多余的 `// ... existing buyItem ...` 注释

## 架构审查结论

### 当前架构评价：良好
- Store 层职责划分清晰
- 数据层（data/）与状态层（stores/）分离合理
- 路由使用懒加载（除首页外）

### 后续可优化项（不在本次范围）
1. combat.js（1126行）和 fabao.js（1067行）体量较大，可考虑拆分
2. 考虑将 Java 空壳后端（app/）删除或实现
3. 排行榜 store 中的境界计算逻辑与 playerRealms.js 重复
