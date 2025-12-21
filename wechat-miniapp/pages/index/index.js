// pages/index/index.js
const { get, post } = require('../../utils/request')
const { getStudyProgress, clearStudyProgress, getSyncQueue, clearSyncQueue } = require('../../utils/storage')
const app = getApp()

Page({
  data: {
    state: 'loading',
    dateStr: '',
    overview: {},
    progressPercent: 0,
    nextReviewHint: '',
    defaultCover: 'https://dummyimage.com/120x160/EEF3FF/2F6BFF.png&text=BOOK',
    hasUnfinishedProgress: false,
    unfinishedCount: 0,
    forecast: null,
    tomorrowReview: 0,
    tomorrowDifficulty: 'light',
    tomorrowDifficultyText: '轻松',
    pool: null,
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
      this.syncOfflineData()
    }
  },

  onPullDownRefresh() {
    this.init().finally(() => wx.stopPullDownRefresh())
  },

  async init() {
    this.setData({ state: 'loading', dateStr: this.formatDate(new Date()) })
    this.checkUnfinishedProgress()

    try {
      const [ov] = await Promise.all([
        this.getTodayOverview(),
        this.getForecast(),
      ])

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

  async getForecast() {
    const studentId = app.globalData.userInfo && app.globalData.userInfo.studentId
    if (!studentId) return

    try {
      const data = await get('/review-plan/forecast?studentId=' + studentId + '&days=7')
      if (data && data.forecast && data.forecast.length > 1) {
        const tomorrow = data.forecast[1]
        const difficultyTextMap = { light: '轻松', normal: '适中', heavy: '较多' }
        this.setData({
          forecast: data.forecast,
          tomorrowReview: tomorrow.reviewCount,
          tomorrowDifficulty: tomorrow.difficulty,
          tomorrowDifficultyText: difficultyTextMap[tomorrow.difficulty] || '轻松',
          pool: data.pool,
        })
      }
    } catch (e) {
      console.warn('获取复习量预测失败', e)
    }
  },

  checkUnfinishedProgress() {
    const saved = getStudyProgress()
    if (!saved) {
      this.setData({ hasUnfinishedProgress: false, unfinishedCount: 0 })
      return
    }

    const savedDate = saved.timestamp ? new Date(saved.timestamp).toDateString() : null
    const today = new Date().toDateString()

    if (savedDate !== today) {
      clearStudyProgress()
      this.setData({ hasUnfinishedProgress: false, unfinishedCount: 0 })
      return
    }

    const totalTasks = saved.tasks?.length || 0
    const answeredCount = saved.answers?.length || 0
    const remainingCount = totalTasks - answeredCount

    if (remainingCount > 0 && answeredCount > 0) {
      this.setData({ hasUnfinishedProgress: true, unfinishedCount: remainingCount })
      wx.showModal({
        title: '发现未完成的复习',
        content: '您有 ' + remainingCount + ' 个单词未完成复习',
        confirmText: '继续学习',
        cancelText: '稍后再说',
        success: (res) => {
          if (res.confirm) wx.navigateTo({ url: '/pages/study/study?resume=true' })
        }
      })
    } else {
      this.setData({ hasUnfinishedProgress: false, unfinishedCount: 0 })
    }
  },

  async syncOfflineData() {
    const syncQueue = getSyncQueue()
    if (!syncQueue || syncQueue.length === 0) return

    try {
      for (let i = 0; i < syncQueue.length; i++) {
        const item = syncQueue[i]
        if (item.type === 'study_complete') {
          await post('/study-records', { studentId: item.data.studentId, answers: item.data.answers })
        }
      }
      clearSyncQueue()
      wx.showToast({ title: '离线数据已同步', icon: 'success', duration: 1500 })
    } catch (error) {
      console.error('[同步] 离线数据同步失败', error)
    }
  },

  startReview() {
    wx.navigateTo({ url: '/pages/study/study?resume=true' })
  },

  reload() { this.init() },

  async getTodayOverview() {
    const studentId = app.globalData.userInfo && app.globalData.userInfo.studentId
    if (!studentId) return null

    try {
      await post('/students/' + studentId + '/daily-tasks')
    } catch (e) {}

    // 清理过期的本地缓存
    const saved = getStudyProgress()
    if (saved) {
      const savedDate = (saved.timestamp || saved.startTime) ? new Date(saved.timestamp || saved.startTime).toDateString() : null
      const today = new Date().toDateString()
      if (savedDate !== today) {
        console.log('[首页] 清除过期的本地学习进度缓存')
        clearStudyProgress()
      }
    }

    try {
      const data = await get('/review-plan/' + studentId)
      const mi = data && data.miniapp
      if (mi && mi.today) {
        const due = mi.today.dueCount || 0
        const reviewedFromServer = mi.today.completedCount || 0

        // 重新获取清理后的本地缓存
        const currentSaved = getStudyProgress()
        let reviewedFromLocal = 0

        if (currentSaved && currentSaved.startTime) {
          const savedDate = new Date(currentSaved.startTime).toDateString()
          const today = new Date().toDateString()

          if (savedDate === today) {
            const localAnswers = currentSaved.currentIndex || (currentSaved.answers && currentSaved.answers.length) || 0
            const totalTasks = currentSaved.tasks?.length || 0
            const isLocalCompleted = totalTasks > 0 && localAnswers >= totalTasks

            // 如果本地显示已完成，但服务器没有记录，说明数据不同步
            // 清除本地缓存，以服务器数据为准
            if (isLocalCompleted && reviewedFromServer === 0) {
              console.log('[首页] 本地进度已完成但服务器无记录，清除本地缓存')
              clearStudyProgress()
              reviewedFromLocal = 0
            } else if (!isLocalCompleted) {
              // 本地有未完成的进度，保留显示
              reviewedFromLocal = Math.min(localAnswers, due)
            }
          }
        }

        // 以服务器数据为准，本地数据仅用于显示未提交的进度
        const finalReviewed = Math.max(reviewedFromServer, reviewedFromLocal)

        return {
          bookName: '今日任务',
          dueCount: due,
          reviewedCount: Math.min(finalReviewed, due),
          elapsedSeconds: mi.today.timeSpentSeconds || 0,
          timeString: this.formatTime(mi.today.timeSpentSeconds || 0),
        }
      }
    } catch (e) {
      console.error('[首页] 获取复习计划失败', e)
    }

    let tasks = []
    try { tasks = await get('/students/' + studentId + '/daily-tasks') } catch (e) {}
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
    return (d.getMonth() + 1) + '月' + d.getDate() + '日'
  },

  formatDate(d) {
    const w = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()]
    return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日 周' + w
  },

  formatTime(seconds) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return m.toString().padStart(2, '0') + ':' + s.toString().padStart(2, '0')
  },
})
