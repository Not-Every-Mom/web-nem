import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				'heading': ['Playfair Display', 'Georgia', 'serif'],
				'body': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
				'display': ['Playfair Display', 'Georgia', 'serif'],
				'sans': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				// Brand colors for direct access
				'powder-blue': 'hsl(var(--powder-blue))',
				'muted-gold': 'hsl(var(--muted-gold))',
				'dark-brown': 'hsl(var(--dark-brown))',
				'light-cyan': 'hsl(var(--light-cyan))',
				'deep-green': 'hsl(var(--deep-green))',
				// Persona theme colors
				'nancy': {
					primary: 'hsl(var(--nancy-primary))',
					secondary: 'hsl(var(--nancy-secondary))',
					accent: 'hsl(var(--nancy-accent))',
					muted: 'hsl(var(--nancy-muted))'
				},
				'willow': {
					primary: 'hsl(var(--willow-primary))',
					secondary: 'hsl(var(--willow-secondary))',
					accent: 'hsl(var(--willow-accent))',
					muted: 'hsl(var(--willow-muted))'
				},
				'clara': {
					primary: 'hsl(var(--clara-primary))',
					secondary: 'hsl(var(--clara-secondary))',
					accent: 'hsl(var(--clara-accent))',
					muted: 'hsl(var(--clara-muted))'
				},
				'luna': {
					primary: 'hsl(var(--luna-primary))',
					secondary: 'hsl(var(--luna-secondary))',
					accent: 'hsl(var(--luna-accent))',
					muted: 'hsl(var(--luna-muted))'
				}
			},
			backgroundImage: {
				'gradient-primary': 'var(--gradient-primary)',
				'gradient-subtle': 'var(--gradient-subtle)',
				'gradient-warm': 'var(--gradient-warm)',
				'gradient-nancy': 'var(--nancy-gradient)',
				'gradient-willow': 'var(--willow-gradient)',
				'gradient-clara': 'var(--clara-gradient)',
				'gradient-luna': 'var(--luna-gradient)',
			},
			boxShadow: {
				'gentle': 'var(--shadow-gentle)',
				'warm': 'var(--shadow-warm)',
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				"tilt-3d": {
					"0%, 100%": { transform: "perspective(1000px) rotateX(0deg) rotateY(0deg)" },
					"50%": { transform: "perspective(1000px) rotateX(-2deg) rotateY(2deg)" }
				},
				"magnetic-hover": {
					"0%": { transform: "translate3d(0,0,0) scale(1)" },
					"100%": { transform: "translate3d(0,-8px,0) scale(1.02)" }
				},
				"pulse-icon": {
					"0%, 100%": { transform: "scale(1)" },
					"50%": { transform: "scale(1.1)" }
				},
				"slide-up": {
					"0%": { transform: "translate3d(0,40px,0)", opacity: "0" },
					"100%": { transform: "translate3d(0,0,0)", opacity: "1" }
				},
				"fade-in-scale": {
					"0%": { transform: "scale(0.95)", opacity: "0" },
					"100%": { transform: "scale(1)", opacity: "1" }
				},
				"float-gentle": {
					"0%, 100%": { transform: "translateY(0px)" },
					"50%": { transform: "translateY(-6px)" }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				"tilt-3d": "tilt-3d 6s ease-in-out infinite",
				"magnetic-hover": "magnetic-hover 0.3s ease-out forwards",
				"pulse-icon": "pulse-icon 2s ease-in-out infinite",
				"slide-up": "slide-up 0.6s ease-out forwards",
				"fade-in-scale": "fade-in-scale 0.5s ease-out forwards",
				"float-gentle": "float-gentle 4s ease-in-out infinite"
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
