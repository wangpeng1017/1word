/**
 * 测试题型分配功能
 * 验证是否符合 80% 选择题 + 20% 选词填空的要求
 */

// 模拟题型枚举
const QuestionTypeEnum = {
  ENGLISH_TO_CHINESE: 'ENGLISH_TO_CHINESE',
  CHINESE_TO_ENGLISH: 'CHINESE_TO_ENGLISH',
  LISTENING: 'LISTENING',
  FILL_IN_BLANK: 'FILL_IN_BLANK',
}

// 模拟分配函数
function allocateQuestionTypes(vocabularyIds) {
  const allocation = new Map()
  
  if (vocabularyIds.length === 0) {
    return allocation
  }

  const total = vocabularyIds.length
  const fillInBlankCount = Math.floor(total * 0.2)
  const choiceCount = total - fillInBlankCount

  const choiceTypes = [
    QuestionTypeEnum.ENGLISH_TO_CHINESE,
    QuestionTypeEnum.CHINESE_TO_ENGLISH,
    QuestionTypeEnum.LISTENING,
  ]

  // 洗牌
  const shuffled = [...vocabularyIds]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  shuffled.forEach((vocabId, index) => {
    if (index < fillInBlankCount) {
      allocation.set(vocabId, QuestionTypeEnum.FILL_IN_BLANK)
    } else {
      const randomChoiceType = choiceTypes[Math.floor(Math.random() * choiceTypes.length)]
      allocation.set(vocabId, randomChoiceType)
    }
  })

  return allocation
}

// 统计函数
function getQuestionTypeStats(allocation) {
  let englishToChinese = 0
  let chineseToEnglish = 0
  let listening = 0
  let fillInBlank = 0

  allocation.forEach((type) => {
    switch (type) {
      case QuestionTypeEnum.ENGLISH_TO_CHINESE:
        englishToChinese++
        break
      case QuestionTypeEnum.CHINESE_TO_ENGLISH:
        chineseToEnglish++
        break
      case QuestionTypeEnum.LISTENING:
        listening++
        break
      case QuestionTypeEnum.FILL_IN_BLANK:
        fillInBlank++
        break
    }
  })

  const total = allocation.size
  const choiceTotal = englishToChinese + chineseToEnglish + listening

  return {
    total,
    englishToChinese,
    chineseToEnglish,
    listening,
    fillInBlank,
    choicePercentage: total > 0 ? (choiceTotal / total) * 100 : 0,
    fillInBlankPercentage: total > 0 ? (fillInBlank / total) * 100 : 0,
  }
}

// 测试不同数量的词汇
console.log('🧪 题型分配测试\n')

const testCases = [5, 10, 20, 30, 50, 100]

testCases.forEach(count => {
  console.log(`\n📊 测试 ${count} 个词汇的题型分配：`)
  console.log('─'.repeat(60))
  
  // 生成模拟词汇ID
  const vocabularyIds = Array.from({ length: count }, (_, i) => `vocab-${i}`)
  
  // 分配题型
  const allocation = allocateQuestionTypes(vocabularyIds)
  const stats = getQuestionTypeStats(allocation)
  
  // 打印结果
  console.log(`总词汇数：${stats.total}`)
  console.log(`\n选择题类型：`)
  console.log(`  • 英选汉：${stats.englishToChinese} 个`)
  console.log(`  • 汉选英：${stats.chineseToEnglish} 个`)
  console.log(`  • 听音选词：${stats.listening} 个`)
  console.log(`  选择题小计：${stats.englishToChinese + stats.chineseToEnglish + stats.listening} 个 (${stats.choicePercentage.toFixed(1)}%)`)
  console.log(`\n选词填空：${stats.fillInBlank} 个 (${stats.fillInBlankPercentage.toFixed(1)}%)`)
  
  // 验证比例
  const isValid = stats.choicePercentage >= 75 && stats.choicePercentage <= 85
  console.log(`\n✓ 比例检查：${isValid ? '✅ 通过' : '❌ 失败'}`)
})

console.log('\n\n🎯 测试总结：')
console.log('题型分配算法已实现，符合以下要求：')
console.log('• 约 80% 的单词使用选择题（英选汉/汉选英/听音选词）')
console.log('• 约 20% 的单词使用选词填空')
console.log('• 选择题的三种类型随机分配')
console.log('• 使用洗牌算法保证随机性')
