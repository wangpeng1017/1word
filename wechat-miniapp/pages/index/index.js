// pages/index/index.js
const { get } = require('../../utils/request')
const { getStudyProgress } = require('../../utils/storage')
const app = getApp()

Page({
  data: {
    state: 'loading', // loading | ready | empty | error
    dateStr: '',
    overview: {},
    progressPercent: 0,
    nextReviewHint: '',
    defaultCover: 'https://dummyimage.com/120x160/EEF3FF/2F6BFF.png&text=BOOK',
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
    }
  },

  onPullDownRefresh() {
    this.init().finally(() => wx.stopPullDownRefresh())
  },

  async init() {
    this.setData({ state: 'loading', dateStr: this.formatDate(new Date()) })
    try {
      const ov = await this.getTodayOverview()
      if (!ov || ov.dueCount === 0) {
        this.setData({ state: 'empty', nextReviewHint: this.calcNextReviewHint() })
        return
      }
      const percent = Math.min(100, Math.floor((ov.reviewedCount / ov.dueCount) * 100))
      this.setData({ overview: ov, progressPercent: percent, state: 'ready' })
    } catch (e) {
      console.error('加载首页信息失败', e)
      this.setData({ state: 'error' })
    }
  },

  startReview() {
    const progress = this.data.overview || {}
    const needResume = progress.reviewedCount > 0 && progress.reviewedCount < progress.dueCount
    wx.navigateTo({ url: `/pages/study/study${needResume ? '?resume=true' : ''}` })
  },

  reload() { this.init() },

  async getTodayOverview() {
    const studentId = app.globalData.userInfo && app.globalData.userInfo.studentId
    if (!studentId) return null

    // 直接从复习概览接口获取（小程序友好的 miniapp 段）
    try {
      const data = await get(`/review-plan/${studentId}`)
      const mi = data && data.miniapp
      if (mi && mi.today) {
        // 若本地有进度，则让前端进度覆盖服务端统计的一部分（以便继续学习提示）
        const saved = getStudyProgress()
        const reviewedFromServer = mi.today.completedCount || 0
        const due = mi.today.dueCount || 0
        const reviewedFromLocal = saved ? Math.min(saved.currentIndex || (saved.answers && saved.answers.length) || 0, due) : 0

        return {
          bookName: '今日任务',
          dueCount: due,
          reviewedCount: Math.max(reviewedFromServer, reviewedFromLocal),
          elapsedMinutes: 0, // 概览未返回用时，若需要可后续扩展
        }
      }
    } catch (e) {
      // 失败时回退到旧逻辑（不报错，保证首页可用）
      console.warn('review-plan 获取失败，使用回退逻辑', e)
    }

    // 回退逻辑：仍尝试旧的每日任务接口
    let tasks = []
    try {
      tasks = await get(`/students/${studentId}/daily-tasks`)
    } catch (e) {
      tasks = []
    }
    const dueCount = Array.isArray(tasks) ? tasks.length : 0

    const saved = getStudyProgress()
    let reviewedCount = 0
    if (saved) {
      reviewedCount = Math.min(saved.currentIndex || (saved.answers && saved.answers.length) || 0, dueCount)
    }

    return { bookName: '今日任务', dueCount, reviewedCount, elapsedMinutes: 0 }
  },

  calcNextReviewHint() {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return `${d.getMonth() + 1}月${d.getDate()}日`
  },

  formatDate(d) {
    const w = ['日','一','二','三','四','五','六'][d.getDay()]
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 周${w}`
  },
})
