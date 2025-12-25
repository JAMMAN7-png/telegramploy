import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#0a0a0a',
        'dark-card': '#1a1a1a',
        'neon-cyan': '#00f0ff',
        'neon-magenta': '#ff006e',
        'neon-lime': '#00ff88',
        'neon-yellow': '#ffea00',
      },
      boxShadow: {
        'brutal': '4px 4px 0 0 #00f0ff',
        'brutal-lg': '8px 8px 0 0 #ff006e',
        'brutal-xl': '12px 12px 0 0 #00ff88',
      },
      fontFamily: {
        sans: ['var(--font-space-grotesk)', 'system-ui', 'sans-serif'],
      },
      borderWidth: {
        '3': '3px',
        '5': '5px',
      },
    },
  },
  plugins: [],
};

export default config;
