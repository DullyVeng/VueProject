// 丹田拼图系统工具函数
// 处理法宝形状旋转、碰撞检测等核心算法

/**
 * 旋转法宝形状
 * @param {Array<Array<number>>} shape - 原始形状二维数组
 * @param {number} rotation - 旋转角度 (0/90/180/270)
 * @returns {Array<Array<number>>} 旋转后的形状
 */
export function rotateFabaoShape(shape, rotation) {
    if (!shape || shape.length === 0) return shape

    const degrees = rotation % 360

    // 0度不需要旋转
    if (degrees === 0) return shape

    let rotated = shape
    const times = degrees / 90

    // 每次旋转90度
    for (let i = 0; i < times; i++) {
        rotated = rotate90(rotated)
    }

    return rotated
}

/**
 * 将形状顺时针旋转90度
 * @param {Array<Array<number>>} shape 
 * @returns {Array<Array<number>>}
 */
function rotate90(shape) {
    const rows = shape.length
    const cols = shape[0].length

    // 新矩阵的行数 = 原矩阵的列数
    // 新矩阵的列数 = 原矩阵的行数
    const rotated = Array(cols).fill(0).map(() => Array(rows).fill(0))

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            // 顺时针旋转90度的映射关系：
            // 原坐标 (r, c) -> 新坐标 (c, rows - 1 - r)
            rotated[c][rows - 1 - r] = shape[r][c]
        }
    }

    return rotated
}

/**
 * 检查法宝是否可以放置在指定位置
 * @param {Object} dantian - 丹田信息 { width, height, occupiedSlots }
 * @param {Array<Array<number>>} shape - 法宝形状
 * @param {Object} position - 位置 { x, y }
 * @param {number} rotation - 旋转角度
 * @returns {boolean} 是否可以放置
 */
export function canPlaceFabao(dantian, shape, position, rotation = 0) {
    console.log(`[canPlaceFabao] 开始检测`)
    console.log(`  - 位置: (${position.x}, ${position.y})`)
    console.log(`  - 旋转: ${rotation}°`)
    console.log(`  - 丹田大小: ${dantian.width}x${dantian.height}`)
    console.log(`  - 已占用格子数: ${dantian.occupiedSlots?.length || 0}`)

    // 旋转形状
    const rotatedShape = rotateFabaoShape(shape, rotation)
    console.log(`  - 旋转后形状:`, JSON.stringify(rotatedShape))

    const shapeHeight = rotatedShape.length
    const shapeWidth = rotatedShape[0].length
    console.log(`  - 形状尺寸: ${shapeWidth}x${shapeHeight}`)

    // 检查边界
    if (position.x < 0 || position.y < 0) {
        console.log(`  - ✗ 超出边界（负坐标）`)
        return false
    }
    if (position.x + shapeWidth > dantian.width) {
        console.log(`  - ✗ 超出右边界: ${position.x} + ${shapeWidth} > ${dantian.width}`)
        return false
    }
    if (position.y + shapeHeight > dantian.height) {
        console.log(`  - ✗ 超出下边界: ${position.y} + ${shapeHeight} > ${dantian.height}`)
        return false
    }

    console.log(`  - ✓ 边界检查通过`)
    console.log(`  - 开始碰撞检测...`)

    // 检查每个非空格子是否重叠
    for (let row = 0; row < shapeHeight; row++) {
        for (let col = 0; col < shapeWidth; col++) {
            if (rotatedShape[row][col] === 1) {
                const absX = position.x + col
                const absY = position.y + row

                // 检查这个位置是否已被占用
                if (isSlotOccupied(dantian.occupiedSlots, absX, absY)) {
                    console.log(`  - ✗ 格子(${absX}, ${absY})已被占用`)
                    return false
                }
            }
        }
    }

    console.log(`  - ✓ 碰撞检测通过，可以放置`)
    return true
}

/**
 * 检查某个格子是否已被占用
 * @param {Array<{x,y}>} occupiedSlots - 已占用的格子列表
 * @param {number} x 
 * @param {number} y 
 * @returns {boolean}
 */
function isSlotOccupied(occupiedSlots, x, y) {
    if (!occupiedSlots) return false
    return occupiedSlots.some(slot => slot.x === x && slot.y === y)
}

/**
 * 获取法宝占用的所有格子坐标
 * @param {Array<Array<number>>} shape - 法宝形状
 * @param {Object} position - 位置 { x, y }
 * @param {number} rotation - 旋转角度
 * @returns {Array<{x,y}>} 占用的格子坐标列表
 */
export function getFabaoOccupiedSlots(shape, position, rotation = 0) {
    const rotatedShape = rotateFabaoShape(shape, rotation)
    const slots = []

    for (let row = 0; row < rotatedShape.length; row++) {
        for (let col = 0; col < rotatedShape[row].length; col++) {
            if (rotatedShape[row][col] === 1) {
                slots.push({
                    x: position.x + col,
                    y: position.y + row
                })
            }
        }
    }

    return slots
}

/**
 * 计算形状占用的格子数量
 * @param {Array<Array<number>>} shape 
 * @returns {number}
 */
export function countGrids(shape) {
    if (!shape || shape.length === 0) return 0

    let count = 0
    for (const row of shape) {
        for (const cell of row) {
            if (cell === 1) count++
        }
    }
    return count
}

/**
 * 获取形状的边界框尺寸
 * @param {Array<Array<number>>} shape 
 * @returns {{width: number, height: number}}
 */
export function getShapeBounds(shape) {
    if (!shape || shape.length === 0) {
        return { width: 0, height: 0 }
    }

    return {
        width: shape[0].length,
        height: shape.length
    }
}

/**
 * 移除形状最外层的一个格子（用于强化）
 * @param {Array<Array<number>>} shape 
 * @returns {Array<Array<number>>} 新的形状
 */
export function removeOuterGrid(shape) {
    // 找到所有外层格子（至少有一边没有相邻格子）
    const outerCells = []

    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c] === 1) {
                // 检查四个方向
                const hasTop = r > 0 && shape[r - 1][c] === 1
                const hasBottom = r < shape.length - 1 && shape[r + 1][c] === 1
                const hasLeft = c > 0 && shape[r][c - 1] === 1
                const hasRight = c < shape[r].length - 1 && shape[r][c + 1] === 1

                // 如果至少有一边没有相邻格子，就是外层格子
                if (!hasTop || !hasBottom || !hasLeft || !hasRight) {
                    outerCells.push({ r, c })
                }
            }
        }
    }

    // 随机选择一个外层格子移除
    if (outerCells.length === 0) return shape

    const randomIndex = Math.floor(Math.random() * outerCells.length)
    const { r, c } = outerCells[randomIndex]

    // 创建新形状
    const newShape = shape.map(row => [...row])
    newShape[r][c] = 0

    // 清理空行和空列
    return trimShape(newShape)
}

/**
 * 清理形状中的空行和空列
 * @param {Array<Array<number>>} shape 
 * @returns {Array<Array<number>>}
 */
function trimShape(shape) {
    // 移除空行
    let trimmed = shape.filter(row => row.some(cell => cell === 1))

    if (trimmed.length === 0) return [[1]] // 至少保留一个格子

    // 找到最左和最右的非空列
    let minCol = Infinity
    let maxCol = -Infinity

    for (const row of trimmed) {
        for (let c = 0; c < row.length; c++) {
            if (row[c] === 1) {
                minCol = Math.min(minCol, c)
                maxCol = Math.max(maxCol, c)
            }
        }
    }

    // 裁剪列
    trimmed = trimmed.map(row => row.slice(minCol, maxCol + 1))

    return trimmed
}

/**
 * 自动对齐法宝到网格（吸附效果）
 * @param {number} pixelX - 鼠标X坐标（像素）
 * @param {number} pixelY - 鼠标Y坐标（像素）
 * @param {number} gridSize - 每个格子的像素大小
 * @returns {{x: number, y: number}} 对齐后的网格坐标
 */
export function snapToGrid(pixelX, pixelY, gridSize) {
    return {
        x: Math.floor(pixelX / gridSize),
        y: Math.floor(pixelY / gridSize)
    }
}

/**
 * 计算丹田的总容量和已使用容量
 * @param {Object} dantian 
 * @returns {{total: number, used: number, available: number}}
 */
export function calculateDantianUsage(dantian) {
    const total = dantian.width * dantian.height
    const used = dantian.occupiedSlots ? dantian.occupiedSlots.length : 0

    return {
        total,
        used,
        available: total - used
    }
}

/**
 * 验证形状数据的有效性
 * @param {Array<Array<number>>} shape 
 * @returns {boolean}
 */
export function isValidShape(shape) {
    if (!Array.isArray(shape) || shape.length === 0) return false

    const firstRowLength = shape[0].length

    // 检查所有行长度一致
    for (const row of shape) {
        if (!Array.isArray(row) || row.length !== firstRowLength) return false

        // 检查只包含0或1
        for (const cell of row) {
            if (cell !== 0 && cell !== 1) return false
        }
    }

    // 至少有一个格子是1
    return shape.some(row => row.some(cell => cell === 1))
}
