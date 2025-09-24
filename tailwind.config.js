/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./apps/**/*.{js,ts,jsx,tsx}', './libs/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: {
        '2xl': { max: '1919px' },
        xl: { max: '1536px' },
        lg: { max: '1279px' },
        'lg-min': { min: '1280px' },
        md: { max: '1023px' },
        'md-min': { min: '1024px' },
        'sm-explorer': { max: '998px' },
        sm: { max: '719px' },
        'sm-min': { min: '720px' },
        xs: { max: '428px' },
        'xs-min': { min: '429px' },
      },
      colors: {
        primary: 'var(--primary, #414FFF)',
        white: 'var(--white, #FFFFFF)',
        blackout: 'var(--blackout, #090D13B3)',
        neutrals: {
          1000: 'var(--neutrals-1000, #2B2B2D)',
          900: 'var(--neutrals-900, #3F404A)',
          800: 'var(--neutrals-800, #757575)',
          700: 'var(--neutrals-700, #89898B)',
          600: 'var(--neutrals-600, #CFCFCF)',
          500: 'var(--neutrals-500, #DDDFE8)',
          400: 'var(--neutrals-400, #E9EEF6)',
          300: 'var(--neutrals-300, #F0F4F8)',
          200: 'var(--neutrals-200, #F3F5FF)',
          100: 'var(--neutrals-100, #F3F6FB)',
        },
        hues: {
          900: 'var(--hues-900, #0D2282)',
          800: 'var(--hues-800, #354487)',
          600: 'var(--hues-600, #9DA4FF)',
          400: 'var(--hues-400, #B1B7FF)',
          200: 'var(--hues-200, #CBD0FF)',
          100: 'var(--hues-100, #DFE6FF)',
        },
        accent: {
          700: 'var(--accent-700, #0094FF)',
          300: 'var(--accent-300, #90A1FF)',
        },
        semantic: {
          error: 'var(--semantic-error, #D6323E)',
          warning: 'var(--semantic-warning, #D4C000)',
          success: 'var(--semantic-success, #00CC6F)',
        },
        gradients: {
          light: 'var(--gradients-light, #73E1E5)',
          middle: 'var(--gradients-middle, #414FFF)',
          dark: 'var(--gradients-dark, #6843E9)',
          white10: 'var(--white10, #FFFFFF1A)',
          neutrals300: 'var(--neutrals-300-10, #F0F4F81A)',
        },
        highlight: 'var(--highlight, #BEDAFF)',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
