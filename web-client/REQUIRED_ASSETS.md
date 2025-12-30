# 游戏素材需求清单 (Required Assets)

基于当前代码结构 (`src` 和 `public`)，以下是游戏运行所需的完整素材清单。

## 1. 地图背景 (Maps)
**路径**: `public/assets/game/images/maps/`
- [ ] `starter_village.jpg` (新手村背景，建议分辨率 1920x1080)
- [ ] `wild_forest.jpg` (野外森林)
- [ ] `dungeon_entrance.jpg` (副本/地宫入口)

## 2. UI 图标 (UI Icons)
**路径**: `public/assets/game/images/ui/`
*当前状态：大部分已存在*
- [x] `icon_bag.png` (背包)
- [x] `icon_map.png` (地图)
- [x] `icon_quest.png` (任务)
- [x] `icon_pharmacy.png` (药店/百草阁)
- [x] `icon_inn.png` (客栈)
- [x] `icon_hp_bar.png` (血条填充)
- [x] `icon_hp_frame.png` (血条边框)
- [ ] `icon_learderboard.png` (天榜/排行榜，可选)

## 3. 物品图标 (Item Icons)
**路径**: `public/assets/game/images/items/`
*当前代码中使用 Emoji，建议替换为 64x64 像素图标*
- [ ] `weapon_sword_iron.png` (铁剑)
- [ ] `armor_cloth_basic.png` (布衣)
- [ ] `potion_hp_small.png` (小生命药水)
- [ ] `fabao_misc.png` (法宝图标)
- [ ] ...以及其他装备和道具图标

## 4. 人物立绘/纸娃娃 (Character Layers)
**路径**: `public/assets/game/images/characters/`
*用于 CharacterPanel 的纸娃娃系统*
- [ ] `base_body_male.png` (男性身体底图)
- [ ] `base_body_female.png` (女性身体底图)
- [ ] `layer_head_default.png` (默认发型/头部)
- [ ] `layer_armor_basic.png` (基础法衣层)

## 5. 音效 (Audio) - *可选*
**路径**: `public/assets/game/audio/`
- [ ] `bgm_village.mp3` (村庄背景乐)
- [ ] `sfx_click.mp3` (UI 点击音效)
- [ ] `sfx_attack.mp3` (攻击音效)

---
**提示**: 您可以在 `src/assets/README_ASSETS.md` 中找到推荐的免费素材下载网站。
