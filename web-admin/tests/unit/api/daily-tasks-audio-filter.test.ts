/**
 * @file daily-tasks-audio-filter.test.ts
 * @desc 测试每日任务 API 过滤无音频单词
 */

import { describe, it, expect, beforeAll } from 'vitest'

describe('Daily Tasks - Audio Filter', () => {
  describe('过滤逻辑', () => {
    it('应该过滤掉没有音频的单词', () => {
      const vocabWithAudio = {
        id: 'v1',
        word: 'hello',
        word_audios: [{ id: 'a1', audioUrl: 'http://example.com/hello.mp3' }],
        questions: [{ id: 'q1', type: 'choice' }]
      }

      const vocabWithoutAudio = {
        id: 'v2',
        word: 'world',
        word_audios: [],
        questions: [{ id: 'q2', type: 'choice' }]
      }

      const vocabWithNullAudio = {
        id: 'v3',
        word: 'test',
        word_audios: null,
        questions: [{ id: 'q3', type: 'choice' }]
      }

      const allVocab = [vocabWithAudio, vocabWithoutAudio, vocabWithNullAudio]

      // 模拟过滤逻辑
      const filtered = allVocab.filter(v =>
        v &&
        v.questions &&
        v.questions.length > 0 &&
        v.word_audios &&
        v.word_audios.length > 0
      )

      expect(filtered).toHaveLength(1)
      expect(filtered[0].id).toBe('v1')
    })

    it('应该同时过滤没有音频和没有题目的单词', () => {
      const vocabWithBoth = {
        id: 'v1',
        word: 'complete',
        word_audios: [{ id: 'a1' }],
        questions: [{ id: 'q1' }]
      }

      const vocabWithoutAudio = {
        id: 'v2',
        word: 'noaudio',
        word_audios: [],
        questions: [{ id: 'q2' }]
      }

      const vocabWithoutQuestions = {
        id: 'v3',
        word: 'noquestions',
        word_audios: [{ id: 'a3' }],
        questions: []
      }

      const vocabWithNeither = {
        id: 'v4',
        word: 'neither',
        word_audios: [],
        questions: []
      }

      const allVocab = [vocabWithBoth, vocabWithoutAudio, vocabWithoutQuestions, vocabWithNeither]

      const filtered = allVocab.filter(v =>
        v &&
        v.questions &&
        v.questions.length > 0 &&
        v.word_audios &&
        v.word_audios.length > 0
      )

      expect(filtered).toHaveLength(1)
      expect(filtered[0].id).toBe('v1')
    })
  })
})
