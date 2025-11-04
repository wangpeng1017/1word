// pages/wrong/wrong.js
const { get } = require('../../utils/request')
const app = getApp()

Page({
  data: {
    wrongQuestions: [],
    filteredQuestions: [],
    stats: {},
    currentFilter: 'ALL', // ALL, ENGLISH_TO_CHINESE, CHINESE_TO_ENGLISH, LISTENING, FILL_IN_BLANK
    isLoading: true,
    isEmpty: false,
  },

  onLoad() {
    // 检查登录状态
    if (!app.globalData.token) {
      wx.reLaunch({
        url: '/pages/login/login',
      })
      return
    }

    this.loadWrongQuestions()
  },

  onShow() {
    // 每次显示时刷新数据
    if (app.globalData.token) {
      this.loadWrongQuestions()
    }
  },

  // 加载错题
  async loadWrongQuestions() {
    try {
      wx.showLoading({ title: '加载中...' })

      const studentId = app.globalData.userInfo?.studentId
      if (!studentId) {
        throw new Error('未找到学生ID')
      }

      const response = await get(`/students/${studentId}/wrong-questions?limit=100`)
      const { wrongQuestions, stats } = response

      this.setData({
        wrongQuestions: wrongQuestions || [],
        filteredQuestions: wrongQuestions || [],
        stats: stats || {},
        isLoading: false,
        isEmpty: !wrongQuestions || wrongQuestions.length === 0,
      })

      wx.hideLoading()
    } catch (error) {
      wx.hideLoading()
      console.error('加载错题失败:', error)
      
      this.setData({
        isLoading: false,
        isEmpty: true,
      })
    }
  },

  // 筛选题型
  filterByType(e) {
    const type = e.currentTarget.dataset.type
    const { wrongQuestions } = this.data

    let filteredQuestions = wrongQuestions
    if (type !== 'ALL') {
      filteredQuestions = wrongQuestions.filter(item => item.question.type === type)
    }

    this.setData({
      currentFilter: type,
      filteredQuestions,
    })
  },

  // 查看详情
  viewDetail(e) {
    const index = e.currentTarget.dataset.index
    const question = this.data.filteredQuestions[index]

    wx.showModal({
      title: question.vocabulary.word,
      content: `题型：${this.getQuestionTypeName(question.question.type)}\n\n${question.question.content}\n\n你的答案：${question.wrongAnswer}\n正确答案：${question.correctAnswer}\n\n释义：${question.vocabulary.primaryMeaning}`,
      showCancel: false,
      confirmText: '知道了',
    })
  },

  // 获取题型名称
  getQuestionTypeName(type) {
    const names = {
      ENGLISH_TO_CHINESE: '英选汉',
      CHINESE_TO_ENGLISH: '汉选英',
      LISTENING: '听音选词',
      FILL_IN_BLANK: '选词填空',
    }
    return names[type] || type
  },

  // 刷新
  onPullDownRefresh() {
    this.loadWrongQuestions().then(() => {
      wx.stopPullDownRefresh()
    })
  },
})
