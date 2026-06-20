#!/usr/bin/env bash
set -e

# 颜色定义
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "========================================"
echo "  GitLocal - 本地Git托管平台"
echo "========================================"
echo -e "${NC}"

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ===== 环境检查 =====
echo -e "${YELLOW}[1/4] 检查环境...${NC}"

if command -v node &>/dev/null; then
    NODE_VER=$(node --version)
    echo -e "  ${GREEN}[✓] Node.js $NODE_VER${NC}"
else
    echo -e "  ${RED}[✗] 请先安装 Node.js：https://nodejs.org/${NC}"
    read -rp "按回车退出..."
    exit 1
fi

if command -v git &>/dev/null; then
    GIT_VER=$(git --version)
    echo -e "  ${GREEN}[✓] $GIT_VER${NC}"
else
    echo -e "  ${RED}[✗] 请先安装 Git：https://git-scm.com/${NC}"
    read -rp "按回车退出..."
    exit 1
fi

# ===== 安装依赖 =====
echo -e "\n${YELLOW}[2/4] 安装依赖...${NC}"

echo -n "  根目录依赖..."
npm install --silent 2>/dev/null
echo -e " ${GREEN}[✓]${NC}"

echo -n "  后端依赖..."
(cd backend && npm install --silent 2>/dev/null)
echo -e " ${GREEN}[✓]${NC}"

echo -n "  前端依赖..."
(cd frontend && npm install --silent 2>/dev/null)
echo -e " ${GREEN}[✓]${NC}"

# ===== 初始化数据 =====
echo -e "\n${YELLOW}[3/4] 初始化数据...${NC}"

# 创建数据目录
mkdir -p backend/data

# 清理旧 SQLite
DB_FILE="backend/data/gitlocal.db"
if [ -f "$DB_FILE" ]; then
    rm -f "$DB_FILE" "${DB_FILE}-shm" "${DB_FILE}-wal"
    echo -e "  ${GREEN}[✓] 已清理旧数据库${NC}"
fi

# 用 Node.js 创建示例 bare 仓库
RESULT=$(node -e "
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const dir = path.join('backend', 'repositories', 'demo-project');
if (fs.existsSync(dir)) { console.log('EXISTS'); process.exit(0); }
fs.mkdirSync(dir, { recursive: true });
execSync('git init --bare', { cwd: dir, stdio: 'pipe' });
const readme = '# demo-project\n\n这是一个示例仓库，包含示例代码。\n';
const hash = execSync('git hash-object -w --stdin', { cwd: dir, input: readme }).toString().trim();
execSync('git update-index --add --cacheinfo 100644 ' + hash + ' README.md', { cwd: dir, stdio: 'pipe' });
const tree = execSync('git write-tree', { cwd: dir }).toString().trim();
const commit = execSync('git commit-tree ' + tree + ' -m \"Initial commit\"', { cwd: dir }).toString().trim();
execSync('git update-ref refs/heads/master ' + commit, { cwd: dir, stdio: 'pipe' });
console.log('OK');
" 2>&1) || true

if [ "$RESULT" = "OK" ]; then
    echo -e "  ${GREEN}[✓] 示例仓库 demo-project 已创建${NC}"
elif [ "$RESULT" = "EXISTS" ]; then
    echo -e "  ${YELLOW}[-] 示例仓库已存在，跳过${NC}"
else
    echo -e "  ${YELLOW}[⚠] 示例仓库创建失败: $RESULT${NC}"
fi

# ===== 启动服务 =====
echo -e "\n${CYAN}========================================"
echo "  启动 GitLocal 服务"
echo -e "========================================${NC}"
echo ""
echo -e "  前端界面: ${CYAN}http://localhost:5173${NC}"
echo -e "  后端API : ${CYAN}http://localhost:3001/api${NC}"
echo -e "  Git HTTP: ${CYAN}http://localhost:3001/用户名/仓库名${NC}"
echo ""
echo -e "  ${GREEN}示例克隆:${NC}"
echo -e "  ${GREEN}  git clone http://localhost:3001/root/demo-project${NC}"
echo -e "  ${GRAY}  (本地有代理时加 -c http.proxy=)${NC}"
echo ""
echo -e "  ${GRAY}按 Ctrl+C 停止所有服务${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# 清理函数：捕获退出信号，终止子进程
cleanup() {
    echo -e "\n${YELLOW}正在停止服务...${NC}"
    kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
    wait "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
    echo -e "${GREEN}服务已停止${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# 启动后端和前端（后台进程）
(cd backend && npm run dev) &
BACKEND_PID=$!

(cd frontend && npm run dev) &
FRONTEND_PID=$!

echo -e "${GREEN}服务已启动！浏览器打开 http://localhost:5173${NC}"
echo -e "${GRAY}按 Ctrl+C 停止所有服务${NC}"

# 等待子进程
wait
