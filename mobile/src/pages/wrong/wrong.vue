<template>
	<view class="container">
		<!-- 标题栏 -->
		<view class="header">
			<text class="header-title">📖 错题本</text>
			<text class="header-count">共 {{filteredQuestions.length}} 题</text>
		</view>

		<!-- 操作按钮 -->
		<view class="action-buttons" v-if="filteredQuestions.length > 0">
			<button class="action-btn primary" @click="retestAll">
				<text class="btn-icon">🔄</text>
				<text>全部重测</text>
			</button>
		</view>

		<!-- 加载中 -->
		<view v-if="isLoading" class="loading">
			<text>加载中...</text>
		</view>

		<!-- 空状态 -->
		<view v-elif="isEmpty" class="empty">
			<text class="empty-icon">📚</text>
			<text class="empty-text">还没有错题</text>
			<text class="empty-hint">继续学习积累词汇吧</text>
		</view>

		<!-- 错题列表 -->
		<view v-else class="content">
			<!-- 筛选器 -->
			<scroll-view class="filter-tabs" scroll-x>
				<view 
					class="filter-item"
					:class="{ active: currentFilter === 'ALL' }"
					@click="filterByType('ALL')"
				>
					全部 ({{wrongQuestions.length}})
				</view>
				<view 
					v-for="(val, key) in typeNames" 
					:key="key"
					class="filter-item"
					:class="{ active: currentFilter === key }"
					@click="filterByType(key)"
				>
					{{val}} ({{stats.byType ? (stats.byType[key] || 0) : 0}})
				</view>
			</scroll-view>

			<!-- 错题列表 -->
			<view class="question-list">
				<view 
					v-for="(item, index) in filteredQuestions" 
					:key="item.id"
					class="question-item"
					@click="viewDetail(item)"
				>
					<view class="question-header">
						<view class="word">{{item.vocabulary.word}}</view>
						<view class="type-badge">
							<text>{{getQuestionTypeName(item.question.type)}}</text>
						</view>
					</view>
					
					<view class="question-content">
						<view class="answer-row">
							<text class="label wrong-label">你的答案：</text>
							<text class="value wrong-value">{{item.wrongAnswer}}</text>
						</view>
						<view class="answer-row">
							<text class="label correct-label">正确答案：</text>
							<text class="value correct-value">{{item.correctAnswer}}</text>
						</view>
					</view>

					<view class="meaning">
						<block v-if="item.vocabulary.meanings && item.vocabulary.meanings.length > 0">
							<view v-for="m in item.vocabulary.meanings" :key="m.id" class="meaning-item">
								<text class="pos-tag">{{m.partOfSpeech}}</text>
								<text>{{m.meaning}}</text>
							</view>
						</block>
						<text v-else>暂无释义</text>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { get } from '../../utils/request'
import { waitForUserInfo } from '../../utils/audio'

export default {
	data() {
		return {
			wrongQuestions: [],
			filteredQuestions: [],
			stats: {},
			currentFilter: 'ALL',
			isLoading: true,
			isEmpty: false,
			typeNames: {
				ENGLISH_TO_CHINESE: '英选汉',
				CHINESE_TO_ENGLISH: '汉选英',
				LISTENING: '听音',
				FILL_IN_BLANK: '填空'
			}
		}
	},
	async onLoad() {
		const app = getApp()
		if (!app.globalData.token) {
			uni.reLaunch({ url: '/pages/login/login' })
			return
		}

		const userInfo = await waitForUserInfo()
		if (!userInfo) {
			uni.reLaunch({ url: '/pages/login/login' })
			return
		}

		this.loadWrongQuestions()
	},
	onShow() {
		if (getApp().globalData.token) {
			this.loadWrongQuestions()
		}
	},
	onPullDownRefresh() {
		this.loadWrongQuestions().then(() => {
			uni.stopPullDownRefresh()
		})
	},
	methods: {
		async loadWrongQuestions() {
			try {
				this.isLoading = true
				const studentId = getApp().globalData.userInfo?.studentId
				if (!studentId) throw new Error('未找到学生ID')

				const response = await get(`/students/${studentId}/wrong-questions?limit=300`)
				this.wrongQuestions = response.wrongQuestions || []
				this.stats = response.stats || {}
				this.applyFilter()
				
				this.isLoading = false
				this.isEmpty = this.wrongQuestions.length === 0
			} catch (error) {
				console.error('加载错题失败:', error)
				this.isLoading = false
				this.isEmpty = true
			}
		},
		filterByType(type) {
			this.currentFilter = type
			this.applyFilter()
		},
		applyFilter() {
			if (this.currentFilter === 'ALL') {
				this.filteredQuestions = this.wrongQuestions
			} else {
				this.filteredQuestions = this.wrongQuestions.filter(item => item.question.type === this.currentFilter)
			}
		},
		getQuestionTypeName(type) {
			return this.typeNames[type] || type
		},
		viewDetail(question) {
			let meaningText = ''
			if (question.vocabulary.meanings?.length > 0) {
				meaningText = question.vocabulary.meanings
					.map(m => `${m.partOfSpeech} ${m.meaning}`)
					.join('\n')
			} else {
				meaningText = '暂无释义'
			}

			uni.showModal({
				title: question.vocabulary.word,
				content: `题型：${this.getQuestionTypeName(question.question.type)}\n\n${question.question.content}\n\n你的答案：${question.wrongAnswer}\n正确答案：${question.correctAnswer}\n\n释义：\n${meaningText}`,
				showCancel: false,
				confirmText: '知道了'
			})
		},
		retestAll() {
			if (this.wrongQuestions.length === 0) {
				uni.showToast({ title: '暂无错题', icon: 'none' })
				return
			}

			uni.showModal({
				title: '确认重测',
				content: `确定要重测全部 ${this.wrongQuestions.length} 道错题吗?`,
				success: (res) => {
					if (res.confirm) {
						const questionIds = this.wrongQuestions.map(q => q.questionId)
						uni.navigateTo({
							url: `/pages/study/study?mode=retest&questionIds=${questionIds.join(',')}`
						})
					}
				}
			})
		}
	}
}
</script>

<style lang="scss">
.container {
	min-height: 100vh;
	background-color: #F3F4F6;
}

.header {
	background: #FFFFFF;
	padding: 30rpx;
	display: flex;
	justify-content: space-between;
	align-items: center;
	border-bottom: 1rpx solid #E5E7EB;
}

.header-title {
	font-size: 36rpx;
	font-weight: 600;
	color: #111827;
}

.header-count {
	font-size: 28rpx;
	color: #6B7280;
}

.action-buttons {
	background: #FFFFFF;
	padding: 20rpx 30rpx;
	border-bottom: 1rpx solid #E5E7EB;
}

.action-btn {
	width: 100%;
	height: 88rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: linear-gradient(135deg, #FF7A7A 0%, #D65D5D 100%);
	color: #FFFFFF;
	font-size: 28rpx;
	border-radius: 44rpx;
	border: none;
	box-shadow: 0 4rpx 12rpx rgba(255, 122, 122, 0.3);
}

.btn-icon { margin-right: 12rpx; font-size: 32rpx; }

.loading, .empty {
	display: flex; flex-direction: column; align-items: center; justify-content: center;
	padding: 120rpx 30rpx;
}

.empty-icon { font-size: 120rpx; margin-bottom: 20rpx; }
.empty-text { font-size: 32rpx; color: #6B7280; margin-bottom: 12rpx; }
.empty-hint { font-size: 26rpx; color: #9CA3AF; }

.filter-tabs {
	background: #FFFFFF;
	padding: 20rpx;
	white-space: nowrap;
	border-bottom: 1rpx solid #E5E7EB;
}

.filter-item {
	display: inline-block;
	padding: 12rpx 30rpx;
	margin-right: 20rpx;
	font-size: 26rpx;
	color: #6B7280;
	background: #F3F4F6;
	border-radius: 30rpx;
	&.active {
		background: #FF7A7A;
		color: #FFFFFF;
	}
}

.question-list { padding: 30rpx; }

.question-item {
	background: #FFFFFF;
	border-radius: 20rpx;
	padding: 30rpx;
	margin-bottom: 24rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.question-header {
	display: flex; justify-content: space-between; align-items: center;
	margin-bottom: 20rpx;
}

.word { font-size: 36rpx; font-weight: 700; color: #111827; }

.type-badge {
	padding: 4rpx 16rpx;
	background: #FFF1F1;
	color: #FF7A7A;
	font-size: 22rpx;
	border-radius: 8rpx;
}

.question-content { margin-bottom: 20rpx; }

.answer-row {
	display: flex; align-items: center; margin-bottom: 10rpx;
	font-size: 26rpx;
}

.label { min-width: 140rpx; color: #9CA3AF; }
.wrong-value { color: #EF4444; text-decoration: line-through; margin-left: 10rpx; }
.correct-value { color: #10B981; font-weight: 600; margin-left: 10rpx; }

.meaning {
	padding-top: 20rpx;
	border-top: 1rpx solid #F3F4F6;
	font-size: 24rpx;
	color: #6B7280;
}

.pos-tag {
	display: inline-block;
	width: 60rpx;
	font-weight: 600;
	color: #AFAFAF;
	margin-right: 10rpx;
}
</style>
