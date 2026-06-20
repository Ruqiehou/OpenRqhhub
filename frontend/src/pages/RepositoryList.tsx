import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { repositoryApi, gitApi } from '../services/api';

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

const RepositoryList: React.FC = () => {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadRepositories();
  }, [currentPage]);

  const loadRepositories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await repositoryApi.getRepositories(currentPage, 10);
      const data = (response as any).data;
      
      setRepositories(data.repositories);
      setTotalPages(data.pagination.totalPages);
    } catch (err: any) {
      setError(err.message || '加载仓库列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadRepositories();
      return;
    }
    
    try {
      setLoading(true);
      const response = await repositoryApi.searchRepositories(searchQuery);
      const data = (response as any).data;
      setRepositories(data.map((name: string) => ({ name })));
    } catch (err: any) {
      setError(err.message || '搜索失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (repoName: string) => {
    if (!window.confirm(`确定要删除仓库 "${repoName}" 吗？`)) {
      return;
    }
    
    try {
      await gitApi.deleteRepository(repoName);
      loadRepositories();
    } catch (err: any) {
      setError(err.message || '删除仓库失败');
    }
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  if (error) {
    return <div className="error">错误: {error}</div>;
  }

  return (
    <div className="repository-list-page">
      <div className="page-header">
        <h2>仓库列表</h2>
        <Link to="/create" className="btn btn-primary">
          创建新仓库
        </Link>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="搜索仓库..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button onClick={handleSearch} className="btn btn-secondary">
          搜索
        </button>
      </div>

      {repositories.length === 0 ? (
        <div className="empty-state">
          <p>没有找到仓库</p>
          <Link to="/create" className="btn btn-primary">
            创建第一个仓库
          </Link>
        </div>
      ) : (
        <>
          <div className="repository-grid">
            {repositories.map((repo) => (
              <div key={repo.name} className="repository-card">
                <div className="repository-header">
                  <h3>
                    <Link to={`/repositories/${repo.name}`}>{repo.name}</Link>
                  </h3>
                  <div className="repository-actions">
                    <button
                      onClick={() => handleDelete(repo.name)}
                      className="btn btn-danger btn-sm"
                    >
                      删除
                    </button>
                  </div>
                </div>
                
                <div className="repository-details">
                  <p className="repository-meta">
                    分支: {repo.currentBranch || 'main'} | 提交: {repo.totalCommits || 0}
                  </p>
                  {repo.lastCommit && (
                    <p className="last-commit">
                      最后提交: {repo.lastCommit.message}
                    </p>
                  )}
                </div>
                
                <div className="repository-status">
                  {repo.status?.modified?.length > 0 && (
                    <span className="badge badge-modified">
                      {repo.status.modified.length} 修改
                    </span>
                  )}
                  {repo.status?.created?.length > 0 && (
                    <span className="badge badge-created">
                      {repo.status.created.length} 新增
                    </span>
                  )}
                  {repo.status?.deleted?.length > 0 && (
                    <span className="badge badge-deleted">
                      {repo.status.deleted.length} 删除
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="btn btn-secondary"
              >
                上一页
              </button>
              <span className="page-info">
                第 {currentPage} 页，共 {totalPages} 页
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="btn btn-secondary"
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RepositoryList;