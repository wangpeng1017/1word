// pages/today-learn/today-learn.js
const { get, post } = require('../../utils/request')
const app = getApp()

Page({
    data: {
        state: 'loading',
        newWordsCount: 0,
        timeEstimate: 0
    },

    onShow() {
        if (typeof this.getTabBar === 'function' && this.getTabBar()) {
            this.getTabBar().setData({ selected: 0 })
        }
        this.checkTodayTasks()
    },

    async checkTodayTasks() {
        this.setData({ state: 'loading' })
        const studentId = app.globalData.userInfo?.studentId
        if (!studentId) return

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
