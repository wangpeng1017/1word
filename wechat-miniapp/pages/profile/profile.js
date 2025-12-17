// pages/profile/profile.js
const { get } = require('../../utils/request')
const app = getApp()

Page({
  data: {
    userInfo: null,
    stats: {
      totalWords: 0,
      masteredWords: 0,
      difficultWords: 0,
      studyDays: 0,
    },
    detailedStats: {
      accuracy: 0,
    },
    pointsInfo: {
      totalPoints: 0,
      level: 1
    },
    achievementCount: 0,
  },

  onLoad() {
    if (!app.globalData.token) {
      wx.reLaunch({
        url: '/pages/login/login',
      })
      return
    }

    this.loadUserInfo()
    this.loadStats()
    this.loadDetailedStats()
    this.loadPointsInfo()
    this.loadAchievementCount()
  },

  onShow() {
    if (app.globalData.token) {
      this.loadStats()
      this.loadPointsInfo()
      this.loadAchievementCount()
    }
  },

  // 加载用户信息
  async loadUserInfo() {
    try {
      const me = await get('/auth/me')
      if (me) {
        const merged = {
          ...(app.globalData.userInfo || {}),
          id: me.id,
          name: me.name,
          email: me.email,
          phone: me.phone,
          role: me.role,
          studentId: me.student?.id || app.globalData.userInfo?.studentId,
          teacherId: me.teacher?.id || app.globalData.userInfo?.teacherId,
          studentNo: me.student?.student_no || app.globalData.userInfo?.studentNo,
        }
        app.globalData.userInfo = merged
        this.setData({ userInfo: merged })
        return
      }
    } catch (e) {
      // ignore
    }
    const userInfo = app.globalData.userInfo
    this.setData({ userInfo })
  },

  // 加载基础统计数据（统一使用 word_masteries 作为掌握度数据源）
  async loadStats() {
    try {
      const studentId = app.globalData.userInfo?.studentId
      if (!studentId) {
        return
      }

      // 并行请求，统一使用 word_masteries 作为掌握度数据源
      const [overview, masteryData] = await Promise.all([
        get(`/review-plan/${studentId}`),
        get(`/word-mastery?studentId=${studentId}&limit=1000`)
      ])
      const progress = overview?.miniapp?.progress || {}

      // 从 word_masteries 计算真实的已掌握数和难点数
      const masteryRecords = masteryData?.records || []
      const realMasteredWords = masteryRecords.filter(m => m.masteredCount > 0).length
      const realDifficultWords = masteryRecords.filter(m => m.difficultCount > 0).length

      const records = await get(`/study-records?studentId=${studentId}&limit=7`)
      const wrongCount = Array.isArray(records) ? records.reduce((sum, r) => sum + (r.wrongCount || 0), 0) : 0

      this.setData({
        stats: {
          totalWords: progress.totalWords || 0,
          masteredWords: realMasteredWords || progress.masteredWords || 0,
          difficultWords: realDifficultWords || progress.difficultWords || 0,
          studyDays: progress.consecutiveDays || 0,
          wrongCount,
        },
      })
    } catch (error) {
      console.error('加载统计数据失败:', error)
    }
  },

  // 加载详细统计数据
  async loadDetailedStats() {
    try {
      const studentId = app.globalData.userInfo?.studentId
      if (!studentId) return

      const data = await get(`/statistics/${studentId}?period=all`)
      if (data && data.overview) {
        this.setData({
          detailedStats: {
            accuracy: data.overview.accuracy || 0,
          },
        })
      }
    } catch (error) {
      console.error('加载详细统计数据失败:', error)
    }
  },

  // 加载积分信息
  async loadPointsInfo() {
    try {
      const studentId = app.globalData.userInfo?.studentId
      if (!studentId) return

      const res = await get(`/points?studentId=${studentId}`)
      if (res && res.points) {
        this.setData({
          pointsInfo: {
            totalPoints: res.points.totalPoints || 0,
            level: res.points.level || 1
          }
        })
      }
    } catch (error) {
      console.error('加载积分信息失败:', error)
    }
  },

  // 加载成就数量
  async loadAchievementCount() {
    try {
      const studentId = app.globalData.userInfo?.studentId
      if (!studentId) return

      const achievements = await get(`/achievements?studentId=${studentId}`)
      if (Array.isArray(achievements)) {
        const unlockedCount = achievements.filter(a => a.isUnlocked).length
        this.setData({ achievementCount: unlockedCount })
      }
    } catch (error) {
      console.error('加载成就数量失败:', error)
    }
  },

  // 跳转到学习历史页面
  goToStudyHistory() {
    wx.navigateTo({
      url: '/pages/study-history/study-history'
    })
  },

  // 跳转到词汇测试页面
  goToTest() {
    wx.navigateTo({
      url: '/pages/test/test'
    })
  },

  // 跳转到成就页面
  goToAchievements() {
    wx.navigateTo({
      url: '/pages/achievements/achievements'
    })
  },

  // 退出登录
  logout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          app.globalData.token = null
          app.globalData.userInfo = null
          wx.removeStorageSync('token')
          wx.removeStorageSync('userInfo')

          wx.reLaunch({
            url: '/pages/login/login',
          })
        }
      },
    })
  },
})
