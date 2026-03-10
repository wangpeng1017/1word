<script>
import { clearAllStudyProgress } from './utils/storage.js'

export default {
  globalData: {
    userInfo: null,
    token: null,
    apiUrl: 'http://47.92.96.143:3000',
    debug: true,
    isGuest: false,
    statusBarHeight: 0,
  },
  onLaunch: function () {
    console.log('App Launch')
    
    // 获取系统状态栏高度
    const sysInfo = uni.getSystemInfoSync()
    this.globalData.statusBarHeight = sysInfo.statusBarHeight || 0
    
    // 检查本地存储的登录态
    const token = uni.getStorageSync('token')
    const userInfo = uni.getStorageSync('userInfo')
    
    if (token) {
      this.globalData.token = token
      this.globalData.userInfo = userInfo
      this.checkLoginStatus()
    }
  },
  onShow: function () {
    console.log('App Show')
  },
  onHide: function () {
    console.log('App Hide')
  },
  methods: {
    checkLoginStatus() {
      if (this.globalData.isGuest) return

      uni.request({
        url: `${this.globalData.apiUrl}/auth/me`,
        header: {
          'Authorization': `Bearer ${this.globalData.token}`
        },
        success: (res) => {
          if (res.data.success) {
            this.globalData.userInfo = res.data.data
            uni.setStorageSync('userInfo', res.data.data)
          } else {
            this.logout()
          }
        },
        fail: () => {
          // 网络错误时不强制登出，可能只是暂时没网
          console.error('Check login status failed')
        }
      })
    },
    logout() {
      clearAllStudyProgress()
      this.globalData.token = null
      this.globalData.userInfo = null
      uni.removeStorageSync('token')
      uni.removeStorageSync('userInfo')
      uni.reLaunch({
        url: '/pages/login/login'
      })
    },
    setLoginInfo(token, userInfo) {
      this.globalData.token = token
      this.globalData.userInfo = userInfo
      uni.setStorageSync('token', token)
      uni.setStorageSync('userInfo', userInfo)
    }
  }
}
</script>

<style>
/*每个页面公共css */
</style>
