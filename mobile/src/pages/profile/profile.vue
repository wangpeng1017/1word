<template>
	<view class="container">
		<!-- 用户信息卡片 -->
		<view class="user-card">
			<view class="user-left">
				<view class="user-avatar">👤</view>
				<view class="user-info">
					<view class="user-name-row">
						<text class="user-name">{{userInfo.name || '同学'}}</text>
						<!-- 勋章显示 -->
						<view class="user-badges" v-if="!isGuest && displayedBadges.length > 0">
							<text v-for="item in displayedBadges" :key="item.id" class="badge-icon">{{item.icon}}</text>
						</view>
					</view>
					<text class="user-id" v-if="!isGuest">手机：{{userInfo.phone || '--'}}</text>
					<text class="user-id" v-else>点击下方登录同步数据</text>
				</view>
			</view>
			
			<!-- 游客模式显示登录按钮 -->
			<view class="user-level" v-if="isGuest">
				<view class="level-badge" @click="goToLogin" style="background: rgba(255,255,255,0.9);">
					<text class="level-text" style="color: #FF7A7A;">立即登录</text>
				</view>
			</view>

			<!-- 正常模式显示等级 -->
			<view class="user-level" v-else>
				<view class="level-badge">
					<text class="level-icon">⭐</text>
					<text class="level-text">Lv.{{pointsInfo.level || 1}}</text>
				</view>
				<text class="points-text">{{pointsInfo.totalPoints || 0}}积分</text>
			</view>
		</view>

		<!-- 学习数据概览 -->
		<view class="stats-section">
			<view class="stats-grid-compact">
				<view class="stat-card-compact">
					<text class="stat-value-compact">{{historyStats.totalSessions}}</text>
					<text class="stat-label-compact">学习次数</text>
				</view>
				<view class="stat-card-compact">
					<text class="stat-value-compact">{{historyStats.totalWords}}</text>
					<text class="stat-label-compact">总题数</text>
				</view>
				<view class="stat-card-compact">
					<text class="stat-value-compact">{{historyStats.avgAccuracy}}%</text>
					<text class="stat-label-compact">期望正确率</text>
				</view>
				<view class="stat-card-compact">
					<text class="stat-value-compact">{{historyStats.totalTimeString}}</text>
					<text class="stat-label-compact">总用时</text>
				</view>
			</view>
		</view>

		<!-- 功能入口 -->
		<view class="quick-links">
			<view class="quick-link-item" @click="goToStudyHistory">
				<view class="link-icon">📚</view>
				<text class="link-title">学习历史</text>
				<text class="link-arrow">›</text>
			</view>
			<view class="quick-link-item" @click="goToVocabularyTest">
				<view class="link-icon">📊</view>
				<text class="link-title">词汇量测试</text>
				<text class="link-arrow">›</text>
			</view>
			<view class="quick-link-item" @click="goToBadges">
				<view class="link-icon">🎖️</view>
				<text class="link-title">勋章墙</text>
				<text class="link-arrow">›</text>
			</view>
			<view class="quick-link-item" @click="goToRedeem">
				<view class="link-icon" :style="isGuest ? 'background: #ccc;' : ''">🛒</view>
				<text class="link-title">积分商城</text>
				<text class="link-arrow">›</text>
			</view>
		</view>

		<!-- 设置选项 -->
		<view class="menu-section">
			<view class="menu-item sound-toggle">
				<text class="menu-icon">🔊</text>
				<text class="menu-label">音效</text>
				<switch :checked="soundEnabled" @change="toggleSound" color="#FF7A7A" />
			</view>
			<view class="menu-item" @click="logout">
				<text class="menu-icon">🚪</text>
				<text class="menu-label">{{ isGuest ? '返回登录' : '退出登录' }}</text>
				<text class="menu-arrow">›</text>
			</view>
		</view>
	</view>
</template>

<script>
import { get } from '../../utils/request'
import { isSoundEnabled, setSoundEnabled, waitForUserInfo } from '../../utils/audio'

export default {
	data() {
		return {
			userInfo: null,
			isGuest: false,
			historyStats: {
				totalSessions: 0,
				totalWords: 0,
				avgAccuracy: 0,
				totalTimeString: '00:00',
			},
			pointsInfo: {
				totalPoints: 0,
				level: 1
			},
			displayedBadges: [],
			soundEnabled: true,
		}
	},
	async onLoad() {
		const app = getApp()
		if (!app.globalData.token) {
			if (app.globalData.isGuest) {
				this.isGuest = true
				this.userInfo = { name: '游客' }
				return
			}
			uni.reLaunch({ url: '/pages/login/login' })
			return
		}

		const userInfo = await waitForUserInfo()
		if (!userInfo) {
			uni.reLaunch({ url: '/pages/login/login' })
			return
		}
		this.userInfo = userInfo
		this.init()
	},
	onShow() {
		if (!this.isGuest && getApp().globalData.token) {
			this.init()
		}
		this.soundEnabled = isSoundEnabled()
	},
	methods: {
		init() {
			this.loadHistoryStats()
			this.loadPointsInfo()
			this.loadBadges()
		},
		async loadHistoryStats() {
			const studentId = this.userInfo?.studentId
			if (!studentId) return

			try {
				const records = await get(`/study-records?studentId=${studentId}&limit=1000`)
				if (!records || records.length === 0) return

				const totalSessions = records.length
				const totalWords = records.reduce((sum, r) => sum + (r.totalWords || 0), 0)
				const totalCorrect = records.reduce((sum, r) => sum + (r.correctCount || 0), 0)
				const totalWrong = records.reduce((sum, r) => sum + (r.wrongCount || 0), 0)
				const totalTime = records.reduce((sum, r) => sum + (r.totalTime || 0), 0)

				const totalAnswered = totalCorrect + totalWrong
				const avgAccuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0

				const totalMinutes = Math.floor(totalTime / 60)
				const totalSeconds = totalTime % 60
				const totalTimeString = `${totalMinutes.toString().padStart(2, '0')}:${totalSeconds.toString().padStart(2, '0')}`

				this.historyStats = { totalSessions, totalWords, avgAccuracy, totalTimeString }
			} catch (e) {
				console.error('加载历史数据失败', e)
			}
		},
		async loadPointsInfo() {
			const studentId = this.userInfo?.studentId
			if (!studentId) return
			try {
				const res = await get(`/points?studentId=${studentId}`)
				if (res?.points) {
					this.pointsInfo = {
						totalPoints: res.points.totalPoints || 0,
						level: res.points.level || 1
					}
				}
			} catch (e) {}
		},
		async loadBadges() {
			const studentId = this.userInfo?.studentId
			if (!studentId) return
			try {
				const res = await get(`/students/${studentId}/badges`)
				if (res?.displayed) {
					this.displayedBadges = res.displayed || []
				}
			} catch (e) {}
		},
		toggleSound(e) {
			const enabled = e.detail.value
			setSoundEnabled(enabled)
			this.soundEnabled = enabled
			uni.showToast({ title: enabled ? '音效已开启' : '音效已关闭', icon: 'none' })
		},
		logout() {
			const app = getApp()
			if (this.isGuest) {
				this.goToLogin()
				return
			}
			uni.showModal({
				title: '确认退出',
				content: '确定要退出登录吗？',
				success: (res) => {
					if (res.confirm) app.logout()
				}
			})
		},
		goToLogin() {
			getApp().globalData.isGuest = false
			uni.reLaunch({ url: '/pages/login/login' })
		},
		// 暂未实现的二级页面
		goToStudyHistory() { uni.showToast({ title: '功能开发中', icon: 'none' }) },
		goToVocabularyTest() { uni.showToast({ title: '功能开发中', icon: 'none' }) },
		goToBadges() { uni.showToast({ title: '功能开发中', icon: 'none' }) },
		goToRedeem() { uni.showToast({ title: '功能开发中', icon: 'none' }) }
	}
}
</script>

<style lang="scss">
.container {
	min-height: 100vh;
	background: #F3F4F6;
	padding-bottom: 40rpx;
}

.user-card {
	background: #FF7A7A;
	padding: 80rpx 40rpx 100rpx;
	display: flex;
	justify-content: space-between;
	align-items: center;
	color: white;
}

.user-left {
	display: flex;
	align-items: center;
}

.user-avatar {
	width: 120rpx; height: 120rpx;
	background: rgba(255,255,255,0.2);
	border-radius: 50%;
	display: flex; align-items: center; justify-content: center;
	font-size: 60rpx;
	margin-right: 30rpx;
}

.user-name { font-size: 40rpx; font-weight: 700; }
.user-id { font-size: 24rpx; opacity: 0.8; margin-top: 8rpx; display: block; }

.level-badge {
	background: rgba(0,0,0,0.1);
	padding: 8rpx 20rpx;
	border-radius: 30rpx;
	display: flex; align-items: center;
}

.level-icon { font-size: 24rpx; margin-right: 6rpx; }
.level-text { font-size: 24rpx; font-weight: 700; }
.points-text { font-size: 22rpx; text-align: right; display: block; margin-top: 8rpx; }

.stats-section {
	padding: 0 30rpx;
	margin-top: -40rpx;
}

.stats-grid-compact {
	background: white;
	border-radius: 20rpx;
	padding: 40rpx 20rpx;
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.05);
}

.stat-card-compact {
	display: flex; flex-direction: column; align-items: center;
	border-right: 1rpx solid #F3F4F6;
	&:last-child { border-right: none; }
}

.stat-value-compact { font-size: 32rpx; font-weight: 700; color: #1F2937; }
.stat-label-compact { font-size: 22rpx; color: #9CA3AF; margin-top: 8rpx; }

.quick-links, .menu-section {
	background: white;
	margin: 30rpx;
	border-radius: 20rpx;
	padding: 0 30rpx;
}

.quick-link-item, .menu-item {
	display: flex; align-items: center;
	padding: 30rpx 0;
	border-bottom: 1rpx solid #F3F4F6;
	&:last-child { border-bottom: none; }
}

.link-icon, .menu-icon {
	width: 60rpx; height: 60rpx;
	background: #FEE2E2;
	border-radius: 12rpx;
	display: flex; align-items: center; justify-content: center;
	margin-right: 24rpx;
}

.link-title, .menu-label { flex: 1; font-size: 30rpx; color: #374151; }
.link-arrow, .menu-arrow { color: #D1D5DB; font-size: 40rpx; }

.sound-toggle { justify-content: space-between; }
</style>
