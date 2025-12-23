/**
 * 测试Google TTS API
 */

const getAudioUrl = require('google-tts-api').default || require('google-tts-api')

async function testTTS() {
    try {
        console.log('测试 Google TTS API...\n')

        const word = 'hello'
        console.log(`测试单词: ${word}`)

        // 测试美式发音
        console.log('\n1. 测试美式发音 (en-US):')
        const usUrl = getAudioUrl(word, 'en-US', 1)
        console.log(`   URL: ${usUrl}`)
        console.log(`   类型: ${typeof usUrl}`)

        // 测试英式发音
        console.log('\n2. 测试英式发音 (en-GB):')
        const ukUrl = getAudioUrl(word, 'en-GB', 1)
        console.log(`   URL: ${ukUrl}`)
        console.log(`   类型: ${typeof ukUrl}`)

        console.log('\n✓ 测试完成')

    } catch (error) {
        console.error('\n✗ 测试失败:', error)
    }
}

testTTS()
