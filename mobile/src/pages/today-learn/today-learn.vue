<template>
	<view class="page">
		<!-- 欢迎动画 (首次打开) -->
		<view class="welcome-overlay" v-if="showWelcome">
			<view class="welcome-close" @click="hideWelcome">×</view>
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
		<template v-if="!showWelcome">
			<!-- 欢迎区域 -->
			<view class="welcome-section">
				<view class="welcome-title">今日新词</view>
				<view class="welcome-subtitle">每天进步一点点</view>
			</view>

			<!-- 任务卡片 -->
			<view class="task-card-container">
				<view class="task-card">
					<view class="card-icon">📚</view>
					
					<view class="card-content" v-if="state === 'loading'">
						<view class="loading-spinner"></view>
						<view class="status-text">加载任务中...</view>
					</view>

					<!-- 游客模式 -->
					<view class="card-content" v-elif="state === 'guest'">
						<view class="status-title">欢迎新同学！</view>
						<view class="status-desc" style="margin-top: 10rpx; margin-bottom: 30rpx;">登录后开始您的专属学习计划</view>
						<button class="start-btn" @click="goToLogin">立即登录</button>
					</view>

					<view class="card-content" v-elif="newWordsCount > 0">
						<view class="count-number">{{newWordsCount}}</view>
						<view class="count-label">个新单词待学习</view>
						<button class="start-btn" @click="startLearning">开始学习</button>
					</view>

					<view class="card-content" v-else>
						<view class="done-icon">🎉</view>
						<view class="status-title">今日新词已完成！</view>
						<view class="status-desc">去"今日复习"巩固一下吧</view>
						<button class="review-btn" @click="goToReview">查看复习任务</button>
					</view>
				</view>
			</view>
		</template>
	</view>
</template>

<script>
import { get } from '../../utils/request'
import { getStudyProgress, clearStudyProgress } from '../../utils/storage'

export default {
	data() {
		return {
			state: 'loading',
			newWordsCount: 0,
			timeEstimate: 0,
			userInfo: {},
			showWelcome: false
		}
	},
	onLoad() {
		const lastWelcome = uni.getStorageSync('lastWelcomeDate')
		const today = new Date().toDateString()

		if (lastWelcome !== today) {
			this.showWelcome = true
			uni.setStorageSync('lastWelcomeDate', today)
		}
	},
	onShow() {
		if (!this.showWelcome) {
			this.checkTodayTasks()
		}
	},
	methods: {
		hideWelcome() {
			this.showWelcome = false
			this.checkTodayTasks()
		},
		async checkTodayTasks() {
			const app = getApp()
			this.state = 'loading'
			
			const userInfo = app.globalData.userInfo
			if (!userInfo?.studentId) {
				if (app.globalData.isGuest) {
					this.state = 'guest'
					return
				}
				uni.reLaunch({ url: '/pages/login/login' })
				return
			}
			
			this.userInfo = userInfo

			try {
				const res = await get(`/students/${userInfo.studentId}/daily-tasks`)
				const tasks = Array.isArray(res) ? res : (res?.tasks || [])
				const newTasks = tasks.filter(t => t.isNew)

				this.state = 'ready'
				this.newWordsCount = newTasks.length
				this.timeEstimate = Math.ceil(newTasks.length * 1.5)
			} catch (e) {
				console.error('获取今日任务失败', e)
				this.state = 'error'
			}
		},
		startLearning() {
			if (this.newWordsCount === 0 && this.state === 'ready') {
				uni.showToast({ title: '今日学习已完成', icon: 'success' })
				return
			}

			const saved = getStudyProgress()
			if (saved) {
				const savedDate = saved.timestamp ? new Date(saved.timestamp).toDateString() : null
				const today = new Date().toDateString()
				if (savedDate === today) {
					const savedMode = saved.mode || 'all'
					if (savedMode === 'new' || savedMode === 'all') {
						if (saved.answers && saved.tasks && saved.answers.length < saved.tasks.length) {
							uni.showModal({
								title: '发现未完成的学习',
								content: '是否继续上次的学习进度？',
								confirmText: '继续学习',
								cancelText: '重新开始',
								success: (res) => {
									if (res.confirm) {
										uni.navigateTo({ url: '/pages/study/study?resume=true' })
									} else {
										clearStudyProgress()
										uni.navigateTo({ url: '/pages/study/study?mode=new' })
									}
								}
							})
							return
						}
					}
				}
			}
			uni.navigateTo({ url: '/pages/study/study?mode=new' })
		},
		goToReview() {
			uni.switchTab({ url: '/pages/index/index' })
		},
		goToLogin() {
			getApp().globalData.isGuest = false
			uni.reLaunch({ url: '/pages/login/login' })
		}
	}
}
</script>

<style lang="scss">
.page {
	min-height: 100vh;
	background: #F7F7F7;
	display: flex;
	flex-direction: column;
}

.welcome-section {
	padding: 60rpx 40rpx;
	background: #FF7A7A;
	color: white;
}

.welcome-title {
	font-size: 48rpx;
	font-weight: 700;
}

.welcome-subtitle {
	font-size: 28rpx;
	opacity: 0.9;
	margin-top: 10rpx;
}

.task-card-container {
	padding: 0 40rpx;
	margin-top: -40rpx;
	flex: 1;
}

.task-card {
	background: white;
	border-radius: 32rpx;
	padding: 80rpx 40rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	box-shadow: 0 10rpx 30rpx rgba(0,0,0,0.05);
}

.card-icon {
	font-size: 120rpx;
	margin-bottom: 40rpx;
}

.card-content {
	width: 100%;
	display: flex;
	flex-direction: column;
	align-items: center;
}

.count-number {
	font-size: 120rpx;
	font-weight: 800;
	color: #FF7A7A;
	line-height:1;
}

.count-label {
	font-size: 32rpx;
	color: #6B7280;
	margin-top: 20rpx;
	margin-bottom: 60rpx;
}

.start-btn {
	width: 100%;
	height: 100rpx;
	background: #FF7A7A;
	color: white;
	border-radius: 50rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 34rpx;
	font-weight: 700;
	border: none;
	box-shadow: 0 8rpx 20rpx rgba(255, 122, 122, 0.3);
}

.done-icon {
	font-size: 100rpx;
	margin-bottom: 20rpx;
}

.status-title {
	font-size: 40rpx;
	font-weight: 700;
	color: #1F2937;
}

.status-desc {
	font-size: 28rpx;
	color: #6B7280;
	margin-top: 10rpx;
	margin-bottom: 60rpx;
}

.review-btn {
	width: 100%;
	height: 100rpx;
	background: white;
	color: #FF7A7A;
	border: 3rpx solid #FF7A7A;
	border-radius: 50rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 34rpx;
	font-weight: 700;
}

.loading-spinner {
	width: 60rpx;
	height: 60rpx;
	border: 6rpx solid #F3F4F6;
	border-top-color: #FF7A7A;
	border-radius: 50%;
	animation: spin 1s linear infinite;
	margin-bottom: 20rpx;
}

@keyframes spin {
	from { transform: rotate(0deg); }
	to { transform: rotate(360deg); }
}

.welcome-overlay {
	position: fixed;
	top: 0; left: 0; right: 0; bottom: 0;
	background: white;
	z-index: 1000;
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 60rpx;
}

.welcome-close {
	position: absolute;
	top: 100rpx; left: 40rpx;
	font-size: 56rpx; color: #AFAFAF;
}

.welcome-content {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	width: 100%;
}

.mascot-container {
	position: relative;
	margin-bottom: 60rpx;
	animation: mascotBounce 2s ease-in-out infinite;
}

.mascot-img { width: 280rpx; height: 280rpx; }

.mascot-shadow {
	position: absolute;
	bottom: -20rpx; left: 50%;
	transform: translateX(-50%);
	width: 160rpx; height: 24rpx;
	background: radial-gradient(ellipse, rgba(0,0,0,0.15) 0%, transparent 70%);
}

@keyframes mascotBounce {
	0%, 100% { transform: translateY(0); }
	50% { transform: translateY(-20rpx); }
}

.welcome-text { font-size: 44rpx; font-weight: 700; color: #3C3C3C; margin-bottom: 20rpx; }
.welcome-sub { font-size: 32rpx; color: #777777; margin-bottom: 80rpx; }

.welcome-btn {
	width: 90%; max-width: 600rpx; height: 100rpx;
	background: linear-gradient(180deg, #58CC02 0%, #4CAF00 100%);
	border-radius: 24rpx; color: white;
	display: flex; align-items: center; justify-content: center;
	font-size: 34rpx; font-weight: 700;
	box-shadow: 0 8rpx 0 #3D8B00;
	position: absolute; bottom: 100rpx;
}
</style>
