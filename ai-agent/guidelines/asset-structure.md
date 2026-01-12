# 游戏素材目录规范 (web-client/public/assets/game)

为了保持项目整洁，所有游戏相关静态素材必须严格存放于 `web-client/public/assets/game/` 目录下的指定子文件夹中：

- **`/images/items`**: 存放所有物品图标（如：药水、装备、法宝）。
- **`/images/characters`**: 存放角色、怪物、NPC 的立绘或模型图。
- **`/images/ui`**: 存放界面相关的图标、背景图、边框纹理等。
- **`/audio/bgm`**: 存放背景音乐文件。
- **`/audio/sfx`**: 存放音效文件（如：攻击声、点击声）。
- **`/data`**: 存放静态数据文件（如需）。

请所有 AI 助手在生成或引用素材时，务必遵循此目录结构。引用路径示例：`/assets/game/images/items/sword.png`。
