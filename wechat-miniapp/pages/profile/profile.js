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
    historyStats: {
      totalSessions: 0,
      totalWords: 0,
      avgAccuracy: 0,
      totalTimeString: '00:00',
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
    this.loadHistoryStats()
    this.loadPointsInfo()
    this.loadAchievementCount()
  },

  onShow() {
    if (app.globalData.token) {
      this.loadHistoryStats()
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

  // 加载学习历史统计数据（全部时间段）
  async loadHistoryStats() {
    try {
      const studentId = app.globalData.userInfo?.studentId
      if (!studentId) return

      // 获取全部学习记录
      const records = await get(`/study-records?studentId=${studentId}&limit=1000`)

      if (!records || records.length === 0) {
        this.setData({
          historyStats: {
            totalSessions: 0,
            totalWords: 0,
            avgAccuracy: 0,
            totalTimeString: '00:00',
          }
        })
        return
      }

      // 计算统计数据
      const totalSessions = records.length
      const totalWords = records.reduce((sum, r) => sum + (r.totalWords || 0), 0)
      const totalCorrect = records.reduce((sum, r) => sum + (r.correctCount || 0), 0)
      const totalTime = records.reduce((sum, r) => sum + (r.totalTime || 0), 0)
      const avgAccuracy = totalWords > 0 ? Math.round((totalCorrect / totalWords) * 100) : 0

      // 格式化总用时为 mm:ss 格式
      const totalMinutes = Math.floor(totalTime / 60)
      const totalSeconds = totalTime % 60
      const totalTimeString = totalMinutes.toString().padStart(2, '0') + ':' + totalSeconds.toString().padStart(2, '0')

      this.setData({
        historyStats: {
          totalSessions,
          totalWords,
          avgAccuracy,
          totalTimeString,
        }
      })
    } catch (error) {
      console.error('加载学习历史统计失败:', error)
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
