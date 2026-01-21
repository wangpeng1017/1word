#!/bin/bash
# ============================================
# 新东方服务器一键部署脚本
# 域名: ienglish.xdf.cn
# 服务器: 172.20.234.44 (Ubuntu 22.04)
# ============================================

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ============================================
# 配置区域（按需修改）
# ============================================
APP_NAME="word-app"
APP_DIR="$HOME/apps/1word"
REPO_URL="https://github.com/wangpeng1017/1word.git"
PORT=3000

# 数据库配置
DB_HOST="rm-2ze2n9xofwd6lu1oz.mysql.rds.aliyuncs.com"
DB_PORT="3306"
DB_NAME="zytbydt"
DB_USER="PRO_RDS_zytbydt_RW"
DB_PASS="YpgtW4A9lAvdTRbs"
DATABASE_URL="mysql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

# JWT 密钥
JWT_SECRET="xdf_vocab_jwt_secret_2024_production_secure_key"

# API 地址
API_URL="https://ienglish.xdf.cn"

# ============================================
# 步骤 1: 检查环境
# ============================================
check_environment() {
    log_info "========== 步骤 1/7: 检查环境 =========="

    # 检查 Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -ge 18 ]; then
            log_info "Node.js 版本: $(node -v) ✓"
        else
            log_error "Node.js 版本过低，需要 18+，当前: $(node -v)"
            log_info "请先安装 Node.js 18:"
            echo "  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -"
            echo "  sudo apt-get install -y nodejs"
            exit 1
        fi
    else
        log_error "未安装 Node.js"
        log_info "请先安装 Node.js 18:"
        echo "  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -"
        echo "  sudo apt-get install -y nodejs"
        exit 1
    fi

    # 检查 npm
    if command -v npm &> /dev/null; then
        log_info "npm 版本: $(npm -v) ✓"
    else
        log_error "未安装 npm"
        exit 1
    fi

    # 检查 git
    if command -v git &> /dev/null; then
        log_info "git 版本: $(git --version | cut -d' ' -f3) ✓"
    else
        log_error "未安装 git"
        exit 1
    fi

    # 检查磁盘空间
    DISK_FREE=$(df -BG "$HOME" | tail -1 | awk '{print $4}' | tr -d 'G')
    if [ "$DISK_FREE" -lt 2 ]; then
        log_warn "磁盘空间不足 2GB，当前可用: ${DISK_FREE}GB"
    else
        log_info "磁盘空间: ${DISK_FREE}GB 可用 ✓"
    fi

    # 检查内存
    MEM_FREE=$(free -m | awk '/^Mem:/{print $7}')
    log_info "可用内存: ${MEM_FREE}MB"
    if [ "$MEM_FREE" -lt 512 ]; then
        log_warn "内存较低，构建可能较慢"
    fi
}

# ============================================
# 步骤 2: 测试数据库连接
# ============================================
test_database() {
    log_info "========== 步骤 2/7: 测试数据库连接 =========="

    # 使用 Node.js 测试 MySQL 连接
    node -e "
    const net = require('net');
    const client = new net.Socket();
    client.setTimeout(5000);
    client.connect(${DB_PORT}, '${DB_HOST}', () => {
        console.log('数据库连接测试成功 ✓');
        client.destroy();
        process.exit(0);
    });
    client.on('error', (err) => {
        console.error('数据库连接失败:', err.message);
        console.error('请检查:');
        console.error('  1. RDS 白名单是否添加了此服务器 IP');
        console.error('  2. 数据库地址是否正确');
        process.exit(1);
    });
    client.on('timeout', () => {
        console.error('数据库连接超时');
        client.destroy();
        process.exit(1);
    });
    " || {
        log_error "数据库连接测试失败"
        log_warn "请确认 RDS 白名单已添加服务器 IP: $(curl -s ifconfig.me 2>/dev/null || echo '无法获取')"
        read -p "是否继续部署？(y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    }
}

# ============================================
# 步骤 3: 克隆/更新代码
# ============================================
setup_code() {
    log_info "========== 步骤 3/7: 获取代码 =========="

    mkdir -p "$HOME/apps"

    if [ -d "$APP_DIR" ]; then
        log_info "代码目录已存在，执行 git pull..."
        cd "$APP_DIR"
        git fetch origin
        git reset --hard origin/main
        git pull origin main
    else
        log_info "首次部署，克隆代码..."
        cd "$HOME/apps"
        git clone "$REPO_URL" 1word
    fi

    log_info "代码获取完成 ✓"
}

# ============================================
# 步骤 4: 配置环境变量
# ============================================
setup_env() {
    log_info "========== 步骤 4/7: 配置环境变量 =========="

    cd "$APP_DIR/web-admin"

    # 备份旧配置
    if [ -f .env ]; then
        cp .env ".env.backup.$(date +%Y%m%d%H%M%S)"
        log_info "已备份旧配置"
    fi

    # 创建新配置
    cat > .env << EOF
# 新东方生产环境配置
# 生成时间: $(date '+%Y-%m-%d %H:%M:%S')

# MySQL 数据库连接
DATABASE_URL="${DATABASE_URL}"

# JWT 密钥
JWT_SECRET="${JWT_SECRET}"

# API 地址
NEXT_PUBLIC_API_URL="${API_URL}"

# 环境标识
NODE_ENV="production"
EOF

    log_info "环境变量配置完成 ✓"
    log_info "配置文件: $APP_DIR/web-admin/.env"
}

# ============================================
# 步骤 5: 安装依赖
# ============================================
install_deps() {
    log_info "========== 步骤 5/7: 安装依赖 =========="

    cd "$APP_DIR/web-admin"

    # 设置 npm 镜像
    npm config set registry https://registry.npmmirror.com
    log_info "已设置 npm 镜像: registry.npmmirror.com"

    # 安装依赖
    log_info "正在安装依赖，请稍候..."
    npm install --legacy-peer-deps

    log_info "依赖安装完成 ✓"
}

# ============================================
# 步骤 6: 数据库迁移 & 构建
# ============================================
build_app() {
    log_info "========== 步骤 6/7: 数据库迁移 & 构建 =========="

    cd "$APP_DIR/web-admin"

    # Prisma 生成客户端
    log_info "生成 Prisma Client..."
    npx prisma generate

    # 推送数据库 schema
    log_info "同步数据库表结构..."
    npx prisma db push --accept-data-loss || {
        log_warn "数据库同步可能有警告，继续构建..."
    }

    # 构建应用
    log_info "正在构建应用，这可能需要几分钟..."
    npm run build

    log_info "构建完成 ✓"
}

# ============================================
# 步骤 7: 启动应用
# ============================================
start_app() {
    log_info "========== 步骤 7/7: 启动应用 =========="

    cd "$APP_DIR/web-admin"

    # 检查是否有 PM2
    if command -v pm2 &> /dev/null; then
        log_info "使用 PM2 管理应用..."

        # 停止旧进程
        pm2 delete "$APP_NAME" 2>/dev/null || true

        # 启动新进程
        pm2 start npm --name "$APP_NAME" -- start
        pm2 save

        log_info "PM2 启动完成 ✓"
        pm2 status
    else
        log_warn "未安装 PM2，使用 nohup 启动"
        log_info "建议安装 PM2: npm install -g pm2"

        # 停止旧进程
        pkill -f "next start" 2>/dev/null || true
        sleep 2

        # 启动新进程
        nohup npm start > /tmp/${APP_NAME}.log 2>&1 &

        log_info "应用已启动，日志: /tmp/${APP_NAME}.log"
    fi

    # 等待启动
    log_info "等待应用启动..."
    sleep 5

    # 检查是否启动成功
    if curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:${PORT}" | grep -q "200\|301\|302"; then
        log_info "应用启动成功 ✓"
    else
        log_warn "应用可能还在启动中，请稍后检查"
    fi
}

# ============================================
# 打印部署信息
# ============================================
print_summary() {
    echo ""
    echo "============================================"
    echo -e "${GREEN}部署完成!${NC}"
    echo "============================================"
    echo ""
    echo "应用信息:"
    echo "  - 名称: $APP_NAME"
    echo "  - 目录: $APP_DIR/web-admin"
    echo "  - 端口: $PORT"
    echo "  - 域名: $API_URL"
    echo ""
    echo "常用命令:"
    if command -v pm2 &> /dev/null; then
        echo "  查看状态: pm2 status"
        echo "  查看日志: pm2 logs $APP_NAME"
        echo "  重启应用: pm2 restart $APP_NAME"
        echo "  停止应用: pm2 stop $APP_NAME"
    else
        echo "  查看日志: tail -f /tmp/${APP_NAME}.log"
        echo "  停止应用: pkill -f 'next start'"
    fi
    echo ""
    echo "下一步:"
    echo "  1. 确认 Nginx 已配置反向代理 (端口 $PORT)"
    echo "  2. 确认域名 $API_URL 已解析到此服务器"
    echo "  3. 确认 HTTPS 证书已配置"
    echo ""
}

# ============================================
# 主流程
# ============================================
main() {
    echo ""
    echo "============================================"
    echo "  新东方词汇助手 - 一键部署脚本"
    echo "  目标域名: ienglish.xdf.cn"
    echo "============================================"
    echo ""

    check_environment
    test_database
    setup_code
    setup_env
    install_deps
    build_app
    start_app
    print_summary
}

# 执行
main "$@"
