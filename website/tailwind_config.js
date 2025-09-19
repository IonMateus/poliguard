 tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        'inter': ['Inter', 'sans-serif'],
                        'orbitron': ['Orbitron', 'monospace'],
                    },
                    colors: {
                        'primary': '#ff6b35', // Vibrant Orange
                        'secondary': '#000000', // Pure Black
                        'dark-gray': '#0a0a0a', // Slightly lighter black for depth
                        'medium-gray': '#1a1a1a', // Mid-range gray
                        'light-gray': '#e5e7eb', // For subtle accents
                        'accent': '#ffffff', // White
                    },
                    animation: {
                        'text-gradient': 'text-gradient 3s linear infinite',
                        'float-hero': 'float-hero 18s ease-in-out infinite',
                        'pulse-strong': 'pulse-strong 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                        'border-glow': 'border-glow 2s ease-in-out infinite',
                        'wave': 'wave 2s infinite linear',
                    },
                    keyframes: {
                        'text-gradient': {
                            '0%, 100%': { backgroundPosition: '0% 50%' },
                            '50%': { backgroundPosition: '100% 50%' },
                        },
                        'float-hero': {
                            '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
                            '25%': { transform: 'translateY(-10px) rotate(1deg) translateX(5px)' },
                            '50%': { transform: 'translateY(0px) rotate(-1deg) translateX(-5px)' },
                            '75%': { transform: 'translateY(-10px) rotate(1deg) translateX(5px)' },
                        },
                        'pulse-strong': {
                            '0%, 100%': { transform: 'scale(1)', boxShadow: '0 0 10px rgba(255, 107, 53, 0.3)' },
                            '50%': { transform: 'scale(1.03)', boxShadow: '0 0 25px rgba(255, 107, 53, 0.6)' },
                        },
                        'border-glow': {
                            '0%, 100%': { borderColor: 'rgba(255, 107, 53, 0.3)' },
                            '50%': { borderColor: 'rgba(255, 107, 53, 0.7)' },
                        },
                        'wave': {
                            '0%, 100%': { opacity: 0, transform: 'scale(0)' },
                            '50%': { opacity: 1, transform: 'scale(1)' },
                        }
                    }
                }
            }
        }