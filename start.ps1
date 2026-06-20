@'
========================================
  GitLocal - 本地Git托管平台
========================================
'@ | Write-Host -ForegroundColor Cyan

# ===== 环境检查 =====
Write-Host "`n[1/3] 检查环境..." -ForegroundColor Yellow
try { $v = node --version; Write-Host "  [OK] Node.js $v" -ForegroundColor Green }
catch { Write-Host "  [ERR] 请安装 Node.js" -ForegroundColor Red; Read-Host "回车退出"; exit 1 }
try { $v = git --version; Write-Host "  [OK] $v" -ForegroundColor Green }
catch { Write-Host "  [ERR] 请安装 Git" -ForegroundColor Red; Read-Host "回车退出"; exit 1 }

# ===== 安装依赖 =====
Write-Host "`n[2/3] 安装依赖..." -ForegroundColor Yellow
Push-Location $PSScriptRoot
Write-Host "  根目录..." -NoNewline; npm install --silent 2>$null; Write-Host " OK" -ForegroundColor Green
Write-Host "  后端..." -NoNewline; Push-Location backend; npm install --silent 2>$null; Pop-Location; Write-Host " OK" -ForegroundColor Green
Write-Host "  前端..." -NoNewline; Push-Location frontend; npm install --silent 2>$null; Pop-Location; Write-Host " OK" -ForegroundColor Green

# ===== 初始化 =====
Write-Host "`n[3/3] 初始化数据..." -ForegroundColor Yellow
$db = Join-Path $PSScriptRoot "backend" "data" "gitlocal.db"
if (Test-Path $db) { Remove-Item $db -Force; Write-Host "  已清理旧数据库" -ForegroundColor Green }
$result = & node "$PSScriptRoot\backend\scripts\init-repo.js" 2>&1
if ($result -eq 'OK') { Write-Host "  示例仓库 demo-project 已创建" -ForegroundColor Green }
elseif ($result -eq 'EXISTS') { Write-Host "  示例仓库已存在，跳过" -ForegroundColor Yellow }
else { Write-Host "  创建示例仓库失败: $result" -ForegroundColor Yellow }

# ===== 启动 =====
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  服务已启动" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  前端界面: http://localhost:5173" -ForegroundColor White
Write-Host "  后端API : http://localhost:3001/api" -ForegroundColor White
Write-Host "  Git HTTP: http://localhost:3001/用户名/仓库名" -ForegroundColor White
Write-Host ""
Write-Host "  克隆示例: git clone http://localhost:3001/root/demo-project" -ForegroundColor Green
Write-Host "  (本地有代理时加 -c http.proxy=)" -ForegroundColor DarkYellow
Write-Host ""
Write-Host "  关闭服务窗口即可停止" -ForegroundColor Gray
Write-Host "========================================`n" -ForegroundColor Cyan

$root = $PSScriptRoot
Start-Process -WindowStyle Normal -FilePath "cmd.exe" -ArgumentList "/c title GitLocal-Backend && cd /d $root\backend && npm run dev"
Start-Process -WindowStyle Normal -FilePath "cmd.exe" -ArgumentList "/c title GitLocal-Frontend && cd /d $root\frontend && npm run dev"

Write-Host "浏览器打开 http://localhost:5173" -ForegroundColor Green
Write-Host "此窗口可安全关闭" -ForegroundColor Gray
Start-Sleep 3@'
========================================
  GitLocal - 本地Git托管平台
========================================
'@ | Write-Host -ForegroundColor Cyan

# ===== 环境检查 =====
Write-Host "`n[1/4] 检查环境..." -ForegroundColor Yellow

try { $nodeVer = node --version; Write-Host "  [✓] Node.js $nodeVer" -ForegroundColor Green }
catch { Write-Host "  [✗] 请先安装 Node.js：https://nodejs.org/" -ForegroundColor Red; Read-Host "按回车退出"; exit 1 }

try { $gitVer = git --version; Write-Host "  [✓] $gitVer" -ForegroundColor Green }
catch { Write-Host "  [✗] 请先安装 Git：https://git-scm.com/" -ForegroundColor Red; Read-Host "按回车退出"; exit 1 }

# ===== 安装依赖 =====
Write-Host "`n[2/4] 安装依赖..." -ForegroundColor Yellow

Push-Location $PSScriptRoot
Write-Host "  根目录依赖..." -NoNewline; npm install --silent 2>$null; Write-Host " [✓]" -ForegroundColor Green
Write-Host "  后端依赖..." -NoNewline; Push-Location backend; npm install --silent 2>$null; Pop-Location; Write-Host " [✓]" -ForegroundColor Green
Write-Host "  前端依赖..." -NoNewline; Push-Location frontend; npm install --silent 2>$null; Pop-Location; Write-Host " [✓]" -ForegroundColor Green

# ===== 初始化数据 =====
Write-Host "`n[3/4] 初始化数据..." -ForegroundColor Yellow

# 清理旧 SQLite
$dbFile = Join-Path $PSScriptRoot "backend" "data" "gitlocal.db"
if (Test-Path $dbFile) { Remove-Item $dbFile -Force; Write-Host "  [✓] 已清理旧数据库" -ForegroundColor Green }

# 用 Node.js 创建示例 bare 仓库
Push-Location $PSScriptRoot
$result = node -e @"
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
const commit = execSync('git commit-tree ' + tree + ' -m "Initial commit"', { cwd: dir }).toString().trim();
execSync('git update-ref refs/heads/master ' + commit, { cwd: dir, stdio: 'pipe' });
console.log('OK');
"@ 2>&1

if ($result -eq 'OK') { Write-Host "  [✓] 示例仓库 demo-project 已创建" -ForegroundColor Green }
elseif ($result -eq 'EXISTS') { Write-Host "  [-] 示例仓库已存在，跳过" -ForegroundColor Yellow }
else { Write-Host "  [⚠] 示例仓库创建失败: $result" -ForegroundColor Yellow }
Pop-Location

# ===== 启动服务 =====
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  服务已在独立窗口中运行" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  前端界面: http://localhost:5173" -ForegroundColor White
Write-Host "  后端API : http://localhost:3001/api" -ForegroundColor White
Write-Host "  Git HTTP: http://localhost:3001/用户名/仓库名" -ForegroundColor White
Write-Host ""
Write-Host "  示例克隆:" -ForegroundColor Green
Write-Host "    git clone http://localhost:3001/root/demo-project" -ForegroundColor Green
Write-Host "    (本地有代理时加 -c http.proxy=)" -ForegroundColor DarkYellow
Write-Host ""
Write-Host "  关闭服务窗口即可停止，或运行:" -ForegroundColor Gray
Write-Host "    taskkill /f /fi \"WINDOWTITLE eq GitLocal-*\"" -ForegroundColor Gray
Write-Host "========================================`n" -ForegroundColor Cyan

$root = $PSScriptRoot
Start-Process -WindowStyle Normal -FilePath "cmd.exe" -ArgumentList "/c title GitLocal-Backend & cd /d $root\backend & npm run dev"
Start-Process -WindowStyle Normal -FilePath "cmd.exe" -ArgumentList "/c title GitLocal-Frontend & cd /d $root\frontend & npm run dev"

Write-Host "服务已启动！浏览器打开 http://localhost:5173" -ForegroundColor Green
Write-Host "此窗口即将关闭..." -ForegroundColor Gray
Start-Sleep 2