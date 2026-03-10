<template>
	<view class="container study-page" :class="{ celebrate: isCorrect && showResult }">
		<!-- 头部信息 -->
		<view class="study-header" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="header-info">
				<text class="word-count">当前单词（第 {{currentIndex + 1}}/{{totalCount}} 个）</text>
				<text class="time-spent">已用时 {{elapsedTime}}</text>
			</view>
			<view class="exit-btn" @click="exitStudy">×</view>
		</view>

		<!-- 趣味进度条 -->
		<view class="fun-progress">
			<view class="progress-track">
				<view class="progress-fill" :style="{ width: progress + '%' }">
					<text class="progress-emoji">🚀</text>
				</view>
			</view>
		</view>

		<!-- 加载中 -->
		<view v-if="isLoading" class="loading">
			<text>加载中...</text>
		</view>

		<!-- 答题区域 -->
		<view v-else class="study-content">
			<!-- 选择题模式1: 英文单词 + 4个中文释义选项 -->
			<view v-if="currentQuestion.type === 'ENGLISH_TO_CHINESE'" class="word-display">
				<view class="word-row">
					<text class="word-text">{{currentTask.vocabulary.word}}</text>
					<view class="speaker" @click="playAudio">🔊</view>
				</view>
				<!-- 单词实物图片 -->
				<image
					v-if="currentTask.isNew && currentTask.vocabulary.imageUrl"
					class="word-image"
					:src="currentTask.vocabulary.imageUrl"
					mode="aspectFit"
				/>
				<text class="question-hint">请选择正确的中文释义</text>
			</view>

			<!-- 选择题模式2: 汉语 + 4个英文单词选项 -->
			<view v-elif="currentQuestion.type === 'CHINESE_TO_ENGLISH'" class="word-display">
				<view v-if="currentTask.vocabulary.meanings && currentTask.vocabulary.meanings.length > 0" class="meanings-display">
					<view v-for="(item, index) in currentTask.vocabulary.meanings" :key="item.id" v-if="index < 2" class="meaning-item">
						<text class="pos-tag">{{item.partOfSpeech}}</text>
						<text class="meaning-text">{{item.meaning}}</text>
					</view>
				</view>
				<text v-else class="word-text chinese-text">暂无释义</text>
				<text class="question-hint">请选择正确的英文单词</text>
			</view>

			<!-- 选择题模式3: 英文单词读音 + 4个英文单词选项 -->
			<view v-elif="currentQuestion.type === 'LISTENING'" class="word-display">
				<view class="audio-icon" @click="playAudio">🔊</view>
				<text class="question-hint">听音选词</text>
			</view>

			<!-- 选择题模式4: 选词填空 -->
			<view v-elif="currentQuestion.type === 'FILL_IN_BLANK'" class="word-display">
				<view class="sentence-display">
					<text class="sentence-text">{{currentQuestion.content}}</text>
				</view>
				<text class="question-hint">选择正确的单词填空</text>
			</view>

			<view v-else class="word-display">
				<text class="word-text">{{currentTask.vocabulary.word}}</text>
			</view>

			<!-- 选项列表 -->
			<view class="options-list">
				<view
					v-for="(item, index) in currentQuestion.options"
					:key="item.id"
					class="option-item"
					:class="getOptionClass(index)"
					@click="selectAnswer(index)"
				>
					<view class="option-label">{{getLabel(index)}}</view>
					<view class="option-content">{{item.content}}</view>
					<view v-if="isAnswered && getLabel(index) === currentQuestion.correctAnswer" class="option-icon">✓</view>
					<view v-elif="isAnswered && selectedAnswer === getLabel(index) && !isCorrect" class="option-icon">✗</view>
				</view>
			</view>

			<!-- 结果反馈 -->
			<view v-if="showResult" class="result-bar" :class="isCorrect ? 'ok' : 'bad'">
				<view class="result-main">
					<text class="result-icon">{{isCorrect ? '✓' : '✗'}}</text>
					<text class="result-text">{{isCorrect ? '回答正确' : '答错了'}}</text>
					<view v-if="!isCorrect" class="result-detail">
						<text class="result-label">正确答案：</text>
						<text class="result-value">{{currentQuestion.correctAnswer}}</text>
					</view>

					<scroll-view scroll-y class="result-meanings-scroll" v-if="currentTask.vocabulary.meanings && currentTask.vocabulary.meanings.length > 0">
						<view v-for="item in currentTask.vocabulary.meanings" :key="item.id" class="result-meaning-item">
							<text class="meaning-pos">{{item.partOfSpeech}}</text>
							<text class="meaning-content">{{item.meaning}}</text>
						</view>
					</scroll-view>
				</view>

				<view v-if="isCorrect" class="fireworks">
					<view class="firework firework-1"></view>
					<view class="firework firework-2"></view>
					<view class="firework firework-3"></view>
					<view class="firework firework-4"></view>
					<view class="firework firework-5"></view>
				</view>

				<button v-if="!isCorrect" class="continue-btn-inside" @click="nextQuestion">继续</button>
			</view>

			<!-- 提交按钮 -->
			<view class="submit-section" v-if="!isAnswered">
				<button class="submit-btn" @click="submitAnswer" :disabled="!selectedAnswer">提交答案</button>
			</view>

			<!-- 统计信息 -->
			<view class="stats-section" v-if="!showResult">
				<view class="stat-item">
					<text class="stat-value correct-color">{{correctCount}}</text>
					<text class="stat-label">正确</text>
				</view>
				<view class="stat-divider"></view>
				<view class="stat-item">
					<text class="stat-value wrong-color">{{wrongCount}}</text>
					<text class="stat-label">错误</text>
				</view>
			</view>

			<!-- 连对次数展示 -->
			<view v-if="consecutiveCorrect > 0 && isCorrect" class="streak-badge">
				<text class="streak-icon">🔥</text>
				<text class="streak-count">连对 {{consecutiveCorrect}} 题</text>
			</view>
		</view>

		<!-- 里里程碑弹窗 -->
		<view v-if="showMilestone" class="milestone-overlay" @click="closeMilestone">
			<view class="milestone-popup">
				<view class="milestone-icon">🔥</view>
				<view class="milestone-title">太棒了！</view>
				<view class="milestone-count">连对 {{milestoneCount}} 题</view>
				<view class="milestone-subtitle">继续保持！</view>
			</view>
		</view>
	</view>
</template>

<script>
import { get, post } from '../../utils/request'
import { createSession, syncProgress, completeSession, checkOnline, setCurrentSessionId } from '../../utils/sync'
import { saveStudyProgress, getStudyProgress, clearStudyProgress, saveTodayWords, addToSyncQueue } from '../../utils/storage'
import { SoundType, playSound } from '../../utils/audio'

export default {
	data() {
		return {
			tasks: [], currentIndex: 0, totalCount: 0, currentTask: null, currentQuestion: null,
			selectedAnswer: '', isAnswered: false, isCorrect: false, showResult: false,
			answers: [], correctCount: 0, wrongCount: 0, sessionStartTime: null,
			elapsedTime: '00:00', timer: null, progress: 0, isLoading: true,
			consecutiveCorrect: 0, showMilestone: false, milestoneCount: 0,
			sessionId: null, lastSyncedIndex: -1, isRetestMode: false,
			audioCtx: null, preloadAudioCtx: null, isSubmitting: false,
			statusBarHeight: 0
		}
	},
	onLoad(options) {
		const app = getApp()
		this.statusBarHeight = app.globalData.statusBarHeight || 0
		if (!app.globalData.token) { uni.reLaunch({ url: '/pages/login/login' }); return }

		this.sessionStartTime = Date.now()
		this.startTimer()
		
		if (options.mode === 'retest' && options.questionIds) {
			this.isRetestMode = true
			this.retestQuestionIds = options.questionIds.split(',')
			this.loadRetestQuestions()
		} else if (options.resume === 'true') {
			this.resumeProgress()
		} else {
			this.loadTasks(options.mode || 'all', options.day || null, options.repeat === 'true')
		}
	},
	onUnload() {
		if (this.timer) clearInterval(this.timer)
		this.syncBeforeLeave()
		if (this.audioCtx) this.audioCtx.destroy()
		if (this.preloadAudioCtx) this.preloadAudioCtx.destroy()
	},
	onHide() { this.syncBeforeLeave() },
	onBackPress() {
		// 正在结算中或加载中不拦截
		if (this.isSubmitting || this.isLoading) return false
		// 题库为空不拦截
		if (this.tasks.length === 0) return false
		
		this.exitStudy()
		return true // 拦截原生返回
	},
	methods: {
		startTimer() {
			this.timer = setInterval(() => {
				const elapsed = Math.floor((Date.now() - this.sessionStartTime) / 1000)
				this.elapsedTime = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`
			}, 1000)
		},
		getLabel(index) { return ['A', 'B', 'C', 'D'][index] },
		getOptionClass(index) {
			const label = this.getLabel(index)
			return {
				selected: this.selectedAnswer === label,
				correct: this.isAnswered && label === this.currentQuestion.correctAnswer,
				wrong: this.isAnswered && this.selectedAnswer === label && !this.isCorrect
			}
		},
		async loadTasks(mode = 'all', day = null, repeat = false) {
			try {
				this.isLoading = true
				this.currentMode = mode
				this.currentDay = day
				uni.showLoading({ title: '加载中...' })

				const studentId = getApp().globalData.userInfo?.studentId
				let url = `/students/${studentId}/daily-tasks`
				if (day) url += `?day=${day}`
				if (repeat) url += (day ? '&' : '?') + 'repeat=true'

				let res = await get(url)
				let tasks = Array.isArray(res) ? res : (res.tasks || res.data?.tasks || [])

				if (tasks.length === 0 && !day) {
					res = await post(`/students/${studentId}/daily-tasks`)
					tasks = Array.isArray(res) ? res : (res.tasks || res.data?.tasks || [])
				}

				if (tasks.length > 0 && !day) saveTodayWords(tasks)

				if (mode === 'new') tasks = tasks.filter(t => t.isNew)
				else if (mode === 'review') tasks = tasks.filter(t => !t.isNew)

				const validTasks = tasks.filter(t => t.vocabulary?.questions?.length > 0)
				if (validTasks.length === 0) {
					uni.hideLoading()
					uni.showModal({ title: '提示', content: '暂无学习任务', showCancel: false, success: () => uni.navigateBack() })
					return
				}

				if (checkOnline()) {
					const sr = await createSession(validTasks.length, mode, day, repeat)
					if (sr) {
						if (sr.isCompleted && !repeat) {
							uni.hideLoading()
							uni.showModal({ title: '提示', content: '今日任务已完成', showCancel: false, success: () => uni.navigateBack() })
							return
						}
						this.sessionId = sr.sessionId
						setCurrentSessionId(this.sessionId)
					}
				}

				this.allTasks = validTasks
				this.tasks = validTasks
				this.totalCount = validTasks.length
				this.isLoading = false
				uni.hideLoading()
				this.loadCurrentQuestion()
			} catch (e) {
				uni.hideLoading()
				uni.showModal({ title: '加载失败', content: e.message || '网络错误', showCancel: false, success: () => uni.navigateBack() })
			}
		},
		loadCurrentQuestion() {
			if (this.currentIndex >= this.tasks.length) { this.finishStudy(); return }
			const currentTask = this.tasks[this.currentIndex]
			const vocabulary = currentTask.vocabulary

			const baseUrl = (getApp().globalData.apiUrl || '').replace(/\/api$/, '')
			if (vocabulary.imageUrl?.startsWith('/')) vocabulary.imageUrl = baseUrl + vocabulary.imageUrl
			
			// 音频处理
			if (!vocabulary.audioUrl && vocabulary.word_audios?.length > 0) {
				const audio = vocabulary.word_audios.find(a => a.accent === 'US') || vocabulary.word_audios[0]
				vocabulary.audioUrl = audio.audioUrl.startsWith('/') ? baseUrl + audio.audioUrl : audio.audioUrl
			}

			let question = vocabulary.questions.find(q => q.id === currentTask.selectedQuestionId) || 
						   vocabulary.questions.find(q => q.type === currentTask.targetQuestionType) ||
						   vocabulary.questions[Math.floor(Math.random() * vocabulary.questions.length)]

			if (!question) { this.nextQuestion(); return }

			// 洗牌
			const shuffledOptions = JSON.parse(JSON.stringify(question.options))
			for (let i = shuffledOptions.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]]
			}
			const correctIndex = shuffledOptions.findIndex(o => o.isCorrect)
			question.correctAnswer = this.getLabel(correctIndex)
			question.options = shuffledOptions

			this.currentTask = currentTask
			this.currentQuestion = question
			this.selectedAnswer = ''
			this.isAnswered = false
			this.isCorrect = false
			this.showResult = false
			this.progress = Math.round(((this.currentIndex + 1) / this.tasks.length) * 100)

			this.preloadNextAudio()
			if (this.currentQuestion.type === 'LISTENING') setTimeout(() => this.playAudio(), 500)
		},
		preloadNextAudio() {
			const nextTask = this.tasks[this.currentIndex + 1]
			if (!nextTask?.vocabulary?.audioUrl) return
			if (this.preloadAudioCtx) this.preloadAudioCtx.destroy()
			this.preloadAudioCtx = uni.createInnerAudioContext()
			this.preloadAudioCtx.src = nextTask.vocabulary.audioUrl
			this.preloadAudioCtx.volume = 0
		},
		selectAnswer(index) {
			if (!this.isAnswered) {
				this.selectedAnswer = this.getLabel(index)
				uni.vibrateShort()
			}
		},
		submitAnswer() {
			if (!this.selectedAnswer) return
			const isCorrect = this.selectedAnswer === this.currentQuestion.correctAnswer
			const timeSpent = Math.floor((Date.now() - (this.lastStartTime || this.sessionStartTime)) / 1000)
			
			const labels = ['A', 'B', 'C', 'D']
			const selectedIndex = labels.indexOf(this.selectedAnswer)
			const answerContent = this.currentQuestion.options[selectedIndex]?.content || this.selectedAnswer

			const answerRecord = { 
				vocabularyId: this.currentTask.vocabularyId, 
				questionId: this.currentQuestion.id, 
				answer: answerContent, 
				isCorrect, 
				timeSpent, 
				taskId: this.currentTask.id, 
				timestamp: Date.now() 
			}

			this.answers.push(answerRecord)
			this.correctCount = this.answers.filter(a => a.isCorrect).length
			this.wrongCount = this.answers.length - this.correctCount
			this.consecutiveCorrect = isCorrect ? this.consecutiveCorrect + 1 : 0

			uni.vibrateShort({ type: isCorrect ? 'light' : 'heavy' })
			if (isCorrect) {
				if (this.consecutiveCorrect % 5 === 0) {
					this.showMilestonePopup(this.consecutiveCorrect)
					playSound(SoundType.STREAK_5)
				} else {
					playSound(SoundType.CORRECT)
				}
			} else {
				playSound(SoundType.WRONG)
			}

			this.isAnswered = true
			this.isCorrect = isCorrect
			this.showResult = true
			this.saveProgress()

			if (isCorrect) setTimeout(() => this.nextQuestion(), this.consecutiveCorrect % 5 === 0 ? 2000 : 800)
		},
		nextQuestion() {
			this.currentIndex++
			this.lastStartTime = Date.now()
			this.loadCurrentQuestion()
		},
		showMilestonePopup(count) {
			this.showMilestone = true
			this.milestoneCount = count
			setTimeout(() => this.showMilestone = false, 2000)
		},
		closeMilestone() { this.showMilestone = false },
		async finishStudy() {
			if (this.isSubmitting) return
			this.isSubmitting = true
			uni.showLoading({ title: '提交中...' })

			const studentId = getApp().globalData.userInfo?.studentId
			try {
				if (this.isRetestMode) {
					await post('/study-records', { studentId, answers: this.answers, isRetestMode: true, mode: 'retest' })
				} else if (!checkOnline()) {
					addToSyncQueue({ type: 'study_complete', data: { studentId, answers: this.answers, completedAt: Date.now() } })
				} else {
					const newAnswers = this.answers.slice(this.lastSyncedIndex + 1)
					if (newAnswers.length > 0 && this.sessionId) await syncProgress(newAnswers)
					if (this.sessionId) await completeSession()
					else await post('/study-records', { studentId, answers: this.answers, mode: this.currentMode })
				}
				
				playSound(SoundType.COMPLETE)
				clearStudyProgress()
				uni.hideLoading()
				uni.redirectTo({ url: `/pages/study/result?correct=${this.correctCount}&wrong=${this.wrongCount}&total=${this.answers.length}&mode=${this.isRetestMode ? 'retest' : ''}` })
			} catch (e) {
				uni.hideLoading()
				console.error('提交失败', e)
				uni.showModal({ title: '已离线保存', content: '连接网络后会自动同步', confirmText: '查看结果', success: () => {
					clearStudyProgress()
					uni.redirectTo({ url: `/pages/study/result?correct=${this.correctCount}&wrong=${this.wrongCount}&total=${this.answers.length}&offline=true` })
				}})
			}
		},
		saveProgress() {
			saveStudyProgress({
				tasks: this.allTasks || this.tasks,
				currentIndex: this.currentIndex,
				answers: this.answers,
				correctCount: this.correctCount,
				wrongCount: this.wrongCount,
				timestamp: Date.now(),
				startTime: this.sessionStartTime,
				sessionId: this.sessionId,
				mode: this.currentMode,
				day: this.currentDay,
				isRetestMode: this.isRetestMode
			})
		},
		resumeProgress() {
			const progress = getStudyProgress()
			if (!progress) { this.loadTasks(); return }
			this.currentMode = progress.mode
			this.currentIndex = progress.currentIndex
			this.answers = progress.answers
			this.correctCount = progress.correctCount
			this.wrongCount = progress.wrongCount
			this.sessionId = progress.sessionId
			this.isRetestMode = progress.isRetestMode
			this.tasks = progress.tasks
			this.totalCount = progress.tasks.length
			this.isLoading = false
			if (this.sessionId) setCurrentSessionId(this.sessionId)
			this.loadCurrentQuestion()
		},
		playAudio() {
			if (!this.currentTask?.vocabulary?.audioUrl) return
			if (this.audioCtx) this.audioCtx.destroy()
			this.audioCtx = uni.createInnerAudioContext()
			this.audioCtx.src = this.currentTask.vocabulary.audioUrl
			this.audioCtx.play()
		},
		exitStudy() {
			uni.showModal({
				title: '确认退出',
				content: '当前进度会被保存',
				success: (res) => {
					if (res.confirm) {
						this.syncBeforeLeave()
						uni.navigateBack()
					}
				}
			})
		},
		syncBeforeLeave() {
			if (this.answers.length > 0 && this.sessionId && checkOnline()) {
				const newAnswers = this.answers.slice(this.lastSyncedIndex + 1)
				if (newAnswers.length > 0) {
					syncProgress(newAnswers)
					this.lastSyncedIndex = this.answers.length - 1
				}
			}
		},
		async loadRetestQuestions() {
			try {
				this.isLoading = true
				const studentId = getApp().globalData.userInfo?.studentId
				const res = await get(`/students/${studentId}/wrong-questions?limit=300`)
				const wrongQuestions = res.wrongQuestions || []
				this.tasks = wrongQuestions.map(wq => ({
					vocabularyId: wq.vocabularyId,
					vocabulary: { ...wq.vocabulary, questions: wq.question ? [wq.question] : [] },
					selectedQuestionId: wq.questionId
				}))
				this.totalCount = this.tasks.length
				this.isLoading = false
				this.loadCurrentQuestion()
			} catch (e) {
				uni.navigateBack()
			}
		}
	}
}
</script>

<style lang="scss">
.study-page {
	min-height: 100vh;
	background: #F3F4F6;
	display: flex;
	flex-direction: column;
}

.study-header {
	background: white;
	padding: 80rpx 40rpx 30rpx;
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.header-info { flex: 1; }
.word-count { font-size: 28rpx; font-weight: 700; color: #1F2937; display: block; }
.time-spent { font-size: 24rpx; color: #9CA3AF; margin-top: 4rpx; }
.exit-btn { font-size: 56rpx; color: #EF4444; font-weight: 300; }

.fun-progress { padding: 20rpx 40rpx; background: white; }
.progress-track { height: 12rpx; background: #E5E7EB; border-radius: 6rpx; position: relative; }
.progress-fill { height: 100%; background: #FF7A7A; border-radius: 6rpx; transition: width 0.3s; position: relative; }
.progress-emoji { position: absolute; right: -20rpx; top: -10rpx; font-size: 28rpx; }

.study-content { padding: 40rpx; flex: 1; display: flex; flex-direction: column; }

.word-display {
	background: white; border-radius: 32rpx; padding: 60rpx 40rpx; text-align: center;
	box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.05); margin-bottom: 40rpx;
}

.word-text { font-size: 72rpx; font-weight: 800; color: #1F2937; }
.speaker { font-size: 56rpx; margin-left: 20rpx; }
.word-row { display: flex; align-items: center; justify-content: center; }
.word-image { width: 300rpx; height: 200rpx; margin: 30rpx auto; border-radius: 16rpx; }
.question-hint { font-size: 26rpx; color: #9CA3AF; margin-top: 20rpx; display: block; }

.audio-icon {
	width: 160rpx; height: 160rpx; background: #FF7A7A; border-radius: 80rpx;
	display: flex; align-items: center; justify-content: center;
	font-size: 80rpx; margin: 0 auto 40rpx; color: white;
	box-shadow: 0 8rpx 24rpx rgba(255, 122, 122, 0.4);
}

.sentence-display { padding: 30rpx; background: #F9FAFB; border-radius: 16rpx; border: 2rpx dashed #E5E7EB; margin-bottom: 20rpx; }
.sentence-text { font-size: 34rpx; line-height: 1.6; color: #374151; }

.options-list { margin-bottom: 40rpx; }
.option-item {
	background: white; border-radius: 20rpx; padding: 24rpx 30rpx; margin-bottom: 20rpx;
	border: 2rpx solid #E5E7EB; display: flex; align-items: center;
	transition: all 0.2s;
	&.selected { border-color: #FF7A7A; background: #FFF1F1; }
	&.correct { border-color: #10B981; background: #ECFDF5; }
	&.wrong { border-color: #EF4444; background: #FEF2F2; }
}

.option-label {
	width: 48rpx; height: 48rpx; border-radius: 24rpx; background: #F3F4F6;
	display: flex; align-items: center; justify-content: center;
	font-size: 26rpx; font-weight: 700; color: #9CA3AF; margin-right: 24rpx;
}
.selected .option-label { background: #FF7A7A; color: white; }
.correct .option-label { background: #10B981; color: white; }
.wrong .option-label { background: #EF4444; color: white; }

.option-content { flex: 1; font-size: 30rpx; color: #374151; }
.option-icon { font-size: 32rpx; margin-left: 20rpx; }

.submit-btn {
	width: 100%; height: 100rpx; background: #FF7A7A; color: white;
	border-radius: 50rpx; font-size: 34rpx; font-weight: 700;
	display: flex; align-items: center; justify-content: center;
	box-shadow: 0 8rpx 20rpx rgba(255, 122, 122, 0.3);
}
.submit-btn[disabled] { background: #E5E7EB; color: #9CA3AF; box-shadow: none; }

.result-bar {
	position: fixed; left: 0; right: 0; bottom: 0; padding: 40rpx 40rpx calc(env(safe-area-inset-bottom) + 40rpx);
	z-index: 100; box-shadow: 0 -4rpx 20rpx rgba(0,0,0,0.1);
	&.ok { background: #D9FFC4; }
	&.bad { background: #FFE1E1; }
}

.result-main { display: flex; flex-direction: column; gap: 10rpx; }
.result-text { font-size: 32rpx; font-weight: 700; color: #1F2937; }
.result-detail { font-size: 28rpx; color: #EF4444; font-weight: 700; }
.result-meanings-scroll { max-height: 200rpx; margin-top: 20rpx; }
.result-meaning-item { display: flex; margin-bottom: 8rpx; font-size: 26rpx; }
.meaning-pos { font-weight: 700; color: #9CA3AF; width: 60rpx; }

.continue-btn-inside {
	width: 100%; height: 90rpx; background: #FF7A7A; color: white;
	border-radius: 45rpx; font-size: 32rpx; font-weight: 700; margin-top: 30rpx;
}

.stats-section {
	display: flex; justify-content: space-around; background: white;
	padding: 30rpx; border-radius: 20rpx; margin-top: auto;
}
.stat-item { text-align: center; }
.stat-value { font-size: 36rpx; font-weight: 700; }
.correct-color { color: #10B981; }
.wrong-color { color: #EF4444; }
.stat-label { font-size: 24rpx; color: #9CA3AF; }
.stat-divider { width: 1rpx; background: #E5E7EB; }

.streak-badge {
	position: fixed; top: 180rpx; right: 20rpx;
	padding: 12rpx 24rpx; background: #F7931E; border-radius: 30rpx;
	color: white; font-weight: 700; font-size: 24rpx;
	box-shadow: 0 4rpx 12rpx rgba(247, 147, 30, 0.4);
}

.milestone-overlay {
	position: fixed; top: 0; left: 0; right: 0; bottom: 0;
	background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.milestone-popup {
	background: linear-gradient(135deg, #FF7A7A, #F7931E);
	padding: 60rpx 100rpx; border-radius: 40rpx; text-align: center; color: white;
}
.milestone-icon { font-size: 100rpx; margin-bottom: 20rpx; }
.milestone-title { font-size: 40rpx; font-weight: 700; }
.milestone-count { font-size: 60rpx; font-weight: 800; margin: 20rpx 0; }
</style>
