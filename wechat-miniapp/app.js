// app.js
const envConfig = require('./config/env.js')
const { clearAllStudyProgress } = require('./utils/storage.js')
const { initNetworkListener, syncOfflineQueue } = require('./utils/sync.js')

App({
  globalData: {
    userInfo: null,
    token: null,
    apiUrl: envConfig.apiUrl,
    debug: envConfig.debug,
    envName: envConfig.name,
  },

  onLaunch() {
    // 初始化网络监听（用于离线同步）
    initNetworkListener()

    // 检查登录状态
    const token = wx.getStorageSync('token')
    if (token) {
      this.globalData.token = token
      this.checkLoginStatus()
    }
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
          // 登录成功后，尝试同步离线数据
          syncOfflineQueue()
        } else {
          this.logout()
        }
      },
      fail: () => {
        this.logout()
      }
    })
  },

  // 登出
  logout() {
    // 清除当前用户的学习进度缓存
    clearAllStudyProgress()

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
    console.log('[DEBUG] setLoginInfo 调用 - token:', token ? '存在' : '不存在', 'userInfo:', userInfo)
    this.globalData.token = token
    this.globalData.userInfo = userInfo
    wx.setStorageSync('token', token)
    wx.setStorageSync('userInfo', userInfo)
    console.log('[DEBUG] globalData.userInfo 已设置:', this.globalData.userInfo)
  }
})
