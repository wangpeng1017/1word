# -*- coding: utf-8 -*-
"""
@file fetch_phonetics.py
@desc 批量获取缺失的音标 (Free Dictionary API)
@input missing_phonetic_words.txt
@output phonetics_update.sql
@pos 数据处理工具，用于补充缺失的词汇音标
⚠️ 更新我时，请同步更新本注释
"""

import asyncio
import aiohttp
from pathlib import Path
import time

WORDS_FILE = Path(r'C:/Users/peng.n.wang/AppData/Local/Temp/missing_phonetic_words.txt')
DICT_API = "https://api.dictionaryapi.dev/api/v2/entries/en/{word}"
OUTPUT_FILE = Path(r'C:/Users/peng.n.wang/AppData/Local/Temp/phonetics_update.sql')

async def fetch_phonetic(session: aiohttp.ClientSession, word: str) -> str | None:
    """从 Free Dictionary API 获取音标"""
    try:
        url = DICT_API.format(word=word)
        async with session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as resp:
            if resp.status != 200:
                return None
            data = await resp.json()
            for entry in data:
                # 优先获取带音标文本的
                for phonetic in entry.get('phonetics', []):
                    text = phonetic.get('text', '')
                    if text:
                        return text
                # 备选：顶层 phonetic 字段
                if entry.get('phonetic'):
                    return entry['phonetic']
            return None
    except Exception:
        return None

async def main():
    print('=' * 60)
    print('批量获取音标')
    print('=' * 60)

    words = [w.strip() for w in WORDS_FILE.read_text(encoding='utf-8').splitlines() if w.strip()]
    total = len(words)
    print(f'找到 {total} 个单词\n')

    start_time = time.time()
    found = 0
    not_found = 0
    results = []

    async with aiohttp.ClientSession() as session:
        for i, word in enumerate(words, 1):
            phonetic = await fetch_phonetic(session, word)

            if phonetic:
                found += 1
                # 转义单引号
                safe_phonetic = phonetic.replace("'", "''")
                results.append(f"UPDATE vocabularies SET phonetic = '{safe_phonetic}' WHERE word = '{word}';")
            else:
                not_found += 1

            if i % 50 == 0 or i == total:
                print(f'[{i}/{total}] 找到: {found}, 未找到: {not_found}')

            await asyncio.sleep(0.15)

    # 生成 SQL 文件
    OUTPUT_FILE.write_text('\n'.join(results), encoding='utf-8')

    elapsed = time.time() - start_time
    print('\n' + '=' * 60)
    print('完成！')
    print('=' * 60)
    print(f'找到音标: {found}')
    print(f'未找到: {not_found}')
    print(f'耗时: {elapsed:.1f} 秒')
    print(f'\nSQL 文件: {OUTPUT_FILE}')

if __name__ == '__main__':
    asyncio.run(main())
