// 正确的复习量预测脚本 - 基于计划日期的复习链
// 无论学生是否完成学习，计划中的单词都按记忆曲线安排复习
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 艾宾浩斯复习间隔：学习后第N天需要复习
const REVIEW_DAYS_FROM_LEARNING = [1, 2, 4, 7, 15];

async function main() {
    const studentNos = ['20005', '20010'];
    const forecastDays = 60; // 足够覆盖完整的复习周期

    // 获取北京时间今天
    const beijingOffset = 8 * 60 * 60 * 1000;
    const now = new Date(new Date().getTime() + beijingOffset);
    now.setUTCHours(0, 0, 0, 0);

    console.log('='.repeat(80));
    console.log('未来' + forecastDays + '天学习任务预测 (绝对天数模式)');
    console.log('北京时间: ' + now.toISOString().split('T')[0]);
    console.log('艾宾浩斯复习日: 学习后第 ' + REVIEW_DAYS_FROM_LEARNING.join('、') + ' 天');
    console.log('='.repeat(80));

    for (const studentNo of studentNos) {
        // 获取学生信息
        const student = await prisma.students.findFirst({
            where: { student_no: studentNo },
            include: {
                user: { select: { name: true } },
                classes: { select: { name: true } }
            }
        });

        if (!student) {
            console.log('\n学生 ' + studentNo + ' 不存在');
            continue;
        }

        const studentId = student.id;

        console.log('\n' + '='.repeat(60));
        console.log('账号: ' + studentNo + ' (' + (student.user?.name || '未命名') + ') - ' + (student.classes?.name || '未分班'));
        console.log('='.repeat(60));

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

        if (!planClass || !planClass.vocabulary_packs) {
            console.log('无活跃的词汇库计划');
            continue;
        }

        const pack = planClass.vocabulary_packs;
        const planStartDate = new Date(planClass.start_date);
        planStartDate.setUTCHours(0, 0, 0, 0);

        console.log('词汇库: ' + pack.name + ' (共' + pack.totalDays + '天)');
        console.log('开始日期: ' + planStartDate.toISOString().split('T')[0]);

        // 获取已掌握的词汇ID（这些不需要再学习/复习）
        const masteredVocabIds = new Set(
            (await prisma.word_masteries.findMany({
                where: { studentId, isMastered: true },
                select: { vocabularyId: true }
            })).map(w => w.vocabularyId)
        );

        console.log('已掌握: ' + masteredVocabIds.size + ' 个');

        // ===== 核心算法：基于计划日期计算每天的新学和复习量 =====

        // 建立每日计划词汇数Map（基于词汇库计划，不受学生是否完成影响）
        const dailyPlanWords = new Map(); // date -> wordsCount

        // 遍历词汇库的每一天，计算每天计划的词汇数
        for (const packDay of pack.pack_days) {
            // 计划日期 = 开始日期 + (dayNumber - 1) 天
            const planDate = new Date(planStartDate.getTime() + (packDay.dayNumber - 1) * 24 * 60 * 60 * 1000);
            const planDateStr = planDate.toISOString().split('T')[0];

            // 计算当天计划的有效词汇数（排除已掌握的）
            const wordsCount = packDay.day_words.filter(dw => {
                const vocab = dw.vocabulary;
                return vocab &&
                    !masteredVocabIds.has(vocab.id) &&
                    vocab.questions && vocab.questions.length > 0;
            }).length;

            dailyPlanWords.set(planDateStr, wordsCount);
        }

        // 显示计划词汇安排
        console.log('计划安排:');
        for (const [date, count] of dailyPlanWords) {
            // 只显示今天之前和预测期内的
            const dateObj = new Date(date + 'T00:00:00Z');
            const diffFromToday = Math.floor((dateObj.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
            if (diffFromToday >= -7 && diffFromToday < forecastDays) {
                console.log('  - ' + date + ': ' + count + ' 词');
            }
        }

        // 模拟中断：对于钱10，假设12-23没有完成学习
        // 但这不影响复习安排，12-23的计划词汇仍会按记忆曲线安排复习
        if (studentNo === '20010') {
            console.log('\n⚠️ 模拟场景: 12-23中断学习');
            console.log('   影响: 当天新学任务未完成，但复习任务仍按计划执行');
        }

        // 计算每天的复习量
        console.log('\n--- 未来' + forecastDays + '天预测 ---');
        console.log('日期'.padEnd(12) + ' | 星期 | ' + '总计'.padStart(4) + ' | ' + '复习'.padStart(4) + ' | ' + '新学'.padStart(4) + ' | 复习来源');
        console.log('-'.repeat(90));

        for (let i = 0; i < forecastDays; i++) {
            const targetDate = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
            const targetDateStr = targetDate.toISOString().split('T')[0];
            const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
            const weekDay = weekDays[targetDate.getUTCDay()];

            // 计算当天的复习量（基于计划日期的词汇）
            let reviewWordsCount = 0;
            const reviewSources = [];

            // 检查每个复习间隔
            for (const reviewDay of REVIEW_DAYS_FROM_LEARNING) {
                // 需要在 targetDate 做第N天复习的，是在 targetDate - reviewDay 天计划学习的
                const learnDate = new Date(targetDate.getTime() - reviewDay * 24 * 60 * 60 * 1000);
                const learnDateStr = learnDate.toISOString().split('T')[0];

                // 使用计划的词汇数（不受是否完成影响）
                const wordsPlanedThatDay = dailyPlanWords.get(learnDateStr) || 0;

                if (wordsPlanedThatDay > 0) {
                    reviewWordsCount += wordsPlanedThatDay;
                    reviewSources.push(learnDateStr.slice(5) + '(' + wordsPlanedThatDay + '词,第' + reviewDay + '天)');
                }
            }

            // 获取当天的新学单词数（基于计划）
            const newWordsCount = dailyPlanWords.get(targetDateStr) || 0;

            // 总任务数
            const totalCount = reviewWordsCount + newWordsCount;

            const dayLabels = ['今天', '明天', '后天'];
            const dayLabel = i < 3 ? (' (' + dayLabels[i] + ')') : '';

            console.log(
                targetDateStr + dayLabel.padEnd(6) + ' | 周' + weekDay + ' | ' +
                String(totalCount).padStart(4) + ' | ' +
                String(reviewWordsCount).padStart(4) + ' | ' +
                String(newWordsCount).padStart(4) + ' | ' +
                (reviewSources.length > 0 ? reviewSources.join(', ') : '-')
            );

            // 如果总任务数为0，结束预测
            if (totalCount === 0) {
                console.log('\n✅ 学习计划完成！所有复习已结束。');
                break;
            }
        }
    }

    await prisma.$disconnect();
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
