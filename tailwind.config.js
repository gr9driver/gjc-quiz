/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'bounce-in': 'bounceIn 0.5s ease-out',
        'shake': 'shake 0.5s ease-in-out',
        'pulse-green': 'pulseGreen 0.5s ease-in-out',
        'pulse-red': 'pulseRed 0.5s ease-in-out',
        'totem-flash': 'totemFlash 1.5s ease-out forwards',
        'totem-pop': 'totemPop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        bounceIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '50%': { transform: 'scale(1.02)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-8px)' },
          '75%': { transform: 'translateX(8px)' },
        },
        pulseGreen: {
          '0%, 100%': { backgroundColor: 'rgb(34 197 94)' },
          '50%': { backgroundColor: 'rgb(74 222 128)' },
        },
        pulseRed: {
          '0%, 100%': { backgroundColor: 'rgb(239 68 68)' },
          '50%': { backgroundColor: 'rgb(248 113 113)' },
        },
        totemFlash: {
          '0%':   { opacity: '0' },
          '8%':   { opacity: '1' },
          '16%':  { opacity: '0.2' },
          '24%':  { opacity: '1' },
          '32%':  { opacity: '0.2' },
          '40%':  { opacity: '1' },
          '70%':  { opacity: '0.9' },
          '100%': { opacity: '0' },
        },
        totemPop: {
          '0%':   { transform: 'scale(0.3) rotate(-10deg)', opacity: '0' },
          '60%':  { transform: 'scale(1.15) rotate(4deg)', opacity: '1' },
          '80%':  { transform: 'scale(0.95) rotate(-2deg)' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
