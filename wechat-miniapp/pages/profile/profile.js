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
      wrongCount: 0,
    },
    isLoading: true,
  },

  onLoad() {
    // 检查登录状态
    if (!app.globalData.token) {
      wx.reLaunch({
        url: '/pages/login/login',
      })
      return
    }

    this.loadUserInfo()
    this.loadStats()
  },

  onShow() {
    if (app.globalData.token) {
      this.loadStats()
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

  // 加载统计数据（来自 overview + 近7天记录）
  async loadStats() {
    try {
      const studentId = app.globalData.userInfo?.studentId
      if (!studentId) {
        return
      }

      const overview = await get(`/review-plan/${studentId}`)
      const progress = overview?.miniapp?.progress || {}

      const records = await get(`/study-records?studentId=${studentId}&limit=7`)
      const wrongCount = Array.isArray(records) ? records.reduce((sum, r) => sum + (r.wrongCount || 0), 0) : 0

      this.setData({
        stats: {
          totalWords: progress.totalWords || 0,
          masteredWords: progress.masteredWords || 0,
          difficultWords: progress.difficultWords || 0,
          studyDays: progress.consecutiveDays || 0,
          wrongCount,
        },
        isLoading: false,
      })
    } catch (error) {
      console.error('加载统计数据失败:', error)
      this.setData({ isLoading: false })
    }
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
