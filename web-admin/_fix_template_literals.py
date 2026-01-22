# -*- coding: utf-8 -*-
import re

# 读取文件
with open('/Users/wangpeng/Downloads/1word/web-admin/QUERY_CORRECT_LOGIC.js', 'r') as f:
    content = f.read().decode('utf-8')

# 替换所有模板字符串为普通字符串拼接
# 匹配模式: `text ${var} more`
pattern = r'`([^`]*)\$\{([^}]+)\}([^`]*)`'

def replacer(match):
    prefix = match.group(1)
    var = match.group(2)
    suffix = match.group(3)
    # 转换为 ' + var + ' 格式
    if prefix and suffix:
        return "'" + prefix + "' + " + var + " + '" + suffix + "'"
    elif prefix:
        return "'" + prefix + "' + " + var
    elif suffix:
        return var + " + '" + suffix + "'"
    else:
        return var

content = re.sub(pattern, replacer, content)

# 写回文件
with open('/Users/wangpeng/Downloads/1word/web-admin/QUERY_CORRECT_LOGIC.js', 'w') as f:
    f.write(content.encode('utf-8'))

print('Fixed template literals')
