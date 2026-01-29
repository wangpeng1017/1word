/**
 * MySQL 数据导入脚本
 * 导入数据到新东方 RDS MySQL
 *
 * 使用方式：
 * 1. 将 xdf-migration-data.json 上传到 ~/apps/1word/web-admin/
 * 2. cd ~/apps/1word/web-admin
 * 3. node scripts/xdf-migration/import-data.js
 */

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')

const prisma = new PrismaClient()

// 数据文件路径
const DATA_FILE = './xdf-migration-data.json'

// 批量插入大小
const BATCH_SIZE = 100

// 日期字段转换（JSON 导入时日期是字符串）
function convertDates(obj, dateFields) {
  const result = { ...obj }
  for (const field of dateFields) {
    if (result[field]) {
      result[field] = new Date(result[field])
    }
  }
  return result
}

// 通用导入函数
async function importTable(tableName, data, importFn) {
  if (!data || data.length === 0) {
    console.log(`  ⏭️  ${tableName}: 无数据，跳过`)
    return 0
  }

  let imported = 0
  let skipped = 0
  let errors = 0

  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const batch = data.slice(i, i + BATCH_SIZE)

    for (const item of batch) {
      try {
        await importFn(item)
        imported++
      } catch (error) {
        // 忽略重复键错误
        if (error.code === 'P2002') {
          skipped++
          continue
        }
        errors++
        if (errors <= 3) {
          console.log(`\n    ⚠️  错误: ${error.message.slice(0, 80)}`)
        }
      }
    }

    // 进度显示
    const progress = Math.min(i + BATCH_SIZE, data.length)
    process.stdout.write(`\r  📥 ${tableName.padEnd(28)} ${progress}/${data.length}`)
  }

  const status = errors > 0 ? '⚠️' : '✅'
  console.log(`\r  ${status} ${tableName.padEnd(28)} ${imported} 导入, ${skipped} 跳过${errors > 0 ? `, ${errors} 错误` : ''}`)
  return imported
}

async function main() {
  console.log('═══════════════════════════════════════════════════════')
  console.log('  MySQL → MySQL 数据导入工具')
  console.log('  目标: 新东方 RDS MySQL')
  console.log('═══════════════════════════════════════════════════════\n')

  // 检查数据文件
  if (!fs.existsSync(DATA_FILE)) {
    console.error(`❌ 数据文件不存在: ${DATA_FILE}`)
    console.log('\n请先将导出的数据文件上传到当前目录')
    process.exit(1)
  }

  // 读取数据
  console.log(`📂 读取数据文件: ${DATA_FILE}`)
  const exportData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
  console.log(`   导出时间: ${exportData.exportedAt}`)
  console.log(`   源服务器: ${exportData.sourceServer}\n`)

  const tables = exportData.tables
  let totalImported = 0

  // ========== 第一层：无依赖的基础表 ==========
  console.log('─── 第一层：基础表 ───')

  totalImported += await importTable('users', tables.users, async (item) => {
    const data = convertDates(item, ['created_at', 'updated_at'])
    await prisma.user.upsert({
      where: { id: data.id },
      create: data,
      update: data
    })
  })

  totalImported += await importTable('vocabularies', tables.vocabularies, async (item) => {
    const data = convertDates(item, ['created_at', 'updated_at'])
    await prisma.vocabularies.upsert({
      where: { id: data.id },
      create: data,
      update: data
    })
  })

  totalImported += await importTable('vocabulary_packs', tables.vocabulary_packs, async (item) => {
    const data = convertDates(item, ['createdAt', 'updatedAt'])
    await prisma.vocabulary_packs.upsert({
      where: { id: data.id },
      create: data,
      update: data
    })
  })

  totalImported += await importTable('achievements', tables.achievements, async (item) => {
    const data = convertDates(item, ['createdAt', 'updatedAt'])
    await prisma.achievements.upsert({
      where: { id: data.id },
      create: data,
      update: data
    })
  })

  totalImported += await importTable('proficiency_tests', tables.proficiency_tests, async (item) => {
    const data = convertDates(item, ['createdAt', 'updatedAt'])
    await prisma.proficiency_tests.upsert({
      where: { id: data.id },
      create: data,
      update: data
    })
  })

  totalImported += await importTable('redeemable_achievements', tables.redeemable_achievements, async (item) => {
    const data = convertDates(item, ['createdAt', 'updatedAt'])
    await prisma.redeemable_achievements.upsert({
      where: { id: data.id },
      create: data,
      update: data
    })
  })

  totalImported += await importTable('system_configs', tables.system_configs, async (item) => {
    const data = convertDates(item, ['createdAt', 'updatedAt'])
    await prisma.system_configs.upsert({
      where: { id: data.id },
      create: data,
      update: data
    })
  })

  totalImported += await importTable('vocabulary_quiz_questions', tables.vocabulary_quiz_questions, async (item) => {
    const data = convertDates(item, ['createdAt', 'updatedAt'])
    await prisma.vocabulary_quiz_questions.upsert({
      where: { id: data.id },
      create: data,
      update: data
    })
  })

  // ========== 第二层 ==========
  console.log('\n─── 第二层 ───')

  totalImported += await importTable('teachers', tables.teachers, async (item) => {
    const data = convertDates(item, ['created_at', 'updated_at'])
    await prisma.teachers.upsert({
      where: { id: data.id },
      create: data,
      update: data
    })
  })

  totalImported += await importTable('vocabulary_pack_days', tables.vocabulary_pack_days, async (item) => {
    const data = convertDates(item, ['createdAt', 'updatedAt'])
    await prisma.vocabulary_pack_days.upsert({
      where: { id: data.id },
      create: data,
      update: data
    })
  })

  totalImported += await importTable('badges', tables.badges, async (item) => {
    const data = convertDates(item, ['createdAt', 'updatedAt'])
    await prisma.badges.upsert({
      where: { id: data.id },
      create: data,
      update: data
    })
  })

  totalImported += await importTable('questions', tables.questions, async (item) => {
    const data = convertDates(item, ['createdAt', 'updatedAt'])
    await prisma.questions.upsert({
      where: { id: data.id },
      create: data,
      update: data
    })
  })

  totalImported += await importTable('word_audios', tables.word_audios, async (item) => {
    const data = convertDates(item, ['createdAt'])
    await prisma.word_audios.upsert({
      where: { id: data.id },
      create: data,
      update: data
    })
  })

  totalImported += await importTable('word_images', tables.word_images, async (item) => {
    const data = convertDates(item, ['createdAt'])
    await prisma.word_images.upsert({
      where: { id: data.id },
      create: data,
      update: data
    })
  })

  totalImported += await importTable('word_meanings', tables.word_meanings, async (item) => {
    const data = convertDates(item, ['createdAt', 'updatedAt'])
    await prisma.word_meanings.upsert({
      where: { id: data.id },
      create: data,
      update: data
    })
  })

  // ========== 第三层 ==========
  console.log('\n─── 第三层 ───')

  totalImported += await importTable('classes', tables.classes, async (item) => {
    const data = convertDates(item, ['created_at', 'updated_at'])
    await prisma.classes.upsert({
      where: { id: data.id },
      create: data,
      update: data
    })
  })

  totalImported += await importTable('question_options', tables.question_options, async (item) => {
    const data = convertDates(item, ['createdAt'])
    await prisma.question_options.upsert({
      where: { id: data.id },
      create: data,
      update: data
    })
  })

  totalImported += await importTable('vocabulary_pack_day_words', tables.vocabulary_pack_day_words, async (item) => {
    await prisma.vocabulary_pack_day_words.upsert({
      where: { id: item.id },
      create: item,
      update: item
    })
  })

  // ========== 第四层 ==========
  console.log('\n─── 第四层：学生相关 ───')

  totalImported += await importTable('students', tables.students, async (item) => {
    const data = convertDates(item, ['created_at', 'updated_at'])
    await prisma.students.upsert({
      where: { id: data.id },
      create: data,
      update: data
    })
  })

  totalImported += await importTable('plan_classes', tables.plan_classes, async (item) => {
    const data = convertDates(item, ['start_date', 'created_at', 'updated_at'])
    await prisma.plan_classes.upsert({
      where: { id: data.id },
      create: data,
      update: data
    })
  })

  // ========== 第五层 ==========
  console.log('\n─── 第五层：学习记录 ───')

  totalImported += await importTable('study_plans', tables.study_plans, async (item) => {
    const data = convertDates(item, ['lastReviewAt', 'nextReviewAt', 'createdAt', 'updatedAt'])
    await prisma.study_plans.upsert({
      where: { id: data.id },
      create: data,
      update: data
    })
  })

  totalImported += await importTable('daily_tasks', tables.daily_tasks, async (item) => {
    const data = convertDates(item, ['taskDate', 'startedAt', 'completedAt', 'createdAt', 'updatedAt'])
    await prisma.daily_tasks.upsert({
      where: { id: data.id },
      create: data,
      update: data
    })
  })

  totalImported += await importTable('study_records', tables.study_records, async (item) => {
    const data = convertDates(item, ['taskDate', 'startedAt', 'completedAt', 'lastActiveAt', 'createdAt', 'updatedAt'])
    await prisma.study_records.upsert({
      where: { id: data.id },
      create: data,
      update: data
    })
  })

  totalImported += await importTable('word_masteries', tables.word_masteries, async (item) => {
    const data = convertDates(item, ['lastPracticeAt', 'createdAt', 'updatedAt'])
    await prisma.word_masteries.upsert({
      where: { id: data.id },
      create: data,
      update: data
    })
  })

  totalImported += await importTable('wrong_questions', tables.wrong_questions, async (item) => {
    const data = convertDates(item, ['wrongAt', 'lastReviewAt'])
    await prisma.wrong_questions.upsert({
      where: { id: data.id },
      create: data,
      update: data
    })
  })

  totalImported += await importTable('student_points', tables.student_points, async (item) => {
    const data = convertDates(item, ['createdAt', 'updatedAt'])
    await prisma.student_points.upsert({
      where: { id: data.id },
      create: data,
      update: data
    })
  })

  totalImported += await importTable('point_history', tables.point_history, async (item) => {
    const data = convertDates(item, ['createdAt'])
    await prisma.point_history.upsert({
      where: { id: data.id },
      create: data,
      update: data
    })
  })

  totalImported += await importTable('study_streaks', tables.study_streaks, async (item) => {
    const data = convertDates(item, ['lastStudyDate', 'createdAt', 'updatedAt'])
    await prisma.study_streaks.upsert({
      where: { id: data.id },
      create: data,
      update: data
    })
  })

  totalImported += await importTable('student_achievements', tables.student_achievements, async (item) => {
    const data = convertDates(item, ['unlockedAt'])
    await prisma.student_achievements.upsert({
      where: { id: data.id },
      create: data,
      update: data
    })
  })

  totalImported += await importTable('student_badges', tables.student_badges, async (item) => {
    const data = convertDates(item, ['unlockedAt'])
    await prisma.student_badges.upsert({
      where: { id: data.id },
      create: data,
      update: data
    })
  })

  totalImported += await importTable('question_answers', tables.question_answers, async (item) => {
    const data = convertDates(item, ['answeredAt'])
    await prisma.question_answers.upsert({
      where: { id: data.id },
      create: data,
      update: data
    })
  })

  totalImported += await importTable('test_records', tables.test_records, async (item) => {
    const data = convertDates(item, ['startedAt', 'completedAt', 'createdAt', 'updatedAt'])
    await prisma.test_records.upsert({
      where: { id: data.id },
      create: data,
      update: data
    })
  })

  totalImported += await importTable('achievement_redemptions', tables.achievement_redemptions, async (item) => {
    const data = convertDates(item, ['redeemedAt'])
    await prisma.achievement_redemptions.upsert({
      where: { id: data.id },
      create: data,
      update: data
    })
  })

  totalImported += await importTable('operation_logs', tables.operation_logs, async (item) => {
    const data = convertDates(item, ['createdAt'])
    await prisma.operation_logs.upsert({
      where: { id: data.id },
      create: data,
      update: data
    })
  })

  totalImported += await importTable('vocabulary_quiz_records', tables.vocabulary_quiz_records, async (item) => {
    const data = convertDates(item, ['startedAt', 'completedAt', 'createdAt'])
    await prisma.vocabulary_quiz_records.upsert({
      where: { id: data.id },
      create: data,
      update: data
    })
  })

  // ========== 第六层 ==========
  console.log('\n─── 第六层 ───')

  totalImported += await importTable('vocabulary_quiz_answers', tables.vocabulary_quiz_answers, async (item) => {
    await prisma.vocabulary_quiz_answers.upsert({
      where: { id: item.id },
      create: item,
      update: item
    })
  })

  // 完成
  console.log('\n═══════════════════════════════════════════════════════')
  console.log(`✅ 数据导入完成！`)
  console.log(`   总导入记录数: ${totalImported}`)
  console.log('═══════════════════════════════════════════════════════')
  console.log('\n📋 下一步操作:')
  console.log('  1. 验证数据: node scripts/xdf-migration/verify-data.js')
  console.log('  2. 重新构建: npm run build')
  console.log('  3. 重启应用: pm2 restart word-app')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
