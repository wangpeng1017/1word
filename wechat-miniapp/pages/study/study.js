// pages/study/study.js
const { get, post } = require('../../utils/request')
const { saveStudyProgress, getStudyProgress, clearStudyProgress } = require('../../utils/storage')
const app = getApp()

Page({
  data: {
    // 任务相关
    tasks: [],
    currentIndex: 0,
    totalCount: 0,
    
    // 当前题目
    currentTask: null,
    currentQuestion: null,
    
    // 答题状态
    selectedAnswer: '',
    isAnswered: false,
    isCorrect: false,
    showResult: false,
    
    // 统计数据
    answers: [], // 答题记录
    correctCount: 0,
    wrongCount: 0,
    startTime: null,
    sessionStartTime: null, // 总开始时间
    elapsedTime: '00:00', // 已用时
    timer: null, // 计时器
    
    // 进度
    progress: 0,
    
    // 加载状态
    isLoading: true,
    loadError: false,
    
    // 音频播放
    audioContext: null,
  },

  onLoad(options) {
    // 检查登录状态
    if (!app.globalData.token) {
      wx.reLaunch({
        url: '/pages/login/login',
      })
      return
    }

    this.setData({
      startTime: Date.now(),
      sessionStartTime: Date.now(),
    })

    // 启动计时器
    this.startTimer()

    // 检查是否恢复之前的进度
    if (options.resume === 'true') {
      this.resumeProgress()
    } else {
      this.loadTasks()
    }
  },

  onUnload() {
    // 清除计时器
    if (this.data.timer) {
      clearInterval(this.data.timer)
    }
    
    // 页面卸载时保存进度（如果未完成）
    if (this.data.currentIndex < this.data.totalCount) {
      this.saveProgress()
    }
  },

  // 启动计时器
  startTimer() {
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.data.sessionStartTime) / 1000)
      const minutes = Math.floor(elapsed / 60)
      const seconds = elapsed % 60
      this.setData({
        elapsedTime: `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      })
    }, 1000)
    
    this.setData({ timer })
  },

  // 加载每日任务（优先使用 review-plan 概览）
  async loadTasks() {
    try {
      wx.showLoading({ title: '加载中...' })
      
      const studentId = app.globalData.userInfo?.studentId
      if (!studentId) {
        throw new Error('未找到学生ID')
      }

      // 1) 优先使用复习概览（miniapp.today.tasks 包含 vocabulary.questions）
      let tasks = []
      let mi = null
      try {
        const data = await get(`/review-plan/${studentId}`)
        mi = data && data.miniapp
        if (mi && mi.today && Array.isArray(mi.today.tasks)) {
          tasks = mi.today.tasks
        }
      } catch (e) {
        console.warn('review-plan 获取失败，回退到每日任务接口', e)
      }

      // 2) 若概览没有任务，或概览任务未附带后端选题信息，或“应复习数 > 当前任务数”（当天新增了计划），则回退/触发生成接口
      const dueFromOverview = (mi && mi.today && mi.today.dueCount) ? mi.today.dueCount : 0
      if (!tasks || tasks.length === 0 || !tasks[0]?.selectedQuestionId || dueFromOverview > tasks.length) {
        let response = []
        try {
          response = await get(`/students/${studentId}/daily-tasks`)
        } catch (_) { response = [] }

        // 若GET无数据或数量不足，则POST触发增量生成
        if (!response || response.length === 0 || dueFromOverview > response.length) {
          const generateResponse = await post(`/students/${studentId}/daily-tasks`)
          tasks = generateResponse.tasks || []
        } else {
          tasks = response
        }
      }

      if (!tasks || tasks.length === 0) {
        wx.hideLoading()
        wx.showModal({
          title: '提示',
          content: '暂无学习任务',
          showCancel: false,
          success: () => { wx.navigateBack() },
        })
        return
      }

      // 过滤出有题目的任务
      const validTasks = tasks.filter(task => 
        task.vocabulary && 
        task.vocabulary.questions && 
        task.vocabulary.questions.length > 0
      )

      if (validTasks.length === 0) {
        wx.hideLoading()
        wx.showModal({
          title: '提示',
          content: '任务中没有可用的题目',
          showCancel: false,
          success: () => { wx.navigateBack() },
        })
        return
      }

      this.setData({
        tasks: validTasks,
        totalCount: validTasks.length,
        isLoading: false,
      })

      wx.hideLoading()
      this.loadCurrentQuestion()
    } catch (error) {
      wx.hideLoading()
      console.error('加载任务失败:', error)
      
      wx.showModal({
        title: '加载失败',
        content: error.message || '请检查网络连接',
        showCancel: false,
        success: () => { wx.navigateBack() },
      })
    }
  },

  // 加载当前题目
  loadCurrentQuestion() {
    const { tasks, currentIndex } = this.data

    if (currentIndex >= tasks.length) {
      // 所有题目完成
      this.finishStudy()
      return
    }

    const currentTask = tasks[currentIndex]
    const vocabulary = currentTask.vocabulary
    
    // 1) 若后端已选定题目，优先按 selectedQuestionId 取题
    let question = null
    if (currentTask.selectedQuestionId) {
      question = vocabulary.questions.find(q => q.id === currentTask.selectedQuestionId)
    }

    // 2) 否则按目标题型选择
    if (!question && currentTask.targetQuestionType) {
      question = vocabulary.questions.find(q => q.type === currentTask.targetQuestionType)
    }

    // 3) 仍未命中则回退到英选汉；再不行取第一题
    if (!question) {
      question = vocabulary.questions.find(q => q.type === 'ENGLISH_TO_CHINESE') || vocabulary.questions[0]
    }

    if (!question) {
      // 跳过没有题目的单词
      this.nextQuestion()
      return
    }

    const progress = Math.round(((currentIndex + 1) / tasks.length) * 100)

    this.setData({
      currentTask,
      currentQuestion: question,
      selectedAnswer: '',
      isAnswered: false,
      isCorrect: false,
      showResult: false,
      progress,
    })
  },

  // 选择答案
  selectAnswer(e) {
    if (this.data.isAnswered) return

    const answer = e.currentTarget.dataset.answer
    this.setData({
      selectedAnswer: answer,
    })
  },

  // 提交答案
  submitAnswer() {
    const { selectedAnswer, currentQuestion, currentTask } = this.data

    if (!selectedAnswer) {
      wx.showToast({
        title: '请选择答案',
        icon: 'none',
      })
      return
    }

    const isCorrect = selectedAnswer === currentQuestion.correctAnswer
    const timeSpent = Math.floor((Date.now() - this.data.startTime) / 1000)

    // 记录答题结果
    const answerRecord = {
      vocabularyId: currentTask.vocabularyId,
      questionId: currentQuestion.id,
      answer: selectedAnswer,
      isCorrect,
      timeSpent,
    }

    const answers = [...this.data.answers, answerRecord]
    const correctCount = answers.filter(a => a.isCorrect).length
    const wrongCount = answers.filter(a => !a.isCorrect).length

    this.setData({
      isAnswered: true,
      isCorrect,
      showResult: true,
      answers,
      correctCount,
      wrongCount,
    })

    // 如果回答正确，1.5秒后自动进入下一题
    if (isCorrect) {
      setTimeout(() => {
        this.nextQuestion()
      }, 1500)
    }
    // 如果回答错误，显示“继续”按钮，手动点击后才进入下一题
  },

  // 下一题
  nextQuestion() {
    const { currentIndex, totalCount } = this.data

    if (currentIndex + 1 >= totalCount) {
      // 完成所有题目
      this.finishStudy()
    } else {
      this.setData({
        currentIndex: currentIndex + 1,
        startTime: Date.now(), // 重置每题开始时间
      })
      this.loadCurrentQuestion()
    }
  },

  // 完成学习
  async finishStudy() {
    const { answers, correctCount, wrongCount } = this.data

    if (answers.length === 0) {
      wx.navigateBack()
      return
    }

    try {
      wx.showLoading({ title: '提交中...' })

      const studentId = app.globalData.userInfo?.studentId
      
      // 提交答题记录
      await post('/study-records', {
        studentId,
        answers,
      })

      // 清除本地进度
      clearStudyProgress()

      wx.hideLoading()

      // 显示结果页面
      wx.redirectTo({
        url: `/pages/study/result?correct=${correctCount}&wrong=${wrongCount}&total=${answers.length}`,
      })
    } catch (error) {
      wx.hideLoading()
      console.error('提交失败:', error)
      
      wx.showModal({
        title: '提交失败',
        content: '答题记录提交失败，请重试',
        confirmText: '重试',
        success: (res) => {
          if (res.confirm) {
            this.finishStudy()
          } else {
            wx.navigateBack()
          }
        },
      })
    }
  },

  // 保存进度
  saveProgress() {
    const { tasks, currentIndex, answers, correctCount, wrongCount } = this.data
    
    saveStudyProgress({
      tasks,
      currentIndex,
      answers,
      correctCount,
      wrongCount,
      timestamp: Date.now(),
    })
  },

  // 恢复进度
  resumeProgress() {
    const progress = getStudyProgress()
    
    if (progress) {
      this.setData({
        tasks: progress.tasks,
        currentIndex: progress.currentIndex,
        answers: progress.answers,
        correctCount: progress.correctCount,
        wrongCount: progress.wrongCount,
        totalCount: progress.tasks.length,
        isLoading: false,
      })
      
      this.loadCurrentQuestion()
    } else {
      // 没有保存的进度，正常加载
      this.loadTasks()
    }
  },

  // 退出学习
  exitStudy() {
    wx.showModal({
      title: '确认退出',
      content: '当前进度会被保存，下次可以继续',
      confirmText: '确定退出',
      success: (res) => {
        if (res.confirm) {
          this.saveProgress()
          wx.navigateBack()
        }
      },
    })
  },

  // 播放音频（优先美式，其次英式；若都无则不播放）
  playAudio() {
    const { currentTask } = this.data
    if (!currentTask || !currentTask.vocabulary) return

    const v = currentTask.vocabulary
    // 优先 US -> UK -> 兜底 audioUrl
    const url = v.audioUs || v.audioUS || v.audio_us || v.audioUk || v.audioUK || v.audio_uk || v.audioUrl || ''
    if (!url) {
      wx.showToast({ title: '暂无音频', icon: 'none' })
      return
    }
    if (!this.data.audioContext) {
      this.data.audioContext = wx.createInnerAudioContext()
    }
    const ctx = this.data.audioContext
    // 防止上一次错误回调残留
    try { ctx.offError && ctx.offError() } catch {}
    ctx.onError((err) => {
      console.warn('音频播放失败:', err)
      wx.showToast({ title: '音频不可用', icon: 'none' })
    })
    ctx.src = url
    ctx.play()
  },
})
