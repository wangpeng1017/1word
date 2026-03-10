<template>
	<view class="page">
		<!-- 欢迎动画 (首次打开) -->
		<view class="welcome-overlay" v-if="showWelcome">
			<view class="welcome-close" :style="{ top: (statusBarHeight + 20) + 'px' }" @click="hideWelcome">×</view>
			<view class="welcome-content">
				<!-- 吉祥物 -->
				<view class="mascot-container">
					<image class="mascot-img" src="/static/images/success_horse_red_v3.png" mode="aspectFit"></image>
					<view class="mascot-shadow"></view>
				</view>

				<!-- 欢迎文字 -->
				<view class="welcome-text">欢迎回来，{{userInfo.name || '同学'}}！</view>
				<view class="welcome-sub">看到你熟悉的脸庞多儿好开心！</view>

				<!-- 开始按钮 -->
				<view class="welcome-btn" @click="hideWelcome">开始今日学习</view>
			</view>
		</view>

		<!-- 主界面 -->
		<view class="main-content" v-if="!showWelcome">
			<!-- 学习路径 -->
			<scroll-view
				class="path-container"
				scroll-y
				:scroll-into-view="scrollTarget"
				v-if="studyDaysData && studyDaysData.days.length > 0"
			>
				<view class="learning-path">
					<view
						v-for="(item, index) in studyDaysData.days"
						:key="item.day"
						:id="'day-' + item.day"
						class="path-node"
						:class="[item.status, index % 2 === 0 ? 'left' : 'right']"
						@click="handleDayClick(item)"
					>
						<!-- 连接曲线 -->
						<view class="path-curve" v-if="index < studyDaysData.days.length - 1">
							<view class="curve-line" :class="item.status"></view>
						</view>

						<!-- 圆形节点 -->
						<view class="node-circle" :class="item.status">
							<view class="node-inner">
								<text class="node-icon-3d" v-if="item.status === 'completed'">⭐️</text>
								<text class="node-icon-3d" v-elif="item.status === 'current'">📖</text>
								<text class="node-icon-3d" v-elif="item.status === 'missed'">❗️</text>
								<text class="node-icon-3d" v-else>🔒</text>
							</view>
							<!-- 进度环 -->
							<view class="progress-ring" v-if="item.status === 'current'"></view>
						</view>

						<!-- 节点标签 -->
						<view class="node-label">
							<view class="day-title">Day {{item.day}}</view>
							<view class="day-date-full">{{item.dateFormatted || item.date}}</view>
							<view class="day-words" v-if="item.status === 'completed'">{{item.wordsCount}}个单词</view>
							<view class="day-words current-hint" v-elif="item.status === 'current'">点击开始</view>
						</view>
					</view>
				</view>

				<!-- 底部留白 -->
				<view class="path-footer"></view>
			</scroll-view>

			<!-- 空状态 -->
			<view class="empty-state" v-if="!studyDaysData || studyDaysData.days.length === 0">
				<view class="empty-icon">📖</view>
				<view class="empty-text">暂无学习计划</view>
				<view class="empty-sub">请联系老师分配学习任务</view>
			</view>
		</view>

		<!-- 游客模式 -->
		<view class="empty-state" v-if="state === 'guest'" style="margin-top: 100rpx;">
			<image class="empty-img" src="/static/images/empty-review.png" mode="aspectFit"></image>
			<view class="empty-text">登录后查看您的复习计划</view>
			<button class="empty-btn" @click="goToLogin" style="margin-top: 30rpx; background: #FF7A7A; color: white;">立即登录</button>
		</view>

		<!-- 加载状态 -->
		<view class="loading-state" v-if="state === 'loading' && !showWelcome">
			<view class="loading-spinner"></view>
			<view class="loading-text">加载中...</view>
		</view>
	</view>
</template>

<script>
import { get, post } from '../../utils/request'
import { getStudyProgress, clearStudyProgress, getSyncQueue, clearSyncQueue } from '../../utils/storage'

export default {
	data() {
		return {
			state: 'loading',
			userInfo: {},
			showWelcome: false,
			scrollTarget: '',
			studyDaysData: null,
			overview: {},
			progressPercent: 0,
			totalPoints: 0,
			statusBarHeight: 0,
		}
	},
	onLoad() {
		const app = getApp()
		this.statusBarHeight = app.globalData.statusBarHeight || 0
		if (!app.globalData.token) {
			if (app.globalData.isGuest) {
				this.state = 'guest'
				return
			}
			uni.reLaunch({ url: '/pages/login/login' })
			return
		}
		this.userInfo = app.globalData.userInfo || {}
		this.init()
	},
	onShow() {
		const app = getApp()
		if (app.globalData.token) {
			this.init()
			this.syncOfflineData()
		}
	},
	onPullDownRefresh() {
		this.init().finally(() => uni.stopPullDownRefresh())
	},
	methods: {
		hideWelcome() {
			this.showWelcome = false
			uni.setStorageSync('hasShownWelcome', true)
		},
		async init() {
			this.state = 'loading'
			this.checkUnfinishedProgress()

			try {
				await Promise.all([
					this.getTodayOverview(),
					this.loadStudyDays(),
					this.loadPoints(),
				])
				this.state = this.studyDaysData?.days?.length > 0 ? 'ready' : 'empty'
			} catch (e) {
				console.error('加载首页信息失败', e)
				this.state = 'error'
			}
		},
		checkUnfinishedProgress() {
			const saved = getStudyProgress()
			if (!saved) return

			const savedDate = saved.timestamp ? new Date(saved.timestamp).toDateString() : null
			const today = new Date().toDateString()

			if (savedDate !== today) {
				clearStudyProgress()
				return
			}

			const totalTasks = saved.tasks?.length || 0
			const answeredCount = saved.answers?.length || 0

			if (totalTasks > answeredCount && answeredCount > 0) {
				uni.showModal({
					title: '发现未完成的学习',
					content: '是否继续上次的学习进度？',
					confirmText: '继续学习',
					cancelText: '稍后再说',
					success: (res) => {
						if (res.confirm) {
							uni.navigateTo({ url: '/pages/study/study?resume=true' })
						}
					}
				})
			}
		},
		async syncOfflineData() {
			const syncQueue = getSyncQueue()
			if (!syncQueue || syncQueue.length === 0) return

			try {
				for (const item of syncQueue) {
					if (item.type === 'study_complete') {
						await post('/study-records', { studentId: item.data.studentId, answers: item.data.answers })
					}
				}
				clearSyncQueue()
				uni.showToast({ title: '离线数据已同步', icon: 'success' })
			} catch (error) {
				console.error('[同步] 离线数据同步失败', error)
			}
		},
		async getTodayOverview() {
			const app = getApp()
			const studentId = app.globalData.userInfo?.studentId
			if (!studentId) return

			try {
				const data = await get('/review-plan/' + studentId)
				if (data?.miniapp?.today) {
					const mi = data.miniapp.today
					this.overview = {
						dueCount: mi.dueCount || 0,
						reviewedCount: mi.completedCount || 0,
					}
					this.progressPercent = Math.min(100, Math.floor((this.overview.reviewedCount / this.overview.dueCount) * 100)) || 0
				}
			} catch (e) {
				console.error('[首页] 获取复习计划失败转换', e)
			}
		},
		async loadStudyDays() {
			const app = getApp()
			const studentId = app.globalData.userInfo?.studentId
			if (!studentId) return

			try {
				const res = await get('/study-days?studentId=' + studentId)
				if (res?.days) {
					this.studyDaysData = {
						...res,
						days: res.days.map(day => ({
							...day,
							dateFormatted: this.formatDateFull(day.date)
						}))
					}
					this.$nextTick(() => {
						this.scrollToCurrentDay()
					})
				}
			} catch (error) {
				console.error('加载学习天数失败:', error)
			}
		},
		async loadPoints() {
			const app = getApp()
			const studentId = app.globalData.userInfo?.studentId
			if (!studentId) return

			try {
				const res = await get('/points?studentId=' + studentId)
				if (res?.points) {
					this.totalPoints = res.points.totalPoints || 0
				}
			} catch (error) {
				console.error('加载积分失败:', error)
			}
		},
		handleDayClick(day) {
			if (day.wordsCount === 0 && (!day.newWordsCount || day.newWordsCount === 0)) {
				uni.showToast({ title: '今日无学习任务', icon: 'none' })
				return
			}

			if (day.status === 'current') {
				uni.navigateTo({ url: '/pages/study/study?mode=review' })
			} else if (day.status === 'completed') {
				uni.showModal({
					title: `Day ${day.day} 已完成 ⭐️`,
					content: '是否重新学习？',
					confirmText: '重新学习',
					cancelText: '返回',
					success: (res) => {
						if (res.confirm) {
							const mode = day.wordsCount > 0 ? 'review' : 'new'
							uni.navigateTo({ url: `/pages/study/study?mode=${mode}&day=${day.day}&repeat=true` })
						}
					}
				})
			} else if (day.status === 'missed') {
				uni.showModal({
					title: `补学 Day ${day.day}`,
					content: '确定要补学这天的内容吗？\n(包含当日新词 + 复习单词)',
					confirmText: '开始补学',
					cancelText: '取消',
					success: (res) => {
						if (res.confirm) {
							uni.navigateTo({ url: `/pages/study/study?mode=all&day=${day.day}` })
						}
					}
				})
			} else if (day.status === 'locked') {
				uni.showToast({ title: '请先完成前面的学习', icon: 'none' })
			}
		},
		scrollToCurrentDay() {
			if (!this.studyDaysData?.days) return
			const currentDay = this.studyDaysData.days.find(d => d.status === 'current')
			if (currentDay) {
				this.scrollTarget = 'day-' + currentDay.day
			}
		},
		formatDateFull(dateStr) {
			if (!dateStr) return ''
			const date = new Date(dateStr)
			return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
		},
		goToLogin() {
			const app = getApp()
			app.globalData.isGuest = false
			uni.reLaunch({ url: '/pages/login/login' })
		}
	}
}
</script>

<style lang="scss">
.page {
	min-height: 100vh;
	background: #F7F7F7;
	position: relative;
}

/* ========== 欢迎动画覆盖层 ========== */
.welcome-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: #FFFFFF;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	z-index: 1000;
	padding: 60rpx;
}

.welcome-close {
	position: absolute;
	top: 100rpx;
	left: 40rpx;
	font-size: 56rpx;
	color: #AFAFAF;
	width: 60rpx;
	height: 60rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.welcome-content {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	flex: 1;
	width: 100%;
}

.mascot-container {
	position: relative;
	margin-bottom: 60rpx;
	animation: mascotBounce 2s ease-in-out infinite;
}

.mascot-img {
	width: 280rpx;
	height: 280rpx;
}

.mascot-shadow {
	position: absolute;
	bottom: -20rpx;
	left: 50%;
	transform: translateX(-50%);
	width: 160rpx;
	height: 24rpx;
	background: radial-gradient(ellipse, rgba(0,0,0,0.15) 0%, transparent 70%);
	animation: shadowPulse 2s ease-in-out infinite;
}

@keyframes mascotBounce {
	0%, 100% { transform: translateY(0); }
	50% { transform: translateY(-20rpx); }
}

@keyframes shadowPulse {
	0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.15; }
	50% { transform: translateX(-50%) scale(0.8); opacity: 0.1; }
}

.welcome-text {
	font-size: 44rpx;
	font-weight: 700;
	color: #3C3C3C;
	margin-bottom: 20rpx;
	text-align: center;
}

.welcome-sub {
	font-size: 32rpx;
	color: #777777;
	text-align: center;
	margin-bottom: 80rpx;
}

.welcome-btn {
	width: 90%;
	max-width: 600rpx;
	height: 100rpx;
	background: linear-gradient(180deg, #58CC02 0%, #4CAF00 100%);
	border-radius: 24rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 34rpx;
	font-weight: 700;
	color: #FFFFFF;
	box-shadow: 0 8rpx 0 #3D8B00, 0 12rpx 24rpx rgba(88, 204, 2, 0.3);
	position: absolute;
	bottom: 100rpx;
}

.welcome-btn:active {
	transform: translateY(4rpx);
	box-shadow: 0 4rpx 0 #3D8B00, 0 8rpx 16rpx rgba(88, 204, 2, 0.3);
}

/* ========== 主界面 ========== */
.main-content {
	min-height: 100vh;
	display: flex;
	flex-direction: column;
}

.path-container {
	flex: 1;
	height: calc(100vh - 120rpx);
}

.learning-path {
	padding: 40rpx 60rpx;
	position: relative;
}

.path-node {
	position: relative;
	display: flex;
	align-items: center;
	margin-bottom: 40rpx;
	min-height: 140rpx;
}

.path-node.left {
	flex-direction: row;
	padding-left: 20rpx;
}

.path-node.right {
	flex-direction: row-reverse;
	padding-right: 20rpx;
}

.path-curve {
	position: absolute;
	width: 100%;
	height: 80rpx;
	top: 100%;
	left: 0;
	pointer-events: none;
}

.curve-line {
	position: absolute;
	width: 4rpx;
	height: 100%;
	left: 50%;
	transform: translateX(-50%);
	background: #E5E5E5;
}

.curve-line.completed { background: #58CC02; }
.curve-line.current { background: linear-gradient(180deg, #FF9600 0%, #E5E5E5 100%); }

.node-circle {
	width: 120rpx;
	height: 120rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	position: relative;
	flex-shrink: 0;
	background: #E5E5E5;
	box-shadow: 0 6rpx 0 #CCCCCC;
	transition: all 0.3s ease;
}

.node-inner {
	width: 100rpx;
	height: 100rpx;
	border-radius: 50%;
	background: #FFFFFF;
	display: flex;
	align-items: center;
	justify-content: center;
}

.node-icon-3d {
	font-size: 56rpx;
	transform: translateY(-2rpx);
	text-shadow: 0 4rpx 4rpx rgba(0,0,0,0.2);
}

.node-circle.completed {
	background: #58CC02;
	box-shadow: 0 6rpx 0 #3D8B00;
	.node-inner { background: #58CC02; }
}

.node-circle.current {
	background: #FF9600;
	box-shadow: 0 6rpx 0 #CC6200;
	animation: currentPulse 2s ease-in-out infinite;
	.node-inner { background: #FF9600; }
}

@keyframes currentPulse {
	0%, 100% { transform: scale(1); }
	50% { transform: scale(1.05); }
}

.progress-ring {
	position: absolute;
	width: 140rpx;
	height: 140rpx;
	border-radius: 50%;
	border: 6rpx solid rgba(255,150,0,0.3);
	border-top-color: #FF9600;
	animation: ringRotate 1.5s linear infinite;
}

@keyframes ringRotate {
	from { transform: rotate(0deg); }
	to { transform: rotate(360deg); }
}

.node-circle.missed {
	background: #FF4B4B;
	box-shadow: 0 6rpx 0 #CC3333;
	.node-inner { background: #FF4B4B; }
}

.node-circle.locked {
	background: #E5E5E5;
	box-shadow: 0 6rpx 0 #CCCCCC;
	opacity: 0.7;
}

.node-label {
	margin: 0 24rpx;
	flex: 1;
}

.path-node.right .node-label { text-align: right; }

.day-title {
	font-size: 36rpx;
	font-weight: 700;
	color: #3C3C3C;
	margin-bottom: 4rpx;
}

.day-date-full {
	font-size: 26rpx;
	color: #AFAFAF;
	margin-bottom: 8rpx;
}

.day-words {
	font-size: 26rpx;
	color: #58CC02;
	font-weight: 600;
}

.day-words.current-hint { color: #FF9600; }

.path-footer { height: 200rpx; }

.empty-state {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 80rpx;
}

.empty-icon { font-size: 120rpx; margin-bottom: 32rpx; }
.empty-text { font-size: 36rpx; font-weight: 600; color: #3C3C3C; margin-bottom: 16rpx; }
.empty-sub { font-size: 28rpx; color: #AFAFAF; }

.loading-state {
	position: fixed;
	top: 0; left: 0; right: 0; bottom: 0;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	background: #F7F7F7;
}

.loading-spinner {
	width: 60rpx; height: 60rpx;
	border: 6rpx solid #E5E5E5;
	border-top-color: #58CC02;
	border-radius: 50%;
	animation: spin 1s linear infinite;
	margin-bottom: 24rpx;
}

@keyframes spin {
	from { transform: rotate(0deg); }
	to { transform: rotate(360deg); }
}

.loading-text { font-size: 28rpx; color: #AFAFAF; }
</style>
