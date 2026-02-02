// pages/agreement/agreement.js
Page({
  data: {},

  onLoad(options) {
    wx.setNavigationBarTitle({
      title: '用户服务协议'
    })
  },

  onShareAppMessage() {
    return {
      title: '智能词汇复习用户服务协议',
      path: '/pages/agreement/agreement'
    }
  }
})
