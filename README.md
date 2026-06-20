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
├── start.bat              # Windows 一键启动脚本
├── start.ps1              # PowerShell 启动脚本
└── start.sh               # Linux/macOS 启动脚本
```

## 快速开始

### 环境要求

- **Node.js** (>= 18)
- **Git**

### 一键启动（Windows）

双击运行 `start.bat`，脚本会自动安装依赖、初始化示例仓库并启动前后端服务。

### 一键启动（Linux / macOS）

```bash
chmod +x start.sh
./start.sh
```

脚本会自动安装依赖、初始化示例仓库并启动前后端服务，按 `Ctrl+C` 可停止所有服务。

**对外开放（公网/局域网部署）：**

```bash
# 自动检测局域网 IP，直接运行
./start.sh

# 指定公网 IP（路由器端口转发后使用）
export HOST_IP=你的公网IP
./start.sh

# 自定义端口（默认后端3001，前端5173）
export BACKEND_PORT=8080
export FRONTEND_PORT=80
./start.sh
```

> **注意**：公网部署请确保防火墙/安全组已放行对应端口。

### 手动启动

```bash
# 1. 安装依赖
npm run install:all

# 2. 同时启动前后端（开发模式）
npm run dev
```

或分别启动：

```bash
# 后端
npm run dev:backend

# 前端
npm run dev:frontend
```

### 构建

```bash
npm run build
```

## 服务地址

| 服务 | 地址 |
|------|------|
| 前端界面 | `http://<IP>:5173` |
| 后端 API | `http://<IP>:3001/api` |
| Git HTTP | `http://<IP>:3001/用户名/仓库名` |
| 健康检查 | `http://<IP>:3001/api/health` |

> `<IP>` 为服务器局域网或公网 IP，启动脚本会自动检测并显示。
> 可通过 `export HOST_IP=...` 手动指定。

## Git 操作示例

```bash
# 克隆本地仓库
git clone http://<服务器IP>:3001/root/demo-project

# 推送到本地仓库
git remote add local http://<服务器IP>:3001/root/my-repo
git push local master

# 拉取
git pull local master
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
