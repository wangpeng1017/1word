// pages/vocabulary-test/vocabulary-test.js
// @input: API获取词汇量测试题目
// @output: 答题结果，估算词汇量
// @pos: 词汇量测试页面，参考study页面交互风格
// ⚠️ 更新我时，请同步更新本注释及所属文件夹的 _INDEX.md

const { get, post } = require('../../utils/request')
const { SoundType, playSound, preloadSounds } = require('../../utils/audio')
const app = getApp()

Page({
    data: {
        state: 'intro',  // intro, loading, testing, result
        questions: [],
        currentIndex: 0,
        totalCount: 0,
        currentQuestion: null,
        selectedAnswer: '',
        isAnswered: false,
        isCorrect: false,
        showResult: false,
        answers: [],
        correctCount: 0,
        wrongCount: 0,
        unknownCount: 0,
        startTime: null,
        elapsedTime: '00:00',
        timer: null,
        progress: 0,
        estimatedVocab: 0,
        accuracy: 0,
        totalTime: 0,
        consecutiveCorrect: 0, // 连对计数
    },

    onLoad() {
        // 默认显示介绍页
        preloadSounds() // 预加载音效
    },

    onUnload() {
        if (this.data.timer) clearInterval(this.data.timer)
    },

    // 开始测试
    async startTest() {
        try {
            this.setData({ state: 'loading' })
            wx.showLoading({ title: '加载中...' })

            const studentId = app.globalData.userInfo?.studentId
            const result = await post('/vocabulary-quiz/start', { studentId })

            wx.hideLoading()

            const { questions, totalQuestions } = result

            if (!questions || questions.length === 0) {
                wx.showToast({ title: '暂无测试题目', icon: 'none' })
                this.setData({ state: 'intro' })
                return
            }

            this.setData({
                questions,
                totalCount: totalQuestions,
                currentIndex: 0,
                answers: [],
                correctCount: 0,
                wrongCount: 0,
                unknownCount: 0,
                startTime: Date.now(),
                state: 'testing',
            })

            this.startTimer()
            this.loadQuestion(0)
        } catch (error) {
            wx.hideLoading()
            console.error('开始测试失败:', error)
            wx.showToast({ title: error || '加载失败', icon: 'none' })
            this.setData({ state: 'intro' })
        }
    },

    // 加载题目
    loadQuestion(index) {
        const question = this.data.questions[index]
        this.setData({
            currentQuestion: question,
            currentIndex: index,
            selectedAnswer: '',
            isAnswered: false,
            isCorrect: false,
            showResult: false,
            progress: Math.round(((index + 1) / this.data.totalCount) * 100),
        })
    },

    // 选择答案
    selectAnswer(e) {
        if (this.data.isAnswered) return

        const answer = e.currentTarget.dataset.answer
        wx.vibrateShort({ type: 'light' })
        this.setData({ selectedAnswer: answer })
    },

    // 提交答案
    submitAnswer() {
        const { selectedAnswer, currentQuestion, answers, currentIndex, totalCount } = this.data
        if (!selectedAnswer) {
            wx.showToast({ title: '请选择答案', icon: 'none' })
            return
        }

        const isCorrect = selectedAnswer === currentQuestion.correctOption
        const isUnknown = selectedAnswer === 'E'

        // 振动反馈
        wx.vibrateShort({ type: isCorrect ? 'light' : 'heavy' })

        const answerRecord = {
            questionId: currentQuestion.id,
            userAnswer: selectedAnswer,
            isCorrect,
            timeSpent: Math.floor((Date.now() - this.data.startTime) / 1000),
        }

        const newAnswers = [...answers, answerRecord]
        const correctCount = newAnswers.filter(a => a.isCorrect).length
        const wrongCount = newAnswers.filter(a => !a.isCorrect && a.userAnswer !== 'E').length
        const unknownCount = newAnswers.filter(a => a.userAnswer === 'E').length

        // 音效逻辑
        let newCC = this.data.consecutiveCorrect
        if (isCorrect) {
            newCC++
            if (newCC === 10) playSound(SoundType.STREAK_10)
            else if (newCC === 5) playSound(SoundType.STREAK_5)
            else if (newCC === 3) playSound(SoundType.STREAK_3)
            else playSound(SoundType.CORRECT)
        } else {
            newCC = 0
            if (!isUnknown) playSound(SoundType.WRONG)
        }

        this.setData({
            isAnswered: true,
            isCorrect,
            showResult: true,
            answers: newAnswers,
            correctCount,
            wrongCount,
            unknownCount,
            consecutiveCorrect: newCC,
        })

        // 自动进入下一题或结束
        setTimeout(() => {
            if (currentIndex < totalCount - 1) {
                this.loadQuestion(currentIndex + 1)
            } else {
                this.finishTest()
            }
        }, isCorrect ? 800 : 1500)
    },

    // 下一题（手动点击）
    nextQuestion() {
        const { currentIndex, totalCount } = this.data
        if (currentIndex < totalCount - 1) {
            this.loadQuestion(currentIndex + 1)
        } else {
            this.finishTest()
        }
    },

    // 完成测试
    async finishTest() {
        try {
            if (this.data.timer) clearInterval(this.data.timer)

            wx.showLoading({ title: '提交中...' })

            const { answers, correctCount, startTime } = this.data
            const studentId = app.globalData.userInfo?.studentId
            const completedAt = Date.now()
            const totalTime = Math.floor((completedAt - startTime) / 1000)

            // 计算估算词汇量
            const estimatedVocab = Math.round(correctCount * 40)
            const accuracy = answers.length > 0 ? (correctCount / answers.length) * 100 : 0

            // 提交到服务器
            await post('/vocabulary-quiz/submit', {
                studentId,
                answers,
                startedAt: new Date(startTime).toISOString(),
                completedAt: new Date(completedAt).toISOString(),
            })

            wx.hideLoading()

            this.setData({
                state: 'result',
                estimatedVocab,
                accuracy: accuracy.toFixed(1),
                totalTime,
            })

            playSound(SoundType.COMPLETE) // 完成音效
        } catch (error) {
            wx.hideLoading()
            console.error('提交失败:', error)

            // 即使提交失败也显示结果
            const { answers, correctCount, startTime } = this.data
            const totalTime = Math.floor((Date.now() - startTime) / 1000)
            const estimatedVocab = Math.round(correctCount * 40)
            const accuracy = answers.length > 0 ? (correctCount / answers.length) * 100 : 0

            this.setData({
                state: 'result',
                estimatedVocab,
                accuracy: accuracy.toFixed(1),
                totalTime,
            })

            wx.showToast({ title: '提交失败，结果已保存', icon: 'none' })
        }
    },

    // 计时器
    startTimer() {
        const timer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.data.startTime) / 1000)
            this.setData({
                elapsedTime: String(Math.floor(elapsed / 60)).padStart(2, '0') + ':' + String(elapsed % 60).padStart(2, '0')
            })
        }, 1000)
        this.setData({ timer })
    },

    // 退出测试
    exitTest() {
        wx.showModal({
            title: '确认退出',
            content: '退出后测试进度将不会保存',
            confirmText: '确定退出',
            success: (res) => {
                if (res.confirm) {
                    if (this.data.timer) clearInterval(this.data.timer)
                    wx.navigateBack()
                }
            }
        })
    },

    // 重新测试
    restartTest() {
        this.setData({
            state: 'intro',
            questions: [],
            currentIndex: 0,
            answers: [],
            correctCount: 0,
            wrongCount: 0,
            unknownCount: 0,
            consecutiveCorrect: 0,
        })
    },

    // 返回首页
    goHome() {
        wx.switchTab({ url: '/pages/index/index' })
    },
})
