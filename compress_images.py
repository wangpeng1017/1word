# -*- coding: utf-8 -*-
"""
@file compress_images.py
@desc 图片批量压缩脚本 (PNG→WebP)
@input word_images_final/*.png (2.1GB)
@output word_images_compressed/*.webp (~36MB)
@pos 数据处理工具，用于压缩词汇图片
⚠️ 更新我时，请同步更新本注释
"""

import os
from pathlib import Path
from PIL import Image
import time

# 配置
INPUT_DIR = Path(r'E:/trae/1word/word_images_final')
OUTPUT_DIR = Path(r'E:/trae/1word/word_images_compressed')
MAX_WIDTH = 600
WEBP_QUALITY = 75

def compress_image(input_path: Path, output_path: Path) -> tuple:
    """压缩单张图片，返回 (原大小, 新大小)"""
    try:
        original_size = input_path.stat().st_size

        with Image.open(input_path) as img:
            # 转换为 RGB（去除透明通道以减小体积）
            if img.mode in ('RGBA', 'P'):
                img = img.convert('RGB')

            # 等比例缩放
            if img.width > MAX_WIDTH:
                ratio = MAX_WIDTH / img.width
                new_height = int(img.height * ratio)
                img = img.resize((MAX_WIDTH, new_height), Image.LANCZOS)

            # 保存为 WebP
            img.save(output_path, 'WEBP', quality=WEBP_QUALITY, optimize=True)

        new_size = output_path.stat().st_size
        return original_size, new_size
    except Exception as e:
        print(f'  ❌ 错误: {input_path.name} - {e}')
        return 0, 0

def main():
    print('=' * 60)
    print('图片批量压缩工具')
    print('=' * 60)
    print(f'输入目录: {INPUT_DIR}')
    print(f'输出目录: {OUTPUT_DIR}')
    print(f'最大宽度: {MAX_WIDTH}px')
    print(f'WebP 质量: {WEBP_QUALITY}%')
    print('=' * 60)

    # 创建输出目录
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # 获取所有 PNG 文件
    png_files = list(INPUT_DIR.glob('*.png'))
    total = len(png_files)

    if total == 0:
        print('❌ 未找到 PNG 文件！')
        return

    print(f'\n找到 {total} 个 PNG 文件，开始压缩...\n')

    start_time = time.time()
    total_original = 0
    total_compressed = 0
    success_count = 0

    for i, png_path in enumerate(png_files, 1):
        # 输出文件名：abandon.png → abandon.webp
        webp_name = png_path.stem + '.webp'
        webp_path = OUTPUT_DIR / webp_name

        original_size, new_size = compress_image(png_path, webp_path)

        if new_size > 0:
            total_original += original_size
            total_compressed += new_size
            success_count += 1

            # 每 100 个显示进度
            if i % 100 == 0 or i == total:
                ratio = (1 - new_size / original_size) * 100 if original_size > 0 else 0
                print(f'[{i}/{total}] {png_path.name} → {webp_name} ({original_size//1024}KB → {new_size//1024}KB, -{ratio:.0f}%)')

    # 统计结果
    elapsed = time.time() - start_time
    print('\n' + '=' * 60)
    print('压缩完成！')
    print('=' * 60)
    print(f'成功处理: {success_count}/{total} 个文件')
    print(f'原始大小: {total_original / 1024 / 1024:.1f} MB')
    print(f'压缩后: {total_compressed / 1024 / 1024:.1f} MB')
    print(f'压缩率: {(1 - total_compressed / total_original) * 100:.1f}%')
    print(f'耗时: {elapsed:.1f} 秒')
    print(f'\n输出目录: {OUTPUT_DIR}')

if __name__ == '__main__':
    main()
