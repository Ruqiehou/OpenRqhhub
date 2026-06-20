import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { repositoryApi } from '../services/api';

interface Repository {
  name: string;
  path: string;
  currentBranch: string;
  branches: string[];
  lastCommit: any;
  totalCommits: number;
  status: {
    modified: string[];
    notAdded: string[];
    deleted: string[];
    created: string[];
  };
}

interface Stats {
  totalRepositories: number;
  repositories: string[];
}

const Dashboard: React.FC = () => {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 并行加载数据
      const [reposResponse, statsResponse] = await Promise.all([
        repositoryApi.getRepositories(1, 5),
        repositoryApi.getStats()
      ]);
      
      setRepositories((reposResponse as any).data.repositories);
      setStats((statsResponse as any).data);
    } catch (err: any) {
      setError(err.message || '加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  if (error) {
    return <div className="error">错误: {error}</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>仪表板</h2>
        <Link to="/create" className="btn btn-primary">
          创建新仓库
        </Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>总仓库数</h3>
          <p className="stat-number">{stats?.totalRepositories || 0}</p>
        </div>
        <div className="stat-card">
          <h3>最近活动</h3>
          <p className="stat-number">{repositories.length}</p>
        </div>
      </div>

      <div className="recent-repositories">
        <h3>最近仓库</h3>
        {repositories.length === 0 ? (
          <div className="empty-state">
            <p>还没有仓库</p>
            <Link to="/create" className="btn btn-primary">
              创建第一个仓库
            </Link>
          </div>
        ) : (
          <div className="repository-list">
            {repositories.map((repo) => (
              <div key={repo.name} className="repository-card">
                <div className="repository-info">
                  <h4>
                    <Link to={`/repositories/${repo.name}`}>{repo.name}</Link>
                  </h4>
                  <p className="repository-meta">
                    分支: {repo.currentBranch} | 提交: {repo.totalCommits}
                  </p>
                  {repo.lastCommit && (
                    <p className="last-commit">
                      最后提交: {repo.lastCommit.message}
                    </p>
                  )}
                </div>
                <div className="repository-status">
                  {repo.status.modified.length > 0 && (
                    <span className="badge badge-modified">
                      {repo.status.modified.length} 修改
                    </span>
                  )}
                  {repo.status.created.length > 0 && (
                    <span className="badge badge-created">
                      {repo.status.created.length} 新增
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;