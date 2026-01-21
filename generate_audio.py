# -*- coding: utf-8 -*-
"""
批量获取单词音频
优先使用 Free Dictionary API 获取真人发音
备选使用 Edge TTS 生成
"""

import asyncio
import aiohttp
import edge_tts
from pathlib import Path
import time
import json

# 配置
WORDS_FILE = Path(r'C:/Users/peng.n.wang/AppData/Local/Temp/missing_audio_words.txt')
OUTPUT_DIR = Path(r'E:/trae/1word/word_audios')
VOICE = "en-US-JennyNeural"  # TTS 备选语音

# Free Dictionary API
DICT_API = "https://api.dictionaryapi.dev/api/v2/entries/en/{word}"

async def fetch_dict_audio(session: aiohttp.ClientSession, word: str) -> str | None:
    """从 Free Dictionary API 获取音频 URL"""
    try:
        url = DICT_API.format(word=word)
        async with session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as resp:
            if resp.status != 200:
                return None
            data = await resp.json()
            # 查找音频 URL
            for entry in data:
                for phonetic in entry.get('phonetics', []):
                    audio_url = phonetic.get('audio', '')
                    if audio_url and audio_url.endswith('.mp3'):
                        return audio_url
            return None
    except Exception:
        return None

async def download_audio(session: aiohttp.ClientSession, url: str, output_path: Path) -> bool:
    """下载音频文件"""
    try:
        async with session.get(url, timeout=aiohttp.ClientTimeout(total=30)) as resp:
            if resp.status == 200:
                content = await resp.read()
                output_path.write_bytes(content)
                return True
    except Exception:
        pass
    return False

async def generate_tts(word: str, output_path: Path) -> bool:
    """使用 Edge TTS 生成音频（备选）"""
    try:
        communicate = edge_tts.Communicate(word, VOICE)
        await communicate.save(str(output_path))
        return True
    except Exception:
        return False

async def process_word(session: aiohttp.ClientSession, word: str, output_path: Path) -> tuple[bool, str]:
    """处理单个单词，返回 (成功, 来源)"""
    # 1. 尝试从词典 API 获取
    audio_url = await fetch_dict_audio(session, word)
    if audio_url:
        if await download_audio(session, audio_url, output_path):
            return True, 'dict'

    # 2. 备选：使用 TTS
    if await generate_tts(word, output_path):
        return True, 'tts'

    return False, 'failed'

async def main():
    print('=' * 60)
    print('批量获取单词音频')
    print('=' * 60)
    print(f'单词列表: {WORDS_FILE}')
    print(f'输出目录: {OUTPUT_DIR}')
    print('优先: Free Dictionary API (真人发音)')
    print('备选: Edge TTS (AI合成)')
    print('=' * 60)

    # 创建输出目录
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # 读取单词列表
    words = [w.strip() for w in WORDS_FILE.read_text(encoding='utf-8').splitlines() if w.strip()]
    total = len(words)
    print(f'\n找到 {total} 个单词\n')

    start_time = time.time()
    stats = {'dict': 0, 'tts': 0, 'skip': 0, 'failed': 0}

    async with aiohttp.ClientSession() as session:
        for i, word in enumerate(words, 1):
            output_path = OUTPUT_DIR / f"{word}.mp3"

            # 跳过已存在的
            if output_path.exists():
                stats['skip'] += 1
                continue

            success, source = await process_word(session, word, output_path)

            if success:
                stats[source] += 1
            else:
                stats['failed'] += 1
                print(f'  ❌ {word}')

            # 每 50 个显示进度
            if i % 50 == 0 or i == total:
                print(f'[{i}/{total}] 词典: {stats["dict"]}, TTS: {stats["tts"]}, 跳过: {stats["skip"]}, 失败: {stats["failed"]}')

            # 延迟避免请求过快
            await asyncio.sleep(0.2)

    elapsed = time.time() - start_time
    print('\n' + '=' * 60)
    print('完成！')
    print('=' * 60)
    print(f'从词典下载: {stats["dict"]} (真人发音)')
    print(f'TTS 生成: {stats["tts"]} (AI合成)')
    print(f'已存在跳过: {stats["skip"]}')
    print(f'失败: {stats["failed"]}')
    print(f'耗时: {elapsed:.1f} 秒')
    print(f'\n输出目录: {OUTPUT_DIR}')

if __name__ == '__main__':
    asyncio.run(main())
