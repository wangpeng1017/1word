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
    nextReviewCount: 0,
    defaultCover: 'https://dummyimage.com/120x160/EEF3FF/2F6BFF.png&text=BOOK',
    hasUnfinishedProgress: false,
    unfinishedCount: 0,
    forecast: null,
    pool: null,
    studyDaysData: null,
    totalPoints: 0,
    lives: 5,
    userInfo: {},
    showWelcome: false,
    scrollTarget: '',
  },

  onLoad() {
    if (!app.globalData.token) {
      wx.reLaunch({ url: '/pages/login/login' })
      return
    }

    this.setData({ userInfo: app.globalData.userInfo || {} })

    const lastWelcome = wx.getStorageSync('lastWelcomeDate')
    const today = new Date().toDateString()

    if (lastWelcome !== today) {
      this.setData({ showWelcome: true })
      wx.setStorageSync('lastWelcomeDate', today)
    } else {
      this.init()
    }
  },

  onShow() {
    if (app.globalData.token && !this.data.showWelcome) {
      this.init()
      this.syncOfflineData()
    }
  },

  onPullDownRefresh() {
    this.init().finally(() => wx.stopPullDownRefresh())
  },

  // 隐藏欢迎动画
  hideWelcome() {
    this.setData({ showWelcome: false })
    this.init()
  },

  async init() {
    this.setData({ state: 'loading' })
    this.checkUnfinishedProgress()

    try {
      const [ov] = await Promise.all([
        this.getTodayOverview(),
        this.getForecast(),
        this.loadStudyDays(),
        this.loadPoints(),
      ])

      if (!ov) {
        this.setData({ state: 'empty' })
        return
      }
      if (ov.dueCount === 0 || (ov.reviewedCount >= ov.dueCount && ov.dueCount > 0)) {
        this.setData({ state: 'empty', overview: ov, progressPercent: 100 })
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
      if (data && data.forecast && data.forecast.length > 0) {
        let nextReviewDate = null
        let nextReviewCount = 0

        for (let i = 1; i < data.forecast.length; i++) {
          const day = data.forecast[i]
          if (day.reviewCount > 0) {
            nextReviewDate = day.date
            nextReviewCount = day.reviewCount
            break
          }
        }

        let nextReviewHint = ''
        if (nextReviewDate) {
          const d = new Date(nextReviewDate)
          nextReviewHint = (d.getMonth() + 1) + '月' + d.getDate() + '日'
        } else {
          const d = new Date()
          d.setDate(d.getDate() + 1)
          nextReviewHint = (d.getMonth() + 1) + '月' + d.getDate() + '日'
        }

        this.setData({
          forecast: data.forecast,
          nextReviewHint,
          nextReviewCount,
          pool: data.pool,
        })
      } else {
        const d = new Date()
        d.setDate(d.getDate() + 1)
        this.setData({
          nextReviewHint: (d.getMonth() + 1) + '月' + d.getDate() + '日',
          nextReviewCount: 0,
        })
      }
    } catch (e) {
      console.warn('获取复习量预测失败', e)
      const d = new Date()
      d.setDate(d.getDate() + 1)
      this.setData({
        nextReviewHint: (d.getMonth() + 1) + '月' + d.getDate() + '日',
        nextReviewCount: 0,
      })
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
    } catch (e) { }

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

        const currentSaved = getStudyProgress()
        let reviewedFromLocal = 0

        if (currentSaved && currentSaved.startTime) {
          const savedDate = new Date(currentSaved.startTime).toDateString()
          const today = new Date().toDateString()

          if (savedDate === today) {
            const localAnswers = currentSaved.currentIndex || (currentSaved.answers && currentSaved.answers.length) || 0
            const totalTasks = currentSaved.tasks?.length || 0
            const isLocalCompleted = totalTasks > 0 && localAnswers >= totalTasks

            if (isLocalCompleted && reviewedFromServer === 0) {
              console.log('[首页] 本地进度已完成但服务器无记录，清除本地缓存')
              clearStudyProgress()
              reviewedFromLocal = 0
            } else if (!isLocalCompleted) {
              reviewedFromLocal = Math.min(localAnswers, due)
            }
          }
        }

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
    try { tasks = await get('/students/' + studentId + '/daily-tasks') } catch (e) { }
    const dueCount = Array.isArray(tasks) ? tasks.length : 0
    const savedProgress = getStudyProgress()
    let reviewedCount = 0
    if (savedProgress) {
      reviewedCount = Math.min(savedProgress.currentIndex || (savedProgress.answers && savedProgress.answers.length) || 0, dueCount)
    }
    return { bookName: '今日任务', dueCount, reviewedCount, elapsedMinutes: 0, timeString: '00:00' }
  },

  formatTime(seconds) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return m.toString().padStart(2, '0') + ':' + s.toString().padStart(2, '0')
  },

  // 格式化日期为年月日
  formatDateFull(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    return year + '年' + month + '月' + day + '日'
  },

  // 加载学习天数数据
  async loadStudyDays() {
    try {
      const studentId = app.globalData.userInfo?.studentId
      if (!studentId) return

      const res = await get('/study-days?studentId=' + studentId)
      if (res && res.days) {
        // 格式化每天的日期
        const daysWithFormat = res.days.map(day => ({
          ...day,
          dateFormatted: this.formatDateFull(day.date)
        }))

        this.setData({
          studyDaysData: {
            ...res,
            days: daysWithFormat
          }
        })

        setTimeout(() => {
          this.scrollToCurrentDay()
        }, 300)
      }
    } catch (error) {
      console.error('加载学习天数失败:', error)
    }
  },

  // 加载积分
  async loadPoints() {
    try {
      const studentId = app.globalData.userInfo?.studentId
      if (!studentId) return

      const res = await get('/points?studentId=' + studentId)
      if (res && res.points) {
        this.setData({ totalPoints: res.points.totalPoints || 0 })
      }
    } catch (error) {
      console.error('加载积分失败:', error)
    }
  },

  // 处理Day点击
  handleDayClick(e) {
    const day = e.currentTarget.dataset.day

    if (day.status === 'current') {
      this.startReview()
    } else if (day.status === 'completed') {
      wx.showModal({
        title: 'Day ' + day.day + ' 已完成',
        content: '复习单词: ' + day.wordsCount + '个\n用时: ' + this.formatTime(day.totalTime),
        showCancel: false
      })
    } else if (day.status === 'missed') {
      // 允许补打卡
      wx.showModal({
        title: '补学 Day ' + day.day,
        content: '确定要补学这天错过的单词吗？\n(仅学习当日新词)',
        confirmText: '开始补学',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            // 跳转学习页，指定 mode=new 和 day 参数
            wx.navigateTo({
              url: `/pages/study/study?mode=new&day=${day.day}`
            })
          }
        }
      })
    } else if (day.status === 'locked') {
      wx.showToast({
        title: '请先完成前面的学习',
        icon: 'none'
      })
    }
  },

  // 自动滚动到当前Day
  scrollToCurrentDay() {
    const { studyDaysData } = this.data
    if (!studyDaysData || !studyDaysData.days) return

    const currentDay = studyDaysData.days.find(d => d.status === 'current')
    if (currentDay) {
      this.setData({ scrollTarget: 'day-' + currentDay.day })
    }
  },
})
