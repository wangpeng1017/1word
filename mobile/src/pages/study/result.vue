<template>
	<view class="container">
		<!-- 结果卡片 -->
		<view class="result-card">
			<view class="result-icon">
				<image class="success-horse" src="/static/images/success_horse_red_v3.png" mode="aspectFit"></image>
			</view>
			
			<view class="result-title">
				<text v-if="accuracy >= 80">太棒了！</text>
				<text v-elif="accuracy >= 60">继续加油！</text>
				<text v-else>再接再厉！</text>
			</view>

			<view class="accuracy-circle">
				<text class="accuracy-value">{{accuracy}}%</text>
				<text class="accuracy-label">正确率</text>
			</view>

			<!-- 统计数据 -->
			<view class="stats-grid">
				<view class="stat-item">
					<text class="stat-value">{{total}}</text>
					<text class="stat-label">总题数</text>
				</view>
				<view class="stat-item correct">
					<text class="stat-value">{{correct}}</text>
					<text class="stat-label">正确</text>
				</view>
				<view class="stat-item wrong">
					<text class="stat-value">{{wrong}}</text>
					<text class="stat-label">错误</text>
				</view>
				<view class="stat-item">
					<text class="stat-value">{{timeString}}</text>
					<text class="stat-label">今日用时</text>
				</view>
			</view>

			<!-- 操作按钮 -->
			<view class="action-buttons">
				<button class="btn-secondary" @click="viewWrongQuestions" v-if="wrong > 0">查看错题</button>
				<button class="btn-primary" @click="backToHome">返回首页</button>
			</view>
		</view>

		<!-- 鼓励语 -->
		<view class="encouragement">
			<text v-if="accuracy === 100">完美答题！所有单词都掌握了 🎯</text>
			<text v-elif="accuracy >= 80">表现出色！继续保持这个状态 ✨</text>
			<text v-elif="accuracy >= 60">不错的开始！多复习错题效果更好 📚</text>
			<text v-else>坚持练习，进步会很明显的 🌟</text>
		</view>

		<!-- 激励弹窗 -->
		<view class="motivation-overlay" v-if="showMotivation" @click="closeMotivation">
			<view class="motivation-popup" @click.stop>
				<view class="motivation-icon">
					<text class="motivation-emoji">{{streakDays >= 7 ? '🏆' : '🔥'}}</text>
				</view>
				
				<view class="motivation-title">{{motivationTitle}}</view>
				
				<view class="motivation-streak">
					<text class="streak-num">连续学习 {{streakDays}} 天</text>
				</view>
				
				<view class="motivation-message">{{motivationMessage}}</view>
				
				<view class="motivation-stats">
					<view class="motivation-stat-item">
						<text class="motivation-stat-icon">📚</text>
						<text class="motivation-stat-value">{{total}}</text>
						<text class="motivation-stat-label">今日单词</text>
					</view>
					<view class="motivation-stat-item">
						<text class="motivation-stat-icon">✅</text>
						<text class="motivation-stat-value">{{accuracy}}%</text>
						<text class="motivation-stat-label">正确率</text>
					</view>
					<view class="motivation-stat-item">
						<text class="motivation-stat-icon">🎯</text>
						<text class="motivation-stat-value">{{masteredWords}}</text>
						<text class="motivation-stat-label">累计掌握</text>
					</view>
					<view class="motivation-stat-item">
						<text class="motivation-stat-icon">⭐</text>
						<text class="motivation-stat-value">Lv.{{level}}</text>
						<text class="motivation-stat-label">当前等级</text>
					</view>
				</view>
				
				<button class="motivation-close-btn" @click="closeMotivation">太棒了！</button>
			</view>
		</view>
	</view>
</template>

<script>
import { get } from '../../utils/request'

export default {
	data() {
		return {
			correct: 0, wrong: 0, total: 0, accuracy: 0,
			timeString: '00:00', streakDays: 0, masteredWords: 0, level: 1,
			showMotivation: false, motivationTitle: '', motivationMessage: ''
		}
	},
	async onLoad(options) {
		this.correct = parseInt(options.correct || 0)
		this.wrong = parseInt(options.wrong || 0)
		this.total = parseInt(options.total || 0)
		this.accuracy = this.total > 0 ? Math.round((this.correct / this.total) * 100) : 0

		await this.loadServerData()
		setTimeout(() => this.showMotivation = true, 2000)
	},
	methods: {
		async loadServerData() {
			try {
				const app = getApp()
				const studentId = app.globalData.userInfo?.studentId
				if (!studentId) return

				const [reviewData, pointsData] = await Promise.all([
					get(`/review-plan/${studentId}`).catch(() => null),
					get(`/points?studentId=${studentId}`).catch(() => null)
				])

				if (reviewData) {
					const today = reviewData?.miniapp?.today || {}
					this.streakDays = reviewData?.miniapp?.progress?.consecutiveDays || 0
					this.masteredWords = reviewData?.progress?.masteredWords || 0
					const ts = today.timeSpentSeconds || 0
					this.timeString = `${Math.floor(ts/60).toString().padStart(2,'0')}:${(ts%60).toString().padStart(2,'0')}`
					
					const motivation = this.getMotivationContent(this.streakDays)
					this.motivationTitle = motivation.title
					this.motivationMessage = motivation.message
				}

				if (pointsData?.points) {
					this.level = pointsData.points.level || 1
				}
			} catch (e) {}
		},
		getMotivationContent(days) {
			if (days <= 1) return { title: '开启征程！', message: '万里长征第一步，明天继续！' }
			if (days <= 3) return { title: '稳扎稳打！', message: '坚持就是超越，继续加油！' }
			if (days <= 7) return { title: '势如破竹！', message: '学习习惯正在养成中！' }
			return { title: '超级学霸！', message: '你的坚持令人敬佩！' }
		},
		closeMotivation() { this.showMotivation = false },
		viewWrongQuestions() { uni.switchTab({ url: '/pages/wrong/wrong' }) },
		backToHome() { uni.switchTab({ url: '/pages/today-learn/today-learn' }) }
	}
}
</script>

<style lang="scss">
.container {
	min-height: 100vh;
	background: #F9FAFB;
	padding: 40rpx 32rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
}

.result-card {
	width: 100%; background: white; border-radius: 32rpx; padding: 60rpx 32rpx;
	box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.06);
	display: flex; flex-direction: column; align-items: center; margin-bottom: 32rpx;
}

.success-horse { width: 320rpx; height: 320rpx; margin-bottom: 24rpx; }
.result-title { font-size: 48rpx; font-weight: 800; color: #1F2937; margin-bottom: 40rpx; }

.accuracy-circle {
	width: 220rpx; height: 220rpx; border-radius: 110rpx;
	border: 12rpx solid #FF7A7A;
	display: flex; flex-direction: column; align-items: center; justify-content: center;
	margin-bottom: 48rpx;
}
.accuracy-value { font-size: 64rpx; font-weight: 800; color: #FF7A7A; line-height: 1; }
.accuracy-label { font-size: 24rpx; color: #9CA3AF; margin-top: 8rpx; }

.stats-grid { display: flex; width: 100%; gap: 20rpx; margin-bottom: 48rpx; }
.stat-item {
	flex: 1; background: #F3F4F6; border-radius: 20rpx; padding: 24rpx 10rpx;
	display: flex; flex-direction: column; align-items: center;
	&.correct { background: #ECFDF5; .stat-value { color: #10B981; } }
	&.wrong { background: #FEF2F2; .stat-value { color: #EF4444; } }
}
.stat-value { font-size: 36rpx; font-weight: 700; color: #1F2937; }
.stat-label { font-size: 22rpx; color: #9CA3AF; margin-top: 4rpx; }

.action-buttons { display: flex; gap: 24rpx; width: 100%; }
.btn-primary {
	flex: 1; height: 90rpx; background: #FF7A7A; color: white; border-radius: 45rpx;
	font-size: 30rpx; font-weight: 700; display: flex; align-items: center; justify-content: center;
}
.btn-secondary {
	flex: 1; height: 90rpx; border: 2rpx solid #FF7A7A; color: #FF7A7A; border-radius: 45rpx;
	font-size: 30rpx; font-weight: 700; display: flex; align-items: center; justify-content: center;
	background: white;
}

.encouragement { font-size: 26rpx; color: #6B7280; margin-top: 20rpx; }

.motivation-overlay {
	position: fixed; top: 0; left: 0; right: 0; bottom: 0;
	background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.motivation-popup {
	width: 600rpx; background: white; border-radius: 32rpx; padding: 50rpx 40rpx; text-align: center;
}
.motivation-emoji { font-size: 100rpx; margin-bottom: 20rpx; display: block; }
.motivation-title { font-size: 44rpx; font-weight: 800; color: #FF7A7A; margin-bottom: 10rpx; }
.streak-num { font-size: 30rpx; color: #F7931E; font-weight: 700; }
.motivation-message { font-size: 26rpx; color: #6B7280; margin: 20rpx 0 40rpx; }

.motivation-stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20rpx; margin-bottom: 40rpx; }
.motivation-stat-item { background: #F9FAFB; padding: 20rpx; border-radius: 16rpx; }
.motivation-stat-value { font-size: 32rpx; font-weight: 700; display: block; }
.motivation-stat-label { font-size: 22rpx; color: #9CA3AF; }

.motivation-close-btn {
	width: 100%; height: 88rpx; background: #FF7A7A; color: white; border-radius: 44rpx;
	font-size: 32rpx; font-weight: 700;
}
</style>
