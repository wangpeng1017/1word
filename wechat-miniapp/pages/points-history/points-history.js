// pages/points-history/points-history.js
const { get } = require('../../utils/request')
const app = getApp()

Page({
  data: {
    history: [],
    totalEarned: 0,
    historyCount: 0,
    loading: false,
    hasMore: true,
    limit: 20,
    offset: 0
  },

  onLoad() {
    this.loadHistory()
  },

  // 加载积分历史
  async loadHistory(loadMore = false) {
    if (this.data.loading) return

    try {
      this.setData({ loading: true })

      if (!loadMore) {
        wx.showLoading({ title: '加载中...' })
      }

      const studentId = app.globalData.userInfo?.studentId
      if (!studentId) {
        wx.showToast({ title: '请先登录', icon: 'none' })
        return
      }

      const { limit, offset } = this.data
      const res = await get(`/points/history?studentId=${studentId}&limit=${limit}&offset=${offset}`)

      if (res && Array.isArray(res.history)) {
        const newHistory = loadMore ? [...this.data.history, ...res.history] : res.history

        // 计算累计获得积分（只计算正数）
        const totalEarned = newHistory
          .filter(h => h.points > 0)
          .reduce((sum, h) => sum + h.points, 0)

        this.setData({
          history: newHistory,
          totalEarned,
          historyCount: res.total || newHistory.length,
          hasMore: newHistory.length < (res.total || 0),
          offset: newHistory.length
        })
      }

      wx.hideLoading()
      this.setData({ loading: false })
    } catch (error) {
      wx.hideLoading()
      this.setData({ loading: false })
      console.error('加载积分历史失败:', error)
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  // 加载更多
  loadMore() {
    if (!this.data.hasMore || this.data.loading) return
    this.loadHistory(true)
  },

  // 获取类型标签
  getTypeLabel(type) {
    const typeMap = {
      study_record: '学习',
      test_record: '测试',
      achievement: '成就',
      daily_bonus: '每日奖励',
      streak_bonus: '连续奖励'
    }
    return typeMap[type] || type
  },

  // 格式化日期
  formatDate(dateStr) {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    // 一分钟内
    if (diff < 60 * 1000) {
      return '刚刚'
    }

    // 一小时内
    if (diff < 60 * 60 * 1000) {
      const minutes = Math.floor(diff / (60 * 1000))
      return `${minutes}分钟前`
    }

    // 一天内
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000))
      return `${hours}小时前`
    }

    // 一周内
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const days = Math.floor(diff / (24 * 60 * 60 * 1000))
      return `${days}天前`
    }

    // 超过一周，显示具体日期
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hour = date.getHours()
    const minute = date.getMinutes()
    return `${month}月${day}日 ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
  }
})
