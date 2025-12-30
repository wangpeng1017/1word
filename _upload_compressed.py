# -*- coding: utf-8 -*-
"""
批量上传图片到 Vercel Blob - 带重试和延迟
"""

import os
import json
import requests
import time
from datetime import datetime
import uuid
from PIL import Image
import io

# Vercel Blob 配置
BLOB_TOKEN = "vercel_blob_rw_AUL5HsnQWN21BR8h_YbxChFzoaGO9Lb16sDGUYq3rCEVWKy"
BLOB_API_URL = "https://blob.vercel-storage.com"

# 图片目录
IMAGE_DIR = r"E:/trae/1word/word_images_final"
VOCAB_JSON = r"E:/trae/1word/2000词完整数据_final.json"
PROGRESS_FILE = r"E:/trae/1word/_upload_progress.json"
SQL_FILE = r"E:/trae/1word/_import_images.sql"

# 压缩配置
MAX_WIDTH = 800
MAX_HEIGHT = 800
JPEG_QUALITY = 85

# 重试配置
MAX_RETRIES = 3
RETRY_DELAY = 5  # 秒
UPLOAD_DELAY = 0.3  # 每次上传间隔

def generate_id(prefix):
    timestamp = int(datetime.now().timestamp() * 1000)
    random_str = uuid.uuid4().hex[:9]
    return f"{prefix}_{timestamp}_{random_str}"

def compress_image(image_path):
    try:
        with Image.open(image_path) as img:
            if img.mode in ('RGBA', 'P'):
                img = img.convert('RGB')
            width, height = img.size
            if width > MAX_WIDTH or height > MAX_HEIGHT:
                ratio = min(MAX_WIDTH / width, MAX_HEIGHT / height)
                new_size = (int(width * ratio), int(height * ratio))
                img = img.resize(new_size, Image.LANCZOS)
            buffer = io.BytesIO()
            img.save(buffer, format='JPEG', quality=JPEG_QUALITY, optimize=True)
            return buffer.getvalue()
    except Exception as e:
        print(f"压缩错误: {e}")
        return None

def upload_to_vercel_blob(image_data, filename, retries=MAX_RETRIES):
    for attempt in range(retries):
        try:
            headers = {
                'Authorization': f'Bearer {BLOB_TOKEN}',
                'x-api-version': '4',
                'Content-Type': 'image/jpeg',
            }
            jpg_filename = os.path.splitext(filename)[0] + '.jpg'
            pathname = f"vocabulary-images/{jpg_filename}"
            url = f"{BLOB_API_URL}/{pathname}"

            response = requests.put(url, headers=headers, data=image_data, timeout=60)

            if response.status_code == 200:
                result = response.json()
                return result.get('url')
            elif response.status_code == 403:
                if attempt < retries - 1:
                    wait_time = RETRY_DELAY * (attempt + 1)
                    print(f"限流，等待 {wait_time}s...", end=" ", flush=True)
                    time.sleep(wait_time)
                else:
                    return None
            else:
                print(f"错误 {response.status_code}", end=" ")
                return None
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(RETRY_DELAY)
            else:
                print(f"异常: {e}", end=" ")
                return None
    return None

def escape_sql(s):
    if s is None:
        return 'NULL'
    return "'" + s.replace("'", "''") + "'"

def load_progress():
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {'uploaded': {}, 'errors': []}

def save_progress(progress):
    with open(PROGRESS_FILE, 'w', encoding='utf-8') as f:
        json.dump(progress, f, ensure_ascii=False, indent=2)

def main():
    with open(VOCAB_JSON, 'r', encoding='utf-8') as f:
        all_words = json.load(f)

    word_to_image = {}
    for item in all_words:
        word = item['word'].lower().strip()
        image = item.get('image', '')
        if image:
            word_to_image[word] = image

    words_to_process = [w for w in word_to_image.keys() if not w.startswith('r')]
    print(f"需要处理的单词数: {len(words_to_process)}")

    progress = load_progress()
    uploaded = progress['uploaded']
    # 清除之前的错误列表，重新尝试
    progress['errors'] = []
    print(f"已上传: {len(uploaded)}")

    success_count = len(uploaded)
    error_count = 0
    consecutive_errors = 0

    for i, word in enumerate(words_to_process):
        if word in uploaded:
            continue

        image_filename = word_to_image.get(word)
        if not image_filename:
            continue

        image_path = os.path.join(IMAGE_DIR, image_filename)
        if not os.path.exists(image_path):
            continue

        original_size = os.path.getsize(image_path)
        print(f"[{i+1}/{len(words_to_process)}] {word} ({original_size//1024}KB)...", end=" ", flush=True)

        compressed_data = compress_image(image_path)
        if not compressed_data:
            error_count += 1
            print("压缩失败")
            continue

        compressed_size = len(compressed_data)
        image_url = upload_to_vercel_blob(compressed_data, image_filename)

        if image_url:
            success_count += 1
            uploaded[word] = image_url
            consecutive_errors = 0
            print(f"OK -> {compressed_size//1024}KB [{success_count}]")

            if success_count % 20 == 0:
                save_progress(progress)
                print(f"  [进度已保存]")
        else:
            error_count += 1
            consecutive_errors += 1
            progress['errors'].append(word)
            print("失败")

            # 连续失败太多次，暂停更长时间
            if consecutive_errors >= 5:
                print(f"连续失败 {consecutive_errors} 次，暂停 30 秒...")
                time.sleep(30)
                consecutive_errors = 0

        time.sleep(UPLOAD_DELAY)

    save_progress(progress)

    # 生成 SQL 文件
    print(f"\n生成 SQL 文件...")
    with open(SQL_FILE, 'w', encoding='utf-8') as f:
        f.write("-- 图片导入SQL\n")
        f.write("BEGIN;\n\n")

        for word, image_url in uploaded.items():
            image_id = generate_id('image')
            now = datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]
            description = f"{word}的图片"

            f.write(f"INSERT INTO word_images (id, \"vocabularyId\", \"imageUrl\", description, \"createdAt\")\n")
            f.write(f"SELECT {escape_sql(image_id)}, v.id, {escape_sql(image_url)}, {escape_sql(description)}, '{now}'\n")
            f.write(f"FROM vocabularies v WHERE v.word = {escape_sql(word)}\n")
            f.write(f"AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi.\"vocabularyId\" = v.id);\n\n")

        f.write("COMMIT;\n")

    print(f"\n===== 完成 =====")
    print(f"成功: {success_count}")
    print(f"失败: {error_count}")
    print(f"SQL 文件: {SQL_FILE}")

if __name__ == '__main__':
    main()
