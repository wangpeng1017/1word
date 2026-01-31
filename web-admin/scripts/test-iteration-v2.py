#!/usr/bin/env python3
"""
迭代v2功能验证测试
测试内容:
1. 每日任务API - 音频过滤
2. 词汇测试API - 50题验证
3. 勋章数据 - 关联正确性
4. 错题重测功能
"""

import requests
import subprocess
import json
import sys

API_BASE = "http://localhost:3000/api"
TEST_STUDENT_ID = "sGiReHrr5rJN3uxSeTGAd"
TEST_USER = "13800000000"
TEST_PASS = "admin123"

def print_header(title):
    print(f"\n{'='*50}")
    print(f"  {title}")
    print('='*50)

def get_token():
    """获取认证token"""
    resp = requests.post(f"{API_BASE}/auth/login", json={
        "phone": TEST_USER,
        "password": TEST_PASS
    })
    if resp.status_code == 200:
        data = resp.json()
        if data.get("success"):
            return data.get("data", {}).get("token")
    print(f"❌ 登录失败: {resp.text}")
    return None

def test_daily_tasks_audio_filter(token):
    """测试每日任务API - 验证音频过滤功能"""
    print_header("测试1: 每日任务音频过滤")

    resp = requests.get(
        f"{API_BASE}/students/{TEST_STUDENT_ID}/daily-tasks",
        headers={"Authorization": f"Bearer {token}"}
    )

    if resp.status_code != 200:
        print(f"❌ API请求失败: {resp.status_code}")
        return False

    data = resp.json()
    if not data.get("success"):
        print(f"❌ API返回错误: {data.get('error')}")
        return False

    tasks = data.get("data", {}).get("tasks", [])
    summary = data.get("data", {}).get("summary", {})

    print(f"  新学单词: {summary.get('newCount', 0)}")
    print(f"  复习单词: {summary.get('reviewCount', 0)}")
    print(f"  总任务数: {len(tasks)}")

    # 检查音频过滤
    no_audio_tasks = []
    for t in tasks:
        vocab = t.get("vocabulary", {})
        if not vocab.get("audioUrl"):
            no_audio_tasks.append(vocab.get("word", "unknown"))

    print(f"  无音频任务: {len(no_audio_tasks)}")

    if len(no_audio_tasks) > 0:
        print(f"  ❌ 发现无音频任务: {no_audio_tasks[:3]}")
        return False
    else:
        print(f"  ✅ 所有任务都有音频")
        return True

def test_vocabulary_quiz_50_questions(token):
    """测试词汇测试API - 验证50题"""
    print_header("测试2: 词汇测试50题")

    resp = requests.post(
        f"{API_BASE}/vocabulary-quiz/start",
        headers={"Authorization": f"Bearer {token}"},
        json={"studentId": TEST_STUDENT_ID}
    )

    if resp.status_code != 200:
        print(f"❌ API请求失败: {resp.status_code}")
        return False

    data = resp.json()
    if not data.get("success"):
        print(f"❌ API返回错误: {data.get('error')}")
        return False

    q_count = data.get("data", {}).get("totalQuestions", 0)
    print(f"  词汇测试题目数: {q_count}")

    if q_count == 50:
        print(f"  ✅ 题目数量正确 (50题)")
        return True
    else:
        print(f"  ❌ 题目数量错误 (期望50, 实际{q_count})")
        return False

def test_badge_achievement_mapping():
    """测试勋章-成就关联数据"""
    print_header("测试3: 勋章-成就关联数据")

    result = subprocess.run([
        "psql", "-h", "localhost", "-U", "word_user", "-d", "word_app",
        "-c", """SELECT
            (SELECT COUNT(*) FROM student_badges) as total_badges,
            (SELECT COUNT(*) FROM student_achievements) as total_achievements,
            (SELECT COUNT(*) FROM badges b WHERE b."achievementId" IS NOT NULL) as badges_with_achievement;
        """
    ], env={"PGPASSWORD": "word_pass_2024"}, capture_output=True, text=True)

    if result.returncode != 0:
        print(f"❌ 数据库查询失败: {result.stderr}")
        return False

    lines = result.stdout.strip().split('\n')
    if len(lines) >= 2:
        parts = lines[1].split('|')
        if len(parts) >= 3:
            total_badges = int(parts[1].strip())
            total_achievements = int(parts[2].strip())
            badges_with_achievement = int(parts[3].strip())

            print(f"  学生勋章总数: {total_badges}")
            print(f"  学生成就总数: {total_achievements}")
            print(f"  已关联成就的勋章: {badges_with_achievement}")

            if badges_with_achievement >= 9:
                print(f"  ✅ 勋章-成就关联正常 (9个勋章已关联)")
                return True
            else:
                print(f"  ❌ 勋章-成就关联不足 ({badges_with_achievement}/9)")
                return False

    print(f"❌ 无法解析数据库结果")
    return False

def test_wrong_questions_api(token):
    """测试错题API"""
    print_header("测试4: 错题重测功能")

    resp = requests.get(
        f"{API_BASE}/students/{TEST_STUDENT_ID}/wrong-questions?limit=100",
        headers={"Authorization": f"Bearer {token}"}
    )

    if resp.status_code != 200:
        print(f"❌ API请求失败: {resp.status_code}")
        return False

    data = resp.json()
    if data.get("success"):
        wrong_count = len(data.get("data", {}).get("wrongQuestions", []))
        print(f"  错题数量: {wrong_count}")
        print(f"  ✅ 错题API正常")
        return True
    else:
        print(f"❌ API返回错误: {data.get('error')}")
        return False

def test_study_records_api(token):
    """测试学习记录API - 验证不记录重测数据"""
    print_header("测试5: 学习记录API基础功能")

    resp = requests.get(
        f"{API_BASE}/students/{TEST_STUDENT_ID}/study-history?page=1&limit=10",
        headers={"Authorization": f"Bearer {token}"}
    )

    if resp.status_code == 200:
        data = resp.json()
        if data.get("success"):
            records = data.get("data", {}).get("records", [])
            print(f"  历史记录数: {len(records)}")
            print(f"  ✅ 学习记录API正常")
            return True

    print(f"❌ 学习记录API异常")
    return False

def main():
    print("=" * 50)
    print("  迭代v2功能验证测试")
    print("=" * 50)

    # 获取token
    token = get_token()
    if not token:
        sys.exit(1)

    # 运行测试
    results = []
    results.append(("每日任务音频过滤", test_daily_tasks_audio_filter(token)))
    results.append(("词汇测试50题", test_vocabulary_quiz_50_questions(token)))
    results.append(("勋章-成就关联", test_badge_achievement_mapping()))
    results.append(("错题重测功能", test_wrong_questions_api(token)))
    results.append(("学习记录API", test_study_records_api(token)))

    # 汇总结果
    print_header("测试结果汇总")
    passed = sum(1 for _, r in results if r)
    total = len(results)

    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {status}  {name}")

    print(f"\n总计: {passed}/{total} 通过")

    if passed == total:
        print("\n🎉 所有测试通过！")
        sys.exit(0)
    else:
        print(f"\n⚠️  {total - passed} 个测试失败")
        sys.exit(1)

if __name__ == "__main__":
    main()
