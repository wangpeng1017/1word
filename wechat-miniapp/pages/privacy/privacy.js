// pages/privacy/privacy.js
Page({
  data: {},

  onLoad(options) {
    wx.setNavigationBarTitle({
      title: '隐私政策'
    })
  },

  onShareAppMessage() {
    return {
      title: '智能词汇复习隐私政策',
      path: '/pages/privacy/privacy'
    }
  }
})
