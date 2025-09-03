import { Link, Route, Routes } from 'react-router-dom';
import BoardPage from './pages/BoardPage';
import Help from './pages/Help';

export default function App() {
  return (
    <div>
      <nav style={{ padding: 16, display: 'flex', gap: 8 }}>
        <Link to="/">Início</Link>
        <Link to="/ajuda">Ajuda</Link>
      </nav>
      <Routes>
        <Route path="/" element={<BoardPage />} />
        <Route path="/ajuda" element={<Help />} />
      </Routes>
    </div>
  );
}
