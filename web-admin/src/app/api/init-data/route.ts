import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 50个常用单词数据
const vocabulariesData = [
  { word: 'apple', meaning: '苹果', phonetic: '/ˈæpl/', partOfSpeech: ['n.'], sentence: 'I eat an _____ every day.' },
  { word: 'book', meaning: '书', phonetic: '/bʊk/', partOfSpeech: ['n.'], sentence: 'She is reading a _____.' },
  { word: 'cat', meaning: '猫', phonetic: '/kæt/', partOfSpeech: ['n.'], sentence: 'The _____ is sleeping.' },
  { word: 'dog', meaning: '狗', phonetic: '/dɔːɡ/', partOfSpeech: ['n.'], sentence: 'My _____ likes to play.' },
  { word: 'egg', meaning: '鸡蛋', phonetic: '/eɡ/', partOfSpeech: ['n.'], sentence: 'I had an _____ for breakfast.' },
  { word: 'fish', meaning: '鱼', phonetic: '/fɪʃ/', partOfSpeech: ['n.'], sentence: 'The _____ swims in the water.' },
  { word: 'good', meaning: '好的', phonetic: '/ɡʊd/', partOfSpeech: ['adj.'], sentence: 'This is a _____ book.' },
  { word: 'happy', meaning: '快乐的', phonetic: '/ˈhæpi/', partOfSpeech: ['adj.'], sentence: 'She looks very _____.' },
  { word: 'ice', meaning: '冰', phonetic: '/aɪs/', partOfSpeech: ['n.'], sentence: 'The water turned into _____.' },
  { word: 'jump', meaning: '跳', phonetic: '/dʒʌmp/', partOfSpeech: ['v.'], sentence: 'The kids _____ on the bed.' },
  
  { word: 'kind', meaning: '善良的', phonetic: '/kaɪnd/', partOfSpeech: ['adj.'], sentence: 'She is a _____ person.' },
  { word: 'love', meaning: '爱', phonetic: '/lʌv/', partOfSpeech: ['v.', 'n.'], sentence: 'I _____ my family.' },
  { word: 'moon', meaning: '月亮', phonetic: '/muːn/', partOfSpeech: ['n.'], sentence: 'The _____ is bright tonight.' },
  { word: 'nice', meaning: '好的', phonetic: '/naɪs/', partOfSpeech: ['adj.'], sentence: 'What a _____ day!' },
  { word: 'old', meaning: '旧的', phonetic: '/əʊld/', partOfSpeech: ['adj.'], sentence: 'This is an _____ car.' },
  { word: 'pen', meaning: '钢笔', phonetic: '/pen/', partOfSpeech: ['n.'], sentence: 'Can I borrow your _____?' },
  { word: 'quiet', meaning: '安静的', phonetic: '/ˈkwaɪət/', partOfSpeech: ['adj.'], sentence: 'Please be _____.' },
  { word: 'run', meaning: '跑', phonetic: '/rʌn/', partOfSpeech: ['v.'], sentence: 'I _____ every morning.' },
  { word: 'sun', meaning: '太阳', phonetic: '/sʌn/', partOfSpeech: ['n.'], sentence: 'The _____ rises in the east.' },
  { word: 'tree', meaning: '树', phonetic: '/triː/', partOfSpeech: ['n.'], sentence: 'Birds sit in the _____.' },
  
  { word: 'under', meaning: '在...下面', phonetic: '/ˈʌndə(r)/', partOfSpeech: ['prep.'], sentence: 'The cat is _____ the table.' },
  { word: 'very', meaning: '非常', phonetic: '/ˈveri/', partOfSpeech: ['adv.'], sentence: 'She is _____ tall.' },
  { word: 'water', meaning: '水', phonetic: '/ˈwɔːtə(r)/', partOfSpeech: ['n.'], sentence: 'I drink _____ every day.' },
  { word: 'yellow', meaning: '黄色', phonetic: '/ˈjeləʊ/', partOfSpeech: ['adj.'], sentence: 'The sun is _____.' },
  { word: 'zoo', meaning: '动物园', phonetic: '/zuː/', partOfSpeech: ['n.'], sentence: 'We went to the _____ yesterday.' },
  { word: 'big', meaning: '大的', phonetic: '/bɪɡ/', partOfSpeech: ['adj.'], sentence: 'That is a _____ house.' },
  { word: 'small', meaning: '小的', phonetic: '/smɔːl/', partOfSpeech: ['adj.'], sentence: 'This is a _____ box.' },
  { word: 'new', meaning: '新的', phonetic: '/njuː/', partOfSpeech: ['adj.'], sentence: 'I bought a _____ phone.' },
  { word: 'hot', meaning: '热的', phonetic: '/hɒt/', partOfSpeech: ['adj.'], sentence: 'The coffee is _____.' },
  { word: 'cold', meaning: '冷的', phonetic: '/kəʊld/', partOfSpeech: ['adj.'], sentence: 'It is _____ today.' },
  
  { word: 'fast', meaning: '快的', phonetic: '/fɑːst/', partOfSpeech: ['adj.'], sentence: 'He is a _____ runner.' },
  { word: 'slow', meaning: '慢的', phonetic: '/sləʊ/', partOfSpeech: ['adj.'], sentence: 'The turtle is _____.' },
  { word: 'tall', meaning: '高的', phonetic: '/tɔːl/', partOfSpeech: ['adj.'], sentence: 'He is very _____.' },
  { word: 'short', meaning: '矮的', phonetic: '/ʃɔːt/', partOfSpeech: ['adj.'], sentence: 'She is _____.' },
  { word: 'long', meaning: '长的', phonetic: '/lɒŋ/', partOfSpeech: ['adj.'], sentence: 'Her hair is _____.' },
  { word: 'read', meaning: '读', phonetic: '/riːd/', partOfSpeech: ['v.'], sentence: 'I _____ books every day.' },
  { word: 'write', meaning: '写', phonetic: '/raɪt/', partOfSpeech: ['v.'], sentence: 'Please _____ your name.' },
  { word: 'speak', meaning: '说', phonetic: '/spiːk/', partOfSpeech: ['v.'], sentence: 'Can you _____ English?' },
  { word: 'listen', meaning: '听', phonetic: '/ˈlɪsn/', partOfSpeech: ['v.'], sentence: 'Please _____ to me.' },
  { word: 'watch', meaning: '观看', phonetic: '/wɒtʃ/', partOfSpeech: ['v.'], sentence: 'I _____ TV every night.' },
  
  { word: 'play', meaning: '玩', phonetic: '/pleɪ/', partOfSpeech: ['v.'], sentence: 'Children _____ in the park.' },
  { word: 'work', meaning: '工作', phonetic: '/wɜːk/', partOfSpeech: ['v.', 'n.'], sentence: 'I _____ hard every day.' },
  { word: 'study', meaning: '学习', phonetic: '/ˈstʌdi/', partOfSpeech: ['v.'], sentence: 'I _____ English.' },
  { word: 'learn', meaning: '学习', phonetic: '/lɜːn/', partOfSpeech: ['v.'], sentence: 'We _____ something new.' },
  { word: 'teach', meaning: '教', phonetic: '/tiːtʃ/', partOfSpeech: ['v.'], sentence: 'She will _____ us math.' },
  { word: 'help', meaning: '帮助', phonetic: '/help/', partOfSpeech: ['v.'], sentence: 'Can you _____ me?' },
  { word: 'find', meaning: '找到', phonetic: '/faɪnd/', partOfSpeech: ['v.'], sentence: 'I cannot _____ my keys.' },
  { word: 'think', meaning: '思考', phonetic: '/θɪŋk/', partOfSpeech: ['v.'], sentence: 'I _____ this is right.' },
  { word: 'know', meaning: '知道', phonetic: '/nəʊ/', partOfSpeech: ['v.'], sentence: 'I _____ the answer.' },
  { word: 'understand', meaning: '理解', phonetic: '/ˌʌndəˈstænd/', partOfSpeech: ['v.'], sentence: 'Do you _____ me?' },
];

function generateDistractors(correctAnswer: string, allAnswers: string[], count = 3) {
  const distractors = allAnswers
    .filter(a => a !== correctAnswer)
    .sort(() => Math.random() - 0.5)
    .slice(0, count);
  return distractors;
}

export async function GET() {
  try {
    // 获取学生
    const student = await prisma.student.findFirst({
      where: { studentNo: '2025001' }
    });

    if (!student) {
      return NextResponse.json({
        success: false,
        error: '找不到学号为 2025001 的学生'
      }, { status: 404 });
    }

    let createdCount = 0;
    let skippedCount = 0;
    const allWords = vocabulariesData.map(v => v.word);
    const allMeanings = vocabulariesData.map(v => v.meaning);

    for (const vocabData of vocabulariesData) {
      // 检查是否已存在
      const existing = await prisma.vocabulary.findUnique({
        where: { word: vocabData.word }
      });

      if (existing) {
        skippedCount++;
        continue;
      }

      // 创建单词
      const vocabulary = await prisma.vocabulary.create({
        data: {
          word: vocabData.word,
          primaryMeaning: vocabData.meaning,
          phonetic: vocabData.phonetic,
          partOfSpeech: vocabData.partOfSpeech,
          difficulty: 'EASY',
          isHighFrequency: true,
        }
      });

      // 创建4种题型
      const questionTypes = [
        {
          type: 'ENGLISH_TO_CHINESE' as const,
          content: vocabData.word,
          correctAnswer: vocabData.meaning,
          options: [vocabData.meaning, ...generateDistractors(vocabData.meaning, allMeanings)]
        },
        {
          type: 'CHINESE_TO_ENGLISH' as const,
          content: vocabData.meaning,
          correctAnswer: vocabData.word,
          options: [vocabData.word, ...generateDistractors(vocabData.word, allWords)]
        },
        {
          type: 'LISTENING' as const,
          content: `听音选词: ${vocabData.word}`,
          correctAnswer: vocabData.word,
          options: [vocabData.word, ...generateDistractors(vocabData.word, allWords)]
        },
        {
          type: 'FILL_IN_BLANK' as const,
          content: vocabData.word,
          sentence: vocabData.sentence,
          correctAnswer: vocabData.word,
          options: [vocabData.word, ...generateDistractors(vocabData.word, allWords)]
        }
      ];

      for (const qt of questionTypes) {
        const shuffledOptions = qt.options.sort(() => Math.random() - 0.5);
        
        await prisma.question.create({
          data: {
            vocabularyId: vocabulary.id,
            type: qt.type,
            content: qt.content,
            sentence: qt.sentence,
            correctAnswer: qt.correctAnswer,
            options: {
              create: shuffledOptions.map((opt, idx) => ({
                content: opt,
                isCorrect: opt === qt.correctAnswer,
                order: idx
              }))
            }
          }
        });
      }

      // 创建学习计划和今日任务
      await prisma.studyPlan.create({
        data: {
          studentId: student.id,
          vocabularyId: vocabulary.id,
          status: 'PENDING',
          reviewCount: 0
        }
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await prisma.dailyTask.create({
        data: {
          studentId: student.id,
          vocabularyId: vocabulary.id,
          taskDate: today,
          status: 'PENDING'
        }
      });

      createdCount++;
    }

    return NextResponse.json({
      success: true,
      data: {
        created: createdCount,
        skipped: skippedCount,
        total: vocabulariesData.length,
        message: `成功创建 ${createdCount} 个单词，跳过 ${skippedCount} 个已存在的单词`
      }
    });

  } catch (error: any) {
    console.error('初始化数据失败:', error);
    return NextResponse.json({
      success: false,
      error: error.message || '初始化失败'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
