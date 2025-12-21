// 查询学生未来7天学习任务预测
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const studentNos = ['20005', '20010'];  // 学号
    const days = 7;
    const today = new Date();
    // 调整到北京时间的今天0点
    const beijingOffset = 8 * 60 * 60 * 1000;
    const now = new Date(today.getTime() + beijingOffset);
    now.setUTCHours(0, 0, 0, 0);

    console.log('='.repeat(80));
    console.log('未来7天学习任务预测 (北京时间: ' + now.toISOString().split('T')[0] + ')');
    console.log('='.repeat(80));

    for (const studentNo of studentNos) {
        // 通过学号获取学生信息
        const student = await prisma.students.findFirst({
            where: { student_no: studentNo },
            select: {
                id: true,
                student_no: true,
                class_id: true,
                user: { select: { name: true } }
            }
        });

        if (!student) {
            console.log('\n学生 ' + studentNo + ' 不存在');
            continue;
        }

        const studentId = student.id;

        console.log('\n账号: ' + studentNo + ' (' + (student.user?.name || '未命名') + ')');
        console.log('-'.repeat(60));

        // 获取未掌握的学习计划（需要复习的）
        const plans = await prisma.study_plans.findMany({
            where: {
                studentId,
                status: { not: 'MASTERED' }
            },
            select: { nextReviewAt: true, vocabularyId: true }
        });

        // 获取已学过的词汇ID
        const learnedVocabIds = new Set(
            (await prisma.study_plans.findMany({
                where: { studentId },
                select: { vocabularyId: true }
            })).map(p => p.vocabularyId)
        );

        // 获取已掌握的词汇ID
        const masteredVocabIds = new Set(
            (await prisma.word_masteries.findMany({
                where: { studentId, isMastered: true },
                select: { vocabularyId: true }
            })).map(w => w.vocabularyId)
        );

        // 获取班级的活跃词汇库计划
        const planClass = await prisma.plan_classes.findFirst({
            where: {
                class_id: student.class_id,
                status: 'ACTIVE'
            },
            include: {
                vocabulary_packs: {
                    include: {
                        pack_days: {
                            include: {
                                day_words: {
                                    include: {
                                        vocabulary: {
                                            select: {
                                                id: true,
                                                questions: { select: { id: true } }
                                            }
                                        }
                                    }
                                }
                            },
                            orderBy: { dayNumber: 'asc' }
                        }
                    }
                }
            }
        });

        console.log('学习统计:');
        console.log('   - 已学词汇: ' + learnedVocabIds.size + ' 个');
        console.log('   - 已掌握: ' + masteredVocabIds.size + ' 个');
        console.log('   - 复习池: ' + plans.length + ' 个');

        if (planClass) {
            const pack = planClass.vocabulary_packs;
            const startDate = new Date(planClass.start_date);
            console.log('   - 词汇库: ' + (pack ? pack.name : '无') + ' (开始日期: ' + startDate.toISOString().split('T')[0] + ')');
        } else {
            console.log('   - 词汇库计划: 未分配');
        }

        console.log('\n未来7天预测:');

        // 计算每天的学习量
        for (let i = 0; i < days; i++) {
            const targetDate = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
            const dateStr = targetDate.toISOString().split('T')[0];

            // 计算复习单词数（累积：所有 nextReviewAt <= targetDate 的）
            let reviewWordsCount = 0;
            for (const plan of plans) {
                if (plan.nextReviewAt && new Date(plan.nextReviewAt) <= targetDate) {
                    reviewWordsCount++;
                }
            }

            // 计算新学单词数
            let newWordsCount = 0;
            if (planClass && planClass.vocabulary_packs) {
                const pack = planClass.vocabulary_packs;
                const startDate = new Date(planClass.start_date);
                startDate.setUTCHours(0, 0, 0, 0);
                const diffTime = targetDate.getTime() - startDate.getTime();
                const dayNumber = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

                if (dayNumber >= 1 && dayNumber <= pack.totalDays) {
                    const packDay = pack.pack_days.find(d => d.dayNumber === dayNumber);
                    if (packDay) {
                        newWordsCount = packDay.day_words.filter(dw => {
                            const vocab = dw.vocabulary;
                            return vocab &&
                                !learnedVocabIds.has(vocab.id) &&
                                !masteredVocabIds.has(vocab.id) &&
                                vocab.questions && vocab.questions.length > 0;
                        }).length;
                    }
                }
            }

            const totalCount = reviewWordsCount + newWordsCount;
            const dayLabels = ['今天', '明天', '后天'];
            const dayLabel = i < 3 ? dayLabels[i] : '第' + (i + 1) + '天';
            const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
            const weekDay = weekDays[targetDate.getUTCDay()];

            console.log('   ' + dateStr + ' (周' + weekDay + ', ' + dayLabel + '): 总计 ' +
                String(totalCount).padStart(3) + ' 个单词 | 复习: ' +
                String(reviewWordsCount).padStart(3) + ' | 新学: ' +
                String(newWordsCount).padStart(2));
        }
    }

    await prisma.$disconnect();
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
