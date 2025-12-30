# -*- coding: utf-8 -*-
import os
import json
import subprocess
from PIL import Image

# 配置
SOURCE_DIR = r'E:/trae/1word/word_images_final'
OUTPUT_DIR = r'E:/trae/1word/_compressed_r_images'
MAPPING_FILE = r'E:/trae/1word/word_image_mapping_final.json'

# 创建输出目录
os.makedirs(OUTPUT_DIR, exist_ok=True)

# 读取映射文件
with open(MAPPING_FILE, 'r', encoding='utf-8') as f:
    mappings = json.load(f)

# 筛选R开头的单词
r_words = [m for m in mappings if m['word'].lower().startswith('r')]
print(f"找到 {len(r_words)} 个R开头的单词")

# 压缩图片
compressed = 0
for item in r_words:
    word = item['word']
    src_file = os.path.join(SOURCE_DIR, item['image'])
    dst_file = os.path.join(OUTPUT_DIR, f"{word}.jpg")

    if not os.path.exists(src_file):
        print(f"Skip: {word} (文件不存在)")
        continue

    try:
        img = Image.open(src_file)
        # 转换为RGB（去除透明通道）
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')
        # 调整大小（最大200x200）
        img.thumbnail((200, 200), Image.Resampling.LANCZOS)
        # 保存为JPEG，质量80%
        img.save(dst_file, 'JPEG', quality=80, optimize=True)
        compressed += 1
    except Exception as e:
        print(f"Error {word}: {e}")

print(f"压缩完成: {compressed} 张图片")
print(f"输出目录: {OUTPUT_DIR}")
