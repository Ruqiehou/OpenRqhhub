import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { gitApi } from '../services/api';
import FileExplorer from '../components/FileExplorer';
import type { FileItem } from '../components/FileExplorer';
import FileViewer from '../components/FileViewer';

interface RepositoryInfo {
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

interface Commit {
  hash: string;
  date: string;
  message: string;
  author_name: string;
  author_email: string;
}

interface Remote {
  name: string;
  refs: {
    fetch: string;
    push: string;
  };
}

const RepositoryDetail: React.FC = () => {
  const { repoName } = useParams<{ repoName: string }>();
  const [repoInfo, setRepoInfo] = useState<RepositoryInfo | null>(null);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('files');
  const [remotes, setRemotes] = useState<Remote[]>([]);
  const [quickCommitMessage, setQuickCommitMessage] = useState('');
  const [quickOperationLoading, setQuickOperationLoading] = useState(false);
  const [viewingFile, setViewingFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [fileLoading, setFileLoading] = useState(false);

  useEffect(() => {
    if (repoName) loadRepositoryData();
  }, [repoName]);

  const loadRepositoryData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [infoRes, logRes, filesRes, remotesRes] = await Promise.all([
        gitApi.getRepositoryInfo(repoName!),
        gitApi.getLog(repoName!, 20),
        gitApi.getFiles(repoName!, currentPath),
        gitApi.getRemotes(repoName!).catch(() => ({ data: [] }))
      ]);
      setRepoInfo((infoRes as any).data);
      setCommits((logRes as any).data.all);
      setFiles((filesRes as any).data);
      setRemotes((remotesRes as any).data || []);
    } catch (err: any) {
      setError(err.message || '加载仓库信息失败');
    } finally { setLoading(false); }
  };

  const loadFiles = async (dirPath: string) => {
    try {
      setCurrentPath(dirPath);
      const res = await gitApi.getFiles(repoName!, dirPath);
      setFiles((res as any).data);
      setViewingFile(null);
    } catch (err: any) { console.error(err); }
  };

  const openFile = async (filePath: string) => {
    try {
      setFileLoading(true);
      const res = await gitApi.getFileContent(repoName!, filePath);
      setFileContent((res as any).data.content);
      setViewingFile(filePath);
    } catch (err: any) {
      setError('加载文件失败: ' + (err.message || ''));
    } finally { setFileLoading(false); }
  };

  const closeFile = () => { setViewingFile(null); setFileContent(''); };

  const goBack = () => loadFiles(currentPath.split('/').slice(0, -1).join('/'));
  const handleCreateBranch = async () => {
    const name = prompt('请输入新分支名称:');
    if (!name) return;
    try { await gitApi.createBranch(repoName!, name); loadRepositoryData(); } catch (err: any) { setError(err.message); }
  };
  const handleSwitchBranch = async (branchName: string) => {
    try { await gitApi.switchBranch(repoName!, branchName); loadRepositoryData(); } catch (err: any) { setError(err.message); }
  };
  const handleAddRemote = async () => {
    const name = prompt('远程仓库名称:'); if (!name) return;
    const url = prompt('远程仓库URL:'); if (!url) return;
    try { await gitApi.addRemote(repoName!, name, url); loadRepositoryData(); } catch (err: any) { setError(err.message); }
  };
  const handleQuickPush = async () => {
    if (!quickCommitMessage.trim()) { setError('请输入提交信息'); return; }
    try { setQuickOperationLoading(true); await gitApi.quickPush(repoName!, quickCommitMessage); setQuickCommitMessage(''); loadRepositoryData(); } catch (err: any) { setError(err.message); } finally { setQuickOperationLoading(false); }
  };
  const handleQuickPull = async () => {
    try { setQuickOperationLoading(true); await gitApi.quickPull(repoName!); loadRepositoryData(); } catch (err: any) { setError(err.message); } finally { setQuickOperationLoading(false); }
  };
  const handlePush = async () => {
    try { setQuickOperationLoading(true); await gitApi.push(repoName!); loadRepositoryData(); } catch (err: any) { setError(err.message); } finally { setQuickOperationLoading(false); }
  };
  const handlePull = async () => {
    try { setQuickOperationLoading(true); await gitApi.pull(repoName!); loadRepositoryData(); } catch (err: any) { setError(err.message); } finally { setQuickOperationLoading(false); }
  };

  if (loading) return <div className="loading">加载中...</div>;
  if (error) return <div className="error">错误: {error}</div>;
  if (!repoInfo) return <div className="error">仓库不存在</div>;

  return (
    <div className="repository-detail">
      <div className="repository-header">
        <div className="repository-title">
          <Link to="/repositories" className="back-link">← 返回仓库列表</Link>
          <h2>{repoInfo.name}</h2>
          <p className="repository-meta">分支: {repoInfo.currentBranch} | 提交: {repoInfo.totalCommits}</p>
        </div>
        <div className="repository-actions">
          <button onClick={handleCreateBranch} className="btn btn-secondary">创建分支</button>
        </div>
      </div>

      <div className="quick-git-operations">
        <h3>快速Git操作</h3>
        <div className="quick-git-form">
          <input type="text" placeholder="输入提交信息..." value={quickCommitMessage}
            onChange={(e) => setQuickCommitMessage(e.target.value)} className="quick-commit-input" />
          <div className="quick-git-buttons">
            <button onClick={handleQuickPush} disabled={quickOperationLoading} className="btn btn-primary">{quickOperationLoading ? '处理中...' : '快速提交并推送'}</button>
            <button onClick={handleQuickPull} disabled={quickOperationLoading} className="btn btn-secondary">{quickOperationLoading ? '处理中...' : '快速拉取'}</button>
            <button onClick={handlePush} disabled={quickOperationLoading} className="btn btn-outline">推送</button>
            <button onClick={handlePull} disabled={quickOperationLoading} className="btn btn-outline">拉取</button>
          </div>
        </div>
      </div>

      <div className="repository-tabs">
        {['files', 'commits', 'branches', 'remotes', 'config'].map(tab => (
          <button key={tab} className={`tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => { setActiveTab(tab); if (tab !== 'files') closeFile(); }}>{ {files:'文件',commits:'提交历史',branches:'分支',remotes:'远程仓库',config:'配置'}[tab] }</button>
        ))}
      </div>

      <div className="repository-content">
        {activeTab === 'files' && (
          viewingFile !== null ? (
            fileLoading ? <div className="loading">加载文件内容...</div> :
            <FileViewer fileName={viewingFile} content={fileContent} onClose={closeFile} />
          ) : (
            <FileExplorer files={files} currentPath={currentPath} onNavigate={loadFiles} onOpenFile={openFile} onGoBack={goBack} />
          )
        )}

        {activeTab === 'commits' && (
          <div className="commits-view">
            <h3>提交历史</h3>
            <div className="commit-list">
              {commits.length === 0 ? <div className="empty-state"><p>暂无提交记录</p></div> :
                commits.map((c, i) => (
                  <div key={i} className="commit-item">
                    <div className="commit-info">
                      <div className="commit-message">{c.message}</div>
                      <div className="commit-meta"><span>{c.author_name}</span><span> {new Date(c.date).toLocaleDateString()}</span></div>
                    </div>
                    <div className="commit-hash">{c.hash.substring(0, 7)}</div>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {activeTab === 'branches' && (
          <div className="branches-view">
            <h3>分支列表</h3>
            <div className="branch-list">
              {repoInfo.branches.map((b, i) => (
                <div key={i} className="branch-item">
                  <span className={`branch-name ${b === repoInfo.currentBranch ? 'current' : ''}`}>{b}{b === repoInfo.currentBranch && ' (当前)'}</span>
                  {b !== repoInfo.currentBranch && <button onClick={() => handleSwitchBranch(b)} className="btn btn-sm btn-secondary">切换</button>}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'remotes' && (
          <div className="remotes-view">
            <div className="remotes-header">
              <h3>远程仓库</h3>
              <button onClick={handleAddRemote} className="btn btn-primary">添加远程仓库</button>
            </div>
            <div className="remote-list">
              {remotes.length === 0 ? <div className="empty-state"><p>没有配置远程仓库</p></div> :
                remotes.map((r, i) => <div key={i} className="remote-item"><span className="remote-name">{r.name}</span><span className="remote-url">{r.refs?.fetch || '未知URL'}</span></div>)
              }
            </div>
          </div>
        )}

        {activeTab === 'config' && (
          <div className="config-view">
            <h3>Git配置</h3>
            <div className="config-info">
              <p>当前分支: {repoInfo.currentBranch}</p>
              <p>仓库路径: {repoInfo.path}</p>
              <p>总提交数: {repoInfo.totalCommits}</p>
            </div>
            <div className="config-help">
              <h4>常用Git命令</h4>
              <ul>
                <li><code>git clone {repoInfo.path}</code> - 克隆仓库</li>
                <li><code>git add .</code> - 添加所有文件</li>
                <li><code>git commit -m "message"</code> - 提交更改</li>
                <li><code>git push origin {repoInfo.currentBranch}</code> - 推送到远程</li>
                <li><code>git pull origin {repoInfo.currentBranch}</code> - 从远程拉取</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RepositoryDetail;