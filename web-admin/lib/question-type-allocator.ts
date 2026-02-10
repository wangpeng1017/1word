/**
 * 题型分配工具
 * 比例：选词填空 25%、汉选英 28%、英选汉 ~47%
 * ⚠️ 听音选词暂时禁用（音频播放问题未解决）- 2026-02-11
 */

export enum QuestionTypeEnum {
  ENGLISH_TO_CHINESE = 'ENGLISH_TO_CHINESE',  // 英选汉
  CHINESE_TO_ENGLISH = 'CHINESE_TO_ENGLISH',  // 汉选英
  LISTENING = 'LISTENING',                     // 听音选词（暂时禁用）
  FILL_IN_BLANK = 'FILL_IN_BLANK',            // 选词填空
}

/**
 * 为每日任务分配题型
 * @param vocabularyIds 词汇ID列表
 * @returns 词汇ID到题型的映射
 */
export function allocateQuestionTypes(
  vocabularyIds: string[],
  hasAudioMap?: Map<string, boolean>
): Map<string, QuestionTypeEnum> {
  const allocation = new Map<string, QuestionTypeEnum>()

  if (vocabularyIds.length === 0) {
    return allocation
  }

  // 计算各题型数量（听音选词暂时禁用）
  const total = vocabularyIds.length
  const fillInBlankCount = Math.floor(total * 0.25)   // 25% 选词填空（原20%+5%）
  const listeningCount = 0                             // 0% 听音选词（暂时禁用）
  const chineseToEnglishCount = Math.floor(total * 0.28) // 28% 汉选英（原23%+5%）
  // 剩余全部给英选汉 (~47%)

  // 洗牌算法（Fisher-Yates）- 随机打乱词汇顺序
  const shuffled = [...vocabularyIds]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  // 分配题型
  let fillInBlankAssigned = 0
  let listeningAssigned = 0
  let chineseToEnglishAssigned = 0

  shuffled.forEach((vocabId) => {
    // 优先分配选词填空
    if (fillInBlankAssigned < fillInBlankCount) {
      allocation.set(vocabId, QuestionTypeEnum.FILL_IN_BLANK)
      fillInBlankAssigned++
      return
    }

    // 分配听音选词（需要有音频）
    const hasAudio = hasAudioMap ? hasAudioMap.get(vocabId) !== false : true
    if (listeningAssigned < listeningCount && hasAudio) {
      allocation.set(vocabId, QuestionTypeEnum.LISTENING)
      listeningAssigned++
      return
    }

    // 分配汉选英
    if (chineseToEnglishAssigned < chineseToEnglishCount) {
      allocation.set(vocabId, QuestionTypeEnum.CHINESE_TO_ENGLISH)
      chineseToEnglishAssigned++
      return
    }

    // 剩余全部给英选汉
    allocation.set(vocabId, QuestionTypeEnum.ENGLISH_TO_CHINESE)
  })

  return allocation
}


/**
 * 统计题型分布
 * @param allocation 题型分配映射
 * @returns 题型统计
 */
export function getQuestionTypeStats(
  allocation: Map<string, QuestionTypeEnum>
): {
  total: number
  englishToChinese: number
  chineseToEnglish: number
  listening: number
  fillInBlank: number
  choicePercentage: number
  fillInBlankPercentage: number
} {
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

/**
 * 为单个词汇选择合适的题目
 * @param questions 该词汇的所有题目
 * @param targetType 目标题型
 * @returns 选中的题目，如果没有匹配的题型则返回任意题目
 */
export function selectQuestionByType(
  questions: Array<{ id: string; type: string }>,
  targetType: QuestionTypeEnum
): string | null {
  if (questions.length === 0) {
    return null
  }

  // 优先选择目标题型
  const matchedQuestion = questions.find((q) => q.type === targetType)
  if (matchedQuestion) {
    return matchedQuestion.id
  }

  // 如果没有目标题型，随机返回一个（排除 LISTENING 类型）
  const nonListening = questions.filter(q => q.type !== 'LISTENING')
  if (nonListening.length > 0) {
    const randomIndex = Math.floor(Math.random() * nonListening.length)
    return nonListening[randomIndex].id
  }
  // 极端情况：全部都是 LISTENING 题，返回第一个
  return questions[0].id
}
