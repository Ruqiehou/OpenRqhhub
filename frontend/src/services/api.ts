import axios from 'axios';
import type { FileItem } from '../components/FileExplorer';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  ?? `http://${window.location.hostname}:3001/api`;

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface GitCommit {
  hash: string;
  date: string;
  message: string;
  author_name: string;
  author_email: string;
}

export interface GitLog {
  all: GitCommit[];
  latest: GitCommit | null;
  total: number;
}

export interface RepositoryInfo {
  name: string;
  path: string;
  currentBranch: string;
  branches: string[];
  lastCommit: GitCommit | null;
  totalCommits: number;
  description?: string;
  created_at?: string | null;
  status: {
    modified: string[];
    notAdded: string[];
    deleted: string[];
    created: string[];
  };
}

export interface RemoteInfo {
  name: string;
  refs?: {
    fetch?: string;
    push?: string;
  };
}

export interface RepositoryListData {
  repositories: RepositoryInfo[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface RepositoryStats {
  totalRepositories: number;
  repositories: string[];
}

export interface FileContentData {
  content: string;
  path: string;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

const get = <T>(url: string, config?: Parameters<typeof api.get>[1]) =>
  api.get<unknown, ApiResponse<T>>(url, config);

const post = <T>(url: string, data?: unknown, config?: Parameters<typeof api.post>[2]) =>
  api.post<unknown, ApiResponse<T>>(url, data, config);

const put = <T>(url: string, data?: unknown, config?: Parameters<typeof api.put>[2]) =>
  api.put<unknown, ApiResponse<T>>(url, data, config);

const del = <T>(url: string, config?: Parameters<typeof api.delete>[1]) =>
  api.delete<unknown, ApiResponse<T>>(url, config);

export const gitApi = {
  getRepositories: () => get<string[]>('/git/repositories'),
  createRepository: (name: string, description?: string) =>
    post<{ name: string; path: string }>('/git/repositories', { name, description }),
  getRepositoryInfo: (repoName: string) =>
    get<RepositoryInfo>(`/git/repositories/${repoName}`),
  deleteRepository: (repoName: string) =>
    del<{ message: string }>(`/git/repositories/${repoName}`),
  getStatus: (repoName: string) =>
    get<RepositoryInfo['status']>(`/git/repositories/${repoName}/status`),
  getLog: (repoName: string, maxCount?: number) =>
    get<GitLog>(`/git/repositories/${repoName}/log`, { params: { maxCount } }),
  getFiles: (repoName: string, dirPath?: string) =>
    get<FileItem[]>(`/git/repositories/${repoName}/files`, { params: { path: dirPath } }),
  getFileContent: (repoName: string, filePath: string) =>
    get<FileContentData>(`/git/repositories/${repoName}/file`, { params: { path: filePath } }),
  getBranches: (repoName: string) =>
    get<string[]>(`/git/repositories/${repoName}/branches`),
  createBranch: (repoName: string, branchName: string) =>
    post<{ message: string }>(`/git/repositories/${repoName}/branches`, { branchName }),
  switchBranch: (repoName: string, branchName: string) =>
    put<{ message: string }>(`/git/repositories/${repoName}/branches/${branchName}`),
  addFiles: (repoName: string, files: string[]) =>
    post<{ message: string }>(`/git/repositories/${repoName}/add`, { files }),
  commit: (repoName: string, message: string) =>
    post<{ message: string }>(`/git/repositories/${repoName}/commit`, { message }),
  cloneRepository: (url: string, name?: string) =>
    post<{ path: string }>('/git/clone', { url, name }),
  addRemote: (repoName: string, name: string, url: string) =>
    post<{ message: string }>(`/git/repositories/${repoName}/remotes`, { name, url }),
  getRemotes: (repoName: string) =>
    get<RemoteInfo[]>(`/git/repositories/${repoName}/remotes`),
  push: (repoName: string, remote?: string, branch?: string) =>
    post<{ message: string }>(`/git/repositories/${repoName}/push`, { remote, branch }),
  pull: (repoName: string, remote?: string, branch?: string) =>
    post<{ message: string }>(`/git/repositories/${repoName}/pull`, { remote, branch }),
  quickPush: (repoName: string, message: string, remote?: string, branch?: string) =>
    post<{ message: string }>(`/git/repositories/${repoName}/quick-push`, { message, remote, branch }),
  quickPull: (repoName: string, remote?: string, branch?: string) =>
    post<{ message: string }>(`/git/repositories/${repoName}/quick-pull`, { remote, branch }),
  setConfig: (repoName: string, key: string, value: string) =>
    post<{ message: string }>(`/git/repositories/${repoName}/config`, { key, value }),
  getConfig: (repoName: string, key: string) =>
    get<{ key: string; value: string }>(`/git/repositories/${repoName}/config`, { params: { key } }),
};

export const repositoryApi = {
  getRepositories: (page?: number, limit?: number) =>
    get<RepositoryListData>('/repository', { params: { page, limit } }),
  searchRepositories: (query: string) =>
    get<string[]>('/repository/search', { params: { q: query } }),
  getStats: () => get<RepositoryStats>('/repository/stats'),
};

export default api;
