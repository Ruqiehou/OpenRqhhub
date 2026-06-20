import express from 'express';
import cors from 'cors';
import { gitRoutes } from './routes/git';
import { repositoryRoutes } from './routes/repository';
import { gitSmartHttpRoutes } from './routes/gitSmartHttp';

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());

// Git 智能协议路由（必须在 json 解析之前注册，因为使用 raw body）
app.use('/', gitSmartHttpRoutes);

// JSON 解析（仅用于 API 路由）
app.use('/api', express.json());
app.use('/api/git', gitRoutes);
app.use('/api/repository', repositoryRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`后端服务器运行在 http://localhost:${PORT}`);
});

export default app;