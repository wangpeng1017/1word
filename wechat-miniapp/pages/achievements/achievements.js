// pages/achievements/achievements.js
const { get } = require('../../utils/request')
const app = getApp()

// 等级定义（递增式）
const LEVEL_DEFINITIONS = [
  { level: 1, minPoints: 0, name: '初学者' },
  { level: 2, minPoints: 100, name: '入门学徒' },
  { level: 3, minPoints: 300, name: '勤奋学员' },
  { level: 4, minPoints: 600, name: '进阶达人' },
  { level: 5, minPoints: 1000, name: '词汇能手' },
  { level: 6, minPoints: 1500, name: '学习精英' },
  { level: 7, minPoints: 2100, name: '词汇大师' },
  { level: 8, minPoints: 2800, name: '语言专家' },
  { level: 9, minPoints: 3600, name: '词汇宗师' },
  { level: 10, minPoints: 4500, name: '传奇学霸' }
]

Page({
  data: {
    achievements: [],
    filteredAchievements: [],
    currentType: 'all',
    typeFilters: [
      { label: '全部', value: 'all' },
      { label: '学习', value: 'study' },
      { label: '测试', value: 'test' },
      { label: '连续', value: 'streak' },
      { label: '掌握', value: 'mastery' }
    ],
    unlockedCount: 0,
    totalCount: 0,
    totalPoints: 0,
    showUnlockAnimation: false,
    unlockedAchievement: null,
    pointsInfo: {
      totalPoints: 0,
      level: 1,
      levelName: '初学者',
      currentLevelMin: 0,
      nextLevelPoints: 100,
      pointsToNext: 100,
      progressPercent: 0
    }
  },

  onLoad() {
    this.loadAchievements()
    this.loadPointsInfo()
  },

  onShow() {
    // 每次显示时刷新数据
    this.loadAchievements()
    this.loadPointsInfo()
  },

  // 加载成就列表
  async loadAchievements() {
    try {
      wx.showLoading({ title: '加载中...' })

      const studentId = app.globalData.userInfo?.studentId
      if (!studentId) {
        wx.showToast({ title: '请先登录', icon: 'none' })
        return
      }

      const achievements = await get(`/achievements?studentId=${studentId}`)

      if (Array.isArray(achievements)) {
        const unlockedCount = achievements.filter(a => a.isUnlocked).length
        const totalCount = achievements.length
        const totalPoints = achievements
          .filter(a => a.isUnlocked)
          .reduce((sum, a) => sum + a.points, 0)
        const completionRate = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0

        this.setData({
          achievements,
          unlockedCount,
          totalCount,
          totalPoints,
          completionRate
        })

        this.filterAchievements()
      }

      wx.hideLoading()
    } catch (error) {
      wx.hideLoading()
      console.error('加载成就失败:', error)
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  // 切换类型筛选
  onTypeChange(e) {
    const type = e.currentTarget.dataset.type
    this.setData({ currentType: type })
    this.filterAchievements()
  },

  // 筛选成就
  filterAchievements() {
    const { achievements, currentType } = this.data

    let filtered = achievements
    if (currentType !== 'all') {
      filtered = achievements.filter(a => a.type === currentType)
    }

    // 已解锁的排在前面
    filtered.sort((a, b) => {
      if (a.isUnlocked && !b.isUnlocked) return -1
      if (!a.isUnlocked && b.isUnlocked) return 1
      return 0
    })

    this.setData({ filteredAchievements: filtered })
  },

  // 显示成就详情
  showDetail(e) {
    const achievement = e.currentTarget.dataset.achievement

    const conditionText = this.getConditionText(achievement.type, achievement.condition)

    wx.showModal({
      title: achievement.name,
      content: `${achievement.description}\n\n${conditionText}\n\n奖励：${achievement.points} 积分`,
      showCancel: false,
      confirmText: '知道了'
    })
  },

  // 获取条件文本
  getConditionText(type, condition) {
    switch (type) {
      case 'study':
        const parts = []
        if (condition.totalWords) {
          parts.push(`学习 ${condition.totalWords} 个单词`)
        }
        if (condition.accuracy) {
          parts.push(`正确率达到 ${(condition.accuracy * 100).toFixed(0)}%`)
        }
        return `达成条件：${parts.join('，')}`

      case 'test':
        const testParts = []
        if (condition.totalTests) {
          testParts.push(`完成 ${condition.totalTests} 次测试`)
        }
        if (condition.passRate) {
          testParts.push(`通过率达到 ${(condition.passRate * 100).toFixed(0)}%`)
        }
        if (condition.minScore) {
          testParts.push(`获得 ${condition.minScore} 分以上`)
        }
        return `达成条件：${testParts.join('，')}`

      case 'streak':
        return `达成条件：连续学习 ${condition.days} 天`

      case 'mastery':
        return `达成条件：掌握 ${condition.masteredWords} 个单词`

      default:
        return '达成条件：未知'
    }
  },

  // 获取类型标签
  getTypeLabel(type) {
    const typeMap = {
      study: '学习',
      test: '测试',
      streak: '连续',
      mastery: '掌握'
    }
    return typeMap[type] || type
  },

  // 格式化日期
  formatDate(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const month = date.getMonth() + 1
    const day = date.getDate()
    return `${month}月${day}日解锁`
  },

  // 显示解锁动画
  showUnlockAnimation(achievement) {
    this.setData({
      showUnlockAnimation: true,
      unlockedAchievement: achievement
    })

    setTimeout(() => {
      this.setData({ showUnlockAnimation: false })
    }, 3000)
  },

  // 加载积分信息
  async loadPointsInfo() {
    try {
      const studentId = app.globalData.userInfo?.studentId
      if (!studentId) return

      const res = await get(`/points?studentId=${studentId}`)
      if (res && res.points) {
        const totalPoints = res.points.totalPoints || 0
        const levelInfo = this.calculateLevelInfo(totalPoints)

        this.setData({
          pointsInfo: {
            totalPoints,
            ...levelInfo
          }
        })
      }
    } catch (error) {
      console.error('加载积分信息失败:', error)
    }
  },

  // 计算等级信息
  calculateLevelInfo(totalPoints) {
    let currentLevel = LEVEL_DEFINITIONS[0]
    let nextLevel = LEVEL_DEFINITIONS[1]

    for (let i = LEVEL_DEFINITIONS.length - 1; i >= 0; i--) {
      if (totalPoints >= LEVEL_DEFINITIONS[i].minPoints) {
        currentLevel = LEVEL_DEFINITIONS[i]
        nextLevel = LEVEL_DEFINITIONS[i + 1] || null
        break
      }
    }

    const currentLevelMin = currentLevel.minPoints
    const nextLevelPoints = nextLevel ? nextLevel.minPoints : 0
    const pointsToNext = nextLevel ? nextLevelPoints - totalPoints : 0

    let progressPercent = 0
    if (nextLevel) {
      const levelRange = nextLevelPoints - currentLevelMin
      const currentProgress = totalPoints - currentLevelMin
      progressPercent = Math.min(100, Math.round((currentProgress / levelRange) * 100))
    } else {
      progressPercent = 100
    }

    return {
      level: currentLevel.level,
      levelName: currentLevel.name,
      currentLevelMin,
      nextLevelPoints,
      pointsToNext,
      progressPercent
    }
  }
})
