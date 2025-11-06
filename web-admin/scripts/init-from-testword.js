/**
 * 从 testword.md 文件初始化测试数据
 * 
 * 功能：
 * - 清空现有词汇和题目
 * - 从 testword.md 解析词汇数据
 * - 创建教师、班级、学生
 * - 添加词汇和题目（支持已有的3种题型 + 听力题）
 * - 创建学习计划和今日任务
 * 
 * 使用方法：
 * node scripts/init-from-testword.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// 解析 testword.md 文件
function parseTestwordFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  // 统一换行符为 \n
  content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  const vocabularies = [];
  
  // 按 ## 分割，每个单词一个section
  const sections = content.split(/## \d+\. /);
  
  for (let i = 1; i < sections.length; i++) {
    const section = sections[i];
    const lines = section.split('\n');
    
    // 提取单词
    const word = lines[0].trim();
    if (!word) continue;
    
    // 提取释义（从第一题）
    const meaningMatch = section.match(/\*\*① (.+?)\*\*/);
    const meaning = meaningMatch ? meaningMatch[1].trim() : '';
    
    // 提取音标（从第二题）
    const phoneticMatch = section.match(/\/([^\/]+)\//);
    const phonetic = phoneticMatch ? phoneticMatch[1].trim() : '';
    
    // 提取填空句子
    const sentenceMatch = section.match(/\*\*③ 选词填空\*\*\n([^\n]+)/);
    const sentence = sentenceMatch ? sentenceMatch[1].replace(/\\_\\_\\_/g, '_____').trim() : '';
    
    // 提取三组选项
    const questions = [];
    
    // 第一题：中译英（看中文选英文）
    const q1Pattern = /\*\*① [^\*]+\*\*\s*\n((?:- [A-D]\. [^\n]+\n?)+)/;
    const q1Match = section.match(q1Pattern);
    if (q1Match) {
      const optionsText = q1Match[1];
      const options = [];
      const optionLines = optionsText.match(/- [A-D]\. [^\n]+/g);
      if (optionLines) {
        optionLines.forEach(line => {
          const match = line.match(/- [A-D]\. (.+)/);
          if (match) options.push(match[1].trim());
        });
      }
      if (options.length > 0) {
        questions.push({
          type: 'CHINESE_TO_ENGLISH',
          content: meaning,
          correctAnswer: word,
          options: options
        });
      }
    }
    
    // 第二题：英译中（看英文音标选中文）
    const q2Pattern = /\*\*② [^\*]+\*\*\s*\n((?:- [A-D]\. [^\n]+\n?)+)/;
    const q2Match = section.match(q2Pattern);
    if (q2Match) {
      const optionsText = q2Match[1];
      const options = [];
      const optionLines = optionsText.match(/- [A-D]\. [^\n]+/g);
      if (optionLines) {
        optionLines.forEach(line => {
          const match = line.match(/- [A-D]\. (.+)/);
          if (match) options.push(match[1].trim());
        });
      }
      if (options.length > 0) {
        questions.push({
          type: 'ENGLISH_TO_CHINESE',
          content: word,
          correctAnswer: meaning,
          options: options
        });
      }
    }
    
    // 第三题：填空题
    const q3Pattern = /\*\*③ 选词填空\*\*\s*\n[^\n]+\n((?:- [A-D]\. [^\n]+\n?)+)/;
    const q3Match = section.match(q3Pattern);
    if (q3Match) {
      const optionsText = q3Match[1];
      const options = [];
      const optionLines = optionsText.match(/- [A-D]\. [^\n]+/g);
      if (optionLines) {
        optionLines.forEach(line => {
          const match = line.match(/- [A-D]\. (.+)/);
          if (match) options.push(match[1].trim());
        });
      }
      if (options.length > 0) {
        questions.push({
          type: 'FILL_IN_BLANK',
          content: word,
          sentence: sentence,
          correctAnswer: word,
          options: options
        });
      }
    }
    
    vocabularies.push({
      word,
      meaning,
      phonetic: `/${phonetic}/`,
      sentence,
      questions
    });
  }
  
  return vocabularies;
}

// 生成听力题选项
function generateListeningOptions(currentWord, allWords) {
  const distractors = allWords
    .filter(w => w !== currentWord)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
  return [currentWord, ...distractors].sort(() => Math.random() - 0.5);
}

async function main() {
  console.log('========================================');
  console.log('从 testword.md 初始化测试数据');
  console.log('========================================\n');

  try {
    // 读取并解析文件
    console.log('📋 第1步：解析 testword.md 文件...');
    const testwordPath = path.join('E:', 'trae', '1单词', 'testword.md');
    const vocabulariesData = parseTestwordFile(testwordPath);
    console.log(`✅ 成功解析 ${vocabulariesData.length} 个单词\n`);

    // 清空现有词汇和题目
    console.log('📋 第2步：清空现有词汇和题目...');
    const deletedQuestions = await prisma.question.deleteMany({});
    const deletedVocabularies = await prisma.vocabulary.deleteMany({});
    console.log(`✅ 已删除 ${deletedVocabularies.count} 个词汇和 ${deletedQuestions.count} 个题目\n`);

    // 创建教师账号
    console.log('📋 第3步：创建教师账号...');
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
    }
    console.log();

    // 创建班级
    console.log('📋 第4步：创建测试班级...');
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
      console.log(`✅ 班级创建成功：${testClass.name}`);
    }
    console.log();

    // 创建学生账号
    console.log('📋 第5步：创建学生账号（3个）...');
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

    // 添加词汇和题目
    console.log('📋 第6步：添加词汇和题目...');
    const vocabularies = [];
    const allWords = vocabulariesData.map(v => v.word);
    
    for (let i = 0; i < vocabulariesData.length; i++) {
      const vocabData = vocabulariesData[i];
      
      // 创建词汇
      const vocabulary = await prisma.vocabulary.create({
        data: {
          word: vocabData.word,
          primaryMeaning: vocabData.meaning,
          phonetic: vocabData.phonetic,
          partOfSpeech: ['n.', 'v.', 'adj.'], // 默认值，可根据需要调整
          difficulty: 'MEDIUM',
          isHighFrequency: true,
        }
      });
      vocabularies.push(vocabulary);

      // 创建已有的3种题型
      for (const question of vocabData.questions) {
        await prisma.question.create({
          data: {
            vocabularyId: vocabulary.id,
            type: question.type,
            content: question.content,
            sentence: question.sentence || null,
            correctAnswer: question.correctAnswer,
            options: {
              create: question.options.map((opt, idx) => {
                // 忽略大小写比较，并处理词性标注
                const optClean = opt.toLowerCase().trim();
                const answerClean = question.correctAnswer.toLowerCase().trim();
                const isCorrect = optClean === answerClean || 
                                 opt === question.correctAnswer ||
                                 optClean.includes(answerClean) ||
                                 answerClean.includes(optClean);
                return {
                  content: opt,
                  isCorrect: isCorrect,
                  order: idx
                };
              })
            }
          }
        });
      }

      // 添加第4种题型：听力题
      const listeningOptions = generateListeningOptions(vocabData.word, allWords);
      await prisma.question.create({
        data: {
          vocabularyId: vocabulary.id,
          type: 'LISTENING',
          content: `听音选词: ${vocabData.word}`,
          correctAnswer: vocabData.word,
          options: {
            create: listeningOptions.map((opt, idx) => ({
              content: opt,
              isCorrect: opt === vocabData.word,
              order: idx
            }))
          }
        }
      });

      console.log(`✅ ${i + 1}. ${vocabData.word} (${vocabData.meaning}) - 4种题型`);
    }
    console.log();

    // 创建学习计划
    console.log('📋 第7步：为学生创建学习计划...');
    for (const student of students) {
      for (const vocabulary of vocabularies) {
        await prisma.studyPlan.create({
          data: {
            studentId: student.id,
            vocabularyId: vocabulary.id,
            status: 'PENDING',
            reviewCount: 0
          }
        });
      }
      console.log(`✅ 学生 ${student.studentNo}: ${vocabularies.length}个学习计划`);
    }
    console.log();

    // 创建今日任务（前20个词汇）
    console.log('📋 第8步：生成今日任务...');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (const student of students) {
      const tasksToCreate = vocabularies.slice(0, 20); // 前20个
      
      for (const vocabulary of tasksToCreate) {
        await prisma.dailyTask.create({
          data: {
            studentId: student.id,
            vocabularyId: vocabulary.id,
            taskDate: today,
            status: 'PENDING'
          }
        });
      }
      console.log(`✅ 学生 ${student.studentNo}: 20个今日任务`);
    }

    // 完成总结
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
    console.log(`   ✅ 今日任务: ${students.length * 20}个\n`);

    console.log('🔑 测试账号：');
    console.log('   教师账号：');
    console.log('   - 邮箱: teacher@test.com');
    console.log('   - 密码: 123456\n');
    
    console.log('   学生账号：');
    studentData.forEach(s => {
      console.log(`   - 学号: ${s.studentNo}, 姓名: ${s.name}, 密码: 123456`);
    });

    console.log('\n📱 现在可以在小程序中测试完整流程了！');
    console.log(`   - 词汇来源: testword.md (${vocabularies.length}个单词)`);
    console.log('   - 题型: 中译英、英译中、填空题、听力题');
    console.log('   - 每个学生20个今日任务');

  } catch (error) {
    console.error('\n❌ 初始化失败:', error);
    console.error('错误详情:', error.message);
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
