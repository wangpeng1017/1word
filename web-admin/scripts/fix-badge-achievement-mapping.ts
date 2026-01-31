/**
 * @file fix-badge-achievement-mapping.ts
 * @desc 修复 badges 表中的 achievementId 关联
 *
 * 执行方式: npx ts-node scripts/fix-badge-achievement-mapping.ts
 */

import { prisma } from '../lib/prisma'

// Badge 和 Achievement 的映射关系
const BADGE_ACHIEVEMENT_MAP: Record<string, string> = {
  // 学习类成就
  'badge_bronze_newbie': 'ach_study_01',      // 铜牌新手 -> 初次学习
  'badge_silver_apprentice': 'ach_study_02',  // 银牌学徒 -> 勤奋学员
  'badge_gold_scholar': 'ach_study_03',       // 金牌学者 -> 学习达人

  // 连续学习类成就
  'badge_streak_star': 'ach_streak_01',       // 连续之星 -> 坚持一周
  'badge_lightning_master': 'ach_streak_02',  // 闪电学霸 -> 半月挑战
  'badge_perfectionist': 'ach_streak_03',     // 完美主义者 -> 月度达人

  // 掌握类成就
  'badge_precision_shooter': 'ach_mastery_01', // 精准射手 -> 初窥门径
  'badge_wrong_killer': 'ach_mastery_02',      // 错题克星 -> 渐入佳境
  'badge_ultimate_master': 'ach_mastery_03',   // 终极大师 -> 融会贯通

  // 积分富豪暂无对应成就
  // 'badge_points_tycoon': null,
}

async function main() {
  console.log('开始修复 Badge-Achievement 映射关系...\n')

  let updated = 0
  let skipped = 0

  for (const [badgeId, achievementId] of Object.entries(BADGE_ACHIEVEMENT_MAP)) {
    try {
      // 检查 badge 是否存在
      const badge = await prisma.badges.findUnique({
        where: { id: badgeId }
      })

      if (!badge) {
        console.log(`⚠️ Badge 不存在: ${badgeId}`)
        skipped++
        continue
      }

      // 检查 achievement 是否存在
      const achievement = await prisma.achievements.findUnique({
        where: { id: achievementId }
      })

      if (!achievement) {
        console.log(`⚠️ Achievement 不存在: ${achievementId}`)
        skipped++
        continue
      }

      // 更新关联
      await prisma.badges.update({
        where: { id: badgeId },
        data: { achievementId }
      })

      console.log(`✅ ${badge.name} -> ${achievement.name}`)
      updated++
    } catch (error) {
      console.error(`❌ 更新失败 ${badgeId}:`, error)
    }
  }

  console.log(`\n完成! 更新: ${updated}, 跳过: ${skipped}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
