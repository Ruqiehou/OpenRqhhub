import { Router, Request, Response } from 'express';
import { gitService } from '../services/git';

const router = Router();

/**
 * 获取所有仓库列表
 */
router.get('/repositories', async (req: Request, res: Response) => {
  try {
    const repositories = await gitService.listRepositories();
    res.json({ success: true, data: repositories });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 创建新仓库
 */
router.post('/repositories', async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, error: '仓库名称不能为空' });
    }
    
    const repoPath = await gitService.createRepository(name, description);
    res.json({ success: true, data: { name, path: repoPath } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 获取仓库信息
 */
router.get('/repositories/:repoName', async (req: Request, res: Response) => {
  try {
    const repoName = req.params.repoName as string;
    const exists = await gitService.repositoryExists(repoName);
    
    if (!exists) {
      return res.status(404).json({ success: false, error: '仓库不存在' });
    }
    
    const info = await gitService.getRepositoryInfo(repoName);
    res.json({ success: true, data: info });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 删除仓库
 */
router.delete('/repositories/:repoName', async (req: Request, res: Response) => {
  try {
    const repoName = req.params.repoName as string;
    await gitService.deleteRepository(repoName);
    res.json({ success: true, message: '仓库已删除' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 获取仓库状态
 */
router.get('/repositories/:repoName/status', async (req: Request, res: Response) => {
  try {
    const repoName = req.params.repoName as string;
    const status = await gitService.getStatus(repoName);
    res.json({ success: true, data: status });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 获取提交历史
 */
router.get('/repositories/:repoName/log', async (req: Request, res: Response) => {
  try {
    const repoName = req.params.repoName as string;
    const { maxCount } = req.query;
    const log = await gitService.getLog(repoName, maxCount ? parseInt(maxCount as string) : 50);
    res.json({ success: true, data: log });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 获取文件列表
 */
router.get('/repositories/:repoName/files', async (req: Request, res: Response) => {
  try {
    const repoName = req.params.repoName as string;
    const { path: dirPath } = req.query;
    const files = await gitService.getFiles(repoName, dirPath as string || '');
    res.json({ success: true, data: files });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 获取文件内容
 */
router.get('/repositories/:repoName/file', async (req: Request, res: Response) => {
  try {
    const repoName = req.params.repoName as string;
    const { path: filePath } = req.query;
    
    if (!filePath) {
      return res.status(400).json({ success: false, error: '文件路径不能为空' });
    }
    
    const content = await gitService.getFileContent(repoName, filePath as string);
    res.json({ success: true, data: { content, path: filePath } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 获取分支列表
 */
router.get('/repositories/:repoName/branches', async (req: Request, res: Response) => {
  try {
    const repoName = req.params.repoName as string;
    const branches = await gitService.getBranches(repoName);
    res.json({ success: true, data: branches });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 创建新分支
 */
router.post('/repositories/:repoName/branches', async (req: Request, res: Response) => {
  try {
    const repoName = req.params.repoName as string;
    const { branchName } = req.body;
    
    if (!branchName) {
      return res.status(400).json({ success: false, error: '分支名称不能为空' });
    }
    
    await gitService.createBranch(repoName, branchName);
    res.json({ success: true, message: '分支已创建' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 切换分支
 */
router.put('/repositories/:repoName/branches/:branchName', async (req: Request, res: Response) => {
  try {
    const repoName = req.params.repoName as string;
    const branchName = req.params.branchName as string;
    await gitService.switchBranch(repoName, branchName);
    res.json({ success: true, message: '分支已切换' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 添加文件到暂存区
 */
router.post('/repositories/:repoName/add', async (req: Request, res: Response) => {
  try {
    const repoName = req.params.repoName as string;
    const { files } = req.body;
    
    if (!files || !Array.isArray(files)) {
      return res.status(400).json({ success: false, error: '文件列表不能为空' });
    }
    
    await gitService.addFiles(repoName, files);
    res.json({ success: true, message: '文件已添加到暂存区' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 提交更改
 */
router.post('/repositories/:repoName/commit', async (req: Request, res: Response) => {
  try {
    const repoName = req.params.repoName as string;
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ success: false, error: '提交信息不能为空' });
    }
    
    await gitService.commit(repoName, message);
    res.json({ success: true, message: '更改已提交' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 克隆远程仓库
 */
router.post('/clone', async (req: Request, res: Response) => {
  try {
    const { url, name } = req.body;
    
    if (!url) {
      return res.status(400).json({ success: false, error: '仓库URL不能为空' });
    }
    
    const repoPath = await gitService.cloneRepository(url, name);
    res.json({ success: true, data: { path: repoPath } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 添加远程仓库
 */
router.post('/repositories/:repoName/remotes', async (req: Request, res: Response) => {
  try {
    const repoName = req.params.repoName as string;
    const { name, url } = req.body;
    
    if (!name || !url) {
      return res.status(400).json({ success: false, error: '远程仓库名称和URL不能为空' });
    }
    
    await gitService.addRemote(repoName, name, url);
    res.json({ success: true, message: '远程仓库已添加' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 获取远程仓库列表
 */
router.get('/repositories/:repoName/remotes', async (req: Request, res: Response) => {
  try {
    const repoName = req.params.repoName as string;
    const remotes = await gitService.getRemotes(repoName);
    res.json({ success: true, data: remotes });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 推送到远程仓库
 */
router.post('/repositories/:repoName/push', async (req: Request, res: Response) => {
  try {
    const repoName = req.params.repoName as string;
    const { remote = 'origin', branch } = req.body;
    
    await gitService.push(repoName, remote, branch);
    res.json({ success: true, message: '推送成功' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 从远程仓库拉取
 */
router.post('/repositories/:repoName/pull', async (req: Request, res: Response) => {
  try {
    const repoName = req.params.repoName as string;
    const { remote = 'origin', branch } = req.body;
    
    await gitService.pull(repoName, remote, branch);
    res.json({ success: true, message: '拉取成功' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 快速提交并推送
 */
router.post('/repositories/:repoName/quick-push', async (req: Request, res: Response) => {
  try {
    const repoName = req.params.repoName as string;
    const { message, remote = 'origin', branch } = req.body;
    
    if (!message) {
      return res.status(400).json({ success: false, error: '提交信息不能为空' });
    }
    
    await gitService.quickCommitAndPush(repoName, message, remote, branch);
    res.json({ success: true, message: '快速提交并推送成功' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 快速拉取并合并
 */
router.post('/repositories/:repoName/quick-pull', async (req: Request, res: Response) => {
  try {
    const repoName = req.params.repoName as string;
    const { remote = 'origin', branch } = req.body;
    
    await gitService.quickPullAndMerge(repoName, remote, branch);
    res.json({ success: true, message: '快速拉取并合并成功' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 设置Git配置
 */
router.post('/repositories/:repoName/config', async (req: Request, res: Response) => {
  try {
    const repoName = req.params.repoName as string;
    const { key, value } = req.body;
    
    if (!key || value === undefined) {
      return res.status(400).json({ success: false, error: '配置键和值不能为空' });
    }
    
    await gitService.setConfig(repoName, key, value);
    res.json({ success: true, message: '配置已设置' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 获取Git配置
 */
router.get('/repositories/:repoName/config', async (req: Request, res: Response) => {
  try {
    const repoName = req.params.repoName as string;
    const { key } = req.query;
    
    if (!key) {
      return res.status(400).json({ success: false, error: '配置键不能为空' });
    }
    
    const value = await gitService.getConfig(repoName, key as string);
    res.json({ success: true, data: { key, value } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export { router as gitRoutes };