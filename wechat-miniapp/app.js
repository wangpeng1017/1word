// app.js
const envConfig = require('./config/env.js')

App({
  globalData: {
    userInfo: null,
    token: null,
    apiUrl: envConfig.apiUrl, // 从环境配置读取API地址
    debug: envConfig.debug,
    envName: envConfig.name,
  },

  onLaunch() {
    // 检查登录状态
    const token = wx.getStorageSync('token')
    if (token) {
      this.globalData.token = token
      this.checkLoginStatus()
    }

    // 检查是否有未完成的复习
    this.checkUnfinishedStudy()
  },

  // 检查登录状态
  checkLoginStatus() {
    wx.request({
      url: `${this.globalData.apiUrl}/auth/me`,
      header: {
        'Authorization': `Bearer ${this.globalData.token}`
      },
      success: (res) => {
        if (res.data.success) {
          this.globalData.userInfo = res.data.data
        } else {
          // Token无效，清除登录信息
          this.logout()
        }
      },
      fail: () => {
        this.logout()
      }
    })
  },

  // 检查未完成的复习
  checkUnfinishedStudy() {
    const unfinishedSession = wx.getStorageSync('currentSession')
    if (unfinishedSession) {
      const { startTime } = unfinishedSession
      const now = Date.now()
      const timeout = 24 * 60 * 60 * 1000 // 24小时

      if (now - startTime > timeout) {
        // 超时，标记为中断
        wx.setStorageSync('interruptedSession', unfinishedSession)
        wx.removeStorageSync('currentSession')
      }
    }
  },

  // 登出
  logout() {
    this.globalData.token = null
    this.globalData.userInfo = null
    wx.removeStorageSync('token')
    wx.removeStorageSync('userInfo')
    wx.reLaunch({
      url: '/pages/login/login'
    })
  },

  // 设置登录信息
  setLoginInfo(token, userInfo) {
    this.globalData.token = token
    this.globalData.userInfo = userInfo
    wx.setStorageSync('token', token)
    wx.setStorageSync('userInfo', userInfo)
  }
})
