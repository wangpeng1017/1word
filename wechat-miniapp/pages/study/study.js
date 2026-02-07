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
      this.loadTasks(options.mode || 'all', options.day || null)
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

  async loadTasks(mode = 'all', day = null) {
    try {
      this.setData({ isLoading: true })
      // 保存当前模式和天数到实例变量，用于保存进度
      this.currentMode = mode
      this.currentDay = day

      if (mode === 'new') {
        wx.setNavigationBarTitle({ title: '今日新词' })
      } else if (mode === 'review') {
        wx.setNavigationBarTitle({ title: '今日复习' })
      }

      wx.showLoading({ title: '加载中...' })
      const studentId = app.globalData.userInfo?.studentId
      if (!studentId) throw new Error('未找到学生ID')
      const cachedTasks = getTodayWords()
      let tasks = []
      try {
        let url = '/students/' + studentId + '/daily-tasks'
        if (day) url += '?day=' + day

        let response = await get(url)
        if (Array.isArray(response)) tasks = response
        else if (response?.tasks) tasks = response.tasks
        else if (response?.data?.tasks) tasks = response.data.tasks

        // 只有正常的每日任务才走离线缓存逻辑，补打卡任务不缓存
        if (tasks.length === 0 && !day) {
          response = await post('/students/' + studentId + '/daily-tasks')
          if (Array.isArray(response)) tasks = response
          else if (response?.tasks) tasks = response.tasks
          else if (response?.data?.tasks) tasks = response.data.tasks
        }

        if (tasks.length > 0 && !day) saveTodayWords(tasks)
        this.setData({ isOffline: false })
      } catch (e) {
        // 补打卡模式不支持离线
        if (day) throw e

        if (cachedTasks?.length > 0) { tasks = cachedTasks; this.setData({ isOffline: true }); wx.showToast({ title: '离线模式', icon: 'none' }) }
        else throw e
      }

      if (!tasks?.length) {
        wx.hideLoading();
        wx.showModal({
          title: '提示',
          content: mode === 'new' ? '今日新词已学完' : (mode === 'review' ? '今日复习已完成' : '暂无学习任务'),
          showCancel: false,
          success: () => wx.navigateBack()
        });
        return
      }

      // 根据模式过滤任务
      if (mode === 'new') {
        tasks = tasks.filter(t => t.isNew)
      } else if (mode === 'review') {
        tasks = tasks.filter(t => !t.isNew)
      }

      const validTasks = tasks.filter(t => t.vocabulary?.questions?.length > 0)
      if (validTasks.length === 0) { wx.hideLoading(); wx.showModal({ title: '提示', content: '所有任务都没有可用题目', showCancel: false, success: () => wx.navigateBack() }); return }

      let sessionId = null, lastSyncedIndex = -1, resumedIndex = 0, resumedCorrect = 0, resumedWrong = 0
      console.log('[DEBUG] loadTasks - isOffline:', this.data.isOffline, 'validTasks.length:', validTasks.length)

      // 创建新会话（仅在线且非补卡模式）
      // 注意：这里不再处理 resume 逻辑，resume 由 resumeProgress 专门处理
      if (!this.data.isOffline && !day) {
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
          sessionId = sr.sessionId;
          setCurrentSessionId(sessionId)
          // 注意：后端可能返回 resumed 信息，但我们主要依赖前端 resumeProgress 恢复
          // 如果后端返回了进度，也可以作为参考（但前端进度通常更准确）
        }
      }
      console.log('[DEBUG] 最终 sessionId:', sessionId)

      // 性能优化：将完整任务存入实例变量，data中只存当前需要的子集
      this.allTasks = validTasks
      // 初始加载数量：如果是恢复进度，至少加载到当前进度+20题；否则加载前20题
      const initialLoadCount = resumedIndex + 20
      const visibleTasks = validTasks.slice(0, initialLoadCount)

      this.setData({ tasks: visibleTasks, totalCount: validTasks.length, isLoading: false, sessionId, lastSyncedIndex, currentIndex: resumedIndex, correctCount: resumedCorrect, wrongCount: resumedWrong })
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

    // 前端打乱选项顺序
    if (question.options && question.options.length > 0) {
      // 1. 深度复制选项数组，避免污染源数据
      const shuffledOptions = JSON.parse(JSON.stringify(question.options))

      // 2. Fisher-Yates 洗牌算法
      for (let i = shuffledOptions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
      }

      // 3. 找到正确答案在乱序该数组中的新位置
      // 后端返回的 options 中通常包含 isCorrect=true 标记
      const correctIndex = shuffledOptions.findIndex(o => o.isCorrect)
      if (correctIndex !== -1) {
        // 更新正确答案标识为新的位置 (A/B/C/D)
        const labels = ['A', 'B', 'C', 'D']
        question.correctAnswer = labels[correctIndex]
      }

      // 4. 更新题目选项
      question.options = shuffledOptions
    }

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

    // 修复：停止并销毁旧的预加载上下文，避免音频混乱
    if (this.data.preloadAudioContext) {
      this.data.preloadAudioContext.stop()
      this.data.preloadAudioContext.destroy()
    }

    // 创建新的预加载音频上下文
    this.data.preloadAudioContext = wx.createInnerAudioContext()
    const preloadCtx = this.data.preloadAudioContext

    // 设置音频源但不播放（微信会自动缓冲）
    preloadCtx.src = nextAudioUrl
    preloadCtx.volume = 0 // 静音预加载

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
      else if (newCC === 3) playSound(SoundType.STREAK_3)   // 连对3题
      else playSound(SoundType.CORRECT)                     // 普通答对
    } else {
      playSound(SoundType.WRONG)                            // 答错
    }
    this.setData({ isAnswered: true, isCorrect, showResult: true, answers, correctCount, wrongCount, consecutiveCorrect: newCC, showExpGain: isCorrect, expGainValue: expGain })
    this.saveProgress()

    // 注意：错题重测模式下，答对的题目会在完成时提交答题记录到服务器
    // 服务器会在 question_answers 表中插入 isCorrect=true 的新记录
    // 错题列表查询使用 ROW_NUMBER 取最新记录，所以答对的题目会自动从错题列表消失

    if (isMilestone) setTimeout(() => this.showMilestonePopup(newCC), 300)
    if (isCorrect) { setTimeout(() => this.setData({ showExpGain: false }), 1000); setTimeout(() => this.nextQuestion(), isMilestone ? 1500 : 800) }
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

    // 性能优化：动态加载更多题目
    // 当剩余题目不足5题，且还有更多题目未加载时，追加加载20题
    if (this.allTasks && nextIndex + 5 >= this.data.tasks.length && this.data.tasks.length < this.totalCount) {
      const currentLength = this.data.tasks.length
      const moreTasks = this.allTasks.slice(currentLength, currentLength + 20)
      if (moreTasks.length > 0) {
        // 使用 concat 追加数据，避免重置整个数组
        // 注意：微信小程序 setData 对长数组追加可能有性能瓶颈，但在 2000 条规模下通常优于一次性传输
        // 更优做法是 key-path更新 'tasks[index]': item，但这里用 concat 简单且足够
        this.setData({
          tasks: this.data.tasks.concat(moreTasks)
        })
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

    // 重测模式：提交答题记录到 question_answers 表
    if (isRetestMode) {
      try {
        wx.showLoading({ title: '提交中...' })
        const studentId = app.globalData.userInfo?.studentId
        // 提交答题记录，让答对的题目从错题列表中消失
        await post('/study-records', { studentId, answers, isRetestMode: true })
        playSound(SoundType.COMPLETE)
        clearStudyProgress()
        wx.hideLoading()
        wx.redirectTo({ url: '/pages/study/result?correct=' + correctCount + '&wrong=' + wrongCount + '&total=' + answers.length + '&mode=retest' })
      } catch (e) {
        wx.hideLoading()
        console.error('提交重测结果失败:', e)
        // 即使提交失败也跳转结果页
        wx.redirectTo({ url: '/pages/study/result?correct=' + correctCount + '&wrong=' + wrongCount + '&total=' + answers.length + '&mode=retest&offline=true' })
      }
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
    // 关键修正：保存 this.allTasks (完整列表) 而非 data.tasks (切片)
    const { currentIndex, answers, correctCount, wrongCount, sessionStartTime, sessionId, lastSyncedIndex } = this.data
    // 如果没有 allTasks，说明可能还没加载完，尝试用 tasks
    const tasksToSave = this.allTasks || this.data.tasks

    saveStudyProgress({
      tasks: tasksToSave,
      currentIndex,
      answers,
      correctCount,
      wrongCount,
      timestamp: Date.now(),
      startTime: sessionStartTime,
      elapsedSeconds: Math.floor((Date.now() - sessionStartTime) / 1000),
      sessionId,
      lastSyncedIndex,
      // 关键修正：保存 currentMode 和 currentDay，以便正确恢复上下文
      mode: this.currentMode || 'all',
      day: this.currentDay || null,
      isRetestMode: this.data.isRetestMode // 保存重测模式标志
    })
  },

  async resumeProgress() {
    const progress = getStudyProgress()
    if (!progress) { this.loadTasks(); return }

    // 检查进度日期，如果是今天的才恢复（或者 progress 中没有 timestamp）
    if (progress.timestamp && new Date(progress.timestamp).toDateString() !== new Date().toDateString()) {
      clearStudyProgress(); this.loadTasks(); return
    }

    // 关键修正：直接信任本地缓存，不再请求后端校验，防止后端数据更新导致进度失效
    try {
      wx.showLoading({ title: '恢复进度中...' })
      const validLocalTasks = progress.tasks || []
      if (validLocalTasks.length === 0) { clearStudyProgress(); this.loadTasks(); return }

      // 恢复上下文
      this.currentMode = progress.mode || 'all'
      this.currentDay = progress.day || null

      // 恢复重测模式标志
      const isRetestMode = progress.isRetestMode || false

      // 设置标题
      if (isRetestMode) {
        wx.setNavigationBarTitle({ title: '错题重测' })
      } else if (this.currentMode === 'new') {
        wx.setNavigationBarTitle({ title: '今日新词' })
      } else if (this.currentMode === 'review') {
        wx.setNavigationBarTitle({ title: '今日复习' })
      }

      const elapsedSeconds = progress.elapsedSeconds || 0

      // 性能优化：初始化 allTasks 并切片
      this.allTasks = validLocalTasks
      const resumedIndex = progress.currentIndex || (progress.answers && progress.answers.length) || 0

      // 确保 resumedIndex 不越界
      if (resumedIndex >= validLocalTasks.length) {
        this.finishStudy(); return
      }

      const initialLoadCount = resumedIndex + 20
      const visibleTasks = validLocalTasks.slice(0, initialLoadCount)

      this.setData({
        tasks: visibleTasks,
        currentIndex: resumedIndex,
        answers: progress.answers || [],
        correctCount: progress.correctCount || 0,
        wrongCount: progress.wrongCount || 0,
        totalCount: validLocalTasks.length,
        sessionStartTime: Date.now() - (elapsedSeconds * 1000),
        isLoading: false,
        sessionId: progress.sessionId || null,
        lastSyncedIndex: progress.lastSyncedIndex ?? -1,
        isRetestMode: isRetestMode
      })

      if (progress.sessionId) setCurrentSessionId(progress.sessionId)

      wx.hideLoading()
      wx.showToast({ title: '已恢复进度', icon: 'none', duration: 1500 })
      this.loadCurrentQuestion()
    } catch (e) {
      console.error('恢复进度失败:', e)
      wx.hideLoading(); clearStudyProgress(); this.loadTasks()
    }
  },

  exitStudy() { wx.showModal({ title: '确认退出', content: '当前进度会被保存', confirmText: '确定退出', success: (r) => { if (r.confirm) { this.syncBeforeLeave(); wx.navigateBack() } } }) },

  playAudio() {
    const { currentTask } = this.data
    if (!currentTask?.vocabulary) return
    wx.vibrateShort({ type: 'light' }) // 增加触感反馈
    if (currentTask.vocabulary.audioUrl) {
      // 修复：先停止并销毁旧的音频上下文，避免音频混乱
      if (this.data.audioContext) {
        this.data.audioContext.stop()
        this.data.audioContext.destroy()
      }
      // 创建新的音频上下文
      this.data.audioContext = wx.createInnerAudioContext()
      this.data.audioContext.src = currentTask.vocabulary.audioUrl
      this.data.audioContext.play()
    } else wx.showToast({ title: '正在加载音频...', icon: 'loading', duration: 1000 })
  },

  // ========== 错题重测相关方法 ==========

  // 加载错题列表
  async loadRetestQuestions() {
    try {
      wx.showLoading({ title: '加载错题中...' })
      this.currentMode = 'retest' // 标记当前模式
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
})
