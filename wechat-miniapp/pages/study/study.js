// pages/study/study.js
// @input: API获取每日学习任务，本地缓存支持离线
// @output: 答题结果同步到服务器，完成后跳转result页
// @pos: 小程序核心学习页面，包含答题、进度、配对游戏触发、图片URL拼接
// ⚠️ 更新我时，请同步更新本注释及所属文件夹的 _INDEX.md

const { get, post } = require('../../utils/request')
const { createSession, syncProgress, completeSession, checkOnline, setCurrentSessionId } = require('../../utils/sync')
const { saveStudyProgress, getStudyProgress, clearStudyProgress, saveTodayWords, getTodayWords, addToSyncQueue } = require('../../utils/storage')
const { SoundType, playSound, preloadSounds } = require('../../utils/audio')
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
    isRetestMode: false, // 错题重测模式
    retestQuestionIds: [], // 重测的题目ID列表
    wrongQuestionMap: {}, // questionId -> wrongQuestionId 映射
  },

  async onLoad(options) {
    if (!app.globalData.token) { wx.reLaunch({ url: '/pages/login/login' }); return }

    // 等待 userInfo 加载完成
    await this.ensureUserInfo()

    this.setData({ startTime: Date.now(), sessionStartTime: Date.now() })
    this.startTimer()
    preloadSounds()  // 预加载音效

    // 检查是否是错题重测模式
    if (options.mode === 'retest' && options.questionIds) {
      this.setData({ isRetestMode: true, retestQuestionIds: options.questionIds.split(',') })
      this.loadRetestQuestions()
    } else if (options.resume === 'true') {
      this.resumeProgress()
    } else {
      this.loadTasks()
    }
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
      this.setData({ elapsedTime: String(Math.floor(elapsed / 60)).padStart(2, '0') + ':' + String(elapsed % 60).padStart(2, '0') })
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
          // 检查是否今天已完成
          if (sr.isCompleted) {
            wx.hideLoading()
            wx.showModal({ title: '提示', content: sr.message || '今天的学习任务已完成', showCancel: false, success: () => wx.navigateBack() })
            return
          }
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
    // 处理图片URL：相对路径转完整URL
    if (vocabulary.imageUrl && vocabulary.imageUrl.startsWith('/')) {
      const baseUrl = (app.globalData.apiUrl || '').replace(/\/api$/, '')
      vocabulary.imageUrl = baseUrl + vocabulary.imageUrl
    }
    let question = null
    if (currentTask.selectedQuestionId) question = vocabulary.questions.find(q => q.id === currentTask.selectedQuestionId)
    if (!question && currentTask.targetQuestionType) question = vocabulary.questions.find(q => q.type === currentTask.targetQuestionType)
    if (!question && vocabulary.questions.length > 0) question = vocabulary.questions[Math.floor(Math.random() * vocabulary.questions.length)]
    if (!question) { this.nextQuestion(); return }
    this.setData({ currentTask, currentQuestion: question, selectedAnswer: '', isAnswered: false, isCorrect: false, showResult: false, progress: Math.round(((currentIndex + 1) / tasks.length) * 100) })

    // 预缓冲下一题音频
    this.preloadNextAudio()
  },

  // 预缓冲下一题音频
  preloadNextAudio() {
    const { tasks, currentIndex } = this.data
    const nextIndex = currentIndex + 1

    if (nextIndex >= tasks.length) return

    const nextTask = tasks[nextIndex]
    const nextVocab = nextTask?.vocabulary

    if (!nextVocab) return

    // 获取下一题音频 URL（优先美式发音）
    const audios = nextVocab.word_audios || nextVocab.audios || []
    const audioUs = audios.find((a) => (a.accent || '').toUpperCase() === 'US')?.audioUrl
    const audioUk = audios.find((a) => (a.accent || '').toUpperCase() === 'UK')?.audioUrl
    const nextAudioUrl = audioUs ?? audioUk ?? nextVocab.audioUrl ?? nextVocab.audio_url ?? null

    if (!nextAudioUrl) return

    // 创建或复用预加载音频上下文
    if (!this.data.preloadAudioContext) {
      this.data.preloadAudioContext = wx.createInnerAudioContext()
    }

    const preloadCtx = this.data.preloadAudioContext

    // 设置音频源但不播放（微信会自动缓冲）
    if (preloadCtx.src !== nextAudioUrl) {
      preloadCtx.src = nextAudioUrl
      preloadCtx.volume = 0 // 静音预加载
    }

    // 监听缓冲事件，缓冲完成可停止
    preloadCtx.offCanplay() // 移除旧监听器
    preloadCtx.onCanplay(() => {
      // 下一题音频已缓冲就绪
      console.log('[预加载] 下一题音频已就绪:', nextVocab.word)
    })
  },

  selectAnswer(e) {
    if (!this.data.isAnswered) {
      wx.vibrateShort({ type: 'light' }) // 选择选项时轻振动
      this.setData({ selectedAnswer: e.currentTarget.dataset.answer })
    }
  },

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
    // 振动反馈：正确轻振动，错误重振动
    wx.vibrateShort({ type: isCorrect ? 'light' : 'heavy' })
    // 音效反馈
    if (isCorrect) {
      if (newCC === 10) playSound(SoundType.STREAK_10)      // 连对10题
      else if (newCC === 5) playSound(SoundType.STREAK_5)   // 连对5题
      else playSound(SoundType.CORRECT)                     // 普通答对
    } else {
      playSound(SoundType.WRONG)                            // 答错
    }
    this.setData({ isAnswered: true, isCorrect, showResult: true, answers, correctCount, wrongCount, consecutiveCorrect: newCC, showExpGain: isCorrect, expGainValue: expGain })
    this.saveProgress()

    // 如果是重测模式且答对了,删除错题记录
    if (this.data.isRetestMode && isCorrect) {
      this.removeWrongQuestion(currentQuestion.id)
    }

    if (isMilestone) setTimeout(() => this.showMilestonePopup(newCC), 300)
    if (isCorrect) { setTimeout(() => this.setData({ showExpGain: false }), 1000); setTimeout(() => this.nextQuestion(), isMilestone ? 2500 : 1500) }
  },

  playFeedback(c) { },
  showMilestonePopup(count) { this.setData({ showMilestone: true, milestoneCount: count }); setTimeout(() => this.setData({ showMilestone: false }), 2000) },
  closeMilestone() { this.setData({ showMilestone: false }) },
  nextQuestion() {
    const { currentIndex, totalCount, answers } = this.data
    const nextIndex = currentIndex + 1

    // 每答20题触发一次小游戏（且不是最后一题）
    if (answers.length > 0 && answers.length % 20 === 0 && nextIndex < totalCount) {
      const gameWords = this.getGameWords(4)
      if (gameWords.length >= 3) {
        wx.navigateTo({
          url: '/pages/matching-game/matching-game?words=' + encodeURIComponent(JSON.stringify(gameWords))
        })
        // 继续下一题（游戏返回后自动显示）
        this.setData({ currentIndex: nextIndex, startTime: Date.now() })
        this.loadCurrentQuestion()
        return
      }
    }

    // 原有逻辑
    nextIndex >= totalCount ? this.finishStudy() : (this.setData({ currentIndex: nextIndex, startTime: Date.now() }), this.loadCurrentQuestion())
  },

  // 获取小游戏单词（从最近答题中随机抽取）
  getGameWords(count) {
    const { tasks, answers, currentIndex } = this.data

    // 获取已答过的单词ID
    const answeredVocabIds = answers.map(a => a.vocabularyId)
    // 获取即将学习的单词（从当前位置往后）
    const upcomingTasks = tasks.slice(currentIndex)

    // 合并：已答过的 + 即将学习的
    const allCandidates = []

    // 先添加已答过的（优先）
    tasks.forEach(t => {
      if (answeredVocabIds.includes(t.vocabularyId)) {
        const meaning = this.getShortMeaning(t.vocabulary)
        if (meaning) {  // 只添加有效中文释义的
          allCandidates.push({ task: t, meaning })
        }
      }
    })

    // 如果不够，再添加即将学习的
    if (allCandidates.length < count) {
      upcomingTasks.forEach(t => {
        if (!answeredVocabIds.includes(t.vocabularyId)) {
          const meaning = this.getShortMeaning(t.vocabulary)
          if (meaning) {
            allCandidates.push({ task: t, meaning })
          }
        }
      })
    }

    // 随机抽取指定数量
    const shuffled = allCandidates.sort(() => Math.random() - 0.5)
    const selected = shuffled.slice(0, Math.min(count, shuffled.length))

    return selected.map(item => ({
      id: item.task.vocabularyId,
      word: item.task.vocabulary.word,
      meaning: item.meaning
    }))
  },

  // 获取简短释义（只返回中文，过滤英文内容）
  getShortMeaning(vocabulary) {
    // 尝试多个来源获取中文释义
    const sources = [
      vocabulary.meanings?.[0]?.meaning,
      vocabulary.primary_meaning,
      vocabulary.meanings?.[1]?.meaning
    ].filter(Boolean)

    for (const source of sources) {
      // 去除词性标记 (n. v. adj. 等)
      let cleaned = source.replace(/^[a-z]+\.\s*/i, '')
      // 取第一个分隔符前的内容
      let short = cleaned.split(/[；;，,、]/)[0].trim()
      // 去除括号内的英文注释 如 [the R-]
      short = short.replace(/\[[^\]]*\]/g, '').trim()
      // 检查是否包含中文
      if (/[\u4e00-\u9fa5]/.test(short) && short.length > 0) {
        return short.length > 8 ? short.substring(0, 8) : short
      }
    }

    // 如果没找到中文，返回空字符串（会被过滤掉）
    return ''
  },

  async finishStudy() {
    if (this.data.isSubmitting) return
    // 标记为已完成，防止 onUnload 时 syncBeforeLeave 再次保存进度
    this.setData({ isSubmitting: true, currentIndex: this.data.totalCount })
    const { answers, correctCount, wrongCount, sessionId, lastSyncedIndex, isRetestMode } = this.data
    if (answers.length === 0) { wx.navigateBack(); return }

    // 重测模式：直接跳转结果页，不记录学习历史
    if (isRetestMode) {
      playSound(SoundType.COMPLETE)
      clearStudyProgress()
      wx.redirectTo({ url: '/pages/study/result?correct=' + correctCount + '&wrong=' + wrongCount + '&total=' + answers.length + '&mode=retest' })
      return
    }

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
      playSound(SoundType.COMPLETE)  // 完成学习音效
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

  // ========== 错题重测相关方法 ==========

  // 加载错题列表
  async loadRetestQuestions() {
    try {
      wx.showLoading({ title: '加载错题中...' })
      const studentId = app.globalData.userInfo?.studentId
      if (!studentId) throw new Error('未找到学生ID')

      // 获取错题列表
      const response = await get(`/students/${studentId}/wrong-questions?limit=100`)
      const { wrongQuestions } = response

      if (!wrongQuestions || wrongQuestions.length === 0) {
        wx.hideLoading()
        wx.showModal({
          title: '提示',
          content: '暂无错题',
          showCancel: false,
          success: () => wx.navigateBack()
        })
        return
      }

      // 构建 wrongQuestionMap (questionId -> wrongQuestionId)
      const wrongQuestionMap = {}
      wrongQuestions.forEach(wq => {
        wrongQuestionMap[wq.questionId] = wq.id
      })

      // 转换为 tasks 格式（将 question 放入 vocabulary.questions 数组以兼容 loadCurrentQuestion）
      const tasks = wrongQuestions.map(wq => ({
        id: wq.id,
        vocabularyId: wq.vocabularyId,
        vocabulary: {
          ...wq.vocabulary,
          questions: wq.question ? [wq.question] : []
        },
        selectedQuestionId: wq.questionId
      }))

      this.setData({
        tasks,
        totalCount: tasks.length,
        isLoading: false,
        wrongQuestionMap
      })

      wx.hideLoading()
      this.loadCurrentQuestion()
    } catch (error) {
      wx.hideLoading()
      console.error('加载错题失败:', error)
      wx.showModal({
        title: '加载失败',
        content: error.message || '请检查网络',
        showCancel: false,
        success: () => wx.navigateBack()
      })
    }
  },

  // 删除错题记录
  async removeWrongQuestion(questionId) {
    try {
      const { wrongQuestionMap } = this.data
      const wrongQuestionId = wrongQuestionMap[questionId]

      if (!wrongQuestionId) {
        console.warn('未找到错题记录ID:', questionId)
        return
      }

      // 调用删除API
      const { del } = require('../../utils/request')
      await del(`/wrong-questions/${wrongQuestionId}`)

      console.log('错题已删除:', wrongQuestionId)
    } catch (error) {
      console.error('删除错题失败:', error)
      // 不阻塞流程,继续答题
    }
  },
})
