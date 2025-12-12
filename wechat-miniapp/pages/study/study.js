// pages/study/study.js
const { get, post } = require('../../utils/request')
const { saveStudyProgress, getStudyProgress, clearStudyProgress, saveTodayWords, getTodayWords, addToSyncQueue, getSyncQueue, clearSyncQueue } = require('../../utils/storage')
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

    // 离线模式
    isOffline: false,
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

  onHide() {
    // 页面隐藏时也保存进度（防止闪退丢失）
    if (this.data.currentIndex < this.data.totalCount && this.data.answers.length > 0) {
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

  // 加载每日任务
  async loadTasks() {
    try {
      wx.showLoading({ title: '加载中...' })

      const studentId = app.globalData.userInfo?.studentId
      if (!studentId) {
        throw new Error('未找到学生ID')
      }

      // 先尝试从本地缓存获取（离线模式）
      const cachedTasks = getTodayWords()
      if (cachedTasks && cachedTasks.length > 0) {
        console.log('[离线] 使用本地缓存的任务')
      }

      let tasks = []
      try {
        // 尝试从服务器获取
        const response = await post(`/students/${studentId}/daily-tasks`)

        if (Array.isArray(response)) {
          tasks = response
        } else if (response && Array.isArray(response.tasks)) {
          tasks = response.tasks
        } else if (response && response.data && Array.isArray(response.data.tasks)) {
          tasks = response.data.tasks
        }

        // 缓存到本地（用于离线模式）
        if (tasks.length > 0) {
          saveTodayWords(tasks)
        }

        this.setData({ isOffline: false })
      } catch (networkError) {
        console.warn('[离线] 网络请求失败，尝试使用缓存', networkError)

        if (cachedTasks && cachedTasks.length > 0) {
          tasks = cachedTasks
          this.setData({ isOffline: true })
          wx.showToast({
            title: '离线模式',
            icon: 'none',
            duration: 2000
          })
        } else {
          throw networkError
        }
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

      // 过滤有效任务
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
      this.finishStudy()
      return
    }

    const currentTask = tasks[currentIndex]
    const vocabulary = currentTask.vocabulary

    let question = null

    if (currentTask.selectedQuestionId) {
      question = vocabulary.questions.find(q => q.id === currentTask.selectedQuestionId)
    }

    if (!question && currentTask.targetQuestionType) {
      question = vocabulary.questions.find(q => q.type === currentTask.targetQuestionType)
    }

    if (!question && vocabulary.questions.length > 0) {
      const randomIndex = Math.floor(Math.random() * vocabulary.questions.length)
      question = vocabulary.questions[randomIndex]
    }

    if (!question) {
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

    const answerRecord = {
      vocabularyId: currentTask.vocabularyId,
      questionId: currentQuestion.id,
      answer: selectedAnswer,
      isCorrect,
      timeSpent,
      taskId: currentTask.id,
      timestamp: Date.now(),
    }

    const answers = [...this.data.answers, answerRecord]
    const correctCount = answers.filter(a => a.isCorrect).length
    const wrongCount = answers.filter(a => !a.isCorrect).length

    const newConsecutiveCorrect = isCorrect ? consecutiveCorrect + 1 : 0
    let expGain = isCorrect ? 1 : 0

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

    // ⭐ 实时保存进度（每答完一题就保存）
    this.saveProgress()

    // 如果是离线模式，添加到同步队列
    if (this.data.isOffline) {
      addToSyncQueue({
        type: 'answer',
        data: answerRecord
      })
    }

    this.playFeedback(isCorrect)

    if (isMilestone) {
      setTimeout(() => {
        this.showMilestonePopup(newConsecutiveCorrect)
      }, 300)
    }

    if (isCorrect) {
      setTimeout(() => {
        this.setData({ showExpGain: false })
      }, 1000)
    }

    if (isCorrect) {
      const delay = isMilestone ? 2500 : 1500
      setTimeout(() => {
        this.nextQuestion()
      }, delay)
    }
  },

  playFeedback(isCorrect) {
    // 震动反馈已禁用
  },

  showMilestonePopup(count) {
    this.setData({
      showMilestone: true,
      milestoneCount: count,
    })
    setTimeout(() => {
      this.setData({ showMilestone: false })
    }, 2000)
  },

  closeMilestone() {
    this.setData({ showMilestone: false })
  },

  nextQuestion() {
    const { currentIndex, totalCount } = this.data

    if (currentIndex + 1 >= totalCount) {
      this.finishStudy()
    } else {
      this.setData({
        currentIndex: currentIndex + 1,
        startTime: Date.now(),
      })
      this.loadCurrentQuestion()
    }
  },

  // 完成学习
  async finishStudy() {
    const { answers, correctCount, wrongCount, isOffline } = this.data

    if (answers.length === 0) {
      wx.navigateBack()
      return
    }

    try {
      wx.showLoading({ title: '提交中...' })

      const studentId = app.globalData.userInfo?.studentId

      if (isOffline) {
        // 离线模式：保存到同步队列，稍后同步
        addToSyncQueue({
          type: 'study_complete',
          data: {
            studentId,
            answers,
            completedAt: Date.now()
          }
        })

        clearStudyProgress()
        wx.hideLoading()

        wx.showModal({
          title: '离线保存成功',
          content: '答题记录已保存，联网后将自动同步',
          showCancel: false,
          success: () => {
            wx.redirectTo({
              url: `/pages/study/result?correct=${correctCount}&wrong=${wrongCount}&total=${answers.length}&offline=true`,
            })
          }
        })
        return
      }

      // 在线模式：直接提交
      await post('/study-records', {
        studentId,
        answers,
      })

      clearStudyProgress()

      wx.hideLoading()

      wx.redirectTo({
        url: `/pages/study/result?correct=${correctCount}&wrong=${wrongCount}&total=${answers.length}`,
      })
    } catch (error) {
      wx.hideLoading()
      console.error('提交失败:', error)

      // 提交失败，保存到离线队列
      addToSyncQueue({
        type: 'study_complete',
        data: {
          studentId: app.globalData.userInfo?.studentId,
          answers,
          completedAt: Date.now()
        }
      })

      wx.showModal({
        title: '提交失败',
        content: '答题记录已离线保存，联网后将自动同步',
        confirmText: '查看结果',
        success: (res) => {
          if (res.confirm) {
            clearStudyProgress()
            wx.redirectTo({
              url: `/pages/study/result?correct=${correctCount}&wrong=${wrongCount}&total=${answers.length}&offline=true`,
            })
          }
        },
      })
    }
  },

  // 保存进度（每答完一题调用）
  saveProgress() {
    const { tasks, currentIndex, answers, correctCount, wrongCount, sessionStartTime } = this.data

    const progressData = {
      tasks,
      currentIndex,
      answers,
      correctCount,
      wrongCount,
      timestamp: Date.now(),
      startTime: sessionStartTime,
      elapsedSeconds: Math.floor((Date.now() - sessionStartTime) / 1000),
    }

    saveStudyProgress(progressData)
    console.log(`[进度] 已保存 ${answers.length}/${tasks.length}`)
  },

  // 恢复进度
  async resumeProgress() {
    const progress = getStudyProgress()

    if (!progress) {
      this.loadTasks()
      return
    }

    const savedDate = progress.timestamp ? new Date(progress.timestamp).toDateString() : null
    const today = new Date().toDateString()
    if (savedDate !== today) {
      console.log('进度已过期（跨天），重新加载任务')
      clearStudyProgress()
      this.loadTasks()
      return
    }

    try {
      wx.showLoading({ title: '校验进度中...' })
      const studentId = app.globalData.userInfo?.studentId

      const response = await get(`/students/${studentId}/daily-tasks`)
      const serverTasks = Array.isArray(response) ? response : (response?.tasks || [])

      wx.hideLoading()

      if (!serverTasks || serverTasks.length === 0) {
        clearStudyProgress()
        wx.showModal({
          title: '提示',
          content: '任务已更新，请重新开始',
          showCancel: false,
          success: () => wx.navigateBack()
        })
        return
      }

      const serverTaskIds = new Set(serverTasks.map(t => t.id))
      const serverVocabIds = new Set(serverTasks.map(t => t.vocabularyId))

      const validLocalTasks = progress.tasks.filter(t =>
        serverTaskIds.has(t.id) || serverVocabIds.has(t.vocabularyId)
      )

      if (validLocalTasks.length === 0) {
        console.log('本地进度已全部失效，重新加载')
        clearStudyProgress()
        this.loadTasks()
        return
      }

      const answeredVocabIds = new Set(progress.answers.map(a => a.vocabularyId))
      const remainingTasks = validLocalTasks.filter(t => !answeredVocabIds.has(t.vocabularyId))

      if (remainingTasks.length === 0) {
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

      // 恢复进度时，恢复计时
      const elapsedSeconds = progress.elapsedSeconds || 0
      const resumedStartTime = Date.now() - (elapsedSeconds * 1000)

      this.setData({
        tasks: validLocalTasks,
        currentIndex: validLocalTasks.length - remainingTasks.length,
        answers: progress.answers,
        correctCount: progress.correctCount,
        wrongCount: progress.wrongCount,
        totalCount: validLocalTasks.length,
        sessionStartTime: resumedStartTime,
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

  // 播放音频
  playAudio() {
    const { currentTask } = this.data

    if (!currentTask || !currentTask.vocabulary) {
      return
    }

    if (currentTask.vocabulary.audioUrl) {
      if (!this.data.audioContext) {
        this.data.audioContext = wx.createInnerAudioContext()
      }

      this.data.audioContext.src = currentTask.vocabulary.audioUrl
      this.data.audioContext.play()
    } else {
      wx.showToast({
        title: '正在加载音频...',
        icon: 'loading',
        duration: 1000
      })
    }
  },
})
