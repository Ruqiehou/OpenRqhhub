@echo off
chcp 65001 >nul
title GitLocal - 本地Git托管平台
setlocal enabledelayedexpansion

echo ========================================
echo   GitLocal - 本地Git托管平台
echo ========================================
echo.

:: 检查 Node.js
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [错误] 未检测到 Node.js，请安装: https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do echo [OK] Node.js %%i

:: 检查 Git
where git >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [错误] 未检测到 Git，请安装: https://git-scm.com/
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('git --version') do echo [OK] %%i

echo.
echo [1/3] 安装依赖...
echo   根目录...
call npm install --silent
echo   后端...
cd backend
call npm install --silent
cd ..
echo   前端...
cd frontend
call npm install --silent
cd ..

echo.
echo [2/3] 初始化数据...
:: 创建数据库目录
if not exist "backend\data" mkdir "backend\data"
if exist "backend\data\gitlocal.db" del /q "backend\data\gitlocal.db" && echo   已清理旧数据库

:: 创建示例仓库
echo   创建示例仓库...
cd backend
node scripts\init-repo.js
if %ERRORLEVEL% equ 0 (
    echo   示例仓库 demo-project 已创建
) else (
    echo   [跳过]
)
cd ..

echo.
echo ========================================
echo   启动 GitLocal 服务
echo ========================================
echo.
echo   前端界面: http://localhost:5173
echo   后端API: http://localhost:3001/api
echo   Git HTTP: http://localhost:3001/用户名/仓库名
echo.
echo   克隆示例: git clone http://localhost:3001/root/demo-project
echo.
echo   关闭服务窗口即可停止
echo ========================================
echo.

:: 启动前后端（独立窗口）
start "GitLocal-Backend" cmd /c "title GitLocal-Backend && cd /d %~dp0backend && npm run dev"
start "GitLocal-Frontend" cmd /c "title GitLocal-Frontend && cd /d %~dp0frontend && npm run dev"

echo 服务已启动，浏览器打开 http://localhost:5173
echo 此窗口可安全关闭
echo.
pause@echo off
chcp 65001 >nul
title GitLocal - 本地Git托管平台

setlocal enabledelayedexpansion

echo ========================================
echo   GitLocal - 本地Git托管平台
echo ========================================
echo.

:: 检查 Node.js
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [错误] 未检测到 Node.js
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do echo [OK] Node.js %%i

:: 检查 Git
where git >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [错误] 未检测到 Git
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('git --version') do echo [OK] %%i

echo.
echo [1/3] 安装依赖...
echo   根目录...
call npm install --silent
echo   后端...
cd backend
call npm install --silent
cd ..
echo   前端...
cd frontend
call npm install --silent
cd ..

echo.
echo [2/3] 初始化数据...
:: 创建数据库目录
if not exist "backend\data" mkdir "backend\data"
if exist "backend\data\gitlocal.db" del /q "backend\data\gitlocal.db" && echo   已清理旧数据库

:: 创建示例仓库
if not exist "backend\repositories\demo-project" (
    node -e "
var e=require('child_process').execSync,r=require('fs'),p=require('path');
var d=p.join('backend','repositories','demo-project');
r.mkdirSync(d,{recursive:true});
e('git init --bare',{cwd:d,stdio:'pipe'});
var readme='# demo-project\n\n这是一个示例仓库\n';
var h=e('git hash-object -w --stdin',{cwd:d,input:readme}).toString().trim();
e('git update-index --add --cacheinfo 100644 '+h+' README.md',{cwd:d,stdio:'pipe'});
var t=e('git write-tree',{cwd:d}).toString().trim();
var c=e('git commit-tree '+t+' -m "Initial commit"',{cwd:d}).toString().trim();
e('git update-ref refs/heads/master '+c,{cwd:d,stdio:'pipe'});
console.log('OK');
" 2>nul && echo   示例仓库 demo-project 已创建 || echo   [跳过] 示例仓库创建失败
) else echo   示例仓库已存在，跳过

echo.
echo ========================================
echo   启动完成
echo ========================================
echo.
echo   前端界面: http://localhost:5173
echo   后端API: http://localhost:3001/api
echo   Git HTTP: http://localhost:3001/用户名/仓库名
echo.
echo   克隆示例: git clone http://localhost:3001/root/demo-project
echo.
echo   关闭服务窗口即可停止
echo ========================================
echo.

:: 启动前后端（独立窗口）
start "GitLocal-Backend" cmd /c "title GitLocal-Backend ^& cd /d %~dp0backend ^& npm run dev"
start "GitLocal-Frontend" cmd /c "title GitLocal-Frontend ^& cd /d %~dp0frontend ^& npm run dev"

echo 服务已启动，浏览器打开 http://localhost:5173

