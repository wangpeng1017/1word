// pages/test/test.js
const { get, post } = require('../../utils/request')
const app = getApp()

Page({
  data: {
    state: 'loading', // loading, list, detail, testing, result, error
    tests: [],
    selectedTest: null,
    questions: [],
    currentIndex: 0,
    currentQuestion: null,
    selectedAnswer: '',
    fillAnswer: '',
    answers: [],
    startTime: null,
    timeLeft: null,
    timer: null,
    result: null,
    isPassed: false,
    errorMsg: '',
    progressPercent: 0,
    questionTypeText: '',
    canNext: false,
    showFeedback: false,
    isCurrentCorrect: false,
    correctAnswer: '',
  },

  onLoad() {
    this.loadTests()
  },

  onUnload() {
    this.clearTimer()
  },

  // 加载测试列表
  async loadTests() {
    try {
      this.setData({ state: 'loading' })

      if (!app.globalData.token) {
        wx.showToast({ title: '请先登录', icon: 'none' })
        setTimeout(() => {
          wx.switchTab({ url: '/pages/profile/profile' })
        }, 1500)
        return
      }

      const tests = await get('/proficiency-tests?isActive=true')

      this.setData({
        tests: tests || [],
        state: (tests && tests.length > 0) ? 'list' : 'error',
        errorMsg: (tests && tests.length > 0) ? '' : '暂无可用测试',
      })
    } catch (error) {
      console.error('加载测试列表失败:', error)
      this.setData({
        state: 'error',
        errorMsg: error || '加载失败',
      })
    }
  },

  // 选择测试
  selectTest(e) {
    const test = e.currentTarget.dataset.test
    if (!test.isActive) {
      wx.showToast({ title: '该测试已停用', icon: 'none' })
      return
    }

    this.setData({
      selectedTest: test,
      state: 'detail',
    })
  },

  // 返回列表
  backToList() {
    this.setData({
      state: 'list',
      selectedTest: null,
      questions: [],
      currentIndex: 0,
      answers: [],
    })
  },

  // 开始测试
  async startTest() {
    try {
      wx.showLoading({ title: '加载中...' })

      const studentId = app.globalData.userInfo?.studentId

      const result = await post(`/proficiency-tests/${this.data.selectedTest.id}/start`, { studentId })

      wx.hideLoading()

      const { questions, duration } = result

      if (!questions || questions.length === 0) {
        wx.showToast({ title: '测试题目为空', icon: 'none' })
        return
      }

      this.setData({
        questions,
        currentIndex: 0,
        answers: [],
        startTime: Date.now(),
        state: 'testing',
      })

      this.loadQuestion(0)

      // 如果有时长限制，启动倒计时
      if (duration) {
        this.startTimer(duration * 60)
      }
    } catch (error) {
      wx.hideLoading()
      console.error('开始测试失败:', error)
      wx.showToast({ title: error || '开始测试失败', icon: 'none' })
    }
  },

  // 加载题目
  loadQuestion(index) {
    const question = this.data.questions[index]
    const typeMap = {
      ENGLISH_TO_CHINESE: '英译中',
      CHINESE_TO_ENGLISH: '中译英',
      LISTENING: '听力',
      FILL_IN_BLANK: '填空',
    }

    this.setData({
      currentQuestion: question,
      currentIndex: index,
      selectedAnswer: '',
      fillAnswer: '',
      canNext: false,
      questionTypeText: typeMap[question.type] || '选择题',
      progressPercent: Math.round(((index + 1) / this.data.questions.length) * 100),
    })
  },

  // 选择选项
  selectOption(e) {
    const answer = e.currentTarget.dataset.answer
    this.setData({
      selectedAnswer: answer,
      canNext: true,
    })
  },

  // 填空输入
  onFillInput(e) {
    const value = e.detail.value.trim()
    this.setData({
      fillAnswer: value,
      canNext: value.length > 0,
    })
  },

  // 播放音频
  playAudio() {
    const audioUrl = this.data.currentQuestion.audioUrl
    // 验证 audioUrl 是有效的 http/https URL
    if (!audioUrl || !audioUrl.startsWith('http')) {
      if (audioUrl) {
        console.warn('无效的音频URL:', audioUrl)
      }
      return
    }

    const innerAudioContext = wx.createInnerAudioContext()
    innerAudioContext.src = audioUrl
    innerAudioContext.play()

    innerAudioContext.onError((err) => {
      console.error('音频播放失败:', err)
      wx.showToast({ title: '音频播放失败', icon: 'none' })
    })
  },

  // 下一题
  async nextQuestion() {
    const { currentQuestion, selectedAnswer, fillAnswer, currentIndex, questions } = this.data

    // 记录答案
    const answer = currentQuestion.type === 'FILL_IN_BLANK' ? fillAnswer : selectedAnswer

    // 获取正确答案（需要从后端获取）
    const isCorrect = await this.checkAnswer(currentQuestion.questionId, answer)

    this.data.answers.push({
      vocabularyId: currentQuestion.vocabularyId,
      questionId: currentQuestion.questionId,
      answer,
      isCorrect,
    })

    // 判断是否是最后一题
    if (currentIndex < questions.length - 1) {
      // 加载下一题
      this.loadQuestion(currentIndex + 1)
    } else {
      // 提交测试
      this.submitTest()
    }
  },

  // 检查答案（简化版，实际应该在提交时由后端统一判断）
  async checkAnswer(questionId, answer) {
    try {
      const question = await get(`/questions/${questionId}`)
      const correctAnswer = question.correctAnswer
      return answer.toLowerCase().trim() === correctAnswer.toLowerCase().trim()
    } catch (error) {
      console.error('检查答案失败:', error)
      return false
    }
  },

  // 提交测试
  async submitTest() {
    try {
      wx.showLoading({ title: '提交中...' })

      this.clearTimer()

      const studentId = app.globalData.userInfo?.studentId
      const { selectedTest, answers, startTime } = this.data

      const completedAt = Date.now()

      const result = await post('/test-records', {
        testId: selectedTest.id,
        studentId,
        answers,
        startedAt: new Date(startTime).toISOString(),
        completedAt: new Date(completedAt).toISOString(),
      })

      wx.hideLoading()

      const { stats, isPassed } = result

      this.setData({
        result: stats,
        isPassed,
        state: 'result',
      })
    } catch (error) {
      wx.hideLoading()
      console.error('提交测试失败:', error)
      wx.showToast({ title: error || '提交失败', icon: 'none' })
    }
  },

  // 启动倒计时
  startTimer(seconds) {
    this.setData({ timeLeft: seconds })

    this.data.timer = setInterval(() => {
      const timeLeft = this.data.timeLeft - 1

      if (timeLeft <= 0) {
        this.clearTimer()
        wx.showModal({
          title: '时间到',
          content: '测试时间已到，将自动提交',
          showCancel: false,
          success: () => {
            this.submitTest()
          },
        })
      } else {
        this.setData({ timeLeft })
      }
    }, 1000)
  },

  // 清除定时器
  clearTimer() {
    if (this.data.timer) {
      clearInterval(this.data.timer)
      this.setData({ timer: null })
    }
  },

  // 查看详情
  viewDetails() {
    // TODO: 跳转到详情页面
    wx.showToast({ title: '功能开发中', icon: 'none' })
  },

  // 重新加载
  reload() {
    this.loadTests()
  },
})
