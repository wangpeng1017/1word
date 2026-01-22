const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 获取北京时区的今天日期
function getTodayBeijing() {
  const now = new Date();
  const offset = 8; // 北京时区 UTC+8
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 3600000 * offset);
}

async function main() {
  const phone = '13099990006';
  const today = getTodayBeijing();
  today.setHours(0, 0, 0, 0);

  console.log('\n' + '='.repeat(70));
  console.log('精确计算今日学习任务 - ' + phone);
  console.log('查询时间: ' + today.toISOString().split('T')[0]);
  console.log('='.repeat(70));

  // 1. 获取学生信息
  const user = await prisma.user.findUnique({
    where: { phone }
  });

  if (!user) {
    console.log('用户不存在');
    await prisma.$disconnect();
    return;
  }

  const student = await prisma.students.findUnique({
    where: { user_id: user.id },
    include: {
      classes: true
    }
  });

  if (!student) {
    console.log('学生信息不存在');
    await prisma.$disconnect();
    return;
  }

  console.log('\n学生: ' + user.name + ' (学号: ' + student.student_no + ')');
  console.log('班级: ' + (student.classes?.name || '未分配'));

  // 2. 获取已掌握的单词ID
  const wordMasteries = await prisma.word_masteries.findMany({
    where: {
      studentId: student.id,
      isMastered: true
    }
  });

  const masteredVocabIds = new Set(wordMasteries.map(m => m.vocabularyId));
  console.log('\n已掌握的单词数: ' + masteredVocabIds.size);

  // 3. 获取班级学习计划
  const planClass = await prisma.plan_classes.findFirst({
    where: {
      class_id: student.classes?.id,
      status: 'ACTIVE'
    },
    include: {
      vocabulary_packs: {
        include: {
          pack_days: {
            orderBy: { dayNumber: 'asc' },
            include: {
              day_words: {
                include: {
                  vocabulary: {
                    select: {
                      id: true,
                      word: true,
                      questions: { select: { id: true } }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  if (!planClass?.vocabulary_packs) {
    console.log('没有找到活跃的班级学习计划');
    await prisma.$disconnect();
    return;
  }

  const pack = planClass.vocabulary_packs;
  const startDateBeijing = new Date(planClass.start_date);
  startDateBeijing.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - startDateBeijing.getTime();
  const dayNumber = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

  console.log('\n学习计划: ' + pack.name);
  console.log('开始日期: ' + startDateBeijing.toISOString().split('T')[0]);
  console.log('今天是第 ' + dayNumber + ' 天（共' + pack.totalDays + '天）');

  // 4. 计算今日新学单词数
  let todayNewCount = 0;
  let todayNewWords = [];

  if (dayNumber >= 1 && dayNumber <= pack.totalDays) {
    const packDay = pack.pack_days.find(d => d.dayNumber === dayNumber);
    if (packDay) {
      const allNewWords = packDay.day_words.filter(dw => dw.vocabulary);
      const newWordsAfterFilter = packDay.day_words
        .filter(dw => dw.vocabulary && !masteredVocabIds.has(dw.vocabulary.id))
        .filter(dw => dw.vocabulary.questions && dw.vocabulary.questions.length > 0);

      todayNewCount = newWordsAfterFilter.length;
      todayNewWords = newWordsAfterFilter.map(dw => ({
        id: dw.vocabulary.id,
        word: dw.vocabulary.word
      }));

      console.log('\n--- 今日新学单词分析 (Day ' + dayNumber + ') ---');
      console.log('该天总单词数: ' + allNewWords.length);
      console.log('已掌握单词数: ' + (allNewWords.length - newWordsAfterFilter.length - allNewWords.filter(dw => !dw.vocabulary.questions || dw.vocabulary.questions.length === 0).length));
      console.log('无题目单词数: ' + allNewWords.filter(dw => !dw.vocabulary.questions || dw.vocabulary.questions.length === 0).length);
      console.log('今日新学单词数: ' + todayNewCount);
    }
  }

  // 5. 计算今日复习单词数（基于艾宾浩斯记忆曲线）
  const REVIEW_INTERVALS = [1, 2, 4, 7, 15];
  let todayReviewCount = 0;
  let todayReviewWords = [];
  let todayReviewWordsDetail = [];

  const newWordIds = new Set(todayNewWords.map(w => w.id));
  const seenVocabIds = new Set();

  console.log('\n--- 今日复习单词分析（艾宾浩斯曲线）---');

  for (const interval of REVIEW_INTERVALS) {
    const targetDay = dayNumber - interval;
    if (targetDay >= 1 && targetDay <= pack.totalDays) {
      const packDay = pack.pack_days.find(d => d.dayNumber === targetDay);
      if (packDay) {
        const allWords = packDay.day_words.filter(dw => dw.vocabulary);

        // 过滤条件：未掌握、不是今天新学、未重复、有题目
        const dayReviewWords = packDay.day_words
          .filter(dw => {
            if (!dw.vocabulary) return false;
            if (masteredVocabIds.has(dw.vocabulary.id)) return false;
            if (newWordIds.has(dw.vocabulary.id)) return false;
            if (seenVocabIds.has(dw.vocabulary.id)) return false;
            if (!dw.vocabulary.questions || dw.vocabulary.questions.length === 0) return false;
            return true;
          });

        dayReviewWords.forEach(dw => {
          seenVocabIds.add(dw.vocabulary.id);
          todayReviewWordsDetail.push({
            day: targetDay,
            interval: interval,
            word: dw.vocabulary.word
          });
        });

        todayReviewCount += dayReviewWords.length;

        if (dayReviewWords.length > 0) {
          console.log('第' + targetDay + '天（' + interval + '天前）: ' + dayReviewWords.length + '个');
        }
      }
    }
  }

  console.log('今日复习单词总数: ' + todayReviewCount);

  // 6. 汇总
  const totalDueCount = todayNewCount + todayReviewCount;

  console.log('\n' + '='.repeat(70));
  console.log('📊 今日学习任务汇总');
  console.log('='.repeat(70));
  console.log('✨ 今日新学: ' + todayNewCount + ' 个');
  console.log('🔄 今日复习: ' + todayReviewCount + ' 个');
  console.log('🎯 今日总计: ' + totalDueCount + ' 个');
  console.log('='.repeat(70));

  // 7. 获取今日学习记录
  const todayStart = new Date(today);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  const todayRecord = await prisma.study_records.findFirst({
    where: {
      studentId: student.id,
      taskDate: {
        gte: todayStart,
        lte: todayEnd
      }
    }
  });

  if (todayRecord) {
    console.log('\n📝 今日学习记录:');
    console.log('   总任务数: ' + todayRecord.totalWords + ' 个');
    console.log('   已完成: ' + todayRecord.completedWords + ' 个');
    console.log('   正确: ' + todayRecord.correctCount + ' 个');
    console.log('   错误: ' + todayRecord.wrongCount + ' 个');
    console.log('   用时: ' + todayRecord.totalTime + ' 秒');
  } else {
    console.log('\n📝 今日暂无学习记录');
  }

  console.log('\n' + '='.repeat(70));

  await prisma.$disconnect();
}

main()
  .catch(console.error);
