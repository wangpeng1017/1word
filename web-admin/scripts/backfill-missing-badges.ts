/**
 * @file backfill-missing-badges.ts
 * @desc 为历史已解锁成就但未获得勋章的学生补发勋章
 *
 * 执行方式: DATABASE_URL="..." npx ts-node scripts/backfill-missing-badges.ts
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('开始补发历史遗漏勋章...\n')

  // 获取所有已解锁成就的学生
  const studentAchievements = await prisma.student_achievements.findMany({
    include: {
      achievement: true
    }
  })

  console.log(`找到 ${studentAchievements.length} 条学生成就记录\n`)

  let granted = 0
  let skipped = 0

  for (const sa of studentAchievements) {
    const { studentId, achievementId } = sa

    // 查找关联的勋章
    const badge = await prisma.badges.findFirst({
      where: { achievementId }
    })

    if (!badge) {
      console.log(`⚠️ 成就 ${sa.achievement.name} 无关联勋章`)
      skipped++
      continue
    }

    // 检查学生是否已拥有该勋章
    const existing = await prisma.student_badges.findUnique({
      where: {
        studentId_badgeId: {
          studentId,
          badgeId: badge.id
        }
      }
    })

    if (existing) {
      skipped++
      continue
    }

    // 补发勋章
    const studentBadgeId = `sb_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    await prisma.student_badges.create({
      data: {
        id: studentBadgeId,
        studentId,
        badgeId: badge.id
      }
    })

    console.log(`✅ 补发: ${badge.name} -> 学生 ${studentId}`)
    granted++
  }

  console.log(`\n完成! 补发: ${granted}, 跳过: ${skipped}`)

  // 输出统计信息
  const totalBadgesGranted = await prisma.student_badges.count()
  console.log(`当前系统总勋章发放数: ${totalBadgesGranted}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
