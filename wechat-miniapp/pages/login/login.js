// pages/login/login.js
const { post, get } = require('../../utils/request')
const app = getApp()

Page({
  data: {
    phone: '',
    password: '',
    loading: false,
    showPassword: false,  // 控制密码显示/隐藏
    // 客服二维码
    showQrcode: false,
    qrcodeUrl: '',
    hasCustomerService: false,
  },

  onLoad() {
    // 加载客服二维码配置
    this.loadCustomerService()
  },

  // 加载客服二维码
  async loadCustomerService() {
    try {
      const result = await get('/public/customer-service', false)
      if (result && result.qrcodeUrl) {
        this.setData({
          qrcodeUrl: result.qrcodeUrl,
          hasCustomerService: true
        })
      }
    } catch (error) {
      console.log('获取客服二维码失败', error)
      // 静默失败，不影响登录页面
    }
  },

  // 显示客服二维码弹窗
  showCustomerService() {
    if (!this.data.qrcodeUrl) {
      wx.showToast({
        title: '客服暂未开通',
        icon: 'none'
      })
      return
    }
    this.setData({ showQrcode: true })
  },

  // 关闭客服二维码弹窗
  hideCustomerService() {
    this.setData({ showQrcode: false })
  },

  // 预览二维码大图
  previewQrcode() {
    wx.previewImage({
      urls: [this.data.qrcodeUrl],
      current: this.data.qrcodeUrl
    })
  },

  // 保存二维码到相册
  async saveQrcode() {
    try {
      // 先获取相册权限
      const setting = await wx.getSetting()
      if (!setting.authSetting['scope.writePhotosAlbum']) {
        const authRes = await wx.authorize({ scope: 'scope.writePhotosAlbum' })
      }

      wx.showLoading({ title: '保存中...' })

      // 下载图片
      const downloadRes = await wx.downloadFile({
        url: this.data.qrcodeUrl
      })

      if (downloadRes.statusCode === 200) {
        // 保存到相册
        await wx.saveImageToPhotosAlbum({
          filePath: downloadRes.tempFilePath
        })

        wx.hideLoading()
        wx.showToast({
          title: '已保存到相册',
          icon: 'success'
        })
      } else {
        throw new Error('下载失败')
      }
    } catch (error) {
      wx.hideLoading()
      if (error.errMsg?.includes('auth deny')) {
        wx.showModal({
          title: '提示',
          content: '需要相册权限才能保存图片，请在设置中开启',
          confirmText: '去设置',
          success: (res) => {
            if (res.confirm) {
              wx.openSetting()
            }
          }
        })
      } else {
        wx.showToast({
          title: '保存失败',
          icon: 'none'
        })
      }
    }
  },

  onPhoneInput(e) {
    this.setData({
      phone: e.detail.value
    })
  },

  onPasswordInput(e) {
    this.setData({
      password: e.detail.value
    })
  },

  // 切换密码显示/隐藏
  togglePassword() {
    this.setData({
      showPassword: !this.data.showPassword
    })
  },

  async handleLogin() {
    const { phone, password } = this.data

    if (!phone) {
      wx.showToast({
        title: '请输入手机号',
        icon: 'none',
      })
      return
    }

    if (phone.length !== 11) {
      wx.showToast({
        title: '请输入11位手机号',
        icon: 'none',
      })
      return
    }

    if (!password) {
      wx.showToast({
        title: '请输入密码',
        icon: 'none',
      })
      return
    }

    this.setData({ loading: true })

    try {
      // 使用手机号登录
      const result = await post('/auth/login', {
        phone: phone,
        password: password,
      }, false)

      // 保存登录信息
      app.setLoginInfo(result.token, result.user)

      wx.showToast({
        title: '登录成功',
        icon: 'success',
      })

      // 跳转到首页（tab）
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/index/index',
        })
      }, 1500)
    } catch (error) {
      console.error('登录失败:', error)
    } finally {
      this.setData({ loading: false })
    }
  },
})
