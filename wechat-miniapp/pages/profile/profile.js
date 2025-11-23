// pages/profile/profile.js
const { get, post } = require('../../utils/request')
const app = getApp()

Page({
  data: {
    userInfo: null,
    stats: {
      totalWords: 0,
      masteredWords: 0,
      difficultWords: 0,
      studyDays: 0,
      wrongCount: 0,
    },
    // 详细统计数据
    detailedStats: {
      totalQuestions: 0,
      correctCount: 0,
      wrongCount: 0,
      accuracy: 0,
      totalTimeSeconds: 0,
    },
    partOfSpeechStats: [],
    topWrongWords: [],
    // 时间段选择
    periodTabs: ['今日', '本周', '本月', '全部'],
    currentPeriod: 1, // 默认本周
    periodMap: ['today', 'week', 'month', 'all'],
    isLoading: true,
    isExporting: false,
  },

  onLoad() {
    // 检查登录状态
    if (!app.globalData.token) {
      wx.reLaunch({
        url: '/pages/login/login',
      })
      return
    }

    this.loadUserInfo()
    this.loadStats()
    this.loadDetailedStats()
  },

  onShow() {
    if (app.globalData.token) {
      this.loadStats()
      this.loadDetailedStats()
    }
  },

  // 切换时间段
  onPeriodChange(e) {
    const index = parseInt(e.detail.value)
    this.setData({ currentPeriod: index })
    this.loadDetailedStats()
  },

  // 加载用户信息
  async loadUserInfo() {
    try {
      const me = await get('/auth/me')
      if (me) {
        const merged = {
          ...(app.globalData.userInfo || {}),
          id: me.id,
          name: me.name,
          email: me.email,
          phone: me.phone,
          role: me.role,
          studentId: me.student?.id || app.globalData.userInfo?.studentId,
          teacherId: me.teacher?.id || app.globalData.userInfo?.teacherId,
          studentNo: me.student?.student_no || app.globalData.userInfo?.studentNo,
        }
        app.globalData.userInfo = merged
        this.setData({ userInfo: merged })
        return
      }
    } catch (e) {
      // ignore
    }
    const userInfo = app.globalData.userInfo
    this.setData({ userInfo })
  },

  // 加载基础统计数据（来自 overview）
  async loadStats() {
    try {
      const studentId = app.globalData.userInfo?.studentId
      if (!studentId) {
        return
      }

      const overview = await get(`/review-plan/${studentId}`)
      const progress = overview?.miniapp?.progress || {}

      const records = await get(`/study-records?studentId=${studentId}&limit=7`)
      const wrongCount = Array.isArray(records) ? records.reduce((sum, r) => sum + (r.wrongCount || 0), 0) : 0

      this.setData({
        stats: {
          totalWords: progress.totalWords || 0,
          masteredWords: progress.masteredWords || 0,
          difficultWords: progress.difficultWords || 0,
          studyDays: progress.consecutiveDays || 0,
          wrongCount,
        },
      })
    } catch (error) {
      console.error('加载统计数据失败:', error)
    }
  },

  // 加载详细统计数据（新接口）
  async loadDetailedStats() {
    try {
      const studentId = app.globalData.userInfo?.studentId
      if (!studentId) {
        this.setData({ isLoading: false })
        return
      }

      const period = this.data.periodMap[this.data.currentPeriod]
      const data = await get(`/statistics/${studentId}?period=${period}`)

      if (data) {
        // 处理词性统计数据
        const posStats = Object.entries(data.partOfSpeechStats || {})
          .map(([pos, count]) => ({ pos, count }))
          .sort((a, b) => b.count - a.count)

        this.setData({
          detailedStats: data.overview || {},
          partOfSpeechStats: posStats,
          topWrongWords: data.topWrongWords || [],
          isLoading: false,
        })
      }
    } catch (error) {
      console.error('加载详细统计数据失败:', error)
      this.setData({ isLoading: false })
    }
  },

  // 导出PDF报告
  async exportPDF() {
    await this.exportReport('pdf')
  },

  // 导出Word报告
  async exportWord() {
    await this.exportReport('word')
  },

  // 导出报告通用方法
  async exportReport(format) {
    const studentId = app.globalData.userInfo?.studentId
    if (!studentId) {
      wx.showToast({ title: '未找到学生信息', icon: 'none' })
      return
    }

    this.setData({ isExporting: true })

    try {
      const period = this.data.periodMap[this.data.currentPeriod]
      const result = await post(`/statistics/${studentId}/export`, {
        format,
        period,
      })

      if (result && result.downloadUrl) {
        // 复制下载链接到剪贴板
        wx.setClipboardData({
          data: `${app.globalData.baseUrl}${result.downloadUrl}`,
          success: () => {
            wx.showModal({
              title: '报告生成成功',
              content: `下载链接已复制到剪贴板，请在浏览器中打开下载。\n\n文件名: ${result.fileName}`,
              confirmText: '好的',
              showCancel: false,
            })
          },
        })
      }
    } catch (error) {
      console.error('导出报告失败:', error)
      wx.showToast({
        title: '导出失败',
        icon: 'none',
      })
    } finally {
      this.setData({ isExporting: false })
    }
  },

  // 退出登录
  logout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          app.globalData.token = null
          app.globalData.userInfo = null
          wx.removeStorageSync('token')
          wx.removeStorageSync('userInfo')

          wx.reLaunch({
            url: '/pages/login/login',
          })
        }
      },
    })
  },
})
