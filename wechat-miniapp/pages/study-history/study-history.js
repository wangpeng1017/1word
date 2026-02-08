// pages/study-history/study-history.js
const { get } = require('../../utils/request')
const app = getApp()

Page({
  data: {
    records: [],
    filteredRecords: [],
    isLoading: true,
    isEmpty: false,

    // 时间段筛选
    periodTabs: ['今日', '本周', '本月', '全部'],
    currentPeriod: 3, // 默认全部

    // 统计数据
    stats: {
      totalSessions: 0,
      totalWords: 0,
      totalCorrect: 0,
      totalWrong: 0,
      avgAccuracy: 0,
      totalTime: 0,
    },

    // 图表数据
    chartData: {
      dates: [],
      accuracies: [],
      wordCounts: [],
    },
  },

  onLoad() {
    // 检查登录状态
    if (!app.globalData.token) {
      wx.reLaunch({
        url: '/pages/login/login',
      })
      return
    }

    this.loadStudyRecords()
  },

  onShow() {
    // 每次显示时刷新数据
    if (app.globalData.token) {
      this.loadStudyRecords()
    }
  },

  // 加载学习记录
  async loadStudyRecords() {
    try {
      wx.showLoading({ title: '加载中...' })

      const studentId = app.globalData.userInfo?.studentId
      if (!studentId) {
        throw new Error('未找到学生ID')
      }

      // 获取学习记录（最近30天）
      const records = await get(`/study-records?studentId=${studentId}&limit=100`)

      if (!records || records.length === 0) {
        this.setData({
          isLoading: false,
          isEmpty: true,
        })
        wx.hideLoading()
        return
      }

      // 按日期分组
      const groupedRecords = this.groupRecordsByDate(records)

      // 计算统计数据
      const stats = this.calculateStats(records)

      // 生成图表数据
      const chartData = this.generateChartData(groupedRecords)

      this.setData({
        records: groupedRecords,
        filteredRecords: groupedRecords,
        stats,
        chartData,
        isLoading: false,
        isEmpty: false,
      })

      wx.hideLoading()

      // 应用当前时间段筛选
      this.filterByPeriod()
    } catch (error) {
      wx.hideLoading()
      console.error('加载学习记录失败:', error)

      this.setData({
        isLoading: false,
        isEmpty: true,
      })

      wx.showToast({
        title: '加载失败',
        icon: 'none',
      })
    }
  },

  // 按日期分组
  groupRecordsByDate(records) {
    const grouped = {}

    records.forEach(record => {
      const date = new Date(record.taskDate || record.createdAt)
      const dateStr = this.formatDate(date)

      if (!grouped[dateStr]) {
        grouped[dateStr] = {
          date: dateStr,
          dateObj: date,
          records: [],
          totalWords: 0,
          totalCorrect: 0,
          totalWrong: 0,
          totalTime: 0,
        }
      }

      grouped[dateStr].records.push(record)
      grouped[dateStr].totalWords += record.totalWords || 0
      grouped[dateStr].totalCorrect += record.correctCount || 0
      grouped[dateStr].totalWrong += record.wrongCount || 0
      grouped[dateStr].totalTime += record.totalTime || 0
    })

    // 转换为数组并按日期倒序排序
    return Object.values(grouped).sort((a, b) => b.dateObj - a.dateObj)
  },

  // 计算统计数据
  calculateStats(records) {
    const totalSessions = records.length
    const totalWords = records.reduce((sum, r) => sum + (r.totalWords || 0), 0)
    const totalCorrect = records.reduce((sum, r) => sum + (r.correctCount || 0), 0)
    const totalWrong = records.reduce((sum, r) => sum + (r.wrongCount || 0), 0)
    const totalTime = records.reduce((sum, r) => sum + (r.totalTime || 0), 0)
    const avgAccuracy = (totalCorrect + totalWrong) > 0 ? Math.round((totalCorrect / (totalCorrect + totalWrong)) * 100) : 0

    return {
      totalSessions,
      totalWords,
      totalCorrect,
      totalWrong,
      avgAccuracy,
      totalTime,
    }
  },

  // 生成图表数据
  generateChartData(groupedRecords) {
    // 取最近7天的数据
    const recentRecords = groupedRecords.slice(0, 7).reverse()

    const dates = recentRecords.map(r => {
      const date = new Date(r.dateObj)
      return `${date.getMonth() + 1}/${date.getDate()}`
    })

    const accuracies = recentRecords.map(r => {
      return (r.totalCorrect + r.totalWrong) > 0 ? Math.round((r.totalCorrect / (r.totalCorrect + r.totalWrong)) * 100) : 0
    })

    const wordCounts = recentRecords.map(r => r.totalWords)

    return {
      dates,
      accuracies,
      wordCounts,
    }
  },

  // 切换时间段
  onPeriodChange(e) {
    const index = parseInt(e.detail.value)
    this.setData({ currentPeriod: index })
    this.filterByPeriod()
  },

  // 按时间段筛选
  filterByPeriod() {
    const { records, currentPeriod } = this.data
    const now = new Date()
    let filtered = []

    switch (currentPeriod) {
      case 0: // 今日
        filtered = records.filter(r => {
          const date = new Date(r.dateObj)
          return this.isSameDay(date, now)
        })
        break
      case 1: // 本周
        filtered = records.filter(r => {
          const date = new Date(r.dateObj)
          return this.isThisWeek(date, now)
        })
        break
      case 2: // 本月
        filtered = records.filter(r => {
          const date = new Date(r.dateObj)
          return this.isThisMonth(date, now)
        })
        break
      case 3: // 全部
      default:
        filtered = records
        break
    }

    // 重新计算统计数据
    const allRecords = []
    filtered.forEach(group => {
      allRecords.push(...group.records)
    })
    const stats = this.calculateStats(allRecords)

    this.setData({
      filteredRecords: filtered,
      stats,
    })
  },

  // 查看详情
  viewDetail(e) {
    const { dateIndex, recordIndex } = e.currentTarget.dataset
    const record = this.data.filteredRecords[dateIndex].records[recordIndex]

    const totalAnswered = (record.correctCount || 0) + (record.wrongCount || 0)
    const accuracy = totalAnswered > 0
      ? Math.round((record.correctCount / totalAnswered) * 100)
      : 0

    const timeStr = this.formatTime(record.totalTime || 0)

    wx.showModal({
      title: '学习详情',
      content: `学习时间：${this.formatDateTime(new Date(record.createdAt))}\n\n总题数：${record.totalWords}\n正确数：${record.correctCount}\n错误数：${record.wrongCount}\n正确率：${accuracy}%\n用时：${timeStr}`,
      showCancel: false,
      confirmText: '知道了',
    })
  },

  // 格式化日期
  formatDate(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  },

  // 格式化日期时间
  formatDateTime(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day} ${hour}:${minute}`
  },

  // 格式化时间（秒转分钟）
  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}分${secs}秒`
  },

  // 判断是否同一天
  isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
  },

  // 判断是否本周
  isThisWeek(date, now) {
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    weekStart.setHours(0, 0, 0, 0)

    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 7)

    return date >= weekStart && date < weekEnd
  },

  // 判断是否本月
  isThisMonth(date, now) {
    return date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth()
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadStudyRecords().then(() => {
      wx.stopPullDownRefresh()
    })
  },
})
