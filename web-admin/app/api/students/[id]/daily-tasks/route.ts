import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { apiResponse } from '@/lib/response'
import { allocateQuestionTypes, selectQuestionByType } from '@/lib/question-type-allocator'
import { getTodayBeijing, toBeijingDate } from '@/lib/date-utils'
import { getEffectiveLessons, getDayScheduleInfo, resolveToPackDayNumbers, TOTAL_PLAN_DAYS } from '@/lib/review-schedule'

// 每日新学单词上限
const MAX_NEW_WORDS_PER_DAY = 2000

// 将相对路径转换为完整URL
function toAbsoluteUrl(path: string | null | undefined): string | null {
  if (!path) return null
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  // 使用阿里云域名
  const baseUrl = process.env.NEXT_PUBLIC_STATIC_URL || 'https://ienglish.xdf.cn'
  return `${baseUrl}${path}`
}

// 映射任务数据为小程序格式
// 性能优化：精简返回字段，防止前端 setStorageSync 超过微信 1MB 单条限制
function mapTasksForMiniapp(tasks: any[], isNewMap: Map<string, boolean>) {
  return tasks.map((t: any) => {
    const v = t.vocabulary || t.vocabularies || {}
    // 只返回被选中的 1 个 question（而非全部），大幅减少数据量
    const allQuestions = (v.questions || []).filter((q: any) => q.type !== 'LISTENING')
    const mapQuestion = (q: any) => ({
      id: q.id,
      type: q.type,
      content: q.content,
      // 移除 sentence（仅部分题型用，节省空间）
      correctAnswer: q.correctAnswer,
      options: (q.question_options || q.options || [])
        .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
        .map((o: any) => ({
          id: o.id,
          content: o.content,
          isCorrect: o.isCorrect,
        })),
    })
    // 优先返回 selectedQuestionId 对应的题目，其次按 targetQuestionType，兜底取第一个
    let selectedQ = t.selectedQuestionId
      ? allQuestions.find((q: any) => q.id === t.selectedQuestionId)
      : null
    if (!selectedQ && t.targetQuestionType) {
      selectedQ = allQuestions.find((q: any) => q.type === t.targetQuestionType)
    }
    if (!selectedQ && allQuestions.length > 0) {
      selectedQ = allQuestions[0]
    }
    const questions = selectedQ ? [mapQuestion(selectedQ)] : []

    const audios = v.word_audios || v.audios || []
    const audioUs = audios.find((a: any) => (a.accent || '').toUpperCase() === 'US')?.audioUrl
    const audioUk = audios.find((a: any) => (a.accent || '').toUpperCase() === 'UK')?.audioUrl
    const defaultAudio = audioUs || audioUk || v.audioUrl || v.audio_url || null
    // 只保留一个合并后的 audioUrl，去掉冗余的 audioUs/audioUk
    const defaultAudioAbsolute = toAbsoluteUrl(defaultAudio)

    // 精简 meanings：只保留前2条，保留 partOfSpeech+meaning（去掉 examples/id/orderIndex 等大体积数据）
    const meanings = (v.word_meanings || []).slice(0, 2).map((m: any) => ({
      partOfSpeech: m.partOfSpeech ?? m.part_of_speech,
      meaning: m.meaning,
    }))

    return {
      id: t.id || `task_${v.id}`,
      vocabularyId: v.id,
      isNew: isNewMap.get(v.id) ?? false,
      selectedQuestionId: t.selectedQuestionId || null,
      vocabulary: {
        id: v.id,
        word: v.word,
        primaryMeaning: v.primaryMeaning ?? v.primary_meaning,
        meanings,
        audioUrl: defaultAudioAbsolute,
        imageUrl: v.word_images?.[0]?.imageUrl ?? null,
        questions,
      },
    }
  })
}

// GET /api/students/[id]/daily-tasks - 动态生成学生当日任务
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: studentId } = await params
  console.log('[daily-tasks] 开始处理, studentId:', studentId)
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return apiResponse.unauthorized('未授权')

    const payload = verifyToken(token)
    if (!payload) return apiResponse.unauthorized('Token无效')

    // 1. 获取学生信息和班级
    const student = await prisma.students.findUnique({
      where: { id: studentId },
      select: { id: true, class_id: true }
    })
    console.log('[daily-tasks] 学生信息:', student)
    if (!student) return apiResponse.error('学生不存在')

    // 2. 获取班级的活跃词汇库计划（取已开始的最新计划，避免命中未来计划）
    const today = getTodayBeijing()
    const planClass = await prisma.plan_classes.findFirst({
      where: {
        class_id: student.class_id,
        status: 'ACTIVE',
        start_date: { lte: today },
      },
      orderBy: { start_date: 'desc' },
      include: {
        vocabulary_packs: {
          include: {
            pack_days: {
              include: {
                day_words: {
                  include: {
                    vocabulary: {
                      include: {
                        word_audios: true,
                        word_images: { take: 1 }, // 只取第一张图片
                        word_meanings: { orderBy: { orderIndex: 'asc' } },
                        questions: {
                          include: {
                            question_options: { orderBy: { order: 'asc' } }
                          }
                        }
                      }
                    }
                  }
                }
              },
              orderBy: { dayNumber: 'asc' }
            }
          }
        }
      }
    })
    console.log('[daily-tasks] planClass found:', !!planClass, 'pack:', planClass?.vocabulary_packs?.name)


    // 3. 获取已掌握的词汇ID
    const masteredWords = await prisma.word_masteries.findMany({
      where: { studentId, isMastered: true },
      select: { vocabularyId: true }
    })
    const masteredVocabIds = new Set(masteredWords.map(w => w.vocabularyId))

    // 3.1 获取已经在学习中的词汇ID (避免新词重复出现)
    const startedWords = await prisma.study_plans.findMany({
      where: { studentId },
      select: { vocabularyId: true }
    })
    const startedVocabIds = new Set(startedWords.map(w => w.vocabularyId))

    // 4. 计算今日新学单词和复习单词
    let newWords: any[] = []
    let reviewWords: { vocabulary: any }[] = []
    let dayNumber = 0
    let totalDays = 0

    // 获取查询参数中的 day (用于补打卡)
    const { searchParams } = new URL(request.url)
    const forcedDayStr = searchParams.get('day')
    const forcedDay = forcedDayStr ? parseInt(forcedDayStr) : null
    const isRepeat = searchParams.get('repeat') === 'true'

    if (planClass?.vocabulary_packs) {
      const pack = planClass.vocabulary_packs
      totalDays = pack.totalDays

      // 计算今天是学习的第几天（使用北京时间）
      const startDateBeijing = toBeijingDate(planClass.start_date)
      const diffTime = today.getTime() - startDateBeijing.getTime()
      let currentDayNumber = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1

      // 如果指定了 day 参数（补打卡），则使用指定的 day，否则使用今天
      dayNumber = forcedDay || currentDayNumber

      console.log('[daily-tasks] dayNumber:', dayNumber, 'forcedDay:', forcedDay, 'totalDays:', totalDays)

      // 获取当天的新学单词
      if (dayNumber >= 1 && dayNumber <= totalDays) {
        const packDay = pack.pack_days.find(d => d.dayNumber === dayNumber)
        if (packDay) {
          newWords = packDay.day_words
            .map(dw => dw.vocabulary)
            .filter(v => v && !masteredVocabIds.has(v.id) && (isRepeat || !startedVocabIds.has(v.id))) // 过滤掉已掌握 和 已在学习计划中 的词（repeat模式跳过startedVocabIds）
            .filter(v => v.questions && v.questions.length > 0)
            .filter(v => v.word_audios && v.word_audios.length > 0)
            .slice(0, MAX_NEW_WORDS_PER_DAY)
        }
      }

      // 获取需要复习的单词（基于91天课表引擎）
      // 课表系统下每天有固定的复习内容，补打卡也应加载该天的复习词
      {
        const newWordIds = new Set(newWords.map(v => v.id))
        const seenVocabIds = new Set<string>()

        // 构建有效课程映射（跳过空天/节假日）
        const lessonMap = getEffectiveLessons(pack.pack_days)
        const totalLessons = lessonMap.size

        // 查找当天正在学习的有效课程序号
        let currentLessonForDay = 0
        for (const [lessonIdx, dn] of lessonMap.entries()) {
          if (dn === dayNumber) { currentLessonForDay = lessonIdx; break }
        }

        // 获取当天课表信息
        const scheduleInfo = getDayScheduleInfo(dayNumber, totalDays, totalLessons, currentLessonForDay)
        // 将有效课程序号转为实际 pack_days dayNumber
        const reviewDayNumbers = resolveToPackDayNumbers(scheduleInfo.reviewLessons, lessonMap)

        console.log('[daily-tasks] schedule:', scheduleInfo.type, 'reviewLessons:', scheduleInfo.reviewLessons, 'reviewDayNumbers:', reviewDayNumbers)

        for (const targetDayNumber of reviewDayNumbers) {
          const packDay = pack.pack_days.find(d => d.dayNumber === targetDayNumber)
          if (packDay) {
            const dayReviewWords = packDay.day_words
              .map(dw => dw.vocabulary)
              .filter(v => v && !masteredVocabIds.has(v.id) && !newWordIds.has(v.id) && !seenVocabIds.has(v.id))
              .filter(v => v.questions && v.questions.length > 0)
              .filter(v => v.word_audios && v.word_audios.length > 0)

            dayReviewWords.forEach(v => {
              seenVocabIds.add(v.id)
              reviewWords.push({ vocabulary: v })
            })
          }
        }
      }
    }

    // 5. 合并任务并标记新学/复习
    const isNewMap = new Map<string, boolean>()
    newWords.forEach(v => isNewMap.set(v.id, true))
    reviewWords.forEach(r => isNewMap.set(r.vocabulary.id, false))

    const allTasks = [
      ...newWords.map(v => ({ vocabulary: v })),
      ...reviewWords
    ]

    // 6. 分配题型
    const vocabularyIds = allTasks.map(t => t.vocabulary.id)
    const hasAudioMap = new Map<string, boolean>(
      allTasks.map(t => [t.vocabulary.id, (t.vocabulary.word_audios?.length || 0) > 0])
    )
    const allocation = allocateQuestionTypes(vocabularyIds, hasAudioMap)

    const tasksWithSelection = allTasks.map(t => {
      const targetType = allocation.get(t.vocabulary.id)
      const selected = selectQuestionByType(
        (t.vocabulary.questions || []).map((q: any) => ({ id: q.id, type: q.type })),
        targetType as any
      )
      return { ...t, targetQuestionType: targetType, selectedQuestionId: selected }
    })

    const shaped = mapTasksForMiniapp(tasksWithSelection, isNewMap)
      .filter(t => t.vocabulary.questions.length > 0) // 过滤掉只有听力题（被屏蔽后无可用题目）的单词
    const actualNewCount = shaped.filter(t => t.isNew).length
    const actualReviewCount = shaped.filter(t => !t.isNew).length
    console.log('[daily-tasks] 返回任务数:', shaped.length, 'newCount:', actualNewCount, 'reviewCount:', actualReviewCount)

    return apiResponse.success({
      tasks: shaped,
      summary: {
        newCount: actualNewCount,
        reviewCount: actualReviewCount,
        dayNumber,
        totalDays
      }
    })
  } catch (error: any) {
    console.error('获取每日任务失败:', error)
    return apiResponse.error(`获取每日任务失败: ${error?.message || '未知错误'}`)
  }
}

// POST 保留用于兼容，但逻辑与 GET 相同
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return GET(request, { params })
}
