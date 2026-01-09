// pages/redeem/redeem.js
const { get, post } = require('../../utils/request')
const app = getApp()

Page({
    data: {
        achievements: [],
        currentPoints: 0,
    },

    onLoad() {
        this.loadRedeemableAchievements()
    },

    onShow() {
        this.loadRedeemableAchievements()
    },

    async loadRedeemableAchievements() {
        try {
            wx.showLoading({ title: '加载中...' })

            const studentId = app.globalData.userInfo?.studentId
            if (!studentId) {
                wx.showToast({ title: '请先登录', icon: 'none' })
                return
            }

            const res = await get(`/achievements/redeem?studentId=${studentId}`)

            if (res && res.success && res.data) {
                this.setData({
                    achievements: res.data.achievements || [],
                    currentPoints: res.data.currentPoints || 0,
                })
            }

            wx.hideLoading()
        } catch (error) {
            wx.hideLoading()
            console.error('加载可兑换成就失败:', error)
            wx.showToast({ title: '加载失败', icon: 'none' })
        }
    },

    redeemAchievement(e) {
        const { id, cost, name } = e.currentTarget.dataset

        wx.showModal({
            title: '确认兑换',
            content: `确定要花费 ${cost} 积分兑换「${name}」吗?`,
            success: async (res) => {
                if (res.confirm) {
                    await this.doRedeem(id)
                }
            },
        })
    },

    async doRedeem(achievementId) {
        try {
            wx.showLoading({ title: '兑换中...' })

            const studentId = app.globalData.userInfo?.studentId
            const res = await post('/achievements/redeem', {
                studentId,
                achievementId,
            })

            wx.hideLoading()

            if (res && res.success) {
                wx.showToast({
                    title: '兑换成功!',
                    icon: 'success',
                })

                // 刷新列表
                setTimeout(() => {
                    this.loadRedeemableAchievements()
                }, 1500)
            } else {
                wx.showToast({
                    title: res.error || '兑换失败',
                    icon: 'none',
                })
            }
        } catch (error) {
            wx.hideLoading()
            console.error('兑换失败:', error)
            wx.showToast({
                title: error.message || '兑换失败',
                icon: 'none',
            })
        }
    },
})
