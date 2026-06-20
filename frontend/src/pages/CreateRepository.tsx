import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gitApi } from '../services/api';

const CreateRepository: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('仓库名称不能为空');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      await gitApi.createRepository(name.trim(), description.trim());
      navigate('/repositories');
    } catch (err: any) {
      setError(err.message || '创建仓库失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-repository">
      <div className="page-header">
        <h2>创建新仓库</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="form">
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-group">
          <label htmlFor="name">仓库名称 *</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="请输入仓库名称"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">仓库描述</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="请输入仓库描述（可选）"
            rows={4}
          />
        </div>
        
        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate('/repositories')}
            className="btn btn-secondary"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? '创建中...' : '创建仓库'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateRepository;