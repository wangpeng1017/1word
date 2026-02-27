// pages/index/index.js
const { get, post } = require('../../utils/request')
const { getStudyProgress, clearStudyProgress, getSyncQueue, clearSyncQueue } = require('../../utils/storage')
const { waitForUserInfo } = require('../../utils/audio')
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

  async onLoad() {
    if (!app.globalData.token) {
      if (app.globalData.isGuest) {
        this.setData({ state: 'guest' })
        return
      }
      wx.reLaunch({ url: '/pages/login/login' })
      return
    }

    // 等待 userInfo 加载完成（解决真机异步时序问题）
    const userInfo = await waitForUserInfo()
    if (!userInfo) {
      // 未登录，跳转到登录页（使用 reLaunch 避免与 tabBar 冲突）
      wx.reLaunch({ url: '/pages/login/login' })
      return
    }

    this.setData({ userInfo: userInfo || {} })
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

    // 检查日期，只提示当天的未完成进度
    const savedDate = saved.timestamp ? new Date(saved.timestamp).toDateString() : null
    const today = new Date().toDateString()

    if (savedDate !== today) {
      clearStudyProgress()
      this.setData({ hasUnfinishedProgress: false, unfinishedCount: 0 })
      return
    }

    // 检查是否已完成
    const totalTasks = saved.tasks?.length || 0
    const answeredCount = saved.answers?.length || 0

    // 如果未完成且有答题记录
    if (totalTasks > answeredCount && answeredCount > 0) {
      this.setData({ hasUnfinishedProgress: true, unfinishedCount: totalTasks - answeredCount })

      // 自动弹出因为无法判断用户意图（可能想开始新任务），所以保留弹窗但简化文案
      // 用户反馈：保留弹窗，但不提示具体数量
      wx.showModal({
        title: '发现未完成的学习',
        content: '是否继续上次的学习进度？',
        confirmText: '继续学习',
        cancelText: '稍后再说',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/study/study?resume=true' })
          }
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
    // 1. 检查今日复习是否已完成
    // 注意：这里原本的 check 可能有误(reviewCount未定义)，但交给 study.js 处理空任务更稳妥
    // study.js 会在 mode=review 且无旧词时提示"今日复习已完成"

    // 2. 检查是否有未完成的进度 (强制匹配 review 模式)
    const saved = getStudyProgress()
    // 改为 'review' 模式，只恢复复习类的进度（或兼容all）
    if (this.checkAndResume(saved, 'review')) return

    // 3. 无进度，开始纯复习模式
    wx.navigateTo({ url: '/pages/study/study?mode=review' })
  },

  // 辅助方法：检查并恢复进度
  // silent: 是否静默恢复（不弹窗确认）
  checkAndResume(saved, targetMode, targetDay = null, silent = false) {
    if (!saved) return false

    const savedDate = saved.timestamp ? new Date(saved.timestamp).toDateString() : null
    const today = new Date().toDateString()

    // 过期进度无效
    if (savedDate !== today) return false

    // 检查是否已完成
    const total = saved.tasks?.length || 0
    const answered = saved.answers?.length || 0
    if (answered >= total) return false

    // 检查模式匹配
    const savedMode = saved.mode || 'all'
    const savedDay = saved.day || null

    // 匹配逻辑：
    // 1. 如果指定了 targetDay (补卡)，必须匹配 day
    // 2. 如果 targetMode 是 'review' 或 'new'，savedMode 必须匹配，或者 savedMode 是 'all' (兼容)

    let isMatch = false
    if (targetDay) {
      isMatch = (savedDay == targetDay) // 比较 day
    } else {
      // 今日任务 (targetDay 为 null)
      // 如果本地存的是补卡任务 (savedDay不为空)，则不匹配
      if (savedDay) return false

      // 模式匹配
      if (targetMode === 'all') isMatch = true
      else isMatch = (savedMode === targetMode || savedMode === 'all')
    }

    if (isMatch) {
      if (silent) {
        wx.navigateTo({ url: '/pages/study/study?resume=true' })
        return true
      }

      wx.showModal({
        title: '发现未完成的学习',
        content: '是否继续上次的学习进度？',
        confirmText: '继续学习',
        cancelText: '重新开始',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/study/study?resume=true' })
          } else {
            // 用户选择重新开始，清除旧进度并跳转新任务
            clearStudyProgress()
            let url = '/pages/study/study?mode=' + targetMode
            if (targetDay) url += '&day=' + targetDay
            wx.navigateTo({ url })
          }
        }
      })
      return true
    }

    return false
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

    // 如果该天没有复习任务也没有新词（例如休息日），提示用户
    if (day.wordsCount === 0 && (!day.newWordsCount || day.newWordsCount === 0)) {
      wx.showToast({
        title: '今日无学习任务',
        icon: 'none'
      })
      return
    }

    if (day.status === 'current') {
      this.startReview()
    } else if (day.status === 'completed') {
      wx.showModal({
        title: 'Day ' + day.day + ' 已完成 ⭐️',
        content: '是否重新学习？',
        confirmText: '重新学习',
        cancelText: '返回',
        success: (res) => {
          if (res.confirm) {
            const mode = day.wordsCount > 0 ? 'review' : 'new'
            wx.navigateTo({
              url: `/pages/study/study?mode=${mode}&day=${day.day}&repeat=true`
            })
          }
        }
      })
    } else if (day.status === 'missed') {
      // 补打卡逻辑优化

      // 补打卡逻辑优化

      // 先检查是否有该天未完成的补卡进度
      const saved = getStudyProgress()
      // 用户要求补卡无需弹窗，直接静默恢复 （silent=true）
      if (this.checkAndResume(saved, 'new', day.day, true)) return

      // 无进度，询问是否开始
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

  goToLogin() {
    app.globalData.isGuest = false
    wx.reLaunch({ url: '/pages/login/login' })
  },
})
