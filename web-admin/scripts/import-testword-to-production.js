/**
 * 安全地将 testword.md 数据导入到生产环境
 * 
 * 特性：
 * - 不删除现有数据
 * - 跳过已存在的词汇
 * - 仅添加新词汇和题目
 * - 支持幂等操作（可重复运行）
 * 
 * 使用方法：
 * node scripts/import-testword-to-production.js
 */

const fs = require('fs');
const path = require('path');

// 使用绝对路径导入 prisma 实例
const prismaPath = path.join(__dirname, '..', 'lib', 'prisma.ts');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 解析 testword.md 文件
function parseTestwordFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  const vocabularies = [];
  const sections = content.split(/## \d+\. /);
  
  for (let i = 1; i < sections.length; i++) {
    const section = sections[i];
    const lines = section.split('\n');
    
    const word = lines[0].trim();
    if (!word) continue;
    
    // 提取释义
    const meaningMatch = section.match(/\*\*① (.+?)\*\*/);
    const meaning = meaningMatch ? meaningMatch[1].trim() : '';
    
    // 提取音标
    const phoneticMatch = section.match(/\/([^\/]+)\//);
    const phonetic = phoneticMatch ? phoneticMatch[1].trim() : '';
    
    // 提取填空句子
    const sentenceMatch = section.match(/\*\*③ 选词填空\*\*\n([^\n]+)/);
    const sentence = sentenceMatch ? sentenceMatch[1].replace(/___/g, '_____').trim() : '';
    
    const questions = [];
    
    // 第一题：中译英
    const q1Pattern = /\*\*① [^\*]+\*\*\s*\n((?:- [A-D]\. [^\n]+\n?)+)/;
    const q1Match = section.match(q1Pattern);
    if (q1Match) {
      const options = [];
      const optionLines = q1Match[1].match(/- [A-D]\. [^\n]+/g);
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
    
    // 第二题：英译中
    const q2Pattern = /\*\*② [^\*]+\*\*\s*\n((?:- [A-D]\. [^\n]+\n?)+)/;
    const q2Match = section.match(q2Pattern);
    if (q2Match) {
      const options = [];
      const optionLines = q2Match[1].match(/- [A-D]\. [^\n]+/g);
      if (optionLines) {
        optionLines.forEach(line => {
          const match = line.match(/- [A-D]\. (.+)/);
          if (match) options.push(match[1].trim());
        });
      }
      if (options.length > 0) {
        questions.push({
          type: 'ENGLISH_TO_CHINESE',
          content: `${word} /${phonetic}/`,
          correctAnswer: meaning,
          options: options
        });
      }
    }
    
    // 第三题：填空题
    const q3Pattern = /\*\*③ 选词填空\*\*\s*\n[^\n]+\n((?:- [A-D]\. [^\n]+\n?)+)/;
    const q3Match = section.match(q3Pattern);
    if (q3Match) {
      const options = [];
      const optionLines = q3Match[1].match(/- [A-D]\. [^\n]+/g);
      if (optionLines) {
        optionLines.forEach(line => {
          const match = line.match(/- [A-D]\. (.+)/);
          if (match) options.push(match[1].trim());
        });
      }
      if (options.length > 0) {
        questions.push({
          type: 'FILL_IN_BLANK',
          content: sentence,
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
  console.log('导入 testword.md 到生产环境');
  console.log('========================================\n');

  try {
    // 读取并解析文件
    console.log('📋 第1步：解析 testword.md 文件...');
    const testwordPath = path.join('E:', 'trae', '1单词', 'testword.md');
    
    if (!fs.existsSync(testwordPath)) {
      console.error('❌ 错误：找不到文件', testwordPath);
      process.exit(1);
    }
    
    const vocabulariesData = parseTestwordFile(testwordPath);
    console.log(`✅ 成功解析 ${vocabulariesData.length} 个单词\n`);

    // 统计信息
    let addedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const allWords = vocabulariesData.map(v => v.word);

    // 逐个处理词汇
    console.log('📋 第2步：导入词汇和题目...\n');
    
    for (const vocabData of vocabulariesData) {
      try {
        // 检查词汇是否已存在
        const existing = await prisma.vocabulary.findUnique({
          where: { word: vocabData.word }
        });

        if (existing) {
          console.log(`⏭️  跳过已存在的词汇: ${vocabData.word}`);
          skippedCount++;
          continue;
        }

        // 创建词汇
        const vocabulary = await prisma.vocabulary.create({
          data: {
            word: vocabData.word,
            partOfSpeech: 'n.,v.,adj.',
            primaryMeaning: vocabData.meaning,
            phonetic: vocabData.phonetic,
            isHighFrequency: true,
            difficulty: 'MEDIUM'
          }
        });

        // 创建题目
        let questionCount = 0;
        
        // 创建前3种题型
        for (const questionData of vocabData.questions) {
          // 随机打乱选项
          const shuffledOptions = [...questionData.options].sort(() => Math.random() - 0.5);
          
          await prisma.question.create({
            data: {
              vocabularyId: vocabulary.id,
              type: questionData.type,
              content: questionData.content,
              sentence: questionData.sentence,
              correctAnswer: questionData.correctAnswer,
              options: {
                create: shuffledOptions.map((opt, index) => ({
                  content: opt,
                  isCorrect: opt === questionData.correctAnswer,
                  order: index
                }))
              }
            }
          });
          questionCount++;
        }

        // 创建听力题
        const listeningOptions = generateListeningOptions(vocabData.word, allWords);
        await prisma.question.create({
          data: {
            vocabularyId: vocabulary.id,
            type: 'LISTENING',
            content: vocabData.word,
            audioUrl: null, // 需要后续上传音频
            correctAnswer: vocabData.word,
            options: {
              create: listeningOptions.map((opt, index) => ({
                content: opt,
                isCorrect: opt === vocabData.word,
                order: index
              }))
            }
          }
        });
        questionCount++;

        console.log(`✅ 添加词汇: ${vocabData.word} (${questionCount}个题目)`);
        addedCount++;

      } catch (error) {
        console.error(`❌ 导入失败: ${vocabData.word} - ${error.message}`);
        errorCount++;
      }
    }

    // 总结
    console.log('\n========================================');
    console.log('导入完成！');
    console.log('========================================');
    console.log(`✅ 成功添加: ${addedCount} 个词汇 (${addedCount * 4} 个题目)`);
    console.log(`⏭️  跳过已存在: ${skippedCount} 个词汇`);
    if (errorCount > 0) {
      console.log(`❌ 导入失败: ${errorCount} 个词汇`);
    }
    console.log('\n提示：');
    console.log('- 听力题的音频URL为空，需要手动上传音频文件');
    console.log('- 可以在管理后台查看和编辑题目: https://11word.vercel.app/admin/questions');
    console.log('- 如需更新已存在的词汇，请在管理后台手动编辑');

  } catch (error) {
    console.error('❌ 错误:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
