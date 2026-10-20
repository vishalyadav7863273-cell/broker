export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1C3B30',       // deep forest green: text, primary buttons
        sage: '#5E8466',      // italic accents, icons
        mint: '#E2EBE2',      // soft green surfaces
        chalk: '#F6F6F2',     // page background
        cream: '#F7F3EA',
        marigold: '#D9A47C',  // warm clay accent
        slate2: '#66726B',    // secondary text
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
