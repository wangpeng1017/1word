import { prisma } from './prisma'

/**
 * 检查并解锁学生的成就
 * @param studentId 学生ID
 */
export async function checkAndUnlockAchievements(studentId: string) {
  try {
    // 获取所有启用的成就
    const achievements = await prisma.achievements.findMany({
      where: { isActive: true }
    })

    // 获取学生已解锁的成就
    const unlockedAchievements = await prisma.student_achievements.findMany({
      where: { studentId },
      select: { achievementId: true }
    })

    const unlockedIds = new Set(unlockedAchievements.map(ua => ua.achievementId))

    // 检查每个未解锁的成就
    for (const achievement of achievements) {
      if (unlockedIds.has(achievement.id)) continue

      const condition = achievement.condition as any
      const isMet = await checkAchievementCondition(studentId, achievement.type, condition)

      if (isMet) {
        // 解锁成就
        await unlockAchievement(studentId, achievement.id)
      }
    }
  } catch (error) {
    console.error('检查成就失败:', error)
  }
}

/**
 * 检查成就条件是否满足
 */
async function checkAchievementCondition(
  studentId: string,
  type: string,
  condition: any
): Promise<boolean> {
  try {
    switch (type) {
      case 'study':
        return await checkStudyAchievement(studentId, condition)
      case 'test':
        return await checkTestAchievement(studentId, condition)
      case 'streak':
        return await checkStreakAchievement(studentId, condition)
      case 'mastery':
        return await checkMasteryAchievement(studentId, condition)
      default:
        return false
    }
  } catch (error) {
    console.error('检查成就条件失败:', error)
    return false
  }
}

/**
 * 检查学习类成就
 */
async function checkStudyAchievement(studentId: string, condition: any): Promise<boolean> {
  const { totalWords, accuracy } = condition

  if (totalWords) {
    const count = await prisma.study_records.count({
      where: {
        studentId,
        isCompleted: true
      }
    })

    if (count < totalWords) return false
  }

  if (accuracy) {
    const records = await prisma.study_records.findMany({
      where: {
        studentId,
        isCompleted: true
      },
      select: { accuracy: true }
    })

    if (records.length === 0) return false

    const avgAccuracy = records.reduce((sum, r) => sum + r.accuracy, 0) / records.length
    if (avgAccuracy < accuracy) return false
  }

  return true
}

/**
 * 检查测试类成就
 */
async function checkTestAchievement(studentId: string, condition: any): Promise<boolean> {
  const { totalTests, passRate, minScore } = condition

  const records = await prisma.test_records.findMany({
    where: {
      studentId,
      isCompleted: true
    }
  })

  if (totalTests && records.length < totalTests) return false

  if (passRate) {
    const passedCount = records.filter(r => {
      const test = r.proficiency_tests as any
      return r.score >= (test?.passScore || 60)
    }).length

    const rate = records.length > 0 ? passedCount / records.length : 0
    if (rate < passRate) return false
  }

  if (minScore) {
    const hasHighScore = records.some(r => r.score >= minScore)
    if (!hasHighScore) return false
  }

  return true
}

/**
 * 检查连续学习类成就
 */
async function checkStreakAchievement(studentId: string, condition: any): Promise<boolean> {
  const { days } = condition

  const streak = await prisma.study_streaks.findUnique({
    where: { studentId }
  })

  if (!streak) return false

  return streak.currentStreak >= days
}

/**
 * 检查掌握类成就
 */
async function checkMasteryAchievement(studentId: string, condition: any): Promise<boolean> {
  const { masteredWords } = condition

  const count = await prisma.word_masteries.count({
    where: {
      studentId,
      isMastered: true
    }
  })

  return count >= masteredWords
}

/**
 * 解锁成就
 */
async function unlockAchievement(studentId: string, achievementId: string) {
  try {
    // 检查是否已解锁
    const existing = await prisma.student_achievements.findUnique({
      where: {
        studentId_achievementId: {
          studentId,
          achievementId
        }
      }
    })

    if (existing) return

    // 获取成就信息
    const achievement = await prisma.achievements.findUnique({
      where: { id: achievementId }
    })

    if (!achievement) return

    // 解锁成就
    const unlockId = `sa_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    await prisma.student_achievements.create({
      data: {
        id: unlockId,
        studentId,
        achievementId
      }
    })

    // 如果有积分奖励，添加积分
    if (achievement.points > 0) {
      let studentPoints = await prisma.student_points.findUnique({
        where: { studentId }
      })

      if (!studentPoints) {
        const pointsId = `sp_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
        studentPoints = await prisma.student_points.create({
          data: {
            id: pointsId,
            studentId,
            totalPoints: 0,
            dailyPoints: 0,
            weeklyPoints: 0,
            monthlyPoints: 0,
            level: 1,
            updatedAt: new Date()
          }
        })
      }

      const newTotalPoints = studentPoints.totalPoints + achievement.points
      // 使用共享的等级计算函数
      const { calculateLevel } = await import('./constants')
      const newLevel = calculateLevel(newTotalPoints)

      await prisma.student_points.update({
        where: { studentId },
        data: {
          totalPoints: newTotalPoints,
          dailyPoints: studentPoints.dailyPoints + achievement.points,
          weeklyPoints: studentPoints.weeklyPoints + achievement.points,
          monthlyPoints: studentPoints.monthlyPoints + achievement.points,
          level: newLevel,
          updatedAt: new Date()
        }
      })

      // 记录积分历史
      const historyId = `ph_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
      await prisma.point_history.create({
        data: {
          id: historyId,
          studentId,
          points: achievement.points,
          reason: `解锁成就：${achievement.name}`,
          relatedType: 'achievement',
          relatedId: achievementId
        }
      })
    }

    console.log(`成就解锁成功: ${achievement.name} (学生: ${studentId})`)
  } catch (error) {
    console.error('解锁成就失败:', error)
  }
}
