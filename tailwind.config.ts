import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      keyframes: {
        'zoom-in': {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '50%': { transform: 'scale(1.05)', opacity: '1', boxShadow: '0 0 20px rgba(255, 255, 255, 0.5)' },
          '100%': { transform: 'scale(1)', opacity: '1', boxShadow: '0 0 5px rgba(255, 255, 255, 0.2)' },
        },
      },
      animation: {
        'zoom-in': 'zoom-in 0.5s ease-out',
      },
    },
  },
  plugins: [],
};
export default config;
