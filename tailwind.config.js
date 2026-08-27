/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0b10",
        foreground: "#ededed",
        neon: {
          cyan: "#00ffff",
          magenta: "#ff00ff",
          yellow: "#ffff00",
          blue: "#38bdf8",
          green: "#00ff66",
          red: "#ff3366",
          purple: "#9d4edd",
          orange: "#ff9e00"
        }
      },
      fontFamily: {
        arcade: ['"Press Start 2P"', 'monospace', 'cursive'],
        mono: ['"VT323"', '"Orbitron"', 'monospace'],
        sans: ['"Pretendard"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'neon-cyan': '0 0 10px rgba(0, 255, 255, 0.5), 0 0 20px rgba(0, 255, 255, 0.3)',
        'neon-cyan-lg': '0 0 15px rgba(0, 255, 255, 0.8), 0 0 30px rgba(0, 255, 255, 0.5), inset 0 0 15px rgba(0, 255, 255, 0.3)',
        'neon-magenta': '0 0 10px rgba(255, 0, 255, 0.5), 0 0 20px rgba(255, 0, 255, 0.3)',
        'neon-yellow': '0 0 10px rgba(255, 255, 0, 0.5), 0 0 20px rgba(255, 255, 0, 0.3)',
        'neon-green': '0 0 10px rgba(0, 255, 102, 0.6), 0 0 20px rgba(0, 255, 102, 0.4)',
        'neon-box': '0 0 25px rgba(0, 255, 255, 0.2), inset 0 0 15px rgba(255, 0, 255, 0.1)',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flicker': 'flicker 0.15s infinite alternate',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 8px rgba(0, 255, 255, 0.8))' },
          '50%': { opacity: '0.7', filter: 'drop-shadow(0 0 3px rgba(0, 255, 255, 0.4))' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
};
