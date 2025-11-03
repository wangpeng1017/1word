// pages/index/index.js
const { get } = require('../../utils/request')
const { getStudyProgress, clearStudyProgress } = require('../../utils/storage')
const app = getApp()

Page({
  data: {
    userName: '同学',
    todayWordCount: 0,
    completedCount: 0,
    todayProgress: 0,
    masteredCount: 0,
    difficultCount: 0,
    totalStudyDays: 0,
    wrongCount: 0,
    showResumeModal: false,
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
    this.checkUnfinishedStudy()
  },

  onShow() {
    if (app.globalData.token) {
      this.loadStudyData()
    }
  },

  // 加载用户信息
  loadUserInfo() {
    const userInfo = app.globalData.userInfo
    if (userInfo) {
      this.setData({
        userName: userInfo.name || '同学',
      })
    }
  },

  // 加载学习数据
  async loadStudyData() {
    try {
      // 这里应该调用实际的API
      // 暂时使用模拟数据
      this.setData({
        todayWordCount: 20,
        completedCount: 8,
        todayProgress: 40,
        masteredCount: 156,
        difficultCount: 12,
        totalStudyDays: 15,
        wrongCount: 23,
      })

      // TODO: 实际API调用
      // const stats = await get('/students/stats')
      // this.setData({ ...stats })
    } catch (error) {
      console.error('加载学习数据失败:', error)
    }
  },

  // 检查未完成的复习
  checkUnfinishedStudy() {
    const progress = getStudyProgress()
    if (progress) {
      this.setData({
        showResumeModal: true,
      })
    }
  },

  // 关闭弹窗
  closeResumeModal() {
    this.setData({
      showResumeModal: false,
    })
  },

  // 继续复习
  resumeStudy() {
    this.setData({
      showResumeModal: false,
    })
    wx.navigateTo({
      url: '/pages/study/study?resume=true',
    })
  },

  // 重新开始
  startNewStudy() {
    clearStudyProgress()
    this.setData({
      showResumeModal: false,
    })
    this.goToStudy()
  },

  // 前往学习页面
  goToStudy() {
    wx.navigateTo({
      url: '/pages/study/study',
    })
  },

  // 前往错题本
  goToWrong() {
    wx.switchTab({
      url: '/pages/wrong/wrong',
    })
  },
})
