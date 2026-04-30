import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  // Toggle dark mode via `data-theme="dark"` on <html>, matching the prototype.
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // All driven by CSS variables defined in src/index.css so dark/light
        // swap is just a single attribute change on <html>.
        bg:        'var(--bg)',
        card:      'var(--bg-card)',
        'input-bg':'var(--bg-input)',
        'hover-bg':'var(--bg-hover)',
        sidebar:   'var(--sidebar-bg)',
        fg:        'var(--text)',
        'fg-muted':'var(--text-secondary)',
        'fg-subtle':'var(--text-muted)',
        border:    'var(--border)',
        primary:   'var(--primary)',
        'primary-muted': 'var(--primary-muted)',

        // Semantic badge colors (also CSS-var-driven so dark mode adjusts)
        'badge-green-bg':  'var(--badge-green-bg)',
        'badge-green-fg':  'var(--badge-green-fg)',
        'badge-yellow-bg': 'var(--badge-yellow-bg)',
        'badge-yellow-fg': 'var(--badge-yellow-fg)',
        'badge-red-bg':    'var(--badge-red-bg)',
        'badge-red-fg':    'var(--badge-red-fg)',
        'badge-blue-bg':   'var(--badge-blue-bg)',
        'badge-blue-fg':   'var(--badge-blue-fg)',
        'badge-gray-bg':   'var(--badge-gray-bg)',
        'badge-gray-fg':   'var(--badge-gray-fg)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card:    '0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.05)',
        'card-lg':'0 10px 25px rgba(0,0,0,0.10), 0 4px 10px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
} satisfies Config;
