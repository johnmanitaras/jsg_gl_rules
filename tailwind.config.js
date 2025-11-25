/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    // Include shared_components to ensure their Tailwind classes are available
    '../shared_components/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // Extend Tailwind with CSS variables for better integration
      colors: {
        // Primary brand colors
        'primary': {
          DEFAULT: 'var(--color-primary-600)',
          50: 'var(--color-primary-50, #eff6ff)',
          100: 'var(--color-primary-100, #dbeafe)',
          200: 'var(--color-primary-200, #bfdbfe)',
          300: 'var(--color-primary-300, #93c5fd)',
          400: 'var(--color-primary-400, #60a5fa)',
          500: 'var(--color-primary-500, #3b82f6)',
          600: 'var(--color-primary-600, #2563eb)',
          700: 'var(--color-primary-700, #1d4ed8)',
          800: 'var(--color-primary-800, #1e40af)',
          900: 'var(--color-primary-900, #1e3a8a)',
        },
        // Semantic colors
        'success': {
          DEFAULT: 'var(--color-success-600)',
          50: 'var(--color-success-50, #ecfdf5)',
          100: 'var(--color-success-100, #d1fae5)',
          200: 'var(--color-success-200, #a7f3d0)',
          300: 'var(--color-success-300, #6ee7b7)',
          400: 'var(--color-success-400, #34d399)',
          500: 'var(--color-success-500, #10b981)',
          600: 'var(--color-success-600, #059669)',
          700: 'var(--color-success-700, #047857)',
          800: 'var(--color-success-800, #065f46)',
          900: 'var(--color-success-900, #064e3b)',
        },
        'warning': {
          DEFAULT: 'var(--color-warning-400)',
          50: 'var(--color-warning-50, #fffbeb)',
          100: 'var(--color-warning-100, #fef3c7)',
          200: 'var(--color-warning-200, #fde68a)',
          300: 'var(--color-warning-300, #fcd34d)',
          400: 'var(--color-warning-400, #fbbf24)',
          500: 'var(--color-warning-500, #f59e0b)',
          600: 'var(--color-warning-600, #d97706)',
          700: 'var(--color-warning-700, #b45309)',
          800: 'var(--color-warning-800, #92400e)',
          900: 'var(--color-warning-900, #78350f)',
        },
        'error': {
          DEFAULT: 'var(--color-error-500)',
          50: 'var(--color-error-50, #fef2f2)',
          100: 'var(--color-error-100, #fee2e2)',
          200: 'var(--color-error-200, #fecaca)',
          300: 'var(--color-error-300, #fca5a5)',
          400: 'var(--color-error-400, #f87171)',
          500: 'var(--color-error-500, #ef4444)',
          600: 'var(--color-error-600, #dc2626)',
          700: 'var(--color-error-700, #b91c1c)',
          800: 'var(--color-error-800, #991b1b)',
          900: 'var(--color-error-900, #7f1d1d)',
        },
        'info': {
          DEFAULT: 'var(--color-info-500)',
          500: 'var(--color-info-500, #3b82f6)',
        },
        // Text and neutral colors
        'text': {
          DEFAULT: 'var(--color-text)',
          secondary: 'var(--color-text-secondary)',
          tertiary: 'var(--color-text-tertiary, #9ca3af)',
        },
        'background': 'var(--color-background)',
        'border': {
          DEFAULT: 'var(--color-border)',
          secondary: 'var(--color-divider)',
        },
        // App-specific colors
        'jetsetgo': {
          'processing': 'var(--jetsetgo-template-status-processing)',
          'queued': 'var(--jetsetgo-template-status-queued)',
        }
      },
      // Extend spacing with CSS variables
      spacing: {
        'xs': 'var(--spacing-2)',
        'sm': 'var(--text-xs)',
        'md': 'var(--text-base)',
        'lg': 'var(--text-2xl)',
        'xl': 'var(--spacing-8)',
      },
      // Extend border radius
      borderRadius: {
        'sm': 'var(--radius-sm)',
        'md': 'var(--radius-md)',
        'lg': 'var(--radius-lg)',
        'full': 'var(--radius-full)',
      },
      // Extend box shadow
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'xl': 'var(--shadow-xl)',
        'none': 'var(--shadow-none)',
      },
      // Extend font family
      fontFamily: {
        'base': 'var(--jetsetgo-template-font-typography-fontFamily-custom)',
        'heading': 'var(--jetsetgo-template-typography-headingFontFamily-custom)',
      },
      // Extend font weight
      fontWeight: {
        'light': 'var(--typography-fontWeightLight)',
        'normal': 'var(--typography-fontWeightRegular)',
        'medium': 'var(--typography-fontWeightMedium)',
        'bold': 'var(--typography-fontWeightBold)',
      },
      // Extend animation duration
      transitionDuration: {
        'fast': 'var(--duration-fast)',
      },
      // Extend animation timing
      transitionTimingFunction: {
        'theme': 'var(--ease-out)',
      },
      // Extend minimum width
      minWidth: {
        'button': 'var(--button-minWidth)',
        'toast': 'var(--jetsetgo-template-toast-min-width)',
      }
    },
  },
  plugins: [],
};
