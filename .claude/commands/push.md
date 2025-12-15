# Git 快速提交并推送到 GitHub

请执行以下操作：

1. 运行 `git status` 查看当前变更
2. 运行 `git diff --stat` 查看变更统计
3. 运行 `git log -3 --oneline` 查看最近提交风格

4. 将所有变更添加到暂存区：`git add -A`

5. 根据变更内容生成符合 Conventional Commits 规范的提交信息：
   - feat: 新功能
   - fix: 修复bug
   - docs: 文档更新
   - style: 代码格式调整
   - refactor: 重构
   - perf: 性能优化
   - test: 测试相关
   - chore: 构建/工具变更

6. 提交代码，提交信息格式：
   ```
   <type>(<scope>): <简短描述>

   <详细说明（可选）>

   🤖 Generated with [Claude Code](https://claude.com/claude-code)

   Co-Authored-By: Claude <noreply@anthropic.com>
   ```

7. 推送到远程仓库：`git push`

8. 如果推送失败（远程有更新），先拉取再推送：
   ```
   git pull --rebase
   git push
   ```

9. 返回推送结果，包含：
   - 提交的文件数量
   - 提交信息
   - 推送状态
