// pages/badges/badges.js
const { get } = require('../../utils/request')
const app = getApp()

Page({
    data: {
        badges: [],
        unlockedCount: 0,
        totalCount: 0,
        completionRate: 0,
    },

    onLoad() {
        this.loadBadges()
    },

    async loadBadges() {
        try {
            wx.showLoading({ title: '加载中...' })

            const studentId = app.globalData.userInfo?.studentId
            if (!studentId) {
                wx.showToast({ title: '请先登录', icon: 'none' })
                return
            }

            const res = await get(`/students/${studentId}/badges`)

            if (res && res.success && res.data) {
                const { all, unlockedCount, totalCount } = res.data
                const completionRate = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0

                this.setData({
                    badges: all,
                    unlockedCount,
                    totalCount,
                    completionRate,
                })
            }

            wx.hideLoading()
        } catch (error) {
            wx.hideLoading()
            console.error('加载勋章失败:', error)
            wx.showToast({ title: '加载失败', icon: 'none' })
        }
    },

    showBadgeDetail(e) {
        const badge = e.currentTarget.dataset.badge

        const status = badge.isUnlocked ? '已解锁' : '未解锁'
        const unlockTime = badge.unlockedAt
            ? `\n解锁时间: ${new Date(badge.unlockedAt).toLocaleDateString()}`
            : ''

        wx.showModal({
            title: badge.name,
            content: `${badge.description}\n\n稀有度: ${this.getRarityText(badge.rarity)}\n状态: ${status}${unlockTime}`,
            showCancel: false,
            confirmText: '知道了',
        })
    },

    getRarityText(rarity) {
        const map = {
            COMMON: '普通',
            RARE: '稀有',
            EPIC: '史诗',
            LEGENDARY: '传说',
        }
        return map[rarity] || rarity
    },
})
