# GitLocal - 本地 Git 托管平台

一个轻量级的本地 Git 仓库托管平台，提供 Web 界面管理仓库，支持 Git Smart HTTP 协议进行 clone/push/pull 操作。

## 功能特性

- **仓库管理** — 创建、浏览、删除 Git 仓库
- **文件浏览** — 在线查看仓库文件树与文件内容（支持代码高亮）
- **提交历史** — 查看仓库 commit 日志
- **分支管理** — 创建、切换分支
- **Git Smart HTTP** — 支持标准 `git clone` / `git push` / `git pull` 操作
- **远程操作** — 克隆远程仓库、添加 remote、push/pull
- **搜索** — 按名称搜索仓库
- **Dashboard** — 仓库统计概览

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 19 + React Router 7 + Vite 8 + Highlight.js |
| 后端 | Express 5 + TypeScript |
| 数据库 | SQLite (better-sqlite3) |
| Git 操作 | simple-git |

## 项目结构

```
rqhhub/
├── backend/               # 后端服务
│   ├── src/
│   │   ├── index.ts       # 入口，Express 服务器
│   │   ├── models/        # 数据模型（数据库、仓库）
│   │   ├── routes/        # API 路由
│   │   │   ├── git.ts           # Git 操作 API
│   │   │   ├── gitSmartHttp.ts  # Git Smart HTTP 协议
│   │   │   └── repository.ts    # 仓库管理 API
│   │   └── services/
│   │       └── git.ts     # Git 服务层
│   ├── repositories/      # 本地 Git 仓库存储目录
│   ├── data/              # SQLite 数据库文件
│   └── scripts/           # 初始化脚本
├── frontend/              # 前端应用
│   └── src/
│       ├── components/    # 通用组件（布局、文件浏览器、文件查看器）
│       ├── pages/         # 页面（Dashboard、仓库列表、仓库详情、创建仓库）
│       └── services/      # API 调用封装
├── .env.example            # 环境配置示例
├── start.bat              # Windows 本地启动脚本
├── start.ps1              # PowerShell 本地启动脚本
└── start.sh               # Linux 公网启动脚本
```

## 快速开始

### 环境要求

- **Node.js** (>= 18)
- **Git**

### 场景一：Windows 本地部署

仅在本机访问，前后端均绑定 `localhost`。

**一键启动：** 双击 `start.bat`（CMD）或运行 `start.ps1`（PowerShell）

**手动启动：**

```powershell
# 安装依赖
npm run install:all

# 设置本地环境变量
$env:HOST = 'localhost'
$env:VITE_API_BASE_URL = 'http://localhost:3001/api'

# 启动
npm run dev
```

**访问地址：**

| 服务 | 地址 |
|------|------|
| 前端界面 | http://localhost:5173 |
| 后端 API | http://localhost:3001/api |
| Git HTTP | http://localhost:3001/用户名/仓库名 |

```bash
# 克隆示例仓库
git clone http://localhost:3001/root/demo-project
```

---

### 场景二：Linux 公网服务器部署

对外开放，前后端均绑定 `0.0.0.0`，支持外部访问。

**一键启动：**

```bash
chmod +x start.sh

# 自动检测服务器内网 IP
./start.sh

# 指定公网 IP（路由器端口转发后使用）
export HOST_IP=123.45.67.89
./start.sh

# 自定义端口（默认后端3001，前端5173）
export BACKEND_PORT=8080
export FRONTEND_PORT=80
./start.sh

# 后台运行（不占用终端）
nohup ./start.sh > server.log 2>&1 &
```

**手动启动：**

```bash
# 安装依赖
npm run install:all

# 设置公网环境变量
export HOST=0.0.0.0
export VITE_HOST=0.0.0.0
export VITE_API_BASE_URL=http://123.45.67.89:3001/api   # ← 替换为你的公网IP

# 启动
npm run dev
```

**访问地址（假设公网 IP 为 123.45.67.89）：**

| 服务 | 地址 |
|------|------|
| 前端界面 | `http://123.45.67.89:5173` |
| 后端 API | `http://123.45.67.89:3001/api` |
| Git HTTP | `http://123.45.67.89:3001/用户名/仓库名` |

```bash
# 克隆示例仓库（从任意客户端机器）
git clone http://123.45.67.89:3001/root/demo-project
```

> **注意：** 公网部署请确保防火墙/安全组已放行端口 3001 和 5173（或自定义端口）。

---

### 配置参考

完整环境变量说明见 [.env.example](.env.example)，关键配置：

| 环境变量 | 说明 | Windows 本地默认值 | Linux 公网推荐值 |
|---------|------|-------------------|----------------|
| `HOST` | 后端监听地址 | `localhost` | `0.0.0.0` |
| `PORT` | 后端端口 | `3001` | `3001` |
| `VITE_HOST` | 前端监听地址 | `localhost` | `0.0.0.0` |
| `VITE_PORT` | 前端端口 | `5173` | `5173` |
| `VITE_API_BASE_URL` | 前端调用的后端地址 | `http://localhost:3001/api` | `http://<公网IP>:3001/api` |

### 构建

```bash
npm run build
```

## Git 操作示例

```bash
# Windows 本地
git clone http://localhost:3001/root/demo-project

# Linux 公网（替换为实际 IP）
git clone http://123.45.67.89:3001/root/demo-project

# 添加远程仓库并推送
git remote add gitlocal http://<服务器IP>:3001/root/my-repo
git push gitlocal master
```

## API 概览

### 仓库管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/repository` | 获取仓库列表（分页） |
| GET | `/api/repository/search?q=keyword` | 搜索仓库 |
| GET | `/api/repository/stats` | 仓库统计 |
| POST | `/api/git/repositories` | 创建仓库 |
| GET | `/api/git/repositories/:name` | 获取仓库信息 |
| DELETE | `/api/git/repositories/:name` | 删除仓库 |

### Git 操作

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/git/repositories/:name/log` | 提交历史 |
| GET | `/api/git/repositories/:name/files` | 文件列表 |
| GET | `/api/git/repositories/:name/file?path=` | 文件内容 |
| GET | `/api/git/repositories/:name/branches` | 分支列表 |
| POST | `/api/git/repositories/:name/branches` | 创建分支 |
| POST | `/api/git/repositories/:name/commit` | 提交更改 |
| POST | `/api/git/repositories/:name/push` | 推送 |
| POST | `/api/git/repositories/:name/pull` | 拉取 |
| POST | `/api/git/clone` | 克隆远程仓库 |

## License

MIT
