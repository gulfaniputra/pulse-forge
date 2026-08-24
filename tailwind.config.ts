import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/components/**/*.{js,ts,jsx,tsx,mdx}', './src/app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      // --- Comfy, modern typography ---
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      fontSize: {
        base: ['1rem', { lineHeight: '1.75' }],
        lg: ['1.125rem', { lineHeight: '1.75' }],
        xl: ['1.25rem', { lineHeight: '1.6' }],
        '2xl': ['1.5rem', { lineHeight: '1.4' }],
        '3xl': ['1.875rem', { lineHeight: '1.3' }],
        '4xl': ['2.25rem', { lineHeight: '1.2' }],
        '5xl': ['3rem', { lineHeight: '1.1' }],
        '6xl': ['3.75rem', { lineHeight: '1.05' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
      },
      letterSpacing: {
        tighter: '-0.05em',
        tight: '-0.025em',
        normal: '0em',
        wide: '0.025em',
        wider: '0.05em',
        widest: '0.1em',
      },

      colors: {
        nordic: {
          // Backgrounds (Polar Night)
          deeper: '#1a1e26', // Almost black
          dark: '#242933', // Dark slate
          navy: '#2E3440', // Classic Polar Night
          // Text (Snow Storm)
          snow: '#ECEFF4',
          ice: '#E5E9F0',
          frost: '#D8DEE9',
          // Borders & Muted elements
          polar: '#4C566A',
          // Semantic Accents (Aurora)
          blue: '#81A1C1',
          cyan: '#88C0D0',
          green: '#A3BE8C',
          gold: '#EBCB8B',
          red: '#BF616A',
          orange: '#D08770',
          purple: '#B48EAD',
        },

        indigo: {
          50: '#EAF5F6',
          100: '#D5EBED',
          200: '#B0D7DB',
          300: '#8CC3C9',
          400: '#68AFB7',
          500: '#88C0D0', // Arctic Cyan (Base)
          600: '#73A8B7',
          700: '#5E909E',
          800: '#497885',
          900: '#345F6C',
          950: '#1F3F47',
        },
        purple: {
          50: '#F2ECF0',
          100: '#E5D9E1',
          200: '#CBB3C3',
          300: '#B18DA5',
          400: '#976787',
          500: '#B48EAD', // Nord Purple (Base)
          600: '#9A7A94',
          700: '#80667B',
          800: '#665262',
          900: '#4C3E49',
          950: '#2F262D',
        },
        emerald: {
          50: '#F0F4EB',
          100: '#E1E9D7',
          200: '#C3D3AF',
          300: '#A5BD87',
          400: '#87A75F',
          500: '#A3BE8C', // Nord Green (Base)
          600: '#8BA275',
          700: '#73865E',
          800: '#5B6A47',
          900: '#434E30',
          950: '#27331B',
        },
        amber: {
          50: '#FDF8EE',
          100: '#FBF1DD',
          200: '#F7E3BB',
          300: '#F3D599',
          400: '#EFC777',
          500: '#EBCB8B', // Nord Gold (Base)
          600: '#CDAE70',
          700: '#AF9155',
          800: '#91743A',
          900: '#73571F',
          950: '#4B3810',
        },
      },

      // --- Generous spacing ---
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '30': '7.5rem',
      },

      // --- Crisp, modern borders ---
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },

      // --- Sharp, layered shadows (no blurry glass) ---
      boxShadow: {
        solid: '0 4px 20px rgba(0, 0, 0, 0.6)',
        'solid-lg': '0 10px 40px rgba(0, 0, 0, 0.7)',
        'solid-xl': '0 20px 60px rgba(0, 0, 0, 0.8)',
        accent: '0 0 0 1px rgba(136, 192, 208, 0.3), 0 10px 30px rgba(0, 0, 0, 0.6)',
        'accent-lg': '0 0 0 1px rgba(136, 192, 208, 0.4), 0 20px 50px rgba(0, 0, 0, 0.8)',
      },

      // --- Smooth animations ---
      animation: {
        'fade-in': 'fadeIn 0.4s cubic-bezier(0.16,1,0.3,1)',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.16,1,0.3,1)',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.16,1,0.3,1)',
        'pulse-soft': 'pulseSoft 2s cubic-bezier(0.4,0,0.6,1) infinite',
        float: 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },

      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.16,1,0.3,1)',
      },
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
      },
    },
  },
  plugins: [],
};

export default config;
