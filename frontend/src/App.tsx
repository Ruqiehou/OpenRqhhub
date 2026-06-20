import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import RepositoryList from './pages/RepositoryList';
import RepositoryDetail from './pages/RepositoryDetail';
import CreateRepository from './pages/CreateRepository';
import './App.css';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/repositories" element={<RepositoryList />} />
          <Route path="/repositories/:repoName" element={<RepositoryDetail />} />
          <Route path="/create" element={<CreateRepository />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;