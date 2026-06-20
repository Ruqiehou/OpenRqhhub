// GitLocal 仓库初始化脚本 - 由 start.bat / start.ps1 调用
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const reposDir = path.join(__dirname, '..', 'repositories');
if (!fs.existsSync(reposDir)) fs.mkdirSync(reposDir, { recursive: true });

const demoDir = path.join(reposDir, 'demo-project');
if (fs.existsSync(demoDir)) {
  console.log('EXISTS');
  process.exit(0);
}

fs.mkdirSync(demoDir, { recursive: true });
execSync('git init --bare', { cwd: demoDir, stdio: 'pipe' });

const readme = '# demo-project\n\n这是一个示例仓库，包含示例代码。\n';
const hash = execSync('git hash-object -w --stdin', { cwd: demoDir, input: readme }).toString().trim();
execSync('git update-index --add --cacheinfo 100644 ' + hash + ' README.md', { cwd: demoDir, stdio: 'pipe' });
const tree = execSync('git write-tree', { cwd: demoDir }).toString().trim();
const commit = execSync('git commit-tree ' + tree + ' -m "Initial commit"', { cwd: demoDir }).toString().trim();
execSync('git update-ref refs/heads/master ' + commit, { cwd: demoDir, stdio: 'pipe' });
console.log('OK');
