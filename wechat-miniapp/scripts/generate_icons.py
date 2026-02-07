# -*- coding: utf-8 -*-
"""
生成微信小程序 TabBar 图标
尺寸: 81x81 像素
颜色: 灰色(未选中) #9CA3AF, 粉色(选中) #FF7A7A
"""
from PIL import Image, ImageDraw
import os

# 配置
SIZE = 81
PADDING = 16
GRAY = '#9CA3AF'
PINK = '#FF7A7A'
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'images')

def draw_study_icon(color):
    """今日学习 - 书本+星星"""
    img = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 书本
    book_left = PADDING
    book_right = SIZE - PADDING
    book_top = PADDING + 10
    book_bottom = SIZE - PADDING

    # 书本轮廓
    draw.rectangle([book_left, book_top, book_right, book_bottom], outline=color, width=3)
    # 书脊
    mid_x = SIZE // 2
    draw.line([mid_x, book_top, mid_x, book_bottom], fill=color, width=2)
    # 星星
    star_y = PADDING
    draw.ellipse([mid_x - 6, star_y - 2, mid_x + 6, star_y + 10], fill=color)

    return img

def draw_review_icon(color):
    """今日复习 - 循环箭头"""
    img = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    center = SIZE // 2
    radius = (SIZE - 2 * PADDING) // 2

    # 圆弧 (用椭圆模拟)
    bbox = [center - radius, center - radius, center + radius, center + radius]
    draw.arc(bbox, start=45, end=315, fill=color, width=4)

    # 箭头
    arrow_x = center + radius - 5
    arrow_y = center - 10
    draw.polygon([
        (arrow_x, arrow_y - 8),
        (arrow_x + 10, arrow_y + 2),
        (arrow_x, arrow_y + 2)
    ], fill=color)

    return img

def draw_book_icon(color):
    """错题本 - 打开的书"""
    img = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 书本轮廓
    left = PADDING
    right = SIZE - PADDING
    top = PADDING + 5
    bottom = SIZE - PADDING - 5
    mid_x = SIZE // 2

    # 左页
    draw.polygon([
        (mid_x, top + 5),
        (left, top),
        (left, bottom),
        (mid_x, bottom - 5)
    ], outline=color, width=3)

    # 右页
    draw.polygon([
        (mid_x, top + 5),
        (right, top),
        (right, bottom),
        (mid_x, bottom - 5)
    ], outline=color, width=3)

    # 书脊
    draw.line([mid_x, top + 5, mid_x, bottom - 5], fill=color, width=2)

    # 横线 (文字)
    for i in range(3):
        y = top + 15 + i * 12
        draw.line([left + 8, y, mid_x - 8, y], fill=color, width=2)

    return img

def draw_data_icon(color):
    """学习数据 - 柱状图"""
    img = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    bottom = SIZE - PADDING
    bar_width = 12
    gap = 6
    start_x = PADDING + 5

    # 三根柱子
    heights = [25, 40, 30]
    for i, h in enumerate(heights):
        x = start_x + i * (bar_width + gap)
        draw.rectangle([x, bottom - h, x + bar_width, bottom], fill=color)

    # 底部横线
    draw.line([PADDING, bottom + 2, SIZE - PADDING, bottom + 2], fill=color, width=2)

    # 左侧竖线
    draw.line([PADDING, PADDING + 10, PADDING, bottom + 2], fill=color, width=2)

    return img

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    icons = [
        ('study', draw_study_icon),
        ('review', draw_review_icon),
        ('book', draw_book_icon),
        ('data', draw_data_icon),
    ]

    for name, draw_func in icons:
        # 未选中状态 (灰色)
        img = draw_func(GRAY)
        path = os.path.join(OUTPUT_DIR, f'{name}.png')
        img.save(path)
        print(f'Generated: {path}')

        # 选中状态 (粉色)
        img_active = draw_func(PINK)
        path_active = os.path.join(OUTPUT_DIR, f'{name}-active.png')
        img_active.save(path_active)
        print(f'Generated: {path_active}')

    print('\nDone! All icons generated.')

if __name__ == '__main__':
    main()
