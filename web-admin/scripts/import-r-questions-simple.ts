import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

interface ParsedQuestion {
    word: string
    type: 'CHINESE_TO_ENGLISH' | 'ENGLISH_TO_CHINESE' | 'FILL_IN_BLANK'
    content: string
    options: { label: string; content: string; isCorrect: boolean }[]
    correctAnswer: string
}

interface ParsedWordData {
    word: string
    meaning: string
    questions: ParsedQuestion[]
}

async function importRQuestionsSimple() {
    console.log('=========================================')
    console.log('  导入 R 开头单词的题目')
    console.log('=========================================\n')

    // 读取解析的数据
    const dataPath = path.join(process.cwd(), 'scripts', 'parsed-r-questions.json')
    const parsedData: ParsedWordData[] = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
    console.log(`R 开头单词: ${parsedData.length}`)

    // 获取R开头词汇
    const vocabularies = await prisma.vocabularies.findMany({
        where: { word: { startsWith: 'r' } },
        select: {
            id: true,
            word: true,
            word_audios: { select: { audioUrl: true } }
        }
    })
    const vocabMap = new Map(vocabularies.map(v => [v.word.toLowerCase(), v]))
    console.log(`数据库R开头词汇: ${vocabularies.length}\n`)

    // 统计
    let matched = 0, imported = 0, listening = 0

    for (const wordData of parsedData) {
        const vocab = vocabMap.get(wordData.word.toLowerCase())
        if (!vocab) continue

        matched++

        // 导入题目
        for (const q of wordData.questions) {
            const qId = `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

            await prisma.questions.create({
                data: {
                    id: qId,
                    vocabularyId: vocab.id,
                    type: q.type,
                    content: q.content,
                    correctAnswer: q.correctAnswer,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            })

            for (let i = 0; i < q.options.length; i++) {
                await prisma.question_options.create({
                    data: {
                        id: `qo_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`,
                        questionId: qId,
                        content: q.options[i].content,
                        isCorrect: q.options[i].isCorrect,
                        order: i + 1
                    }
                })
            }
            imported++
        }

        // 生成听力题
        if (vocab.word_audios?.length > 0) {
            const audioUrl = vocab.word_audios[0].audioUrl
            const others = vocabularies.filter(v => v.word !== vocab.word).slice(0, 10)

            if (others.length >= 3) {
                const distractor = others.sort(() => Math.random() - 0.5).slice(0, 3).map(v => v.word)
                const allOpts = [vocab.word, ...distractor].sort(() => Math.random() - 0.5)
                const correctIdx = allOpts.findIndex(o => o.toLowerCase() === vocab.word.toLowerCase())
                const correctLabel = ['A', 'B', 'C', 'D'][correctIdx]

                const listenId = `q_${Date.now()}_listen_${Math.random().toString(36).substr(2, 9)}`
                await prisma.questions.create({
                    data: {
                        id: listenId,
                        vocabularyId: vocab.id,
                        type: 'LISTENING',
                        content: '听音频选择正确的单词',
                        audioUrl,
                        correctAnswer: correctLabel,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }
                })

                for (let i = 0; i < allOpts.length; i++) {
                    await prisma.question_options.create({
                        data: {
                            id: `qo_${Date.now()}_l${i}_${Math.random().toString(36).substr(2, 9)}`,
                            questionId: listenId,
                            content: allOpts[i],
                            isCorrect: i === correctIdx,
                            order: i + 1
                        }
                    })
                }
                imported++
                listening++
            }
        }

        if (matched % 20 === 0) console.log(`进度: ${matched}`)
        await new Promise(r => setTimeout(r, 30)) // 小延迟
    }

    console.log('\n=========================================')
    console.log(`匹配: ${matched}, 导入: ${imported}, 听力: ${listening}`)
    console.log('=========================================')

    await prisma.$disconnect()
}

importRQuestionsSimple()
