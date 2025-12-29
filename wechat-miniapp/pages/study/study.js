// pages/study/study.js
const { get, post } = require('../../utils/request')
const { createSession, syncProgress, completeSession, checkOnline, setCurrentSessionId } = require('../../utils/sync')
const { saveStudyProgress, getStudyProgress, clearStudyProgress, saveTodayWords, getTodayWords, addToSyncQueue } = require('../../utils/storage')
const app = getApp()

Page({
  data: {
    tasks: [], currentIndex: 0, totalCount: 0, currentTask: null, currentQuestion: null,
    selectedAnswer: '', isAnswered: false, isCorrect: false, showResult: false,
    answers: [], correctCount: 0, wrongCount: 0, startTime: null, sessionStartTime: null,
    elapsedTime: '00:00', timer: null, progress: 0, isLoading: true, loadError: false,
    audioContext: null, consecutiveCorrect: 0, showMilestone: false, milestoneCount: 0,
    showExpGain: false, expGainValue: 0, isOffline: false, isSubmitting: false,
    sessionId: null, lastSyncedIndex: -1,
  },

  async onLoad(options) {
    if (!app.globalData.token) { wx.reLaunch({ url: '/pages/login/login' }); return }

    // 等待 userInfo 加载完成
    await this.ensureUserInfo()

    this.setData({ startTime: Date.now(), sessionStartTime: Date.now() })
    this.startTimer()
    options.resume === 'true' ? this.resumeProgress() : this.loadTasks()
  },

  // 确保 userInfo 已加载
  async ensureUserInfo() {
    if (app.globalData.userInfo?.studentId) {
      console.log('[DEBUG] userInfo 已存在:', app.globalData.userInfo)
      return
    }

    console.log('[DEBUG] userInfo 未加载，等待中...')
    // 最多等待 3 秒
    for (let i = 0; i < 30; i++) {
      if (app.globalData.userInfo?.studentId) {
        console.log('[DEBUG] userInfo 加载完成:', app.globalData.userInfo)
        return
      }
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // 超时后尝试重新获取
    console.log('[DEBUG] userInfo 加载超时，尝试重新登录')
    wx.reLaunch({ url: '/pages/login/login' })
  },

  onUnload() { if (this.data.timer) clearInterval(this.data.timer); this.syncBeforeLeave() },
  onHide() { this.syncBeforeLeave() },

  syncBeforeLeave() {
    const { answers, currentIndex, totalCount, lastSyncedIndex, sessionId } = this.data
    if (answers.length === 0 || currentIndex >= totalCount) return
    this.saveProgress()
    const newAnswers = answers.slice(lastSyncedIndex + 1)
    if (newAnswers.length > 0 && sessionId && checkOnline()) {
      syncProgress(newAnswers)
      this.data.lastSyncedIndex = answers.length - 1
    }
  },

  startTimer() {
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.data.sessionStartTime) / 1000)
      this.setData({ elapsedTime: String(Math.floor(elapsed/60)).padStart(2,'0') + ':' + String(elapsed%60).padStart(2,'0') })
    }, 1000)
    this.setData({ timer })
  },

  async loadTasks() {
    try {
      wx.showLoading({ title: '加载中...' })
      const studentId = app.globalData.userInfo?.studentId
      if (!studentId) throw new Error('未找到学生ID')
      const cachedTasks = getTodayWords()
      let tasks = []
      try {
        let response = await get('/students/' + studentId + '/daily-tasks')
        if (Array.isArray(response)) tasks = response
        else if (response?.tasks) tasks = response.tasks
        else if (response?.data?.tasks) tasks = response.data.tasks
        if (tasks.length === 0) {
          response = await post('/students/' + studentId + '/daily-tasks')
          if (Array.isArray(response)) tasks = response
          else if (response?.tasks) tasks = response.tasks
          else if (response?.data?.tasks) tasks = response.data.tasks
        }
        if (tasks.length > 0) saveTodayWords(tasks)
        this.setData({ isOffline: false })
      } catch (e) {
        if (cachedTasks?.length > 0) { tasks = cachedTasks; this.setData({ isOffline: true }); wx.showToast({ title: '离线模式', icon: 'none' }) }
        else throw e
      }
      if (!tasks?.length) { wx.hideLoading(); wx.showModal({ title: '提示', content: '暂无学习任务', showCancel: false, success: () => wx.navigateBack() }); return }
      const validTasks = tasks.filter(t => t.vocabulary?.questions?.length > 0)
      if (validTasks.length === 0) { wx.hideLoading(); wx.showModal({ title: '提示', content: '所有任务都没有可用题目', showCancel: false, success: () => wx.navigateBack() }); return }
      let sessionId = null, lastSyncedIndex = -1, resumedIndex = 0, resumedCorrect = 0, resumedWrong = 0
      console.log('[DEBUG] loadTasks - isOffline:', this.data.isOffline, 'validTasks.length:', validTasks.length)
      if (!this.data.isOffline) {
        console.log('[DEBUG] 准备创建会话 - validTasks.length:', validTasks.length)
        const sr = await createSession(validTasks.length)
        console.log('[DEBUG] createSession 返回结果:', sr)
        if (sr) {
          sessionId = sr.sessionId; setCurrentSessionId(sessionId)
          if (sr.isResumed && sr.completedWords > 0) {
            lastSyncedIndex = sr.completedWords - 1
            resumedIndex = sr.completedWords
            resumedCorrect = sr.correctCount || 0
            resumedWrong = sr.wrongCount || 0
            wx.showToast({ title: '已恢复进度 ' + sr.completedWords + '/' + validTasks.length, icon: 'none', duration: 1500 })
          }
        }
      }
      console.log('[DEBUG] 最终 sessionId:', sessionId, 'lastSyncedIndex:', lastSyncedIndex, 'resumedIndex:', resumedIndex)
      this.setData({ tasks: validTasks, totalCount: validTasks.length, isLoading: false, sessionId, lastSyncedIndex, currentIndex: resumedIndex, correctCount: resumedCorrect, wrongCount: resumedWrong })
      wx.hideLoading()
      this.loadCurrentQuestion()
    } catch (e) { wx.hideLoading(); wx.showModal({ title: '加载失败', content: e.message || '请检查网络', showCancel: false, success: () => wx.navigateBack() }) }
  },

  loadCurrentQuestion() {
    const { tasks, currentIndex } = this.data
    if (currentIndex >= tasks.length) { this.finishStudy(); return }
    const currentTask = tasks[currentIndex], vocabulary = currentTask.vocabulary
    let question = null
    if (currentTask.selectedQuestionId) question = vocabulary.questions.find(q => q.id === currentTask.selectedQuestionId)
    if (!question && currentTask.targetQuestionType) question = vocabulary.questions.find(q => q.type === currentTask.targetQuestionType)
    if (!question && vocabulary.questions.length > 0) question = vocabulary.questions[Math.floor(Math.random() * vocabulary.questions.length)]
    if (!question) { this.nextQuestion(); return }
    this.setData({ currentTask, currentQuestion: question, selectedAnswer: '', isAnswered: false, isCorrect: false, showResult: false, progress: Math.round(((currentIndex + 1) / tasks.length) * 100) })
  },

  selectAnswer(e) { if (!this.data.isAnswered) this.setData({ selectedAnswer: e.currentTarget.dataset.answer }) },

  submitAnswer() {
    const { selectedAnswer, currentQuestion, currentTask, consecutiveCorrect } = this.data
    if (!selectedAnswer) { wx.showToast({ title: '请选择答案', icon: 'none' }); return }
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer
    const timeSpent = Math.floor((Date.now() - this.data.startTime) / 1000)
    const answerRecord = { vocabularyId: currentTask.vocabularyId, questionId: currentQuestion.id, answer: selectedAnswer, isCorrect, timeSpent, taskId: currentTask.id, timestamp: Date.now() }
    const answers = [...this.data.answers, answerRecord]
    const correctCount = answers.filter(a => a.isCorrect).length, wrongCount = answers.length - correctCount
    const newCC = isCorrect ? consecutiveCorrect + 1 : 0
    let expGain = isCorrect ? 1 : 0
    const isMilestone = isCorrect && newCC > 0 && newCC % 5 === 0
    if (isMilestone) expGain += Math.floor(newCC / 5)
    this.setData({ isAnswered: true, isCorrect, showResult: true, answers, correctCount, wrongCount, consecutiveCorrect: newCC, showExpGain: isCorrect, expGainValue: expGain })
    this.saveProgress()
    if (isMilestone) setTimeout(() => this.showMilestonePopup(newCC), 300)
    if (isCorrect) { setTimeout(() => this.setData({ showExpGain: false }), 1000); setTimeout(() => this.nextQuestion(), isMilestone ? 2500 : 1500) }
  },

  playFeedback(c) {},
  showMilestonePopup(count) { this.setData({ showMilestone: true, milestoneCount: count }); setTimeout(() => this.setData({ showMilestone: false }), 2000) },
  closeMilestone() { this.setData({ showMilestone: false }) },
  nextQuestion() { const { currentIndex, totalCount } = this.data; currentIndex + 1 >= totalCount ? this.finishStudy() : (this.setData({ currentIndex: currentIndex + 1, startTime: Date.now() }), this.loadCurrentQuestion()) },

  async finishStudy() {
    if (this.data.isSubmitting) return
    this.setData({ isSubmitting: true })
    const { answers, correctCount, wrongCount, sessionId, lastSyncedIndex } = this.data
    if (answers.length === 0) { wx.navigateBack(); return }
    try {
      wx.showLoading({ title: '提交中...' })
      const studentId = app.globalData.userInfo?.studentId
      if (!checkOnline()) {
        addToSyncQueue({ type: 'study_complete', data: { studentId, answers, completedAt: Date.now() } })
        clearStudyProgress(); wx.hideLoading()
        wx.showModal({ title: '离线保存成功', content: '联网后将自动同步', showCancel: false, success: () => wx.redirectTo({ url: '/pages/study/result?correct=' + correctCount + '&wrong=' + wrongCount + '&total=' + answers.length + '&offline=true' }) })
        return
      }
      const newAnswers = answers.slice(lastSyncedIndex + 1)
      if (newAnswers.length > 0 && sessionId) await syncProgress(newAnswers)
      if (sessionId) await completeSession()
      else await post('/study-records', { studentId, answers })
      clearStudyProgress(); wx.hideLoading()
      wx.redirectTo({ url: '/pages/study/result?correct=' + correctCount + '&wrong=' + wrongCount + '&total=' + answers.length })
    } catch (e) {
      wx.hideLoading()
      addToSyncQueue({ type: 'study_complete', data: { studentId: app.globalData.userInfo?.studentId, answers, completedAt: Date.now() } })
      wx.showModal({ title: '提交失败', content: '已离线保存', confirmText: '查看结果', success: (r) => { if (r.confirm) { clearStudyProgress(); wx.redirectTo({ url: '/pages/study/result?correct=' + correctCount + '&wrong=' + wrongCount + '&total=' + answers.length + '&offline=true' }) } } })
    }
  },

  saveProgress() {
    const { tasks, currentIndex, answers, correctCount, wrongCount, sessionStartTime, sessionId, lastSyncedIndex } = this.data
    saveStudyProgress({ tasks, currentIndex, answers, correctCount, wrongCount, timestamp: Date.now(), startTime: sessionStartTime, elapsedSeconds: Math.floor((Date.now() - sessionStartTime) / 1000), sessionId, lastSyncedIndex })
  },

  async resumeProgress() {
    const progress = getStudyProgress()
    if (!progress) { this.loadTasks(); return }
    if (progress.timestamp && new Date(progress.timestamp).toDateString() !== new Date().toDateString()) { clearStudyProgress(); this.loadTasks(); return }
    try {
      wx.showLoading({ title: '校验进度中...' })
      const studentId = app.globalData.userInfo?.studentId
      const response = await get('/students/' + studentId + '/daily-tasks')
      const serverTasks = Array.isArray(response) ? response : (response?.tasks || [])
      wx.hideLoading()
      if (!serverTasks?.length) { clearStudyProgress(); wx.showModal({ title: '提示', content: '任务已更新', showCancel: false, success: () => wx.navigateBack() }); return }
      const serverTaskIds = new Set(serverTasks.map(t => t.id)), serverVocabIds = new Set(serverTasks.map(t => t.vocabularyId))
      const validLocalTasks = progress.tasks.filter(t => serverTaskIds.has(t.id) || serverVocabIds.has(t.vocabularyId))
      if (validLocalTasks.length === 0) { clearStudyProgress(); this.loadTasks(); return }
      const answeredVocabIds = new Set(progress.answers.map(a => a.vocabularyId))
      const remainingTasks = validLocalTasks.filter(t => !answeredVocabIds.has(t.vocabularyId))
      if (remainingTasks.length === 0) {
        this.setData({ tasks: validLocalTasks, answers: progress.answers, correctCount: progress.correctCount, wrongCount: progress.wrongCount, totalCount: validLocalTasks.length, currentIndex: validLocalTasks.length, isLoading: false, sessionId: progress.sessionId || null, lastSyncedIndex: progress.lastSyncedIndex ?? -1 })
        this.finishStudy(); return
      }
      const elapsedSeconds = progress.elapsedSeconds || 0
      this.setData({ tasks: validLocalTasks, currentIndex: validLocalTasks.length - remainingTasks.length, answers: progress.answers, correctCount: progress.correctCount, wrongCount: progress.wrongCount, totalCount: validLocalTasks.length, sessionStartTime: Date.now() - (elapsedSeconds * 1000), isLoading: false, sessionId: progress.sessionId || null, lastSyncedIndex: progress.lastSyncedIndex ?? -1 })
      if (progress.sessionId) setCurrentSessionId(progress.sessionId)
      wx.showToast({ title: '已恢复进度 ' + progress.answers.length + '/' + validLocalTasks.length, icon: 'none', duration: 1500 })
      this.loadCurrentQuestion()
    } catch (e) { wx.hideLoading(); clearStudyProgress(); this.loadTasks() }
  },

  exitStudy() { wx.showModal({ title: '确认退出', content: '当前进度会被保存', confirmText: '确定退出', success: (r) => { if (r.confirm) { this.syncBeforeLeave(); wx.navigateBack() } } }) },

  playAudio() {
    const { currentTask } = this.data
    if (!currentTask?.vocabulary) return
    if (currentTask.vocabulary.audioUrl) {
      if (!this.data.audioContext) this.data.audioContext = wx.createInnerAudioContext()
      this.data.audioContext.src = currentTask.vocabulary.audioUrl
      this.data.audioContext.play()
    } else wx.showToast({ title: '正在加载音频...', icon: 'loading', duration: 1000 })
  },
})
