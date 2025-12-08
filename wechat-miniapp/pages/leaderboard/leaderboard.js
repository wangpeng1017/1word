// pages/leaderboard/leaderboard.js
const { get } = require('../../utils/request')
const app = getApp()

Page({
  data: {
    leaderboard: [],
    myRank: null,
    myStudentId: '',
    currentType: 'total',
    typeFilters: [
      { label: '总榜', value: 'total', icon: '🏆' },
      { label: '日榜', value: 'daily', icon: '📅' },
      { label: '周榜', value: 'weekly', icon: '📊' },
      { label: '月榜', value: 'monthly', icon: '📈' }
    ]
  },

  onLoad() {
    const studentId = app.globalData.userInfo?.studentId
    if (studentId) {
      this.setData({ myStudentId: studentId })
    }
    this.loadLeaderboard()
  },

  onShow() {
    this.loadLeaderboard()
  },

  // 加载排行榜
  async loadLeaderboard() {
    try {
      wx.showLoading({ title: '加载中...' })

      const { currentType, myStudentId } = this.data
      const leaderboard = await get(`/leaderboard?type=${currentType}&limit=50`)

      if (leaderboard && Array.isArray(leaderboard.leaderboard)) {
        // 查找我的排名
        const myRank = leaderboard.leaderboard.find(item => item.studentId === myStudentId)

        this.setData({
          leaderboard: leaderboard.leaderboard,
          myRank
        })
      }

      wx.hideLoading()
    } catch (error) {
      wx.hideLoading()
      console.error('加载排行榜失败:', error)
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  // 切换榜单类型
  onTypeChange(e) {
    const type = e.currentTarget.dataset.type
    this.setData({ currentType: type })
    this.loadLeaderboard()
  },

  // 获取排名样式类
  getRankClass(rank) {
    if (rank === 1) return 'first'
    if (rank === 2) return 'second'
    if (rank === 3) return 'third'
    return ''
  }
})
