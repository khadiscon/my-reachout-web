/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./lib/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#141412",
        paper: "#f7f5ee",
        line: "#ded9cc",
        moss: "#64735d",
        clay: "#b95f3f",
        aqua: "#2a7f84",
        plum: "#6e4c7f"
      },
      boxShadow: {
        soft: "0 18px 60px rgba(20, 20, 18, 0.08)"
      }
    }
  },
  plugins: []
};
