// pages/study/result.js
const { get } = require('../../utils/request')
const app = getApp()

Page({
  data: {
    correct: 0,
    wrong: 0,
    total: 0,
    accuracy: 0,
    timeSeconds: 0,
    timeString: '00:00',
    // 🎮 激励弹窗数据
    streakDays: 0,
    showMotivation: false,
    motivationTitle: '',
    motivationMessage: '',
    masteredWords: 0,
    level: 1,
  },

  async onLoad(options) {
    // 先显示URL参数（当次学习数据）
    const correct = parseInt(options.correct || 0)
    const wrong = parseInt(options.wrong || 0)
    const total = parseInt(options.total || 0)
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0

    this.setData({ correct, wrong, total, accuracy })

    // 从服务器获取数据
    await this.loadServerData()

    // 3秒后自动弹出激励弹窗
    setTimeout(() => {
      this.showMotivationPopup()
    }, 3000)
  },

  async loadServerData() {
    try {
      const studentId = app.globalData.userInfo?.studentId
      if (!studentId) return

      // 并行获取复习计划和成就数据
      const [reviewData, achievementsData] = await Promise.all([
        get(`/review-plan/${studentId}`).catch(() => null),
        get('/achievements', { studentId }).catch(() => null)
      ])

      if (reviewData) {
        const today = reviewData?.miniapp?.today || {}
        const streakDays = reviewData?.miniapp?.progress?.consecutiveDays || 0
        const masteredWords = reviewData?.progress?.masteredWords || 0

        // 服务器数据仅用于附加信息（streak/mastered/time），不覆盖当次学习的核心数据
        const ts = today.timeSpentSeconds || 0

        const motivation = this.getMotivationContent(streakDays)

        this.setData({
          // 不覆盖 total/correct/wrong/accuracy — URL参数才是当次学习的正确数据
          timeSeconds: ts,
          timeString: this.formatTime(ts),
          streakDays,
          masteredWords,
          motivationTitle: motivation.title,
          motivationMessage: motivation.message,
        })
      }

      // 获取等级信息
      if (achievementsData && Array.isArray(achievementsData)) {
        // 简单计算等级（基于积分）
        const totalPoints = app.globalData.userInfo?.points || 0
        const level = this.calculateLevel(totalPoints)
        this.setData({ level })
      }
    } catch (e) {
      console.error('加载服务器数据失败:', e)
    }
  },

  // 根据连续天数获取激励内容
  getMotivationContent(days) {
    if (days <= 1) {
      return {
        title: '开启征程！',
        message: '万里长征第一步，明天继续！'
      }
    } else if (days <= 3) {
      return {
        title: '稳扎稳打！',
        message: '坚持就是超越，继续加油！'
      }
    } else if (days <= 6) {
      return {
        title: '势如破竹！',
        message: '学习习惯正在养成中！'
      }
    } else if (days <= 13) {
      return {
        title: '一周达人！',
        message: '你的坚持令人敬佩！'
      }
    } else if (days <= 29) {
      return {
        title: '学霸养成中！',
        message: '两周连胜，你太厉害了！'
      }
    } else {
      return {
        title: '超级学霸！',
        message: '一个月的坚持，你是最棒的！'
      }
    }
  },

  // 根据积分计算等级
  calculateLevel(points) {
    if (points < 100) return 1
    if (points < 300) return 2
    if (points < 600) return 3
    if (points < 1000) return 4
    if (points < 1500) return 5
    if (points < 2100) return 6
    if (points < 2800) return 7
    if (points < 3600) return 8
    if (points < 4500) return 9
    return 10
  },

  // 显示激励弹窗
  showMotivationPopup() {
    this.setData({ showMotivation: true })
  },

  // 关闭激励弹窗
  closeMotivation() {
    this.setData({ showMotivation: false })
  },

  // 阻止弹窗内部点击关闭
  preventClose() {
    // 空函数，用于阻止事件冒泡
  },

  formatTime(seconds) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  },

  // 查看错题
  viewWrongQuestions() {
    wx.switchTab({
      url: '/pages/wrong/wrong',
    })
  },

  // 返回首页（今日学习）
  backToHome() {
    wx.switchTab({
      url: '/pages/today-learn/today-learn',
    })
  },

  // 继续学习
  continueStudy() {
    wx.redirectTo({
      url: '/pages/study/study',
    })
  },
})

