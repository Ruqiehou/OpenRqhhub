import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <div className="layout">
      <header className="header">
        <div className="header-content">
          <Link to="/" className="logo">
            <h1>GitLocal</h1>
          </Link>
          <nav className="nav">
            <Link to="/" className={`nav-link ${isActive('/')}`}>
              仪表板
            </Link>
            <Link to="/repositories" className={`nav-link ${isActive('/repositories')}`}>
              仓库
            </Link>
            <Link to="/create" className={`nav-link ${isActive('/create')}`}>
              创建仓库
            </Link>
          </nav>
        </div>
      </header>
      
      <main className="main">
        {children}
      </main>
      
      <footer className="footer">
        <div className="footer-content">
          <p>GitLocal - 本地Git托管平台</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;