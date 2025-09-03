import { Route, Routes } from 'react-router-dom';
import BoardPage from './pages/BoardPage';
import Help from './pages/Help';

export default function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<BoardPage />} />
        <Route path="/ajuda" element={<Help />} />
        <Route path="/*" element={<BoardPage />} />
      </Routes>
    </div>
  );
}
