/**
 * 检查数据库中题目的详细信息
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    console.log('检查数据库中的题目...\n');
    
    // 统计各类题目
    const totalQuestions = await prisma.question.count();
    console.log(`总题目数: ${totalQuestions}`);
    
    const byType = await prisma.question.groupBy({
      by: ['type'],
      _count: { type: true }
    });
    
    console.log('\n题型分布:');
    byType.forEach(item => {
      console.log(`  ${item.type}: ${item._count.type}个`);
    });
    
    // 检查第一个词汇的题目
    console.log('\n检查第一个词汇的题目:');
    const firstVocab = await prisma.vocabulary.findFirst({
      include: {
        questions: {
          include: {
            options: true
          }
        }
      }
    });
    
    if (firstVocab) {
      console.log(`\n词汇: ${firstVocab.word} (${firstVocab.primaryMeaning})`);
      console.log(`题目数量: ${firstVocab.questions.length}`);
      
      firstVocab.questions.forEach((q, idx) => {
        console.log(`\n题目 ${idx + 1}: ${q.type}`);
        console.log(`  内容: ${q.content}`);
        console.log(`  正确答案: ${q.correctAnswer}`);
        console.log(`  选项数量: ${q.options.length}`);
        q.options.forEach(opt => {
          console.log(`    ${opt.isCorrect ? '✓' : ' '} ${opt.content}`);
        });
      });
    }
    
  } catch (error) {
    console.error('错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

check();
