const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixData() {
  const studentId = 'student_1765845935779_k3dvdv2g';

  console.log('=== 开始修复账号10002数据 ===');

  // 1. 删除12-17日重复的study_records（保留第一条）
  const records = await prisma.study_records.findMany({
    where: {
      studentId,
      taskDate: new Date('2025-12-17')
    },
    orderBy: { createdAt: 'asc' }
  });

  console.log('12-17日学习记录数:', records.length);

  if (records.length > 1) {
    const toDelete = records.slice(1).map(r => r.id);
    await prisma.study_records.deleteMany({
      where: { id: { in: toDelete } }
    });
    console.log('删除重复study_records:', toDelete.length, '条');
  }

  // 2. 删除12-17日重复的question_answers（保留07:12:56的，删除07:12:58的）
  const duplicateTime = new Date('2025-12-17T07:12:58.000Z');
  const deleted = await prisma.question_answers.deleteMany({
    where: {
      studentId,
      answeredAt: { gte: duplicateTime, lt: new Date('2025-12-17T07:12:59.000Z') }
    }
  });
  console.log('删除重复question_answers:', deleted.count, '条');

  // 3. 重新计算word_masteries
  const masteries = await prisma.word_masteries.findMany({
    where: { studentId }
  });

  let masteryUpdates = 0;
  for (const m of masteries) {
    // 获取该单词最近3条答题记录
    const recent = await prisma.question_answers.findMany({
      where: { studentId, vocabularyId: m.vocabularyId },
      orderBy: { answeredAt: 'desc' },
      take: 3,
      select: { isCorrect: true }
    });

    // 计算连续正确次数
    let consecutiveCorrect = 0;
    for (const r of recent) {
      if (r.isCorrect) consecutiveCorrect++;
      else break;
    }

    // 判断是否掌握（最近3次全对）
    const isMastered = recent.length >= 3 && recent.every(r => r.isCorrect);

    // 更新
    if (m.consecutiveCorrect !== consecutiveCorrect || m.isMastered !== isMastered) {
      await prisma.word_masteries.update({
        where: { id: m.id },
        data: { consecutiveCorrect, isMastered, updatedAt: new Date() }
      });
      masteryUpdates++;
    }
  }
  console.log('更新word_masteries:', masteryUpdates, '条');

  // 4. 重新计算study_plans的reviewCount
  const plans = await prisma.study_plans.findMany({
    where: { studentId }
  });

  let planUpdates = 0;
  for (const p of plans) {
    const answerCount = await prisma.question_answers.count({
      where: { studentId, vocabularyId: p.vocabularyId }
    });

    // reviewCount应该等于答题次数
    if (p.reviewCount !== answerCount) {
      const newStatus = answerCount === 0 ? 'PENDING' : 'IN_PROGRESS';

      // 检查是否已掌握
      const mastery = await prisma.word_masteries.findUnique({
        where: { studentId_vocabularyId: { studentId, vocabularyId: p.vocabularyId } }
      });
      const finalStatus = mastery && mastery.isMastered ? 'MASTERED' : newStatus;

      await prisma.study_plans.update({
        where: { id: p.id },
        data: { reviewCount: answerCount, status: finalStatus, updatedAt: new Date() }
      });
      planUpdates++;
    }
  }
  console.log('更新study_plans:', planUpdates, '条');

  console.log('=== 修复完成 ===');

  // 验证结果
  const finalMasteries = await prisma.word_masteries.findMany({
    where: { studentId, isMastered: true }
  });
  console.log('修复后已掌握数:', finalMasteries.length);
}

fixData().catch(console.error).finally(() => prisma.$disconnect());
