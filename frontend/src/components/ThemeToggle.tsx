import React, { useEffect, useState } from 'react';

const STORAGE_KEY = 'vlab-dark-mode';

export const ThemeToggle: React.FC = () => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const applyTheme = (dark: boolean, instant = false) => {
    const root = document.documentElement;

    if (instant) {
      root.classList.add('no-transitions');
    }

    root.setAttribute('data-dark-mode', String(dark));
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', dark ? '#1a1f2e' : '#2e7d32');
    }

    if (instant) {
      // Force reflow
      void root.offsetHeight;
      setTimeout(() => {
        root.classList.remove('no-transitions');
      }, 50);
    }
  };

  useEffect(() => {
    // Initial apply
    applyTheme(isDark, false);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (localStorage.getItem(STORAGE_KEY) === null) {
        setIsDark(e.matches);
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const handleToggle = () => {
    const newValue = !isDark;
    setIsDark(newValue);
    localStorage.setItem(STORAGE_KEY, String(newValue));
    applyTheme(newValue, true);
  };

  return (
    <div className="theme-toggle" onMouseDown={(event) => event.stopPropagation()}>
      <button
        id="theme-toggle"
        className="toggle"
        type="button"
        role="switch"
        aria-pressed={isDark}
        aria-label={isDark ? 'Alternar para modo claro' : 'Alternar para modo escuro'}
        onClick={handleToggle}
      >
        <span className="toggle__content">
          <svg className="toggle__backdrop" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 290 190" fill="none">
            <g className="clouds">
              <path d="M215 178.5C215 196.449 200.449 207 182.5 207H55C25.8 207 8 189.2 8 163.5C8 137.8 29.3 121.5 55 121.5C55 95.8 74.2 78 103 78C131.8 78 148 99.3 148 121.5H160.5C178.449 121.5 193 136.051 193 154V154C193 154 215 160.551 215 178.5Z" fill="hsl(0 0% 100% / 0.5)"/>
              <path d="M275 178.5C275 196.449 260.449 211 242.5 211H115C85.8 211 68 193.2 68 167.5C68 141.8 89.3 125.5 115 125.5C115 99.8 134.2 82 163 82C191.8 82 208 103.3 208 125.5H220.5C238.449 125.5 253 140.051 253 158V158C253 158 275 160.551 275 178.5Z" fill="white"/>
            </g>
          </svg>
          <svg className="toggle__backdrop" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 290 190" fill="none">
            <g className="stars">
              <g><path d="M32.5 72L33.2 73.9H35.2L33.5 75.1L34.2 77L32.5 75.8L30.8 77L31.5 75.1L29.8 73.9H31.8L32.5 72Z" fill="white"/></g>
              <g><path d="M62 42L62.7 43.9H64.7L63 45.1L63.7 47L62 45.8L60.3 47L61 45.1L59.3 43.9H61.3L62 42Z" fill="white"/></g>
              <g><path d="M92 22L92.7 23.9H94.7L93 25.1L93.7 27L92 25.8L90.3 27L91 25.1L89.3 23.9H91.3L92 22Z" fill="white"/></g>
              <g><path d="M122 52L122.7 53.9H124.7L123 55.1L123.7 57L122 55.8L120.3 57L121 55.1L119.3 53.9H121.3L122 52Z" fill="white"/></g>
              <g><path d="M152 32L152.7 33.9H154.7L153 35.1L153.7 37L152 35.8L150.3 37L151 35.1L149.3 33.9H151.3L152 32Z" fill="white"/></g>
              <g><path d="M182 62L182.7 63.9H184.7L183 65.1L183.7 67L182 65.8L180.3 67L181 65.1L179.3 63.9H181.3L182 62Z" fill="white"/></g>
              <g><path d="M212 22L212.7 23.9H214.7L213 25.1L213.7 27L212 25.8L210.3 27L211 25.1L209.3 23.9H211.3L212 22Z" fill="white"/></g>
              <g><path d="M242 52L242.7 53.9H244.7L243 55.1L243.7 57L242 55.8L240.3 57L241 55.1L239.3 53.9H241.3L242 52Z" fill="white"/></g>
              <g><path d="M47 32L47.7 33.9H49.7L48 35.1L48.7 37L47 35.8L45.3 37L46 35.1L44.3 33.9H46.3L47 32Z" fill="white"/></g>
              <g><path d="M167 12L167.7 13.9H169.7L168 15.1L168.7 17L167 15.8L165.3 17L166 15.1L164.3 13.9H166.3L167 12Z" fill="white"/></g>
              <g><path d="M257 32L257.7 33.9H259.7L258 35.1L258.7 37L257 35.8L255.3 37L256 35.1L254.3 33.9H256.3L257 32Z" fill="white"/></g>
            </g>
            <g className="clouds">
              <path d="M275 178.5C275 196.449 260.449 211 242.5 211H115C85.8 211 68 193.2 68 167.5C68 141.8 89.3 125.5 115 125.5C115 99.8 134.2 82 163 82C191.8 82 208 103.3 208 125.5H220.5C238.449 125.5 253 140.051 253 158V158C253 158 275 160.551 275 178.5Z" fill="hsl(219 30% 22%)"/>
            </g>
          </svg>
        </span>
        <span className="toggle__indicator-wrapper">
          <span className="toggle__indicator">
            <span className="toggle__star">
              <span className="sun"></span>
              <span className="moon">
                <span className="moon__crater"></span>
                <span className="moon__crater"></span>
                <span className="moon__crater"></span>
              </span>
            </span>
          </span>
        </span>
      </button>
    </div>
  );
};
