import { Router, Request, Response } from 'express';
import { gitService } from '../services/git';

const router = Router();

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
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
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
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
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
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export { router as repositoryRoutes };