/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                'fredoka': ['Fredoka', 'sans-serif'],
                'nunito': ['Nunito', 'sans-serif'],
            },
            colors: {
                'welp-blue': '#4169E1',
                'welp-yellow': '#FFD700',
                'welp-text': '#1A1A1A',
            },
        },
    },
    plugins: [],
}