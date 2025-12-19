const fs = require('fs');
const path = require('path');

// 修复 test.wxss - 下一题按钮居中
function fixWxss() {
  const filePath = path.join(__dirname, '../../wechat-miniapp/pages/test/test.wxss');
  let content = fs.readFileSync(filePath, 'utf8');

  // 修复按钮居中
  const oldBtn = `.btn-next {
  width: 100%;
  margin: 0 32rpx;
  background: linear-gradient(135deg, #FF7A7A 0%, #FF5A5A 100%);
  color: #FFFFFF;
}`;

  const newBtn = `.btn-next {
  width: calc(100% - 64rpx);
  margin: 0 auto;
  display: block;
  background: linear-gradient(135deg, #FF7A7A 0%, #FF5A5A 100%);
  color: #FFFFFF;
}`;

  content = content.replace(oldBtn, newBtn);

  // 添加正确/错误提示样式
  const additionalStyles = `

/* 答题反馈 */
.feedback-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.feedback-card {
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 60rpx 40rpx;
  text-align: center;
  width: 80%;
  max-width: 600rpx;
}

.feedback-icon {
  font-size: 120rpx;
  margin-bottom: 24rpx;
}

.feedback-text {
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 16rpx;
}

.feedback-correct {
  color: #10B981;
}

.feedback-wrong {
  color: #EF4444;
}

.feedback-answer {
  font-size: 28rpx;
  color: #6B7280;
  margin-bottom: 32rpx;
}

.option.correct {
  background: #D1FAE5;
  border-color: #10B981;
  color: #10B981;
}

.option.wrong {
  background: #FEE2E2;
  border-color: #EF4444;
  color: #EF4444;
}

/* 听力题喇叭图标 */
.listening-icon {
  width: 120rpx;
  height: 120rpx;
  background: linear-gradient(135deg, #FF7A7A 0%, #FF5A5A 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 32rpx;
}

.listening-icon text {
  font-size: 60rpx;
  color: #FFFFFF;
}
`;

  if (!content.includes('.feedback-overlay')) {
    content += additionalStyles;
  }

  fs.writeFileSync(filePath, content);
  console.log('✅ test.wxss 已修复');
}

// 修复 test.wxml
function fixWxml() {
  const filePath = path.join(__dirname, '../../wechat-miniapp/pages/test/test.wxml');
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. 修复听力题显示喇叭而非单词
  const oldQuestionContent = `<view class="question-content">{{currentQuestion.content}}</view>`;
  const newQuestionContent = `<!-- 听力题显示喇叭图标 -->
        <block wx:if="{{currentQuestion.type === 'LISTENING'}}">
          <view class="listening-icon" bindtap="playAudio">
            <text>🔊</text>
          </view>
          <view class="question-content" style="text-align:center;">点击播放发音，选择正确的单词</view>
        </block>
        <block wx:else>
          <view class="question-content">{{currentQuestion.content}}</view>
        </block>`;
  content = content.replace(oldQuestionContent, newQuestionContent);

  // 2. 修复填空题改为选择题
  const oldFillBlank = `<!-- 填空题输入框 -->
        <view class="fill-blank" wx:if="{{currentQuestion.type === 'FILL_IN_BLANK'}}">
          <input
            class="fill-input"
            placeholder="请输入答案"
            value="{{fillAnswer}}"
            bindinput="onFillInput"
          />
        </view>`;
  const newFillBlank = `<!-- 填空题也使用选择题形式 -->`;
  content = content.replace(oldFillBlank, newFillBlank);

  // 3. 修改选项显示，添加正确/错误状态
  const oldOptions = `<!-- 选择题选项 -->
        <view class="options" wx:if="{{currentQuestion.type !== 'FILL_IN_BLANK'}}">
          <view
            class="option {{selectedAnswer === item.content ? 'selected' : ''}}"
            wx:for="{{currentQuestion.options}}"
            wx:key="id"
            bindtap="selectOption"
            data-answer="{{item.content}}"
          >
            <text>{{item.content}}</text>
          </view>
        </view>`;
  const newOptions = `<!-- 选择题选项（包括填空题也用选择形式） -->
        <view class="options">
          <view
            class="option {{selectedAnswer === item.content ? 'selected' : ''}} {{showFeedback && item.content === correctAnswer ? 'correct' : ''}} {{showFeedback && selectedAnswer === item.content && !isCurrentCorrect ? 'wrong' : ''}}"
            wx:for="{{currentQuestion.options}}"
            wx:key="id"
            bindtap="selectOption"
            data-answer="{{item.content}}"
          >
            <text>{{item.content}}</text>
          </view>
        </view>`;
  content = content.replace(oldOptions, newOptions);

  // 4. 添加正确/错误反馈弹窗
  const feedbackHtml = `
      <!-- 答题反馈 -->
      <view class="feedback-overlay" wx:if="{{showFeedback}}">
        <view class="feedback-card">
          <view class="feedback-icon">{{isCurrentCorrect ? '✅' : '❌'}}</view>
          <view class="feedback-text {{isCurrentCorrect ? 'feedback-correct' : 'feedback-wrong'}}">
            {{isCurrentCorrect ? '回答正确！' : '回答错误'}}
          </view>
          <view class="feedback-answer" wx:if="{{!isCurrentCorrect}}">
            正确答案：{{correctAnswer}}
          </view>
          <button class="btn-primary" style="width:60%;margin:0 auto;" bindtap="continuNext">继续</button>
        </view>
      </view>
`;

  // 在 </view> 结束前插入反馈弹窗
  const insertPoint = `      <button class="btn-next" bindtap="nextQuestion" disabled="{{!canNext}}">`;
  content = content.replace(insertPoint, feedbackHtml + '\n      ' + insertPoint);

  // 5. 移除查看详情按钮
  const oldResultActions = `<view class="actions">
        <button class="btn-secondary" bindtap="backToList">返回列表</button>
        <button class="btn-primary" bindtap="viewDetails">查看详情</button>
      </view>`;
  const newResultActions = `<view class="actions" style="justify-content:center;">
        <button class="btn-primary" style="flex:none;width:60%;" bindtap="backToList">返回列表</button>
      </view>`;
  content = content.replace(oldResultActions, newResultActions);

  fs.writeFileSync(filePath, content);
  console.log('✅ test.wxml 已修复');
}

// 修复 test.js
function fixJs() {
  const filePath = path.join(__dirname, '../../wechat-miniapp/pages/test/test.js');
  let content = fs.readFileSync(filePath, 'utf8');

  // 添加新的data字段
  const oldData = `canNext: false,`;
  const newData = `canNext: false,
    showFeedback: false,
    isCurrentCorrect: false,
    correctAnswer: '',`;
  content = content.replace(oldData, newData);

  // 修改loadQuestion，重置反馈状态
  const oldLoadQuestion = `this.setData({
      currentQuestion: question,
      currentIndex: index,
      selectedAnswer: '',
      fillAnswer: '',
      canNext: false,
      questionTypeText: typeMap[question.type] || '选择题',
      progressPercent: Math.round(((index + 1) / this.data.questions.length) * 100),
    })`;
  const newLoadQuestion = `this.setData({
      currentQuestion: question,
      currentIndex: index,
      selectedAnswer: '',
      fillAnswer: '',
      canNext: false,
      showFeedback: false,
      isCurrentCorrect: false,
      correctAnswer: '',
      questionTypeText: typeMap[question.type] || '选择题',
      progressPercent: Math.round(((index + 1) / this.data.questions.length) * 100),
    })`;
  content = content.replace(oldLoadQuestion, newLoadQuestion);

  // 修改nextQuestion，先显示反馈再继续
  const oldNextQuestion = `// 下一题
  async nextQuestion() {
    const { currentQuestion, selectedAnswer, fillAnswer, currentIndex, questions } = this.data

    // 记录答案
    const answer = currentQuestion.type === 'FILL_IN_BLANK' ? fillAnswer : selectedAnswer

    // 获取正确答案（需要从后端获取）
    const isCorrect = await this.checkAnswer(currentQuestion.questionId, answer)

    this.data.answers.push({
      vocabularyId: currentQuestion.vocabularyId,
      questionId: currentQuestion.questionId,
      answer,
      isCorrect,
    })

    // 判断是否是最后一题
    if (currentIndex < questions.length - 1) {
      // 加载下一题
      this.loadQuestion(currentIndex + 1)
    } else {
      // 提交测试
      this.submitTest()
    }
  },`;

  const newNextQuestion = `// 下一题
  async nextQuestion() {
    const { currentQuestion, selectedAnswer, currentIndex, questions } = this.data

    // 记录答案
    const answer = selectedAnswer

    // 获取正确答案
    const { isCorrect, correctAnswer } = await this.checkAnswerWithCorrect(currentQuestion.questionId, answer)

    this.data.answers.push({
      vocabularyId: currentQuestion.vocabularyId,
      questionId: currentQuestion.questionId,
      answer,
      isCorrect,
    })

    // 显示反馈
    this.setData({
      showFeedback: true,
      isCurrentCorrect: isCorrect,
      correctAnswer: correctAnswer,
      canNext: false,
    })
  },

  // 继续下一题
  continuNext() {
    const { currentIndex, questions } = this.data

    this.setData({ showFeedback: false })

    // 判断是否是最后一题
    if (currentIndex < questions.length - 1) {
      this.loadQuestion(currentIndex + 1)
    } else {
      this.submitTest()
    }
  },`;
  content = content.replace(oldNextQuestion, newNextQuestion);

  // 修改checkAnswer，返回正确答案
  const oldCheckAnswer = `// 检查答案（简化版，实际应该在提交时由后端统一判断）
  async checkAnswer(questionId, answer) {
    try {
      const question = await get(\`/questions/\${questionId}\`)
      const correctAnswer = question.correctAnswer
      return answer.toLowerCase().trim() === correctAnswer.toLowerCase().trim()
    } catch (error) {
      console.error('检查答案失败:', error)
      return false
    }
  },`;

  const newCheckAnswer = `// 检查答案并返回正确答案
  async checkAnswerWithCorrect(questionId, answer) {
    try {
      const question = await get(\`/questions/\${questionId}\`)
      const correctAnswer = question.correctAnswer
      const isCorrect = answer.toLowerCase().trim() === correctAnswer.toLowerCase().trim()
      return { isCorrect, correctAnswer }
    } catch (error) {
      console.error('检查答案失败:', error)
      return { isCorrect: false, correctAnswer: '' }
    }
  },`;
  content = content.replace(oldCheckAnswer, newCheckAnswer);

  fs.writeFileSync(filePath, content);
  console.log('✅ test.js 已修复');
}

console.log('开始修复词汇熟练度测试页面...\n');
fixWxss();
fixWxml();
fixJs();
console.log('\n修复完成！');
