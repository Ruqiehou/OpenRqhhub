import { Router, Request, Response } from 'express';
import { gitService, HttpError } from '../services/git';

const router = Router();

function sendError(res: Response, error: unknown): void {
  const statusCode = error instanceof HttpError ? error.statusCode : 500;
  const message = error instanceof Error ? error.message : '服务器内部错误';
  res.status(statusCode).json({ success: false, error: message });
}

/**
 * 获取仓库列表（带分页）
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const repositories = await gitService.listRepositories();
    
    // 简单的分页
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedRepos = repositories.slice(startIndex, endIndex);
    
    // 获取每个仓库的详细信息
    const repoDetails = await Promise.all(
      paginatedRepos.map(async (repoName) => {
        try {
          const info = await gitService.getRepositoryInfo(repoName);
          return info;
        } catch (error) {
          return { name: repoName, error: '无法获取仓库信息' };
        }
      })
    );
    
    res.json({
      success: true,
      data: {
        repositories: repoDetails,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: repositories.length,
          totalPages: Math.ceil(repositories.length / Number(limit))
        }
      }
    });
  } catch (error) {
    sendError(res, error);
  }
});

/**
 * 搜索仓库
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ success: false, error: '搜索关键词不能为空' });
    }
    
    const repositories = await gitService.listRepositories();
    const filteredRepos = repositories.filter(repo => 
      repo.toLowerCase().includes((q as string).toLowerCase())
    );
    
    res.json({ success: true, data: filteredRepos });
  } catch (error) {
    sendError(res, error);
  }
});

/**
 * 获取仓库统计信息
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const repositories = await gitService.listRepositories();
    
    // 这里可以添加更多统计信息
    const stats = {
      totalRepositories: repositories.length,
      repositories: repositories
    };
    
    res.json({ success: true, data: stats });
  } catch (error) {
    sendError(res, error);
  }
});

export { router as repositoryRoutes };