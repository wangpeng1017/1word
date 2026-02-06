#!/usr/bin/env python3
"""
提取词汇量测试题目（31-47题）并生成SQL导入脚本
"""
from docx import Document
import re
import json

# 读取Word文档
doc = Document(r'e:\trae\1word\词汇量测试（2000词）-有答案版本.docx')

# 提取所有段落
paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]

# 打印31-47题的内容（用于调试）
print("=" * 80)
print("题目 31-47 的内容：")
print("=" * 80)

# 找到题目31的位置
start_idx = None
for i, p in enumerate(paragraphs):
    if '31.' in p and '剥去' in p:
        start_idx = i
        break

if start_idx:
    # 打印从题目31开始的200行内容
    for i in range(start_idx, min(start_idx + 200, len(paragraphs))):
        print(f"{i}: {paragraphs[i]}")
else:
    print("未找到题目31")
    # 打印所有包含"剥去"的段落
    for i, p in enumerate(paragraphs):
        if '剥去' in p:
            print(f"{i}: {p}")
