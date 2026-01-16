/**
 * 地图生成器工具类
 * 实现程序化地图生成算法
 */

// 地形类型常量（与 explorationMaps.js 保持一致）
const TERRAIN_TYPES = {
    GROUND: 0,      // 可行走地面
    WALL: 1,        // 墙壁（不可通过）
    OBSTACLE: 2,    // 障碍物（树木、石头等）
    WATER: 3,       // 水域（不可通过）
    GRASS: 4,       // 草地（可行走，增加隐性遭遇率）
    EXIT: 9         // 出口（触发返回大地图）
}

export class DiggerMapGenerator {
    constructor() {
        this.width = 0
        this.height = 0
        this.terrain = null // Int8Array
        this.rooms = []
    }

    /**
     * 生成随机地图
     * @param {number} width - 地图宽度
     * @param {number} height - 地图高度
     * @param {Object} options - 生成选项
     * @returns {Object} 生成的地图数据
     */
    generateMap(width, height, options = {}) {
        this.width = width
        this.height = height
        const {
            minWalkableRatio = 0.4,
            maxWalkableRatio = 0.6,
            roomCount = 10,
            roomSizeRange = [5, 12]
        } = options

        let attempts = 0
        const maxAttempts = 10

        while (attempts < maxAttempts) {
            attempts++

            // 1. 初始化全为墙
            this.terrain = new Int8Array(width * height).fill(TERRAIN_TYPES.WALL)

            // 2. 挖掘主逻辑
            this._digMap(roomCount, roomSizeRange)

            // 3. 连通性检查和修复 (Digger算法通常保证连通，但为了保险)
            if (!this._ensureConnectivity()) {
                console.log(`[MapGen] Connectivity check failed on attempt ${attempts}`)
                continue
            }

            // 4. 计算通路占比
            const ratio = this._calculateWalkableRatio()
            console.log(`[MapGen] Attempt ${attempts}: Walkable Ratio = ${ratio.toFixed(2)}`)

            if (ratio >= minWalkableRatio && ratio <= maxWalkableRatio) {
                // 满足条件

                // 5. 放置出口和出生点
                const spawnPoint = this._findSpawnPoint()
                const exitPoints = this._findExitPoints()
                if (exitPoints.length === 0) {
                    // 强制挖掘一个出口
                    const forcedExit = this._forceCreateExit()
                    exitPoints.push(forcedExit)
                }

                // 标记出口
                exitPoints.forEach(p => {
                    this.terrain[p.y * width + p.x] = TERRAIN_TYPES.EXIT
                })

                // 6. 装饰地图 (随机放置障碍物和草地)
                this._decorateMap()

                return {
                    width: this.width,
                    height: this.height,
                    terrain: this.terrain, // Int8Array
                    spawnPoint,
                    exitPoints,
                    walkableRatio: ratio
                }
            }
        }

        throw new Error(`Failed to generate valid map after ${maxAttempts} attempts`)
    }

    _digMap(targetRoomCount, [minSize, maxSize]) {
        // 方法：随机挖掘者
        // 从中心开始
        let cx = Math.floor(this.width / 2)
        let cy = Math.floor(this.height / 2)

        // 挖掘器列表 [{x, y}]
        let diggers = [{ x: cx, y: cy }]

        // 初始中心区域
        this._carveRect(cx - 2, cy - 2, 5, 5)

        // 随机步数总限制，防止无限循环
        let totalSteps = this.width * this.height * 2

        while (diggers.length > 0 && totalSteps > 0) {
            totalSteps--

            // 随机选择一个挖掘器
            const diggerIdx = Math.floor(Math.random() * diggers.length)
            const digger = diggers[diggerIdx]

            // 随机方向
            const dirs = [
                { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
                { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
            ]
            const dir = dirs[Math.floor(Math.random() * dirs.length)]

            const nx = digger.x + dir.dx
            const ny = digger.y + dir.dy

            // 边界检查 (留出1格边缘)
            if (nx > 1 && nx < this.width - 2 && ny > 1 && ny < this.height - 2) {
                // 移动挖掘器
                digger.x = nx
                digger.y = ny

                // 挖掘
                const idx = ny * this.width + nx
                if (this.terrain[idx] === TERRAIN_TYPES.WALL) {
                    this.terrain[idx] = TERRAIN_TYPES.GROUND

                    // 小概率生成房间
                    if (Math.random() < 0.02) {
                        const w = Math.floor(Math.random() * (maxSize - minSize + 1)) + minSize
                        const h = Math.floor(Math.random() * (maxSize - minSize + 1)) + minSize
                        this._carveRect(nx - Math.floor(w / 2), ny - Math.floor(h / 2), w, h)
                    }

                    // 小概率分裂新挖掘器
                    if (Math.random() < 0.05 && diggers.length < 5) {
                        diggers.push({ x: nx, y: ny })
                    }
                }
            } else {
                // 撞墙/边缘后移除该挖掘器
                diggers.splice(diggerIdx, 1)
            }
        }
    }

    _carveRect(x, y, w, h) {
        for (let j = y; j < y + h; j++) {
            for (let i = x; i < x + w; i++) {
                if (i > 1 && i < this.width - 2 && j > 1 && j < this.height - 2) {
                    this.terrain[j * this.width + i] = TERRAIN_TYPES.GROUND
                }
            }
        }
    }

    _calculateWalkableRatio() {
        let walkable = 0
        for (let i = 0; i < this.terrain.length; i++) {
            if (this.terrain[i] !== TERRAIN_TYPES.WALL) {
                walkable++
            }
        }
        return walkable / this.terrain.length
    }

    _ensureConnectivity() {
        // 洪水填充算法检查连通性
        const startIdx = this.terrain.findIndex(t => t !== TERRAIN_TYPES.WALL)
        if (startIdx === -1) return false

        const visited = new Int8Array(this.width * this.height).fill(0)
        const stack = [startIdx]
        visited[startIdx] = 1
        let connectedCount = 0

        while (stack.length > 0) {
            const idx = stack.pop()
            connectedCount++

            const x = idx % this.width
            const y = Math.floor(idx / this.width)

            const neighbors = [
                { nx: x, ny: y - 1 }, { nx: x, ny: y + 1 },
                { nx: x - 1, ny: y }, { nx: x + 1, ny: y }
            ]

            for (const { nx, ny } of neighbors) {
                if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
                    const nIdx = ny * this.width + nx
                    if (this.terrain[nIdx] !== TERRAIN_TYPES.WALL && visited[nIdx] === 0) {
                        visited[nIdx] = 1
                        stack.push(nIdx)
                    }
                }
            }
        }

        const totalWalkable = this.terrain.reduce((sum, t) => sum + (t !== TERRAIN_TYPES.WALL ? 1 : 0), 0)

        // 如果连通区域数量不等于总可行走数量，说明有孤岛
        // 这里我们可以简单地只保留最大的连通区域，把其他的填回墙壁
        if (connectedCount < totalWalkable) {
            // 实际上Digger算法很难产生孤岛，除非初始化了多个不相连的区域。
            // 我们的实现从中心扩散，理论上都是连通的。
            // 但为了健壮性，这里如果发现不连通，返回false（让外层重试）或者执行修补。
            // 考虑到我们可能有多个不连通区域，这里简单返回false重试
            return false
        }

        return true
    }

    _findSpawnPoint() {
        // 寻找中心点附近的可行走区域
        const cx = Math.floor(this.width / 2)
        const cy = Math.floor(this.height / 2)

        // 螺旋搜索
        let x = cx, y = cy
        let dx = 0, dy = -1

        for (let i = 0; i < Math.max(this.width, this.height) ** 2; i++) {
            if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
                if (this.terrain[y * this.width + x] === TERRAIN_TYPES.GROUND) {
                    return { x, y }
                }
            }
            if (x === cx && y === cy && i > 0) break // 回到起点

            if (Math.abs(x - cx) === Math.abs(y - cy) || (x - cx > 0 && x - cx === -(y - cy)) || (x - cx <= 0 && x - cx === y - cy)) {
                // 转向
                [dx, dy] = [-dy, dx]
            }
            x += dx
            y += dy
        }

        // 兜底
        return { x: 10, y: 10 }
    }

    _findExitPoints() {
        const exits = []
        // 扫描边缘
        // 上下边
        for (let x = 0; x < this.width; x++) {
            this._checkEdgeExit(x, 1, exits)
            this._checkEdgeExit(x, this.height - 2, exits)
        }
        // 左右边
        for (let y = 0; y < this.height; y++) {
            this._checkEdgeExit(1, y, exits)
            this._checkEdgeExit(this.width - 2, y, exits)
        }
        return exits
    }

    _checkEdgeExit(x, y, exits) {
        // 检查该点是否是墙，且相邻有路，打通它作为出口
        // 或者该点本身就是路（虽然我们在生成时留了margin）

        // 我们改为：找到边缘附近的墙，如果有相邻的路，就打通
        if (this.terrain[y * this.width + x] !== TERRAIN_TYPES.WALL) {
            // 已经是路，可以作为出口
            // 移动到最边缘
            if (y === 1) exits.push({ x, y: 0 })
            else if (y === this.height - 2) exits.push({ x, y: this.height - 1 })
            else if (x === 1) exits.push({ x: 0, y })
            else if (x === this.width - 2) exits.push({ x: this.width - 1, y })
        }
    }

    _forceCreateExit() {
        // 如果自然生成的没有延伸到边缘，强制挖一条路到边缘
        // 简单策略：从中心向左挖直到边缘
        const cy = Math.floor(this.height / 2)
        for (let x = Math.floor(this.width / 2); x >= 0; x--) {
            this.terrain[cy * this.width + x] = TERRAIN_TYPES.GROUND
        }
        return { x: 0, y: cy }
    }

    _decorateMap() {
        for (let i = 0; i < this.terrain.length; i++) {
            if (this.terrain[i] === TERRAIN_TYPES.GROUND) {
                const rand = Math.random()
                if (rand < 0.05) {
                    this.terrain[i] = TERRAIN_TYPES.OBSTACLE
                } else if (rand < 0.15) {
                    this.terrain[i] = TERRAIN_TYPES.GRASS
                }
            }
        }

        // 清理出生点周围的障碍物
        const spawn = this._findSpawnPoint() // 重新获取可能被覆盖的出生点
        // 确保出生点是地面
        this.terrain[spawn.y * this.width + spawn.x] = TERRAIN_TYPES.GROUND
    }
}
