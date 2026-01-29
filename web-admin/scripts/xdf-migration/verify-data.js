/**
 * 数据迁移验证脚本
 * 检查新东方 MySQL 数据库中的数据是否正确
 *
 * 使用方式：
 * cd ~/apps/1word/web-admin
 * node scripts/xdf-migration/verify-data.js
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('═══════════════════════════════════════════════════════')
  console.log('  新东方数据迁移验证')
  console.log('═══════════════════════════════════════════════════════\n')

  const results = []

  // 检查各表数据量
  const tables = [
    { name: '用户 (users)', fn: () => prisma.user.count() },
    { name: '教师 (teachers)', fn: () => prisma.teachers.count() },
    { name: '班级 (classes)', fn: () => prisma.classes.count() },
    { name: '学生 (students)', fn: () => prisma.students.count() },
    { name: '词汇 (vocabularies)', fn: () => prisma.vocabularies.count() },
    { name: '题目 (questions)', fn: () => prisma.questions.count() },
    { name: '题目选项 (question_options)', fn: () => prisma.question_options.count() },
    { name: '词汇库 (vocabulary_packs)', fn: () => prisma.vocabulary_packs.count() },
    { name: '词汇库天数 (vocabulary_pack_days)', fn: () => prisma.vocabulary_pack_days.count() },
    { name: '每天词汇 (vocabulary_pack_day_words)', fn: () => prisma.vocabulary_pack_day_words.count() },
    { name: '班级计划 (plan_classes)', fn: () => prisma.plan_classes.count() },
    { name: '学习计划 (study_plans)', fn: () => prisma.study_plans.count() },
    { name: '学习记录 (study_records)', fn: () => prisma.study_records.count() },
    { name: '词汇掌握 (word_masteries)', fn: () => prisma.word_masteries.count() },
    { name: '错题记录 (wrong_questions)', fn: () => prisma.wrong_questions.count() },
    { name: '成就定义 (achievements)', fn: () => prisma.achievements.count() },
    { name: '勋章定义 (badges)', fn: () => prisma.badges.count() },
    { name: '学生积分 (student_points)', fn: () => prisma.student_points.count() },
  ]

  console.log('📊 数据表统计:\n')
  console.log('┌─────────────────────────────────────────┬──────────┐')
  console.log('│ 表名                                     │ 记录数   │')
  console.log('├─────────────────────────────────────────┼──────────┤')

  let totalRecords = 0
  for (const table of tables) {
    try {
      const count = await table.fn()
      totalRecords += count
      const status = count > 0 ? '✅' : '⚠️'
      console.log(`│ ${status} ${table.name.padEnd(36)} │ ${String(count).padStart(8)} │`)
      results.push({ name: table.name, count, ok: count > 0 })
    } catch (error) {
      console.log(`│ ❌ ${table.name.padEnd(36)} │ 错误     │`)
      results.push({ name: table.name, count: 0, ok: false, error: error.message })
    }
  }

  console.log('├─────────────────────────────────────────┼──────────┤')
  console.log(`│ 📈 总计                                  │ ${String(totalRecords).padStart(8)} │`)
  console.log('└─────────��───────────────────────────────┴──────────┘')

  // 关键数据检查
  console.log('\n📋 关键数据检查:\n')

  // 检查教师账号
  const teachers = await prisma.teachers.findMany({
    include: { user: true }
  })
  console.log(`👨‍🏫 教师账号 (${teachers.length} 个):`)
  for (const t of teachers.slice(0, 5)) {
    console.log(`   - ${t.user.name} (${t.user.email || t.user.phone})`)
  }
  if (teachers.length > 5) console.log(`   ... 还有 ${teachers.length - 5} 个`)

  // 检查班级
  const classes = await prisma.classes.findMany({
    include: { _count: { select: { students: true } } }
  })
  console.log(`\n🏫 班级 (${classes.length} 个):`)
  for (const c of classes.slice(0, 5)) {
    console.log(`   - ${c.name} (${c._count.students} 名学生)`)
  }
  if (classes.length > 5) console.log(`   ... 还有 ${classes.length - 5} 个`)

  // 检查词汇库
  const packs = await prisma.vocabulary_packs.findMany({
    include: { _count: { select: { pack_days: true } } }
  })
  console.log(`\n📚 词汇库 (${packs.length} 个):`)
  for (const p of packs) {
    console.log(`   - ${p.name} (${p.totalDays} 天, ${p.totalWords} 词)`)
  }

  // 检查示例词汇
  const sampleWords = await prisma.vocabularies.findMany({ take: 5 })
  console.log(`\n📝 示例词汇:`)
  for (const w of sampleWords) {
    console.log(`   - ${w.word}: ${w.primary_meaning}`)
  }

  // 总结
  const okCount = results.filter(r => r.ok).length
  const failCount = results.filter(r => !r.ok).length

  console.log('\n═══════════════════════════════════════════════════════')
  if (failCount === 0) {
    console.log('✅ 验证通过！所有核心数据表都有数据。')
  } else {
    console.log(`⚠️  验证完成，${failCount} 个表无数据或出错：`)
    for (const r of results.filter(r => !r.ok)) {
      console.log(`   - ${r.name}${r.error ? `: ${r.error}` : ''}`)
    }
  }
  console.log('═══════════════════════════════════════════════════════')
  console.log('\n📋 下一步:')
  console.log('  1. 重新构建: npm run build')
  console.log('  2. 重启应用: pm2 restart word-app')
  console.log('  3. 测试访问: https://ienglish.xdf.cn')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
