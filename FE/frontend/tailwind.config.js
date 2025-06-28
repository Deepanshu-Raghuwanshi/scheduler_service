/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eff6ff",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
        },
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
  safelist: [
    // Dynamic class names that might be purged
    "bg-green-100",
    "text-green-800",
    "bg-red-100",
    "text-red-800",
    "bg-blue-100",
    "text-blue-800",
    "bg-yellow-100",
    "text-yellow-800",
    "bg-purple-100",
    "text-purple-800",
    "bg-orange-100",
    "text-orange-800",
    "bg-emerald-100",
    "text-emerald-800",
    "bg-gray-100",
    "text-gray-800",
  ],
};
