# 1word 移动端部署与打包指南 (Uni-app)

> 本文档指导如何将 1word 移动端源码打包为原生安装包 (APK/IPA)。

## 1. 准备工作

### A. 环境要求
- **HBuilderX**: 推荐使用最新正式版。
- **Node.js**: 16.x 或更高版本。
- **Android SDK**: 打包 Android 离线包时需要。
- **Xcode**: 仅打包 iOS 版需要（MacOS 环境）。

### B. 静态资源
- **图标**: 1024x1024 像素的 PNG 图片。
- **启动页**: 针对不同分辨率的启动图或 Storyboard。

---

## 2. 打包步骤 (云打包)

这是最简便的打包方式，由 DCloud 服务器提供构建环境。

### Android
1. 在 HBuilderX 中打开项目。
2. 菜单栏选择：`发行` -> `原生App-云打包`。
3. 选择 `Android`。
4. **证书配置**:
   - 使用自有证书（推荐）：需提供 `.keystore` 或 `.jks` 文件及密码。
   - 使用公共测试证书（仅供测试）。
5. 点击 `打包`，等待构建完成后下载 APK。

### iOS
1. 菜单栏选择：`发行` -> `原生App-云打包`。
2. 选择 `iOS`。
3. **证书配置**:
   - 需要苹果开发者账号生成的 `p12` 证书和 `.mobileprovision` 描述文件。
   - 支持 `使用苹果证书` 或 `企业证书`。
4. 点击 `打包`，等待构建完成后下载 IPA。

---

## 3. 环境变量与配置

### 后端 API
确保 `src/App.vue` 中的 `apiUrl` 指向正式环境：
```javascript
globalData: {
  apiUrl: 'http://47.92.96.143:3000', // 生产环境地址
}
```

### 权限说明 (Android)
在 `manifest.json` 中已配置核心权限：
- 网络访问 (`ACCESS_NETWORK_STATE`, `INTERNET`)
- 振动反馈 (`VIBRATE`)
- 后台音频播放 (iOS 需要在 `manifest.json` 的 `ios` 节点追加 `UIBackgroundModes`)

---

## 4. 上架注意事项

1. **隐私政策**: 应用启动时必须弹出合规的隐私政策弹窗（可在 `manifest.json` 中配置 `privacy` 模块）。
2. **应用名称**: 确保 `manifest.json` 中的 `name` 与各商店申请名称一致。
3. **软著 (Android)**: 国内应用商店上架通常需要《计算机软件著作权登记证书》。

---

## 5. 版本更新逻辑

- 修改 `manifest.json` 中的 `versionName` (给用户看) 和 `versionCode` (给商店看, 需递增)。
- 打包后，通过后端接口分发热更新包 (wgt) 或 引导下载新版本 APK。
