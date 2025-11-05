const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4N2E3MTJjOS0wNDQwLTRiZmYtOTQxYy02MTRkOTcwYjkwYzMiLCJlbWFpbCI6ImFkbWluQHZvY2FiLmNvbSIsInJvbGUiOiJURUFDSEVSIiwiaWF0IjoxNzYyMzI3MDc0LCJleHAiOjE3NjI5MzE4NzR9.C6sHCecDa1fWenPVAjABWoQmvnSV9lhVCpKPVhCMbAY"
const API_URL = "https://11word.vercel.app/api"

// 获取所有词汇
async function getAllVocabularies() {
  let allVocabularies = []
  let page = 1
  let hasMore = true
  
  while (hasMore) {
    const response = await fetch(`${API_URL}/vocabularies?page=${page}&limit=100`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`
      }
    })
    const result = await response.json()
    const vocabularies = result.data.vocabularies
    
    if (vocabularies && vocabularies.length > 0) {
      allVocabularies = allVocabularies.concat(vocabularies)
      page++
      // 如果返回的数量小于limit，说明已经是最后一页
      if (vocabularies.length < 100) {
        hasMore = false
      }
    } else {
      hasMore = false
    }
  }
  
  return allVocabularies
}

// 生成题目选项（英选汉）
function generateEnglishToChineseOptions(vocabulary, allVocabularies) {
  const correctAnswer = vocabulary.primaryMeaning
  
  // 从其他词汇中随机选择3个作为干扰项
  const otherOptions = allVocabularies
    .filter(v => v.id !== vocabulary.id && v.primaryMeaning !== correctAnswer)
    .map(v => v.primaryMeaning)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
  
  // 组合所有选项并打乱
  const allOptions = [correctAnswer, ...otherOptions]
    .sort(() => Math.random() - 0.5)
  
  return allOptions.map((opt, index) => ({
    content: opt,
    isCorrect: opt === correctAnswer,
    order: index + 1
  }))
}

// 生成题目选项（汉选英）
function generateChineseToEnglishOptions(vocabulary, allVocabularies) {
  const correctAnswer = vocabulary.word
  
  // 从其他词汇中随机选择3个作为干扰项
  const otherOptions = allVocabularies
    .filter(v => v.id !== vocabulary.id && v.word !== correctAnswer)
    .map(v => v.word)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
  
  // 组合所有选项并打乱
  const allOptions = [correctAnswer, ...otherOptions]
    .sort(() => Math.random() - 0.5)
  
  return allOptions.map((opt, index) => ({
    content: opt,
    isCorrect: opt === correctAnswer,
    order: index + 1
  }))
}

// 为单个词汇创建题目
async function createQuestionForVocabulary(vocabulary, allVocabularies) {
  // 创建英选汉题目
  const engToChn = {
    type: 'ENGLISH_TO_CHINESE',
    content: vocabulary.word,
    correctAnswer: vocabulary.primaryMeaning,
    options: generateEnglishToChineseOptions(vocabulary, allVocabularies)
  }
  
  try {
    const response1 = await fetch(`${API_URL}/vocabularies/${vocabulary.id}/questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      },
      body: JSON.stringify(engToChn)
    })
    
    const result1 = await response1.json()
    console.log(`✓ 为 ${vocabulary.word} 创建英选汉题目: ${result1.success ? '成功' : '失败'}`)
    
    // 创建汉选英题目
    const chnToEng = {
      type: 'CHINESE_TO_ENGLISH',
      content: vocabulary.primaryMeaning,
      correctAnswer: vocabulary.word,
      options: generateChineseToEnglishOptions(vocabulary, allVocabularies)
    }
    
    const response2 = await fetch(`${API_URL}/vocabularies/${vocabulary.id}/questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      },
      body: JSON.stringify(chnToEng)
    })
    
    const result2 = await response2.json()
    console.log(`✓ 为 ${vocabulary.word} 创建汉选英题目: ${result2.success ? '成功' : '失败'}`)
    
    return result1.success && result2.success
  } catch (error) {
    console.error(`✗ 为 ${vocabulary.word} 创建题目失败:`, error.message)
    return false
  }
}

// 主函数
async function main() {
  console.log('开始批量生成题目...\n')
  
  // 获取所有词汇
  console.log('1. 获取词汇列表...')
  const vocabularies = await getAllVocabularies()
  console.log(`   找到 ${vocabularies.length} 个词汇\n`)
  
  // 为每个词汇生成题目
  console.log('2. 开始生成题目...')
  let successCount = 0
  let failCount = 0
  
  for (const vocabulary of vocabularies) {
    const success = await createQuestionForVocabulary(vocabulary, vocabularies)
    if (success) {
      successCount++
    } else {
      failCount++
    }
    
    // 避免请求过快
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  console.log('\n' + '='.repeat(50))
  console.log(`任务完成！`)
  console.log(`成功: ${successCount} 个词汇`)
  console.log(`失败: ${failCount} 个词汇`)
  console.log('='.repeat(50))
}

// 运行
main().catch(console.error)
