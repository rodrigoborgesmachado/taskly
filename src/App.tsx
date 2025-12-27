import { Link, Route, Routes } from 'react-router-dom';
import BoardPage from './pages/BoardPage';
import Help from './pages/Help';
import Privacy from './pages/Privacy';
import Contact from './pages/Contact';
import ThemeToggle from './components/ThemeToggle';

export default function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-header__title">
          <Link to="/" className="app-brand-link">Taskly</Link>
        </h1>
        <ThemeToggle />
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<BoardPage />} />
          <Route path="/ajuda" element={<Help />} />
          <Route path="/privacidade" element={<Privacy />} />
          <Route path="/contato" element={<Contact />} />
          <Route path="/*" element={<BoardPage />} />
        </Routes>
      </main>
      <footer className="app-footer">
        <div className="app-footer__brand">
          <a href="https://www.sunsalesystem.com.br/" target="_blank" rel="noreferrer">
            SunSale System
          </a>
          <span>© {new Date().getFullYear()} — Todos os direitos reservados.</span>
        </div>
        <div className="app-footer__links">
          <a href="/privacidade">Política de Privacidade</a>
          <a href="/contato">Contato</a>
        </div>
      </footer>
    </div>
  );
}
