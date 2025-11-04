// pages/study/result.js
Page({
  data: {
    correct: 0,
    wrong: 0,
    total: 0,
    accuracy: 0,
  },

  onLoad(options) {
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
  },

  // 查看错题
  viewWrongQuestions() {
    wx.switchTab({
      url: '/pages/wrong/wrong',
    })
  },

  // 返回首页
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
