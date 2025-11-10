// pages/login/login.js
const { post } = require('../../utils/request')
const app = getApp()

Page({
  data: {
    studentNo: '',
    password: '',
    loading: false,
  },

  onStudentNoInput(e) {
    this.setData({
      studentNo: e.detail.value
    })
  },

  onPasswordInput(e) {
    this.setData({
      password: e.detail.value
    })
  },

  async handleLogin() {
    const { studentNo, password } = this.data

    if (!studentNo) {
      wx.showToast({
        title: '请输入学号',
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
      // 使用学号作为phone字段登录
      const result = await post('/auth/login', {
        phone: studentNo,
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
