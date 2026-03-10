	<view class="container login-container" :style="{ paddingTop: (statusBarHeight + 20) + 'px' }">
		<view class="login-header">
			<view class="logo-container">
				<text class="logo-icon">📖</text>
			</view>
			<text class="title-large">智能词汇复习</text>
		</view>

		<view class="login-form card mt-5">
			<view class="form-item">
				<text class="form-label">手机号</text>
				<input
					class="form-input"
					placeholder="请输入手机号"
					type="number"
					maxlength="11"
					v-model="phone"
				/>
			</view>

			<view class="form-item mt-3">
				<text class="form-label">密码</text>
				<view class="password-input-wrapper">
					<input
						class="form-input password-input"
						placeholder="请输入密码"
						:password="!showPassword"
						v-model="password"
					/>
					<view class="password-toggle-icon" @click="togglePassword">
						<view class="eye-icon" :class="showPassword ? 'eye-open' : 'eye-close'">
							<view class="eye-ball"></view>
						</view>
					</view>
				</view>
			</view>

			<!-- 协议勾选 -->
			<view class="agreement-check mt-3">
				<checkbox-group @change="onAgreementChange">
					<label class="agreement-label">
						<checkbox value="agree" :checked="agreedToTerms" color="#FF7A7A" />
					</label>
				</checkbox-group>
				<view class="agreement-text">
					<text>我已阅读并同意</text>
					<text class="agreement-link" @click="goToPrivacy">《隐私政策》</text>
					<text>和</text>
					<text class="agreement-link" @click="goToAgreement">《用户服务协议》</text>
				</view>
			</view>

			<button
				class="btn-primary mt-4"
				@click="handleLogin"
				:loading="loading"
				:disabled="!agreedToTerms"
			>
				登录
			</button>

			<button
				class="btn-text mt-3"
				@click="handleGuestLogin"
			>
				暂不登录，先看看
			</button>
		</view>

		<view class="login-footer mt-4 text-center">
			<text class="text-muted">首次登录密码为手机号</text>

			<view class="customer-service-btn" @click="showCustomerService">
				<text class="cs-icon">💬</text>
				<text class="cs-text">联系客服</text>
			</view>
		</view>

		<!-- 客服二维码弹窗 -->
		<view v-if="showQrcode" class="qrcode-modal" @touchmove.stop.prevent>
			<view class="qrcode-mask" @click="hideCustomerService"></view>
			<view class="qrcode-content">
				<view class="qrcode-header">
					<text class="qrcode-title">联系客服</text>
					<text class="qrcode-close" @click="hideCustomerService">✕</text>
				</view>
				<view class="qrcode-body">
					<image
						class="qrcode-image"
						:src="qrcodeUrl"
						mode="aspectFit"
						@click="previewQrcode"
					/>
					<text class="qrcode-tip">长按识别或保存二维码添加客服微信</text>
				</view>
				<view class="qrcode-actions">
					<button class="qrcode-btn qrcode-btn-primary" @click="saveQrcode">保存到相册</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { post, get } from '../../utils/request'

export default {
	data() {
		return {
			phone: '',
			password: '',
			loading: false,
			showPassword: false,
			agreedToTerms: false,
			showQrcode: false,
			qrcodeUrl: '',
			hasCustomerService: false,
			statusBarHeight: 0,
		}
	},
	onLoad() {
		this.statusBarHeight = getApp().globalData.statusBarHeight || 0
		this.loadCustomerService()
	},
	methods: {
		async loadCustomerService() {
			try {
				const result = await get('/public/customer-service', {}, false)
				if (result?.qrcodeUrl) {
					this.qrcodeUrl = result.qrcodeUrl
					this.hasCustomerService = true
				}
			} catch (error) {
				console.log('获取客服二维码失败', error)
			}
		},
		showCustomerService() {
			if (!this.qrcodeUrl) {
				uni.showToast({ title: '客服暂未开通', icon: 'none' })
				return
			}
			this.showQrcode = true
		},
		hideCustomerService() {
			this.showQrcode = false
		},
		previewQrcode() {
			uni.previewImage({
				urls: [this.qrcodeUrl],
				current: this.qrcodeUrl
			})
		},
		async saveQrcode() {
			// #ifdef H5
			uni.showToast({ title: '请长按图片保存', icon: 'none' })
			// #endif
			
			// #ifndef H5
			try {
				uni.showLoading({ title: '保存中...' })
				const [err, res] = await uni.downloadFile({ url: this.qrcodeUrl })
				if (res.statusCode === 200) {
					await uni.saveImageToPhotosAlbum({ filePath: res.tempFilePath })
					uni.hideLoading()
					uni.showToast({ title: '已保存到相册', icon: 'success' })
				} else {
					throw new Error('下载失败')
				}
			} catch (error) {
				uni.hideLoading()
				uni.showToast({ title: '保存失败', icon: 'none' })
			}
			// #endif
		},
		togglePassword() {
			this.showPassword = !this.showPassword
		},
		onAgreementChange(e) {
			this.agreedToTerms = e.detail.value.length > 0
		},
		goToPrivacy() {
			uni.navigateTo({ url: '/pages/privacy/privacy' })
		},
		goToAgreement() {
			uni.navigateTo({ url: '/pages/agreement/agreement' })
		},
		async handleLogin() {
			if (!this.agreedToTerms) {
				uni.showToast({ title: '请先阅读并同意协议', icon: 'none' })
				return
			}
			if (!this.phone || this.phone.length !== 11) {
				uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
				return
			}
			if (!this.password) {
				uni.showToast({ title: '请输入密码', icon: 'none' })
				return
			}

			this.loading = true
			try {
				const result = await post('/auth/login', {
					phone: this.phone,
					password: this.password,
				}, false)

				const app = getApp()
				app.setLoginInfo(result.token, result.user)

				uni.showToast({ title: '登录成功', icon: 'success' })
				setTimeout(() => {
					uni.switchTab({ url: '/pages/today-learn/today-learn' })
				}, 1500)
			} catch (error) {
				console.error('登录失败:', error)
			} finally {
				this.loading = false
			}
		},
		handleGuestLogin() {
			getApp().globalData.isGuest = true
			uni.switchTab({ url: '/pages/today-learn/today-learn' })
		}
	}
}
</script>

<style lang="scss">
.login-container {
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	min-height: 100vh;
	padding: 60rpx 40rpx;
	background: white;
}

.login-header {
	text-align: center;
	margin-bottom: 80rpx;
}

.logo-container {
	width: 160rpx; height: 160rpx;
	margin: 0 auto 40rpx;
	background: linear-gradient(135deg, #FF7A7A 0%, #D65D5D 100%);
	border-radius: 40rpx;
	display: flex; align-items: center; justify-content: center;
	box-shadow: 0 8rpx 24rpx rgba(255, 122, 122, 0.3);
}

.logo-icon { font-size: 96rpx; }

.login-header .title-large {
	font-size: 48rpx; font-weight: 600; color: #1F2937;
}

.login-form { width: 100%; max-width: 600rpx; }

.form-item { margin-bottom: 32rpx; }

.form-label {
	display: block; font-size: 28rpx; color: #374151;
	margin-bottom: 16rpx; font-weight: 500;
}

.form-input {
	width: 100%; height: 88rpx; padding: 0 24rpx;
	border: 2rpx solid #E5E7EB; border-radius: 12rpx;
	font-size: 32rpx; box-sizing: border-box;
}

.password-input-wrapper {
	position: relative; display: flex; align-items: center;
}

.password-input { flex: 1; padding-right: 88rpx; }

.password-toggle-icon {
	position: absolute; right: 24rpx;
	width: 44rpx; height: 44rpx;
	display: flex; align-items: center; justify-content: center;
}

.eye-icon { position: relative; width: 40rpx; height: 40rpx; }

.eye-ball {
	position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
	transition: all 0.3s;
}

.eye-icon.eye-close .eye-ball {
	width: 32rpx; height: 3rpx; background: #9CA3AF; transform: translate(-50%, -50%) rotate(-45deg);
}

.eye-icon.eye-open .eye-ball {
	width: 16rpx; height: 16rpx; border-radius: 50%; background: #374151;
}

.agreement-check { display: flex; align-items: flex-start; padding: 20rpx 0; }
.agreement-label { margin-right: 12rpx; }
.agreement-text { flex: 1; font-size: 26rpx; color: #6B7280; line-height: 40rpx; }
.agreement-link { color: #FF7A7A; }

.btn-primary {
	width: 100%; height: 100rpx; background: #FF7A7A; color: white;
	border-radius: 50rpx; font-size: 34rpx; font-weight: 700;
	display: flex; align-items: center; justify-content: center;
	margin-top: 40rpx;
}

.btn-text {
	width: 100%; background: transparent; color: #6B7280;
	font-size: 28rpx; border: none; margin-top: 20rpx;
}

.customer-service-btn {
	display: flex; align-items: center; justify-content: center;
	margin-top: 60rpx; padding: 16rpx 40rpx;
	background: #10B981; border-radius: 40rpx;
	color: white; font-size: 28rpx;
}

.cs-icon { margin-right: 10rpx; }

.qrcode-modal {
	position: fixed; top: 0; left: 0; right: 0; bottom: 0;
	z-index: 2000; display: flex; align-items: center; justify-content: center;
}

.qrcode-mask { position: absolute; width: 100%; height: 100%; background: rgba(0,0,0,0.5); }

.qrcode-content {
	position: relative; width: 560rpx; background: white; border-radius: 24rpx; padding: 40rpx;
}

.qrcode-header { display: flex; justify-content: space-between; margin-bottom: 30rpx; }
.qrcode-title { font-size: 36rpx; font-weight: 700; }
.qrcode-close { font-size: 40rpx; color: #AFAFAF; }

.qrcode-body { display: flex; flex-direction: column; align-items: center; }
.qrcode-image { width: 400rpx; height: 400rpx; margin-bottom: 20rpx; }
.qrcode-tip { font-size: 24rpx; color: #6B7280; text-align: center; }

.qrcode-actions { margin-top: 40rpx; }
.qrcode-btn-primary {
	width: 100%; height: 80rpx; background: #10B981; color: white;
	border-radius: 40rpx; font-size: 28rpx; display: flex; align-items: center; justify-content: center;
}

.mt-3 { margin-top: 30rpx; }
.mt-4 { margin-top: 40rpx; }
.mt-5 { margin-top: 50rpx; }
.text-center { text-align: center; }
.text-muted { color: #9CA3AF; font-size: 24rpx; }
</style>
