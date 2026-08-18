/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Vazirmatn", "system-ui", "sans-serif"],
        display: ["Vazirmatn", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      colors: {
        // PRIOR Color Palette
        ink: "#171717",
        paper: "#F4F0E8",
        signal: "#FF5A36",
        muted: "#8B8780",
        border: "#DDD7CC",

        // Semantic aliases for easier usage
        bg: {
          DEFAULT: "#F4F0E8",
          dark: "#171717",
        },
        fg: {
          DEFAULT: "#171717",
          muted: "#8B8780",
          inverted: "#F4F0E8",
        },
        accent: {
          DEFAULT: "#FF5A36",
          hover: "#E84D2F",
          light: "#FFF0EB",
        },
        line: "#DDD7CC",
        surface: {
          DEFAULT: "#FFFFFF",
          elevated: "#F4F0E8",
        },
      },
      fontSize: {
        // Editorial type scale
        'display-xl': ['4.5rem', { lineHeight: '1.05', letterSpacing: '-0.03em', fontWeight: '700' }],
        'display-lg': ['3.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-md': ['2.5rem', { lineHeight: '1.15', letterSpacing: '-0.01em', fontWeight: '600' }],
        'display-sm': ['1.75rem', { lineHeight: '1.2', letterSpacing: '0', fontWeight: '600' }],
        'headline': ['1.375rem', { lineHeight: '1.3', letterSpacing: '0', fontWeight: '600' }],
        'title-lg': ['1.125rem', { lineHeight: '1.35', letterSpacing: '0', fontWeight: '500' }],
        'title': ['1rem', { lineHeight: '1.4', letterSpacing: '0', fontWeight: '500' }],
        'title-sm': ['0.875rem', { lineHeight: '1.4', letterSpacing: '0', fontWeight: '500' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6', letterSpacing: '0', fontWeight: '400' }],
        'body': ['1rem', { lineHeight: '1.6', letterSpacing: '0', fontWeight: '400' }],
        'body-sm': ['0.875rem', { lineHeight: '1.55', letterSpacing: '0', fontWeight: '400' }],
        'caption': ['0.75rem', { lineHeight: '1.5', letterSpacing: '0.01em', fontWeight: '400' }],
        'caption-mono': ['0.75rem', { lineHeight: '1.5', letterSpacing: '0.02em', fontWeight: '400' }],
        'micro': ['0.6875rem', { lineHeight: '1.4', letterSpacing: '0.02em', fontWeight: '500', textTransform: 'uppercase' }],
      },
      spacing: {
        'space-1': '0.25rem',   // 4px
        'space-2': '0.5rem',    // 8px
        'space-3': '0.75rem',   // 12px
        'space-4': '1rem',      // 16px
        'space-5': '1.25rem',   // 20px
        'space-6': '1.5rem',    // 24px
        'space-8': '2rem',      // 32px
        'space-10': '2.5rem',   // 40px
        'space-12': '3rem',     // 48px
        'space-16': '4rem',     // 64px
        'space-20': '5rem',     // 80px
        'space-24': '6rem',     // 96px
      },
      borderRadius: {
        'none': '0',
        'sm': '4px',
        'DEFAULT': '8px',
        'lg': '12px',
        'xl': '16px',
        'full': '9999px',
      },
      borderWidth: {
        'hairline': '0.5px',
        'thin': '1px',
        'DEFAULT': '1.5px',
        'thick': '2px',
        'heavy': '3px',
      },
      boxShadow: {
        'subtle': '0 1px 2px rgba(23, 23, 23, 0.04), 0 1px 1px rgba(23, 23, 23, 0.03)',
        'card': '0 2px 8px rgba(23, 23, 23, 0.05), 0 1px 2px rgba(23, 23, 23, 0.04)',
        'elevated': '0 8px 24px rgba(23, 23, 23, 0.08), 0 2px 6px rgba(23, 23, 23, 0.05)',
        'dragging': '0 12px 40px rgba(23, 23, 23, 0.12), 0 4px 12px rgba(23, 23, 23, 0.08)',
        'focus': '0 0 0 3px rgba(255, 90, 54, 0.25)',
        'inner-subtle': 'inset 0 1px 1px rgba(23, 23, 23, 0.03)',
      },
      transitionDuration: {
        'instant': '0ms',
        'fast': '120ms',
        'DEFAULT': '200ms',
        'slow': '300ms',
      },
      transitionTimingFunction: {
        'snappy': 'cubic-bezier(0.2, 0, 0, 1)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      zIndex: {
        'modal': '100',
        'overlay': '90',
        'dropdown': '80',
        'header': '70',
        'tooltip': '60',
      },
    },
  },
  plugins: [],
};