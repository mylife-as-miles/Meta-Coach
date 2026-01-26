import type { Config } from 'tailwindcss';

export default {
    darkMode: 'class',
    content: [
        './index.html',
        './*.{js,ts,jsx,tsx}',
        './src/**/*.{js,ts,jsx,tsx}',
        './components/**/*.{js,ts,jsx,tsx}',
        './lib/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {
            colors: {
                primary: "#D2F96F",
                "primary-hover": "#bce65b",
                "background-light": "#F3F4F6",
                "background-dark": "#0E100A",
                "surface-light": "#FFFFFF",
                "surface-dark": "#1F1F1F",
                "surface-darker": "#151712",
                "secondary-text": "#A2A2A2",
            },
            fontFamily: {
                sans: ["Helvetica Neue", "Helvetica", "Arial", "sans-serif"],
                display: ["Helvetica Neue", "Helvetica", "Arial", "sans-serif"],
                mono: ["Courier New", "Courier", "monospace"],
            },
            animation: {
                'spin-slow': 'spin 12s linear infinite',
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'scan': 'scan 4s linear infinite',
                'float': 'float 6s ease-in-out infinite',
                'fade-in-up': 'fadeIn 0.5s ease-out',
            },
            keyframes: {
                scan: {
                    '0%': { top: '0%' },
                    '100%': { top: '100%' },
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
