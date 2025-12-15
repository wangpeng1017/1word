/**
 * 清理 questions 表中无效的 audioUrl
 * 将非 http/https 开头的 audioUrl 设置为 null
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanInvalidAudioUrls() {
  try {
    console.log('🔍 查找无效的 audioUrl...\n');

    // 查找所有非空但无效的 audioUrl
    const invalidQuestions = await prisma.questions.findMany({
      where: {
        audioUrl: {
          not: null
        },
        NOT: [
          { audioUrl: { startsWith: 'http://' } },
          { audioUrl: { startsWith: 'https://' } }
        ]
      },
      select: {
        id: true,
        audioUrl: true,
        content: true
      }
    });

    console.log(`📊 找到 ${invalidQuestions.length} 条无效记录\n`);

    if (invalidQuestions.length === 0) {
      console.log('✅ 没有需要清理的记录');
      return;
    }

    // 显示将被清理的记录
    invalidQuestions.forEach((q, i) => {
      console.log(`[${i + 1}] ID: ${q.id}`);
      console.log(`    audioUrl: ${q.audioUrl}`);
      console.log(`    content: ${q.content?.substring(0, 50)}...`);
    });

    // 批量更新
    const result = await prisma.questions.updateMany({
      where: {
        audioUrl: {
          not: null
        },
        NOT: [
          { audioUrl: { startsWith: 'http://' } },
          { audioUrl: { startsWith: 'https://' } }
        ]
      },
      data: {
        audioUrl: null
      }
    });

    console.log(`\n✅ 已清理 ${result.count} 条记录`);

  } catch (error) {
    console.error('❌ 清理失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanInvalidAudioUrls();
