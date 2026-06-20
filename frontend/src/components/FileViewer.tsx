import React, { useEffect, useRef } from 'react';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';

interface FileViewerProps {
  fileName: string;
  content: string;
  onClose: () => void;
}

function detectLanguage(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const langMap: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
    json: 'json', md: 'markdown', css: 'css', html: 'xml',
    py: 'python', java: 'java', go: 'go', rs: 'rust',
    rb: 'ruby', php: 'php', swift: 'swift', kt: 'kotlin',
    vue: 'vue', yml: 'yaml', yaml: 'yaml', toml: 'ini',
    xml: 'xml', sql: 'sql', sh: 'bash', bat: 'dos',
    ps1: 'powershell', txt: 'plaintext', c: 'c', cpp: 'cpp',
    h: 'c', hpp: 'cpp', cs: 'csharp', dart: 'dart',
    scala: 'scala', elm: 'elm', clj: 'clojure',
  };
  return langMap[ext] || 'plaintext';
}

const FileViewer: React.FC<FileViewerProps> = ({ fileName, content, onClose }) => {
  const codeRef = useRef<HTMLElement>(null);
  const lang = detectLanguage(fileName);

  useEffect(() => {
    if (codeRef.current) {
      hljs.highlightElement(codeRef.current);
    }
  }, [content, fileName]);

  // 判断是否可能是二进制文件
  const isBinary = content.includes('\u0000');

  return (
    <div className="file-viewer">
      <div className="file-viewer-header">
        <div className="file-viewer-title">
          <span className="file-icon">
            {fileName.split('.').pop() === 'md' ? '📝' : '📄'}
          </span>
          <span className="file-name">{fileName}</span>
          <span className="file-lang">{lang}</span>
        </div>
        <button onClick={onClose} className="btn btn-sm btn-outline">关闭</button>
      </div>
      
      <div className="file-viewer-body">
        {isBinary ? (
          <div className="file-binary-notice">
            <p>⚠️ 该文件是二进制文件，无法以文本方式查看</p>
          </div>
        ) : (
          <pre className="code-block">
            <code ref={codeRef} className={`language-${lang}`}>
              {content}
            </code>
          </pre>
        )}
      </div>
    </div>
  );
};

export default FileViewer;