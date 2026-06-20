import { getDatabase } from './database';

export interface RepositoryRecord {
  id: number;
  name: string;
  description: string;
  path: string;
  default_branch: string;
  remote_url: string;
  is_bare: number;
  size_bytes: number;
  created_at: string;
  updated_at: string;
}

export interface CreateRepositoryParams {
  name: string;
  description?: string;
  path: string;
  default_branch?: string;
  remote_url?: string;
}

export interface BranchRecord {
  id: number;
  repo_id: number;
  name: string;
  is_default: number;
  last_commit_hash: string;
  updated_at: string;
}

export interface CommitRecord {
  id: number;
  repo_id: number;
  hash: string;
  message: string;
  author_name: string;
  author_email: string;
  committed_at: string;
}

export interface RemoteRecord {
  id: number;
  repo_id: number;
  name: string;
  url: string;
  created_at: string;
}

export class RepositoryModel {
  /**
   * 创建仓库记录
   */
  static create(params: CreateRepositoryParams): RepositoryRecord {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO repositories (name, description, path, default_branch, remote_url)
      VALUES (@name, @description, @path, @default_branch, @remote_url)
    `);
    
    const result = stmt.run({
      name: params.name,
      description: params.description || '',
      path: params.path,
      default_branch: params.default_branch || 'master',
      remote_url: params.remote_url || '',
    });
    
    return this.findById(result.lastInsertRowid as number)!;
  }

  /**
   * 根据ID查找仓库
   */
  static findById(id: number): RepositoryRecord | undefined {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM repositories WHERE id = ?');
    return stmt.get(id) as RepositoryRecord | undefined;
  }

  /**
   * 根据名称查找仓库
   */
  static findByName(name: string): RepositoryRecord | undefined {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM repositories WHERE name = ?');
    return stmt.get(name) as RepositoryRecord | undefined;
  }

  /**
   * 获取所有仓库
   */
  static findAll(): RepositoryRecord[] {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM repositories ORDER BY updated_at DESC');
    return stmt.all() as RepositoryRecord[];
  }

  /**
   * 搜索仓库
   */
  static search(query: string): RepositoryRecord[] {
    const db = getDatabase();
    const stmt = db.prepare(
      'SELECT * FROM repositories WHERE name LIKE ? OR description LIKE ? ORDER BY updated_at DESC'
    );
    const searchPattern = `%${query}%`;
    return stmt.all(searchPattern, searchPattern) as RepositoryRecord[];
  }

  /**
   * 更新仓库
   */
  static update(id: number, params: Partial<RepositoryRecord>): void {
    const db = getDatabase();
    const fields: string[] = [];
    const values: any[] = [];

    if (params.description !== undefined) {
      fields.push('description = ?');
      values.push(params.description);
    }
    if (params.default_branch !== undefined) {
      fields.push('default_branch = ?');
      values.push(params.default_branch);
    }
    if (params.remote_url !== undefined) {
      fields.push('remote_url = ?');
      values.push(params.remote_url);
    }
    if (params.size_bytes !== undefined) {
      fields.push('size_bytes = ?');
      values.push(params.size_bytes);
    }

    if (fields.length > 0) {
      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);
      const stmt = db.prepare(`UPDATE repositories SET ${fields.join(', ')} WHERE id = ?`);
      stmt.run(...values);
    }
  }

  /**
   * 删除仓库
   */
  static delete(id: number): void {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM repositories WHERE id = ?');
    stmt.run(id);
  }

  /**
   * 根据名称删除仓库
   */
  static deleteByName(name: string): void {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM repositories WHERE name = ?');
    stmt.run(name);
  }

  /**
   * 统计仓库数量
   */
  static count(): number {
    const db = getDatabase();
    const stmt = db.prepare('SELECT COUNT(*) as count FROM repositories');
    const result = stmt.get() as { count: number };
    return result.count;
  }

  // ========== 分支操作 ==========

  /**
   * 添加分支
   */
  static addBranch(repoId: number, name: string, isDefault: boolean = false): void {
    const db = getDatabase();
    
    if (isDefault) {
      db.prepare('UPDATE branches SET is_default = 0 WHERE repo_id = ?').run(repoId);
    }
    
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO branches (repo_id, name, is_default)
      VALUES (?, ?, ?)
    `);
    stmt.run(repoId, name, isDefault ? 1 : 0);
  }

  /**
   * 获取仓库的所有分支
   */
  static getBranches(repoId: number): BranchRecord[] {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM branches WHERE repo_id = ? ORDER BY name');
    return stmt.all(repoId) as BranchRecord[];
  }

  /**
   * 删除分支
   */
  static deleteBranch(repoId: number, name: string): void {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM branches WHERE repo_id = ? AND name = ?');
    stmt.run(repoId, name);
  }

  // ========== 提交操作 ==========

  /**
   * 添加提交记录
   */
  static addCommit(repoId: number, hash: string, message: string, authorName: string, authorEmail: string, committedAt: string): void {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO commits (repo_id, hash, message, author_name, author_email, committed_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(repoId, hash, message, authorName, authorEmail, committedAt);
  }

  /**
   * 获取仓库的提交历史
   */
  static getCommits(repoId: number, limit: number = 50): CommitRecord[] {
    const db = getDatabase();
    const stmt = db.prepare(
      'SELECT * FROM commits WHERE repo_id = ? ORDER BY committed_at DESC LIMIT ?'
    );
    return stmt.all(repoId, limit) as CommitRecord[];
  }

  // ========== 远程仓库操作 ==========

  /**
   * 添加远程仓库
   */
  static addRemote(repoId: number, name: string, url: string): void {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO remotes (repo_id, name, url)
      VALUES (?, ?, ?)
    `);
    stmt.run(repoId, name, url);
  }

  /**
   * 获取仓库的远程仓库列表
   */
  static getRemotes(repoId: number): RemoteRecord[] {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM remotes WHERE repo_id = ? ORDER BY name');
    return stmt.all(repoId) as RemoteRecord[];
  }

  /**
   * 删除远程仓库
   */
  static deleteRemote(repoId: number, name: string): void {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM remotes WHERE repo_id = ? AND name = ?');
    stmt.run(repoId, name);
  }
}

export default RepositoryModel;