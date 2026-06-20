import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// 数据库文件路径
const DB_PATH = path.resolve('./data/gitlocal.db');

let db: Database.Database;

/**
 * 获取数据库实例（单例）
 */
export function getDatabase(): Database.Database {
  if (!db) {
    // 确保数据目录存在
    const dbDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    db = new Database(DB_PATH);

    // 启用WAL模式提升性能
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    // 初始化表结构
    initializeDatabase(db);
  }
  return db;
}

/**
 * 初始化数据库表结构
 */
function initializeDatabase(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS repositories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT DEFAULT '',
      path TEXT NOT NULL,
      default_branch TEXT DEFAULT 'master',
      remote_url TEXT DEFAULT '',
      is_bare INTEGER DEFAULT 0,
      size_bytes INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS branches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      repo_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      is_default INTEGER DEFAULT 0,
      last_commit_hash TEXT DEFAULT '',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (repo_id) REFERENCES repositories(id) ON DELETE CASCADE,
      UNIQUE(repo_id, name)
    );

    CREATE TABLE IF NOT EXISTS commits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      repo_id INTEGER NOT NULL,
      hash TEXT NOT NULL,
      message TEXT DEFAULT '',
      author_name TEXT DEFAULT '',
      author_email TEXT DEFAULT '',
      committed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (repo_id) REFERENCES repositories(id) ON DELETE CASCADE,
      UNIQUE(repo_id, hash)
    );

    CREATE TABLE IF NOT EXISTS remotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      repo_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (repo_id) REFERENCES repositories(id) ON DELETE CASCADE,
      UNIQUE(repo_id, name)
    );

    CREATE INDEX IF NOT EXISTS idx_repositories_name ON repositories(name);
    CREATE INDEX IF NOT EXISTS idx_branches_repo_id ON branches(repo_id);
    CREATE INDEX IF NOT EXISTS idx_commits_repo_id ON commits(repo_id);
    CREATE INDEX IF NOT EXISTS idx_remotes_repo_id ON remotes(repo_id);
  `);
}

/**
 * 关闭数据库连接
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
  }
}

export default getDatabase;