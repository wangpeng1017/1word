@echo off
git add -A
git commit -m "Remove DB enum dependency; use TEXT for role/difficulty; raw SQL for admin creation"
git push origin main
