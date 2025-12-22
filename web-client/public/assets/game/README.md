# 游戏素材目录说明

本目录 `public/assets/game/` 用于存放所有游戏相关的静态资源。为了保持项目整洁，请严格按照以下分类存放文件：

## 📁 目录结构

### 🖼️ images (图片资源)
- **`items/`**: 存放物品图标。
  - 例如：`sword_iron.png`, `potion_hp.png`
- **`characters/`**: 存放角色、怪物、NPC 的立绘或模型图。
  - 例如：`player_male.png`, `boss_dragon.png`
- **`ui/`**: 存放界面相关的图标、背景图、边框纹理等。
  - 例如：`inventory_bg.png`, `button_close.png`
  - **`icon_bag.png`**: 背包/乾坤袋功能的入口图标。
  - **`icon_inn.png`**: 客栈/休息处的入口图标。
  - **`icon_quest.png`**: 任务/悬赏榜的入口图标。
  - **`icon_pharmacy.png`**: 百草阁（药铺）的入口图标。
  - **`icon_mall.png`**: 商城/集市的入口图标。
  - **`icon_map.png`**: 地图功能的入口图标。
  - **`icon_hp_frame.png`**: 血条边框（普通状态）。
  - **`icon_hp_frame_low.png`**: 血条边框（低血量状态）。
  - **`icon_hp_bar.png`**: 血条填充图（满血）。
  - **`icon_hp_bar_empty.png`**: 血条底图（空血）。

### 🎵 audio (音频资源)
- **`bgm/`**: 存放背景音乐文件。
  - 例如：`town_theme.mp3`, `battle_bgm.mp3`
- **`sfx/`**: 存放短音效文件。
  - 例如：`attack_hit.wav`, `level_up.wav`

### 📄 data (数据资源)
- **`data/`**: 存放需要动态加载的静态 JSON 数据或其他配置（如有）。

---

**注意**: 引用资源时，请使用绝对路径 `/assets/game/...`。
