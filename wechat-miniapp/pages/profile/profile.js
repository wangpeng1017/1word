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
  loadUserInfo() {
    const userInfo = app.globalData.userInfo
    this.setData({ userInfo })
  },

  // 加载统计数据
  async loadStats() {
    try {
      const studentId = app.globalData.userInfo?.studentId
      if (!studentId) {
        return
      }

      // TODO: 实际API调用获取统计数据
      // const stats = await get(`/students/${studentId}/stats`)
      
      // 暂时使用模拟数据
      this.setData({
        stats: {
          totalWords: 156,
          masteredWords: 89,
          difficultWords: 12,
          studyDays: 15,
          wrongCount: 23,
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
