import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        nocturne: 'rgb(var(--color-nocturne) / <alpha-value>)',
        plum: 'rgb(var(--color-plum) / <alpha-value>)',
        lilac: 'rgb(var(--color-lilac) / <alpha-value>)',
        rose: 'rgb(var(--color-rose) / <alpha-value>)',
        whisper: 'rgb(var(--color-whisper) / <alpha-value>)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Times New Roman', 'Georgia', 'serif'],
        ui: ['var(--font-ui)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
};
export default config;
