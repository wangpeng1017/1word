/**
 * MySQL 数据导出脚本
 * 从阿里云服务器 MySQL 导出数据到新东方 RDS
 *
 * 使用方式：
 * 1. 在阿里云服务器执行: cd /root/word-app/web-admin
 * 2. 执行: node scripts/xdf-migration/export-data.js
 * 3. 导出文件: /tmp/xdf-migration-data.json
 */

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')

const prisma = new PrismaClient()

// 导出文件路径
const EXPORT_FILE = '/tmp/xdf-migration-data.json'

// 表导出配置（按外键依赖关系排序）
const TABLES_CONFIG = [
  // ========== 第一层：无依赖的基础表 ==========
  { name: 'users', fn: () => prisma.user.findMany() },
  { name: 'vocabularies', fn: () => prisma.vocabularies.findMany() },
  { name: 'vocabulary_packs', fn: () => prisma.vocabulary_packs.findMany() },
  { name: 'achievements', fn: () => prisma.achievements.findMany() },
  { name: 'proficiency_tests', fn: () => prisma.proficiency_tests.findMany() },
  { name: 'redeemable_achievements', fn: () => prisma.redeemable_achievements.findMany() },
  { name: 'system_configs', fn: () => prisma.system_configs.findMany() },
  { name: 'vocabulary_quiz_questions', fn: () => prisma.vocabulary_quiz_questions.findMany() },

  // ========== 第二层：依赖第一层 ==========
  { name: 'teachers', fn: () => prisma.teachers.findMany() },
  { name: 'vocabulary_pack_days', fn: () => prisma.vocabulary_pack_days.findMany() },
  { name: 'badges', fn: () => prisma.badges.findMany() },
  { name: 'questions', fn: () => prisma.questions.findMany() },
  { name: 'word_audios', fn: () => prisma.word_audios.findMany() },
  { name: 'word_images', fn: () => prisma.word_images.findMany() },
  { name: 'word_meanings', fn: () => prisma.word_meanings.findMany() },

  // ========== 第三层 ==========
  { name: 'classes', fn: () => prisma.classes.findMany() },
  { name: 'question_options', fn: () => prisma.question_options.findMany() },
  { name: 'vocabulary_pack_day_words', fn: () => prisma.vocabulary_pack_day_words.findMany() },

  // ========== 第四层 ==========
  { name: 'students', fn: () => prisma.students.findMany() },
  { name: 'plan_classes', fn: () => prisma.plan_classes.findMany() },

  // ========== 第五层：学习相关数据 ==========
  { name: 'study_plans', fn: () => prisma.study_plans.findMany() },
  { name: 'daily_tasks', fn: () => prisma.daily_tasks.findMany() },
  { name: 'study_records', fn: () => prisma.study_records.findMany() },
  { name: 'word_masteries', fn: () => prisma.word_masteries.findMany() },
  { name: 'wrong_questions', fn: () => prisma.wrong_questions.findMany() },
  { name: 'student_points', fn: () => prisma.student_points.findMany() },
  { name: 'point_history', fn: () => prisma.point_history.findMany() },
  { name: 'study_streaks', fn: () => prisma.study_streaks.findMany() },
  { name: 'student_achievements', fn: () => prisma.student_achievements.findMany() },
  { name: 'student_badges', fn: () => prisma.student_badges.findMany() },
  { name: 'question_answers', fn: () => prisma.question_answers.findMany() },
  { name: 'test_records', fn: () => prisma.test_records.findMany() },
  { name: 'achievement_redemptions', fn: () => prisma.achievement_redemptions.findMany() },
  { name: 'operation_logs', fn: () => prisma.operation_logs.findMany() },
  { name: 'vocabulary_quiz_records', fn: () => prisma.vocabulary_quiz_records.findMany() },

  // ========== 第六层 ==========
  { name: 'vocabulary_quiz_answers', fn: () => prisma.vocabulary_quiz_answers.findMany() },
]

async function main() {
  console.log('═══════════════════════════════════════════════════════')
  console.log('  MySQL → MySQL 数据导出工具')
  console.log('  源: 阿里云 MySQL (8.130.182.148)')
  console.log('  目标: 新东方 RDS MySQL')
  console.log('═══════════════════════════════════════════════════════\n')

  const exportData = {
    exportedAt: new Date().toISOString(),
    sourceDatabase: 'mysql',
    sourceServer: '8.130.182.148',
    targetServer: 'rm-2zel9bu41o5s0v0j8.mysql.rds.aliyuncs.com',
    tables: {}
  }

  let totalRecords = 0

  for (const table of TABLES_CONFIG) {
    process.stdout.write(`📦 导出 ${table.name.padEnd(30)}`)
    try {
      const data = await table.fn()
      exportData.tables[table.name] = data
      totalRecords += data.length
      console.log(`✅ ${data.length} 条`)
    } catch (error) {
      console.log(`❌ 失败: ${error.message.slice(0, 50)}`)
      exportData.tables[table.name] = []
    }
  }

  // 写入文件
  console.log(`\n💾 写入文件: ${EXPORT_FILE}`)
  fs.writeFileSync(EXPORT_FILE, JSON.stringify(exportData, null, 2))

  const fileSize = (fs.statSync(EXPORT_FILE).size / 1024 / 1024).toFixed(2)

  console.log('\n═══════════════════════════════════════════════════════')
  console.log(`✅ 导出完成！`)
  console.log(`   总记录数: ${totalRecords}`)
  console.log(`   文件大小: ${fileSize} MB`)
  console.log(`   文件路径: ${EXPORT_FILE}`)
  console.log('═══════════════════════════════════════════════════════')
  console.log('\n📋 下一步操作:')
  console.log('  1. 下载文件到本地:')
  console.log('     scp root@8.130.182.148:/tmp/xdf-migration-data.json ./')
  console.log('')
  console.log('  2. 上传到新东方服务器 (通过堡垒机):')
  console.log('     目标路径: ~/apps/1word/web-admin/')
  console.log('')
  console.log('  3. 在新东方服务器执行导入:')
  console.log('     node scripts/xdf-migration/import-data.js')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
