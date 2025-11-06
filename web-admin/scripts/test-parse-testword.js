/**
 * 测试解析 testword.md 文件
 */

const fs = require('fs');
const path = require('path');

function parseTestwordFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const vocabularies = [];
  
  // 按 ## 分割，每个单词一个section
  const sections = content.split(/## \d+\. /);
  
  console.log(`总共找到 ${sections.length - 1} 个section\n`);
  
  // 只解析第一个单词作为测试
  for (let i = 1; i <= 1; i++) {
    const section = sections[i];
    const lines = section.split('\n');
    
    console.log('='.repeat(50));
    console.log('解析单词:', lines[0].trim());
    console.log('='.repeat(50));
    
    // 提取单词
    const word = lines[0].trim();
    console.log('单词:', word);
    
    // 提取释义（从第一题）
    const meaningMatch = section.match(/\*\*① (.+?)\*\*/);
    const meaning = meaningMatch ? meaningMatch[1] : '';
    console.log('释义:', meaning);
    
    // 提取音标（从第二题）
    const phoneticMatch = section.match(/\*\*② (.+?)\/(.+?)\//);
    const phonetic = phoneticMatch ? phoneticMatch[2] : '';
    console.log('音标:', phonetic);
    
    // 提取填空句子
    const sentenceMatch = section.match(/\*\*③ 选词填空\*\*\n(.+?)\n/);
    const sentence = sentenceMatch ? sentenceMatch[1].replace(/\\_\\_\\_/g, '_____') : '';
    console.log('句子:', sentence);
    
    // 提取三组选项
    const questions = [];
    
    // 第一题：中译英（看中文选英文）
    console.log('\n--- 解析第1题（中译英）---');
    const q1Match = section.match(/\*\*① .+?\*\*\n((?:- [A-D]\. .+?\n)+)/);
    if (q1Match) {
      console.log('找到第1题选项区域');
      const options = q1Match[1].match(/- ([A-D])\. (.+)/g);
      console.log('选项数量:', options ? options.length : 0);
      if (options) {
        options.forEach(opt => {
          console.log('  ', opt);
        });
      }
    } else {
      console.log('未找到第1题');
    }
    
    // 第二题：英译中（看英文音标选中文）
    console.log('\n--- 解析第2题（英译中）---');
    const q2Match = section.match(/\*\*② .+?\*\*\n((?:- [A-D]\. .+?\n)+)/);
    if (q2Match) {
      console.log('找到第2题选项区域');
      const options = q2Match[1].match(/- ([A-D])\. (.+)/g);
      console.log('选项数量:', options ? options.length : 0);
      if (options) {
        options.forEach(opt => {
          console.log('  ', opt);
        });
      }
    } else {
      console.log('未找到第2题');
    }
    
    // 第三题：填空题
    console.log('\n--- 解析第3题（填空题）---');
    const q3Match = section.match(/\*\*③ 选词填空\*\*\n.+?\n((?:- [A-D]\. .+?\n)+)/);
    if (q3Match) {
      console.log('找到第3题选项区域');
      const options = q3Match[1].match(/- ([A-D])\. (.+)/g);
      console.log('选项数量:', options ? options.length : 0);
      if (options) {
        options.forEach(opt => {
          console.log('  ', opt);
        });
      }
    } else {
      console.log('未找到第3题');
    }
    
    console.log('\n');
  }
}

const testwordPath = path.join('E:', 'trae', '1单词', 'testword.md');
parseTestwordFile(testwordPath);
