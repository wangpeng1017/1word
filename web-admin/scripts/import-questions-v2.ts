import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

interface ParsedQuestion {
    word: string
    type: 'CHINESE_TO_ENGLISH' | 'ENGLISH_TO_CHINESE' | 'FILL_IN_BLANK'
    content: string
    meaning: string
    options: {
        label: string
        content: string
        isCorrect: boolean
    }[]
    correctAnswer: string
}

interface ParsedWordQuestions {
    word: string
    meaning: string
    questions: ParsedQuestion[]
}

async function importQuestionsV2() {
    console.log('=========================================')
    console.log('  导入练习题数据 (v2)')
    console.log('=========================================\n')

    // 读取解析后的数据（优先使用v4，其次v3，最后v2）
    let dataPath = path.join(process.cwd(), 'scripts', 'parsed-questions-v4.json')
    if (!fs.existsSync(dataPath)) {
        dataPath = path.join(process.cwd(), 'scripts', 'parsed-questions-v3.json')
        if (!fs.existsSync(dataPath)) {
            dataPath = path.join(process.cwd(), 'scripts', 'parsed-questions-v2.json')
        }
    }
    const parsedData: ParsedWordQuestions[] = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))

    console.log(`读取到 ${parsedData.length} 个单词的题目数据\n`)

    // 获取所有词汇的映射（包括音频信息）
    const vocabularies = await prisma.vocabularies.findMany({
        select: {
            id: true,
            word: true,
            primary_meaning: true,
            secondary_meaning: true,
            word_audios: {
                select: { audioUrl: true, accent: true }
            }
        }
    })
    const vocabMap = new Map(vocabularies.map(v => [v.word.toLowerCase(), v]))

    console.log(`数据库中有 ${vocabularies.length} 个词汇\n`)

    // 清空现有题目数据
    console.log('清空现有题目数据...')
    await prisma.question_options.deleteMany({})
    await prisma.questions.deleteMany({})
    console.log('✓ 已清空\n')

    // 统计
    let matchedWords = 0
    let unmatchedWords: string[] = []
    let importedQuestions = 0
    let importedOptions = 0
    let listeningQuestionsCreated = 0

    // 批量导入
    console.log('开始导入题目...')

    for (const wordData of parsedData) {
        const vocabInfo = vocabMap.get(wordData.word.toLowerCase())

        if (!vocabInfo) {
            unmatchedWords.push(wordData.word)
            continue
        }

        matchedWords++
        const vocabId = vocabInfo.id

        // 导入文档中的题目
        for (const q of wordData.questions) {
            let finalCorrectAnswer = q.correctAnswer
            // 复制选项数组以防修改原始引用
            const finalOptions = q.options.map(o => ({ ...o }))

            // 如果答案未知（通常是无编号格式导入的汉选英题），尝试用数据库中的释义来匹配
            if (finalCorrectAnswer === 'UNKNOWN' && (q.type === 'ENGLISH_TO_CHINESE' || q.type === 'CHINESE_TO_ENGLISH')) {
                const dbMeanings = [vocabInfo.primary_meaning, vocabInfo.secondary_meaning]
                    .filter(m => m) // 过滤null/undefined
                    .join('；')     // 统一连接
                    .split(/[；;,，\s]+/) // 分割成关键词
                    .filter(m => m && m.length > 0)

                // 遍历选项寻找匹配
                for (const opt of finalOptions) {
                    // 如果选项内容包含任何一个释义关键词，或被释义关键词包含
                    const isMatch = dbMeanings.some(m => opt.content.includes(m) || m.includes(opt.content))
                    if (isMatch) {
                        finalCorrectAnswer = opt.label
                        opt.isCorrect = true
                        // 更新题目内容为匹配到的释义（如果是汉选英且内容未定）
                        if (q.meaning === 'UNKNOWN') {
                            q.meaning = opt.content
                            q.content = q.word // 题目内容保持为单词
                        }
                        break
                    }
                }
            }

            if (finalCorrectAnswer === 'UNKNOWN') {
                // 如果仍然无法确定答案，跳过此题
                // console.log(`  跳过无法确定答案的题目: ${wordData.word}`)
                continue
            }

            const questionId = `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

            await prisma.questions.create({
                data: {
                    id: questionId,
                    vocabularyId: vocabId,
                    type: q.type,
                    content: q.content,
                    sentence: q.type === 'FILL_IN_BLANK' ? q.content : null,
                    correctAnswer: finalCorrectAnswer,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            })
            importedQuestions++

            // 创建选项
            for (let i = 0; i < finalOptions.length; i++) {
                const opt = finalOptions[i]
                await prisma.question_options.create({
                    data: {
                        id: `qo_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`,
                        questionId: questionId,
                        content: opt.content,
                        isCorrect: opt.isCorrect,
                        order: i + 1
                    }
                })
                importedOptions++
            }
        }

        // 生成听力题（如果有音频）
        if (vocabInfo.word_audios && vocabInfo.word_audios.length > 0) {
            const audioUrl = vocabInfo.word_audios[0].audioUrl

            // 获取同首字母的其他单词作为干扰项
            const firstLetter = wordData.word[0].toLowerCase()
            const sameLetterWords = vocabularies
                .filter(v => v.word.toLowerCase().startsWith(firstLetter) && v.word.toLowerCase() !== wordData.word.toLowerCase())
                .map(v => v.word)
                .slice(0, 10) // 取前10个备选

            if (sameLetterWords.length >= 3) {
                // 随机选3个干扰项
                const shuffled = sameLetterWords.sort(() => Math.random() - 0.5).slice(0, 3)
                const allOptions = [wordData.word, ...shuffled].sort(() => Math.random() - 0.5)
                const correctIndex = allOptions.findIndex(o => o.toLowerCase() === wordData.word.toLowerCase())
                const correctLabel = ['A', 'B', 'C', 'D'][correctIndex]

                const listeningQuestionId = `q_${Date.now()}_listen_${Math.random().toString(36).substr(2, 9)}`

                await prisma.questions.create({
                    data: {
                        id: listeningQuestionId,
                        vocabularyId: vocabId,
                        type: 'LISTENING',
                        content: '听音频选择正确的单词',
                        audioUrl: audioUrl,
                        correctAnswer: correctLabel,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }
                })
                importedQuestions++
                listeningQuestionsCreated++

                // 创建听力题选项
                for (let i = 0; i < allOptions.length; i++) {
                    await prisma.question_options.create({
                        data: {
                            id: `qo_${Date.now()}_listen_${i}_${Math.random().toString(36).substr(2, 9)}`,
                            questionId: listeningQuestionId,
                            content: allOptions[i],
                            isCorrect: i === correctIndex,
                            order: i + 1
                        }
                    })
                    importedOptions++
                }
            }
        }

        // 进度显示
        if (matchedWords % 100 === 0) {
            console.log(`进度: ${matchedWords}/${parsedData.length}`)
        }
    }

    console.log('\n=========================================')
    console.log('  导入完成!')
    console.log('=========================================')
    console.log(`匹配的单词: ${matchedWords}`)
    console.log(`未匹配的单词: ${unmatchedWords.length}`)
    console.log(`导入的题目: ${importedQuestions}`)
    console.log(`  - 文档题目: ${importedQuestions - listeningQuestionsCreated}`)
    console.log(`  - 听力题: ${listeningQuestionsCreated}`)
    console.log(`导入的选项: ${importedOptions}`)

    if (unmatchedWords.length > 0 && unmatchedWords.length <= 20) {
        console.log('\n未匹配的单词列表:')
        unmatchedWords.forEach(w => console.log(`  - ${w}`))
    }

    await prisma.$disconnect()
}

if (require.main === module) {
    importQuestionsV2()
}

export { importQuestionsV2 }
