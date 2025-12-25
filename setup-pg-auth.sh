#!/bin/bash
# 配置 PostgreSQL 认证
cd /tmp

# 修改 pg_hba.conf 允许密码认证
PG_HBA="/var/lib/pgsql/data/pg_hba.conf"

# 备份原文件
cp $PG_HBA ${PG_HBA}.bak

# 替换 ident 为 md5
sed -i 's/ident/md5/g' $PG_HBA
sed -i 's/peer/md5/g' $PG_HBA

# 重启 PostgreSQL
systemctl restart postgresql

echo "PostgreSQL authentication configured!"
