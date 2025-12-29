// pages/matching-game/matching-game.js
// @input: 从 study.js 跳转传入的 words 数组 [{id, word, meaning}]
// @output: 完成配对后返回 study 页面继续学习
// @pos: 学习流程中的调剂小游戏，每20题触发一次

Page({
  data: {
    words: [],           // 原始单词数据
    leftItems: [],       // 左侧中文列表（打乱）
    rightItems: [],      // 右侧英文列表（打乱）
    leftSelected: null,  // 左侧选中索引
    rightSelected: null, // 右侧选中索引
    matchedIds: [],      // 已配对成功的 id 列表
    showResult: false,   // 是否显示结果
    isCorrect: false,    // 当前配对是否正确
    showComplete: false, // 是否显示完成弹窗
    progress: 0,         // 进度百分比
    canCheck: false,     // 是否可以检查
  },

  onLoad(options) {
    if (options.words) {
      try {
        const words = JSON.parse(decodeURIComponent(options.words))
        this.initGame(words)
      } catch (e) {
        console.error('解析单词数据失败:', e)
        wx.showToast({ title: '加载失败', icon: 'error' })
        setTimeout(() => wx.navigateBack(), 1500)
      }
    } else {
      wx.showToast({ title: '缺少单词数据', icon: 'error' })
      setTimeout(() => wx.navigateBack(), 1500)
    }
  },

  // 初始化游戏
  initGame(words) {
    // 打乱左侧（中文）顺序
    const leftItems = this.shuffle(words.map(w => ({
      id: w.id,
      meaning: w.meaning,
      matched: false
    })))

    // 打乱右侧（英文）顺序
    const rightItems = this.shuffle(words.map(w => ({
      id: w.id,
      word: w.word,
      matched: false
    })))

    this.setData({
      words,
      leftItems,
      rightItems,
      progress: 0
    })
  },

  // 数组打乱（Fisher-Yates 洗牌算法）
  shuffle(array) {
    const result = [...array]
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[result[i], result[j]] = [result[j], result[i]]
    }
    return result
  },

  // 卡片点击
  onCardTap(e) {
    if (this.data.showResult) return

    const { index, side } = e.currentTarget.dataset
    const items = side === 'left' ? this.data.leftItems : this.data.rightItems

    // 已配对的卡片不可点击
    if (items[index].matched) return

    if (side === 'left') {
      // 点击左侧
      const newSelected = this.data.leftSelected === index ? null : index
      this.setData({
        leftSelected: newSelected,
        canCheck: newSelected !== null && this.data.rightSelected !== null
      })
    } else {
      // 点击右侧
      const newSelected = this.data.rightSelected === index ? null : index
      this.setData({
        rightSelected: newSelected,
        canCheck: this.data.leftSelected !== null && newSelected !== null
      })
    }
  },

  // 检查配对
  onCheck() {
    const { leftItems, rightItems, leftSelected, rightSelected, matchedIds, words } = this.data

    if (leftSelected === null || rightSelected === null) return

    const leftItem = leftItems[leftSelected]
    const rightItem = rightItems[rightSelected]

    // 检查是否匹配（id 相同）
    const isCorrect = leftItem.id === rightItem.id

    if (isCorrect) {
      // 配对成功
      const newMatchedIds = [...matchedIds, leftItem.id]
      const newLeftItems = leftItems.map(item =>
        item.id === leftItem.id ? { ...item, matched: true } : item
      )
      const newRightItems = rightItems.map(item =>
        item.id === rightItem.id ? { ...item, matched: true } : item
      )

      const progress = Math.round((newMatchedIds.length / words.length) * 100)

      this.setData({
        leftItems: newLeftItems,
        rightItems: newRightItems,
        matchedIds: newMatchedIds,
        leftSelected: null,
        rightSelected: null,
        canCheck: false,
        showResult: true,
        isCorrect: true,
        progress
      })

      // 正确时自动关闭反馈并检查是否完成
      setTimeout(() => {
        this.setData({ showResult: false })

        // 检查是否全部完成
        if (newMatchedIds.length === words.length) {
          setTimeout(() => {
            this.setData({ showComplete: true })
          }, 300)
        }
      }, 800)
    } else {
      // 配对失败
      this.setData({
        showResult: true,
        isCorrect: false
      })
    }
  },

  // 关闭错误反馈
  onDismissResult() {
    this.setData({
      showResult: false,
      leftSelected: null,
      rightSelected: null,
      canCheck: false
    })
  },

  // 完成游戏，返回学习页面
  onComplete() {
    wx.navigateBack()
  },

  // 关闭游戏（不允许跳过，弹出提示）
  onClose() {
    wx.showModal({
      title: '提示',
      content: '完成配对后才能继续学习哦~',
      showCancel: false,
      confirmText: '继续游戏'
    })
  }
})
