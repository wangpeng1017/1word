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

    // 🎮 游戏化激励
    consecutiveCorrect: 0, // 连续答对计数
    showMilestone: false,  // 是否显示里程碑弹窗
    milestoneCount: 0,     // 当前里程碑数字
    showExpGain: false,    // 显示经验获取动画
    expGainValue: 0,       // 经验获取数值
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

  // 加载每日任务（P9: 优化请求 + P10: 无题目词汇提示）
  async loadTasks() {
    try {
      wx.showLoading({ title: '加载中...' })

      const studentId = app.globalData.userInfo?.studentId
      if (!studentId) {
        throw new Error('未找到学生ID')
      }

      // P9: 统一使用 POST 接口，它会返回任务列表
      // POST 会检查 study_plans 并生成缺失的 daily_tasks
      const response = await post(`/students/${studentId}/daily-tasks`)

      // 兼容两种返回格式：{ tasks: [] } 或直接数组
      let tasks = []
      if (Array.isArray(response)) {
        tasks = response
      } else if (response && Array.isArray(response.tasks)) {
        tasks = response.tasks
      } else if (response && response.data && Array.isArray(response.data.tasks)) {
        tasks = response.data.tasks
      }

      if (!tasks || tasks.length === 0) {
        wx.hideLoading()
        wx.showModal({
          title: '提示',
          content: '暂无学习任务',
          showCancel: false,
          success: () => {
            wx.navigateBack()
          },
        })
        return
      }

      // P10: 统计无题目的任务并提示用户
      const invalidTasks = tasks.filter(task =>
        !task.vocabulary ||
        !task.vocabulary.questions ||
        task.vocabulary.questions.length === 0
      )
      const validTasks = tasks.filter(task =>
        task.vocabulary &&
        task.vocabulary.questions &&
        task.vocabulary.questions.length > 0
      )

      // P10: 显示跳过的无题目词汇数量
      if (invalidTasks.length > 0) {
        const invalidWords = invalidTasks
          .map(t => t.vocabulary?.word || '未知')
          .slice(0, 3)
          .join('、')
        const moreText = invalidTasks.length > 3 ? `等${invalidTasks.length}个` : ''

        wx.showToast({
          title: `${invalidWords}${moreText}单词暂无题目，已跳过`,
          icon: 'none',
          duration: 3000
        })
      }

      if (validTasks.length === 0) {
        wx.hideLoading()
        wx.showModal({
          title: '提示',
          content: `共${tasks.length}个任务，但都没有可用的题目。请联系老师添加题目。`,
          showCancel: false,
          success: () => {
            wx.navigateBack()
          },
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
        success: () => {
          wx.navigateBack()
        },
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

    // 🔧 修复：优先使用后端分配的题目ID（基于80%/20%题型分配）
    let question = null

    // 1. 优先使用后端分配的 selectedQuestionId
    if (currentTask.selectedQuestionId) {
      question = vocabulary.questions.find(q => q.id === currentTask.selectedQuestionId)
    }

    // 2. 如果没找到，按 targetQuestionType 寻找
    if (!question && currentTask.targetQuestionType) {
      question = vocabulary.questions.find(q => q.type === currentTask.targetQuestionType)
    }

    // 3. 兜底：随机选择一个题目
    if (!question && vocabulary.questions.length > 0) {
      const randomIndex = Math.floor(Math.random() * vocabulary.questions.length)
      question = vocabulary.questions[randomIndex]
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
    const { selectedAnswer, currentQuestion, currentTask, consecutiveCorrect } = this.data

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

    // 🎮 游戏化反馈
    const newConsecutiveCorrect = isCorrect ? consecutiveCorrect + 1 : 0
    let expGain = isCorrect ? 1 : 0

    // 检查连对里程碑 (5, 10, 15, 20...)
    const isMilestone = isCorrect && newConsecutiveCorrect > 0 && newConsecutiveCorrect % 5 === 0
    if (isMilestone) {
      expGain += Math.floor(newConsecutiveCorrect / 5)
    }

    this.setData({
      isAnswered: true,
      isCorrect,
      showResult: true,
      answers,
      correctCount,
      wrongCount,
      consecutiveCorrect: newConsecutiveCorrect,
      showExpGain: isCorrect,
      expGainValue: expGain,
    })

    // 🔊 震动反馈
    this.playFeedback(isCorrect)

    // 🏆 里程碑弹窗
    if (isMilestone) {
      setTimeout(() => {
        this.showMilestonePopup(newConsecutiveCorrect)
      }, 300)
    }

    // 隐藏经验获取动画
    if (isCorrect) {
      setTimeout(() => {
        this.setData({ showExpGain: false })
      }, 1000)
    }

    // 如果回答正确，自动进入下一题
    if (isCorrect) {
      const delay = isMilestone ? 2500 : 1500
      setTimeout(() => {
        this.nextQuestion()
      }, delay)
    }
    // 如果回答错误，显示"继续"按钮
  },

  // 🔊 播放反馈（震动已禁用）
  playFeedback(isCorrect) {
    // 震动反馈已禁用
    // if (isCorrect) {
    //   wx.vibrateShort({ type: 'light' })
    // } else {
    //   wx.vibrateShort({ type: 'medium' })
    // }
  },

  // 🏆 显示里程碑弹窗
  showMilestonePopup(count) {
    // 震动已禁用
    // wx.vibrateLong()
    this.setData({
      showMilestone: true,
      milestoneCount: count,
    })
    setTimeout(() => {
      this.setData({ showMilestone: false })
    }, 2000)
  },

  // 关闭里程碑弹窗
  closeMilestone() {
    this.setData({ showMilestone: false })
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

  // 恢复进度（P5: 添加服务端校验）
  async resumeProgress() {
    const progress = getStudyProgress()

    if (!progress) {
      // 没有保存的进度，正常加载
      this.loadTasks()
      return
    }

    // 检查进度是否是今天的
    const savedDate = progress.timestamp ? new Date(progress.timestamp).toDateString() : null
    const today = new Date().toDateString()
    if (savedDate !== today) {
      // 跨天进度已过期，清除并重新加载
      console.log('进度已过期（跨天），重新加载任务')
      clearStudyProgress()
      this.loadTasks()
      return
    }

    // 校验本地进度是否仍有效
    try {
      wx.showLoading({ title: '校验进度中...' })
      const studentId = app.globalData.userInfo?.studentId

      // 从服务端获取当前有效任务
      const response = await get(`/students/${studentId}/daily-tasks`)
      const serverTasks = Array.isArray(response) ? response : (response?.tasks || [])

      wx.hideLoading()

      if (!serverTasks || serverTasks.length === 0) {
        // 服务端无任务，清除本地进度
        clearStudyProgress()
        wx.showModal({
          title: '提示',
          content: '任务已更新，请重新开始',
          showCancel: false,
          success: () => wx.navigateBack()
        })
        return
      }

      // 校验本地任务是否仍存在于服务端
      const serverTaskIds = new Set(serverTasks.map(t => t.id))
      const serverVocabIds = new Set(serverTasks.map(t => t.vocabularyId))

      // 过滤出仍有效的本地任务
      const validLocalTasks = progress.tasks.filter(t =>
        serverTaskIds.has(t.id) || serverVocabIds.has(t.vocabularyId)
      )

      if (validLocalTasks.length === 0) {
        // 本地进度全部失效，重新加载
        console.log('本地进度已全部失效，重新加载')
        clearStudyProgress()
        this.loadTasks()
        return
      }

      // 已回答的词汇ID集合
      const answeredVocabIds = new Set(progress.answers.map(a => a.vocabularyId))

      // 计算剩余需要学习的任务（排除已回答的）
      const remainingTasks = validLocalTasks.filter(t => !answeredVocabIds.has(t.vocabularyId))

      if (remainingTasks.length === 0) {
        // 所有任务已完成，直接提交
        console.log('所有任务已完成，直接提交结果')
        this.setData({
          tasks: validLocalTasks,
          answers: progress.answers,
          correctCount: progress.correctCount,
          wrongCount: progress.wrongCount,
          totalCount: validLocalTasks.length,
          currentIndex: validLocalTasks.length,
          isLoading: false,
        })
        this.finishStudy()
        return
      }

      // 恢复进度：从第一个未完成的任务开始
      this.setData({
        tasks: validLocalTasks,
        currentIndex: validLocalTasks.length - remainingTasks.length,
        answers: progress.answers,
        correctCount: progress.correctCount,
        wrongCount: progress.wrongCount,
        totalCount: validLocalTasks.length,
        isLoading: false,
      })

      wx.showToast({
        title: `已恢复进度 ${progress.answers.length}/${validLocalTasks.length}`,
        icon: 'none',
        duration: 1500
      })

      this.loadCurrentQuestion()
    } catch (error) {
      wx.hideLoading()
      console.error('校验进度失败:', error)
      // 校验失败，清除进度重新加载
      clearStudyProgress()
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

  // 播放音频（听力题）
  playAudio() {
    const { currentTask } = this.data

    if (!currentTask || !currentTask.vocabulary) {
      return
    }

    // 如果有音频URL，播放音频
    if (currentTask.vocabulary.audioUrl) {
      if (!this.data.audioContext) {
        this.data.audioContext = wx.createInnerAudioContext()
      }

      this.data.audioContext.src = currentTask.vocabulary.audioUrl
      this.data.audioContext.play()
    } else {
      // 如果没有音频，使用TTS接口
      wx.showToast({
        title: '正在加载音频...',
        icon: 'loading',
        duration: 1000
      })

      // TODO: 调用TTS接口或使用第三方服务
      // 这里可以集成百度TTS、讯飞TTS或其他服务
    }
  },
})
