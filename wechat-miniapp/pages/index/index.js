// pages/index/index.js
const { get, post } = require('../../utils/request')
const { getStudyProgress, clearStudyProgress, getSyncQueue, clearSyncQueue } = require('../../utils/storage')
const app = getApp()

Page({
  data: {
    state: 'loading', // loading | ready | empty | error
    dateStr: '',
    overview: {},
    progressPercent: 0,
    nextReviewHint: '',
    defaultCover: 'https://dummyimage.com/120x160/EEF3FF/2F6BFF.png&text=BOOK',
    hasUnfinishedProgress: false,
    unfinishedCount: 0,
  },

  onLoad() {
    if (!app.globalData.token) {
      wx.reLaunch({ url: '/pages/login/login' })
      return
    }
    this.init()
  },

  onShow() {
    if (app.globalData.token) {
      this.init()
      // 尝试同步离线数据
      this.syncOfflineData()
    }
  },

  onPullDownRefresh() {
    this.init().finally(() => wx.stopPullDownRefresh())
  },

  async init() {
    this.setData({ state: 'loading', dateStr: this.formatDate(new Date()) })

    // 检查是否有未完成的进度
    this.checkUnfinishedProgress()

    try {
      const ov = await this.getTodayOverview()
      if (!ov) {
        this.setData({ state: 'empty', nextReviewHint: this.calcNextReviewHint() })
        return
      }
      if (ov.dueCount === 0 || (ov.reviewedCount >= ov.dueCount && ov.dueCount > 0)) {
        this.setData({ state: 'empty', nextReviewHint: this.calcNextReviewHint(), overview: ov, progressPercent: 100 })
        return
      }
      const percent = Math.min(100, Math.floor((ov.reviewedCount / ov.dueCount) * 100))
      this.setData({ overview: ov, progressPercent: percent, state: 'ready' })
    } catch (e) {
      console.error('加载首页信息失败', e)
      this.setData({ state: 'error' })
    }
  },

  // 检查是否有未完成的进度
  checkUnfinishedProgress() {
    const saved = getStudyProgress()
    if (!saved) {
      this.setData({ hasUnfinishedProgress: false, unfinishedCount: 0 })
      return
    }

    // 检查是否是今天的进度
    const savedDate = saved.timestamp ? new Date(saved.timestamp).toDateString() : null
    const today = new Date().toDateString()

    if (savedDate !== today) {
      // 跨天进度，清除
      clearStudyProgress()
      this.setData({ hasUnfinishedProgress: false, unfinishedCount: 0 })
      return
    }

    // 计算未完成的数量
    const totalTasks = saved.tasks?.length || 0
    const answeredCount = saved.answers?.length || 0
    const remainingCount = totalTasks - answeredCount

    if (remainingCount > 0 && answeredCount > 0) {
      this.setData({
        hasUnfinishedProgress: true,
        unfinishedCount: remainingCount,
      })

      // 弹窗提示继续学习（可关闭）
      wx.showModal({
        title: '发现未完成的复习',
        content: `您有 ${remainingCount} 个单词未完成复习`,
        confirmText: '继续学习',
        cancelText: '稍后再说',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/study/study?resume=true' })
          }
          // 点击"稍后再说"不做任何操作，用户可以手动点击开始复习
        }
      })
    } else {
      this.setData({ hasUnfinishedProgress: false, unfinishedCount: 0 })
    }
  },

  // 同步离线数据
  async syncOfflineData() {
    const syncQueue = getSyncQueue()
    if (!syncQueue || syncQueue.length === 0) return

    console.log(`[同步] 发现 ${syncQueue.length} 条离线数据待同步`)

    try {
      let successCount = 0
      for (let i = 0; i < syncQueue.length; i++) {
        const item = syncQueue[i]
        if (item.type === 'study_complete') {
          try {
            await post('/study-records', {
              studentId: item.data.studentId,
              answers: item.data.answers,
            })
            console.log('[同步] 学习记录同步成功')
            successCount++
          } catch (itemError) {
            // 单条失败，保留剩余队列
            console.error('[同步] 单条同步失败，保留剩余队列', itemError)
            const remaining = syncQueue.slice(i)
            wx.setStorageSync('syncQueue', remaining)
            throw itemError
          }
        }
      }

      // 全部成功，清空队列
      clearSyncQueue()
      wx.showToast({
        title: '离线数据已同步',
        icon: 'success',
        duration: 1500
      })
    } catch (error) {
      console.error('[同步] 离线数据同步失败', error)
      // 同步失败，保留队列，下次再试
    }
  },

  startReview() {
    // 直接开始复习，resume=true 会自动跳过已完成的任务
    wx.navigateTo({ url: '/pages/study/study?resume=true' })
  },

  reload() { this.init() },

  async getTodayOverview() {
    const studentId = app.globalData.userInfo && app.globalData.userInfo.studentId
    if (!studentId) return null

    try {
      await post(`/students/${studentId}/daily-tasks`)
    } catch (e) {
      console.warn('同步任务失败，继续获取概览', e)
    }

    // 清理跨天的本地进度
    const saved = getStudyProgress()
    if (saved && saved.timestamp) {
      const savedDate = new Date(saved.timestamp).toDateString()
      const today = new Date().toDateString()
      if (savedDate !== today) {
        clearStudyProgress()
      }
    }

    try {
      const data = await get(`/review-plan/${studentId}`)
      const mi = data && data.miniapp
      if (mi && mi.today) {
        const saved = getStudyProgress()
        const due = mi.today.dueCount || 0
        const reviewedFromServer = Math.min(mi.today.completedCount || 0, due)
        const savedIsToday = saved && saved.startTime && (new Date(saved.startTime).toDateString() === new Date().toDateString())
        const reviewedFromLocal = savedIsToday ? Math.min(saved.currentIndex || (saved.answers && saved.answers.length) || 0, due) : 0

        return {
          bookName: '今日任务',
          dueCount: due,
          reviewedCount: Math.max(reviewedFromServer, reviewedFromLocal),
          elapsedSeconds: mi.today.timeSpentSeconds || 0,
          timeString: this.formatTime(mi.today.timeSpentSeconds || 0),
        }
      }
    } catch (e) {
      console.warn('review-plan 获取失败，使用回退逻辑', e)
    }

    let tasks = []
    try {
      tasks = await get(`/students/${studentId}/daily-tasks`)
    } catch (e) {
      tasks = []
    }
    const dueCount = Array.isArray(tasks) ? tasks.length : 0

    const savedProgress = getStudyProgress()
    let reviewedCount = 0
    if (savedProgress) {
      reviewedCount = Math.min(savedProgress.currentIndex || (savedProgress.answers && savedProgress.answers.length) || 0, dueCount)
    }

    return { bookName: '今日任务', dueCount, reviewedCount, elapsedMinutes: 0, timeString: '00:00' }
  },

  calcNextReviewHint() {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return `${d.getMonth() + 1}月${d.getDate()}日`
  },

  formatDate(d) {
    const w = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()]
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 周${w}`
  },

  formatTime(seconds) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  },
})
