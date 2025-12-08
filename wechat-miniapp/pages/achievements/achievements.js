// pages/achievements/achievements.js
const { get } = require('../../utils/request')
const app = getApp()

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
    unlockedAchievement: null
  },

  onLoad() {
    this.loadAchievements()
  },

  onShow() {
    // 每次显示时刷新数据
    this.loadAchievements()
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
        const totalPoints = achievements
          .filter(a => a.isUnlocked)
          .reduce((sum, a) => sum + a.points, 0)

        this.setData({
          achievements,
          unlockedCount,
          totalCount: achievements.length,
          totalPoints
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
  }
})
