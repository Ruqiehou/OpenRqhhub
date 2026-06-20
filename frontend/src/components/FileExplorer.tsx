import React from 'react';

export interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size: number;
}

interface FileExplorerProps {
  files: FileItem[];
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenFile: (path: string) => void;
  onGoBack: () => void;
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getFileIcon(name: string, type: 'file' | 'dir'): string {
  if (type === 'dir') return '📁';
  
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const iconMap: Record<string, string> = {
    ts: '🔵', tsx: '⚛️', js: '🟡', jsx: '⚛️',
    json: '📋', md: '📝', css: '🎨', html: '🌐',
    py: '🐍', java: '☕', go: '🔷', rs: '🦀',
    rb: '💎', php: '🐘', swift: '🍎', kt: '📱',
    vue: '💚', svelte: '🧡', yml: '⚙️', yaml: '⚙️',
    toml: '⚙️', xml: '📰', sql: '🗃️', sh: '📟',
    bat: '🪟', ps1: '🪟', txt: '📄',
  };
  
  return iconMap[ext] || '📄';
}

const FileExplorer: React.FC<FileExplorerProps> = ({ files, currentPath, onNavigate, onOpenFile, onGoBack }) => {
  return (
    <div className="file-explorer">
      <div className="file-path-bar">
        <span className="path-label">路径:</span>
        <span className="path-value">/{currentPath || ''}</span>
        {currentPath && (
          <button onClick={onGoBack} className="btn btn-sm btn-outline">返回上级</button>
        )}
      </div>
      
      <div className="file-table-header">
        <span className="col-name">名称</span>
        <span className="col-size">大小</span>
      </div>
      
      <div className="file-table-body">
        {files.length === 0 ? (
          <div className="file-row empty">
            <span>该目录为空</span>
          </div>
        ) : (
          files.map((file, index) => (
            <div
              key={index}
              className={`file-row ${file.type === 'dir' ? 'is-dir' : 'is-file'}`}
              onClick={() => file.type === 'dir' ? onNavigate(file.path) : onOpenFile(file.path)}
              title={file.type === 'dir' ? `打开目录 ${file.name}` : `查看文件 ${file.name}`}
            >
              <span className="col-name">
                <span className="file-icon">{getFileIcon(file.name, file.type)}</span>
                <span className="file-name-text">{file.name}</span>
                {file.type === 'dir' && <span className="dir-slash">/</span>}
              </span>
              <span className="col-size">
                {file.type === 'dir' ? '-' : formatSize(file.size)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FileExplorer;