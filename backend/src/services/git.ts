import simpleGit, { StatusResult, LogResult } from 'simple-git';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import RepositoryModel from '../models/repository';

export class GitService {
  private basePath: string;

  constructor(basePath: string = './repositories') {
    this.basePath = path.resolve(basePath);
    if (!fs.existsSync(this.basePath)) fs.mkdirSync(this.basePath, { recursive: true });
  }

  private getRepoPath(repoName: string): string {
    return path.join(this.basePath, repoName);
  }

  /** bare 仓库检测：检查是否存在 HEAD 文件 */
  async repositoryExists(repoName: string): Promise<boolean> {
    const repoPath = this.getRepoPath(repoName);
    // bare 仓库 HEAD 在根目录，非 bare 在 .git/HEAD
    return fs.existsSync(path.join(repoPath, 'HEAD')) ||
           fs.existsSync(path.join(repoPath, '.git', 'HEAD'));
  }

  /** git 仓库检测（bare 和非 bare 都支持） */
  private isGitRepo(dirPath: string): boolean {
    return fs.existsSync(path.join(dirPath, 'HEAD')) ||
           fs.existsSync(path.join(dirPath, '.git', 'HEAD'));
  }

  /** git plumbing 命令执行 */
  private gitExec(cwd: string, args: string[], stdin?: string): string {
    const opts: any = { cwd, encoding: 'utf-8' as BufferEncoding };
    if (stdin !== undefined) opts.input = stdin;
    return execSync(`git ${args.map(a => `"${a}"`).join(' ')}`, opts).toString().trim();
  }

  /** 创建 bare 仓库 */
  async createRepository(repoName: string, description?: string): Promise<string> {
    const repoPath = this.getRepoPath(repoName);
    if (fs.existsSync(repoPath)) throw new Error('仓库 ' + repoName + ' 已存在');
    fs.mkdirSync(repoPath, { recursive: true });

    const git = simpleGit(repoPath);
    await git.init(true); // --bare

    // 用 git plumbing 创建初始提交
    const readmeContent = '# ' + repoName + '\n\n' + (description || '这是一个Git仓库') + '\n';
    const readmeHash = this.gitExec(repoPath, ['hash-object', '-w', '--stdin'], readmeContent);
    this.gitExec(repoPath, ['update-index', '--add', '--cacheinfo', '100644', readmeHash, 'README.md']);
    const treeHash = this.gitExec(repoPath, ['write-tree']);
    const msg = 'Initial commit' + (description ? '\n\n' + description : '');
    const commitHash = this.gitExec(repoPath, ['commit-tree', treeHash, '-m', msg]);
    this.gitExec(repoPath, ['update-ref', 'refs/heads/master', commitHash]);

    const repo = RepositoryModel.create({ name: repoName, description, path: repoPath, default_branch: 'master' });
    RepositoryModel.addBranch(repo.id, 'master', true);
    RepositoryModel.addCommit(repo.id, commitHash, 'Initial commit', '', '', new Date().toISOString());
    return repoPath;
  }

  /** 获取仓库状态（bare 仓库返回空） */
  async getStatus(_repoName: string): Promise<StatusResult> {
    return { current: '', tracking: '', ahead: 0, behind: 0, files: [], staged: [],
      renamed: [], created: [], deleted: [], modified: [], not_added: [], conflicted: [],
      created_unmerged: [], deleted_unmerged: [], modified_unmerged: [],
      staged_count: 0, files_count: 0, isClean: () => true } as unknown as StatusResult;
  }

  /** 获取提交历史 */
  async getLog(repoName: string, maxCount: number = 50): Promise<LogResult> {
    const git = simpleGit(this.getRepoPath(repoName));
    const log = await git.log({ maxCount });
    this.syncCommitsToDb(repoName, log.all).catch(() => {});
    return log;
  }

  private async syncCommitsToDb(repoName: string, commits: readonly any[]): Promise<void> {
    const repo = RepositoryModel.findByName(repoName);
    if (!repo) return;
    for (const c of commits) {
      RepositoryModel.addCommit(repo.id, c.hash, c.message, c.author_name || '', c.author_email || '', c.date || '');
    }
  }

  /** 用 git ls-tree 列出文件 */
  async getFiles(repoName: string, dirPath: string = ''): Promise<{name: string; path: string; type: 'file' | 'dir'; size: number}[]> {
    const repoPath = this.getRepoPath(repoName);
    try {
      const args = dirPath ? ['ls-tree', 'HEAD', dirPath + '/'] : ['ls-tree', 'HEAD'];
      const output = this.gitExec(repoPath, args);
      if (!output) return [];

      return output.split('\n').filter(Boolean).map(line => {
        const parts = line.split(/\s+/);
        if (parts.length < 4) return null;
        const type = parts[1] as 'blob' | 'tree';
        const hash = parts[2];
        const fullName = parts.slice(3).join(' ');
        const stripPrefix = dirPath ? dirPath + '/' : '';
        const name = fullName.replace(stripPrefix, '');
        if (!name) return null;
        return {
          name,
          path: fullName,
          type: type === 'tree' ? 'dir' as const : 'file' as const,
          size: type === 'blob' ? parseInt(this.gitExec(repoPath, ['cat-file', '-s', hash])) : 0,
        };
      }).filter(Boolean) as {name: string; path: string; type: 'file' | 'dir'; size: number}[];
    } catch { return []; }
  }

  /** 用 git show 读取文件内容 */
  async getFileContent(repoName: string, filePath: string): Promise<string> {
    try {
      return this.gitExec(this.getRepoPath(repoName), ['show', 'HEAD:' + filePath]);
    } catch { throw new Error('文件 ' + filePath + ' 不存在或非文本文件'); }
  }

  /** 获取分支列表 */
  async getBranches(repoName: string): Promise<string[]> {
    const git = simpleGit(this.getRepoPath(repoName));
    const branches = await git.branchLocal();
    const repo = RepositoryModel.findByName(repoName);
    if (repo) {
      for (const b of branches.all) RepositoryModel.addBranch(repo.id, b, b === branches.current);
    }
    return branches.all;
  }

  /** 获取当前分支 */
  async getCurrentBranch(repoName: string): Promise<string> {
    try { return this.gitExec(this.getRepoPath(repoName), ['symbolic-ref', '--short', 'HEAD']); }
    catch { return 'master'; }
  }

  /** 创建分支 */
  async createBranch(repoName: string, branchName: string): Promise<void> {
    const git = simpleGit(this.getRepoPath(repoName));
    await git.checkoutLocalBranch(branchName);
    const repo = RepositoryModel.findByName(repoName);
    if (repo) RepositoryModel.addBranch(repo.id, branchName);
  }

  /** 切换分支 */
  async switchBranch(repoName: string, branchName: string): Promise<void> {
    const git = simpleGit(this.getRepoPath(repoName));
    await git.checkout(branchName);
  }

  /** add 文件（bare 仓库用 plumbing） */
  async addFiles(repoName: string, files: string[]): Promise<void> {
    const repoPath = this.getRepoPath(repoName);
    for (const file of files) {
      const fullPath = path.join(repoPath, file);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const hash = this.gitExec(repoPath, ['hash-object', '-w', '--stdin'], content);
        this.gitExec(repoPath, ['update-index', '--add', '--cacheinfo', '100644', hash, file]);
      }
    }
  }

  /** 提交（bare 仓库用 plumbing） */
  async commit(repoName: string, message: string): Promise<void> {
    const repoPath = this.getRepoPath(repoName);
    const treeHash = this.gitExec(repoPath, ['write-tree']);
    const parentHash = this.gitExec(repoPath, ['rev-parse', 'HEAD']);
    const commitHash = this.gitExec(repoPath, ['commit-tree', treeHash, '-p', parentHash, '-m', message]);
    this.gitExec(repoPath, ['update-ref', 'HEAD', commitHash]);
    const repo = RepositoryModel.findByName(repoName);
    if (repo) RepositoryModel.addCommit(repo.id, commitHash, message, '', '', new Date().toISOString());
  }

  /** 获取仓库信息 */
  async getRepositoryInfo(repoName: string): Promise<any> {
    const repoPath = this.getRepoPath(repoName);
    const git = simpleGit(repoPath);
    const [log, branches] = await Promise.all([git.log({ maxCount: 10 }), git.branchLocal()]);
    const dbRecord = RepositoryModel.findByName(repoName);
    if (dbRecord) {
      for (const b of branches.all) RepositoryModel.addBranch(dbRecord.id, b, b === branches.current);
      if (log.all.length > 0) this.syncCommitsToDb(repoName, log.all).catch(() => {});
    }
    return {
      name: repoName, path: repoPath, currentBranch: branches.current || 'master',
      branches: branches.all, lastCommit: log.latest, totalCommits: log.total,
      description: dbRecord?.description || '', created_at: dbRecord?.created_at || null,
      status: { modified: [], notAdded: [], deleted: [], created: [] },
    };
  }

  /** 仓库列表 */
  async listRepositories(): Promise<string[]> {
    const dbRecords = RepositoryModel.findAll();
    if (dbRecords.length > 0) {
      const valid: string[] = [];
      for (const r of dbRecords) {
        if (this.isGitRepo(r.path)) valid.push(r.name);
        else RepositoryModel.delete(r.id);
      }
      return valid;
    }
    const repos: string[] = [];
    if (fs.existsSync(this.basePath)) {
      for (const item of fs.readdirSync(this.basePath)) {
        if (this.isGitRepo(path.join(this.basePath, item))) {
          repos.push(item);
          await this.syncToDatabase(item).catch(() => {});
        }
      }
    }
    return repos;
  }

  private async syncToDatabase(repoName: string): Promise<void> {
    if (RepositoryModel.findByName(repoName)) return;
    const repoPath = this.getRepoPath(repoName);
    try {
      const git = simpleGit(repoPath);
      const branches = await git.branchLocal();
      const log = await git.log({ maxCount: 1 });
      const repo = RepositoryModel.create({ name: repoName, path: repoPath, default_branch: branches.current || 'master' });
      for (const b of branches.all) RepositoryModel.addBranch(repo.id, b, b === branches.current);
      if (log.latest) RepositoryModel.addCommit(repo.id, log.latest.hash, log.latest.message, log.latest.author_name, log.latest.author_email, log.latest.date);
    } catch { /* ignore */ }
  }

  /** 删除仓库 */
  async deleteRepository(repoName: string): Promise<void> {
    const repoPath = this.getRepoPath(repoName);
    if (!fs.existsSync(repoPath)) throw new Error('仓库 ' + repoName + ' 不存在');
    fs.rmSync(repoPath, { recursive: true, force: true });
    RepositoryModel.deleteByName(repoName);
  }

  /** 克隆远程仓库（bare） */
  async cloneRepository(url: string, repoName?: string): Promise<string> {
    const name = repoName || url.split('/').pop()?.replace('.git', '') || 'cloned-repo';
    const repoPath = this.getRepoPath(name);
    if (fs.existsSync(repoPath)) throw new Error('仓库 ' + name + ' 已存在');

    const git = simpleGit();
    await git.clone(url, repoPath, ['--bare']);

    const localGit = simpleGit(repoPath);
    const branches = await localGit.branchLocal();
    const log = await localGit.log({ maxCount: 1 });
    const repo = RepositoryModel.create({ name, path: repoPath, remote_url: url, default_branch: branches.current || 'master' });
    for (const b of branches.all) RepositoryModel.addBranch(repo.id, b, b === branches.current);
    if (log.latest) RepositoryModel.addCommit(repo.id, log.latest.hash, log.latest.message, log.latest.author_name, log.latest.author_email, log.latest.date);
    if (url) RepositoryModel.addRemote(repo.id, 'origin', url);
    return repoPath;
  }

  /** 添加远程 */
  async addRemote(repoName: string, remoteName: string, url: string): Promise<void> {
    const git = simpleGit(this.getRepoPath(repoName));
    await git.addRemote(remoteName, url);
    const repo = RepositoryModel.findByName(repoName);
    if (repo) RepositoryModel.addRemote(repo.id, remoteName, url);
  }

  /** 获取远程列表 */
  async getRemotes(repoName: string): Promise<any[]> {
    const git = simpleGit(this.getRepoPath(repoName));
    const remotes = await git.getRemotes(true);
    const repo = RepositoryModel.findByName(repoName);
    if (repo) { for (const r of remotes) RepositoryModel.addRemote(repo.id, r.name, r.refs?.fetch || ''); }
    return remotes;
  }

  /** 推送 */
  async push(repoName: string, remote: string = 'origin', branch?: string): Promise<void> {
    const git = simpleGit(this.getRepoPath(repoName));
    if (branch) await git.push(remote, branch); else await git.push(remote);
  }

  /** 拉取 */
  async pull(repoName: string, remote: string = 'origin', branch?: string): Promise<void> {
    const git = simpleGit(this.getRepoPath(repoName));
    if (branch) await git.pull(remote, branch); else await git.pull(remote);
    const log = await git.log({ maxCount: 10 });
    this.syncCommitsToDb(repoName, log.all).catch(() => {});
  }

  /** 获取远程信息 */
  async getRemoteInfo(repoName: string, remote: string = 'origin'): Promise<any> {
    const git = simpleGit(this.getRepoPath(repoName));
    try { const url = await git.remote(['get-url', remote]); return { name: remote, url: (url || '').trim() }; }
    catch { return null; }
  }

  /** 设置配置 */
  async setConfig(repoName: string, key: string, value: string): Promise<void> {
    await simpleGit(this.getRepoPath(repoName)).addConfig(key, value);
  }

  /** 获取配置 */
  async getConfig(repoName: string, key: string): Promise<string> {
    const result = await simpleGit(this.getRepoPath(repoName)).listConfig();
    const v = result.all[key];
    return Array.isArray(v) ? v[0] : (v || '');
  }

  /** 快速提交并推送 */
  async quickCommitAndPush(repoName: string, message: string, remote: string = 'origin', branch?: string): Promise<void> {
    const repoPath = this.getRepoPath(repoName);
    const treeHash = this.gitExec(repoPath, ['write-tree']);
    try {
      const parentHash = this.gitExec(repoPath, ['rev-parse', 'HEAD']);
      const commitHash = this.gitExec(repoPath, ['commit-tree', treeHash, '-p', parentHash, '-m', message]);
      this.gitExec(repoPath, ['update-ref', 'HEAD', commitHash]);
      const git = simpleGit(repoPath);
      if (branch) await git.push(remote, branch); else await git.push(remote);
      const repo = RepositoryModel.findByName(repoName);
      if (repo) RepositoryModel.addCommit(repo.id, commitHash, message, '', '', new Date().toISOString());
    } catch { /* no parent, first commit */ }
  }

  /** 快速拉取 */
  async quickPullAndMerge(repoName: string, remote: string = 'origin', branch?: string): Promise<void> {
    const git = simpleGit(this.getRepoPath(repoName));
    if (branch) await git.pull(remote, branch); else await git.pull(remote);
    const log = await git.log({ maxCount: 10 });
    this.syncCommitsToDb(repoName, log.all).catch(() => {});
  }

  /** 统计信息 */
  async getRepositoryStats(): Promise<any> {
    const repos = RepositoryModel.findAll();
    return {
      totalRepositories: repos.length,
      repositories: repos.map(r => r.name),
      details: repos.map(r => ({
        id: r.id, name: r.name, description: r.description,
        default_branch: r.default_branch, created_at: r.created_at, updated_at: r.updated_at,
      }))
    };
  }
}

export const gitService = new GitService();