// pages/change-password/change-password.js
const { post } = require('../../utils/request')
const app = getApp()

Page({
  data: {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    loading: false,
  },

  onLoad() {
    if (!app.globalData.token) {
      wx.reLaunch({
        url: '/pages/login/login',
      })
    }
  },

  onCurrentPasswordInput(e) {
    this.setData({ currentPassword: e.detail.value })
  },

  onNewPasswordInput(e) {
    this.setData({ newPassword: e.detail.value })
  },

  onConfirmPasswordInput(e) {
    this.setData({ confirmPassword: e.detail.value })
  },

  async handleSubmit() {
    const { currentPassword, newPassword, confirmPassword } = this.data

    if (!currentPassword) {
      wx.showToast({ title: '请输入原密码', icon: 'none' })
      return
    }

    if (!newPassword) {
      wx.showToast({ title: '请输入新密码', icon: 'none' })
      return
    }

    if (newPassword.length < 6) {
      wx.showToast({ title: '新密码至少6位', icon: 'none' })
      return
    }

    if (!confirmPassword) {
      wx.showToast({ title: '请确认新密码', icon: 'none' })
      return
    }

    if (newPassword !== confirmPassword) {
      wx.showToast({ title: '两次密码不一致', icon: 'none' })
      return
    }

    this.setData({ loading: true })

    try {
      await post('/auth/change-password', {
        currentPassword,
        newPassword,
        confirmPassword,
      })

      wx.showToast({
        title: '密码修改成功',
        icon: 'success',
      })

      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    } catch (error) {
      console.error('修改密码失败:', error)
    } finally {
      this.setData({ loading: false })
    }
  },
})
