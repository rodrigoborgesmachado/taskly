import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
      title={isDark ? 'Alternar para tema claro' : 'Alternar para tema escuro'}
    >
      <span className="theme-toggle__icon" aria-hidden>
        {isDark ? '🌙' : '🌞'}
      </span>
      <span className="theme-toggle__label">
        {isDark ? 'Dark' : 'Light'}
      </span>
    </button>
  );
}
