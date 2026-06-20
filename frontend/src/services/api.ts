import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 可以在这里添加认证token等
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// Git相关API
export const gitApi = {
  // 获取所有仓库
  getRepositories: () => api.get('/git/repositories'),
  
  // 创建新仓库
  createRepository: (name: string, description?: string) => 
    api.post('/git/repositories', { name, description }),
  
  // 获取仓库信息
  getRepositoryInfo: (repoName: string) => 
    api.get(`/git/repositories/${repoName}`),
  
  // 删除仓库
  deleteRepository: (repoName: string) => 
    api.delete(`/git/repositories/${repoName}`),
  
  // 获取仓库状态
  getStatus: (repoName: string) => 
    api.get(`/git/repositories/${repoName}/status`),
  
  // 获取提交历史
  getLog: (repoName: string, maxCount?: number) => 
    api.get(`/git/repositories/${repoName}/log`, { params: { maxCount } }),
  
  // 获取文件列表
  getFiles: (repoName: string, dirPath?: string) => 
    api.get(`/git/repositories/${repoName}/files`, { params: { path: dirPath } }),
  
  // 获取文件内容
  getFileContent: (repoName: string, filePath: string) => 
    api.get(`/git/repositories/${repoName}/file`, { params: { path: filePath } }),
  
  // 获取分支列表
  getBranches: (repoName: string) => 
    api.get(`/git/repositories/${repoName}/branches`),
  
  // 创建新分支
  createBranch: (repoName: string, branchName: string) => 
    api.post(`/git/repositories/${repoName}/branches`, { branchName }),
  
  // 切换分支
  switchBranch: (repoName: string, branchName: string) => 
    api.put(`/git/repositories/${repoName}/branches/${branchName}`),
  
  // 添加文件到暂存区
  addFiles: (repoName: string, files: string[]) => 
    api.post(`/git/repositories/${repoName}/add`, { files }),
  
  // 提交更改
  commit: (repoName: string, message: string) => 
    api.post(`/git/repositories/${repoName}/commit`, { message }),
  
  // 克隆远程仓库
  cloneRepository: (url: string, name?: string) => 
    api.post('/git/clone', { url, name }),
  
  // 添加远程仓库
  addRemote: (repoName: string, name: string, url: string) => 
    api.post(`/git/repositories/${repoName}/remotes`, { name, url }),
  
  // 获取远程仓库列表
  getRemotes: (repoName: string) => 
    api.get(`/git/repositories/${repoName}/remotes`),
  
  // 推送到远程仓库
  push: (repoName: string, remote?: string, branch?: string) => 
    api.post(`/git/repositories/${repoName}/push`, { remote, branch }),
  
  // 从远程仓库拉取
  pull: (repoName: string, remote?: string, branch?: string) => 
    api.post(`/git/repositories/${repoName}/pull`, { remote, branch }),
  
  // 快速提交并推送
  quickPush: (repoName: string, message: string, remote?: string, branch?: string) => 
    api.post(`/git/repositories/${repoName}/quick-push`, { message, remote, branch }),
  
  // 快速拉取并合并
  quickPull: (repoName: string, remote?: string, branch?: string) => 
    api.post(`/git/repositories/${repoName}/quick-pull`, { remote, branch }),
  
  // 设置Git配置
  setConfig: (repoName: string, key: string, value: string) => 
    api.post(`/git/repositories/${repoName}/config`, { key, value }),
  
  // 获取Git配置
  getConfig: (repoName: string, key: string) => 
    api.get(`/git/repositories/${repoName}/config`, { params: { key } }),
};

// 仓库相关API
export const repositoryApi = {
  // 获取仓库列表（带分页）
  getRepositories: (page?: number, limit?: number) => 
    api.get('/repository', { params: { page, limit } }),
  
  // 搜索仓库
  searchRepositories: (query: string) => 
    api.get('/repository/search', { params: { q: query } }),
  
  // 获取仓库统计信息
  getStats: () => api.get('/repository/stats'),
};

export default api;