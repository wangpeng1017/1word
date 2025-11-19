// pages/study/result.js
const { get } = require('../../utils/request')
const app = getApp()
Page({
  data: {
    correct: 0,
    wrong: 0,
    total: 0,
    accuracy: 0,
    timeSeconds: 0,
    timeString: '00:00',
  },

  async onLoad(options) {
    const correct = parseInt(options.correct || 0)
    const wrong = parseInt(options.wrong || 0)
    const total = parseInt(options.total || 0)
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0

    this.setData({
      correct,
      wrong,
      total,
      accuracy,
    })

    // 与首页保持一致：从概览获取今日累计用时
    try {
      const studentId = app.globalData.userInfo?.studentId
      if (studentId) {
        const data = await get(`/review-plan/${studentId}`)
        const ts = data?.miniapp?.today?.timeSpentSeconds || 0
        this.setData({
          timeSeconds: ts,
          timeString: this.formatTime(ts)
        })
      }
    } catch (e) { }
  },

  formatTime(seconds) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  },

  // 查看错题（tab）
  viewWrongQuestions() {
    wx.switchTab({
      url: '/pages/wrong/wrong',
    })
  },

  // 返回首页（tab）
  backToHome() {
    wx.switchTab({
      url: '/pages/index/index',
    })
  },

  // 继续学习
  continueStudy() {
    wx.redirectTo({
      url: '/pages/study/study',
    })
  },
})
