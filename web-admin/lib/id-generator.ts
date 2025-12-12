/**
 * P4: 统一的 ID 生成器
 * 使用 UUID v4 确保全局唯一性
 */
import { randomUUID } from 'crypto'

// ID 前缀类型定义
type IdPrefix =
  | 'sp'   // study_plans
  | 'pc'   // plan_classes
  | 'dt'   // daily_tasks
  | 'wm'   // word_masteries
  | 'sr'   // study_records
  | 'tr'   // test_records
  | 'pt'   // proficiency_tests
  | 'qa'   // question_answers
  | 'wq'   // wrong_questions
  | 'ph'   // point_history
  | 'sa'   // student_achievements
  | 'ss'   // study_streaks

/**
 * 生成带前缀的唯一 ID
 * @param prefix ID 前缀
 * @returns 格式: {prefix}_{uuid}
 * @example generateId('sp') => 'sp_550e8400-e29b-41d4-a716-446655440000'
 */
export function generateId(prefix: IdPrefix): string {
  return `${prefix}_${randomUUID()}`
}

/**
 * 批量生成 ID
 * @param prefix ID 前缀
 * @param count 数量
 * @returns ID 数组
 */
export function generateIds(prefix: IdPrefix, count: number): string[] {
  return Array.from({ length: count }, () => generateId(prefix))
}

/**
 * 从 ID 中提取前缀
 * @param id 完整 ID
 * @returns 前缀部分，或 null（如果格式不正确）
 */
export function extractPrefix(id: string): IdPrefix | null {
  const match = id.match(/^([a-z]+)_/)
  return match ? (match[1] as IdPrefix) : null
}

/**
 * 验证 ID 格式是否有效
 * @param id 要验证的 ID
 * @param expectedPrefix 期望的前缀（可选）
 * @returns 是否有效
 */
export function isValidId(id: string, expectedPrefix?: IdPrefix): boolean {
  const pattern = /^[a-z]+_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!pattern.test(id)) {
    return false
  }
  if (expectedPrefix) {
    return id.startsWith(`${expectedPrefix}_`)
  }
  return true
}
