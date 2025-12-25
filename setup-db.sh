#!/bin/bash
# 创建数据库用户和数据库
cd /tmp
sudo -u postgres psql << 'EOF'
CREATE USER word_user WITH PASSWORD 'word_pass_2024';
CREATE DATABASE word_app OWNER word_user;
GRANT ALL PRIVILEGES ON DATABASE word_app TO word_user;
EOF
echo "Database setup completed!"
