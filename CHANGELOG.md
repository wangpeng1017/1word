# Changelog

## [1.0.8] - 2026-03-10

### Added
- **Scripts**: 增加用于解析 Excel 并生成复习计划的辅助脚本（`gen_schedule.py`, `read-excel-tmp.js`, `tmp-parse-excel.js`）。

## [1.0.7] - 2026-02-27

### Fixed
- **导出学习报告500错误**: 修复`Content-Disposition`头中"学习报告"等中文字符未编码导致`ByteString`转换失败（Unicode码点>255）。整个文件名改用`encodeURIComponent`编码 + RFC 5987 `filename*`格式。
- **学生详情页KPI全为0**: 学习词汇、已掌握、学习天数三个统计值原为硬编码`0`，现从`word_masteries`和`study_records`表实时查询。

## [1.0.6] - 2026-02-20

### Added
- **复习可重复学习**: 已完成的 Day（⭐️）可点击"重新学习"按钮再次进入学习。Day1 也可点击学习当天新词。完成一次即亮星星，不阻断后续重复进入。
  - 后端 `daily-tasks` API 支持 `repeat` 参数（重复学习时加载复习词并跳过已学过滤）
  - 后端 `study-sessions` API 支持 `allowRepeat` 参数（重复学习时不阻断已完成会话）
  - 后端 `study-days` API 新增 `newWordsCount` 返回字段
  - 前端 `index.js` handleDayClick 的 completed 分支增加"重新学习"入口

### Fixed
- **missed Day 永远无法完成**: 没有新词可补的 missed Day（如纯复习日）自动标记为 completed（⭐️），避免永远卡在 ❗️ 状态。

## [1.0.5] - 2026-02-19

### Fixed
- **学习类型"未知"Bug**: 修复`complete/route.ts`中session_id解析循环未加first-match保护，随机后缀以`m`开头时（概率~2.8%）会覆盖真实mode值，导致status设为`COMPLETED`而非`COMPLETED_NEW`/`COMPLETED_REVIEW`，最终显示为"未知"。
- **类型推断正则**: `learning-sessions/route.ts`兜底正则从`/_m([^_]+)/`改为只匹配已知mode值（new/review/unknown/all/retest），避免匹配到随机后缀。
- **UUID格式记录兜底**: 无法从ID解析mode的学习记录（如`/study-records`路由创建的UUID格式记录），默认归类为"新学"而非"未知"。
- **小程序 Storage 1MB 超限**: `storage.js`新增`slimTasks`精简存储（只保留id/vocabularyId/isNew/selectedQuestionId）+ `safeSetStorage` try-catch防护，恢复进度时从API重新拉取完整数据。彻底覆盖900词极端场景。

## [1.0.4] - 2026-02-12

### Added
- **管理后台-学习类型列**: 学习数据页新增"类型"列，显示新学/复习(DayX)/错题/未知。支持按类型筛选和Excel导出。
- **小程序-day参数**: `createSession`新增`day`参数传递，session ID中记录复习Day编号，解决复习完成后⭐星星不显示的问题。

### Fixed
- **completedAt显示**: 修复`COMPLETED_NEW`/`COMPLETED_REVIEW`状态记录结束时间被错误置空的问题。
- **错题本limit**: 错题本和错题重测查询limit从100扩展到300（小程序待发版）。

### Changed
- **Storage优化**: 后端`mapTasksForMiniapp`只返回1个question（已部署），大幅减少小程序存储占用。

## [1.0.3] - 2026-02-11

### Fixed
- **LISTENING题泄漏**: 彻底修复听音频选词题仍出现在今日学习、复习和错题本中的问题。
  - `selectQuestionByType` fallback 选题排除 LISTENING 类型
  - `mapTasksForMiniapp` 过滤 questions 数组中的 LISTENING 题
  - 错题本 API 排除 LISTENING 类型的错题
- **错题本答案显示**: 修复错题本中"你的答案"始终显示"答错了"的问题。
  - `study.js` 提交答题时保存选项实际文字内容（而非洗牌后位置标签 A/B/C/D）
  - 错题本 API 优先显示实际选项内容，老数据（仅位置标签）回退为"答错了"

## [1.0.2] - 2026-02-08

### Fixed
- **Timeline状态Bug**: 修复"今日复习"页面中过去的Day全部显示为"已完成"的问题。利用现有`study_records.status`字段区分学习模式(`COMPLETED_NEW`/`COMPLETED_REVIEW`)，timeline仅按复习完成记录判断Day状态。无需数据库Schema改动。
- **复习结果弹窗数据错误**: 修复完成学习后弹窗显示旧session数据的问题。`result.js`不再用服务器汇总数据覆盖当次学习的URL参数；`review-plan`API改为`findMany`汇总全天所有记录。
- **学习历史正确率偏低**: 正确率分母从`totalWords`改为`correctCount+wrongCount`(实际答题数)。涉及`study-history.js`和`study-history.wxml`。
- **Day弹窗用时始终00:00**: `study-days`API返回的`totalTime`从硬编码0改为从`study_records`获取实际用时。

### Changed
- **学习记录模式标记**: `study.js`提交答题记录时传递`mode`参数，`study-records`和`study-sessions/complete`根据mode写入不同status值，实现今日学习和今日复习的完成状态独立判断。



### Added
- **Testing**: Added reproduction scripts `reproduce-session-bug.ts` and `reproduce-time.ts`.
- **Scripts**: Added data restoration and integrity check scripts (`restore-data.sql`, `check-abandon-question.js`, `check-basin-question.js`).
- **Assets**: Added review icons to Mini-App (`review.png`, `review-active.png`).

### Fixed
- **Study Progress**: Fixed issue where progress was lost/reset by saving full task list and trusting local storage.
- **Make-up Logic**: Make-up tasks now auto-resume silently if progress exists.
- **Vocabulary Test**: Added sound effects for correct/wrong answers, streaks, and completion.
- **Home Page**: Fixed white screen on startup by ensuring `today-learn` page configuration exists.
- **UX**: Moved welcome animation to the first tab ("Today's Learn") for correct startup experience.

## [1.0.0] - 2026-02-06

### Added
- **Mini-App**: **4-Tab Architecture** - Split "Today's Review" into "Today's Learn" (New Words) and "Review" (Timeline).
- **Mini-App**: **Make-up Learning** - Users can click on "Missed" days in timeline to learn *only* the new words from that day.
- **Mini-App**: **UX Enhancements** - Implemented option shuffling to prevent position memorization. Added "Streak-3" sound effect.
- **Mini-App**: Added 3D-style emoji icons (⭐️, 📖, 🔒) to Home Page timeline nodes.
- **Mini-App**: Added haptic feedback to audio playback button.
- **Web-Admin**: **Local Audio Hosting** - Downloaded all sound effects to local server to avoid network issues with external URLs.
- **Web-Admin**: **API Update** - `daily-tasks` now supports `day` parameter for make-up learning and auto-filters review words in this mode.
- **Web-Admin**: **Student Management** - Enforced phone number requirement in "Add Student" form to match backend validation.
- **Web-Admin**: **Class Management** - Added uniqueness check for class names to prevent duplicates.

### Changed
- **Mini-App**: Reduced delay after correct answer in "Listen and Choose" mode (1.5s -> 0.8s) for faster pacing.
- **Web-Admin**: Updated `download-word-audios.ts` script to use correct `public` path and include robustness checks for "upheaval".
- **Web-Admin**: Switched to dynamic import for `p-limit` in audio script to resolve ESM/CommonJS compatibility issues on server.
