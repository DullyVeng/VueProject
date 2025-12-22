# Vue 3 + Vite

This template should help get you started developing with Vue 3 in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about IDE Support for Vue in the [Vue Docs Scaling up Guide](https://vuejs.org/guide/scaling-up/tooling.html#ide-support).


# 游戏核心玩法
## 法宝系统
1. 法宝配置占人物的法宝点数，会影响出场的数量。
2. 法宝有单独的一个装备栏，法宝栏随着境界的增加而增加。
3. 法宝的大小和形状都不一样，在法宝栏里也是对应大小的，越强大的法宝，对应的法宝栏越大，形状越奇特。
4. 法宝只能一回合召唤一个。
5. 法宝有生命值，作战时会在人物前面，和敌人进行战斗。
6. 每个法宝有对应的法术，法术有对应的法术图标。
7. 强大的法宝占用法宝栏更多，弱小的法宝占用法宝栏更少，多个弱小的法宝，作战效果不一定比一个强大的法宝弱。
8. 法宝强化时，随机消除最外层一格，让形状变小，随着境界的增加，装备可强化的次数也随之增加。

## 合成系统
1. 中期获得合成魔方道具，可以合成法宝。
2. 两个法宝合成一个，会只保留一个法宝的形状，属性词条概率性继承。
3. 增加一些辅助合成的道具，可以指向性合成形状，指向性继承词条。


## 彩蛋系统
1. 合成魔方可以有彩蛋
2. 剧情也可以有彩蛋
3. 像素动画可以有彩蛋

## 地图系统

