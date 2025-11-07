/**
 * 将 testword.md 转换为Excel导入文件
 * 
 * 生成的Excel可以直接在管理后台的批量导入功能中使用
 * 访问: https://11word.vercel.app/admin/questions
 * 
 * 使用方法：
 * node scripts/generate-import-excel.js
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

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
        optionLines.forEach((line, index) => {
          const match = line.match(/- ([A-D])\. (.+)/);
          if (match) {
            options.push(`${match[1]}.${match[2].trim()}`);
          }
        });
      }
      if (options.length > 0) {
        questions.push({
          type: 'CHINESE_TO_ENGLISH',
          content: meaning,
          correctAnswer: word,
          options: options.join('|'),
          sentence: ''
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
        optionLines.forEach((line, index) => {
          const match = line.match(/- ([A-D])\. (.+)/);
          if (match) {
            options.push(`${match[1]}.${match[2].trim()}`);
          }
        });
      }
      if (options.length > 0) {
        questions.push({
          type: 'ENGLISH_TO_CHINESE',
          content: `${word} /${phonetic}/`,
          correctAnswer: meaning,
          options: options.join('|'),
          sentence: ''
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
        optionLines.forEach((line, index) => {
          const match = line.match(/- ([A-D])\. (.+)/);
          if (match) {
            options.push(`${match[1]}.${match[2].trim()}`);
          }
        });
      }
      if (options.length > 0) {
        questions.push({
          type: 'FILL_IN_BLANK',
          content: sentence,
          correctAnswer: word,
          options: options.join('|'),
          sentence: sentence
        });
      }
    }
    
    // 添加听力题（需要手动上传音频）
    // 使用前3个题型的选项生成听力题选项
    if (questions.length > 0) {
      const firstOptions = questions[0].options.split('|');
      questions.push({
        type: 'LISTENING',
        content: word,
        correctAnswer: word,
        options: firstOptions.join('|'),
        sentence: ''
      });
    }
    
    vocabularies.push({
      word,
      questions
    });
  }
  
  return vocabularies;
}

async function main() {
  console.log('========================================');
  console.log('生成Excel导入文件');
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

    // 生成Excel数据
    console.log('📋 第2步：生成Excel数据...');
    const excelData = [];
    
    for (const vocab of vocabulariesData) {
      for (const question of vocab.questions) {
        excelData.push({
          word: vocab.word,
          type: question.type,
          content: question.content,
          correctAnswer: question.correctAnswer,
          options: question.options,
          sentence: question.sentence || '',
          audioUrl: question.type === 'LISTENING' ? `待上传 - ${vocab.word}.mp3` : ''
        });
      }
    }
    
    console.log(`✅ 生成 ${excelData.length} 条题目数据\n`);

    // 创建Excel文件
    console.log('📋 第3步：创建Excel文件...');
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '题目数据');
    
    // 设置列宽
    ws['!cols'] = [
      { wch: 15 },  // word
      { wch: 25 },  // type
      { wch: 50 },  // content
      { wch: 15 },  // correctAnswer
      { wch: 60 },  // options
      { wch: 50 },  // sentence
      { wch: 30 }   // audioUrl
    ];
    
    const outputPath = path.join(__dirname, '..', 'testword-import.xlsx');
    XLSX.writeFile(wb, outputPath);
    
    console.log(`✅ Excel文件已生成: ${outputPath}\n`);

    // 统计信息
    const questionsByType = excelData.reduce((acc, q) => {
      acc[q.type] = (acc[q.type] || 0) + 1;
      return acc;
    }, {});

    console.log('========================================');
    console.log('生成完成！');
    console.log('========================================');
    console.log(`📊 数据统计:`);
    console.log(`   - 词汇总数: ${vocabulariesData.length} 个`);
    console.log(`   - 题目总数: ${excelData.length} 个`);
    console.log(`   - 中译英: ${questionsByType['CHINESE_TO_ENGLISH'] || 0} 个`);
    console.log(`   - 英译中: ${questionsByType['ENGLISH_TO_CHINESE'] || 0} 个`);
    console.log(`   - 选词填空: ${questionsByType['FILL_IN_BLANK'] || 0} 个`);
    console.log(`   - 听力题: ${questionsByType['LISTENING'] || 0} 个`);
    console.log('\n📝 下一步操作:');
    console.log('1. 访问管理后台: https://11word.vercel.app/admin/questions');
    console.log('2. 点击"批量导入"按钮');
    console.log(`3. 上传生成的Excel文件: ${outputPath}`);
    console.log('4. 等待导入完成');
    console.log('\n⚠️  注意事项:');
    console.log('- 听力题的audioUrl标记为"待上传"，导入后需要手动上传音频文件');
    console.log('- 如果某些词汇已存在，导入时会提示错误，可以忽略');
    console.log('- 建议先备份现有数据再进行导入');

  } catch (error) {
    console.error('❌ 错误:', error);
    throw error;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
