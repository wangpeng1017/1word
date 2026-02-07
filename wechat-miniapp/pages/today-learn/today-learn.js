// pages/today-learn/today-learn.js
const { get, post } = require('../../utils/request')
const { waitForUserInfo } = require('../../utils/audio')
const app = getApp()

Page({
    data: {
        state: 'loading',
        newWordsCount: 0,
        timeEstimate: 0,
        userInfo: {},
        showWelcome: false
    },

    async onLoad() {
        // 检查是否需要显示欢迎动画
        const lastWelcome = wx.getStorageSync('lastWelcomeDate')
        const today = new Date().toDateString()

        if (lastWelcome !== today) {
            this.setData({ showWelcome: true })
            wx.setStorageSync('lastWelcomeDate', today)
        }
    },

    onShow() {
        if (typeof this.getTabBar === 'function' && this.getTabBar()) {
            this.getTabBar().setData({ selected: 0 })
        }

        // 如果正在显示欢迎动画，暂停数据加载
        if (!this.data.showWelcome) {
            this.checkTodayTasks()
        }
    },

    // 隐藏欢迎动画
    hideWelcome() {
        this.setData({ showWelcome: false })
        this.checkTodayTasks()
    },

    async checkTodayTasks() {
        this.setData({ state: 'loading' })

        // 等待 userInfo 加载完成（解决真机异步时序问题）
        const userInfo = await waitForUserInfo()
        const studentId = userInfo?.studentId

        if (!studentId) {
            // 未登录，跳转到登录页（使用 reLaunch 避免与 tabBar 冲突）
            wx.reLaunch({ url: '/pages/login/login' })
            return
        }

        try {
            // 获取每日任务
            const res = await get(`/students/${studentId}/daily-tasks`)
            const tasks = Array.isArray(res) ? res : (res?.tasks || [])

            // 筛选新词 (isNew === true)
            const newTasks = tasks.filter(t => t.isNew)

            this.setData({
                state: 'ready',
                newWordsCount: newTasks.length,
                timeEstimate: Math.ceil(newTasks.length * 1.5) // 假设每个词1.5分钟
            })
        } catch (e) {
            console.error('获取今日任务失败', e)
            this.setData({ state: 'error' })
        }
    },

    startLearning() {
        // mode=new 表示只学新词
        wx.navigateTo({ url: '/pages/study/study?mode=new' })
    },

    goToReview() {
        wx.switchTab({ url: '/pages/index/index' })
    }
})
