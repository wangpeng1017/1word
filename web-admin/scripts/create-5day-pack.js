/**
 * 创建5天词汇库脚本
 * 将现有的50个词汇分配到5天，每天10个词汇
 *
 * 使用方法：
 * 1. 确保已设置 DATABASE_URL 环境变量
 * 2. 运行: node scripts/create-5day-pack.js
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('开始创建5天词汇库...')

  // 1. 获取现有词汇（取前50个）
  const vocabularies = await prisma.vocabularies.findMany({
    take: 50,
    orderBy: { created_at: 'asc' },
    select: { id: true, word: true, primary_meaning: true }
  })

  if (vocabularies.length === 0) {
    console.log('❌ 没有找到词汇数据，请先导入词汇')
    return
  }

  console.log(`找到 ${vocabularies.length} 个词汇`)

  // 2. 检查是否已存在同名词汇库
  const existingPack = await prisma.vocabulary_packs.findUnique({
    where: { name: '高考核心词汇5天班' }
  })

  if (existingPack) {
    console.log('⚠️ 词汇库"高考核心词汇5天班"已存在，跳过创建')
    console.log('如需重新创建，请先删除现有词汇库')
    return
  }

  // 3. 获取一个教师ID（用于创建者）
  const teacher = await prisma.teachers.findFirst({
    select: { id: true }
  })

  if (!teacher) {
    console.log('❌ 没有找到教师账号，请先创建教师账号')
    return
  }

  // 4. 创建词汇库
  const packId = `vp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const totalDays = 5
  const wordsPerDay = Math.ceil(vocabularies.length / totalDays)

  const pack = await prisma.$transaction(async (tx) => {
    // 创建词汇库
    const newPack = await tx.vocabulary_packs.create({
      data: {
        id: packId,
        name: '高考核心词汇5天班',
        description: '包含50个高考核心词汇，每天学习10个单词，5天完成全部学习',
        totalDays: totalDays,
        totalWords: vocabularies.length,
        createdBy: teacher.id,
        isActive: true,
      }
    })

    console.log(`✅ 创建词汇库: ${newPack.name}`)

    // 创建每日配置
    for (let day = 1; day <= totalDays; day++) {
      const dayId = `vpd_${Date.now()}_${day}_${Math.random().toString(36).substr(2, 9)}`
      const startIndex = (day - 1) * wordsPerDay
      const endIndex = Math.min(day * wordsPerDay, vocabularies.length)
      const dayVocabularies = vocabularies.slice(startIndex, endIndex)

      // 创建每日配置
      await tx.vocabulary_pack_days.create({
        data: {
          id: dayId,
          packId: packId,
          dayNumber: day,
          title: `Day ${day} - ${dayVocabularies.length}个单词`,
          wordCount: dayVocabularies.length,
        }
      })

      // 创建每日词汇关联
      const dayWords = dayVocabularies.map((vocab, index) => ({
        id: `vpdw_${Date.now()}_${day}_${index}_${Math.random().toString(36).substr(2, 9)}`,
        packDayId: dayId,
        vocabularyId: vocab.id,
        orderIndex: index,
      }))

      await tx.vocabulary_pack_day_words.createMany({ data: dayWords })

      console.log(`  Day ${day}: ${dayVocabularies.map(v => v.word).slice(0, 3).join(', ')}... (${dayVocabularies.length}词)`)
    }

    return newPack
  })

  console.log('\n✅ 5天词汇库创建完成!')
  console.log(`   名称: ${pack.name}`)
  console.log(`   总天数: ${totalDays}天`)
  console.log(`   总词汇: ${vocabularies.length}词`)
  console.log(`   每天约: ${wordsPerDay}词`)
}

main()
  .catch((e) => {
    console.error('❌ 创建失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
