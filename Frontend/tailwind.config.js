/** @type {import('tailwindcss').Config} */
module.exports = {
   content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors:{
        tealDark: "#0097A7",
        tealLight: "#00BCD4",
        tealDarkTransparent: "rgba(0, 151, 167, 0.5)",
        tealLightTransparent: "rgba(0, 188, 212, 0.5)" 
      }
    },
  },
  plugins: [],
}

