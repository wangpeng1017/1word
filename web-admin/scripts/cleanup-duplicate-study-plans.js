/**
 * 清理重复的 study_plans 记录
 * 保留每个 studentId + vocabularyId 组合中 reviewCount 最大的记录
 *
 * 使用方法: node scripts/cleanup-duplicate-study-plans.js
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('开始清理重复的 study_plans 记录...')

  // 1. 查找所有重复的 studentId + vocabularyId 组合
  const duplicates = await prisma.$queryRaw`
    SELECT "studentId", "vocabularyId", COUNT(*) as count
    FROM study_plans
    GROUP BY "studentId", "vocabularyId"
    HAVING COUNT(*) > 1
  `

  console.log(`发现 ${duplicates.length} 组重复记录`)

  if (duplicates.length === 0) {
    console.log('没有重复记录需要清理')
    return
  }

  let deletedCount = 0

  for (const dup of duplicates) {
    // 2. 获取该组合的所有记录，按 reviewCount 降序排列
    const records = await prisma.study_plans.findMany({
      where: {
        studentId: dup.studentId,
        vocabularyId: dup.vocabularyId,
      },
      orderBy: { reviewCount: 'desc' },
    })

    // 3. 保留第一条（reviewCount 最大），删除其余
    const toDelete = records.slice(1).map(r => r.id)

    if (toDelete.length > 0) {
      await prisma.study_plans.deleteMany({
        where: { id: { in: toDelete } },
      })
      deletedCount += toDelete.length
      console.log(`清理 ${dup.studentId} + ${dup.vocabularyId}: 删除 ${toDelete.length} 条`)
    }
  }

  console.log(`清理完成，共删除 ${deletedCount} 条重复记录`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
