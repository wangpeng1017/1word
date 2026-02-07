// pages/today-learn/today-learn.js
const { get, post } = require('../../utils/request')
const { waitForUserInfo } = require('../../utils/audio')
const { getStudyProgress, clearStudyProgress } = require('../../utils/storage')
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
            this.checkUnfinishedProgress()
        }
    },

    // 隐藏欢迎动画
    hideWelcome() {
        this.setData({ showWelcome: false })
        this.setData({ showWelcome: false })
        this.checkTodayTasks()
        this.checkUnfinishedProgress()
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
        // 检查是否有未完成的进度 (新词模式)
        const saved = getStudyProgress()
        if (saved) {
            const savedDate = saved.timestamp ? new Date(saved.timestamp).toDateString() : null
            const today = new Date().toDateString()
            // 只有今天的进度才有效
            if (savedDate === today) {
                // 检查模式匹配 (saved.mode 必须是 'new' 或 'all')
                const savedMode = saved.mode || 'all'
                if (savedMode === 'new' || savedMode === 'all') {
                    // 检查是否已完成
                    if (saved.answers && saved.tasks && saved.answers.length < saved.tasks.length) {
                        wx.showModal({
                            title: '发现未完成的学习',
                            content: '是否继续上次的学习进度？',
                            confirmText: '继续学习',
                            cancelText: '重新开始',
                            success: (res) => {
                                if (res.confirm) {
                                    wx.navigateTo({ url: '/pages/study/study?resume=true' })
                                } else {
                                    clearStudyProgress()
                                    wx.navigateTo({ url: '/pages/study/study?mode=new' })
                                }
                            }
                        })
                        return
                    }
                }
            }
        }

        // 无进度或不匹配，开始新学习
        wx.navigateTo({ url: '/pages/study/study?mode=new' })
    },

    goToReview() {
        wx.switchTab({ url: '/pages/index/index' })
    },

    checkUnfinishedProgress() {
        // 只做简单的状态标记，不弹窗（点击开始学习时再检查/弹窗）
        // 这里可以用来显示一个小红点或者提示文案（如果需要）
    }
})
