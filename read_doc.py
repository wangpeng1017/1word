from docx import Document
import json

doc = Document(r'e:\trae\1word\练习_合并.docx')

all_text = []
for para in doc.paragraphs:
    text = para.text.strip()
    if text:
        all_text.append(text)

# 保存为 JSON
with open('doc_content.json', 'w', encoding='utf-8') as f:
    json.dump(all_text, f, ensure_ascii=False, indent=2)

print(f'共 {len(all_text)} 行')
print('前50行:')
for i, line in enumerate(all_text[:50]):
    print(f'{i+1:3d}. {line[:80]}')
