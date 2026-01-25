import type { Config } from 'tailwindcss';

export default {
    darkMode: 'class',
    content: [
        './index.html',
        './*.{js,ts,jsx,tsx}',
        './src/**/*.{js,ts,jsx,tsx}',
        './components/**/*.{js,ts,jsx,tsx}', // Added based on file structure seen earlier (components/Auth.tsx)
    ],
    theme: {
        extend: {
            colors: {
                primary: "#D2F96F",
                "primary-hover": "#bce65b",
                "background-dark": "#0E100A",
                "surface-dark": "#1F1F1F",
                "surface-light": "#FFFFFF",
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                serif: ['Playfair Display', 'serif'],
                display: ["Helvetica Neue", "Helvetica", "Arial", "sans-serif"],
            },
            animation: {
                'spin-slow': 'spin 12s linear infinite',
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'reverse-spin': 'reverse-spin 15s linear infinite',
                'float': 'float 6s ease-in-out infinite',
                'fade-in-up': 'fadeIn 0.5s ease-out',
            },
            keyframes: {
                'reverse-spin': {
                    from: { transform: 'rotate(360deg)' },
                    to: { transform: 'rotate(0deg)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-20px)' },
                },
                fadeIn: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                }
            }
        },
    },
    plugins: [],
} satisfies Config;
