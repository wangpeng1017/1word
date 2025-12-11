// 词汇测试数据生成脚本
// 运行方式: node seed-test-questions.js

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// 生成唯一ID
function generateId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

// 为词汇生成题目
async function generateQuestionsForVocabulary(vocabulary) {
    const questions = []

    // 1. 英译中题目
    const englishToChineseId = generateId('q')
    const e2cQuestion = {
        id: englishToChineseId,
        vocabularyId: vocabulary.id,
        type: 'ENGLISH_TO_CHINESE',
        content: `"${vocabulary.word}" 的中文意思是什么？`,
        sentence: null,
        audioUrl: vocabulary.audio_url || null,
        correctAnswer: vocabulary.primary_meaning,
        createdAt: new Date(),
        updatedAt: new Date()
    }

    // 生成干扰选项（从其他词汇中随机选择）
    const otherMeanings = await prisma.vocabularies.findMany({
        where: {
            id: { not: vocabulary.id }
        },
        select: { primary_meaning: true },
        take: 10
    })

    const shuffledMeanings = otherMeanings
        .map(v => v.primary_meaning)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)

    // 确保有足够的干扰项
    while (shuffledMeanings.length < 3) {
        shuffledMeanings.push(`错误选项${shuffledMeanings.length + 1}`)
    }

    const allOptions = [vocabulary.primary_meaning, ...shuffledMeanings]
        .sort(() => Math.random() - 0.5)

    const e2cOptions = allOptions.map((content, index) => ({
        id: generateId('opt'),
        questionId: englishToChineseId,
        content,
        order: index + 1
    }))

    questions.push({ question: e2cQuestion, options: e2cOptions })

    // 2. 中译英题目
    const chineseToEnglishId = generateId('q')
    const c2eQuestion = {
        id: chineseToEnglishId,
        vocabularyId: vocabulary.id,
        type: 'CHINESE_TO_ENGLISH',
        content: `"${vocabulary.primary_meaning}" 的英文单词是什么？`,
        sentence: null,
        audioUrl: null,
        correctAnswer: vocabulary.word,
        createdAt: new Date(),
        updatedAt: new Date()
    }

    const otherWords = await prisma.vocabularies.findMany({
        where: {
            id: { not: vocabulary.id }
        },
        select: { word: true },
        take: 10
    })

    const shuffledWords = otherWords
        .map(v => v.word)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)

    while (shuffledWords.length < 3) {
        shuffledWords.push(`wrong${shuffledWords.length + 1}`)
    }

    const allWordOptions = [vocabulary.word, ...shuffledWords]
        .sort(() => Math.random() - 0.5)

    const c2eOptions = allWordOptions.map((content, index) => ({
        id: generateId('opt'),
        questionId: chineseToEnglishId,
        content,
        order: index + 1
    }))

    questions.push({ question: c2eQuestion, options: c2eOptions })

    return questions
}

async function main() {
    console.log('开始生成测试题目数据...')

    // 1. 获取所有词汇
    const vocabularies = await prisma.vocabularies.findMany({
        take: 50, // 限制50个词汇
        orderBy: { created_at: 'desc' }
    })

    console.log(`找到 ${vocabularies.length} 个词汇`)

    if (vocabularies.length === 0) {
        console.log('没有找到词汇数据，请先导入词汇')
        return
    }

    // 2. 检查是否已有题目
    const existingQuestions = await prisma.questions.count()
    console.log(`现有题目数量: ${existingQuestions}`)

    // 3. 为每个词汇生成题目
    let createdCount = 0
    for (const vocabulary of vocabularies) {
        // 检查该词汇是否已有题目
        const hasQuestions = await prisma.questions.findFirst({
            where: { vocabularyId: vocabulary.id }
        })

        if (hasQuestions) {
            console.log(`词汇 "${vocabulary.word}" 已有题目，跳过`)
            continue
        }

        const questionsData = await generateQuestionsForVocabulary(vocabulary)

        for (const { question, options } of questionsData) {
            await prisma.questions.create({
                data: question
            })

            for (const option of options) {
                await prisma.question_options.create({
                    data: option
                })
            }
            createdCount++
        }

        console.log(`已为词汇 "${vocabulary.word}" 创建 ${questionsData.length} 道题目`)
    }

    console.log(`\n题目创建完成，共创建 ${createdCount} 道题目`)

    // 4. 创建示例测试题库
    const existingTest = await prisma.proficiency_tests.findFirst({
        where: { name: '词汇水平测试' }
    })

    if (!existingTest) {
        // 获取第一个教师
        const teacher = await prisma.teachers.findFirst()

        if (!teacher) {
            console.log('没有找到教师，请先创建教师账号')
            return
        }

        // 选择20个词汇创建测试
        const testVocabularies = vocabularies.slice(0, 20)
        const vocabularyIds = testVocabularies.map(v => v.id)

        const test = await prisma.proficiency_tests.create({
            data: {
                id: generateId('pt'),
                name: '词汇水平测试',
                description: '测试您的词汇掌握程度，包含20道题目',
                vocabularyIds,
                totalWords: vocabularyIds.length,
                passScore: 60,
                duration: 15, // 15分钟
                isActive: true,
                createdBy: teacher.id,
                updatedAt: new Date()
            }
        })

        console.log(`\n已创建测试题库: "${test.name}" (${test.totalWords}道题)`)
    } else {
        console.log('\n测试题库已存在，跳过创建')
    }

    // 5. 输出统计信息
    const totalQuestions = await prisma.questions.count()
    const totalTests = await prisma.proficiency_tests.count()

    console.log('\n=== 数据统计 ===')
    console.log(`词汇总数: ${vocabularies.length}`)
    console.log(`题目总数: ${totalQuestions}`)
    console.log(`测试题库: ${totalTests}`)
    console.log('================')
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
