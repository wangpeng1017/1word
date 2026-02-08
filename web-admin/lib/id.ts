/**
 * @file 安全 ID 生成器
 * @desc 替代 Date.now() + Math.random() 的弱 ID 方案
 *       使用 crypto.randomUUID() 确保并发安全
 */

import { randomUUID } from 'crypto'

/**
 * 生成唯一 ID
 * @param prefix - ID 前缀 (如 'qa', 'sr', 'wm')
 * @returns 格式: {prefix}_{uuid}  (如 qa_a1b2c3d4-e5f6-...)
 */
export function generateId(prefix: string): string {
    return `${prefix}_${randomUUID()}`
}

/**
 * 批量生成唯一 ID
 * @param prefix - ID 前缀
 * @param count - 数量
 */
export function generateIds(prefix: string, count: number): string[] {
    return Array.from({ length: count }, () => generateId(prefix))
}
