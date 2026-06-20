import { Router, Request, Response } from 'express';
import { spawnSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import express from 'express';

const router = Router();

// Git 仓库存储根目录
const REPOS_BASE = path.resolve('./repositories');

/**
 * 收集请求 body 原始 buffer
 */
function collectBody(req: Request): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

/**
 * 执行 git http-backend 并返回结果
 */
function executeGitBackend(
  method: string,
  pathInfo: string,
  queryString: string,
  contentType: string | undefined,
  contentLength: string | undefined,
  body: Buffer
): { status: number; headers: Record<string, string>; body: string | Buffer } {
  
  // 构建 git http-backend 的环境变量
  const env: Record<string, string> = {
    ...process.env as Record<string, string>,
    REQUEST_METHOD: method,
    PATH_INFO: pathInfo,
    QUERY_STRING: queryString || '',
    GIT_PROJECT_ROOT: REPOS_BASE,
    GIT_HTTP_EXPORT_ALL: '1',
    CONTENT_TYPE: contentType || '',
    CONTENT_LENGTH: contentLength || '0',
    SERVER_PROTOCOL: 'HTTP/1.1',
    SERVER_SOFTWARE: 'GitLocal/1.0',
    GIT_STRATEGY: 'recursive',
  };

  // 运行 git http-backend
  const result = spawnSync('git', ['http-backend'], {
    env,
    input: body,
    encoding: 'buffer',
    maxBuffer: 100 * 1024 * 1024, // 100MB 限制
  });

  // 解析输出
  const stdout = result.stdout || Buffer.from('');
  const stderr = result.stderr || Buffer.from('');
  
  if (result.error) {
    return { status: 500, headers: {}, body: 'Internal Server Error' };
  }

  // 解析头部和 body
  const output = stdout.toString('utf-8');
  const headerEndIndex = stdout.indexOf(Buffer.from('\r\n\r\n'));
  
  if (headerEndIndex === -1) {
    // 没有头部，直接返回
    return { status: 200, headers: { 'Content-Type': 'application/x-git-receive-pack-advertisement' }, body: stdout };
  }

  const headerPart = stdout.slice(0, headerEndIndex).toString('utf-8');
  const bodyPart = stdout.slice(headerEndIndex + 4); // +4 for \r\n\r\n

  // 解析状态码
  let status = 200;
  const headers: Record<string, string> = {};
  
  for (const line of headerPart.split('\r\n')) {
    if (!line) continue;
    if (line.startsWith('Status: ')) {
      status = parseInt(line.substring(8), 10) || 200;
    } else if (line.startsWith('HTTP/')) {
      // ignore status line
    } else {
      const colonIndex = line.indexOf(': ');
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex);
        const value = line.substring(colonIndex + 2);
        headers[key] = value;
      }
    }
  }

  return { status, headers, body: bodyPart };
}

/**
 * Git 智能协议引用发现端点
 * GET /:username/:repo/info/refs?service=git-upload-pack (fetch)
 * GET /:username/:repo/info/refs?service=git-receive-pack (push)
 */
router.get('/:username/:repo/info/refs', (req: Request, res: Response) => {
  const repoName = req.params.repo as string;
  const repoPath = path.join(REPOS_BASE, repoName);
  
  // 检查仓库是否存在
  if (!fs.existsSync(repoPath)) {
    return res.status(404).send('Repository not found');
  }

  const service = req.query.service as string || '';
  const pathInfo = `/${repoName}/info/refs`;
  const queryString = service ? `service=${service}` : '';

  const result = executeGitBackend(
    'GET',
    pathInfo,
    queryString,
    undefined,
    undefined,
    Buffer.from('')
  );

  // 设置响应头
  for (const [key, value] of Object.entries(result.headers)) {
    res.setHeader(key, value);
  }
  
  res.status(result.status).send(result.body);
});

/**
 * Git 智能协议数据接收端点（用于推送）
 * POST /:username/:repo/git-receive-pack
 */
router.post('/:username/:repo/git-receive-pack', async (req: Request, res: Response) => {
  const repoName = req.params.repo as string;
  const repoPath = path.join(REPOS_BASE, repoName);
  
  if (!fs.existsSync(repoPath)) {
    return res.status(404).send('Repository not found');
  }

  const pathInfo = `/${repoName}/git-receive-pack`;
  const bodyBuffer = await collectBody(req);

  const result = executeGitBackend(
    'POST',
    pathInfo,
    '',
    req.headers['content-type'] as string || 'application/x-git-receive-pack-request',
    req.headers['content-length'] as string,
    bodyBuffer
  );

  for (const [key, value] of Object.entries(result.headers)) {
    res.setHeader(key, value);
  }
  
  res.status(result.status).send(result.body);
});

/**
 * Git 智能协议数据接收端点（用于拉取）
 * POST /:username/:repo/git-upload-pack
 */
router.post('/:username/:repo/git-upload-pack', async (req: Request, res: Response) => {
  const repoName = req.params.repo as string;
  const repoPath = path.join(REPOS_BASE, repoName);
  
  if (!fs.existsSync(repoPath)) {
    return res.status(404).send('Repository not found');
  }

  const pathInfo = `/${repoName}/git-upload-pack`;
  const bodyBuffer = await collectBody(req);

  const result = executeGitBackend(
    'POST',
    pathInfo,
    '',
    req.headers['content-type'] as string || 'application/x-git-upload-pack-request',
    req.headers['content-length'] as string,
    bodyBuffer
  );

  for (const [key, value] of Object.entries(result.headers)) {
    res.setHeader(key, value);
  }
  
  res.status(result.status).send(result.body);
});

export { router as gitSmartHttpRoutes };