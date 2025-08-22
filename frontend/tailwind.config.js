/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary-color)',
        'primary-hover': 'var(--primary-hover-color)',
        secondary: 'var(--secondary-color)',
        'secondary-hover': 'var(--secondary-hover-color)',
        accent: 'var(--accent-color)',
        'accent-hover': 'var(--accent-hover-color)',
        'bg-primary': 'var(--bg-primary-color)',
        'bg-secondary': 'var(--bg-secondary-color)',
        'bg-tertiary': 'var(--bg-tertiary-color)',
        'text-primary': 'var(--text-primary-color)',
        'text-secondary': 'var(--text-secondary-color)',
        'text-muted': 'var(--text-muted-color)',
        border: 'var(--border-color)',
        'border-light': 'var(--border-light-color)',
        timer: 'var(--timer-color)',
        success: 'var(--success-color)',
        error: 'var(--error-color)',
        warning: 'var(--warning-color)',
      },
      keyframes: {
        shimmer: {
          '0%': { left: '-100%' },
          '100%': { left: '100%' },
        },
        scanlines: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '0 4px' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceInDigit: {
            '0%': { transform: 'translateY(-20px) scale(0.8)', opacity: '0' },
            '60%': { transform: 'translateY(5px) scale(1.1)' },
            '100%': { transform: 'translateY(0) scale(1)', opacity: '1' },
        },
        wobble: {
            '0%': { transform: 'translateX(0%)' },
            '15%': { transform: 'translateX(-25px) rotate(-5deg)' },
            '30%': { transform: 'translateX(20px) rotate(3deg)' },
            '45%': { transform: 'translateX(-15px) rotate(-3deg)' },
            '60%': { transform: 'translateX(10px) rotate(2deg)' },
            '75%': { transform: 'translateX(-5px) rotate(-1deg)' },
            '100%': { transform: 'translateX(0%)' },
        },
      },
      animation: {
        shimmer: 'shimmer 3s infinite',
        scanlines: 'scanlines 0.1s linear infinite',
        bounceIn: 'bounceIn 0.5s ease-out',
        bounceInDigit: 'bounceInDigit 0.6s ease-out',
        wobble: 'wobble 0.5s ease-in-out',
      },
    },
  },
  plugins: [],
}
