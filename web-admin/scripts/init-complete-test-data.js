/**
 * 完整测试数据初始化脚本
 * 
 * 功能：
 * - 创建教师账号
 * - 创建班级
 * - 创建学生账号（3个）
 * - 添加词汇（20个常用词）
 * - 为每个词汇创建4种题型
 * - 为学生创建学习计划
 * - 生成今日任务
 * 
 * 使用方法：
 * node scripts/init-complete-test-data.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// 20个常用词汇数据
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
  { word: 'pen', meaning: '钢笔', phonetic: '/pen/', partOfSpeech: ['n.'], sentence: 'Can I borrow your _____?' },
  { word: 'run', meaning: '跑', phonetic: '/rʌn/', partOfSpeech: ['v.'], sentence: 'I _____ every morning.' },
  { word: 'sun', meaning: '太阳', phonetic: '/sʌn/', partOfSpeech: ['n.'], sentence: 'The _____ rises in the east.' },
  { word: 'tree', meaning: '树', phonetic: '/triː/', partOfSpeech: ['n.'], sentence: 'Birds sit in the _____.' },
  { word: 'water', meaning: '水', phonetic: '/ˈwɔːtə(r)/', partOfSpeech: ['n.'], sentence: 'I drink _____ every day.' },
  { word: 'yellow', meaning: '黄色', phonetic: '/ˈjeləʊ/', partOfSpeech: ['adj.'], sentence: 'The sun is _____.' },
];

// 生成干扰选项
function generateDistractors(correctAnswer, allAnswers, count = 3) {
  const distractors = allAnswers
    .filter(a => a !== correctAnswer)
    .sort(() => Math.random() - 0.5)
    .slice(0, count);
  return distractors;
}

// 创建题目选项
async function createQuestion(vocabularyId, type, content, correctAnswer, options, sentence = null) {
  return await prisma.question.create({
    data: {
      vocabularyId,
      type,
      content,
      correctAnswer,
      sentence,
      options: {
        create: options.map((opt, idx) => ({
          content: opt,
          isCorrect: opt === correctAnswer,
          order: idx
        }))
      }
    }
  });
}

async function main() {
  console.log('========================================');
  console.log('开始初始化完整测试数据...');
  console.log('========================================\n');

  try {
    // ========================================
    // 1. 创建教师账号
    // ========================================
    console.log('📋 第1步：创建教师账号...');
    
    let teacher;
    const existingTeacherUser = await prisma.user.findUnique({
      where: { email: 'teacher@test.com' }
    });

    if (existingTeacherUser) {
      console.log('⏭️  教师账号已存在，跳过创建');
      teacher = await prisma.teacher.findUnique({
        where: { userId: existingTeacherUser.id }
      });
    } else {
      const hashedPassword = await bcrypt.hash('123456', 10);
      const teacherUser = await prisma.user.create({
        data: {
          email: 'teacher@test.com',
          password: hashedPassword,
          name: '测试老师',
          role: 'TEACHER',
          isActive: true,
        }
      });

      teacher = await prisma.teacher.create({
        data: {
          userId: teacherUser.id,
          school: '测试学校',
          subject: '英语'
        }
      });
      console.log(`✅ 教师账号创建成功`);
      console.log(`   📧 邮箱: teacher@test.com`);
      console.log(`   🔑 密码: 123456\n`);
    }

    // ========================================
    // 2. 创建班级
    // ========================================
    console.log('📋 第2步：创建测试班级...');
    
    let testClass;
    const existingClass = await prisma.class.findFirst({
      where: {
        name: '测试班级（高三1班）',
        teacherId: teacher.id
      }
    });

    if (existingClass) {
      console.log('⏭️  测试班级已存在，跳过创建');
      testClass = existingClass;
    } else {
      testClass = await prisma.class.create({
        data: {
          name: '测试班级（高三1班）',
          grade: '高三',
          teacherId: teacher.id,
          isActive: true
        }
      });
      console.log(`✅ 班级创建成功：${testClass.name}\n`);
    }

    // ========================================
    // 3. 创建学生账号
    // ========================================
    console.log('📋 第3步：创建学生账号（3个）...');
    
    const students = [];
    const studentData = [
      { studentNo: '2025001', name: '张三' },
      { studentNo: '2025002', name: '李四' },
      { studentNo: '2025003', name: '王五' }
    ];

    for (const data of studentData) {
      const existingStudent = await prisma.student.findUnique({
        where: { studentNo: data.studentNo }
      });

      if (existingStudent) {
        console.log(`⏭️  学生 ${data.studentNo} 已存在，跳过创建`);
        students.push(existingStudent);
      } else {
        const hashedPassword = await bcrypt.hash('123456', 10);
        const studentUser = await prisma.user.create({
          data: {
            email: `${data.studentNo}@test.com`,
            password: hashedPassword,
            name: data.name,
            role: 'STUDENT',
            isActive: true,
          }
        });

        const student = await prisma.student.create({
          data: {
            userId: studentUser.id,
            studentNo: data.studentNo,
            classId: testClass.id,
            grade: testClass.grade
          }
        });

        students.push(student);
        console.log(`✅ 学生创建成功：${data.name} (学号: ${data.studentNo})`);
      }
    }
    console.log();

    // ========================================
    // 4. 添加词汇
    // ========================================
    console.log('📋 第4步：添加词汇（20个）...');
    
    const vocabularies = [];
    let vocabCreatedCount = 0;
    let vocabSkippedCount = 0;

    for (const vocabData of vocabulariesData) {
      const existing = await prisma.vocabulary.findUnique({
        where: { word: vocabData.word }
      });

      if (existing) {
        vocabularies.push(existing);
        vocabSkippedCount++;
        console.log(`⏭️  ${vocabData.word} 已存在`);
      } else {
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
        vocabularies.push(vocabulary);
        vocabCreatedCount++;
        console.log(`✅ ${vocabCreatedCount}. ${vocabData.word} (${vocabData.meaning})`);
      }
    }
    console.log(`   创建: ${vocabCreatedCount}个, 跳过: ${vocabSkippedCount}个\n`);

    // ========================================
    // 5. 创建题目（4种题型）
    // ========================================
    console.log('📋 第5步：为每个词汇创建题目（4种题型）...');
    
    const allWords = vocabulariesData.map(v => v.word);
    const allMeanings = vocabulariesData.map(v => v.meaning);
    let questionCount = 0;

    for (let i = 0; i < vocabularies.length; i++) {
      const vocabulary = vocabularies[i];
      const vocabData = vocabulariesData[i];

      // 检查是否已有题目
      const existingQuestions = await prisma.question.count({
        where: { vocabularyId: vocabulary.id }
      });

      if (existingQuestions >= 4) {
        console.log(`⏭️  ${vocabData.word} 已有题目，跳过`);
        continue;
      }

      // 1. 英译中题目
      const enToCnDistractors = generateDistractors(vocabData.meaning, allMeanings);
      const enToCnOptions = [vocabData.meaning, ...enToCnDistractors].sort(() => Math.random() - 0.5);
      await createQuestion(vocabulary.id, 'ENGLISH_TO_CHINESE', vocabData.word, vocabData.meaning, enToCnOptions);

      // 2. 中译英题目
      const cnToEnDistractors = generateDistractors(vocabData.word, allWords);
      const cnToEnOptions = [vocabData.word, ...cnToEnDistractors].sort(() => Math.random() - 0.5);
      await createQuestion(vocabulary.id, 'CHINESE_TO_ENGLISH', vocabData.meaning, vocabData.word, cnToEnOptions);

      // 3. 听力题
      const listeningDistractors = generateDistractors(vocabData.word, allWords);
      const listeningOptions = [vocabData.word, ...listeningDistractors].sort(() => Math.random() - 0.5);
      await createQuestion(vocabulary.id, 'LISTENING', `听音选词: ${vocabData.word}`, vocabData.word, listeningOptions);

      // 4. 填空题
      const fillBlankDistractors = generateDistractors(vocabData.word, allWords);
      const fillBlankOptions = [vocabData.word, ...fillBlankDistractors].sort(() => Math.random() - 0.5);
      await createQuestion(vocabulary.id, 'FILL_IN_BLANK', vocabData.word, vocabData.word, fillBlankOptions, vocabData.sentence);

      questionCount++;
      console.log(`✅ ${questionCount}. ${vocabData.word} - 4种题型创建完成`);
    }
    console.log();

    // ========================================
    // 6. 创建学习计划
    // ========================================
    console.log('📋 第6步：为学生创建学习计划...');
    
    let planCount = 0;
    for (const student of students) {
      for (const vocabulary of vocabularies) {
        const existingPlan = await prisma.studyPlan.findUnique({
          where: {
            studentId_vocabularyId: {
              studentId: student.id,
              vocabularyId: vocabulary.id
            }
          }
        });

        if (!existingPlan) {
          await prisma.studyPlan.create({
            data: {
              studentId: student.id,
              vocabularyId: vocabulary.id,
              status: 'PENDING',
              reviewCount: 0
            }
          });
          planCount++;
        }
      }
      console.log(`✅ 学生 ${student.studentNo}: ${vocabularies.length}个学习计划`);
    }
    console.log();

    // ========================================
    // 7. 创建今日任务
    // ========================================
    console.log('📋 第7步：生成今日任务...');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let taskCount = 0;
    for (const student of students) {
      // 为每个学生分配前10个词汇作为今日任务
      const tasksToCreate = vocabularies.slice(0, 10);
      
      for (const vocabulary of tasksToCreate) {
        const existingTask = await prisma.dailyTask.findUnique({
          where: {
            studentId_vocabularyId_taskDate: {
              studentId: student.id,
              vocabularyId: vocabulary.id,
              taskDate: today
            }
          }
        });

        if (!existingTask) {
          await prisma.dailyTask.create({
            data: {
              studentId: student.id,
              vocabularyId: vocabulary.id,
              taskDate: today,
              status: 'PENDING'
            }
          });
          taskCount++;
        }
      }
      console.log(`✅ 学生 ${student.studentNo}: 10个今日任务`);
    }

    // ========================================
    // 完成总结
    // ========================================
    console.log('\n========================================');
    console.log('🎉 测试数据初始化完成！');
    console.log('========================================\n');

    console.log('📊 数据统计：');
    console.log(`   👨‍🏫 教师: 1个`);
    console.log(`   🏫 班级: 1个`);
    console.log(`   👨‍🎓 学生: ${students.length}个`);
    console.log(`   📚 词汇: ${vocabularies.length}个`);
    console.log(`   ❓ 题目: ${vocabularies.length * 4}个 (每词4题型)`);
    console.log(`   📝 学习计划: ${students.length * vocabularies.length}个`);
    console.log(`   ✅ 今日任务: ${students.length * 10}个\n`);

    console.log('🔑 测试账号：');
    console.log('   教师账号：');
    console.log('   - 邮箱: teacher@test.com');
    console.log('   - 密码: 123456\n');
    
    console.log('   学生账号：');
    studentData.forEach(s => {
      console.log(`   - 学号: ${s.studentNo}, 姓名: ${s.name}, 密码: 123456`);
    });

    console.log('\n📱 现在可以在小程序中测试完整流程了！');
    console.log('   1. 学生登录（使用学号+密码）');
    console.log('   2. 查看今日任务（10个单词）');
    console.log('   3. 完成学习（每个单词4种题型）');
    console.log('   4. 查看学习记录和统计数据');

  } catch (error) {
    console.error('\n❌ 初始化失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('执行出错:', error);
    process.exit(1);
  });
